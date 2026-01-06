import { record } from 'rrweb';

/**
 * Função retornada pelo rrweb para parar a gravação.
 * @type {function|null}
 */
let stopFn = null;

/**
 * Buffer local para armazenar eventos antes de enviar ao Background.
 * Reduz o tráfego de mensagens excessivas.
 * @type {Array}
 */
let eventBuffer = [];

console.log("[UX Auditor] Content Script Carregado e pronto.");

// Verifica com o Background se já existe uma gravação em andamento ao carregar a página
chrome.runtime.sendMessage({ action: 'CHECK_STATUS' }, (response) => {
  if (response && response.isRecording) {
    console.log("[UX Auditor] Retomando gravação existente...");
    startRecording();
  }
});

/**
 * Listener de mensagens vindas do Background Script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Inicia a captura de eventos rrweb
  if (request.action === 'START_RRWEB') {
    startRecording();
  }
  
  // Para a gravação e força o envio dos dados restantes
  else if (request.action === 'STOP_AND_FLUSH') {
    if (stopFn) {
      stopFn(); // Para o rrweb
      stopFn = null;
    }
    // Esvazia o buffer restante e avisa o Background quando terminar
    flushBuffer(() => {
      chrome.runtime.sendMessage({ action: 'FLUSH_DONE' });
    });
  }
  
  // Recebe a lista completa de eventos para gerar o arquivo de download
  else if (request.action === 'DOWNLOAD_FULL_SESSION') {
    saveData(request.events);
  }
});

/**
 * Inicializa a gravação com rrweb.
 * Configurações otimizadas para performance e privacidade.
 */
function startRecording() {
  if (stopFn) return; // Evita múltiplas instâncias

  eventBuffer = [];

  stopFn = record({
    emit(event) {
      // Adiciona evento ao buffer local
      eventBuffer.push(event);
      
      // Se o buffer encher, envia para o Background
      if (eventBuffer.length >= 50) {
        flushBuffer();
      }
    },
    // Proteção de privacidade: mascara todos os campos de input
    maskAllInputs: true,
    
    // Configurações de amostragem para otimizar performance
    sampling: {
      // Scroll: Grava a cada 150ms (evita excesso de eventos de scroll)
      scroll: 150,
      
      // Mouse: Amostragem de movimento.
      // 50ms oferece boa fluidez no replay sem sobrecarregar o navegador.
      mousemove: 50,
    },
    // Cria um snapshot completo (checkout) a cada N eventos
    // Facilita o "seek" (avançar/voltar) no player depois
    checkoutEveryNth: 200,
  });

  // Garante que dados não salvos sejam enviados se a aba for fechada/recarregada
  window.addEventListener('beforeunload', () => {
    flushBuffer();
  });
}

/**
 * Envia os eventos acumulados no buffer para o Background Script.
 * @param {function} [callback] - Função opcional para executar após o envio.
 */
function flushBuffer(callback) {
  if (eventBuffer.length === 0) {
    if (callback) callback();
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'BUFFER_EVENTS',
    events: eventBuffer
  }, () => {
    // Callback executado após o Background confirmar o recebimento
    if (callback) callback();
  });
  
  // Limpa o buffer local imediatamente após o envio
  eventBuffer = [];
}

/**
 * Gera e baixa o arquivo JSON com a sessão completa.
 * @param {Array} fullEventList - Lista completa de eventos recebida do Background.
 */
function saveData(fullEventList) {
  if (!fullEventList || fullEventList.length === 0) {
    alert("Nenhum evento gravado (Lista vazia).");
    return;
  }

  // Cria um Blob JSON e força o download via link dinâmico
  const blob = new Blob([JSON.stringify(fullEventList)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ux-session-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Limpeza
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}