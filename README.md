# CuidadoVital

Aplicativo de saúde em React Native com Expo (SDK 57). Permite criar conta,
entrar com e-mail ou CPF e permanecer logado entre aberturas, usando um banco
SQLite no próprio aparelho — sem servidor.

## Equipe

<!-- TODO: preencher com os integrantes do grupo antes da entrega. -->

| Integrante | GitHub | Papel |
|---|---|---|
| João Lucas | [@joaolgbs23](https://github.com/joaolgbs23) | Tech Lead |
| *a preencher* | | |
| *a preencher* | | |

## Rodando

Pré-requisito: **Node.js 20 ou superior** (`node --version`).

```bash
npm install
npm run web         # navegador, em http://localhost:8081
npm start           # Expo Go no celular, via QR code
npm run android     # emulador ou aparelho Android
npm run ios         # simulador iOS (requer macOS)
```

O banco é criado automaticamente na primeira execução. Cada pessoa, em cada
navegador ou aparelho, tem o seu — nada é compartilhado.

## Verificação

```bash
npm run typecheck      # TypeScript do aplicativo
npm run verificar      # unitários (cripto) e de integração (banco, login)
npm run verificar:web  # interface, dirigindo o app num Chromium real
```

Todas rodam automaticamente a cada push e pull request
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

Veja [`tests/README.md`](tests/README.md) para o que cada verificação cobre.

## Banco de dados

O app usa **SQLite local** no aparelho (`expo-sqlite`), arquivo `cuidadovital.db`.

| Tabela     | Para que serve                                                     |
| ---------- | ------------------------------------------------------------------ |
| `usuarios` | Conta: nome, CPF, e-mail e o **hash** da senha (nunca a senha)      |
| `sessoes`  | Mantém o usuário logado por 30 dias após fechar o app               |

O schema é versionado por `PRAGMA user_version` em `src/database/migrations.ts`.
Para mudar o banco, **acrescente** uma migração nova no fim da lista; não edite
uma migração já publicada, porque aparelhos que já rodaram a versão antiga não
voltariam a executá-la.

### Como as senhas são guardadas

Nunca em texto claro. Cada conta tem um salt próprio e a senha passa por
PBKDF2-HMAC-SHA256 com 40.000 iterações. O resultado é gravado como
`pbkdf2-sha256$40000$<salt>$<hash>`. Como o número de iterações fica dentro do
registro, dá para aumentar o custo depois sem invalidar as contas existentes: no
próximo login o hash é recalculado sozinho.

O `expo-crypto` não tem função de derivação de chave, só de digest — por isso o
PBKDF2 e o SHA-256 são implementados em `src/security/`. O
`npm run verificar:crypto` confere essa implementação byte a byte contra o módulo
`crypto` do Node.

### Limites que você precisa conhecer

Isto é um banco **local, por aparelho**:

- A conta criada em um celular **não existe** em outro. Não há sincronização.
- Desinstalar o app apaga tudo. Não há recuperação de senha de verdade.
- O arquivo do banco não é criptografado. Em um aparelho com root/jailbreak ele
  pode ser lido; o hash protege as senhas, não os demais dados.
- Dado de saúde é dado sensível pela LGPD. Antes de guardar qualquer informação
  clínica aqui, o caminho é mover a autenticação para um servidor e cifrar o
  banco (`expo-sqlite` suporta SQLCipher pelo plugin, e `expo-secure-store`
  guarda a chave).

A camada de dados está isolada em `src/database/` e `src/services/`, então trocar
o SQLite local por uma API remota mexe nesses arquivos, não nas telas.

## Estrutura

```
.github/               template de pull request e workflow de CI
assets/                ícones e splash do aplicativo
docs/                  arquitetura, banco, regras de negócio, casos de uso
src/                   código-fonte
  assets/              imagens usadas nas telas
  components/Input/    campo de texto com ícone, foco e mensagem de erro
  contexts/            AuthContext: sessão, login, cadastro, logout
  database/            conexão, migrações e consultas (SQL vive só aqui)
  global/themes.tsx    cores
  pages/               login, cadastro, inicio
  security/            SHA-256, HMAC, PBKDF2 e hash de senha
  services/            regras de cadastro e login
  utils/validacao.ts   CPF (com dígito verificador), e-mail, senha, nome
tests/                 testes unitários, de integração e de interface
```

Documentação detalhada em [`docs/`](docs/).

## Fluxo de trabalho com Git

| Branch | Papel |
|---|---|
| `main` | Produção. Só recebe código testado e aprovado. |
| `develop` | Integração. É daqui que saem as branches de trabalho. |
| `feature/<nome>` | Uma tarefa. Sai de `develop` e volta para `develop` por pull request. |
| `docs/<nome>` | Mesma regra, para mudanças só de documentação. |

Ninguém commita direto em `main` ou `develop`. Todo merge passa por pull request
com aprovação de pelo menos um outro integrante.

## Web

`expo-sqlite` roda na web via WebAssembly. O `metro.config.js` já resolve o
`.wasm` e envia os cabeçalhos COOP/COEP que o navegador exige. Em produção, esses
mesmos cabeçalhos precisam ser configurados no servidor que hospedar o site.
