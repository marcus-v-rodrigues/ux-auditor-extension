# Service Worker e Estado

## Função do Service Worker (`background.js`)

O Service Worker atua como o "cérebro" persistente da extensão. Como os Content Scripts são destruídos a cada recarregamento de página, o Service Worker garante a continuidade da sessão.

### Responsabilidades
1.  **Gestão de Estado**: Mantém o objeto `recordingState` (se está gravando, timestamp de início).
2.  **Buffer de Sessão**: Acumula fragmentos de JSON enviados pelo Content Script no `sessionDraft`.
3.  **Sinalização**: Comunica mudanças de estado entre Popup e Content Script via mensagens.
4.  **Badge da Extensão**: Atualiza o ícone do Chrome (ex: texto "REC" em vermelho) quando a gravação está ativa.

---

## Ciclo de Vida da Sessão

1.  **`startManager`**:
    - Limpa dados de sessões anteriores no `chrome.storage.local`.
    - Inicializa o rascunho da sessão com metadados básicos.
    - Notifica todas as abas ativas para iniciarem a coleta (`START_RRWEB`).
2.  **`stopManager`**:
    - Sinaliza o Content Script para interromper a coleta e enviar os últimos dados (`STOP_AND_FLUSH`).
    - Consolida o rascunho final.
    - Solicita ao Content Script que dispare o download do arquivo.
3.  **Recuperação**:
    - Se a página for recarregada durante uma gravação, o Content Script ao iniciar pergunta ao Background (`CHECK_STATUS`). Se o estado for `isRecording`, a coleta retoma imediatamente na mesma sessão.

---

## Protocolo de Mensagens

| Ação | De | Para | Descrição |
|------|----|------|-----------|
| `startRecording` | Popup | Background | Inicia nova sessão. |
| `stopRecording` | Popup | Background | Finaliza sessão atual. |
| `CHECK_STATUS` | Content | Background | Pergunta se deve iniciar captura ao carregar página. |
| `SESSION_FRAGMENT` | Content | Background | Envia lote de eventos/análises para persistência. |
| `SESSION_META` | Content | Background | Sincroniza metadados da página (URL, título). |
| `DOWNLOAD_FULL_SESSION`| Background | Content | Comando final para baixar o JSON. |
