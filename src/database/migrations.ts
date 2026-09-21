/**
 * Migracoes do banco local.
 *
 * O controle de versao usa `PRAGMA user_version`, que o proprio SQLite guarda no
 * arquivo. Cada entrada de `MIGRATIONS` e aplicada uma unica vez, em ordem, dentro
 * de uma transacao. Para evoluir o schema, acrescente uma nova entrada no fim da
 * lista - nunca edite uma migracao ja publicada, porque aparelhos que ja rodaram
 * a versao antiga nao voltariam a executa-la.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

type Migration = {
    version: number;
    description: string;
    statements: string[];
};

export const MIGRATIONS: Migration[] = [
    {
        version: 1,
        description: 'Tabelas de usuarios e sessoes',
        statements: [
            `CREATE TABLE IF NOT EXISTS usuarios (
                id            TEXT PRIMARY KEY NOT NULL,
                nome          TEXT NOT NULL,
                cpf           TEXT NOT NULL UNIQUE,
                email         TEXT NOT NULL UNIQUE,
                senha_hash    TEXT NOT NULL,
                criado_em     TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            );`,
            `CREATE TABLE IF NOT EXISTS sessoes (
                id         TEXT PRIMARY KEY NOT NULL,
                usuario_id TEXT NOT NULL,
                criada_em  TEXT NOT NULL,
                expira_em  TEXT NOT NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
            );`,
            `CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes (usuario_id);`,
        ],
    },
];

/** Versao de schema esperada pelo codigo desta build. */
export const LATEST_VERSION = MIGRATIONS.reduce(
    (maior, migracao) => Math.max(maior, migracao.version),
    0,
);

/**
 * `withExclusiveTransactionAsync` nao existe na versao web do expo-sqlite: o
 * SQLite compilado para WebAssembly nao abre transacao exclusiva, e a chamada
 * lanca "not supported on web". Sem este desvio o app trava na tela de erro do
 * banco no navegador.
 *
 * O suporte e testado uma unica vez, com uma transacao vazia, antes de executar
 * qualquer statement - assim uma migracao nao roda pela metade e repete depois.
 *
 * Abrir mao da exclusividade nao custa nada aqui: `getDatabase` compartilha uma
 * unica promessa de abertura, entao duas migracoes nunca correm em paralelo.
 */
let suportaTransacaoExclusiva: boolean | null = null;

async function emTransacao(
    db: SQLiteDatabase,
    tarefa: (txn: SQLiteDatabase) => Promise<void>,
): Promise<void> {
    if (suportaTransacaoExclusiva === null) {
        try {
            await db.withExclusiveTransactionAsync(async () => undefined);
            suportaTransacaoExclusiva = true;
        } catch {
            suportaTransacaoExclusiva = false;
        }
    }

    if (suportaTransacaoExclusiva) {
        await db.withExclusiveTransactionAsync(tarefa);
        return;
    }

    await db.withTransactionAsync(() => tarefa(db));
}

/**
 * Aplica as migracoes pendentes. Seguro para chamar em toda abertura do app:
 * migracoes ja aplicadas sao ignoradas.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    const versaoAtual = row?.user_version ?? 0;

    if (versaoAtual > LATEST_VERSION) {
        throw new Error(
            `Banco na versao ${versaoAtual}, mais nova que a suportada (${LATEST_VERSION}). ` +
                'Atualize o aplicativo.',
        );
    }

    for (const migracao of MIGRATIONS) {
        if (migracao.version <= versaoAtual) {
            continue;
        }

        await emTransacao(db, async (txn) => {
            for (const statement of migracao.statements) {
                await txn.execAsync(statement);
            }
        });
        // PRAGMA nao aceita parametro vinculado, e `version` vem de constante
        // interna (number), nunca de entrada do usuario.
        await db.execAsync(`PRAGMA user_version = ${migracao.version};`);
    }
}
