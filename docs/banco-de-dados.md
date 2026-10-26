# Banco de dados

Banco **local, no aparelho**, via `expo-sqlite`. Não há servidor.

## Modelo

```
┌────────────────────────┐          ┌────────────────────────┐
│ usuarios               │          │ sessoes                │
├────────────────────────┤          ├────────────────────────┤
│ id            TEXT PK  │◄────┐    │ id          TEXT PK    │
│ nome          TEXT     │     └────│ usuario_id  TEXT FK    │
│ cpf           TEXT UQ  │          │ criada_em   TEXT       │
│ email         TEXT UQ  │          │ expira_em   TEXT       │
│ senha_hash    TEXT     │          └────────────────────────┘
│ criado_em     TEXT     │           ON DELETE CASCADE
│ atualizado_em TEXT     │
└────────────────────────┘
```

As restrições `UNIQUE` em `cpf` e `email` são a garantia real contra conta
duplicada. A checagem no código existe só para dar mensagem melhor ao usuário.

`ON DELETE CASCADE` depende de `PRAGMA foreign_keys = ON`, que o SQLite deixa
desligado por padrão — por isso `src/database/index.ts` liga explicitamente.

## Migrações

Controladas por `PRAGMA user_version`, que o próprio SQLite guarda no arquivo.
Cada migração roda uma única vez, em ordem, dentro de uma transação.

**Para evoluir o schema, acrescente uma entrada no fim de `MIGRATIONS`. Nunca
edite uma migração já publicada** — aparelhos que já rodaram a versão antiga não
voltariam a executá-la.

| Versão | Conteúdo |
|---|---|
| 1 | Tabelas `usuarios` e `sessoes`, índice em `sessoes.usuario_id` |

### Transação exclusiva

A web não suporta `withExclusiveTransactionAsync` — o SQLite compilado para
WebAssembly não abre transação exclusiva. O código testa o suporte uma vez e
cai para `withTransactionAsync` quando falta. Sem esse desvio o app trava na
tela de erro do banco no navegador.

## Senhas

Nunca em texto claro. Formato guardado:

```
pbkdf2-sha256$40000$<salt em hex>$<hash em hex>
```

Cada conta tem salt próprio. O número de iterações fica gravado no registro, o
que permite aumentar o custo no futuro sem invalidar contas existentes —
`needsRehash()` detecta e `entrar()` regera o hash no próximo login.

O login gasta o mesmo tempo quando a conta não existe e quando a senha está
errada. Sem isso, a mensagem de erro seria idêntica mas o relógio entregaria
quais contas existem: 0,1ms contra 625ms.

## Limitações

Isto é um banco **local, por aparelho**:

- Os dados não saem do aparelho e **não sincronizam** entre dispositivos.
- Cada pessoa, em cada navegador, tem o seu banco. Conta criada no Chrome não
  aparece no Edge.
- Desinstalar o app apaga tudo. **Não há recuperação de senha.**
- **O arquivo do banco não é criptografado.** Em aparelho com root ou jailbreak
  ele pode ser lido. O hash protege as senhas, não os demais dados.
- Dado de saúde é dado sensível pela LGPD. Antes de guardar qualquer informação
  clínica aqui, o caminho é mover a autenticação para um servidor e cifrar o
  banco. A SDK 57 passou a trazer AES-GCM no `expo-crypto`, que é um caminho
  nativo para isso.
