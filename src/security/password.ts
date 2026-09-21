/**
 * Derivacao e verificacao de senha.
 *
 * O hash e guardado no formato `pbkdf2-sha256$<iteracoes>$<saltHex>$<hashHex>`.
 * Guardar o numero de iteracoes junto permite aumentar o custo no futuro sem
 * invalidar as contas ja cadastradas.
 *
 * Limite conhecido: sem modulo nativo de KDF, o PBKDF2 roda em JavaScript, entao
 * o numero de iteracoes e menor do que o recomendado para um servidor. Isso e
 * aceitavel para um banco local no aparelho, mas nao substitui autenticacao em
 * servidor quando o app for para producao.
 */
import * as Crypto from 'expo-crypto';

import { bytesEqual, bytesToHex, hexToBytes, utf8ToBytes } from './bytes';
import { pbkdf2Sha256 } from './pbkdf2';

const ALGORITHM = 'pbkdf2-sha256';
const ITERATIONS = 40000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

/** Gera o hash de uma senha em claro, com salt aleatorio por usuario. */
export async function hashPassword(plainPassword: string): Promise<string> {
    const salt = await Crypto.getRandomBytesAsync(SALT_LENGTH);
    const derived = pbkdf2Sha256(utf8ToBytes(plainPassword), salt, ITERATIONS, KEY_LENGTH);

    return `${ALGORITHM}$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

/**
 * Confere uma senha em claro contra o hash guardado.
 * Retorna `false` para hashes malformados em vez de lancar excecao, para que um
 * registro corrompido no banco nao derrube a tela de login.
 */
export async function verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== ALGORITHM) {
        return false;
    }

    const iterations = Number.parseInt(parts[1], 10);
    if (!Number.isInteger(iterations) || iterations < 1) {
        return false;
    }

    try {
        const salt = hexToBytes(parts[2]);
        const expected = hexToBytes(parts[3]);
        const derived = pbkdf2Sha256(utf8ToBytes(plainPassword), salt, iterations, expected.length);
        return bytesEqual(derived, expected);
    } catch {
        return false;
    }
}

/** Indica se o hash foi gerado com um custo menor do que o atual e deve ser regerado. */
export function needsRehash(storedHash: string): boolean {
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== ALGORITHM) {
        return true;
    }
    const iterations = Number.parseInt(parts[1], 10);
    return !Number.isInteger(iterations) || iterations < ITERATIONS;
}
