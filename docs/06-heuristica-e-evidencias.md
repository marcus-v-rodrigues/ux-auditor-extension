# Heurísticas e Evidências

## Motores de Análise (`src/scripts/heuristics/`)

O sistema utiliza diversos analisadores especializados para detectar padrões de uso que indicam problemas de UX.

### 1. Pointer Analyzer
Analisa o movimento do mouse para identificar comportamentos erráticos.
-   **Rage Click**: Sequências rápidas de cliques no mesmo elemento em um intervalo curto (default: 3 cliques em 500ms).
-   **Dead Click**: Cliques em elementos que não são interativos (medida de "confusão visual").
-   **Visual Search Burst**: Movimentos rápidos e amplos sem foco em elementos específicos, sugerindo dificuldade em encontrar informação.
-   **Erratic Motion**: Baixa eficiência de caminho e muitas mudanças de direção (ZigZag).

### 2. Input Analyzer
Focado na interação com formulários.
-   **Hesitação de Campo**: Detecta quando o tempo entre o foco e a primeira digitação ultrapassa o limite esperado (default: 1500ms).
-   **Revisão Excessiva**: Mede se o usuário apagou e reescreveu o conteúdo muitas vezes.
-   **Abandono de Campo**: Identifica campos que foram focados mas nunca preenchidos.

### 3. Field Format (`field-format.js`)
Cruza a intenção semântica com o comportamento real.
-   **Inconsistência de Formato**: Se o `semantic-resolver` identificou que um campo espera um CPF (pista via placeholder ou máscara) e o perfil do valor digitado pelo usuário não condiz com essa estrutura (ex: faltam dígitos), uma evidência de `field_format_mismatch` é gerada.

---

## Thresholds (`thresholds.js`)

Todos os limites para disparo de heurísticas são parametrizáveis no arquivo `thresholds.js`. Isso permite ajustar a sensibilidade da detecção de acordo com o público-alvo (ex: usuários idosos podem ter velocidades de ponteiro diferentes).

### Exemplo de Limites:
-   `pointer_long_pause_ms`: 500ms
-   `rage_click_min_clicks`: 3
-   `structural_burst_node_count`: 20 (mudança brusca no DOM)
-   `minimum_interactive_target_size_px`: 24px (alvos pequenos para acessibilidade)

---

## Consolidação de Evidências

As evidências são salvas em dois blocos no JSON final:
-   **`accessibility`**: Violações estruturais e de design (alvos pequenos, falta de landmarks).
-   **`usability`**: Problemas de interação observados em tempo real (hesitação, rage click, erros de formato).
