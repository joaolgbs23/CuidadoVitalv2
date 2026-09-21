# Scripts de verificação

Estes scripts rodam a lógica de banco e de senha **fora do aplicativo**, no Node,
para que dê para conferir o comportamento sem abrir um emulador.

```bash
npm run verificar          # roda os dois
npm run verificar:crypto   # SHA-256 / HMAC / PBKDF2 contra o módulo `crypto` do Node
npm run verificar:auth     # migrações, cadastro, login e sessão sobre SQLite real
```

Como funciona: `shims/` troca `expo-crypto` e `expo-sqlite` por equivalentes do
Node (`node:crypto` e `node:sqlite`). O SQL e as regras testadas são exatamente
os mesmos que rodam no aparelho — só a ponte nativa é substituída. As trocas são
feitas por `paths` no `tsconfig.json` desta pasta.

`verificar:crypto` é o que garante que a implementação de SHA-256 escrita à mão
em `src/security/sha256.ts` bate byte a byte com a do Node, incluindo todos os
tamanhos de mensagem de 0 a 200 bytes (o padding do SHA-256 tem casos de borda
justamente nesses limites).

## `npm run verificar:web` — o app de verdade, no navegador

```bash
npm run verificar:web
```

Os scripts acima trocam `expo-sqlite` pelo shim do Node, então **não enxergam
diferenças do expo-sqlite entre plataformas**. Este aqui gera o build web,
sobe um servidor com os cabeçalhos COOP/COEP que o SQLite em WebAssembly exige,
e dirige o app no Chromium: cadastro, sessão sobrevivendo a um reload, logout,
senha errada e senha certa. Ele também falha se qualquer erro aparecer no
console do navegador.

Foi esse teste que pegou a migração chamando `withExclusiveTransactionAsync`,
que não existe na web e travava o app inteiro na tela de erro do banco — com
`expo export` e os dois scripts de Node passando normalmente.

Precisa de um Chromium. Ou `npx playwright install chromium`, ou aponte um que
já exista:

```bash
CHROMIUM_PATH=/caminho/para/chrome npm run verificar:web
```
