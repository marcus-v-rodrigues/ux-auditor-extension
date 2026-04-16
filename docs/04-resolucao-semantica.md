# Resolução Semântica

## O Papel do `semantic-resolver.js`

Para que as heurísticas façam sentido, o sistema precisa entender a "intenção" dos elementos da interface. O `semantic-resolver.js` transforma elementos brutos do DOM em objetos estruturados com significado.

### Identificação de Elementos
O sistema foca em três tipos de elementos:
1.  **Landmarks**: Regiões estruturais (`header`, `nav`, `main`, `aside`, `footer` ou elementos com papéis ARIA correspondentes).
2.  **Interactive Elements**: Botões, links, inputs, selects, textareas e elementos com papéis interativos (ex: `role="button"`).
3.  **Form Groups**: Formulários (`form`) e grupos de campos (`fieldset`).

---

## Atributos Resolvidos

Para cada elemento interativo, o sistema resolve:
-   **Nomes Acessíveis**: Segue a especificação W3C (prioriza `aria-labelledby`, depois `aria-label`, depois `label[for]`, depois `placeholder` ou `title`).
-   **Hierarquia de Títulos**: Associa campos ao título da seção mais próxima (`h1`-`h6`) ou `legend` do fieldset.
-   **Bounding Box**: Posição exata (`x`, `y`, `width`, `height`) no momento da captura.
-   **CSS Selector**: Gera um seletor robusto (prioriza `id`, depois `name`, depois caminhos hierárquicos com `:nth-of-type`) para permitir re-identificação do elemento no replay.
-   **Format Hint**: Infeção da forma esperada do dado (ex: se o campo parece ser um CPF ou Telefone com base em placeholder ou máscara).

---

## Lógica de Visibilidade

O sistema ignora elementos ocultos (`display: none`, `visibility: hidden`, `opacity: 0` ou dimensões zero). Isso garante que as heurísticas de "alvo pequeno" ou "falta de landmark" não sejam poluídas por elementos técnicos invisíveis.
