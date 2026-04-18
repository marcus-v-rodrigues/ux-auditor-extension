# Guia do Desenvolvedor

Este guia destina-se a desenvolvedores e pesquisadores que desejam estender as funcionalidades do UX Auditor ou contribuir para o seu motor de análise.

## 1. Configuração do Ambiente

O projeto utiliza **Node.js** e o gerenciador de pacotes **npm**.

```bash
# Clone o repositório
git clone https://github.com/marcus/ux-auditor-extension.git

# Instale as dependências
npm install

# Inicie o modo de desenvolvimento (Vite + CRXJS)
npm run dev

# Gere a build de produção otimizada
npm run build
```

---

## 2. Estrutura de Pastas

```text
/src
  /popup        # Interface do usuário (React + CSS)
  /scripts
    /heuristics # Lógica de detecção e thresholds
    background.js # Service Worker (Estado e Persistência)
    content.js    # Orquestrador (Injetado na aba)
    semantic-resolver.js # Motor de interpretação do DOM
    interaction-summarizer.js # Agregador de métricas
    axe-runner.js # Integração com axe-core
```

---

## 3. Adicionando uma Nova Heurística

Para adicionar uma nova regra de detecção de fricção:
1.  **Defina os Thresholds**: Adicione as constantes de tempo ou contagem no arquivo `src/scripts/heuristics/thresholds.js`.
2.  **Crie o Analisador**: Implemente a lógica de observação em um novo arquivo dentro da pasta `/heuristics` ou estenda um existente (ex: `PointerAnalyzer`).
3.  **Registre no Aggregator**: Adicione o novo analisador à classe `HeuristicAggregator` para que os resultados sejam consolidados no payload.
4.  **Emita o Marcador**: Utilize a função `emitMarker` no `InteractionSummarizer` para sinalizar o evento no JSON final.

---

## 4. Tecnologias Utilizadas

-   **[Vite](https://vitejs.dev/)**: Ferramenta de build ultra-rápida.
-   **[React 19](https://react.dev/)**: Framework para a interface do Popup.
-   **[rrweb](https://www.rrweb.io/)**: Biblioteca para captura e replay de sessões do DOM.
-   **[axe-core](https://github.com/dequelabs/axe-core)**: Motor padrão para acessibilidade.
-   **[CRXJS](https://crxjs.dev/)**: Plugin do Vite que facilita o desenvolvimento de extensões de navegador modernos.

---

## 5. Licença e Uso

Este projeto é desenvolvido para fins acadêmicos e de pesquisa em Experiência do Usuário (UX). O uso comercial deve respeitar as licenças das bibliotecas de terceiros (MIT/LGPL).
