# Build e Interface

## Sistema de Build (`vite.config.js`)

A extensão utiliza o **Vite** como empacotador, o que garante um ambiente de desenvolvimento rápido e um bundle final otimizado.

### Plugin CRXJS
O projeto utiliza o `@crxjs/vite-plugin`. Este plugin é crucial pois:
-   Lê o `manifest.json` e o trata como o ponto de entrada principal.
-   Gere o ciclo de vida da extensão no Chrome (hot-reload em dev).
-   Converte o JSX do Popup e os módulos ES dos scripts em um formato compatível com as restrições de CSP do Manifest V3.

### Scripts do `package.json`
-   `npm run dev`: Modo de desenvolvimento com recompilação automática.
-   `npm run build`: Gera os arquivos finais na pasta `dist/`.
-   `npm run lint`: Verifica a padronização do código com ESLint.

---

## Interface do Popup (`Popup.jsx`)

A interface foi construída com **React 19** e estilizada com **Vanilla CSS**.

### Estados Sincronizados
O Popup não "sabe" nada por conta própria; ele sempre consulta o Background ao ser aberto.
1.  **Status**: Verifica se a gravação está ativa.
2.  **Timer**: Se estiver gravando, calcula o tempo decorrido comparando o `Date.now()` atual com o `startTime` persistido no Background.

### Fluxo de Comunicação
-   `chrome.runtime.sendMessage({ action: 'startRecording' })`: Disparado ao clicar no botão "Gravar". O Popup então se fecha automaticamente para não obstruir a tela.
-   `chrome.runtime.sendMessage({ action: 'stopRecording' })`: Finaliza a captura.

---

## Estrutura de Pastas de Saída (`dist/`)

Após o build, a pasta `dist/` contém:
-   `manifest.json`: Versão final processada pelo Vite.
-   `assets/`: JS e CSS minificados para o Popup e scripts.
-   `scripts/`: Service Worker e Content Scripts transpilados.
-   `index.html`: Ponto de entrada do Popup.
