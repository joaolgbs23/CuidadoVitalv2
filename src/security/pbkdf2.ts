/**
 * PBKDF2-HMAC-SHA256 (RFC 8018) sobre a implementacao sincrona de SHA-256.
 */
import { SHA256_DIGEST_LENGTH, hmacSha256 } from './sha256';

/**
 * Deriva `keyLength` bytes a partir de `password` e `salt`.
 *
 * @param iterations numero de iteracoes; quanto maior, mais caro fica um ataque
 *   de forca bruta sobre o arquivo do banco.
 */
export function pbkdf2Sha256(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
): Uint8Array {
    if (iterations < 1) {
        throw new Error('pbkdf2Sha256: iterations precisa ser maior que zero.');
    }
    if (keyLength < 1) {
        throw new Error('pbkdf2Sha256: keyLength precisa ser maior que zero.');
    }

    const blockCount = Math.ceil(keyLength / SHA256_DIGEST_LENGTH);
    const derived = new Uint8Array(blockCount * SHA256_DIGEST_LENGTH);
    const saltWithIndex = new Uint8Array(salt.length + 4);
    saltWithIndex.set(salt);

    for (let block = 1; block <= blockCount; block += 1) {
        saltWithIndex[salt.length] = (block >>> 24) & 0xff;
        saltWithIndex[salt.length + 1] = (block >>> 16) & 0xff;
        saltWithIndex[salt.length + 2] = (block >>> 8) & 0xff;
        saltWithIndex[salt.length + 3] = block & 0xff;

        let u = hmacSha256(password, saltWithIndex);
        const accumulator = u.slice();

        for (let i = 1; i < iterations; i += 1) {
            u = hmacSha256(password, u);
            for (let j = 0; j < SHA256_DIGEST_LENGTH; j += 1) {
                accumulator[j] ^= u[j];
            }
        }

        derived.set(accumulator, (block - 1) * SHA256_DIGEST_LENGTH);
    }

    return derived.slice(0, keyLength);
}
