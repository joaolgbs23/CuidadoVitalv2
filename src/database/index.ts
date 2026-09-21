/**
 * Acesso ao banco SQLite local do aplicativo.
 */
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrations';

export const DATABASE_NAME = 'cuidadovital.db';

let instancia: SQLiteDatabase | null = null;
let aberturaEmAndamento: Promise<SQLiteDatabase> | null = null;

/**
 * Prepara a conexao: ativa chaves estrangeiras (o SQLite deixa desligado por
 * padrao) e WAL, que reduz bloqueio entre leitura e escrita.
 */
export async function configureDatabase(db: SQLiteDatabase): Promise<void> {
    // WAL e so otimizacao de concorrencia e nem todo backend aceita (o SQLite
    // compilado para WebAssembly, por exemplo). Falhar aqui nao pode impedir o
    // uso do aplicativo.
    try {
        await db.execAsync('PRAGMA journal_mode = WAL;');
    } catch (erro) {
        console.warn('Nao foi possivel ativar o modo WAL; seguindo sem ele.', erro);
    }

    // Esta, sim, e obrigatoria: sem ela o SQLite ignora as chaves estrangeiras e
    // sessoes ficariam orfas ao remover um usuario.
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await migrate(db);
}

/**
 * Devolve a conexao unica do app, abrindo e migrando na primeira chamada.
 * Chamadas simultaneas compartilham a mesma promessa para nao abrir o banco duas
 * vezes nem rodar as migracoes em paralelo.
 */
export async function getDatabase(): Promise<SQLiteDatabase> {
    if (instancia) {
        return instancia;
    }

    if (!aberturaEmAndamento) {
        aberturaEmAndamento = (async () => {
            const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
            try {
                await configureDatabase(db);
            } catch (erro) {
                await db.closeAsync().catch(() => undefined);
                throw erro;
            }
            instancia = db;
            return db;
        })().finally(() => {
            aberturaEmAndamento = null;
        });
    }

    return aberturaEmAndamento;
}

/** Fecha a conexao. Usado em testes e ao trocar o banco em tempo de execucao. */
export async function closeDatabase(): Promise<void> {
    if (instancia) {
        await instancia.closeAsync();
        instancia = null;
    }
}

export { migrate } from './migrations';
