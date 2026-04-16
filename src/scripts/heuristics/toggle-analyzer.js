import { describeTargetElement } from '../semantic-resolver.js';
import { HEURISTIC_THRESHOLDS } from './thresholds.js';
import { createHeuristicCandidate } from './candidate-builder.js';

function now() {
  return Date.now();
}

export class ToggleAnalyzer {
  constructor() {
    this.sessions = new Map();
  }

  finalizePending() {
    // Toggle sessions are closed by time; no extra work needed yet.
  }

  observeChange(event) {
    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
    if (!target) return;

    const type = String(target.getAttribute('type') || '').toLowerCase();
    if (type !== 'checkbox' && type !== 'radio') return;

    const descriptor = describeTargetElement(target);
    if (!descriptor.css_selector) return;

    const currentTime = now();
    const checked = Boolean(target.checked);
    let session = this.sessions.get(descriptor.css_selector);

    if (!session) {
      session = {
        target: descriptor,
        startedAt: currentTime,
        endedAt: currentTime,
        sequence: [checked],
        lastState: checked,
        emitted: false,
      };
      this.sessions.set(descriptor.css_selector, session);
      return;
    }

    session.endedAt = currentTime;
    if (session.lastState !== checked) {
      session.sequence.push(checked);
      session.lastState = checked;
    }
  }

  consumePending() {
    const candidates = [];
    for (const session of this.sessions.values()) {
      const toggleCount = Math.max(session.sequence.length - 1, 0);
      if (toggleCount >= HEURISTIC_THRESHOLDS.interaction_patterns.toggle_interaction.repeated_toggle.min_toggle_count && !session.emitted) {
        candidates.push(createHeuristicCandidate('repeated_toggle_candidate', session.target, session.startedAt, session.endedAt, {
          toggle_count: toggleCount,
          state_sequence: session.sequence,
        }));
        session.emitted = true;
        this.sessions.delete(session.target.css_selector);
      }
    }
    return candidates;
  }
}
