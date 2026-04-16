/* global chrome */
import { createEmptySessionDraft, createCaptureConfig, createPrivacyState, mergeSessionFragment } from './session-schema.js';

let recordingState = {
  isRecording: false,
  startTime: null,
};

let timerInterval = null;

let sessionDraft = createEmptySessionDraft();

chrome.storage.local.get(['recordingState', 'sessionDraft'], (result) => {
  if (result.recordingState) {
    recordingState = result.recordingState;
    if (recordingState.isRecording) {
      startBadgeTimer();
    }
  }

  if (result.sessionDraft) {
    sessionDraft = result.sessionDraft;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CHECK_STATUS') {
    sendResponse({ isRecording: recordingState.isRecording });
  } else if (request.action === 'SESSION_META') {
    if (request.sessionMeta) {
      sessionDraft.session_meta = {
        ...sessionDraft.session_meta,
        ...request.sessionMeta,
      };
      chrome.storage.local.set({ sessionDraft });
      sendResponse({ success: true });
    }
  } else if (request.action === 'SESSION_FRAGMENT') {
    if (request.fragment) {
      mergeSessionFragment(sessionDraft, request.fragment);
      chrome.storage.local.set({ sessionDraft });
      sendResponse({ success: true });
    }
  } else if (request.action === 'BUFFER_EVENTS') {
    if (request.events && request.events.length > 0) {
      mergeSessionFragment(sessionDraft, {
        rrweb: {
          events: request.events,
        },
      });
      chrome.storage.local.set({ sessionDraft });
      sendResponse({ success: true });
      return true;
    }
  } else if (request.action === 'FLUSH_DONE') {
    triggerDownload(sender.tab.id);
  } else if (request.action === 'getStatus') {
    sendResponse(recordingState);
  } else if (request.action === 'startRecording') {
    startManager();
  } else if (request.action === 'stopRecording') {
    stopManager();
  }

  return true;
});

function startManager() {
  const startTime = Date.now();
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${startTime}`;

  recordingState = {
    isRecording: true,
    startTime,
  };

  sessionDraft = createEmptySessionDraft({
    session_meta: {
      session_id: sessionId,
      started_at: startTime,
      ended_at: null,
      page_url: null,
      page_title: null,
      user_agent: navigator.userAgent,
    },
    privacy: createPrivacyState(),
    capture_config: createCaptureConfig(),
  });

  chrome.storage.local.set({
    recordingState,
    sessionDraft,
  });

  startBadgeTimer();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'START_RRWEB' });
    }
  });
}

function stopManager() {
  stopBadgeTimer();

  recordingState = {
    isRecording: false,
    startTime: null,
  };

  sessionDraft.session_meta.ended_at = Date.now();

  chrome.storage.local.set({
    recordingState,
    sessionDraft,
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'STOP_AND_FLUSH' });
    }
  });
}

function triggerDownload(tabId) {
  chrome.storage.local.get(['sessionDraft'], (result) => {
    const payload = result.sessionDraft || sessionDraft;

    chrome.tabs.sendMessage(tabId, {
      action: 'DOWNLOAD_FULL_SESSION',
      session: payload,
    });
  });
}

function startBadgeTimer() {
  if (timerInterval) clearInterval(timerInterval);
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  updateBadge();
  timerInterval = setInterval(updateBadge, 1000);
}

function stopBadgeTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  chrome.action.setBadgeText({ text: '' });
}

function updateBadge() {
  if (!recordingState.startTime) return;
  const seconds = Math.floor((Date.now() - recordingState.startTime) / 1000);
  const m = Math.floor(seconds / 60).toString();
  const s = (seconds % 60).toString().padStart(2, '0');
  chrome.action.setBadgeText({ text: `${m}:${s}` });
}
