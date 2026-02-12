import React, { useState, useEffect } from 'react';
import './popup.css';

/**
 * Componente principal da interface do Popup da extensão.
 * Gerencia o estado visual da gravação e comunica ações do usuário ao Background Script.
 */
export default function Popup() {
  // Estado local que reflete se a gravação está ativa e o tempo de início
  const [status, setStatus] = useState({ isRecording: false, startTime: null });
  
  // Estado para o contador de tempo formatado (MM:SS)
  const [elapsed, setElapsed] = useState('00:00');

  /**
   * Effect Hook para inicialização e sincronização com o Background.
   * Verifica o estado atual ao abrir e configura o timer de atualização.
   */
  useEffect(() => {
    // 1. Sincronização inicial: Pergunta ao background se já existe uma gravação em andamento
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      setStatus(response);
    });

    // 2. Loop de atualização: Consulta o estado a cada segundo para atualizar o timer
    const interval = setInterval(() => {
      chrome.runtime.sendMessage({ action: 'getStatus' }, (res) => {
        if(res.isRecording && res.startTime) {
           // Calcula o tempo decorrido em tempo real
           const secs = Math.floor((Date.now() - res.startTime) / 1000);
           const m = Math.floor(secs / 60).toString().padStart(2, '0');
           const s = (secs % 60).toString().padStart(2, '0');
           setElapsed(`${m}:${s}`);
        }
        // Atualiza o estado completo para garantir consistência
        setStatus(res);
      });
    }, 1000);

    // Limpeza do intervalo ao desmontar o componente
    return () => clearInterval(interval);
  }, []);

  /**
   * Ação de Iniciar Gravação.
   * Identifica a aba ativa e envia comando ao Background.
   */
  const handleStart = async () => {
    // Obtém a aba ativa na janela atual
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Envia mensagem ao Background para iniciar a orquestração
    chrome.runtime.sendMessage({ action: 'startRecording', tabId: tab.id });
    
    // Fecha o popup para não atrapalhar a experiência do usuário
    window.close();
  };

   /**
   * Ação de Parar Gravação.
   * Envia comando de parada ao Background.
   */
  const handleStop = () => {
    chrome.runtime.sendMessage({ action: 'stopRecording' });
    window.close();
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="logo-indicator" />
        <h3>UX Auditor</h3>
      </div>
      
      <div className="status-card">
        <div className="status-label">
          {status.isRecording ? 'Session in progress' : 'Status'}
        </div>
        {status.isRecording ? (
          <div className="timer-container">
            <div className="pulse" />
            <div className="timer">{elapsed}</div>
          </div>
        ) : (
          <div className="timer inactive">Ready to record</div>
        )}
      </div>

      {status.isRecording ? (
        <button
          className="popup-btn danger"
          onClick={handleStop}
        >
          Stop Recording
        </button>
      ) : (
        <button
          className="popup-btn primary"
          onClick={handleStart}
        >
          Start Audit
        </button>
      )}
    </div>
  );
}