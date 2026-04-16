import { describeTargetElement } from './semantic-resolver.js';

function now() {
  return Date.now();
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

export class InputAnalyzer {
  constructor() {
    this.sessions = new Map();
    this.localHesitationCandidates = [];
  }

  finalizePending() {
    const currentTime = now();
    for (const session of this.sessions.values()) {
      if (session.active) {
        session.finalize(currentTime);
      }
    }
  }

  observeFocusIn(event) {
    this.trackInteraction(event, 'focusin');
    this.ensureSession(event.target).focusIn(now());
  }

  observeFocusOut(event) {
    this.trackInteraction(event, 'blur');
    const session = this.sessions.get(this.keyFor(event.target));
    if (session) session.blur(now());
  }

  observeInput(event) {
    this.trackInteraction(event, 'input');
    this.ensureSession(event.target).input(event);
  }

  observeClick(event) {
    this.trackInteraction(event, 'click');
  }

  observeChange(event) {
    this.trackInteraction(event, 'change');
    this.ensureSession(event.target).change(event);
  }

  consumePending() {
    this.finalizePending();

    const heuristicCandidates = [];
    for (const session of this.sessions.values()) {
      const candidate = session.toCandidate();
      if (candidate && !session.emitted) {
        heuristicCandidates.push(candidate);
        session.emitted = true;
        if (!session.active) {
          this.sessions.delete(session.selector);
        }
      }
    }

    heuristicCandidates.push(...this.localHesitationCandidates);

    this.localHesitationCandidates = [];

    return heuristicCandidates;
  }

  trackInteraction(event, kind) {
    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;

    const currentTime = now();
    const selector = describeTargetElement(target).css_selector;
    if (!selector) return;

    const session = this.ensureSession(target);
    if (session.lastInteractionAt && currentTime - session.lastInteractionAt > 2500) {
      this.localHesitationCandidates.push(createHeuristicCandidate('local_hesitation_candidate', session.target, session.lastInteractionAt, currentTime, {
        gap_ms: currentTime - session.lastInteractionAt,
        previous_kind: session.lastInteractionKind,
      }));
    }

    session.lastInteractionAt = currentTime;
    session.lastInteractionKind = kind;
  }

  ensureSession(element) {
    const selector = this.keyFor(element);
    if (!selector) {
      return {
        target: describeTargetElement(null),
        focusIn() {},
        blur() {},
        input() {},
        change() {},
        finalize() {},
        toCandidate() {
          return null;
        },
      };
    }

    let session = this.sessions.get(selector);
    if (!session) {
      const target = describeTargetElement(element);
      session = {
        target,
        selector,
        startedAt: null,
        endedAt: null,
        active: false,
        visits: 0,
        revisitCount: 0,
        revisionCount: 0,
        deleteCount: 0,
        insertCount: 0,
        focusStartedAt: null,
        lastInputAt: null,
        lastValueLength: null,
        firstInputAt: null,
        firstInputDelayMs: null,
        totalTimeMs: 0,
        changedWhileActive: false,
        abandoned: false,
        emitted: false,
        focusIn() {
          const currentTime = now();
          if (this.active === false && this.startedAt !== null) {
            this.revisitCount += 1;
          }
          if (this.startedAt === null) {
            this.startedAt = currentTime;
          }
          this.visits += 1;
          this.active = true;
          this.focusStartedAt = currentTime;
          this.endedAt = currentTime;
        },
        blur() {
          const currentTime = now();
          if (this.active && this.focusStartedAt !== null) {
            this.totalTimeMs += Math.max(currentTime - this.focusStartedAt, 0);
          }
          this.active = false;
          this.focusStartedAt = null;
          this.endedAt = currentTime;
          if (this.revisionCount === 0 && this.insertCount === 0 && this.deleteCount === 0) {
            this.abandoned = true;
          }
        },
        input(event) {
          const currentTime = now();
          if (this.firstInputAt === null) {
            this.firstInputAt = currentTime;
            if (this.focusStartedAt !== null) {
              this.firstInputDelayMs = currentTime - this.focusStartedAt;
            }
          }
          this.revisionCount += 1;
          this.endedAt = currentTime;
          this.lastInputAt = currentTime;
          this.lastValueLength = typeof event.target?.value === 'string' ? event.target.value.length : this.lastValueLength;
          if (event.inputType && String(event.inputType).startsWith('delete')) this.deleteCount += 1;
          if (event.inputType && String(event.inputType).startsWith('insert')) this.insertCount += 1;
        },
        change(event) {
          const currentTime = now();
          this.endedAt = currentTime;
          this.lastValueLength = typeof event.target?.value === 'string' ? event.target.value.length : this.lastValueLength;
        },
        finalize(currentTime) {
          if (this.active && this.focusStartedAt !== null) {
            this.totalTimeMs += Math.max(currentTime - this.focusStartedAt, 0);
            this.focusStartedAt = currentTime;
          }
          this.endedAt = currentTime;
        },
        toCandidate() {
          if (this.revisionCount < 2 && this.deleteCount === 0 && this.revisitCount === 0) return null;

          return createHeuristicCandidate('input_revision_candidate', this.target, this.startedAt || this.endedAt || now(), this.endedAt || now(), {
            revision_count: this.revisionCount,
            delete_count: this.deleteCount,
            revisit_count: this.revisitCount,
            time_total_ms: this.totalTimeMs,
            insert_count: this.insertCount,
            first_input_delay_ms: this.firstInputDelayMs,
            last_value_length: this.lastValueLength,
            visits: this.visits,
            abandoned: this.abandoned,
          });
        },
      };
      this.sessions.set(selector, session);
    }

    return session;
  }

  keyFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
    return describeTargetElement(element).css_selector;
  }
}
