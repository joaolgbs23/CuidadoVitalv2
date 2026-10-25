/**
 * Consultas da tabela `sessoes`.
 *
 * A sessao e o que mantem o usuario logado depois de fechar o aplicativo: ao
 * abrir, o app procura uma sessao valida em vez de pedir a senha de novo.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import type { UsuarioRow } from './usuarioRepository';

export type SessaoComUsuario = UsuarioRow & {
    sessao_id: string;
    expira_em: string;
};

export async function criarSessao(
    db: SQLiteDatabase,
    sessaoId: string,
    usuarioId: string,
    expiraEm: Date,
): Promise<void> {
    await db.runAsync(
        'INSERT INTO sessoes (id, usuario_id, criada_em, expira_em) VALUES (?, ?, ?, ?);',
        [sessaoId, usuarioId, new Date().toISOString(), expiraEm.toISOString()],
    );
}

/**
 * Devolve a sessao valida mais recente junto com o usuario dono dela.
 * Compara as datas em formato ISO 8601 UTC, que ordena corretamente como texto.
 */
export function buscarSessaoValida(db: SQLiteDatabase): Promise<SessaoComUsuario | null> {
    return db.getFirstAsync<SessaoComUsuario>(
        `SELECT u.*, s.id AS sessao_id, s.expira_em
           FROM sessoes s
           JOIN usuarios u ON u.id = s.usuario_id
          WHERE s.expira_em > ?
          ORDER BY s.criada_em DESC
          LIMIT 1;`,
        [new Date().toISOString()],
    );
}

export async function removerSessao(db: SQLiteDatabase, sessaoId: string): Promise<void> {
    await db.runAsync('DELETE FROM sessoes WHERE id = ?;', [sessaoId]);
}

/** Limpa sessoes vencidas para o arquivo do banco nao crescer sem controle. */
export async function removerSessoesExpiradas(db: SQLiteDatabase): Promise<void> {
    await db.runAsync('DELETE FROM sessoes WHERE expira_em <= ?;', [new Date().toISOString()]);
}
