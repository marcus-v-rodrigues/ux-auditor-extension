const TARGET_KEYS = [
  'css_selector',
  'tagName',
  'inputType',
  'name',
  'labelText',
  'formId',
  'sectionTitle',
];

function normalizeTarget(target = {}) {
  const normalized = {};
  for (const key of TARGET_KEYS) {
    normalized[key] = target[key] ?? null;
  }
  return normalized;
}

function buildKey(candidate) {
  return JSON.stringify({
    type: candidate.type,
    timestamp_start: candidate.timestamp_start,
    timestamp_end: candidate.timestamp_end,
    target: candidate.target,
    metrics: candidate.metrics,
  });
}

export class HeuristicAggregator {
  constructor(limit = 200) {
    this.limit = limit;
    this.items = [];
    this.seen = new Set();
  }

  add(candidate) {
    if (!candidate || candidate.kind !== 'heuristic_candidate') return;

    const normalized = {
      kind: 'heuristic_candidate',
      type: candidate.type,
      timestamp_start: candidate.timestamp_start,
      timestamp_end: candidate.timestamp_end ?? candidate.timestamp_start,
      target: normalizeTarget(candidate.target),
      metrics: candidate.metrics ?? {},
    };

    const key = buildKey(normalized);
    if (this.seen.has(key)) return;

    this.seen.add(key);
    this.items.push(normalized);

    if (this.items.length > this.limit) {
      const removed = this.items.shift();
      this.seen.delete(buildKey(removed));
    }
  }

  addMany(candidates = []) {
    for (const candidate of candidates) {
      this.add(candidate);
    }
  }

  consume() {
    const items = this.items.splice(0);
    this.seen.clear();
    return items;
  }
}
