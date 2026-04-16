/* global chrome */
import { record } from 'rrweb';
import { createCaptureConfig } from './capture-config.js';
import { createMaskInputFn, shouldMaskSensitiveField } from './sensitive-masking.js';
import { collectPageSemantics, getCssSelector, isLikelyModal, isLikelyToast } from './semantic-resolver.js';
import { InteractionSummarizer } from './interaction-summarizer.js';
import { UiDynamicsTracker } from './ui-dynamics-tracker.js';
import { runAxePreliminaryAnalysis } from './axe-runner.js';
import { createEmptySessionDraft, mergeSessionFragment } from './session-schema.js';
import { buildExportPayload } from './payload-builder.js';

let stopFn = null;
let eventBuffer = [];
let pendingFragment = createEmptySessionDraft();
let sessionDraft = createEmptySessionDraft();
let flushTimer = null;
let flushInFlight = false;
let sessionStarted = false;
let initialCheckpointDone = false;
const checkpointTasks = new Set();

const captureConfig = createCaptureConfig();
let interactionSummarizer = new InteractionSummarizer();
let uiDynamicsTracker = new UiDynamicsTracker();

console.log('[UX Auditor] Content Script carregado.');

chrome.runtime.sendMessage({ action: 'CHECK_STATUS' }, (response) => {
  if (response && response.isRecording) {
    startRecording();
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'START_RRWEB') {
    startRecording();
  } else if (request.action === 'STOP_AND_FLUSH') {
    stopRecording(() => {
      chrome.runtime.sendMessage({ action: 'FLUSH_DONE' });
    });
  } else if (request.action === 'DOWNLOAD_FULL_SESSION') {
    saveData(request.session || request.payload || request.events);
  } else if (request.action === 'SESSION_META') {
    mergeSessionFragment(sessionDraft, { session_meta: request.sessionMeta });
  }
});

function startRecording() {
  if (stopFn || sessionStarted) return;
  sessionStarted = true;

  interactionSummarizer = new InteractionSummarizer();
  uiDynamicsTracker = new UiDynamicsTracker();

  sessionDraft = createEmptySessionDraft({
    session_meta: {
      session_id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
      started_at: Date.now(),
      page_url: location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
    },
    capture_config: captureConfig,
  });

  pendingFragment = createEmptySessionDraft();
  eventBuffer = [];

  chrome.runtime.sendMessage({
    action: 'SESSION_META',
    sessionMeta: sessionDraft.session_meta,
  });

  bindPageObservers();
  uiDynamicsTracker.start();

  stopFn = record({
    emit(event) {
      eventBuffer.push(event);
      if (eventBuffer.length >= 50) {
        flushPending();
      }
    },
    maskAllInputs: false,
    maskInputOptions: {
      password: true,
    },
    maskInputFn: createMaskInputFn(() => getCurrentFieldContext()),
    sampling: {
      // 100ms reduz o volume sem destruir a utilidade cinemática do replay.
      scroll: captureConfig.rrweb.sampling.scroll,
      mousemove: captureConfig.rrweb.sampling.mousemove,
    },
    // Snapshots completos menos frequentes mantêm reconstrução e aliviam o payload.
    checkoutEveryNth: captureConfig.rrweb.checkoutEveryNth,
  });

  void captureCheckpoint('session_start');

  window.addEventListener('beforeunload', handleUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

function stopRecording(onAfterFlush) {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }

  window.removeEventListener('beforeunload', handleUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  uiDynamicsTracker.stop();

  Promise.allSettled(Array.from(checkpointTasks)).finally(() => {
    finalizeSessionState();
    flushPending(() => {
      if (onAfterFlush) onAfterFlush();
    }, true);
    sessionStarted = false;
  });
}

function handleUnload() {
  finalizeSessionState();
  flushPending();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    flushPending();
  }
}

function bindPageObservers() {
  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('input', onInput, true);
  document.addEventListener('change', onChange, true);
  document.addEventListener('scroll', onScroll, true);
  document.addEventListener('submit', onSubmit, true);
  window.addEventListener('hashchange', onRouteChange, true);
  window.addEventListener('popstate', onRouteChange, true);
  patchHistory();
}

function patchHistory() {
  if (window.__uxAuditorHistoryPatched) return;
  window.__uxAuditorHistoryPatched = true;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function pushState(...args) {
    const result = originalPushState(...args);
    onRouteChange();
    return result;
  };

  history.replaceState = function replaceState(...args) {
    const result = originalReplaceState(...args);
    onRouteChange();
    return result;
  };
}

function onPointerMove(event) {
  interactionSummarizer.observePointerMove(event);
}

function onPointerDown(event) {
  interactionSummarizer.observePointerDown(event);
}

function onPointerOver(event) {
  interactionSummarizer.observeHover(event);
}

function onClick(event) {
  interactionSummarizer.observeClick(event);

  const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
  if (target && isLikelyModal(target)) {
    interactionSummarizer.observeModal(target);
  }

  if (target && isLikelyToast(target)) {
    interactionSummarizer.observeToast(target);
  }
}

function onFocusIn(event) {
  interactionSummarizer.observeFocusIn(event);
}

function onFocusOut(event) {
  interactionSummarizer.observeFocusOut(event);
}

function onInput(event) {
  interactionSummarizer.observeInput(event);

  const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null;
  if (target && shouldMaskSensitiveField(target, target.value)) {
    interactionSummarizer.emitMarker('sensitive_input_observed', {
      css_selector: getCssSelector(target),
      tagName: target.tagName.toLowerCase(),
      role: target.getAttribute('role') || null,
    }, 'Campo sensível observado', {
      inputType: target.getAttribute('type') || null,
    });
  }
}

function onChange(event) {
  interactionSummarizer.observeChange(event);
}

function onScroll(event) {
  interactionSummarizer.observeScroll(event);
}

function onSubmit(event) {
  interactionSummarizer.observeSubmit(event.target);
  void captureCheckpoint('form_submit', {
    form_selector: getCssSelector(event.target),
  });
}

function onRouteChange() {
  interactionSummarizer.observeRouteChange(location.href);
  void captureCheckpoint('route_change', {
    url: location.href,
  });
}

function getCurrentFieldContext() {
  const active = document.activeElement;
  if (!active || active.nodeType !== Node.ELEMENT_NODE) return null;

  return {
    name: active.getAttribute('name'),
    id: active.id,
    placeholder: active.getAttribute('placeholder'),
    ariaLabel: active.getAttribute('aria-label'),
    tagName: active.tagName.toLowerCase(),
    type: active.getAttribute('type'),
  };
}

async function captureCheckpoint(trigger, context = {}) {
  if (!sessionStarted) return;

  const task = (async () => {
    try {
      const semantics = collectPageSemantics(document);
      interactionSummarizer.setSemanticSnapshot(semantics);

      const fragment = {
        page_semantics: semantics,
        heuristic_evidence: deriveHeuristicEvidence(semantics),
      };

      const axeRun = await runAxePreliminaryAnalysis({ trigger, context });
      if (axeRun) {
        fragment.axe_preliminary_analysis = { runs: [axeRun] };
      }

      queueFragment(fragment);
      if (trigger === 'session_start' && !initialCheckpointDone) {
        initialCheckpointDone = true;
      }
    } catch (error) {
      console.warn('[UX Auditor] Falha ao gerar checkpoint:', error);
      queueFragment({
        heuristic_evidence: {
          accessibility: [],
          usability: [
            {
              timestamp: Date.now(),
              kind: 'checkpoint_failure',
              message: 'Falha ao gerar checkpoint analítico.',
              evidence: {
                trigger,
                error: String(error?.message || error),
              },
            },
          ],
        },
      });
    }
  })();

  checkpointTasks.add(task);
  task.finally(() => checkpointTasks.delete(task));
  return task;
}

function deriveHeuristicEvidence(semantics) {
  const accessibility = [];
  const usability = [];

  if (!semantics.landmarks.length) {
    accessibility.push({
      timestamp: Date.now(),
      kind: 'missing_landmarks',
      message: 'Nenhum landmark visível foi observado no snapshot semântico.',
      evidence: {
        landmarks_observed: 0,
      },
    });
  }

  const placeholderOnlyFields = semantics.interactive_elements.filter(
    (element) =>
      element.tagName === 'input' &&
      !element.labelText &&
      element.placeholder &&
      !element.accessibleName,
  );

  if (placeholderOnlyFields.length) {
    accessibility.push({
      timestamp: Date.now(),
      kind: 'placeholder_dependent_fields',
      message: 'Campos dependem de placeholder como contexto primário.',
      evidence: {
        count: placeholderOnlyFields.length,
        selectors: placeholderOnlyFields.slice(0, 10).map((element) => element.css_selector),
      },
    });
  }

  const smallTargets = semantics.interactive_elements.filter(
    (element) => element.boundingBox.width > 0 && element.boundingBox.height > 0 && (element.boundingBox.width < 44 || element.boundingBox.height < 44),
  );

  if (smallTargets.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'small_click_target',
      message: 'Alvos interativos abaixo do tamanho recomendado foram observados.',
      evidence: {
        count: smallTargets.length,
        selectors: smallTargets.slice(0, 10).map((element) => element.css_selector),
      },
    });
  }

  return { accessibility, usability };
}

function queueFragment(fragment) {
  mergeSessionFragment(pendingFragment, fragment);
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushPending();
  }, 1200);
}

function flushPending(callback, force = false) {
  if (flushInFlight && !force) {
    if (callback) callback();
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const rrwebEvents = eventBuffer.splice(0);
  const interactionFragment = interactionSummarizer.consumePending();
  const uiFragment = uiDynamicsTracker.consumePending();

  if (rrwebEvents.length) {
    mergeSessionFragment(pendingFragment, {
      rrweb: { events: rrwebEvents },
    });
  }

  mergeSessionFragment(pendingFragment, interactionFragment);
  mergeSessionFragment(pendingFragment, uiFragment);
  mergeSessionFragment(pendingFragment, deriveBehavioralEvidence(interactionFragment, uiFragment));

  if (hasPendingFragment()) {
    flushInFlight = true;
    chrome.runtime.sendMessage(
      {
        action: 'SESSION_FRAGMENT',
        fragment: pendingFragment,
      },
      () => {
        sessionDraft = mergeSessionFragment(sessionDraft, pendingFragment);
        pendingFragment = createEmptySessionDraft();
        flushInFlight = false;
        if (callback) callback();
      },
    );
    return;
  }

  if (callback) callback();
}

function hasPendingFragment() {
  return (
    pendingFragment.rrweb.events.length > 0 ||
    pendingFragment.axe_preliminary_analysis.runs.length > 0 ||
    pendingFragment.page_semantics.landmarks.length > 0 ||
    pendingFragment.page_semantics.interactive_elements.length > 0 ||
    pendingFragment.page_semantics.form_groups.length > 0 ||
    pendingFragment.interaction_summary.pointer_paths.length > 0 ||
    pendingFragment.interaction_summary.typing_metrics_by_element.length > 0 ||
    pendingFragment.interaction_summary.focus_flow.length > 0 ||
    pendingFragment.interaction_summary.scroll_regions.length > 0 ||
    pendingFragment.interaction_summary.heuristic_candidates.length > 0 ||
    pendingFragment.ui_dynamics.mutation_windows.length > 0 ||
    pendingFragment.ui_dynamics.layout_shift_candidates.length > 0 ||
    pendingFragment.ui_dynamics.feedback_appearances.length > 0 ||
    pendingFragment.heuristic_evidence.accessibility.length > 0 ||
    pendingFragment.heuristic_evidence.usability.length > 0 ||
    pendingFragment.ux_markers.length > 0
  );
}

function finalizeSessionState() {
  sessionDraft.session_meta.ended_at = Date.now();
  interactionSummarizer.finalizePending();
  mergeSessionFragment(pendingFragment, interactionSummarizer.consumePending());
  mergeSessionFragment(pendingFragment, uiDynamicsTracker.consumePending());
}

function deriveBehavioralEvidence(interactionFragment, uiFragment) {
  const accessibility = [];
  const usability = [];

  const pointerPaths = interactionFragment.interaction_summary?.pointer_paths || [];
  const typingMetrics = interactionFragment.interaction_summary?.typing_metrics_by_element || [];
  const focusFlow = interactionFragment.interaction_summary?.focus_flow || [];
  const mutationWindows = uiFragment.ui_dynamics?.mutation_windows || [];
  const feedbackAppearances = uiFragment.ui_dynamics?.feedback_appearances || [];

  const rageClicks = pointerPaths.filter((path) => path.rage_click_candidate);
  if (rageClicks.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'rage_click_candidate',
      message: 'Sequências curtas de cliques repetidos foram observadas.',
      evidence: {
        count: rageClicks.length,
        selectors: rageClicks.slice(0, 10).map((path) => path.target?.css_selector).filter(Boolean),
      },
    });
  }

  const deadClicks = pointerPaths.filter((path) => path.dead_click_candidate);
  if (deadClicks.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'dead_click_candidate',
      message: 'Cliques em alvos sem resposta aparente foram observados.',
      evidence: {
        count: deadClicks.length,
        selectors: deadClicks.slice(0, 10).map((path) => path.target?.css_selector).filter(Boolean),
      },
    });
  }

  const abandonedFields = typingMetrics.filter((metric) => metric.abandoned);
  if (abandonedFields.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'field_abandonment',
      message: 'Campos com entrada iniciada e saída sem conclusão foram observados.',
      evidence: {
        count: abandonedFields.length,
        selectors: abandonedFields.slice(0, 10).map((metric) => metric.target?.css_selector).filter(Boolean),
      },
    });
  }

  const outOfOrderFocus = focusFlow.filter((step) => step.out_of_order);
  if (outOfOrderFocus.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'out_of_order_focus',
      message: 'Saltos de foco fora da ordem visual aproximada foram observados.',
      evidence: {
        count: outOfOrderFocus.length,
      },
    });
  }

  const burstWindows = mutationWindows.filter((window) => window.added_nodes + window.removed_nodes >= 20);
  if (burstWindows.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'structural_burst',
      message: 'Janelas com mudança estrutural brusca foram observadas.',
      evidence: {
        count: burstWindows.length,
      },
    });
  }

  if (feedbackAppearances.length) {
    usability.push({
      timestamp: Date.now(),
      kind: 'feedback_appearance',
      message: 'Feedback visual após interação foi observado.',
      evidence: {
        count: feedbackAppearances.length,
        kinds: feedbackAppearances.slice(0, 10).map((item) => item.kind),
      },
    });
  }

  return { accessibility, usability };
}

function saveData(payload) {
  const session = buildExportPayload(payload);
  if (!session) {
    alert('Nenhum dado gravado.');
    return;
  }

  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ux-session-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
