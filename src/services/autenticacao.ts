/**
 * Regras de cadastro e login sobre o banco local.
 *
 * As telas chamam estas funcoes; elas cuidam de validar, gravar e devolver um
 * erro com mensagem pronta para exibir. Erros esperados usam `AuthError`, para
 * a UI distinguir "senha errada" de uma falha inesperada do banco.
 */
import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { hashPassword, needsRehash, verifyPassword } from '../security/password';
import {
    atualizarSenhaHash,
    buscarPorCpf,
    buscarPorEmail,
    buscarPorEmailOuCpf,
    buscarPorId,
    inserirUsuario,
    paraUsuario,
    type Usuario,
} from '../database/usuarioRepository';
import {
    buscarSessaoValida,
    criarSessao,
    removerSessao,
    removerSessoesExpiradas,
} from '../database/sessaoRepository';
import {
    apenasDigitos,
    cpfValido,
    emailValido,
    nomeValido,
    normalizarEmail,
    normalizarNome,
    pareceCpf,
    validarSenha,
} from '../utils/validacao';

/** Dias que uma sessao continua valida sem o usuario digitar a senha de novo. */
const DIAS_DE_SESSAO = 30;

export type AuthErrorCode =
    | 'dados_invalidos'
    | 'email_em_uso'
    | 'cpf_em_uso'
    | 'credenciais_invalidas';

export class AuthError extends Error {
    constructor(
        readonly code: AuthErrorCode,
        message: string,
        /** Campo do formulario a destacar, quando o erro for de um campo especifico. */
        readonly campo?: 'nome' | 'cpf' | 'email' | 'senha' | 'confirmacaoSenha' | 'identificador',
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export type Sessao = {
    id: string;
    usuario: Usuario;
    expiraEm: string;
};

export type DadosCadastro = {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    confirmacaoSenha: string;
};

function novaValidade(): Date {
    const validade = new Date();
    validade.setDate(validade.getDate() + DIAS_DE_SESSAO);
    return validade;
}

/** Abre uma sessao para o usuario informado e a grava no banco. */
async function abrirSessao(db: SQLiteDatabase, usuarioId: string): Promise<Sessao> {
    await removerSessoesExpiradas(db);

    const sessaoId = Crypto.randomUUID();
    const expiraEm = novaValidade();
    await criarSessao(db, sessaoId, usuarioId, expiraEm);

    const row = await buscarPorId(db, usuarioId);
    if (!row) {
        // So acontece se o usuario for removido entre a gravacao e a leitura.
        throw new Error('Usuario nao encontrado apos abrir a sessao.');
    }

    return { id: sessaoId, usuario: paraUsuario(row), expiraEm: expiraEm.toISOString() };
}

/**
 * Cadastra um usuario e ja o deixa logado.
 * Valida tudo antes de calcular o hash, que e a parte cara da operacao.
 */
export async function cadastrar(db: SQLiteDatabase, dados: DadosCadastro): Promise<Sessao> {
    const nome = normalizarNome(dados.nome);
    const email = normalizarEmail(dados.email);
    const cpf = apenasDigitos(dados.cpf);

    if (!nomeValido(nome)) {
        throw new AuthError('dados_invalidos', 'Informe o nome completo.', 'nome');
    }
    if (!cpfValido(cpf)) {
        throw new AuthError('dados_invalidos', 'CPF inválido.', 'cpf');
    }
    if (!emailValido(email)) {
        throw new AuthError('dados_invalidos', 'E-mail inválido.', 'email');
    }

    const problemaSenha = validarSenha(dados.senha);
    if (problemaSenha) {
        throw new AuthError('dados_invalidos', problemaSenha, 'senha');
    }
    if (dados.senha !== dados.confirmacaoSenha) {
        throw new AuthError('dados_invalidos', 'As senhas não conferem.', 'confirmacaoSenha');
    }

    if (await buscarPorEmail(db, email)) {
        throw new AuthError('email_em_uso', 'Já existe uma conta com este e-mail.', 'email');
    }
    if (await buscarPorCpf(db, cpf)) {
        throw new AuthError('cpf_em_uso', 'Já existe uma conta com este CPF.', 'cpf');
    }

    const senhaHash = await hashPassword(dados.senha);
    const id = Crypto.randomUUID();

    try {
        await inserirUsuario(db, { id, nome, cpf, email, senhaHash });
    } catch (erro) {
        // As restricoes UNIQUE sao a garantia final contra duas telas gravando o
        // mesmo e-mail ao mesmo tempo; a checagem acima so melhora a mensagem.
        const texto = erro instanceof Error ? erro.message : String(erro);
        if (texto.includes('usuarios.email')) {
            throw new AuthError('email_em_uso', 'Já existe uma conta com este e-mail.', 'email');
        }
        if (texto.includes('usuarios.cpf')) {
            throw new AuthError('cpf_em_uso', 'Já existe uma conta com este CPF.', 'cpf');
        }
        throw erro;
    }

    return abrirSessao(db, id);
}

/**
 * Faz login com e-mail ou CPF.
 *
 * A mensagem de erro e a mesma para usuario inexistente e senha errada, para nao
 * revelar quais e-mails ou CPFs estao cadastrados no aparelho.
 */
export async function entrar(
    db: SQLiteDatabase,
    identificador: string,
    senha: string,
): Promise<Sessao> {
    const texto = identificador.trim();

    if (!texto) {
        throw new AuthError('dados_invalidos', 'Informe seu e-mail ou CPF.', 'identificador');
    }
    if (!senha) {
        throw new AuthError('dados_invalidos', 'Informe sua senha.', 'senha');
    }

    const email = normalizarEmail(texto);
    const cpf = pareceCpf(texto) ? apenasDigitos(texto) : null;
    const row = await buscarPorEmailOuCpf(db, email, cpf);

    if (!row || !(await verifyPassword(senha, row.senha_hash))) {
        throw new AuthError('credenciais_invalidas', 'E-mail, CPF ou senha incorretos.');
    }

    // Conta criada com um custo de derivacao menor: atualiza o hash agora que
    // temos a senha em claro em maos.
    if (needsRehash(row.senha_hash)) {
        await atualizarSenhaHash(db, row.id, await hashPassword(senha));
    }

    return abrirSessao(db, row.id);
}

/** Recupera a sessao salva ao abrir o app, ou `null` se nao houver uma valida. */
export async function recuperarSessao(db: SQLiteDatabase): Promise<Sessao | null> {
    await removerSessoesExpiradas(db);

    const row = await buscarSessaoValida(db);
    if (!row) {
        return null;
    }

    return { id: row.sessao_id, usuario: paraUsuario(row), expiraEm: row.expira_em };
}

export async function sair(db: SQLiteDatabase, sessaoId: string): Promise<void> {
    await removerSessao(db, sessaoId);
}
