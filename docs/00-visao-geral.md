# Visão Geral do Sistema

## Objetivo

O UX Auditor Extension é uma ferramenta de auditoria de interface que captura a experiência de uso do usuário no navegador de forma estruturada. Ao contrário de ferramentas de replay tradicionais que focam apenas no visual, esta extensão enriquece os dados com:

1.  **Contexto Semântico**: O que cada elemento representa (landmarks, nomes acessíveis, papéis ARIA).
2.  **Métricas Comportamentais**: Como o usuário interagiu (velocidade do ponteiro, hesitação na digitação, ordem de foco).
3.  **Heurísticas Automatizadas**: Identificação de pontos de fricção como cliques de raiva (rage clicks) ou campos abandonados.
4.  **Acessibilidade**: Triagem preliminar de violações WCAG usando axe-core.

## Arquitetura

O sistema é dividido em três componentes principais:

-   **Service Worker (Background)**: Coordenador central. Mantém o estado da gravação, gerencia a persistência em `chrome.storage.local` e orquestra a exportação final.
-   **Content Script**: Coletor de dados. Injeta o motor `rrweb`, observa interações brutas, executa a resolução semântica e aplica heurísticas em tempo real.
-   **Popup (Interface)**: Controle de usuário. Permite iniciar/parar a gravação e exibe o status atual.

## O Contrato JSON (Payload Final)

O resultado de uma sessão é um JSON consolidado com a seguinte estrutura:

```json
{
  "session_meta": {
    "session_id": "UUID único",
    "started_at": "Timestamp (ms)",
    "ended_at": "Timestamp (ms)",
    "page_url": "URL da captura",
    "page_title": "Título da página",
    "user_agent": "Navegador e SO"
  },
  "privacy": {
    "masking_mode": "selective",
    "sensitive_rules_applied": ["password", "email", "..."]
  },
  "capture_config": {
    "rrweb": { "sampling": { "scroll": 100, "mousemove": 100 }, "checkoutEveryNth": 200 }
  },
  "rrweb": {
    "events": []
  },
  "axe_preliminary_analysis": {
    "runs": [
      {
        "timestamp": 0,
        "trigger": "session_start | form_submit | route_change",
        "violations": []
      }
    ]
  },
  "page_semantics": {
    "landmarks": [],
    "interactive_elements": [],
    "form_groups": []
  },
  "interaction_summary": {
    "pointer_paths": [],
    "typing_metrics_by_element": [],
    "focus_flow": [],
    "scroll_regions": [],
    "heuristic_candidates": []
  },
  "ui_dynamics": {
    "mutation_windows": [],
    "layout_shift_candidates": [],
    "feedback_appearances": []
  },
  "heuristic_evidence": {
    "accessibility": [],
    "usability": []
  },
  "ux_markers": []
}
```

## Fluxo de Dados

1.  **Início**: O usuário clica em "Iniciar" no Popup. O Background cria uma `session_id` e notifica o Content Script.
2.  **Captura**: O Content Script inicia o `rrweb` e diversos `Observers` (Pointer, Input, Focus).
3.  **Checkpoints**: Em momentos-chave (início, rota, submit), o sistema captura um snapshot semântico e roda o axe-core.
4.  **Bufferização**: Eventos e fragmentos de análise são enviados em lotes (50 eventos ou 1.2s de silêncio) para o Background para evitar perda de dados em crash ou navegação.
5.  **Finalização**: O usuário encerra a gravação. O Background consolida todos os fragmentos e dispara o download do arquivo JSON.
