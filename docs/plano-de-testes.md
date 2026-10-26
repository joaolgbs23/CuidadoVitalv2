# Plano de Testes — CuidadoVital

| | |
|---|---|
| **Projeto** | CuidadoVital — aplicativo de saúde em React Native / Expo |
| **Versão do plano** | 1.0 |
| **Responsável** | *a preencher* |
| **Data** | *a preencher* |

---

## 1. Objetivo

Definir o que é testado no CuidadoVital, como, por quem e sob qual critério de
aceite — e registrar honestamente **o que ainda não é testado**.

Este plano descreve testes que **existem e executam**. Cada caso em
[`casos-de-teste.md`](casos-de-teste.md) aponta para o arquivo e a asserção que
o implementam. Itens não implementados estão na seção 8, separados.

## 2. Escopo

### 2.1 Dentro do escopo

| Área | Justificativa |
|---|---|
| Primitivas de criptografia | SHA-256, HMAC e PBKDF2 são escritos à mão. Erro aqui compromete todas as senhas. |
| Hash e verificação de senha | Formato armazenado, salt por conta, rehash por custo. |
| Migrações do banco | Precisam ser idempotentes e funcionar nas três plataformas. |
| Validação de entrada | CPF, e-mail, senha, nome — regras de negócio. |
| Cadastro | Validação, duplicidade, persistência. |
| Login | E-mail ou CPF, senha correta e incorreta, mensagens. |
| Sessão | Criação, recuperação, expiração, logout. |
| Integridade referencial | Chave estrangeira e `ON DELETE CASCADE`. |
| Interface | Fluxo completo no navegador, com SQLite real. |
| Build | Android, iOS e web compilam. |

### 2.2 Fora do escopo

| Área | Motivo |
|---|---|
| Teste em aparelho físico Android/iOS | Sem dispositivo dedicado nem conta de distribuição. |
| Teste de carga | Banco local, usuário único. Não se aplica. |
| Teste de API | Não há servidor. |
| Recuperação de senha | Funcionalidade não implementada. |
| Acessibilidade | Não avaliado nesta versão. Reconhecido como lacuna. |

## 3. Estratégia

Três níveis, do mais barato ao mais caro:

| Nível | Arquivo | Como roda | Tempo |
|---|---|---|---|
| **Unitário** | `tests/verificar-crypto.mts` | Node, sem app | ~2s |
| **Integração** | `tests/verificar-auth.mts` | Node + SQLite real | ~10s |
| **Interface (UI)** | `tests/verificar-web.mjs` | Chromium real, app rodando | ~60s |

### 3.1 Por que os dois primeiros rodam fora do aplicativo

`tests/shims/` substitui `expo-crypto` e `expo-sqlite` por `node:crypto` e
`node:sqlite`. **O SQL e as regras testadas são exatamente os mesmos** que
rodam no aparelho — só a ponte nativa muda. Isso permite rodar sem emulador.

### 3.2 Por que o teste de interface é indispensável

Os shims não enxergam diferenças do `expo-sqlite` entre plataformas. Um bug real
já explorou exatamente essa cegueira: a migração chamava
`withExclusiveTransactionAsync`, que **não existe na web**, e o aplicativo
travava na tela de erro do banco. O `expo export` compilava sem reclamar e as
duas primeiras suítes passavam. Só o teste no navegador pegou.

**Lição incorporada ao plano: compilar não é evidência de funcionar.**

### 3.3 Oráculo das primitivas de criptografia

`verificar-crypto` não confere a saída contra valores escritos à mão: compara
byte a byte com o módulo `crypto` do Node, em **todo tamanho de mensagem de 0 a
200 bytes**. Foi o que revelou um erro de padding do SHA-256 em mensagens de
exatamente 55 bytes — tamanho que um conjunto de testes escolhido a dedo
dificilmente cobriria.

## 4. Ambiente

| Item | Versão |
|---|---|
| Node.js | 20 ou superior (CI usa 22) |
| Expo SDK | 57 |
| React Native | 0.86 |
| Navegador (UI) | Chromium, instalado por `playwright-core` |
| Sistema (CI) | `ubuntu-latest` |

```bash
npm install
npm run typecheck                        # tipos do aplicativo
npx tsc --noEmit -p tests/tsconfig.json  # tipos dos testes
npm run verificar                        # unitário + integração
npm run verificar:web                    # interface
```

## 5. Execução automatizada

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) roda **a cada push e a
cada pull request** para `main` e `develop`, em três jobs paralelos:

| Job | Conteúdo |
|---|---|
| `Testes e tipos` | Dois typechecks + unitário + integração |
| `Teste de interface no navegador` | Instala Chromium e roda o app |
| `Build das tres plataformas` | `expo export` para android, ios e web |

Nenhum pull request entra em `develop` ou `main` com CI vermelho.

## 6. Critérios

### 6.1 Entrada

- O código compila (`npm run typecheck` nas duas configurações).
- `npm install` conclui sem erro.

### 6.2 Saída

- As três suítes passam, com **zero** falhas.
- O teste de interface não registra **nenhum erro no console do navegador** —
  ele falha também por isso, não só por asserção.
- Os três `expo export` concluem.

### 6.3 Suspensão e retomada

Falha em typecheck ou em `npm install` **suspende** a execução: não faz sentido
rodar o resto. Retoma quando o build volta a passar.

## 7. Cobertura atual

| Suíte | Asserções |
|---|---|
| Unitário (`verificar-crypto`) | 39 |
| Integração (`verificar-auth`) | 52 |
| Interface (`verificar-web`) | 9 passos |
| **Total** | **100** |

Contagem obtida executando as suítes, não estimada.

## 8. Riscos e lacunas conhecidas

Declarados abertamente. Nenhum está coberto por teste hoje.

| # | Risco | Severidade | Situação |
|---|---|---|---|
| R1 | Criptografia escrita à mão. `expo-crypto` da SDK 57 não expõe derivação de chave. | Alta | Mitigado por comparação byte a byte com o Node, não eliminado. |
| R2 | 40.000 iterações de PBKDF2 — abaixo das recomendações atuais para servidor. | Média | Aceito. Custo de rodar em JavaScript. |
| R3 | Banco local **não criptografado**. Dado de saúde é sensível pela LGPD. | Alta | Aceito nesta fase. Exige servidor e cifragem. |
| R4 | Cadastro revela contas existentes (`Já existe uma conta com este e-mail.`), anulando a proteção equivalente do login. | Média | **Em aberto.** Decisão de produto pendente. |
| R5 | `nomeValido` não exige letras: aceita `"12 34"` e até `"!! @@"`. Só conta duas partes de 2+ caracteres. | Baixa | **Defeito confirmado por execução, sem correção.** |
| R6 | "Esqueceu a senha?" é texto sem ação. | Baixa | Funcionalidade não implementada. |
| R7 | Nenhum teste em aparelho físico Android ou iOS. | Média | Fora do escopo por falta de recurso. |
| R8 | Componentes de interface não têm teste isolado — só o fluxo completo. | Baixa | Aceito para o tamanho atual. |
| R9 | Acessibilidade não avaliada. | Média | Lacuna reconhecida. |

## 9. Responsabilidades

| Papel | Responsável | Atribuição |
|---|---|---|
| Elaboração do plano | *a preencher* | Manter este documento |
| Execução | *a preencher* | Rodar as suítes antes de abrir PR |
| Revisão de PR | *a preencher* | Conferir CI verde e checklist |
| Registro de defeitos | *a preencher* | Abrir issue para cada falha |

## 10. Registro de defeitos

Cada defeito encontrado vira uma issue no GitHub com: passos para reproduzir,
resultado esperado, resultado obtido, ambiente e severidade. Defeito corrigido
só fecha **acompanhado do teste que o pega** — foi assim com os dois bugs já
corrigidos no projeto.
