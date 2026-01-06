/**
 * Estado global da gravação.
 * Armazena se está gravando e o tempo de início.
 * Recuperado do storage ao iniciar para persistência entre recargas do Service Worker.
 */
let recordingState = {
  isRecording: false,
  startTime: null
};

/**
 * Referência para o intervalo do timer do badge (ícone da extensão).
 * Mantido apenas em memória, pois intervalos não podem ser serializados para o storage.
 */
let timerInterval = null;

/**
 * Inicialização: Recupera o estado anterior do Chrome Storage.
 * Isso é crucial porque Service Workers podem ser suspensos pelo navegador
 * quando inativos, perdendo o estado da memória.
 */
chrome.storage.local.get(['recordingState'], (result) => {
  if (result.recordingState) {
    recordingState = result.recordingState;
    if (recordingState.isRecording) {
      // Se a gravação estava ativa antes do reinício, retoma a atualização visual do badge
      startBadgeTimer();
    }
  }
});

/**
 * Listener central de mensagens.
 * Gerencia a comunicação entre Popup, Content Script e Background.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Verifica se a gravação está ativa (usado pelo Content Script ao carregar)
  if (request.action === 'CHECK_STATUS') {
    sendResponse({ isRecording: recordingState.isRecording });
  }
  
  // Recebe pacotes de eventos do rrweb vindos do Content Script
  else if (request.action === 'BUFFER_EVENTS') {
    if (request.events && request.events.length > 0) {
      // Adiciona os novos eventos à lista persistida no storage.
      // Usar storage evita perda de dados se o Service Worker for suspenso.
      chrome.storage.local.get(['events'], (result) => {
        const currentEvents = result.events || [];
        const updatedEvents = currentEvents.concat(request.events);
        
        chrome.storage.local.set({ events: updatedEvents }, () => {
           console.log(`[Background] Recebidos +${request.events.length} eventos. Total acumulado: ${updatedEvents.length}`);
           sendResponse({ success: true });
        });
      });
      return true; // Mantém o canal de mensagem aberto para a resposta assíncrona do storage
    }
  }

  // Sinalização de fim de fluxo: O Content Script enviou todos os dados pendentes
  else if (request.action === 'FLUSH_DONE') {
    triggerDownload(sender.tab.id);
  }

  // Solicitação de estado pelo Popup para atualizar a UI
  else if (request.action === 'getStatus') {
    sendResponse(recordingState);
  }
  
  // Comando do Popup para iniciar a gravação
  else if (request.action === 'startRecording') {
    startManager();
  }
  
  // Comando do Popup para parar a gravação
  else if (request.action === 'stopRecording') {
    stopManager();
  }
  
  // Retorna true por padrão para permitir respostas assíncronas futuras, se necessário
  return true;
});

/**
 * Inicia o processo de gravação.
 * Define o estado, limpa dados antigos e notifica o Content Script.
 */
function startManager() {
  const startTime = Date.now();
  recordingState = {
    isRecording: true,
    startTime: startTime
  };

  // Persiste o novo estado e reseta a lista de eventos
  chrome.storage.local.set({
    recordingState: recordingState,
    events: []
  });

  // Inicia o contador visual no ícone
  startBadgeTimer();

  // Envia comando para a aba ativa iniciar o rrweb
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'START_RRWEB' });
    }
  });
}

/**
 * Encerra o processo de gravação.
 * Atualiza estado e solicita ao Content Script que envie os dados restantes.
 */
function stopManager() {
  stopBadgeTimer();
  
  recordingState = {
    isRecording: false,
    startTime: null
  };

  // Atualiza estado no storage para persistência
  chrome.storage.local.set({ recordingState: recordingState });

  // Não baixamos imediatamente. Pedimos para a aba "Esvaziar o Buffer" (Flush) primeiro.
  // Isso garante que os últimos milissegundos de interação sejam capturados.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'STOP_AND_FLUSH' });
    }
  });
}

/**
 * Finaliza a sessão recuperando todos os dados e enviando de volta para a aba.
 * @param {number} tabId - ID da aba que receberá os dados para download
 */
function triggerDownload(tabId) {
  // Recupera a lista completa de eventos do storage
  chrome.storage.local.get(['events'], (result) => {
    const masterEvents = result.events || [];
    console.log(`[Background] Finalizando sessão. Preparando download de ${masterEvents.length} eventos.`);
    
    // Envia os dados completos para o Content Script gerar o arquivo JSON
    chrome.tabs.sendMessage(tabId, {
      action: 'DOWNLOAD_FULL_SESSION',
      events: masterEvents
    });
  });
}

/**
 * Gerenciamento do Timer do Badge
 */

function startBadgeTimer() {
  if (timerInterval) clearInterval(timerInterval);
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Fundo vermelho para indicar "REC"
  updateBadge();
  timerInterval = setInterval(updateBadge, 1000);
}

function stopBadgeTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  chrome.action.setBadgeText({ text: '' }); // Limpa o texto do badge
}

/**
 * Atualiza o texto do badge com o tempo decorrido (MM:SS)
 */
function updateBadge() {
  if (!recordingState.startTime) return;
  const seconds = Math.floor((Date.now() - recordingState.startTime) / 1000);
  const m = Math.floor(seconds / 60).toString();
  const s = (seconds % 60).toString().padStart(2, '0');
  chrome.action.setBadgeText({ text: `${m}:${s}` });
}