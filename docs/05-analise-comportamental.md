# Análise Comportamental e Métricas de Interação

O **`InteractionSummarizer`** é o componente responsável por transformar a torrente de eventos brutos (coordenadas de mouse, pressionamentos de tecla) em métricas comportamentais de alto nível, permitindo a análise de padrões de uso sem a necessidade de assistir a cada segundo do vídeo da sessão.

## 1. Métricas de Navegação e Ponteiro (`pointer_paths`)

O sistema agrupa eventos de movimento do mouse em "caminhos" (*paths*), capturando:
-   **Velocidade Média**: Calculada em pixels por milissegundo (px/ms). Velocidades excessivas podem indicar estresse, enquanto velocidades muito baixas sugerem incerteza ou exploração visual.
-   **Zig-Zag Score**: Mede a quantidade de mudanças bruscas de direção. Pontuações altas indicam movimentos erráticos e desorientação.
-   **Duração de Hover**: O tempo que o usuário permaneceu imóvel sobre um elemento interativo, uma métrica-chave para medir hesitação.

---

## 2. Métricas de Entrada de Dados (`typing_metrics`)

Diferente de sistemas de log simples, o UX Auditor analisa o processo de preenchimento de campos:

| Métrica | Descrição |
| :--- | :--- |
| `first_input_delay_ms` | O tempo decorrido entre o foco no campo e o primeiro caractere digitado (latência de decisão). |
| `revisions` | Quantidade de vezes que o usuário utilizou `backspace` ou `delete` para corrigir o texto. |
| `inserts` vs `deletes` | Razão entre adições e remoções de caracteres, indicando esforço cognitivo no preenchimento. |
| `abandoned` | Sinaliza se o usuário focou em um campo, mas saiu dele sem inserir nenhum dado ou sem concluir o preenchimento. |

---

## 3. Fluxo de Foco (`focus_flow`)

O sistema registra a sequência cronológica de foco entre os elementos da página:
-   **`out_of_order`**: Identifica automaticamente quando o usuário pula de um campo para outro que não segue a ordem visual ou lógica da página (ex: saltar do primeiro campo para o último sem passar pelos intermediários).
-   **Timestamp de Transição**: Permite analisar quanto tempo o usuário gasta "lendo" ou "pensando" entre um campo e outro.

---

## 4. Dinâmica Visual e Feedback (`ui_dynamics`)

O sistema observa mutações no DOM em busca de eventos de feedback do sistema:
-   **`structural_burst`**: Detecta quando uma grande porção da tela muda repentinamente (ex: carregamento de uma lista de resultados ou abertura de um menu expansível).
-   **`feedback_appearance`**: Identifica automaticamente mensagens de erro ou sucesso que aparecem após uma interação, cruzando-as com o seletor do elemento que as originou.

---

## 5. Próximos Passos
Estas métricas são os ingredientes para as [Heurísticas Automatizadas](06-heuristica-e-evidencias.md), que utilizam thresholds estatísticos para gerar avisos de UX.
