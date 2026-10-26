# Arquitetura

## Camadas

O aplicativo separa interface, regra de negócio e acesso a dados. Uma tela nunca
escreve SQL: ela chama uma função de serviço, que chama um repositório.

```
App.tsx                      decide a tela a partir da sessão
  └── src/pages/             telas (login, cadastro, início)
        └── src/contexts/    AuthContext: estado da sessão
              └── src/services/autenticacao.ts   regras de cadastro e login
                    ├── src/security/            hash de senha
                    └── src/database/            repositórios e migrações
                          └── expo-sqlite        banco no aparelho
```

| Pasta | Responsabilidade |
|---|---|
| `src/pages/` | Telas. Só exibem e coletam dados. |
| `src/components/` | Componentes reutilizáveis (`Input`). |
| `src/contexts/` | `AuthContext`: abre o banco, guarda a sessão. |
| `src/services/` | Regras de cadastro, login, sessão. Lançam `AuthError`. |
| `src/database/` | Todo o SQL do projeto, isolado em repositórios. |
| `src/security/` | SHA-256, HMAC e PBKDF2 em TypeScript. |
| `src/utils/` | Validação e formatação (CPF, e-mail, senha, nome). |
| `src/global/` | Tema (cores, espaçamentos). |

**Por que o SQL fica só em `src/database/`:** trocar o banco no futuro, ou migrar
para um servidor, significa reescrever uma pasta — não caçar `SELECT` espalhado
pelas telas.

**Por que `AuthError` em vez de `Error`:** carrega um `code` e o `campo` do
formulário que causou o erro. É o que permite a tela destacar o input certo em
vez de mostrar um alerta genérico.

## Escolhas de tecnologia

| Tecnologia | Motivo |
|---|---|
| **Expo (SDK 57)** | Roda em Android, iOS e web com um só código e exige apenas Node instalado. React Native puro exigiria Android Studio ou Xcode, inviável em máquina de laboratório. |
| **TypeScript** | Erros de tipo aparecem antes de rodar. Pegou um método ausente no shim de testes que passaria em silêncio. |
| **SQLite (`expo-sqlite`)** | Único banco relacional de verdade que roda sem servidor e sem custo. Permite SQL real: migrações, chave estrangeira, restrição `UNIQUE`. |
| **Context API** | Há um único estado global — a sessão. Redux seria burocracia sem retorno. |
| **Sem biblioteca de rotas** | Provisório. `App.tsx` troca de tela com `useState`. É a primeira coisa a trocar quando o app crescer. |

## Limitações conhecidas

1. **A criptografia é escrita à mão.** O `expo-crypto` da SDK 57 expõe apenas
   `digest`, `getRandomBytes` e `randomUUID` — não tem derivação de chave. Como
   uma chamada nativa por iteração levaria segundos, SHA-256, HMAC e PBKDF2
   estão em TypeScript. Isso contraria a recomendação de nunca escrever a
   própria criptografia. A mitigação é `tests/verificar-crypto.mts`, que compara
   byte a byte com o módulo `crypto` do Node em todo tamanho de 0 a 200 bytes.
   Na web existia alternativa nativa (`crypto.subtle.deriveBits`) que não foi
   usada; em nativo, as alternativas exigiriam build de desenvolvimento e
   quebrariam o Expo Go.

2. **40.000 iterações de PBKDF2 é pouco.** Recomendações atuais para servidor
   estão na casa das centenas de milhares. E ainda assim custa cerca de 600ms de
   espera na tela. É o preço de rodar em JavaScript.

3. **Isto não substitui autenticação em servidor.** Ver
   [`banco-de-dados.md`](banco-de-dados.md).
