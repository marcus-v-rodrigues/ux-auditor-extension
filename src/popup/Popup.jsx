import React, { useState, useEffect } from 'react';

/**
 * Sistema de Design: Cores e Sombras Modernas
 */
const theme = {
  primary: '#6366f1', // Indigo moderno
  danger: '#ef4444',  // Vermelho vibrante
  bg: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
  success: '#22c55e',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

/**
 * Objeto de estilos inline para o componente Popup.
 * Mantém o design simples e leve, sem dependências de CSS externas complexas.
 */
const styles = {
  // Ajuste para tirar o espaço vazio e arredondar
  container: { 
    width: '250px',            // Largura definida para ocupar o espaço justo
    margin: '0',               // Remove margens externas
    padding: '20px', 
    backgroundColor: theme.bg,
    fontFamily: '"Inter", -apple-system, sans-serif',
    boxShadow: theme.shadow,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'    // Garante que o padding não aumente o tamanho
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  title: { fontSize: '16px', fontWeight: '700', color: theme.text, margin: 0 },
  statusCard: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    marginBottom: '16px',
    textAlign: 'center'
  },
  timer: { 
    fontSize: '28px', 
    fontWeight: '700', 
    color: theme.text,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.5px'
  },
  label: { 
    fontSize: '10px', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em', 
    color: theme.textLight,
    marginBottom: '4px',
    fontWeight: '600'
  },
  btn: { 
    width: '100%', 
    padding: '12px', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px',
    color: 'white',
    transition: 'transform 0.1s ease'
  },
  pulse: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: theme.danger,
    boxShadow: `0 0 0 rgba(239, 68, 68, 0.4)`,
    animation: 'pulse 1.5s infinite'
  }
};

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
    <div style={styles.container}>
      {/* Estilo para animação do ponto vermelho */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          70% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        body { margin: 0; background: transparent; }
      `}</style>

      <div style={styles.header}>
        <div style={{ backgroundColor: theme.primary, width: '10px', height: '10px', borderRadius: '2px' }} />
        <h3 style={styles.title}>UX Auditor</h3>
      </div>
      
      <div style={styles.statusCard}>
        <div style={styles.label}>
          {status.isRecording ? 'Sessão em curso' : 'Status'}
        </div>
        {status.isRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={styles.pulse} />
            <div style={styles.timer}>{elapsed}</div>
          </div>
        ) : (
          <div style={{...styles.timer, fontSize: '14px', color: theme.textLight}}>Pronto para gravar</div>
        )}
      </div>

      {status.isRecording ? (
        <button 
          style={{...styles.btn, backgroundColor: theme.danger}} 
          onClick={handleStop}
          onMouseOver={(e) => e.target.style.filter = 'brightness(0.9)'}
          onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
        >
          Parar Gravação
        </button>
      ) : (
        <button 
          style={{...styles.btn, backgroundColor: theme.primary}} 
          onClick={handleStart}
          onMouseOver={(e) => e.target.style.filter = 'brightness(0.9)'}
          onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
        >
          Iniciar Auditoria
        </button>
      )}
    </div>
  );
}