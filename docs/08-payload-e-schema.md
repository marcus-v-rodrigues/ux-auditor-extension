# Dicionário de Dados do Payload (JSON)

Ao exportar uma sessão, o UX Auditor gera um arquivo JSON consolidado. Abaixo está o mapeamento detalhado de cada seção e o que cada chave significa.

## 1. `session_meta` (Metadados Contextuais)

| Chave | Significado |
| :--- | :--- |
| `session_id` | Identificador único (UUID) para rastrear a sessão em bancos de dados. |
| `started_at` | Timestamp (ms) em que o botão 'Start' foi pressionado. |
| `ended_at` | Timestamp (ms) em que o botão 'Stop' foi pressionado. |
| `page_url` | A URL exata onde a gravação começou. |
| `page_title` | O título (`<title>`) da aba no início da gravação. |
| `user_agent` | String que identifica o navegador, SO e motor de renderização. |

---

## 2. `interaction_summary` (Dicionário de Métricas)

Esta é a seção mais rica em informações comportamentais calculadas.

### `pointer_paths` (Caminhos do Mouse)
- `average_speed_px_per_ms`: Velocidade média do movimento.
- `zigzag_score`: Número de mudanças bruscas de direção.
- `hover_ms`: Duração da permanência sobre o elemento final do caminho.
- `click_count`: Quantidade de cliques ocorridos durante o trajeto.
- `rage_click_candidate`: Booleano sinalizando se o caminho disparou o threshold de rage click.

### `typing_metrics_by_element` (Métricas de Digitação)
- `first_input_delay_ms`: Tempo de latência entre o foco e a primeira tecla (ms).
- `revisions`: Contagem de Backspaces/Deletes (indica esforço/correção).
- `abandoned`: Booleano. Se `true`, o usuário saiu do campo sem terminar a entrada.
- `format_hint`: O que o sistema esperava do campo (ex: `email`).
- `observed_value_summary`: Resumo do formato do valor final (ex: `[numeric_digits: 11]`).

---

## 3. `page_semantics` (Inventário de Elementos)

Mapeia o contexto de cada elemento para que os seletores no JSON façam sentido.

| Chave | Significado |
| :--- | :--- |
| `css_selector` | O "ID técnico" único que o sistema usa para o elemento. |
| `accessibleName` | O nome "falado" (ARIA label, label text, alt, etc). |
| `role` | O papel do elemento (button, link, input, checkbox). |
| `boundingBox` | Coordenadas `x`, `y`, `width`, `height` na tela. |
| `visualOrder` | Índice (0..N) que representa a ordem de leitura esperada. |

---

## 4. `heuristic_evidence` (Log de Fricção)

Consolida os alertas de UX gerados durante a sessão.

- `kind`: O tipo da evidência (conforme definido no [Catálogo de Heurísticas](06-heuristicas-e-evidencias.md)).
- `message`: Descrição amigável do problema para o pesquisador.
- `evidence`: Objeto de metadados específicos que comprovam a heurística (ex: lista de seletores).

---

## 5. Exemplo Simplificado de Estrutura

```json
{
  "session_meta": { ... },
  "page_semantics": {
    "interactive_elements": [
      { "css_selector": "#submit-btn", "accessibleName": "Enviar", "role": "button" }
    ]
  },
  "interaction_summary": {
    "pointer_paths": [
      { "target": { "css_selector": "#submit-btn" }, "rage_click_candidate": true }
    ],
    "typing_metrics_by_element": [
      { "target": { "css_selector": "#email" }, "revisions": 5, "abandoned": false }
    ]
  },
  "heuristic_evidence": {
    "usability": [
      { "kind": "rage_click_candidate", "message": "Sequência curta de cliques...", "evidence": { "count": 12 } }
    ]
  }
}
```
