# Manifesto e Configuração da Sessão

O UX Auditor é configurado como uma extensão **Manifest V3**, utilizando permissões mínimas para garantir a segurança e a privacidade do usuário final durante as auditorias.

## 1. Manifesto (`manifest.json`)

O arquivo de manifesto define como a extensão interage com o navegador:

```json
{
  "manifest_version": 3,
  "name": "UX Auditor Extension",
  "version": "2.0",
  "action": {
    "default_popup": "index.html"
  },
  "background": {
    "service_worker": "src/scripts/background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/scripts/content.js"] 
    }
  ],
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "downloads"
  ]
}
```

### Principais Permissões:
-   **`storage`**: Vital para o mecanismo de persistência resiliente. Permite salvar os fragmentos da sessão no `chrome.storage.local`.
-   **`scripting` & `activeTab`**: Permitem a injeção dinâmica e a interação com o DOM da página ativa.
-   **`downloads`**: Utilizada para exportar o JSON final da sessão para o sistema de arquivos do pesquisador.

---

## 2. Configuração de Captura (`capture-config.js`)

O sistema permite o ajuste fino do motor de captura para equilibrar fidelidade de replay e tamanho do arquivo final.

| Parâmetro | Valor Padrão | Descrição |
| :--- | :--- | :--- |
| `sampling.scroll` | 100ms | Intervalo entre amostras de scroll. |
| `sampling.mousemove` | 100ms | Intervalo entre amostras de movimento do mouse. |
| `checkoutEveryNth` | 200 eventos | Gera um snapshot completo do DOM a cada N eventos para permitir "seeking" no replay. |

---

## 3. Estado da Sessão (`session-schema.js`)

Toda sessão segue um esquema rigoroso que garante que os dados enriquecidos sejam consistentes. O esquema é inicializado como um "Draft" (Rascunho) vazio:

```javascript
{
  session_meta: { ... },
  privacy: { masking_mode: 'selective', ... },
  capture_config: { ... },
  rrweb: { events: [] },
  axe_preliminary_analysis: { runs: [] },
  page_semantics: { landmarks: [], interactive_elements: [] },
  interaction_summary: { pointer_paths: [], typing_metrics: [] },
  heuristic_evidence: { accessibility: [], usability: [] }
}
```

---

## 4. Orquestração de Build

A extensão utiliza **Vite** com o plugin **@crxjs/vite-plugin** para:
1.  **HMR (Hot Module Replacement)** em componentes do Popup.
2.  **Code Splitting**: Garantindo que os scripts injetados sejam leves.
3.  **Gestão de Assets**: Otimização de imagens e estilos CSS.

Para rodar em ambiente de desenvolvimento:
```bash
npm install
npm run dev
```
Isso gerará a pasta `dist/` que deve ser carregada no Chrome (`chrome://extensions/` -> Load unpacked).
