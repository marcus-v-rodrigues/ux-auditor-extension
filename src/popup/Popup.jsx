import React, { useState, useEffect } from 'react';

// Estilos simples inline para o popup
const styles = {
  container: { width: '200px', padding: '16px', textAlign: 'center', fontFamily: 'sans-serif' },
  status: { marginBottom: '16px', fontSize: '14px', color: '#666' },
  btn: { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: 'white' },
  start: { backgroundColor: '#28a745' },
  stop: { backgroundColor: '#dc3545' }
};

export default function Popup() {
  const [status, setStatus] = useState({ isRecording: false, startTime: null });
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    // 1. Ao abrir, pergunta ao background: "Estamos gravando?"
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      setStatus(response);
    });

    // Atualiza o timer visualmente no popup (opcional, só pra ficar bonito)
    const interval = setInterval(() => {
      chrome.runtime.sendMessage({ action: 'getStatus' }, (res) => {
        if(res.isRecording && res.startTime) {
           const secs = Math.floor((Date.now() - res.startTime) / 1000);
           const m = Math.floor(secs / 60).toString().padStart(2, '0');
           const s = (secs % 60).toString().padStart(2, '0');
           setElapsed(`${m}:${s}`);
        }
        setStatus(res);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    // Pega a aba atual para saber onde gravar
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Manda o Background iniciar o processo
    chrome.runtime.sendMessage({ action: 'startRecording', tabId: tab.id });
    window.close(); // Fecha o popup automaticamente
  };

  const handleStop = () => {
    chrome.runtime.sendMessage({ action: 'stopRecording' });
    window.close();
  };

  return (
    <div style={styles.container}>
      <h3>UX Auditor</h3>
      
      {status.isRecording ? (
        <>
          <div style={styles.status}>Gravando: {elapsed}</div>
          <button style={{...styles.btn, ...styles.stop}} onClick={handleStop}>
            PARAR GRAVAÇÃO
          </button>
        </>
      ) : (
        <>
          <div style={styles.status}>Pronto para iniciar</div>
          <button style={{...styles.btn, ...styles.start}} onClick={handleStart}>
            INICIAR
          </button>
        </>
      )}
    </div>
  );
}