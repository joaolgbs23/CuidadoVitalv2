# Geração dos PDFs de entrega

Converte [`plano-de-testes.md`](../plano-de-testes.md) e
[`casos-de-teste.md`](../casos-de-teste.md) em PDF com capa acadêmica, sumário
e numeração de páginas.

```bash
node docs/pdf/gerar.mjs
```

Os arquivos saem em `docs/pdf/saida/` (fora do controle de versão).

## Antes da primeira execução

| Requisito | Como instalar |
|---|---|
| `pandoc` | `sudo apt install pandoc` (ou `brew install pandoc`) |
| Chromium | `npx playwright-core install chromium` |

Se o Chromium já existir em outro lugar, aponte com `CHROMIUM_PATH`:

```bash
CHROMIUM_PATH=/caminho/para/chrome node docs/pdf/gerar.mjs
```

## Dados da capa

Edite [`capa.json`](capa.json) — **não** o script:

```json
{
  "instituicao": "...",
  "curso": "...",
  "alunos": ["Nome Um", "Nome Dois"],
  "local": "Gama-DF",
  "ano": "2026"
}
```

Com `alunos` vazio, a capa sai com um marcador destacado em amarelo e o script
avisa no terminal — para ninguém entregar sem perceber.

## Por que não LaTeX

O `pandoc` sozinho precisaria de uma distribuição TeX completa para gerar PDF.
Usar o Chromium evita essa dependência e permite estilizar com CSS comum, que
todo mundo do grupo já sabe mexer. O arquivo de estilo é
[`estilo.css`](estilo.css).
