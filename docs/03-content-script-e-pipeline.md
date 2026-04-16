# Content Script e Pipeline

## Orquestração (`content.js`)

O Content Script é o agente executor que roda no contexto da página. Ele orquestra a coleta de eventos brutos, a resolução semântica e a aplicação de heurísticas.

### Pipeline de Captura
1.  **Inicialização**: O script carrega e verifica o status com o Background. Se ativo, inicia o `rrweb.record()`.
2.  **Observadores (`bindPageObservers`)**: Escuta eventos de `pointer`, `click`, `input`, `focus`, `scroll`, `submit` e mudanças de rota.
3.  **Bufferização**: Eventos do `rrweb` são acumulados em `eventBuffer`.
4.  **Flush (`flushPending`)**: Ocorre quando o buffer atinge 50 eventos ou após 1.2s de inatividade. O flush consolida:
    - Eventos `rrweb`.
    - Resumo de interações (`interaction-summarizer`).
    - Mudanças dinâmicas de UI (`ui-dynamics-tracker`).
    - Evidências comportamentais derivadas.

---

## Checkpoints Analíticos (`captureCheckpoint`)

O sistema não captura apenas o fluxo contínuo; ele executa "fotos" analíticas em momentos estratégicos:
-   **`session_start`**: No início da gravação ou carga da página.
-   **`form_submit`**: No momento em que um formulário é enviado.
-   **`route_change`**: Em mudanças de URL em SPAs (Single Page Applications).

Cada checkpoint dispara:
1.  `collectPageSemantics`: Mapeia a estrutura da página.
2.  `runAxePreliminaryAnalysis`: Executa auditoria de acessibilidade.
3.  `deriveHeuristicEvidence`: Verifica conformidade estrutural (ex: falta de landmarks).

---

## Gestão de Navegação

Para evitar perda de dados em trocas de página, o script:
-   Escuta `beforeunload` e dispara um flush síncrono.
-   Escuta `visibilitychange` para enviar dados quando a aba fica em segundo plano.
-   Faz o "patch" das APIs de Histórico (`pushState`, `replaceState`) para detectar rotas em SPAs.
