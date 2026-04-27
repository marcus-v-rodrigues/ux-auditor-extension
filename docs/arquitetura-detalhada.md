# Arquitetura Detalhada do UX Auditor Extension

Este documento descreve a organização interna da extensão, detalhando a comunicação entre os processos do Manifest V3 e o pipeline de análise de dados.

## Diagrama de Arquitetura

```mermaid
%%{init: { 'theme': 'dark', 'themeVariables': { 'fontSize': '14px' }, 'flowchart': { 'subGraphTitleMargin': {'bottom': 30}, 'curve': 'basis' } } }%%
flowchart TB
    %% ==================== CONTAINER PRINCIPAL ====================
    subgraph Chrome["Google Chrome (Manifest V3)"]
        
        %% ==================== CAMADA DE INTERFACE ====================
        subgraph Popup["Camada de Interface (Popup)"]
            UI["Interface React 19"]
            Polling["Mecanismo de Polling<br>(1000ms)"]
            StatusDisplay["Exibição de Status<br>e Cronômetro"]
        end

        %% ==================== CAMADA DE ORQUESTRAÇÃO ====================
        subgraph ServiceWorker["Camada de Orquestração (Service Worker)"]
            SW["background.js"]
            Storage["chrome.storage.local<br>(Persistência de Sessão)"]
            BadgeAPI["Badge API<br>(Timer Visual)"]
            StateManager["Gerenciador de Estado<br>(Session Draft Manager)"]
            Schema["Session Schema<br>(Merging Logic)"]
        end

        %% ==================== CAMADA DE CAPTURA E ANÁLISE ====================
        subgraph ContentScript["Camada de Captura e Análise (Content Script)"]
            CS["content.js (Orchestrator)"]
            
            subgraph Capture["Mecanismos de Captura"]
                RRWeb["rrweb<br>(Event Recording)"]
                Masking["Sensitive Masking<br>(Privacidade/PII)"]
            end

            subgraph Pipeline["Pipeline de Análise Semântica e Comportamental"]
                SR["Semantic Resolver<br>(Landmarks & A11y Tree)"]
                IS["Interaction Summarizer<br>(Gestos e Fluxos)"]
                UDT["UI Dynamics Tracker<br>(Mutações e Layout Shifts)"]
                Axe["Axe Runner<br>(Auditoria A11y)"]
            end

            subgraph Heuristics["Motores de Heurísticas"]
                HA["Heuristic Aggregator"]
                Analyzers["Analyzers<br>(Pointer, Input, Toggle)"]
                Format["Field Format<br>(Input Profiling)"]
            end

            DOM["DOM da Página"]
        end
    end

    %% ==================== CONEXÕES POPUP <-> SERVICE WORKER ====================
    UI -->|"Solicita Status"| Polling
    Polling -->|"chrome.runtime.sendMessage"| SW
    SW -->|"Retorna status + timestamp"| StatusDisplay
    UI -->|"Comando: Iniciar/Parar"| SW

    %% ==================== CONEXÕES SERVICE WORKER INTERNO ====================
    SW <-->|"Persiste Fragments"| Storage
    SW --> BadgeAPI
    SW --> StateManager
    StateManager --> Schema

    %% ==================== CONEXÕES CONTENT SCRIPT INTERNO ====================
    CS -->|"Configura e Inicia"| Capture
    CS -->|"Orquestra Checkpoints"| Pipeline
    Pipeline -->|"Alimenta"| HA
    HA --> Analyzers
    IS --> HA
    IS --> Format
    Capture -->|"Aplica Máscaras"| Masking
    SR -->|"Fornece Contexto"| Pipeline

    %% ==================== CONEXÕES CONTENT SCRIPT <-> DOM ====================
    RRWeb -->|"Captura mutações"| DOM
    UDT -->|"Observa (Mutation/Resize)"| DOM
    SR -->|"Analisa Estrutura"| DOM
    Axe -->|"Audit"| DOM

    %% ==================== COMUNICAÇÃO INTERPROCESSOS ====================
    CS -->|"SESSION_META<br>(Início)"| SW
    CS -->|"SESSION_FRAGMENT<br>(Eventos + Heurísticas)"| SW
    SW -->|"START / STOP_AND_FLUSH"| CS
    CS -->|"DOWNLOAD_FULL_SESSION"| UI

    %% ==================== ESTILIZAÇÃO ====================
    classDef popupStyle fill:#FF6F00,stroke:#000,stroke-width:2px,color:#000
    classDef swStyle fill:#4A148C,stroke:#000,stroke-width:2px,color:#fff
    classDef csStyle fill:#1B5E20,stroke:#000,stroke-width:2px,color:#fff
    classDef captureStyle fill:#2E7D32,stroke:#fff,stroke-width:1px,color:#fff
    classDef pipelineStyle fill:#0277BD,stroke:#fff,stroke-width:1px,color:#fff
    classDef heuristicStyle fill:#C62828,stroke:#fff,stroke-width:1px,color:#fff

    class UI,Polling,StatusDisplay popupStyle
    class SW,Storage,BadgeAPI,StateManager,Schema swStyle
    class CS csStyle
    class RRWeb,Masking captureStyle
    class SR,IS,UDT,Axe pipelineStyle
    class HA,Analyzers,Format heuristicStyle
```

## Descrição das Camadas

### 1. Camada de Interface (Popup)
Responsável pelo controle direto do pesquisador. Utiliza **React 19** e comunica-se com o Service Worker para disparar o início e o fim da sessão. O mecanismo de polling garante que o cronômetro visual no popup esteja sincronizado com o timestamp real guardado no background.

### 2. Camada de Orquestração (Service Worker)
O "cérebro" da extensão. Como um processo persistente (embora sujeito à suspensão no Manifest V3), ele gerencia o rascunho da sessão (`Session Draft`).
- **Session Schema**: Garante que os fragmentos vindos de diferentes abas ou em momentos distintos sejam fundidos (`merge`) corretamente sem perda de integridade.
- **Storage API**: Salva o estado incrementalmente para evitar perda de dados em caso de fechamento inesperado do navegador.

### 3. Camada de Captura e Análise (Content Script)
Injetada em cada página visitada, esta camada é subdividida em três grandes motores:

- **Mecanismos de Captura**: Utiliza `rrweb` para registrar o visual e `Sensitive Masking` para aplicar regras de privacidade antes mesmo do evento sair da aba do usuário.
- **Pipeline de Análise**: Transforma eventos brutos em semântica. O `Semantic Resolver` identifica componentes ARIA, enquanto o `Interaction Summarizer` e o `UI Dynamics Tracker` analisam o comportamento e a estabilidade da interface.
- **Motores de Heurísticas**: Onde a lógica de UX reside. Analisadores especializados (Pointer, Input, Toggle) trabalham em conjunto com o `Heuristic Aggregator` para gerar alertas de fricção (ex: Rage Clicks).

## Fluxo de Comunicação

1.  **Início**: O Popup envia um comando ao Service Worker, que por sua vez notifica o Content Script.
2.  **Captura Contínua**: O Content Script envia `SESSION_FRAGMENT`s contendo eventos de replay e evidências de heurísticas detectadas em tempo real.
3.  **Checkpoints**: Em eventos chave (carga, submit, troca de rota), o `Axe Runner` e o `Semantic Resolver` realizam varreduras profundas.
4.  **Finalização**: No comando de parada, o Content Script realiza um *flush* final. O Service Worker consolida tudo e o download é disparado através do Content Script para permitir o salvamento do arquivo JSON.
