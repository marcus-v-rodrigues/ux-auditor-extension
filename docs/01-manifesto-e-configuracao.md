# Manifesto e Configuração

## Manifesto V3 (`manifest.json`)

A extensão utiliza o Manifest V3, seguindo as práticas recomendadas de segurança e performance do Chrome.

### Permissões Requeridas
-   `activeTab`: Permite injetar o content script na aba em que o usuário aciona a extensão.
-   `scripting`: Necessária para injetar os scripts de coleta no contexto da página.
-   `storage`: Utilizada para persistir o rascunho da sessão (`sessionDraft`) e o estado da gravação.
-   `downloads`: Permite que a extensão gere e salve o arquivo JSON final no sistema do usuário.

### Componentes Declarados
-   `action`: Define o Popup React (`index.html`) como interface primária.
-   `background`: Registra `src/scripts/background.js` como Service Worker (tipo `module`).
-   `content_scripts`: Injeta `src/scripts/content.js` em `<all_urls>` para garantir cobertura de captura em qualquer página autorizada pelo usuário.

---

## Configuração de Captura (`capture-config.js`)

A resolução e o volume dos dados são controlados centralmente no arquivo `src/scripts/capture-config.js`.

### Parâmetros de Fidelidade
-   **sampling.scroll**: Definido em 150ms por padrão. Reduz o volume de eventos de rolagem sem perder a percepção de continuidade.
-   **sampling.mousemove**: Definido em 100ms. Suficiente para reconstruir trajetórias de mouse para análise de heurísticas de movimento.
-   **checkoutEveryNth**: Um snapshot completo do DOM é tirado a cada 200 eventos. Isso permite que o replay seja reconstruído corretamente mesmo se a sessão for longa, servindo como "keyframe".

### Customização
Para aumentar a fidelidade (útil em testes de usabilidade de alta precisão), diminua os valores de `sampling`. Para reduzir o tamanho do arquivo final, aumente esses valores.
