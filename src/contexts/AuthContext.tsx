/**
 * Estado de autenticacao compartilhado pelo aplicativo.
 *
 * Abre o banco uma unica vez, tenta recuperar a sessao salva e expoe as acoes de
 * cadastro, login e saida para as telas.
 */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '../database';
import type { Usuario } from '../database/usuarioRepository';
import {
    AuthError,
    cadastrar,
    entrar,
    recuperarSessao,
    sair,
    type DadosCadastro,
    type Sessao,
} from '../services/autenticacao';

type AuthContextValue = {
    /** `true` enquanto o banco abre e a sessao salva e consultada. */
    carregando: boolean;
    /** Falha ao abrir ou migrar o banco. Bloqueia o uso do app. */
    erroBanco: string | null;
    usuario: Usuario | null;
    fazerLogin: (identificador: string, senha: string) => Promise<void>;
    fazerCadastro: (dados: DadosCadastro) => Promise<void>;
    fazerLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [carregando, setCarregando] = useState(true);
    const [erroBanco, setErroBanco] = useState<string | null>(null);
    const [sessao, setSessao] = useState<Sessao | null>(null);
    const dbRef = useRef<SQLiteDatabase | null>(null);

    useEffect(() => {
        let ativo = true;

        (async () => {
            try {
                const db = await getDatabase();
                const sessaoSalva = await recuperarSessao(db);
                if (!ativo) {
                    return;
                }
                dbRef.current = db;
                setSessao(sessaoSalva);
            } catch (erro) {
                if (!ativo) {
                    return;
                }
                console.error('Falha ao iniciar o banco de dados', erro);
                setErroBanco(
                    'Não foi possível abrir o banco de dados local. Feche e abra o aplicativo novamente.',
                );
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        })();

        return () => {
            ativo = false;
        };
    }, []);

    /** Garante que o banco esta pronto antes de qualquer operacao das telas. */
    const exigirBanco = useCallback((): SQLiteDatabase => {
        if (!dbRef.current) {
            throw new Error('O banco de dados ainda nao esta pronto.');
        }
        return dbRef.current;
    }, []);

    const fazerLogin = useCallback(
        async (identificador: string, senha: string) => {
            setSessao(await entrar(exigirBanco(), identificador, senha));
        },
        [exigirBanco],
    );

    const fazerCadastro = useCallback(
        async (dados: DadosCadastro) => {
            setSessao(await cadastrar(exigirBanco(), dados));
        },
        [exigirBanco],
    );

    const fazerLogout = useCallback(async () => {
        const db = dbRef.current;
        if (db && sessao) {
            await sair(db, sessao.id);
        }
        setSessao(null);
    }, [sessao]);

    const valor = useMemo<AuthContextValue>(
        () => ({
            carregando,
            erroBanco,
            usuario: sessao?.usuario ?? null,
            fazerLogin,
            fazerCadastro,
            fazerLogout,
        }),
        [carregando, erroBanco, sessao, fazerLogin, fazerCadastro, fazerLogout],
    );

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error('useAuth precisa ser usado dentro de um AuthProvider.');
    }
    return contexto;
}

/** Converte qualquer erro em uma mensagem exibivel, preservando `AuthError`. */
export function mensagemDeErro(erro: unknown): string {
    if (erro instanceof AuthError) {
        return erro.message;
    }
    console.error(erro);
    return 'Algo deu errado. Tente novamente.';
}
