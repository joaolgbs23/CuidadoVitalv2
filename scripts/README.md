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
