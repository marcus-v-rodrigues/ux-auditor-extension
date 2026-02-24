# Interface do Popup (Popup.jsx)

## 1. Visão Geral e Propósito

O componente [`Popup.jsx`](../src/popup/Popup.jsx) implementa a interface de usuário da extensão, apresentada ao usuário quando o ícone da extensão é clicado na barra de ferramentas do Chrome. Desenvolvido em React, este componente oferece controles para iniciar e interromper sessões de gravação, além de exibir o status atual e tempo decorrido.

### 1.1 Papel no Sistema

O Popup desempenha as seguintes responsabilidades:

1. **Interface de Controle**: Permite ao usuário iniciar e parar gravações
2. **Visualização de Status**: Exibe estado atual da sessão
3. **Cronômetro em Tempo Real**: Mostra tempo decorrido durante gravação
4. **Comunicação com Background**: Envia comandos e recebe atualizações de estado

### 1.2 Integração com o Sistema

**Diagrama da arquitetura interna do componente Popup e sua comunicação com o Service Worker.**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#bfbfbf', 'edgeColor': '#5d5d5d' }, "flowchart": {"subGraphTitleMargin": {"bottom": 30}}}}%%
flowchart TB
    subgraph POPUP ["POPUP (React Component)"]
        subgraph Estado ["Estado Local"]
            direction TB
            S1["status: { isRecording, startTime }"]
            S2["elapsed: 'MM:SS'"]
        end
        
        subgraph UI ["UI Components"]
            direction TB
            U1["Header (Logo + Título)"]
            U2["Status Card (Timer + Indicador)"]
            U3["Action Button (Start/Stop)"]
        end
    end
    
    subgraph SW ["SERVICE WORKER"]
        direction TB
        Background["Service Worker"]
    end
    
    Estado --- UI
    UI <-->|"chrome.runtime.sendMessage()"| SW
```

## 2. Arquitetura e Lógica

### 2.1 Estrutura de Componentes

O componente Popup é estruturado da seguinte forma:

```
Popup (Componente Principal)
├── Header
│   ├── Logo Indicator
│   └── Título "UX Auditor"
├── Status Card
│   ├── Status Label
│   └── Timer Container
│       ├── Pulse Animation (quando gravando)
│       └── Timer Display
└── Action Button
    ├── "Start Audit" (estado inativo)
    └── "Stop Recording" (estado ativo)
```

### 2.2 Modelo de Estado

O componente utiliza dois estados locais:

```javascript
// Estado principal sincronizado com o Background
const [status, setStatus] = useState({ 
  isRecording: false, 
  startTime: null 
});

// Tempo formatado para exibição
const [elapsed, setElapsed] = useState('00:00');
```

**Diagrama de Estados**:

**Máquina de estados da interface do Popup, alternando entre os estados inativo (IDLE) e gravando (RECORDING).**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#bfbfbf', 'edgeColor': '#5d5d5d' }, "flowchart": {"subGraphTitleMargin": {"bottom": 30}}}}%%
stateDiagram-v2
    [*] --> IDLE

    state "IDLE<br/>isRecording: false<br/>elapsed: '00:00'" as IDLE
    state "RECORDING<br/>isRecording: true<br/>elapsed: MM:SS (updating)" as RECORDING
    
    IDLE --> RECORDING : handleStart()
    RECORDING --> IDLE : handleStop()
```

### 2.3 Ciclo de Vida com useEffect

O componente utiliza `useEffect` para gerenciar sincronização e atualizações:

```javascript
useEffect(() => {
  // 1. Sincronização inicial
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    setStatus(response);
  });

  // 2. Loop de atualização (polling)
  const interval = setInterval(() => {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (res) => {
      // Atualiza estado e calcula tempo
    });
  }, 1000);

  // 3. Limpeza ao desmontar
  return () => clearInterval(interval);
}, []);
```

### 2.4 Fluxo de Interação

**Diagrama de sequência da interação do usuário com o Popup para iniciar e retomar a visualização da gravação.**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#bfbfbf', 'edgeColor': '#5d5d5d' }, "flowchart": {"subGraphTitleMargin": {"bottom": 30}}}}%%
sequenceDiagram
    participant U as Usuário
    participant P as Popup
    participant SW as Service Worker
    
    U->>P: Clica em "Start"
    P->>SW: startRecording
    P->>P: window.close()
    Note over SW: Inicia gravação
    
    U->>P: Clica no ícone (reabre)
    P->>SW: getStatus
    SW-->>P: { isRecording: true, startTime: 12345 }
    P-->>U: Exibe timer "05:32"
```

## 3. Fundamentação Matemática

### 3.1 Cálculo do Tempo Decorrido

O tempo decorrido é calculado a partir da diferença entre o timestamp atual e o timestamp de início:

$$
\Delta t = t_{\text{atual}} - t_{\text{início}} = \text{Date.now}() - \text{startTime}
$$

A conversão para minutos e segundos:

$$
\text{minutos} = \left\lfloor \frac{\Delta t}{1000 \times 60} \right\rfloor = \left\lfloor \frac{\Delta t_{\text{segundos}}}{60} \right\rfloor
$$

$$
\text{segundos} = \left( \frac{\Delta t}{1000} \right) \mod 60
$$

**Implementação**:

```javascript
const secs = Math.floor((Date.now() - res.startTime) / 1000);
const m = Math.floor(secs / 60).toString().padStart(2, '0');
const s = (secs % 60).toString().padStart(2, '0');
```

### 3.2 Frequência de Polling

O polling de estado ocorre a cada 1000ms (1 segundo):

$$
f_{\text{polling}} = \frac{1}{T_{\text{interval}}} = \frac{1}{1000\text{ms}} = 1 \text{ Hz}
$$

**Trade-off**:
- Intervalo menor → UI mais responsiva, maior uso de recursos
- Intervalo maior → UI menos responsiva, menor uso de recursos

### 3.3 Latência de Atualização

A latência máxima de atualização do timer é:

$$
L_{\text{max}} = T_{\text{interval}} + T_{\text{mensagem}} + T_{\text{render}}
$$

Onde:
- $T_{\text{interval}} = 1000\text{ms}$ (intervalo de polling)
- $T_{\text{mensagem}} \approx 1\text{-}5\text{ms}$ (latência de mensagem)
- $T_{\text{render}} \approx 16\text{ms}$ (tempo de renderização a 60 FPS)

$$
L_{\text{max}} \approx 1000 + 5 + 16 = 1021\text{ms}
$$

## 4. Parâmetros Técnicos

### 4.1 Configurações de Estado

| Estado | Tipo | Valores Possíveis |
|--------|------|-------------------|
| `status.isRecording` | boolean | `true`, `false` |
| `status.startTime` | number \| null | timestamp Unix ou `null` |
| `elapsed` | string | `"MM:SS"` |

### 4.2 Intervalos de Tempo

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| Polling interval | 1000ms | Frequência de consulta ao Background |
| Formato do timer | MM:SS | Minutos com padding zero, segundos com 2 dígitos |

### 4.3 Mensagens Chrome

| Ação Enviada | Parâmetros | Resposta Esperada |
|--------------|------------|-------------------|
| `getStatus` | nenhum | `{ isRecording, startTime }` |
| `startRecording` | `tabId` | nenhuma (popup fecha) |
| `stopRecording` | nenhum | nenhuma (popup fecha) |

## 5. Mapeamento Tecnológico e Referências

### 5.1 React

**Documentação Oficial**: https://react.dev/

**Citação Acadêmica (BibTeX)**:
```bibtex
@inproceedings{react2013,
  author = {Facebook Inc.},
  title = {React: A JavaScript Library for Building User Interfaces},
  year = {2013},
  url = {https://react.dev/}
}
```

**Artigo sobre React Hooks**:
```bibtex
@online{react_hooks,
  author = {{React Team}},
  title = {Introducing Hooks},
  year = {2019},
  url = {https://react.dev/reference/react}
}
```

### 5.2 React Hooks Utilizados

| Hook | Uso | Documentação |
|------|-----|--------------|
| `useState` | Gerenciamento de estado local | https://react.dev/reference/react/useState |
| `useEffect` | Efeitos colaterais e ciclo de vida | https://react.dev/reference/react/useEffect |

### 5.3 Chrome Runtime API

**Documentação**: https://developer.chrome.com/docs/extensions/reference/api/runtime

### 5.4 Chrome Tabs API

**Documentação**: https://developer.chrome.com/docs/extensions/reference/api/tabs

## 6. Análise do Código

### 6.1 Função `handleStart()`

**Propósito**: Inicia uma nova sessão de gravação.

**Algoritmo**:

```
1. Obter aba ativa via chrome.tabs.query()
2. Enviar mensagem 'startRecording' ao Background
3. Fechar popup via window.close()
```

**Implementação**:

```javascript
const handleStart = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ action: 'startRecording', tabId: tab.id });
  window.close();
};
```

**Nota**: O fechamento do popup (`window.close()`) é intencional para não interferir na experiência do usuário durante a gravação.

### 6.2 Função `handleStop()`

**Propósito**: Encerra a sessão de gravação atual.

**Algoritmo**:

```
1. Enviar mensagem 'stopRecording' ao Background
2. Fechar popup via window.close()
```

### 6.3 Efeito de Sincronização

O `useEffect` implementa um padrão de sincronização contínua:

**Fluxograma do efeito de sincronização e atualização contínua do estado da UI.**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#bfbfbf', 'edgeColor': '#5d5d5d' }, "flowchart": {"subGraphTitleMargin": {"bottom": 30}}}}%%
flowchart TD
    Start["Montagem do Componente"]
    Msg["Mensagem inicial: getStatus"]
    SetInt["setInterval(1000ms)"]
    GetStat["getStatus"]
    Update["Atualizar estado\nCalcular elapsed"]
    End["Desmontagem do Componente"]
    Clear["clearInterval()"]
    
    Start --> Msg
    Msg --> SetInt
    SetInt --> GetStat
    GetStat --> Update
    Update --> GetStat
    
    End --> Clear
```

### 6.4 Renderização Condicional

O componente renderiza diferentes elementos baseado no estado:

```jsx
{status.isRecording ? (
  <button className="popup-btn danger" onClick={handleStop}>
    Stop Recording
  </button>
) : (
  <button className="popup-btn primary" onClick={handleStart}>
    Start Audit
  </button>
)}
```

**Lógica de Renderização**:

$$
\text{Botão} = \begin{cases}
\text{Stop Recording (danger)} & \text{se } \text{isRecording} = \text{true} \\
\text{Start Audit (primary)} & \text{se } \text{isRecording} = \text{false}
\end{cases}
$$

## 7. Análise de Estilos (popup.css)

### 7.1 Sistema de Design

O arquivo [`popup.css`](../src/popup/popup.css) define um sistema de design baseado em CSS Custom Properties:

```css
:root {
  --primary: #3f9c13;    /* Verde - ação primária */
  --danger: #ef4444;     /* Vermelho - ação de parar */
  --bg: #ffffff;         /* Fundo branco */
  --text: #1f2937;       /* Texto escuro */
  --text-light: #6b7280; /* Texto secundário */
  --success: #22c55e;    /* Verde sucesso */
  --shadow: ...;         /* Sombra padrão */
}
```

### 7.2 Animação Pulse

A animação de pulso indica gravação ativa:

```css
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 1; }
  70% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(0.95); opacity: 1; }
}
```

**Ciclo de Animação**:

$$
\text{scale}(t) = \begin{cases}
0.95 & t = 0 \\
1.1 & t = 0.7 \times 1.5\text{s} = 1.05\text{s} \\
0.95 & t = 1.5\text{s}
\end{cases}
$$

### 7.3 Dimensões do Popup

| Elemento | Dimensão | Valor |
|----------|----------|-------|
| Container | Largura | 250px |
| Container | Padding | 20px |
| Timer | Font-size | 28px |
| Button | Padding | 12px |

## 8. Justificativa de Escolhas

### 8.1 React vs Vanilla JavaScript

| Aspecto | React | Vanilla JS |
|---------|-------|------------|
| Gerenciamento de estado | Declarativo | Imperativo |
| Reutilização | Componentes | Funções |
| Curva de aprendizado | Moderada | Baixa |
| Bundle size | Maior | Menor |

**Decisão**: React foi escolhido pela familiaridade da equipe e pela facilidade de gerenciar estado em interfaces que mudam frequentemente.

### 8.2 Polling vs Event-Driven

| Abordagem | Vantagens | Desvantagens |
|-----------|-----------|--------------|
| **Polling** | Simplicidade, não requer registro de listeners | Uso de recursos, latência |
| **Event-driven** | Eficiência, resposta imediata | Complexidade, gerenciamento de listeners |

**Decisão**: Polling foi escolhido pela simplicidade de implementação. Uma melhoria futura poderia usar `chrome.runtime.onMessage` para atualizações push do Background.

### 8.3 Fechamento do Popup

O fechamento automático do popup após iniciar/parar gravação:

**Vantagens**:
- Não obstrui a visualização da página
- Indica claramente que a ação foi executada
- Segue padrões de UX para extensões Chrome

**Alternativa considerada**: Manter popup aberto para exibir feedback contínuo. Rejeitada por interferir na experiência de gravação.

## 9. Considerações para Monografia

### 9.1 Seções Sugeridas

```latex
\section{Interface do Usuário}
\subsection{Arquitetura do Componente Popup}
\subsection{Gerenciamento de Estado com React Hooks}
\subsubsection{useState para Estado Local}
\subsubsection{useEffect para Sincronização}
\subsection{Sistema de Design Visual}
\subsubsection{CSS Custom Properties}
\subsubsection{Animações e Feedback Visual}
\subsection{Comunicação com Service Worker}
\subsection{Padrões de Interação}
```

### 9.2 Diagramas Recomendados

- Diagrama de estados do componente
- Fluxograma de interação usuário-sistema
- Diagrama de sequência de comunicação

### 9.3 Métricas de UX

Sugere-se documentar:

- Tempo de resposta da interface
- Feedback visual ao usuário
- Acessibilidade (contraste, tamanhos)
