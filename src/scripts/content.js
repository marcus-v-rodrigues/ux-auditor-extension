import { record } from 'rrweb';

let stopFn = null;
let eventBuffer = [];

console.log("UX Auditor: Content Script Carregado.");

chrome.runtime.sendMessage({ action: 'CHECK_STATUS' }, (response) => {
  if (response && response.isRecording) {
    console.log("UX Auditor: Retomando gravação...");
    startRecording();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_RRWEB') {
    startRecording();
  } 
  // === NOVO COMANDO: Para e Esvazia ===
  else if (request.action === 'STOP_AND_FLUSH') {
    if (stopFn) {
      stopFn();
      stopFn = null;
    }
    // Força o envio do que sobrou no buffer e aguarda confirmação
    flushBuffer(() => {
      chrome.runtime.sendMessage({ action: 'FLUSH_DONE' });
    });
  }
  else if (request.action === 'DOWNLOAD_FULL_SESSION') {
    saveData(request.events);
  }
});

function startRecording() {
  if (stopFn) return;

  eventBuffer = []; 

  stopFn = record({
    emit(event) {
      eventBuffer.push(event);
      if (eventBuffer.length >= 50) {
        flushBuffer();
      }
    },
    maskAllInputs: true,
    sampling: { 
      // Scroll: Grava a cada 150ms (padrão bom)
      scroll: 150, 
      
      // Mouse: Defina um valor em ms para suavizar.
      // false = Não grava nada (Arquivo leve, replay "fantasma")
      // true = Grava tudo (Arquivo pesado, risco de lag)
      // 100 = Grava a posição a cada 100ms (Equilíbrio ideal para UX)
      mousemove: 50, // 50ms é bem fluido, 100ms é mais econômico
    },
    checkoutEveryNth: 200, 
  });

  window.addEventListener('beforeunload', () => {
    flushBuffer();
  });
}

function flushBuffer(callback) {
  if (eventBuffer.length === 0) {
    if (callback) callback();
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'BUFFER_EVENTS',
    events: eventBuffer
  }, () => {
    if (callback) callback();
  });
  
  eventBuffer = [];
}

function saveData(fullEventList) {
  if (!fullEventList || fullEventList.length === 0) {
    alert("Nenhum evento gravado (Lista vazia).");
    return;
  }

  const blob = new Blob([JSON.stringify(fullEventList)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ux-session-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}