# Documentação Técnica - UX Auditor Extension

Esta documentação detalha a arquitetura, os componentes internos e a lógica de análise da extensão UX Auditor. O sistema foi projetado para capturar sessões de uso enriquecidas com contexto semântico, heurísticas de usabilidade e evidências de acessibilidade.

## Índice de Documentos

| Arquivo | Tema | Descrição |
|---------|------|-----------|
| [00-visao-geral.md](./00-visao-geral.md) | Visão Geral | Objetivos, arquitetura de alto nível e contrato do JSON final. |
| [01-manifesto-e-configuracao.md](./01-manifesto-e-configuracao.md) | Manifesto e Configuração | Detalhes do Manifest V3 e parâmetros de captura (rrweb). |
| [02-service-worker-e-estado.md](./02-service-worker-e-estado.md) | Service Worker e Estado | Ciclo de vida da sessão, persistência e mensageria. |
| [03-content-script-e-pipeline.md](./03-content-script-e-pipeline.md) | Content Script e Pipeline | Orquestração de captura, observadores e bufferização. |
| [04-resolucao-semantica.md](./04-resolucao-semantica.md) | Resolução Semântica | Identificação de elementos, nomes acessíveis e landmarks. |
| [05-analise-de-interacao.md](./05-analise-de-interacao.md) | Análise de Interação | Sumarização de caminhos de ponteiro, métricas de digitação e fluxo de foco. |
| [06-heuristica-e-evidencias.md](./06-heuristica-e-evidencias.md) | Heurísticas e Evidências | Motores de análise (pointer, input, format) e thresholds. |
| [07-privacidade-e-mascaramento.md](./07-privacidade-e-mascaramento.md) | Privacidade e Mascaramento | Estratégias de proteção de dados sensíveis por contexto. |
| [08-acessibilidade-e-axe.md](./08-acessibilidade-e-axe.md) | Acessibilidade e axe-core | Integração com o motor de auditoria automatizada. |
| [09-sistema-de-build-e-popup.md](./09-sistema-de-build-e-popup.md) | Build e Interface | Configuração Vite, CRXJS e interface de controle em React. |
| [10-referencias.md](./10-referencias.md) | Referências | Bibliografia e normas técnicas (ABNT/BibTeX). |

## Filosofia do Projeto

O UX Auditor não é apenas um gravador de tela (session replay). Ele é um **instrumento de auditoria** que:
1.  **Observa**: Captura eventos brutos (rrweb).
2.  **Interpreta**: Resolve o significado semântico dos elementos interagidos.
3.  **Analisa**: Aplica heurísticas em tempo real para detectar padrões de fricção (rage clicks, hesitação, erros de formato).
4.  **Consolida**: Gera um payload estruturado pronto para análise por pesquisadores ou ingestão em sistemas de IA.

## Manutenção

Ao modificar a lógica de captura ou análise, certifique-se de atualizar o esquema em `src/scripts/session-schema.js` e a documentação correspondente no tópico [00-visao-geral.md](./00-visao-geral.md).
