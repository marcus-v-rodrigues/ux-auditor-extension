# Catálogo de Heurísticas e Evidências

O UX Auditor classifica as evidências coletadas em três grandes categorias: **Usabilidade**, **Acessibilidade** e **Comportamental**. Abaixo está o detalhamento de cada uma das heurísticas implementadas no código atual.

## 1. Heurísticas de Usabilidade (Fricção e Erro)

Detectadas principalmente no `content.js` através da análise do `interaction_summary`.

| Identificador (`kind`) | Descrição Técnica | Impacto no Usuário |
| :--- | :--- | :--- |
| `rage_click_candidate` | 3+ cliques no mesmo elemento em menos de 1.2s. | Frustração extrema, falta de resposta do sistema. |
| `dead_click_candidate` | Clique em elemento não interativo (sem role, não é botão/link). | Confusão visual; o elemento parece clicar mas não faz nada. |
| `field_abandonment` | Campo focado e editado, mas o usuário saiu sem concluir ou preencher. | Dificuldade em entender o que o campo pede ou desistência do fluxo. |
| `field_format_mismatch` | O valor final digitado não condiz com o `format_hint` esperado. | Erro de preenchimento que causará falha na submissão. |
| `out_of_order_focus` | Salto de foco que quebra a ordem visual/lógica da página. | Desorientação; quebra da expectativa de navegação sequencial. |
| `structural_burst` | Mudança de 20+ nós no DOM em um curto intervalo (1.2s). | Sobrecarga cognitiva por mudança brusca na interface. |
| `feedback_appearance` | Detecção de mensagens de erro/sucesso (toasts, inline errors) após interação. | Confirmação de que o sistema respondeu (positiva ou negativamente). |

## 2. Heurísticas de Acessibilidade (Técnica)

Derivadas do snapshot semântico e do motor Axe.

| Identificador (`kind`) | Descrição Técnica | Impacto no Usuário |
| :--- | :--- | :--- |
| `missing_landmarks` | Ausência de marcos estruturais (main, nav, header). | Dificuldade de navegação para usuários de leitor de tela. |
| `placeholder_dependent_fields` | Campo possui placeholder mas não possui label acessível. | Perda de contexto assim que o usuário começa a digitar. |
| `small_click_target` | Elemento interativo com área menor que 44x44px. | Dificuldade motora para clicar, especialmente em touch/mobile. |
| `axe_violation` | Falha detectada pelo motor axe-core (ex: contraste baixo). | Impedimento técnico de uso para pessoas com deficiência. |

## 3. Marcadores de UX (`ux_markers`)

Eventos de interesse que não são necessariamente erros, mas pontos de observação.

| Tipo (`type`) | Descrição |
| :--- | :--- |
| `sensitive_input_observed` | Detectado preenchimento em campo mascarado (senha, CPF, etc). |
| `hover_prolonged_candidate` | Mouse parado sobre alvo interativo por > 1.5s. |
| `spa_route_change` | Mudança de URL detectada via History API. |
| `modal_open` | Detecção de surgimento de janela de diálogo. |
| `form_submit_attempt` | O usuário clicou ou acionou o comando de envio de formulário. |

---

## Configuração de Sensibilidade (`thresholds.js`)

Todos os critérios acima podem ser ajustados no arquivo de thresholds. Por exemplo, para tornar a detecção de *Rage Click* mais sensível, altera-se:
- `rage_click_min_clicks`: de `3` para `2`.
- `rage_click_window_ms`: de `1200` para `2000`.
