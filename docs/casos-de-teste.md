# Casos de Teste — CuidadoVital

Complementa o [plano de testes](plano-de-testes.md). Cada caso segue a estrutura
definida pela disciplina: módulo, objetivo, tipos de teste aplicados,
ferramentas e ambiente, pré-condição, passos de execução e avaliação.

## Convenções comuns a todos os casos

Para não repetir a cada caso, valem em todos, salvo indicação em contrário.

**Ferramentas e Ambiente**

| Item | Valor |
|---|---|
| Runtime | Node.js 22 |
| Executor dos testes | `tsx` (TypeScript) e Node |
| Banco nos testes automatizados | `node:sqlite`, pelos shims em `tests/shims/` |
| Banco no aplicativo | `expo-sqlite` (SQLite nativo / WebAssembly na web) |
| Navegador | Chromium, instalado por `playwright-core` |
| Execução contínua | GitHub Actions (`.github/workflows/ci.yml`) |
| Registro de defeitos | Issues do GitHub |

> O modelo da disciplina cita Selenium, Appium, Jira e TestRail. **Este projeto
> não usa nenhuma dessas ferramentas** — a tabela acima lista o que é
> efetivamente utilizado.

**Registro de Resultados.** As três suítes imprimem `ok` ou `FAIL` por asserção
e encerram com código de saída diferente de zero em caso de falha. Cada execução
do CI fica registrada no GitHub Actions e vinculada ao commit.

**Ação em Caso de Falha.** Abrir issue no GitHub com passos de reprodução,
resultado esperado, resultado obtido, ambiente e severidade. A correção só é
aceita acompanhada do teste que pega o defeito, e o reteste ocorre
automaticamente no próximo push.

## Índice

| ID | Caso | Tipo | Automatizado |
|---|---|---|---|
| CT-01 | Cadastro de usuário com dados válidos | Caixa Preta / Fumaça | Sim |
| CT-02 | Cadastro com CPF inválido | Caixa Branca | Sim |
| CT-03 | Cadastro com e-mail ou CPF já existente | Caixa Branca | Sim |
| CT-04 | Cadastro com senha fraca ou confirmação divergente | Caixa Branca | Sim |
| CT-05 | Cadastro sem aceitar os Termos | Caixa Preta | Sim |
| CT-06 | Autenticação com credenciais válidas por e-mail | Caixa Preta / Fumaça | Sim |
| CT-07 | Autenticação por CPF, com e sem máscara | Caixa Branca | Sim |
| CT-08 | Autenticação com senha incorreta | Caixa Preta | Sim |
| CT-09 | Não divulgação de contas existentes | Caixa Branca / Regressão | Sim |
| CT-10 | Permanência da sessão após reabrir o aplicativo | Caixa Preta | Sim |
| CT-11 | Encerramento de sessão | Caixa Preta | Sim |
| CT-12 | Expiração de sessão | Caixa Branca | Sim |
| CT-13 | Senha nunca armazenada em texto claro | Caixa Branca | Sim |
| CT-14 | Integridade das primitivas de criptografia | Caixa Branca | Sim |
| CT-15 | Migração do banco e integridade referencial | Caixa Branca | Sim |
| CT-16 | Inicialização do banco na plataforma web | Caixa Preta / Regressão | Sim |
| CT-M01 a CT-M06 | Casos manuais | Caixa Preta | **Não** |

---

## CT-01 — Cadastro de usuário com dados válidos

- **Módulo:** Registro e autenticação.
- **Objetivo:** Verificar que uma conta é criada, persistida no banco e que o
  usuário é autenticado automaticamente em seguida.
- **Tipos de Teste Aplicados:**
  - Caixa Preta, avaliando o fluxo pela interface sem conhecer a implementação.
  - Fumaça, por ser o caminho mínimo que precisa funcionar para o aplicativo ter
    utilidade.
- **Pré-condição:** Aplicativo instalado e banco vazio (nenhuma conta com o
  mesmo e-mail ou CPF).

**Passos de Execução**

1. Abrir o aplicativo e aguardar a tela de login.
2. Tocar em *Cadastre-se*.
3. Preencher o nome completo (`Maria Silva Santos`).
4. Preencher o CPF (`529.982.247-25`).
5. Preencher o e-mail (`maria@exemplo.com`).
6. Preencher a senha (`senha1234`) e a confirmação.
7. Marcar a aceitação dos Termos e Condições.
8. Tocar em *Cadastrar*.

**Resultados e Avaliação**

- **Resultado Esperado:** A conta é gravada na tabela `usuarios`, a sessão é
  aberta e a tela inicial exibe o nome do usuário, sem exigir novo login.
- **Implementação:** `tests/verificar-auth.mts` (cadastro e persistência) e
  `tests/verificar-web.mjs` (fluxo completo no navegador).

---

## CT-02 — Cadastro com CPF inválido

- **Módulo:** Registro e autenticação — validação de entrada.
- **Objetivo:** Garantir que o CPF é validado pelos dois dígitos verificadores e
  que sequências repetidas são recusadas, impedindo conta com documento falso.
- **Tipos de Teste Aplicados:** Caixa Branca, exercitando diretamente a função
  de validação com valores de fronteira.
- **Pré-condição:** Nenhuma.

**Passos de Execução**

1. Submeter o cadastro com CPF de dígito verificador incorreto (`529.982.247-24`).
2. Submeter com CPF de dígitos repetidos (`111.111.111-11`).
3. Submeter com CPF de menos de 11 dígitos (`1234567890`).
4. Submeter com CPF válido (`529.982.247-25`) como controle.

**Resultados e Avaliação**

- **Resultado Esperado:** Os três primeiros são recusados com a mensagem
  `CPF inválido.` e **nada é gravado no banco**. O quarto é aceito.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-03 — Cadastro com e-mail ou CPF já existente

- **Módulo:** Registro e autenticação — unicidade.
- **Objetivo:** Impedir duas contas com o mesmo e-mail ou o mesmo CPF.
- **Tipos de Teste Aplicados:** Caixa Branca, verificando tanto a mensagem
  quanto o estado do banco após a tentativa.
- **Pré-condição:** Uma conta já cadastrada.

**Passos de Execução**

1. Tentar cadastrar outra conta com o mesmo e-mail.
2. Tentar cadastrar outra conta com o mesmo CPF.
3. Consultar a quantidade de registros na tabela `usuarios`.

**Resultados e Avaliação**

- **Resultado Esperado:** `Já existe uma conta com este e-mail.` e
  `Já existe uma conta com este CPF.`, respectivamente. A contagem de usuários
  permanece inalterada.
- **Observação:** A garantia final é a restrição `UNIQUE` no banco; a checagem
  em código existe para produzir mensagem legível.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-04 — Cadastro com senha fraca ou confirmação divergente

- **Módulo:** Registro e autenticação — política de senha.
- **Objetivo:** Verificar o mínimo de 8 caracteres, a exigência de ao menos uma
  letra e um número, e a conferência da confirmação.
- **Tipos de Teste Aplicados:** Caixa Branca, com valores de fronteira.
- **Pré-condição:** Nenhuma.

**Passos de Execução**

1. Submeter senha com menos de 8 caracteres (`Ab1`).
2. Submeter senha sem número (`somenteletras`).
3. Submeter senha sem letra (`12345678`).
4. Submeter senha válida com confirmação diferente.
5. Submeter senha válida com confirmação igual (`senha1234`), como controle.

**Resultados e Avaliação**

- **Resultado Esperado:** Mensagens específicas por caso —
  `A senha precisa ter pelo menos 8 caracteres.`,
  `A senha precisa ter pelo menos um número.`,
  `A senha precisa ter pelo menos uma letra.` e `As senhas não conferem.`
  Nenhuma conta é criada nos quatro primeiros. O quinto é aceito.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-05 — Cadastro sem aceitar os Termos

- **Módulo:** Registro e autenticação — conformidade.
- **Objetivo:** Garantir que a conta não é criada sem aceite explícito dos
  Termos e Condições.
- **Tipos de Teste Aplicados:** Caixa Preta, pela interface.
- **Pré-condição:** Formulário de cadastro preenchido corretamente, com a caixa
  dos Termos **desmarcada**.

**Passos de Execução**

1. Preencher todos os campos com dados válidos.
2. Deixar a caixa dos Termos desmarcada.
3. Tocar em *Cadastrar*.

**Resultados e Avaliação**

- **Resultado Esperado:** Mensagem
  `É preciso aceitar os Termos e Condições para criar a conta.` e nenhuma
  gravação no banco. O cálculo do hash sequer é iniciado.
- **Implementação:** `tests/verificar-web.mjs`.

---

## CT-06 — Autenticação com credenciais válidas por e-mail

- **Módulo:** Registro e autenticação.
- **Objetivo:** Verificar o login com e-mail válido e senha correta, incluindo
  tolerância a maiúsculas e espaços nas pontas.
- **Tipos de Teste Aplicados:**
  - Caixa Preta, avaliando a funcionalidade sem conhecer a implementação.
  - Fumaça, por ser o caminho crítico do aplicativo.
- **Pré-condição:** Conta previamente criada (CT-01).

**Passos de Execução**

1. Abrir o aplicativo na tela de login.
2. Inserir o e-mail com variação de caixa e espaços (` MARIA@exemplo.com `).
3. Inserir a senha correta.
4. Tocar em *Entrar*.

**Resultados e Avaliação**

- **Resultado Esperado:** Login bem-sucedido. A sessão é gravada e a tela
  inicial exibe nome, e-mail e CPF do usuário.
- **Implementação:** `tests/verificar-auth.mts` e `tests/verificar-web.mjs`.

---

## CT-07 — Autenticação por CPF, com e sem máscara

- **Módulo:** Registro e autenticação.
- **Objetivo:** Verificar que o mesmo campo aceita CPF além de e-mail, nas duas
  formas de digitação.
- **Tipos de Teste Aplicados:** Caixa Branca, exercitando o reconhecimento do
  identificador e a normalização antes da consulta.
- **Pré-condição:** Conta previamente criada.

**Passos de Execução**

1. Inserir o CPF com máscara (`529.982.247-25`) e a senha correta.
2. Encerrar a sessão.
3. Inserir o CPF sem máscara (`52998224725`) e a senha correta.

**Resultados e Avaliação**

- **Resultado Esperado:** Login bem-sucedido nas duas formas, para o mesmo
  usuário.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-08 — Autenticação com senha incorreta

- **Módulo:** Registro e autenticação.
- **Objetivo:** Garantir que credencial inválida é recusada e que a mensagem não
  informa qual dos dois campos está errado.
- **Tipos de Teste Aplicados:** Caixa Preta.
- **Pré-condição:** Conta previamente criada.

**Passos de Execução**

1. Inserir e-mail correto e senha incorreta.
2. Tocar em *Entrar*.
3. Repetir com o campo de identificador vazio.
4. Repetir com o campo de senha vazio.

**Resultados e Avaliação**

- **Resultado Esperado:** Passo 2 exibe `E-mail, CPF ou senha incorretos.`,
  sem distinguir o campo. Passos 3 e 4 exibem `Informe seu e-mail ou CPF.` e
  `Informe sua senha.` Nenhuma sessão é aberta em nenhum caso.
- **Implementação:** `tests/verificar-auth.mts` e `tests/verificar-web.mjs`.

---

## CT-09 — Não divulgação de contas existentes

- **Módulo:** Registro e autenticação — segurança.
- **Objetivo:** Garantir que não é possível descobrir quais contas existem no
  aparelho, nem pela mensagem nem pelo **tempo de resposta**.
- **Tipos de Teste Aplicados:**
  - Caixa Branca, medindo o tempo de execução da operação.
  - Regressão, por corrigir defeito já encontrado e corrigido.
- **Pré-condição:** Uma conta cadastrada e um identificador sabidamente
  inexistente.

**Passos de Execução**

1. Tentar login na conta existente com senha errada, cinco vezes, medindo o
   tempo de cada tentativa.
2. Tentar login com identificador inexistente, cinco vezes, medindo o tempo.
3. Comparar as mensagens de erro.
4. Comparar a mediana dos tempos das duas séries.

**Resultados e Avaliação**

- **Resultado Esperado:** Mensagens idênticas, e razão entre as medianas
  **menor que 2×**.
- **Contexto:** Antes da correção a mensagem já era a mesma, mas os tempos eram
  de 0,1 ms contra 625 ms — diferença de milhares de vezes, suficiente para
  enumerar contas. O caso falha se a razão voltar a ultrapassar 2×.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-10 — Permanência da sessão após reabrir o aplicativo

- **Módulo:** Gerenciamento de sessão.
- **Objetivo:** Verificar que o usuário continua autenticado ao reabrir o
  aplicativo, sem digitar a senha novamente.
- **Tipos de Teste Aplicados:** Caixa Preta.
- **Pré-condição:** Usuário autenticado, com sessão válida.

**Passos de Execução**

1. Autenticar no aplicativo.
2. Fechar e reabrir o aplicativo (na web, recarregar a página).
3. Observar a tela apresentada.

**Resultados e Avaliação**

- **Resultado Esperado:** A tela inicial aparece diretamente, com os dados do
  mesmo usuário. A sessão é válida por 30 dias.
- **Implementação:** `tests/verificar-auth.mts` e `tests/verificar-web.mjs`.

---

## CT-11 — Encerramento de sessão

- **Módulo:** Gerenciamento de sessão.
- **Objetivo:** Verificar que *Sair* remove a sessão em uso do banco e que
  apenas ela é removida.
- **Tipos de Teste Aplicados:** Caixa Preta, com inspeção do banco ao final.
- **Pré-condição:** Usuário autenticado, com mais de uma sessão registrada.

**Passos de Execução**

1. Autenticar no aplicativo.
2. Tocar em *Sair*.
3. Consultar a tabela `sessoes`.
4. Reabrir o aplicativo.

**Resultados e Avaliação**

- **Resultado Esperado:** A tela de login volta. Somente a sessão utilizada é
  removida; as demais permanecem. Após remover todas, a recuperação de sessão
  retorna vazio.
- **Implementação:** `tests/verificar-auth.mts` e `tests/verificar-web.mjs`.

---

## CT-12 — Expiração de sessão

- **Módulo:** Gerenciamento de sessão.
- **Objetivo:** Garantir que sessão vencida não autentica e é removida do banco.
- **Tipos de Teste Aplicados:** Caixa Branca, inserindo sessão com data de
  expiração no passado.
- **Pré-condição:** Usuário cadastrado.

**Passos de Execução**

1. Inserir na tabela `sessoes` um registro com `expira_em` no passado.
2. Executar a recuperação de sessão.
3. Consultar a tabela `sessoes`.

**Resultados e Avaliação**

- **Resultado Esperado:** A recuperação retorna vazio e o registro vencido é
  apagado, para o banco não crescer sem controle.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-13 — Senha nunca armazenada em texto claro

- **Módulo:** Segurança — armazenamento de credenciais.
- **Objetivo:** Garantir que a senha digitada não é recuperável do banco e que
  cada conta tem salt próprio.
- **Tipos de Teste Aplicados:** Caixa Branca, inspecionando diretamente o
  conteúdo gravado.
- **Pré-condição:** Nenhuma.

**Passos de Execução**

1. Cadastrar um usuário com senha conhecida.
2. Ler a coluna `senha_hash` do registro.
3. Verificar que o valor difere da senha digitada.
4. Verificar o formato `pbkdf2-sha256$40000$<salt>$<hash>`.
5. Cadastrar um segundo usuário com a **mesma** senha e comparar os hashes.

**Resultados e Avaliação**

- **Resultado Esperado:** O hash nunca contém a senha. O formato é respeitado.
  Dois usuários com a mesma senha produzem hashes diferentes, provando que o
  salt é por conta.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-14 — Integridade das primitivas de criptografia

- **Módulo:** Segurança — SHA-256, HMAC e PBKDF2.
- **Objetivo:** Garantir que as implementações escritas em TypeScript produzem
  exatamente a mesma saída de uma implementação de referência.
- **Tipos de Teste Aplicados:** Caixa Branca, comparando contra oráculo externo.
- **Pré-condição:** Nenhuma.
- **Ferramentas e Ambiente:** Módulo `crypto` do Node como referência.

**Passos de Execução**

1. Calcular SHA-256 de mensagens de **todos** os tamanhos de 0 a 200 bytes e
   comparar com o Node.
2. Calcular HMAC-SHA256 com chaves menores, iguais e maiores que o bloco de 64
   bytes e comparar.
3. Derivar PBKDF2 com diferentes contagens de iteração e tamanhos de saída e
   comparar.
4. Verificar conversão hexadecimal de ida e volta e comparação de bytes.

**Resultados e Avaliação**

- **Resultado Esperado:** Igualdade byte a byte em todos os casos.
- **Justificativa da varredura exaustiva:** foi essa varredura que revelou um
  erro de padding do SHA-256 em mensagens de exatamente 55 bytes — tamanho que
  um conjunto de valores escolhido manualmente dificilmente cobriria.
- **Implementação:** `tests/verificar-crypto.mts`.

---

## CT-15 — Migração do banco e integridade referencial

- **Módulo:** Banco de dados.
- **Objetivo:** Verificar que o esquema é criado corretamente, que a migração
  pode ser executada repetidamente sem efeito colateral, e que a integridade
  referencial está ativa.
- **Tipos de Teste Aplicados:** Caixa Branca.
- **Pré-condição:** Banco novo, vazio.

**Passos de Execução**

1. Abrir o banco e executar as migrações.
2. Verificar `PRAGMA user_version`.
3. Verificar a existência das tabelas `usuarios` e `sessoes`.
4. Executar as migrações uma segunda vez.
5. Verificar `PRAGMA foreign_keys`.
6. Cadastrar um usuário, criar sessão, apagar o usuário e consultar `sessoes`.

**Resultados e Avaliação**

- **Resultado Esperado:** Versão igual à mais recente; as duas tabelas existem;
  a segunda execução não altera nada; `foreign_keys` igual a 1; e apagar o
  usuário apaga as sessões dele por `ON DELETE CASCADE`.
- **Implementação:** `tests/verificar-auth.mts`.

---

## CT-16 — Inicialização do banco na plataforma web

- **Módulo:** Banco de dados — compatibilidade entre plataformas.
- **Objetivo:** Garantir que o banco abre e migra no navegador, onde o SQLite
  roda compilado para WebAssembly.
- **Tipos de Teste Aplicados:**
  - Caixa Preta, observando o comportamento do aplicativo real.
  - Regressão, por corrigir defeito que inutilizava o aplicativo na web.
- **Pré-condição:** Build web gerado e servido com os cabeçalhos COOP e COEP.
- **Ferramentas e Ambiente:** Chromium real, dirigido por `playwright-core`.

**Passos de Execução**

1. Gerar o build web.
2. Servir o resultado com `Cross-Origin-Opener-Policy` e
   `Cross-Origin-Embedder-Policy`.
3. Abrir a aplicação no navegador.
4. Monitorar o console do navegador durante toda a execução.
5. Executar o fluxo completo de cadastro e login.

**Resultados e Avaliação**

- **Resultado Esperado:** A tela de login aparece, o cadastro grava e o login
  funciona. **Nenhum erro no console** — o caso falha também por isso.
- **Contexto:** A migração usava `withExclusiveTransactionAsync`, inexistente na
  web, e o aplicativo parava na tela de erro do banco. O `expo export` compilava
  sem reclamar e as suítes de Node passavam. Com o defeito reintroduzido, esta
  suíte acusa 10 falhas.
- **Implementação:** `tests/verificar-web.mjs`.

---

# Casos manuais

Sem automação. Precisam ser executados à mão e o resultado registrado na ata da
semana. Estão separados de propósito: o documento não apresenta como executado
aquilo que ninguém executou.

## CT-M01 — Instalação a partir do zero

- **Módulo:** Distribuição.
- **Objetivo:** Confirmar que um integrante consegue rodar o projeto em máquina
  limpa seguindo apenas o README.
- **Tipos de Teste Aplicados:** Caixa Preta, do ponto de vista de quem instala.
- **Pré-condição:** Máquina sem o projeto. Node.js 20 ou superior instalado.

**Passos de Execução**

1. Baixar o repositório (ZIP ou `git clone`).
2. Executar `npm install`.
3. Executar `npm run web`.
4. Criar uma conta e autenticar.

**Resultado Esperado:** O aplicativo abre no navegador e o cadastro funciona,
sem passo não documentado no README.

## CT-M02 — Execução em aparelho Android físico

- **Módulo:** Compatibilidade.
- **Objetivo:** Verificar o funcionamento em Android real, fora do navegador.
- **Tipos de Teste Aplicados:** Caixa Preta.
- **Pré-condição:** Aparelho Android com Expo Go, na mesma rede do computador.

**Passos de Execução**

1. Executar `npm start`.
2. Ler o QR code com o Expo Go.
3. Executar cadastro, login, fechamento e reabertura do aplicativo.

**Resultado Esperado:** Mesmo comportamento da web, com a sessão persistindo
entre aberturas.

**Observação:** Em rede com isolamento de clientes, usar `npx expo start --tunnel`.

## CT-M03 — Execução em aparelho iOS físico

Idêntico ao CT-M02, em aparelho iOS com Expo Go.

## CT-M04 — Independência dos bancos locais

- **Módulo:** Banco de dados — limitação declarada.
- **Objetivo:** Confirmar que o banco é local e que **não há** compartilhamento
  de contas entre navegadores, aparelhos ou pessoas.
- **Tipos de Teste Aplicados:** Caixa Preta.
- **Pré-condição:** Dois navegadores diferentes na mesma máquina.

**Passos de Execução**

1. Cadastrar uma conta no primeiro navegador.
2. Abrir a aplicação no segundo navegador.
3. Tentar autenticar com a conta criada no passo 1.

**Resultado Esperado:** A autenticação **falha**. Este é o comportamento
correto e esperado para um banco local — ver as limitações em
[`banco-de-dados.md`](banco-de-dados.md).

## CT-M05 — Teclado virtual não encobre os campos

- **Módulo:** Interface.
- **Objetivo:** Verificar que o campo em foco permanece visível com o teclado
  virtual aberto.
- **Tipos de Teste Aplicados:** Caixa Preta, em aparelho real.
- **Pré-condição:** Aplicativo aberto em celular.

**Passos de Execução**

1. Abrir a tela de cadastro.
2. Tocar em cada campo, do primeiro ao último.
3. Observar se o campo em foco continua visível.

**Resultado Esperado:** Nenhum campo é encoberto pelo teclado.

## CT-M06 — Leitor de tela

- **Módulo:** Acessibilidade.
- **Objetivo:** Verificar se os campos e botões são anunciados corretamente.
- **Tipos de Teste Aplicados:** Caixa Preta.
- **Pré-condição:** TalkBack (Android) ou VoiceOver (iOS) ativado.

**Passos de Execução**

1. Percorrer a tela de login com o leitor de tela.
2. Percorrer a tela de cadastro.
3. Verificar o anúncio do estado da caixa dos Termos e das mensagens de erro.

**Resultado Esperado:** Todos os elementos interativos são anunciados com
rótulo compreensível.

**Situação:** Acessibilidade não foi avaliada nesta versão — risco R9 do plano.
Este caso tende a encontrar problemas.

---

# Tipos de teste não aplicados

Declarados para evitar a impressão de cobertura que não existe.

| Tipo | Situação |
|---|---|
| **Teste de Carga** | **Não se aplica.** O banco é local e de usuário único; não há servidor nem concorrência entre usuários. |
| **Teste de Integração com API** | **Não se aplica.** O projeto não possui servidor. |
| **Teste de Segurança por terceiro** | Não realizado. Ver riscos R1 e R3 do plano. |

---

# Defeitos conhecidos sem caso de teste

| Defeito | Risco | Por que não há teste |
|---|---|---|
| `nomeValido` aceita `"12 34"` e `"!! @@"` — não exige letras | R5 | Defeito confirmado por execução e **não corrigido**. Escrever o teste agora deixaria a suíte vermelha. |
| Cadastro revela contas existentes, anulando o CT-09 | R4 | Depende de decisão de produto ainda em aberto. |
| "Esqueceu a senha?" é texto sem ação | R6 | Funcionalidade não implementada. |

---

# Rastreabilidade

| Requisito | Casos de teste |
|---|---|
| UC01 — Criar conta | CT-01, CT-02, CT-03, CT-04, CT-05, CT-13 |
| UC02 — Entrar | CT-06, CT-07, CT-08, CT-09 |
| UC03 — Permanecer logado | CT-10, CT-12 |
| UC04 — Sair | CT-11 |
| Senha nunca em texto claro | CT-13, CT-14 |
| Integridade do banco | CT-15, CT-16 |
| Distribuição e compatibilidade | CT-M01, CT-M02, CT-M03, CT-M04 |
| Acessibilidade | CT-M06 |

Casos de uso em [`casos-de-uso.md`](casos-de-uso.md).

---

# Execução

```bash
npm run verificar      # CT-01 a CT-04, CT-06 a CT-15
npm run verificar:web  # CT-01, CT-05, CT-06, CT-08, CT-10, CT-11, CT-16
```

CT-01, CT-06, CT-08, CT-10 e CT-11 são cobertos pelas duas suítes: a de
integração verifica o efeito no banco, a de interface verifica o fluxo que o
usuário percorre.

Ambas rodam automaticamente a cada push e pull request. Cobertura total medida
por execução: **39 asserções unitárias, 52 de integração e 9 passos de
interface**.
