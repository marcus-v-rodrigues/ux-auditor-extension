# Referências Bibliográficas

Este documento consolida todas as referências citadas na documentação técnica do UX Auditor Extension, formatadas para uso em monografia LaTeX.

## 1. Formato BibTeX

As referências abaixo estão formatadas para inclusão direta em um arquivo `.bib`.

### 1.1 Tecnologias Principais

```bibtex
% ============================================================
% CHROME EXTENSIONS
% ============================================================

@online{chrome_extensions_mv3,
  author = {{Chrome Developers}},
  title = {Chrome Extensions Documentation -- Manifest V3},
  year = {2024},
  url = {https://developer.chrome.com/docs/extensions/mv3/intro/},
  note = {Acesso em: fev. 2024}
}

@online{chrome_storage_api,
  author = {{Chrome Developers}},
  title = {chrome.storage API},
  year = {2024},
  url = {https://developer.chrome.com/docs/extensions/reference/api/storage},
  note = {Acesso em: fev. 2024}
}

@online{chrome_messaging,
  author = {{Chrome Developers}},
  title = {Message Passing},
  year = {2024},
  url = {https://developer.chrome.com/docs/extensions/mv3/messaging/},
  note = {Acesso em: fev. 2024}
}

@online{chrome_action_api,
  author = {{Chrome Developers}},
  title = {chrome.action API},
  year = {2024},
  url = {https://developer.chrome.com/docs/extensions/reference/api/action},
  note = {Acesso em: fev. 2024}
}

@online{chrome_tabs_api,
  author = {{Chrome Developers}},
  title = {chrome.tabs API},
  year = {2024},
  url = {https://developer.chrome.com/docs/extensions/reference/api/tabs},
  note = {Acesso em: fev. 2024}
}

@online{chrome_scripting_api,
  author = {{Chrome Developers}},
  title = {chrome.scripting API},
  year = {2024},
  url = {https://developer.chrome.com/docs/extensions/reference/api/scripting},
  note = {Acesso em: fev. 2024}
}

% ============================================================
% RRWEB - Session Recording
% ============================================================

@misc{rrweb2019,
  author = {{rrweb Team}},
  title = {rrweb: Record and Replay the Web},
  year = {2019},
  publisher = {GitHub},
  url = {https://github.com/rrweb-io/rrweb},
  note = {Versão 2.0.0-alpha.4}
}

@online{rrweb_docs,
  author = {{rrweb Team}},
  title = {rrweb Documentation},
  year = {2024},
  url = {https://www.rrweb.io/},
  note = {Acesso em: fev. 2024}
}

% ============================================================
% ACCESSIBILITY
% ============================================================

@online{axe_core,
  author = {{Deque Systems}},
  title = {axe-core},
  year = {2024},
  url = {https://github.com/dequelabs/axe-core},
  note = {Análise automatizada de acessibilidade}
}

% ============================================================
% REACT
% ============================================================

@misc{react2024,
  author = {{Meta Platforms, Inc.}},
  title = {React: A JavaScript Library for Building User Interfaces},
  year = {2024},
  url = {https://react.dev/},
  note = {Versão 19.2.0}
}

@online{react_hooks,
  author = {{React Team}},
  title = {Introducing Hooks},
  year = {2019},
  url = {https://react.dev/reference/react},
  note = {Acesso em: fev. 2024}
}

@online{react_usestate,
  author = {{React Team}},
  title = {useState -- React},
  year = {2024},
  url = {https://react.dev/reference/react/useState},
  note = {Acesso em: fev. 2024}
}

@online{react_useeffect,
  author = {{React Team}},
  title = {useEffect -- React},
  year = {2024},
  url = {https://react.dev/reference/react/useEffect},
  note = {Acesso em: fev. 2024}
}

% ============================================================
% BUILD TOOLS
% ============================================================

@misc{vite2024,
  author = {{Vite Team}},
  title = {Vite: Next Generation Frontend Tooling},
  year = {2024},
  url = {https://vite.dev/},
  note = {Versão 7.2.4}
}

@online{vite_why,
  author = {{Evan You}},
  title = {Why Vite?},
  year = {2024},
  url = {https://vite.dev/guide/why.html},
  note = {Acesso em: fev. 2024}
}

@misc{crxjs2024,
  author = {{CRXJS Team}},
  title = {CRXJS Vite Plugin: Build Chrome Extensions with Vite},
  year = {2024},
  url = {https://crxjs.dev/vite-plugin/},
  note = {Versão 2.0.0-beta.33}
}

@misc{esbuild2020,
  author = {Evan Wallace},
  title = {esbuild: An Extremely Fast JavaScript Bundler},
  year = {2020},
  url = {https://esbuild.github.io/},
  note = {Acesso em: fev. 2024}
}

% ============================================================
% LINTING AND CODE QUALITY
% ============================================================

@misc{eslint2024,
  author = {{ESLint Team}},
  title = {ESLint: Find and Fix Problems in JavaScript Code},
  year = {2024},
  url = {https://eslint.org/},
  note = {Versão 9.39.1}
}

% ============================================================
% WEB APIS
% ============================================================

@techreport{w3c_service_workers,
  author = {Nikhil Marathe and Alex Russell and Jungkee Song},
  title = {Service Workers Nightly},
  institution = {W3C},
  year = {2024},
  url = {https://w3c.github.io/ServiceWorker/}
}

@techreport{w3c_dom4,
  author = {W3C},
  title = {DOM Standard},
  institution = {W3C},
  year = {2024},
  url = {https://dom.spec.whatwg.org/}
}

@online{mdn_mutation_observer,
  author = {{Mozilla Developer Network}},
  title = {MutationObserver API},
  year = {2024},
  url = {https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver},
  note = {Acesso em: fev. 2024}
}

@online{mdn_blob,
  author = {{Mozilla Developer Network}},
  title = {Blob API},
  year = {2024},
  url = {https://developer.mozilla.org/en-US/docs/Web/API/Blob},
  note = {Acesso em: fev. 2024}
}

@online{mdn_url_createobjecturl,
  author = {{Mozilla Developer Network}},
  title = {URL.createObjectURL()},
  year = {2024},
  url = {https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static},
  note = {Acesso em: fev. 2024}
}
```

### 1.2 Referências Acadêmicas

```bibtex
% ============================================================
% SEGURANÇA E PRIVACIDADE
% ============================================================

@article{saltzer1975protection,
  author = {Saltzer, Jerome H. and Schroeder, Michael D.},
  title = {The Protection of Information in Computer Systems},
  journal = {Proceedings of the IEEE},
  volume = {63},
  number = {9},
  pages = {1278--1308},
  year = {1975},
  doi = {10.1109/PROC.1975.9939}
}

% ============================================================
% INTERAÇÃO HUMANO-COMPUTADOR
% ============================================================

@book{nielsen1994usability,
  author = {Nielsen, Jakob},
  title = {Usability Engineering},
  publisher = {Morgan Kaufmann},
  year = {1994},
  isbn = {978-0125184069}
}

@article{nielsen1992heuristic,
  author = {Nielsen, Jakob},
  title = {Finding Usability Problems Through Heuristic Evaluation},
  journal = {Proceedings of the SIGCHI Conference on Human Factors in Computing Systems},
  pages = {373--380},
  year = {1992},
  doi = {10.1145/142750.142834}
}

@book{norman2013design,
  author = {Norman, Don},
  title = {The Design of Everyday Things: Revised and Expanded Edition},
  publisher = {Basic Books},
  year = {2013},
  isbn = {978-0465050659}
}

% ============================================================
% SESSION REPLAY E ANALYTICS
% ============================================================

@inproceedings{session_replay_privacy,
  author = {Englehardt, Steven and Narayanan, Arvind},
  title = {Online Tracking: A 1-million-site Measurement and Analysis},
  booktitle = {Proceedings of the 2016 ACM SIGSAC Conference on Computer and Communications Security},
  pages = {1388--1401},
  year = {2016},
  doi = {10.1145/2976749.2978313}
}

% ============================================================
% DESENVOLVIMENTO WEB MODERNO
% ============================================================

@book{haverbeke2018eloquent,
  author = {Haverbeke, Marijn},
  title = {Eloquent JavaScript: A Modern Introduction to Programming},
  publisher = {No Starch Press},
  year = {2018},
  edition = {3rd},
  isbn = {978-1593279509}
}
```

## 2. Formato ABNT (Para Monografia Brasileira)

Para monografias em instituições brasileiras, as referências devem seguir a norma ABNT NBR 6023. Abaixo, exemplos de conversão:

### 2.1 Tecnologias

```
CHROME DEVELOPERS. Chrome Extensions Documentation – Manifest V3. 
Disponível em: <https://developer.chrome.com/docs/extensions/mv3/intro/>. 
Acesso em: 24 fev. 2024.

RRWEB TEAM. rrweb: Record and Replay the Web. 2019. 
Disponível em: <https://github.com/rrweb-io/rrweb>. 
Acesso em: 24 fev. 2024.

META PLATFORMS, Inc. React: A JavaScript Library for Building User Interfaces. 
2024. Disponível em: <https://react.dev/>. Acesso em: 24 fev. 2024.

VITE TEAM. Vite: Next Generation Frontend Tooling. 2024. 
Disponível em: <https://vite.dev/>. Acesso em: 24 fev. 2024.
```

### 2.2 Acadêmicas

```
SALTZER, Jerome H.; SCHROEDER, Michael D. The Protection of Information in 
Computer Systems. Proceedings of the IEEE, v. 63, n. 9, p. 1278-1308, 1975.

NIELSEN, Jakob. Usability Engineering. San Francisco: Morgan Kaufmann, 1994.

NORMAN, Don. The Design of Everyday Things: Revised and Expanded Edition. 
New York: Basic Books, 2013.
```

## 3. Links Úteis

### 3.1 Documentação Oficial

| Tecnologia | URL |
|------------|-----|
| Chrome Extensions | https://developer.chrome.com/docs/extensions/ |
| React | https://react.dev/ |
| rrweb | https://www.rrweb.io/ |
| axe-core | https://github.com/dequelabs/axe-core |
| Vite | https://vite.dev/ |
| CRXJS | https://crxjs.dev/vite-plugin/ |
| ESLint | https://eslint.org/ |
| ESBuild | https://esbuild.github.io/ |

### 3.2 Especificações W3C

| Especificação | URL |
|---------------|-----|
| Service Workers | https://w3c.github.io/ServiceWorker/ |
| DOM Standard | https://dom.spec.whatwg.org/ |
| HTML Standard | https://html.spec.whatwg.org/ |

### 3.3 MDN Web Docs

| Recurso | URL |
|---------|-----|
| MutationObserver | https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver |
| Blob | https://developer.mozilla.org/en-US/docs/Web/API/Blob |
| URL API | https://developer.mozilla.org/en-US/docs/Web/API/URL |

## 4. Citações Sugeridas por Seção

### 4.1 Introdução e Contexto

```latex
\cite{nielsen1994usability} % Usabilidade
\cite{norman2013design} % Design centrado no usuário
```

### 4.2 Arquitetura da Extensão

```latex
\cite{chrome_extensions_mv3} % Manifest V3
\cite{w3c_service_workers} % Service Workers
\cite{saltzer1975protection} % Princípio de menor privilégio
```

### 4.3 Captura de Sessões

```latex
\cite{rrweb2019} % rrweb
\cite{rrweb_docs} % Documentação rrweb
\cite{w3c_dom4} % DOM Standard
\cite{mdn_mutation_observer} % MutationObserver
```

### 4.4 Interface do Usuário

```latex
\cite{react2024} % React
\cite{react_hooks} % React Hooks
```

### 4.5 Sistema de Build

```latex
\cite{vite2024} % Vite
\cite{crxjs2024} % CRXJS
\cite{esbuild2020} % ESBuild
```

### 4.6 Acessibilidade

```latex
\cite{axe_core} % axe-core
```

## 5. Notas para Compilação LaTeX

### 5.1 Configuração do Pacote BibLaTeX

```latex
\usepackage[backend=biber,style=authoryear,sorting=nyt]{biblatex}
\addbibresource{referencias.bib}
```

### 5.2 Configuração para ABNT

```latex
\usepackage[backend=biber,style=abnt]{biblatex}
\addbibresource{referencias.bib}
```

### 5.3 Comandos de Compilação

```bash
pdflatex monografia.tex
biber monografia
pdflatex monografia.tex
pdflatex monografia.tex
```

## 6. Referências Complementares

Para aprofundamento nos temas abordados:

### 6.1 UX e Usabilidade

```bibtex
@book{krug2014dont,
  author = {Krug, Steve},
  title = {Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability},
  publisher = {New Riders},
  year = {2014},
  edition = {3rd}
}

@book{garrett2010elements,
  author = {Garrett, Jesse James},
  title = {The Elements of User Experience: User-Centered Design for the Web and Beyond},
  publisher = {New Riders},
  year = {2010},
  edition = {2nd}
}
```

### 6.2 JavaScript Moderno

```bibtex
@book{simpson2015you,
  author = {Simpson, Kyle},
  title = {You Don't Know JS: ES6 \& Beyond},
  publisher = {O'Reilly Media},
  year = {2015}
}

@book{crockford2008javascript,
  author = {Crockford, Douglas},
  title = {JavaScript: The Good Parts},
  publisher = {O'Reilly Media},
  year = {2008}
}
```

### 6.3 Privacidade e Ética

```bibtex
@article{solove2006taxonomy,
  author = {Solove, Daniel J.},
  title = {A Taxonomy of Privacy},
  journal = {University of Pennsylvania Law Review},
  volume = {154},
  number = {3},
  pages = {477--560},
  year = {2006}
}
```
