# UX Auditor Extension

**UX Auditor Extension** é uma ferramenta de auditoria de interface avançada que captura a experiência de uso do usuário no navegador de forma estruturada. Diferente de ferramentas de replay tradicionais, esta extensão enriquece os dados com contexto semântico, métricas comportamentais e heurísticas automatizadas.

## Principais Funcionalidades

-   **Replay de Sessão (rrweb)**: Captura fiel da interação visual e interativa.
-   **Contexto Semântico**: Mapeamento de landmarks, papéis ARIA e nomes acessíveis.
-   **Métricas Comportamentais**: Velocidade do ponteiro, zig-zag score, hesitação em campos e fluxo de foco.
-   **Heurísticas Automatizadas**: Identificação de *rage clicks*, *dead clicks* e abandono de campos.
-   **Auditoria de Acessibilidade**: Integração com `axe-core` para triagem WCAG em tempo real.
-   **Privacidade por Design**: Mascaramento seletivo de dados sensíveis diretamente no coletor.

## Desenvolvimento

O projeto utiliza **Vite**, **React** e **@crxjs/vite-plugin**.

```bash
npm install
npm run dev   # Inicia o modo de desenvolvimento
npm run build # Gera a build para produção em dist/
```

## Documentação Técnica Detalhada

Para entender a arquitetura interna e as heurísticas implementadas, consulte o [Sumário da Documentação](docs/README.md).

---

© 2026 UX Auditor Project. Desenvolvido para fins de pesquisa em Interação Humano-Computador.
