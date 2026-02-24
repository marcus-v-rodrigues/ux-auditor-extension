# Documentação Técnica - UX Auditor Extension

## Índice

Esta pasta contém a documentação técnica completa do projeto UX Auditor Extension, desenvolvida para suportar a escrita de uma monografia em LaTeX.

### Documentos Disponíveis

| Arquivo | Título | Descrição |
|---------|--------|-----------|
| [00-visao-geral-sistema.md](./00-visao-geral-sistema.md) | Visão Geral do Sistema | Introdução, arquitetura macroscópica, fluxo de dados e stack tecnológico |
| [01-manifesto.md](./01-manifesto.md) | Manifesto da Extensão | Análise do manifest.json, permissões e configurações do Manifest V3 |
| [02-service-worker.md](./02-service-worker.md) | Service Worker | Documentação do background.js, orquestração e persistência de estado |
| [03-content-script.md](./03-content-script.md) | Content Script | Documentação do content.js e biblioteca rrweb para captura de sessões |
| [04-interface-popup.md](./04-interface-popup.md) | Interface do Popup | Documentação do Popup.jsx, React hooks e sistema de design |
| [05-sistema-build.md](./05-sistema-build.md) | Sistema de Build | Análise do package.json, vite.config.js e pipeline de build |
| [06-referencias.md](./06-referencias.md) | Referências Bibliográficas | Referências formatadas para BibTeX e ABNT |

## Estrutura Recomendada para Monografia

```latex
\chapter{Desenvolvimento da Ferramenta}
\section{Visão Geral do Sistema}
    % Usar conteúdo de 00-visao-geral-sistema.md
\section{Arquitetura da Extensão}
    \subsection{Configuração e Manifesto}
        % Usar conteúdo de 01-manifesto.md
    \subsection{Service Worker}
        % Usar conteúdo de 02-service-worker.md
    \subsection{Content Script}
        % Usar conteúdo de 03-content-script.md
    \subsection{Interface do Usuário}
        % Usar conteúdo de 04-interface-popup.md
\section{Infraestrutura de Desenvolvimento}
    % Usar conteúdo de 05-sistema-build.md
\section{Considerações de Privacidade}
    % Distribuído ao longo dos documentos
```

## Como Utilizar

### 1. Conversão para LaTeX

Os documentos Markdown podem ser convertidos para LaTeX utilizando ferramentas como:

```bash
pandoc 00-visao-geral-sistema.md -o visao-geral.tex
```

### 2. Fórmulas Matemáticas

As fórmulas já estão em sintaxe LaTeX ($ $ e $$ $$), prontas para uso direto.

### 3. Citações

Use as chaves de citação fornecidas:

```latex
\cite{chrome_extensions_mv3}
\cite{rrweb2019}
\cite{react2024}
\cite{vite2024}
```

## Tecnologias Documentadas

### Principais

- **Chrome Extensions Manifest V3**: Plataforma de extensões do Chrome
- **rrweb**: Biblioteca de gravação e reprodução de sessões web
- **React 19**: Biblioteca de interface de usuário
- **Vite 7**: Build tool moderno

### APIs Chrome

- chrome.storage
- chrome.runtime
- chrome.tabs
- chrome.action
- chrome.scripting

### Web APIs

- Service Workers
- MutationObserver
- Blob
- URL.createObjectURL

## Contato e Manutenção

Esta documentação foi gerada como parte do projeto de mestrado. Para atualizações ou correções, consulte o repositório principal do projeto.

---

*Documentação gerada em: Fevereiro de 2024*
