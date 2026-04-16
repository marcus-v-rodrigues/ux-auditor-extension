# Acessibilidade e axe-core

## Auditoria Automatizada (`axe-runner.js`)

A extensão integra o motor **axe-core**, o padrão da indústria para testes automatizados de acessibilidade.

### Funcionamento
Diferente de ferramentas de CI/CD que rodam o axe uma vez, o UX Auditor roda o axe em **checkpoints dinâmicos**:
1.  **Carga da Página**: Garante a auditoria do estado inicial.
2.  **Mudanças de Rota**: Audita o novo estado de aplicações SPA.
3.  **Submissão de Formulário**: Audita o formulário e as mensagens de erro dinâmicas que podem ter aparecido.

---

## Escopo da Análise

Para manter a performance e evitar payloads gigantescos, a análise é filtrada para focar em itens críticos:
-   Contraste de cores.
-   Relações de label/input.
-   Presença de IDs duplicados (que quebram tecnologias assistivas).
-   Acessibilidade de teclado em elementos interativos.

---

## Resultado no JSON (`axe_preliminary_analysis`)

Cada execução do axe é registrada como uma "run", contendo:
-   `timestamp`: Quando ocorreu.
-   `trigger`: Por que ocorreu (ex: `route_change`).
-   `violations`: Lista de violações encontradas, com severidade e impacto.
-   `incomplete`: Itens que precisam de revisão manual (ex: contraste em gradientes).

Esta análise preliminar serve como evidência imediata para o auditor, que pode então cruzar esses dados com o replay visual para entender como a falha de acessibilidade impactou o usuário real.
