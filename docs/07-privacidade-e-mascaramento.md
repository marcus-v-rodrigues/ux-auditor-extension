# Privacidade e Mascaramento

## Estratégia de Proteção de Dados (`sensitive-masking.js`)

O UX Auditor foi projetado para ser usado em contextos de pesquisa e auditoria, onde a privacidade é fundamental. Ele utiliza uma abordagem de **mascaramento seletivo contextual**.

### Por que não mascarar tudo?
Mascarar 100% dos inputs (como algumas ferramentas fazem) destrói a utilidade da auditoria de formulários, pois impede a análise de erros de formato e hesitação.

### Regras de Mascaramento
O sistema identifica campos sensíveis usando:
1.  **Atributos Técnicos**: `type="password"`, `autocomplete="cc-number"`, `name="cpf"`.
2.  **Sinais Semânticos**: Labels ou placeholders que contenham palavras-chave como "senha", "cartão", "documento", "telefone".
3.  **Heurística de Valor**: Se o conteúdo digitado se parece com um dado sensível conhecido.

---

## Níveis de Mascaramento

-   **rrweb masking**: Inputs de senha são mascarados nativamente pelo motor de replay (`*`).
-   **Manual masking**: Durante a captura de eventos de `input`, o valor é interceptado pela função `createMaskInputFn` que aplica regras de negócio antes de enviar o dado para o buffer.
-   **Heuristic masking**: As heurísticas que analisam o conteúdo (ex: `field-format.js`) trabalham apenas com o "perfil" do dado (ex: `DDDPDDDD-DD`) e nunca com o valor real, garantindo que o JSON exportado não contenha PII (Personally Identifiable Information).

---

## Consentimento e Contexto

O bloco `privacy` no JSON registra quais regras de mascaramento foram aplicadas, permitindo que o auditor saiba que certas interações podem estar obscurecidas por motivos de segurança.
