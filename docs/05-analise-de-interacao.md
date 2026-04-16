# Análise de Interação

## O Sumarizador (`interaction-summarizer.js`)

Enquanto o `rrweb` grava o replay visual, o `InteractionSummarizer` processa os eventos em paralelo para gerar métricas agregadas de alto nível.

### Camadas de Análise

#### 1. Caminhos de Ponteiro (`pointer_paths`)
Segmenta o movimento do mouse em trajetórias lógicas. Para cada segmento, calcula:
-   **Velocidade Média**: Detecta movimentos frenéticos ou busca visual lenta.
-   **ZigZag Score**: Quantifica a mudança de direção, útil para identificar hesitação.
-   **Pausas**: Conta pausas longas (>500ms) sobre elementos.
-   **Revisitas**: Identifica se o usuário voltou ao mesmo elemento repetidamente.

#### 2. Métricas de Digitação (`typing_metrics_by_element`)
Agrega a interação com campos de formulário:
-   **First Input Delay**: Tempo entre o foco no campo e o primeiro caractere digitado (medida de carga cognitiva).
-   **Revisões**: Quantidade de inserts e deletes (medida de dificuldade de preenchimento).
-   **Abandono**: Detecta se o usuário focou em um campo e saiu sem preencher nada.
-   **Value Profile**: Gera um resumo anônimo do que foi digitado (ex: "DDDPDDDD-DD" para um CPF) para conferência de formato sem armazenar dados sensíveis brutos.

#### 3. Fluxo de Foco (`focus_flow`)
Registra a sequência de navegação por teclado.
-   **Out of Order**: Compara a ordem de foco com a ordem visual/semântica. Saltos inesperados são marcadores de erro de implementação de acessibilidade.

#### 4. UX Markers
Marcadores pontuais disparados por eventos específicos:
-   `modal_open` / `toast_visible`: Detecção de feedbacks do sistema.
-   `form_validation_error`: Tentativas de submissão que falharam na validação.
-   `sensitive_input_observed`: Registro de interação com campos protegidos.
