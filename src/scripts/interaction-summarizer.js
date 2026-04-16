import { getCssSelector, isInteractiveElement } from './semantic-resolver.js';
import { shouldMaskSensitiveField } from './sensitive-masking.js';
import { HEURISTIC_THRESHOLDS } from './heuristics/thresholds.js';
import { PointerAnalyzer } from './heuristics/pointer-analyzer.js';
import { InputAnalyzer } from './heuristics/input-analyzer.js';
import { ToggleAnalyzer } from './heuristics/toggle-analyzer.js';
import { HeuristicAggregator } from './heuristics/heuristic-aggregator.js';

function now() {
  return Date.now();
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function createPoint(event) {
  return {
    x: Math.round(event.clientX),
    y: Math.round(event.clientY),
    t: now(),
  };
}

function distance(a, b) {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

function averageSpeed(points) {
  if (points.length < 2) return 0;
  let totalDistance = 0;
  let totalTime = 0;
  for (let index = 1; index < points.length; index += 1) {
    totalDistance += distance(points[index - 1], points[index]);
    totalTime += Math.max(points[index].t - points[index - 1].t, 1);
  }
  return totalTime ? totalDistance / totalTime : 0;
}

function zigZagScore(points) {
  if (points.length < 4) return 0;
  let directionChanges = 0;
  let lastVector = null;
  for (let index = 1; index < points.length; index += 1) {
    const vector = {
      x: points[index].x - points[index - 1].x,
      y: points[index].y - points[index - 1].y,
    };
    if (lastVector) {
      const lastSignX = Math.sign(lastVector.x);
      const lastSignY = Math.sign(lastVector.y);
      const signX = Math.sign(vector.x);
      const signY = Math.sign(vector.y);
      if ((lastSignX && signX && lastSignX !== signX) || (lastSignY && signY && lastSignY !== signY)) {
        directionChanges += 1;
      }
    }
    lastVector = vector;
  }
  return directionChanges;
}

function buildPointerSummary(segment) {
  const duration = segment.closedAt - segment.startedAt;
  return {
    timestamp: segment.closedAt,
    started_at: segment.startedAt,
    ended_at: segment.closedAt,
    target: segment.target,
    points: segment.points,
    duration_ms: duration,
    average_speed_px_per_ms: Number(averageSpeed(segment.points).toFixed(3)),
    pauses_over_500ms: segment.longPauses,
    revisits: segment.revisits,
    zigzag_score: zigZagScore(segment.points),
    click_count: segment.clickCount,
    dead_click_candidate: segment.deadClickCandidate,
    rage_click_candidate: segment.rageClickCandidate,
    hover_ms: segment.hoverMs,
  };
}

function deriveTargetMeta(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return {
      css_selector: null,
      tagName: null,
      role: null,
      labelText: null,
      name: null,
      type: null,
    };
  }

  return {
    css_selector: getCssSelector(element),
    tagName: element.tagName.toLowerCase(),
    role: cleanText(element.getAttribute('role')) || null,
    labelText: cleanText(element.getAttribute('aria-label') || element.getAttribute('placeholder') || '') || null,
    name: cleanText(element.getAttribute('name')) || null,
    type: cleanText(element.getAttribute('type')) || null,
  };
}

export class InteractionSummarizer {
  constructor() {
    this.pointerPaths = [];
    this.typingMetrics = new Map();
    this.focusFlow = [];
    this.scrollRegions = [];
    this.pendingMarkers = [];
    this.heuristicAggregator = new HeuristicAggregator();
    this.pointerAnalyzer = new PointerAnalyzer();
    this.inputAnalyzer = new InputAnalyzer();
    this.toggleAnalyzer = new ToggleAnalyzer();
    this.activePointerSegment = null;
    this.activeTypingBySelector = new Map();
    this.activeScrollRegion = null;
    this.lastPointerTarget = null;
    this.lastPointerClickAt = 0;
    this.lastFocusSelector = null;
    this.lastScrollAt = 0;
    this.visualOrderBySelector = new Map();
  }

  setSemanticSnapshot(semantics) {
    this.visualOrderBySelector.clear();
    semantics?.interactive_elements?.forEach((element, index) => {
      if (element?.css_selector) this.visualOrderBySelector.set(element.css_selector, index);
    });
  }

  emitMarker(type, target, message = '', metadata = {}) {
    this.pendingMarkers.push({
      kind: 'ux_marker',
      timestamp: now(),
      type,
      target: target || {},
      message,
      metadata,
    });
  }

  observePointerMove(event) {
    this.pointerAnalyzer.observePointerMove(event);

    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    const meta = deriveTargetMeta(target);
    const currentTime = now();

    if (!this.activePointerSegment || currentTime - this.activePointerSegment.lastAt > HEURISTIC_THRESHOLDS.session_windows.pointer_segment_gap_ms || this.activePointerSegment.target.css_selector !== meta.css_selector) {
      this.closePointerSegment(currentTime);
      this.activePointerSegment = {
        startedAt: currentTime,
        lastAt: currentTime,
        points: [createPoint(event)],
        target: meta,
        clickCount: 0,
        longPauses: 0,
        revisits: 0,
        hoverMs: 0,
        deadClickCandidate: false,
        rageClickCandidate: false,
      };
      this.lastPointerTarget = meta.css_selector;
      return;
    }

    const point = createPoint(event);
    const lastPoint = this.activePointerSegment.points[this.activePointerSegment.points.length - 1];
    const gap = point.t - lastPoint.t;
    if (gap >= HEURISTIC_THRESHOLDS.session_windows.pointer_long_pause_ms) this.activePointerSegment.longPauses += 1;
    if (gap >= HEURISTIC_THRESHOLDS.session_windows.pointer_movement_gap_ms || distance(lastPoint, point) >= HEURISTIC_THRESHOLDS.session_windows.pointer_movement_distance_px) {
      this.activePointerSegment.points.push(point);
    }
    this.activePointerSegment.lastAt = currentTime;
    this.activePointerSegment.hoverMs = currentTime - this.activePointerSegment.startedAt;
  }

  observePointerDown(event) {
    this.pointerAnalyzer.observePointerDown(event);

    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    const meta = deriveTargetMeta(target);
    const currentTime = now();

    if (!this.activePointerSegment) {
      this.activePointerSegment = {
        startedAt: currentTime,
        lastAt: currentTime,
        points: [createPoint(event)],
        target: meta,
        clickCount: 0,
        longPauses: 0,
        revisits: 0,
        hoverMs: 0,
        deadClickCandidate: false,
        rageClickCandidate: false,
      };
    }

    this.activePointerSegment.clickCount += 1;
    if (meta.css_selector && meta.css_selector === this.lastPointerTarget) {
      this.activePointerSegment.revisits += 1;
    }
    this.lastPointerClickAt = currentTime;
  }

  observeClick(event) {
    this.pointerAnalyzer.observeClick(event);
    this.inputAnalyzer.observeClick(event);

    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    const meta = deriveTargetMeta(target);
    const currentTime = now();
    const recentClicks = this.activePointerSegment?.clickCount ?? 0;

    if (recentClicks >= HEURISTIC_THRESHOLDS.interaction_patterns.pointer_motion.erratic_motion.rage_click_min_clicks && currentTime - this.activePointerSegment.startedAt <= HEURISTIC_THRESHOLDS.session_windows.rage_click_window_ms) {
      this.activePointerSegment.rageClickCandidate = true;
      this.emitMarker('rage_click_candidate', meta, 'Sequência curta de cliques repetidos', {
        clickCount: recentClicks,
      });
    }

    if (!isInteractiveElement(target) && !meta.role) {
      this.activePointerSegment.deadClickCandidate = true;
    }
  }

  observeHover(event) {
    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;
    const meta = deriveTargetMeta(target);
    if (!isInteractiveElement(target)) return;
    this.emitMarker('hover_prolonged_candidate', meta, 'Permanência prolongada sobre alvo interativo', {
      hoverDurationMs: this.activePointerSegment?.hoverMs ?? 0,
    });
  }

  observeFocusIn(event) {
    this.inputAnalyzer.observeFocusIn(event);

    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;

    const selector = getCssSelector(target);
    const currentTime = now();
    const visualOrder = this.visualOrderBySelector.get(selector);
    const previousOrder = this.lastFocusSelector ? this.visualOrderBySelector.get(this.lastFocusSelector) : undefined;
    const outOfOrder = typeof visualOrder === 'number' && typeof previousOrder === 'number' ? visualOrder < previousOrder : false;

    this.focusFlow.push({
      timestamp: currentTime,
      type: 'focusin',
      target: {
        css_selector: selector,
        tagName: target.tagName.toLowerCase(),
        role: cleanText(target.getAttribute('role')) || null,
      },
      visual_order: visualOrder ?? null,
      out_of_order: outOfOrder,
    });
    this.lastFocusSelector = selector;
  }

  observeFocusOut(event) {
    this.inputAnalyzer.observeFocusOut(event);

    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;

    this.focusFlow.push({
      timestamp: now(),
      type: 'focusout',
      target: {
        css_selector: getCssSelector(target),
        tagName: target.tagName.toLowerCase(),
        role: cleanText(target.getAttribute('role')) || null,
      },
    });
  }

  observeInput(event) {
    this.pointerAnalyzer.observeInput(event);
    this.inputAnalyzer.observeInput(event);

    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;

    const selector = getCssSelector(target);
    const currentTime = now();
    const valueLength = typeof target.value === 'string' ? target.value.length : null;
    const sensitive = shouldMaskSensitiveField(target, target.value);
    let metric = this.typingMetrics.get(selector);

    if (!metric) {
      metric = {
        target: {
          css_selector: selector,
          tagName: target.tagName.toLowerCase(),
          role: cleanText(target.getAttribute('role')) || null,
          inputType: cleanText(target.getAttribute('type')) || null,
          formId: target.closest('form')?.id || null,
        },
        focus_started_at: currentTime,
        first_input_at: null,
        ended_at: currentTime,
        first_input_delay_ms: null,
        revisions: 0,
        inserts: 0,
        deletes: 0,
        value_length: null,
        abandoned: false,
        reopened: 0,
        masked: sensitive,
      };
      this.typingMetrics.set(selector, metric);
    }

    if (!metric.first_input_at) {
      metric.first_input_at = currentTime;
      metric.first_input_delay_ms = currentTime - metric.focus_started_at;
    }

    metric.ended_at = currentTime;
    metric.value_length = valueLength;
    metric.masked = metric.masked || sensitive;
    metric.revisions += 1;
    metric.inserts += event.inputType && String(event.inputType).startsWith('insert') ? 1 : 0;
    metric.deletes += event.inputType && String(event.inputType).startsWith('delete') ? 1 : 0;
  }

  observeChange(event) {
    this.pointerAnalyzer.observeChange(event);
    this.toggleAnalyzer.observeChange(event);
    this.inputAnalyzer.observeChange(event);
  }

  observeBlur(event) {
    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;

    const selector = getCssSelector(target);
    const metric = this.typingMetrics.get(selector);
    if (metric && !metric.first_input_at) {
      metric.abandoned = true;
    }

    if (metric) {
      metric.ended_at = now();
    }
  }

  observeScroll(event) {
    const currentTime = now();
    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : document.scrollingElement || document.documentElement;
    const selector = getCssSelector(target);
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    if (!this.activeScrollRegion || currentTime - this.activeScrollRegion.lastAt > HEURISTIC_THRESHOLDS.session_windows.hover_region_gap_ms) {
      this.closeScrollRegion(currentTime);
      this.activeScrollRegion = {
        startedAt: currentTime,
        lastAt: currentTime,
        selector,
        startX: scrollX,
        startY: scrollY,
        endX: scrollX,
        endY: scrollY,
        samples: 1,
      };
      return;
    }

    this.activeScrollRegion.lastAt = currentTime;
    this.activeScrollRegion.endX = scrollX;
    this.activeScrollRegion.endY = scrollY;
    this.activeScrollRegion.samples += 1;
  }

  finalizePointerPath() {
    if (!this.activePointerSegment) return;
    this.pointerPaths.push(buildPointerSummary({
      ...this.activePointerSegment,
      closedAt: now(),
    }));
    this.activePointerSegment = null;
  }

  closePointerSegment(closedAt = now()) {
    if (!this.activePointerSegment || this.activePointerSegment.points.length < 2) return;
    this.pointerPaths.push(buildPointerSummary({
      ...this.activePointerSegment,
      closedAt,
    }));
    this.activePointerSegment = null;
  }

  closeScrollRegion(closedAt = now()) {
    if (!this.activeScrollRegion) return;
    this.scrollRegions.push({
      timestamp: closedAt,
      started_at: this.activeScrollRegion.startedAt,
      ended_at: closedAt,
      selector: this.activeScrollRegion.selector,
      start: {
        x: this.activeScrollRegion.startX,
        y: this.activeScrollRegion.startY,
      },
      end: {
        x: this.activeScrollRegion.endX,
        y: this.activeScrollRegion.endY,
      },
      samples: this.activeScrollRegion.samples,
      deltaY: this.activeScrollRegion.endY - this.activeScrollRegion.startY,
    });
    this.activeScrollRegion = null;
  }

  observeValidationAttempt(target, message, metadata = {}) {
    const meta = deriveTargetMeta(target);
    this.emitMarker('form_validation_error', meta, message, metadata);
  }

  observeSubmit(target) {
    const meta = deriveTargetMeta(target);
    this.emitMarker('form_submit_attempt', meta, 'Submissão de formulário observada');
  }

  observeRouteChange(url) {
    this.emitMarker('spa_route_change', {
      css_selector: null,
      tagName: null,
      role: null,
    }, 'Mudança de rota observada', { url });
  }

  observeModal(target) {
    this.emitMarker('modal_open', deriveTargetMeta(target), 'Modal observado');
  }

  observeToast(target) {
    this.emitMarker('toast_visible', deriveTargetMeta(target), 'Toast observado');
  }

  observeAlert(target, message) {
    this.emitMarker('alert_visible', deriveTargetMeta(target), message || 'Alert observado');
  }

  finalizePending() {
    this.inputAnalyzer.finalizePending();
    this.toggleAnalyzer.finalizePending();
  }

  consumePending() {
    this.closePointerSegment();
    this.closeScrollRegion();

    const heuristicCandidates = [];
    heuristicCandidates.push(...this.pointerAnalyzer.consumePending());
    heuristicCandidates.push(...this.inputAnalyzer.consumePending());
    heuristicCandidates.push(...this.toggleAnalyzer.consumePending());
    this.heuristicAggregator.addMany(heuristicCandidates);

    const typingMetricsByElement = Array.from(this.typingMetrics.values()).map((metric) => ({
      ...metric,
      duration_ms: Math.max((metric.ended_at || now()) - metric.focus_started_at, 0),
    }));

    const fragment = {
      interaction_summary: {
        pointer_paths: this.pointerPaths.splice(0),
        typing_metrics_by_element: typingMetricsByElement,
        focus_flow: this.focusFlow.splice(0),
        scroll_regions: this.scrollRegions.splice(0),
        heuristic_candidates: this.heuristicAggregator.consume(),
      },
      ux_markers: this.pendingMarkers.splice(0),
    };

    this.typingMetrics.clear();
    return fragment;
  }
}
