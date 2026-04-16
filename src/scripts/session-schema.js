import { createCaptureConfig as sharedCaptureConfig } from './capture-config.js';

export function createCaptureConfig() {
  return sharedCaptureConfig();
}

export function createPrivacyState() {
  return {
    masking_mode: 'selective',
    sensitive_rules_applied: [
      'password',
      'email',
      'telephone',
      'cpf',
      'document',
      'credit_card',
    ],
    consent_mode: 'research',
  };
}

function hasMeaningfulSessionMeta(sessionMeta) {
  if (!sessionMeta || typeof sessionMeta !== 'object') return false;

  return Object.values(sessionMeta).some((value) => value !== null && value !== undefined);
}

export function createEmptySessionDraft(overrides = {}) {
  return {
    session_meta: {
      session_id: null,
      started_at: null,
      ended_at: null,
      page_url: null,
      page_title: null,
      user_agent: null,
      ...overrides.session_meta,
    },
    privacy: overrides.privacy ?? createPrivacyState(),
    capture_config: overrides.capture_config ?? createCaptureConfig(),
    rrweb: {
      events: [],
    },
    axe_preliminary_analysis: {
      runs: [],
    },
    page_semantics: {
      landmarks: [],
      interactive_elements: [],
      form_groups: [],
    },
    interaction_summary: {
      pointer_paths: [],
      typing_metrics_by_element: [],
      focus_flow: [],
      scroll_regions: [],
      heuristic_candidates: [],
    },
    ui_dynamics: {
      mutation_windows: [],
      layout_shift_candidates: [],
      feedback_appearances: [],
    },
    heuristic_evidence: {
      accessibility: [],
      usability: [],
    },
    ux_markers: [],
  };
}

export function mergeSessionFragment(target, fragment) {
  if (!fragment) return target;

  const mergeArray = (path, incoming = []) => {
    if (!incoming.length) return;
    const current = path.reduce((acc, key) => acc[key], target);
    current.push(...incoming);
  };

  if (hasMeaningfulSessionMeta(fragment.session_meta)) {
    target.session_meta = {
      ...target.session_meta,
      ...fragment.session_meta,
    };
  }

  if (fragment.privacy) {
    target.privacy = {
      ...target.privacy,
      ...fragment.privacy,
    };
  }

  if (fragment.capture_config) {
    target.capture_config = {
      ...target.capture_config,
      ...fragment.capture_config,
    };
  }

  mergeArray(['rrweb', 'events'], fragment.rrweb?.events);
  mergeArray(['axe_preliminary_analysis', 'runs'], fragment.axe_preliminary_analysis?.runs);
  mergeArray(['page_semantics', 'landmarks'], fragment.page_semantics?.landmarks);
  mergeArray(['page_semantics', 'interactive_elements'], fragment.page_semantics?.interactive_elements);
  mergeArray(['page_semantics', 'form_groups'], fragment.page_semantics?.form_groups);
  mergeArray(['interaction_summary', 'pointer_paths'], fragment.interaction_summary?.pointer_paths);
  mergeArray(['interaction_summary', 'typing_metrics_by_element'], fragment.interaction_summary?.typing_metrics_by_element);
  mergeArray(['interaction_summary', 'focus_flow'], fragment.interaction_summary?.focus_flow);
  mergeArray(['interaction_summary', 'scroll_regions'], fragment.interaction_summary?.scroll_regions);
  mergeArray(['interaction_summary', 'heuristic_candidates'], fragment.interaction_summary?.heuristic_candidates);
  mergeArray(['ui_dynamics', 'mutation_windows'], fragment.ui_dynamics?.mutation_windows);
  mergeArray(['ui_dynamics', 'layout_shift_candidates'], fragment.ui_dynamics?.layout_shift_candidates);
  mergeArray(['ui_dynamics', 'feedback_appearances'], fragment.ui_dynamics?.feedback_appearances);
  mergeArray(['heuristic_evidence', 'accessibility'], fragment.heuristic_evidence?.accessibility);
  mergeArray(['heuristic_evidence', 'usability'], fragment.heuristic_evidence?.usability);
  mergeArray(['ux_markers'], fragment.ux_markers);

  return target;
}
