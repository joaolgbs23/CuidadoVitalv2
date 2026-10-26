# Casos de uso

## Implementados

### UC01 — Criar conta

**Ator:** visitante
**Pré-condição:** não está logado

1. Abre o app e toca em *Cadastre-se*.
2. Preenche nome, CPF, e-mail, senha e confirmação.
3. Aceita os Termos e Condições.
4. Toca em *Cadastrar*.
5. O sistema valida os campos, confere duplicidade, gera o hash e grava.
6. A sessão é aberta e a tela inicial aparece.

**Fluxos alternativos:** qualquer validação que falhe destaca o campo e
interrompe, sem gravar nada. Ver [`regras-de-negocio.md`](regras-de-negocio.md).

### UC02 — Entrar

**Ator:** usuário cadastrado
**Pré-condição:** conta existe neste aparelho

1. Digita e-mail **ou** CPF e a senha.
2. Toca em *Entrar*.
3. O sistema localiza a conta, confere a senha e abre a sessão.

**Alternativo:** credencial incorreta mostra `E-mail, CPF ou senha incorretos.`,
sem dizer qual dos dois está errado.

### UC03 — Permanecer logado

**Ator:** usuário com sessão válida

Ao abrir o app, o sistema procura uma sessão não expirada e vai direto à tela
inicial, sem pedir a senha. Vale por 30 dias.

### UC04 — Sair

**Ator:** usuário logado

Toca em *Sair*. A sessão é removida do banco e a tela de login volta.

## Não implementados

| Caso | Situação |
|---|---|
| Recuperar senha | O link existe na tela mas não tem ação. Exige servidor de e-mail. |
| Editar perfil | Não iniciado. |
| Registrar dados de saúde | Não iniciado. Depende de resolver a LGPD (ver `banco-de-dados.md`). |
