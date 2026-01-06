// Recupera o estado inicial do storage (caso o Service Worker tenha reiniciado)
let recordingState = {
  isRecording: false,
  startTime: null
};

// Timer precisa ser em memória, pois não serializa
let timerInterval = null;

// Inicializa estado ao carregar o script
chrome.storage.local.get(['recordingState'], (result) => {
  if (result.recordingState) {
    recordingState = result.recordingState;
    if (recordingState.isRecording) {
      // Se estava gravando, retoma o timer do badge
      startBadgeTimer();
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CHECK_STATUS') {
    sendResponse({ isRecording: recordingState.isRecording });
  }
  
  else if (request.action === 'BUFFER_EVENTS') {
    if (request.events && request.events.length > 0) {
      // Salva no storage em vez de variável global
      chrome.storage.local.get(['events'], (result) => {
        const currentEvents = result.events || [];
        const updatedEvents = currentEvents.concat(request.events);
        chrome.storage.local.set({ events: updatedEvents }, () => {
           console.log(`Recebidos +${request.events.length} eventos. Total: ${updatedEvents.length}`);
           sendResponse({ success: true });
        });
      });
      return true; // Mantém o canal aberto para o sendResponse assíncrono
    }
  }

  // === NOVO: Ouve o sinal de que o Content Script terminou de enviar tudo ===
  else if (request.action === 'FLUSH_DONE') {
    triggerDownload(sender.tab.id);
  }

  else if (request.action === 'getStatus') {
    sendResponse(recordingState);
  }
  else if (request.action === 'startRecording') {
    startManager();
  }
  else if (request.action === 'stopRecording') {
    stopManager();
  }
  
  // Retorna true para permitir respostas assíncronas se necessário (boas práticas)
  return true;
});

function startManager() {
  const startTime = Date.now();
  recordingState = {
    isRecording: true,
    startTime: startTime
  };

  // Salva estado e limpa eventos anteriores
  chrome.storage.local.set({
    recordingState: recordingState,
    events: []
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
    startTime: null
  };

  // Atualiza estado no storage
  chrome.storage.local.set({ recordingState: recordingState });

  // Em vez de baixar direto, pedimos para a aba "Esvaziar o Buffer" (Flush)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'STOP_AND_FLUSH' });
    }
  });
}

// Função separada que só roda depois que todos os dados chegaram
function triggerDownload(tabId) {
  // Busca tudo do storage para enviar para download
  chrome.storage.local.get(['events'], (result) => {
    const masterEvents = result.events || [];
    console.log(`Finalizando: Baixando ${masterEvents.length} eventos totais.`);
    
    chrome.tabs.sendMessage(tabId, {
      action: 'DOWNLOAD_FULL_SESSION',
      events: masterEvents
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