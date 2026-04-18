# Resolução Semântica do DOM

O **`SemanticResolver`** é o componente encarregado de traduzir a árvore de nós do DOM em uma estrutura de dados rica em significado contextual. Ele responde à pergunta: "O que esse elemento representa para o usuário?".

## 1. O Mecanismo de Identificação

O sistema utiliza seletores CSS otimizados para identificar elementos de interesse, dividindo-os em três categorias:

1.  **Landmarks**: Pontos de referência estruturais (ex: `header`, `nav`, `main`, `footer`, `section[aria-label]`).
2.  **Interativos**: Alvos que podem receber foco ou clique (ex: `button`, `a[href]`, `input`, `select`, `textarea`, `[role="button"]`, `[tabindex]`).
3.  **Containers de Grupo**: Agrupadores semânticos (ex: `form`, `fieldset`, `[role="group"]`).

---

## 2. Atributos Capturados por Elemento

Para cada elemento interativo identificado, o `SemanticResolver` extrai um conjunto abrangente de metadados:

| Atributo | Descrição |
| :--- | :--- |
| `css_selector` | Um seletor único gerado deterministicamente para identificar o elemento em análises futuras. |
| `accessibleName` | O nome anunciado por leitores de tela, seguindo a ordem de precedência: `aria-label` > `aria-labelledby` > `label[for]` > `alt` > `title`. |
| `role` | O papel semântico explícito (ARIA) ou implícito do elemento. |
| `boundingBox` | As coordenadas `(x, y)` e dimensões `(width, height)` reais no momento do snapshot. |
| `visualOrder` | A posição sequencial do elemento no fluxo visual de interatividade da página. |
| `format_hint` | Uma sugestão do tipo de dado esperado no campo (ex: `email`, `date`, `credit-card`), inferida a partir de atributos como `name`, `type`, `pattern` e `inputmode`. |

---

## 3. Lógica de Seletores Únicos (`getCssSelector`)

Diferente de seletores gerados automaticamente por navegadores, que podem ser excessivamente longos ou baseados em classes dinâmicas (ex: CSS Modules), o UX Auditor utiliza uma lógica personalizada:
1.  Prioriza o **ID** do elemento (se único).
2.  Utiliza o **Name** ou **Role** como qualificadores secundários.
3.  Inclui até 2 classes CSS estáveis.
4.  Recorre ao `nth-of-type` apenas em último caso, garantindo que o seletor seja robusto a mudanças leves de layout.

---

## 4. Detecção de Dinâmica de UI (Modais e Toasts)

O `SemanticResolver` também inclui funções heurísticas para detectar componentes efêmeros:
-   **`isLikelyModal`**: Identifica janelas de diálogo analisando `role="dialog"`, `aria-modal="true"` ou classes CSS contendo "modal" ou "dialog".
-   **`isLikelyToast`**: Detecta mensagens de feedback rápido como `role="status"`, `role="alert"` ou classes contendo "toast" ou "snackbar".

---

## 5. Próximos Passos
O contexto extraído por este componente é essencial para a [Análise Comportamental](05-analise-comportamental.md), onde os movimentos do mouse são "ancorados" nestes elementos semânticos.
