import { createEmptySessionDraft, mergeSessionFragment } from './session-schema.js';

export function createSessionDraft(overrides = {}) {
  return createEmptySessionDraft(overrides);
}

export function applySessionFragment(sessionDraft, fragment) {
  return mergeSessionFragment(sessionDraft, fragment);
}

export function buildExportPayload(sessionDraft) {
  return sessionDraft;
}
