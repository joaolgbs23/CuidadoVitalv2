/**
 * Consultas da tabela `usuarios`.
 *
 * Toda a escrita de SQL fica concentrada aqui: as telas e o contexto de
 * autenticacao conversam com funcoes, nunca com strings de consulta.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

/** Linha da tabela `usuarios`, incluindo o hash - nao exponha isso para a UI. */
export type UsuarioRow = {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    senha_hash: string;
    criado_em: string;
    atualizado_em: string;
};

/** Usuario sem o hash de senha, formato usado pelo restante do aplicativo. */
export type Usuario = {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    criadoEm: string;
};

export type NovoUsuario = {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    senhaHash: string;
};

/** Remove o hash antes de devolver o usuario para as camadas de cima. */
export function paraUsuario(row: UsuarioRow): Usuario {
    return {
        id: row.id,
        nome: row.nome,
        cpf: row.cpf,
        email: row.email,
        criadoEm: row.criado_em,
    };
}

export async function inserirUsuario(db: SQLiteDatabase, dados: NovoUsuario): Promise<void> {
    const agora = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO usuarios (id, nome, cpf, email, senha_hash, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [dados.id, dados.nome, dados.cpf, dados.email, dados.senhaHash, agora, agora],
    );
}

export function buscarPorEmail(db: SQLiteDatabase, email: string): Promise<UsuarioRow | null> {
    return db.getFirstAsync<UsuarioRow>('SELECT * FROM usuarios WHERE email = ?;', [email]);
}

export function buscarPorCpf(db: SQLiteDatabase, cpf: string): Promise<UsuarioRow | null> {
    return db.getFirstAsync<UsuarioRow>('SELECT * FROM usuarios WHERE cpf = ?;', [cpf]);
}

export function buscarPorId(db: SQLiteDatabase, id: string): Promise<UsuarioRow | null> {
    return db.getFirstAsync<UsuarioRow>('SELECT * FROM usuarios WHERE id = ?;', [id]);
}

/**
 * Busca pelo identificador digitado no login, que aceita e-mail ou CPF.
 * `cpfDigitos` vem sem pontuacao; quando o texto nao parece um CPF, passe `null`.
 */
export async function buscarPorEmailOuCpf(
    db: SQLiteDatabase,
    email: string,
    cpfDigitos: string | null,
): Promise<UsuarioRow | null> {
    const porEmail = await buscarPorEmail(db, email);
    if (porEmail) {
        return porEmail;
    }
    return cpfDigitos ? buscarPorCpf(db, cpfDigitos) : null;
}

export async function atualizarSenhaHash(
    db: SQLiteDatabase,
    usuarioId: string,
    senhaHash: string,
): Promise<void> {
    await db.runAsync('UPDATE usuarios SET senha_hash = ?, atualizado_em = ? WHERE id = ?;', [
        senhaHash,
        new Date().toISOString(),
        usuarioId,
    ]);
}

export async function contarUsuarios(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM usuarios;');
    return row?.total ?? 0;
}
