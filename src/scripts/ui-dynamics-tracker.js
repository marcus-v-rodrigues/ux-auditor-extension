import { getCssSelector, isLikelyInlineError, isLikelyModal, isLikelyToast } from './semantic-resolver.js';

function now() {
  return Date.now();
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function shortSelectorList(selectors) {
  return Array.from(new Set(selectors)).slice(0, 10);
}

function classifyMutationTarget(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
  return {
    css_selector: getCssSelector(node),
    tagName: node.tagName.toLowerCase(),
    role: cleanText(node.getAttribute('role')) || null,
    className: cleanText(node.className) || null,
  };
}

export class UiDynamicsTracker {
  constructor() {
    this.pendingMutationWindows = [];
    this.pendingLayoutShiftCandidates = [];
    this.pendingFeedbackAppearances = [];
    this.currentWindow = null;
    this.windowTimer = null;
    this.resizeObserver = null;
    this.mutationObserver = null;
    this.observedTargets = new Set();
  }

  start() {
    this.mutationObserver = new MutationObserver((mutations) => {
      this.recordMutations(mutations);
    });
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const target = entry.target?.nodeType === Node.ELEMENT_NODE ? entry.target : null;
          if (!target) continue;
          const rect = target.getBoundingClientRect();
          this.pendingLayoutShiftCandidates.push({
            timestamp: now(),
            kind: 'resize_candidate',
            target: classifyMutationTarget(target),
            size: {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
          });
        }
      });
      this.resizeObserver.observe(document.documentElement);
    }
  }

  stop() {
    this.flushWindow();
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver = null;
  }

  recordMutations(mutations) {
    const timestamp = now();
    if (!this.currentWindow) {
      this.currentWindow = {
        started_at: timestamp,
        ended_at: timestamp,
        added_nodes: 0,
        removed_nodes: 0,
        attribute_changes: 0,
        text_changes: 0,
        selectors: [],
        kinds: [],
      };
    }

    for (const mutation of mutations) {
      this.currentWindow.ended_at = timestamp;
      if (mutation.type === 'childList') {
        this.currentWindow.added_nodes += mutation.addedNodes.length;
        this.currentWindow.removed_nodes += mutation.removedNodes.length;
        mutation.addedNodes.forEach((node) => this.inspectAddedNode(node));
        mutation.removedNodes.forEach((node) => {
          if (node?.nodeType === Node.ELEMENT_NODE) {
            const selector = getCssSelector(node);
            if (selector) this.currentWindow.selectors.push(selector);
          }
        });
      } else if (mutation.type === 'attributes') {
        this.currentWindow.attribute_changes += 1;
        const selector = getCssSelector(mutation.target);
        if (selector) this.currentWindow.selectors.push(selector);
      } else if (mutation.type === 'characterData') {
        this.currentWindow.text_changes += 1;
      }
    }

    this.scheduleFlush();
  }

  inspectAddedNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const selector = getCssSelector(node);
    if (selector) this.currentWindow.selectors.push(selector);

    if (isLikelyModal(node)) {
      this.currentWindow.kinds.push('modal');
      this.pendingFeedbackAppearances.push({
        timestamp: now(),
        kind: 'modal_open',
        target: classifyMutationTarget(node),
        message: cleanText(node.textContent).slice(0, 160) || 'Modal observado',
      });
    }

    if (isLikelyToast(node)) {
      this.currentWindow.kinds.push('toast');
      this.pendingFeedbackAppearances.push({
        timestamp: now(),
        kind: 'toast_visible',
        target: classifyMutationTarget(node),
        message: cleanText(node.textContent).slice(0, 160) || 'Toast observado',
      });
    }

    if (isLikelyInlineError(node)) {
      this.currentWindow.kinds.push('error');
      this.pendingFeedbackAppearances.push({
        timestamp: now(),
        kind: 'inline_error',
        target: classifyMutationTarget(node),
        message: cleanText(node.textContent).slice(0, 160) || 'Erro inline observado',
      });
    }

    Array.from(node.querySelectorAll?.('[role="alert"], [aria-live], .toast, .snackbar, .modal, .dialog, .error, [data-feedback]') ?? [])
      .slice(0, 10)
      .forEach((child) => this.inspectAddedNode(child));

    const ariaLive = cleanText(node.getAttribute('aria-live'));
    if (ariaLive) {
      this.currentWindow.kinds.push(`aria-live:${ariaLive}`);
      this.pendingFeedbackAppearances.push({
        timestamp: now(),
        kind: 'aria_live_feedback',
        target: classifyMutationTarget(node),
        message: cleanText(node.textContent).slice(0, 160),
        metadata: { aria_live: ariaLive },
      });
    }
  }

  scheduleFlush() {
    if (this.windowTimer) return;
    this.windowTimer = window.setTimeout(() => {
      this.flushWindow();
    }, 1200);
  }

  flushWindow() {
    if (this.windowTimer) {
      window.clearTimeout(this.windowTimer);
      this.windowTimer = null;
    }

    if (!this.currentWindow) return;

    const windowPayload = {
      timestamp: now(),
      started_at: this.currentWindow.started_at,
      ended_at: this.currentWindow.ended_at,
      added_nodes: this.currentWindow.added_nodes,
      removed_nodes: this.currentWindow.removed_nodes,
      attribute_changes: this.currentWindow.attribute_changes,
      text_changes: this.currentWindow.text_changes,
      selectors: shortSelectorList(this.currentWindow.selectors),
      kinds: shortSelectorList(this.currentWindow.kinds),
    };

    if (
      windowPayload.added_nodes > 0 ||
      windowPayload.removed_nodes > 0 ||
      windowPayload.attribute_changes > 0 ||
      windowPayload.text_changes > 0
    ) {
      this.pendingMutationWindows.push(windowPayload);
    }

    this.currentWindow = null;
  }

  consumePending() {
    this.flushWindow();
    return {
      ui_dynamics: {
        mutation_windows: this.pendingMutationWindows.splice(0),
        layout_shift_candidates: this.pendingLayoutShiftCandidates.splice(0),
        feedback_appearances: this.pendingFeedbackAppearances.splice(0),
      },
    };
  }
}
