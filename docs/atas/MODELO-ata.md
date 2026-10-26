# Ata de Reunião — Semana do Projeto

> **Modelo.** Copie para `docs/atas/AAAA-MM-DD-ata.md` e preencha.
> Os campos entre `< >` só podem ser preenchidos por quem participou da reunião.

---

## Identificação

| | |
|---|---|
| **Projeto** | CuidadoVital — aplicativo de saúde em React Native / Expo |
| **Disciplina** | <disciplina> |
| **Semana do Projeto** | <número ou período> |
| **Data** | <DD/MM/AAAA> |
| **Horário** | <HH:MM> às <HH:MM> |
| **Local / plataforma** | <sala, laboratório ou ferramenta de videochamada> |
| **Redator da ata** | <nome> |

## Participantes

| Nome | Matrícula | Papel | Presente |
|---|---|---|---|
| <nome> | <matrícula> | <papel> | ( ) Sim ( ) Não |
| <nome> | <matrícula> | <papel> | ( ) Sim ( ) Não |
| <nome> | <matrícula> | <papel> | ( ) Sim ( ) Não |

**Ausências justificadas:** <nomes e motivo, ou "nenhuma">

## Pauta

1. <item>
2. <item>
3. <item>

## Assuntos tratados

### 1. <título do assunto>

<o que foi discutido>

### 2. <título do assunto>

<o que foi discutido>

## Decisões

| # | Decisão | Justificativa | Responsável |
|---|---|---|---|
| D1 | <decisão> | <por quê> | <nome> |
| D2 | | | |

## Encaminhamentos

| # | Tarefa | Responsável | Prazo | Situação |
|---|---|---|---|---|
| E1 | <tarefa> | <nome> | <DD/MM> | Pendente |
| E2 | | | | |

## Pendências da reunião anterior

| Tarefa | Responsável | Situação |
|---|---|---|
| <tarefa> | <nome> | ( ) Concluída ( ) Em andamento ( ) Não iniciada |

## Próxima reunião

| | |
|---|---|
| **Data** | <DD/MM/AAAA> |
| **Horário** | <HH:MM> |
| **Pauta prevista** | <itens> |

---

## Assinaturas

Os participantes abaixo declaram estar de acordo com o registrado nesta ata.

| Nome | Assinatura |
|---|---|
| <nome> | ______________________________ |
| <nome> | ______________________________ |
| <nome> | ______________________________ |

<cidade>, <DD> de <mês> de <AAAA>.

---

## Anexo — Entregas técnicas da semana

> Preencha com o que foi **efetivamente** entregue. Links de pull request e de
> execução de CI servem como evidência verificável.

| Entrega | Evidência | Responsável |
|---|---|---|
| <descrição> | <link do PR ou do commit> | <nome> |

### Situação dos testes

| Suíte | Asserções | Resultado |
|---|---|---|
| Unitário (`verificar-crypto`) | 39 | <passou / falhou> |
| Integração (`verificar-auth`) | 52 | <passou / falhou> |
| Interface (`verificar-web`) | 9 passos | <passou / falhou> |

**Execução de CI:** <link do GitHub Actions>

### Casos manuais executados

Ver seção 7 de [`casos-de-teste.md`](../casos-de-teste.md).

| Caso | Executado por | Resultado |
|---|---|---|
| CT-MN-01 — Instalação do zero | <nome> | <resultado> |
| CT-MN-02 — Expo Go em Android | <nome> | <resultado> |
| CT-MN-04 — Bancos independentes | <nome> | <resultado> |

### Defeitos abertos

Ver seção 8 do [`plano-de-testes.md`](../plano-de-testes.md).

| Risco | Descrição | Decisão do grupo |
|---|---|---|
| R4 | Cadastro revela contas existentes | <corrigir / aceitar / adiar> |
| R5 | `nomeValido` aceita `"12 34"` e `"!! @@"` | <corrigir / aceitar / adiar> |
| R6 | "Esqueceu a senha?" sem ação | <corrigir / aceitar / adiar> |
