import axe from 'axe-core';

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function summarizeNode(node) {
  return {
    target: Array.isArray(node.target) ? node.target.slice(0, 3) : [],
    selector: Array.isArray(node.target) ? node.target[0] || null : null,
    html: cleanText(node.html).slice(0, 200),
    failure_summary: cleanText(node.failureSummary).slice(0, 200) || null,
  };
}

function summarizeRule(rule) {
  return {
    id: rule.id,
    impact: rule.impact || 'unknown',
    description: cleanText(rule.description),
    help: cleanText(rule.help),
    help_url: rule.helpUrl || null,
    tags: Array.isArray(rule.tags) ? rule.tags.slice(0, 10) : [],
    nodes: rule.nodes.slice(0, 8).map(summarizeNode),
  };
}

function impactCounts(rules = []) {
  return rules.reduce(
    (acc, rule) => {
      const impact = rule.impact || 'unknown';
      acc[impact] = (acc[impact] || 0) + 1;
      return acc;
    },
    { critical: 0, serious: 0, moderate: 0, minor: 0, unknown: 0 },
  );
}

export async function runAxePreliminaryAnalysis({ trigger, context = {} } = {}) {
  if (!axe?.run) return null;

  const result = await axe.run(document, {
    resultTypes: ['violations', 'incomplete'],
  });

  const violations = result.violations || [];
  const incomplete = result.incomplete || [];

  return {
    timestamp: Date.now(),
    trigger,
    context,
    axe_version: axe.version || null,
    summary: {
      total_violations: violations.length,
      total_incomplete: incomplete.length,
      violation_impacts: impactCounts(violations),
      incomplete_impacts: impactCounts(incomplete),
    },
    violations: violations.map(summarizeRule),
    incomplete: incomplete.map(summarizeRule),
  };
}
