# Regras de negócio

Implementadas em `src/services/autenticacao.ts` e `src/utils/validacao.ts`.
Todas são cobertas por `tests/verificar-auth.mts`.

## Cadastro

| Campo | Regra | Mensagem |
|---|---|---|
| Nome | Duas ou mais partes, cada uma com 2+ caracteres | `Informe o nome completo.` |
| CPF | 11 dígitos, dois dígitos verificadores válidos, não pode ser sequência repetida | `CPF inválido.` |
| E-mail | Um `@`, algo antes, domínio com ponto | `E-mail inválido.` |
| Senha | Mínimo 8 caracteres, ao menos uma letra e um número | `A senha precisa ter pelo menos 8 caracteres.` |
| Confirmação | Igual à senha | `As senhas não conferem.` |
| E-mail único | Não pode haver outra conta | `Já existe uma conta com este e-mail.` |
| CPF único | Não pode haver outra conta | `Já existe uma conta com este CPF.` |
| Termos | Precisa estar aceito | `É preciso aceitar os Termos e Condições para criar a conta.` |

Normalizações antes de gravar: e-mail em minúsculas e sem espaços nas pontas;
CPF só com dígitos; nome com espaços repetidos colapsados.

A validação acontece **antes** do cálculo do hash, que é a parte cara.

Cadastro bem-sucedido já abre sessão — o usuário não precisa logar em seguida.

## Login

Aceita **e-mail ou CPF** no mesmo campo. O CPF é reconhecido com ou sem máscara.

| Situação | Mensagem |
|---|---|
| Campo vazio | `Informe seu e-mail ou CPF.` |
| Senha vazia | `Informe sua senha.` |
| Conta inexistente | `E-mail, CPF ou senha incorretos.` |
| Senha errada | `E-mail, CPF ou senha incorretos.` |

As duas últimas são **propositalmente idênticas**, para não revelar quais contas
existem no aparelho. O tempo de resposta também é igualado.

> **Inconsistência conhecida:** o cadastro responde `Já existe uma conta com
> este e-mail.`, o que permite descobrir contas por outro caminho. Corrigir isso
> piora a experiência de quem está se cadastrando; a decisão ainda está aberta.

## Sessão

- Dura **30 dias**. O usuário continua logado ao reabrir o app.
- É gravada na tabela `sessoes` com UUID.
- Sessões vencidas são apagadas a cada abertura e a cada login.
- `Sair` remove apenas a sessão em uso.
- Remover um usuário apaga as sessões dele por `ON DELETE CASCADE`.
