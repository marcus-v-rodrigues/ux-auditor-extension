# Documentação do UX Auditor Extension

Esta pasta contém a documentação técnica detalhada sobre o funcionamento interno da extensão, abordando desde a arquitetura de baixo nível até os modelos de dados e heurísticas de UX.

## Sumário

1.  **[Visão Geral do Sistema](00-visao-geral.md)**: Objetivos, proposta de valor e diagrama de arquitetura Mermaid.
2.  **[Manifesto e Configuração](01-manifesto-e-configuracao.md)**: Permissões, configurações de captura e sistema de build.
3.  **[Service Worker e Estado](02-service-worker-e-estado.md)**: Persistência resiliente e orquestração de mensagens.
4.  **[Content Script e Pipeline](03-content-script-e-pipeline.md)**: Fluxo de captura, bufferização, flush e checkpoints analíticos.
5.  **[Resolução Semântica](04-resolucao-semantica.md)**: Identificação de elementos, seletores únicos e inferência de formatos.
6.  **[Análise Comportamental](05-analise-comportamental.md)**: Métricas de ponteiro, digitação, fluxo de foco e dinâmica visual.
7.  **[Heurísticas e Evidências](06-heuristicas-e-evidencias.md)**: Detecção de rage clicks, dead clicks e outros padrões de fricção.
8.  **[Privacidade e Acessibilidade](07-privacidade-e-acessibilidade.md)**: Mascaramento de dados e auditoria com axe-core.
9.  **[Estrutura do Payload (Schema)](08-payload-e-schema.md)**: Detalhamento do JSON consolidado da sessão.
10. **[Guia do Desenvolvedor](09-guia-do-desenvolvedor.md)**: Configuração do ambiente e como adicionar novas heurísticas.
