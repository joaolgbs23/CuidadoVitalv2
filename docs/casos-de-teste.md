# Casos de Teste — CuidadoVital

Complementa o [plano de testes](plano-de-testes.md).

**Convenção:** a coluna *Implementação* aponta o arquivo que executa o caso.
Casos marcados **NÃO AUTOMATIZADO** são de execução manual e estão separados na
seção 6 — eles não têm código por trás, e o documento não finge que têm.

| Prefixo | Nível | Arquivo |
|---|---|---|
| `CT-CR` | Unitário — criptografia | `tests/verificar-crypto.mts` |
| `CT-VL` | Unitário — validação | `tests/verificar-auth.mts` |
| `CT-BD` | Integração — banco | `tests/verificar-auth.mts` |
| `CT-CA` | Integração — cadastro | `tests/verificar-auth.mts` |
| `CT-LG` | Integração — login | `tests/verificar-auth.mts` |
| `CT-SE` | Integração — sessão | `tests/verificar-auth.mts` |
| `CT-UI` | Interface | `tests/verificar-web.mjs` |
| `CT-MN` | Manual | — |

---

## 1. Criptografia

| ID | Caso | Entrada | Resultado esperado | Implementação |
|---|---|---|---|---|
| CT-CR-01 | SHA-256 bate com o Node | Mensagens de vários tamanhos | Hash idêntico ao `node:crypto` | `verificar-crypto` |
| CT-CR-02 | SHA-256 em **todos** os tamanhos de 0 a 200 bytes | 201 mensagens | Todos idênticos ao Node | `verificar-crypto` |
| CT-CR-03 | HMAC-SHA256 com chave menor que o bloco | Chave de 1 a 63 bytes | Idêntico ao Node | `verificar-crypto` |
| CT-CR-04 | HMAC com chave igual ao bloco | Chave de 64 bytes | Idêntico ao Node | `verificar-crypto` |
| CT-CR-05 | HMAC com chave maior que o bloco | Chave de 65 e 200 bytes | Idêntico ao Node | `verificar-crypto` |
| CT-CR-06 | PBKDF2 com 1 iteração | `1it, 32B` | Idêntico ao Node | `verificar-crypto` |
| CT-CR-07 | PBKDF2 com muitas iterações | `4096it, 32B` | Idêntico ao Node | `verificar-crypto` |
| CT-CR-08 | PBKDF2 com saída maior que um bloco | `4096it, 40B` / `1000it, 64B` | Idêntico ao Node | `verificar-crypto` |
| CT-CR-09 | Conversão hex ida e volta | Bytes aleatórios | Mesmos bytes de volta | `verificar-crypto` |
| CT-CR-10 | Comparação de bytes | Iguais, diferentes, tamanhos distintos | `true` / `false` / `false` | `verificar-crypto` |
| CT-CR-11 | Codificação UTF-8 | Textos com acento e emoji | Mesmos bytes do Node | `verificar-crypto` |

## 2. Validação de entrada

| ID | Caso | Entrada | Resultado esperado | Implementação |
|---|---|---|---|---|
| CT-VL-01 | CPF válido aceito | `529.982.247-25` | Aceito | `verificar-auth` |
| CT-VL-02 | CPF com dígito verificador errado | `529.982.247-24` | Rejeitado | `verificar-auth` |
| CT-VL-03 | CPF de dígitos repetidos | `111.111.111-11` | Rejeitado | `verificar-auth` |
| CT-VL-04 | CPF curto | `1234567890` | Rejeitado | `verificar-auth` |
| CT-VL-05 | Máscara de CPF completa | `52998224725` | `529.982.247-25` | `verificar-auth` |
| CT-VL-06 | Máscara parcial durante digitação | `5299` | `529.9` | `verificar-auth` |
| CT-VL-07 | Máscara descarta excesso | `529982247259999` | `529.982.247-25` | `verificar-auth` |
| CT-VL-08 | E-mail válido com maiúsculas | `Maria.Silva@Exemplo.com.br` | Aceito | `verificar-auth` |
| CT-VL-09 | E-mail sem domínio completo | `maria@exemplo` | Rejeitado | `verificar-auth` |
| CT-VL-10 | E-mail sem arroba | `mariaexemplo.com` | Rejeitado | `verificar-auth` |
| CT-VL-11 | Senha curta | `Ab1` | Rejeitada | `verificar-auth` |
| CT-VL-12 | Senha sem número | `somenteletras` | Rejeitada | `verificar-auth` |
| CT-VL-13 | Senha sem letra | `12345678` | Rejeitada | `verificar-auth` |
| CT-VL-14 | Senha válida | `senha1234` | Aceita | `verificar-auth` |
| CT-VL-15 | Nome com uma só parte | `Maria` | Rejeitado | `verificar-auth` |
| CT-VL-16 | Nome completo | `Maria Silva` | Aceito | `verificar-auth` |
| CT-VL-17 | CPF reconhecido só com 11 dígitos | `529.982.247-25` vs `a@b.com` | `true` / `false` | `verificar-auth` |

## 3. Banco de dados

| ID | Caso | Pré-condição | Resultado esperado | Implementação |
|---|---|---|---|---|
| CT-BD-01 | Migração grava a versão | Banco novo | `user_version` = versão mais recente | `verificar-auth` |
| CT-BD-02 | Tabelas criadas | Migração aplicada | `usuarios` e `sessoes` existem | `verificar-auth` |
| CT-BD-03 | Migração é idempotente | Migração já aplicada | Rodar de novo não altera nada | `verificar-auth` |
| CT-BD-04 | Chaves estrangeiras ligadas | Conexão aberta | `PRAGMA foreign_keys` = 1 | `verificar-auth` |
| CT-BD-05 | `ON DELETE CASCADE` | Usuário com sessão | Apagar o usuário apaga as sessões | `verificar-auth` |

## 4. Cadastro

| ID | Caso | Entrada | Resultado esperado | Implementação |
|---|---|---|---|---|
| CT-CA-01 | Cadastro válido retorna usuário | Dados corretos | Usuário com id, nome, cpf, email | `verificar-auth` |
| CT-CA-02 | E-mail normalizado | ` Maria@EXEMPLO.com ` | Gravado em minúsculas, sem espaços | `verificar-auth` |
| CT-CA-03 | CPF gravado só com dígitos | `529.982.247-25` | `52998224725` | `verificar-auth` |
| CT-CA-04 | Usuário persistido | Cadastro feito | Linha presente na tabela | `verificar-auth` |
| CT-CA-05 | **Senha nunca em texto claro** | Cadastro feito | `senha_hash` ≠ senha digitada | `verificar-auth` |
| CT-CA-06 | Formato do hash | Cadastro feito | `pbkdf2-sha256$40000$<salt>$<hash>` | `verificar-auth` |
| CT-CA-07 | Salt diferente por conta | Duas contas, mesma senha | Hashes diferentes | `verificar-auth` |
| CT-CA-08 | E-mail duplicado | E-mail já cadastrado | `Já existe uma conta com este e-mail.` | `verificar-auth` |
| CT-CA-09 | CPF duplicado | CPF já cadastrado | `Já existe uma conta com este CPF.` | `verificar-auth` |
| CT-CA-10 | Nome incompleto | `Joao` | `Informe o nome completo.` | `verificar-auth` |
| CT-CA-11 | CPF inválido | `111.111.111-11` | `CPF inválido.` | `verificar-auth` |
| CT-CA-12 | E-mail inválido | `joao@gmail` | `E-mail inválido.` | `verificar-auth` |
| CT-CA-13 | Senha fraca | `123` | `A senha precisa ter pelo menos 8 caracteres.` | `verificar-auth` |
| CT-CA-14 | Confirmação divergente | Senhas diferentes | `As senhas não conferem.` | `verificar-auth` |
| CT-CA-15 | Cadastro inválido não grava | Qualquer erro acima | Nenhum usuário extra criado | `verificar-auth` |

## 5. Login e sessão

| ID | Caso | Entrada | Resultado esperado | Implementação |
|---|---|---|---|---|
| CT-LG-01 | Login por e-mail, com variação | ` MARIA@exemplo.com ` | Entra | `verificar-auth` |
| CT-LG-02 | Login por CPF com máscara | `529.982.247-25` | Entra | `verificar-auth` |
| CT-LG-03 | Login por CPF sem máscara | `52998224725` | Entra | `verificar-auth` |
| CT-LG-04 | Senha errada | Senha incorreta | `E-mail, CPF ou senha incorretos.` | `verificar-auth` |
| CT-LG-05 | Conta inexistente | E-mail não cadastrado | **Mesma** mensagem de CT-LG-04 | `verificar-auth` |
| CT-LG-06 | Identificador vazio | `""` | `Informe seu e-mail ou CPF.` | `verificar-auth` |
| CT-LG-07 | Senha vazia | `""` | `Informe sua senha.` | `verificar-auth` |
| CT-LG-08 | **Tempo não revela conta existente** | Conta existente vs inexistente | Razão entre os tempos < 2× | `verificar-auth` |
| CT-SE-01 | Sessão recuperada ao reabrir | Sessão válida | Mesmo usuário, sem pedir senha | `verificar-auth` |
| CT-SE-02 | Sair remove só a sessão usada | Várias sessões | As demais permanecem | `verificar-auth` |
| CT-SE-03 | Sem sessão após sair de todas | Todas removidas | `recuperarSessao()` → `null` | `verificar-auth` |
| CT-SE-04 | Sessão expirada é ignorada | `expira_em` no passado | `recuperarSessao()` → `null` | `verificar-auth` |
| CT-SE-05 | Sessão expirada é apagada | `expira_em` no passado | Removida da tabela | `verificar-auth` |

> **CT-LG-08 é teste de regressão.** O login já respondia a mesma mensagem nos
> dois casos, mas levava 0,1ms para conta inexistente e 625ms para senha errada
> — diferença de milhares de vezes, suficiente para descobrir quais contas
> existem. O caso falha se a razão voltar a passar de 2×.

## 6. Interface

Executados num Chromium real, com o app rodando e SQLite de verdade.
**Falham também se qualquer erro aparecer no console do navegador.**

| ID | Caso | Passos | Resultado esperado | Implementação |
|---|---|---|---|---|
| CT-UI-01 | App abre e o banco inicializa | Abrir a aplicação | Tela "Bem-vindo de volta" | `verificar-web` |
| CT-UI-02 | Navegar para o cadastro | Tocar em *Cadastre-se* | Tela "Crie Sua Conta" | `verificar-web` |
| CT-UI-03 | Preencher o formulário | Nome, CPF, e-mail, senha, confirmação | Campos aceitam o conteúdo | `verificar-web` |
| CT-UI-04 | Termos são obrigatórios | *Cadastrar* sem aceitar | Mensagem exigindo os Termos | `verificar-web` |
| CT-UI-05 | Cadastro grava e já loga | Aceitar termos e *Cadastrar* | Tela inicial com o nome | `verificar-web` |
| CT-UI-06 | Sessão sobrevive ao recarregar | Recarregar a página | Continua logado | `verificar-web` |
| CT-UI-07 | Sair volta ao login | Tocar em *Sair* | Tela "Bem-vindo de volta" | `verificar-web` |
| CT-UI-08 | Senha errada é recusada | Entrar com senha incorreta | `E-mail, CPF ou senha incorretos.` | `verificar-web` |
| CT-UI-09 | Senha certa entra | Entrar com a senha correta | Tela inicial com o nome | `verificar-web` |

> **CT-UI-01 é teste de regressão.** A migração usava
> `withExclusiveTransactionAsync`, inexistente na web, e o app parava na tela de
> erro do banco. Com o bug reintroduzido, esta suíte acusa 10 falhas.

## 7. Casos manuais — NÃO AUTOMATIZADOS

Sem código por trás. Precisam ser executados à mão e o resultado registrado na
ata da semana.

| ID | Caso | Passos | Resultado esperado | Situação |
|---|---|---|---|---|
| CT-MN-01 | Instalação do zero | Baixar o ZIP, `npm install`, `npm run web` | App abre no navegador | A executar |
| CT-MN-02 | Expo Go em Android físico | `npm start`, ler o QR code | App abre e o cadastro funciona | A executar |
| CT-MN-03 | Expo Go em iOS físico | Idem | Idem | A executar |
| CT-MN-04 | Bancos independentes | Cadastrar no Chrome, abrir no Edge | A conta **não** aparece | A executar |
| CT-MN-05 | Teclado não cobre os campos | Focar cada campo no celular | Campo permanece visível | A executar |
| CT-MN-06 | Leitor de tela | Navegar o cadastro com TalkBack/VoiceOver | Campos anunciados corretamente | A executar — ver risco R9 |

## 8. Defeitos conhecidos sem caso de teste

Lacunas declaradas. Ver seção 8 do [plano](plano-de-testes.md).

| Defeito | Risco | Por que não há teste |
|---|---|---|
| `nomeValido` aceita `"12 34"` e `"!! @@"` | R5 | Defeito confirmado e **não corrigido**. Escrever o teste antes da correção deixaria a suíte vermelha. |
| Cadastro revela contas existentes | R4 | Depende de decisão de produto ainda em aberto. |
| "Esqueceu a senha?" sem ação | R6 | Funcionalidade não implementada. |

## 9. Rastreabilidade

| Requisito | Casos de teste |
|---|---|
| UC01 — Criar conta | CT-CA-01 a CT-CA-15, CT-UI-02 a CT-UI-05 |
| UC02 — Entrar | CT-LG-01 a CT-LG-08, CT-UI-08, CT-UI-09 |
| UC03 — Permanecer logado | CT-SE-01, CT-SE-04, CT-SE-05, CT-UI-06 |
| UC04 — Sair | CT-SE-02, CT-SE-03, CT-UI-07 |
| Senha nunca em texto claro | CT-CA-05, CT-CA-06, CT-CA-07, CT-CR-01 a CT-CR-08 |
| Integridade do banco | CT-BD-01 a CT-BD-05 |

Casos de uso em [`casos-de-uso.md`](casos-de-uso.md).
