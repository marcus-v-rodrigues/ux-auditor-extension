import { describeTargetElement } from './semantic-resolver.js';

function now() {
  return Date.now();
}

function pointFromEvent(event) {
  return {
    x: Math.round(event.clientX || 0),
    y: Math.round(event.clientY || 0),
    t: now(),
    target: describeTargetElement(event.target),
  };
}

function distance(a, b) {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return mean(values.map((value) => (value - avg) ** 2));
}

function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function normalizeAngleDelta(delta) {
  let value = delta;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function createHeuristicCandidate(type, target, startedAt, endedAt, metrics) {
  return {
    kind: 'heuristic_candidate',
    type,
    timestamp_start: startedAt,
    timestamp_end: endedAt,
    target,
    metrics,
  };
}

export class PointerAnalyzer {
  constructor() {
    this.motionSegment = null;
    this.clickBurst = null;
    this.candidates = [];
  }

  observePointerMove(event) {
    const point = pointFromEvent(event);
    const target = describeTargetElement(event.target);
    const selector = target.css_selector;

    if (!this.motionSegment) {
      this.motionSegment = {
        startedAt: point.t,
        lastAt: point.t,
        points: [point],
        selectors: selector ? new Map([[selector, 1]]) : new Map(),
        targets: selector ? new Map([[selector, target]]) : new Map(),
        actionCount: 0,
      };
      return;
    }

    const gap = point.t - this.motionSegment.lastAt;
    if (gap > 700) {
      this.finalizeMotionSegment(this.motionSegment.lastAt);
      this.motionSegment = {
        startedAt: point.t,
        lastAt: point.t,
        points: [point],
        selectors: selector ? new Map([[selector, 1]]) : new Map(),
        targets: selector ? new Map([[selector, target]]) : new Map(),
        actionCount: 0,
      };
      return;
    }

    this.motionSegment.points.push(point);
    this.motionSegment.lastAt = point.t;
    if (selector) {
      this.motionSegment.selectors.set(selector, (this.motionSegment.selectors.get(selector) || 0) + 1);
      this.motionSegment.targets.set(selector, target);
    }
  }

  observePointerDown(event) {
    this.updateClickBurst(event);
  }

  observeClick(event) {
    this.registerAction(event, 'click');
    const target = describeTargetElement(event.target);

    if (this.clickBurst && this.clickBurst.selector === target.css_selector) {
      this.clickBurst.count += 1;
      this.clickBurst.lastAt = now();
      this.clickBurst.states.push(Boolean(event.target?.checked));
      if (this.clickBurst.count >= 3 && !this.clickBurst.rageEmitted) {
        this.clickBurst.rageEmitted = true;
      }
    } else {
      this.updateClickBurst(event);
    }
  }

  observeInput(event) {
    this.registerAction(event, 'input');
  }

  observeChange(event) {
    this.registerAction(event, 'change');
  }

  finalize() {
    if (this.motionSegment) {
      this.finalizeMotionSegment(now());
      this.motionSegment = null;
    }
  }

  consumePending() {
    this.finalize();
    const candidates = this.candidates.splice(0);
    return candidates;
  }

  registerAction(event, kind) {
    if (!this.motionSegment) return;
    this.motionSegment.actionCount += 1;
    this.motionSegment.lastActionKind = kind;
    this.motionSegment.lastActionAt = now();
    this.motionSegment.lastActionTarget = describeTargetElement(event.target);
  }

  updateClickBurst(event) {
    const target = describeTargetElement(event.target);
    const currentTime = now();

    if (!target.css_selector) return;

    if (!this.clickBurst || currentTime - this.clickBurst.lastAt > 1200 || this.clickBurst.selector !== target.css_selector) {
      this.clickBurst = {
        startedAt: currentTime,
        lastAt: currentTime,
        selector: target.css_selector,
        target,
        count: 1,
        states: [Boolean(event.target?.checked)],
        rageEmitted: false,
      };
      return;
    }

    this.clickBurst.count += 1;
    this.clickBurst.lastAt = currentTime;
    this.clickBurst.states.push(Boolean(event.target?.checked));
  }

  finalizeMotionSegment(closedAt) {
    const segment = this.motionSegment;
    if (!segment || segment.points.length < 2) return;

    const points = segment.points;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const duration = closedAt - segment.startedAt;
    const totalDistance = points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
    const straightDistance = distance(points[0], points[points.length - 1]);
    const efficiency = totalDistance > 0 ? straightDistance / totalDistance : 0;
    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);
    const boundingArea = Math.max(xRange, 0) * Math.max(yRange, 0);
    const positionMean = {
      x: Math.round(mean(xs)),
      y: Math.round(mean(ys)),
    };

    const angles = [];
    for (let index = 1; index < points.length; index += 1) {
      angles.push(angleBetween(points[index - 1], points[index]));
    }
    const angleDeltas = [];
    for (let index = 1; index < angles.length; index += 1) {
      angleDeltas.push(normalizeAngleDelta(angles[index] - angles[index - 1]));
    }

    const directionChanges = angleDeltas.filter((delta) => Math.abs(delta) > Math.PI / 4).length;
    const targetEntries = Array.from(segment.targets.entries());
    const dominantEntry = targetEntries.sort((a, b) => b[1] - a[1])[0];
    const dominantTarget = dominantEntry ? dominantEntry[1] : describeTargetElement(null);
    const moveCount = points.length;
    const movementDensity = duration > 0 ? moveCount / (duration / 1000) : 0;
    const angularVariance = variance(angleDeltas);
    const actionCount = segment.actionCount;
    const pathEfficiency = Number(efficiency.toFixed(3));
    const totalDistanceRounded = Math.round(totalDistance);
    const startTarget = dominantTarget?.css_selector ? dominantTarget : describeTargetElement(points[0].target || null);

    this.candidates.push(
      ...this.buildHoverCandidate({
        segment,
        closedAt,
        target: startTarget,
        duration,
        xRange,
        yRange,
        positionMean,
      }),
      ...this.buildVisualSearchCandidate({
        closedAt,
        target: startTarget,
        duration,
        moveCount,
        movementDensity,
        actionCount,
        boundingArea,
        totalDistance: totalDistanceRounded,
      }),
      ...this.buildErraticCandidate({
        closedAt,
        target: startTarget,
        duration,
        moveCount,
        pathEfficiency,
        directionChanges,
        angularVariance,
        totalDistance: totalDistanceRounded,
      }),
    );
  }

  buildHoverCandidate({ segment, closedAt, target, duration, xRange, yRange, positionMean }) {
    const spread = Math.max(xRange, yRange);
    if (duration < 1500 || spread > 15 || segment.actionCount > 0) return [];

    return [
      createHeuristicCandidate('hover_prolonged_candidate', target, segment.startedAt, closedAt, {
        duration_ms: duration,
        spread_px: Math.round(spread),
        bounding_approx: {
          x: Math.min(...segment.points.map((point) => point.x)),
          y: Math.min(...segment.points.map((point) => point.y)),
          width: Math.round(xRange),
          height: Math.round(yRange),
        },
        position_mean: positionMean,
        movement_count: segment.points.length,
      }),
    ];
  }

  buildVisualSearchCandidate({ closedAt, target, duration, moveCount, movementDensity, actionCount, boundingArea, totalDistance }) {
    if (duration < 3000 || moveCount < 12 || actionCount > 1 || movementDensity < 4) return [];

    return [
      createHeuristicCandidate('visual_search_burst_candidate', target, closedAt - duration, closedAt, {
        duration_ms: duration,
        movement_count: moveCount,
        actions_in_interval: actionCount,
        movement_density_per_s: Number(movementDensity.toFixed(2)),
        area_traversed_px2: Math.round(boundingArea),
        path_length_px: totalDistance,
      }),
    ];
  }

  buildErraticCandidate({ closedAt, target, duration, moveCount, pathEfficiency, directionChanges, angularVariance, totalDistance }) {
    if (duration < 1000 || moveCount < 6 || pathEfficiency > 0.7 || directionChanges < 4) return [];

    return [
      createHeuristicCandidate('erratic_motion_candidate', target, closedAt - duration, closedAt, {
        duration_ms: duration,
        movement_count: moveCount,
        path_efficiency: pathEfficiency,
        direction_changes: directionChanges,
        angular_variance: Number(angularVariance.toFixed(4)),
        path_length_px: totalDistance,
      }),
    ];
  }
}
