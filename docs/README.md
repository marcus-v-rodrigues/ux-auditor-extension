# Documentação Técnica - UX Auditor Extension

## Índice

Esta pasta reúne a documentação técnica do projeto UX Auditor Extension, atualizada para refletir a implementação atual da extensão e sua cadeia de análise local.

### Documentos Disponíveis

| Arquivo | Título | Descrição |
|---------|--------|-----------|
| [00-visao-geral-sistema.md](./00-visao-geral-sistema.md) | Visão Geral do Sistema | Introdução, arquitetura macroscópica, fluxo de dados, privacidade e stack tecnológico |
| [01-manifesto.md](./01-manifesto.md) | Manifesto da Extensão | Análise do `manifest.json`, permissões e configuração do Manifest V3 |
| [02-service-worker.md](./02-service-worker.md) | Service Worker | Orquestração, persistência de estado, mensagens e finalização da sessão |
| [03-content-script.md](./03-content-script.md) | Content Script | Captura com rrweb, heurísticas, acessibilidade, perfis de valor e exportação |
| [04-interface-popup.md](./04-interface-popup.md) | Interface do Popup | Fluxo do `Popup.jsx`, estado da UI e comunicação com o background |
| [05-sistema-build.md](./05-sistema-build.md) | Sistema de Build | Dependências, Vite, CRXJS e pipeline de desenvolvimento/build |
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

Os documentos Markdown podem ser convertidos para LaTeX com ferramentas como:

```bash
pandoc 00-visao-geral-sistema.md -o visao-geral.tex
```

### 2. Fórmulas Matemáticas

As fórmulas já estão em sintaxe LaTeX (`$ $` e `$$ $$`), prontas para uso direto.

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

- **Chrome Extensions Manifest V3**
- **rrweb**
- **React 19**
- **Vite 7**
- **CRXJS**
- **axe-core**

### APIs Chrome

- `chrome.storage`
- `chrome.runtime`
- `chrome.tabs`
- `chrome.action`
- `chrome.scripting`
- `chrome.downloads`

### Web APIs

- Service Workers
- MutationObserver
- ResizeObserver
- Blob
- URL.createObjectURL

## Contato e Manutenção

Esta documentação acompanha o projeto de mestrado e deve ser mantida sincronizada com o código-fonte sempre que o fluxo de captura, exportação ou heurísticas mudar.

---

*Documentação atualizada em: Abril de 2026*
