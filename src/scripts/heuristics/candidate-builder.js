const TARGET_KEYS = [
  'css_selector',
  'tagName',
  'inputType',
  'name',
  'labelText',
  'formId',
  'sectionTitle',
];

export function normalizeHeuristicTarget(target = {}) {
  const normalized = {};
  for (const key of TARGET_KEYS) {
    normalized[key] = target[key] ?? null;
  }
  return normalized;
}

export function createHeuristicCandidate(type, target, startedAt, endedAt, metrics) {
  return {
    kind: 'heuristic_candidate',
    type,
    timestamp_start: startedAt,
    timestamp_end: endedAt,
    target,
    metrics,
  };
}
