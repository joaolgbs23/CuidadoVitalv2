/**
 * Implementacao de SHA-256 (FIPS 180-4) em TypeScript puro.
 *
 * Por que nao usamos `expo-crypto` aqui: o modulo expoe apenas `digest`/
 * `digestStringAsync`, que sao chamadas nativas assincronas. Derivar uma senha
 * exige dezenas de milhares de iteracoes encadeadas, e fazer isso via ponte
 * nativa levaria segundos. Esta versao sincrona roda inteiramente em JS e
 * permite um PBKDF2 com custo real sem travar o cadastro.
 *
 * A saida e verificada contra o modulo `crypto` do Node em scripts/verify-crypto.
 */

const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const BLOCK_SIZE = 64;

export const SHA256_DIGEST_LENGTH = 32;

function rotr(value: number, shift: number): number {
    return (value >>> shift) | (value << (32 - shift));
}

/** Processa os blocos de 64 bytes ja preenchidos (com padding) sobre o estado `h`. */
function compress(h: Uint32Array, blocks: Uint8Array): void {
    const w = new Uint32Array(64);

    for (let offset = 0; offset < blocks.length; offset += BLOCK_SIZE) {
        for (let i = 0; i < 16; i += 1) {
            const j = offset + i * 4;
            w[i] = ((blocks[j] << 24) | (blocks[j + 1] << 16) | (blocks[j + 2] << 8) | blocks[j + 3]) >>> 0;
        }
        for (let i = 16; i < 64; i += 1) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }

        let a = h[0];
        let b = h[1];
        let c = h[2];
        let d = h[3];
        let e = h[4];
        let f = h[5];
        let g = h[6];
        let hh = h[7];

        for (let i = 0; i < 64; i += 1) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) >>> 0;

            hh = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
        h[5] = (h[5] + f) >>> 0;
        h[6] = (h[6] + g) >>> 0;
        h[7] = (h[7] + hh) >>> 0;
    }
}

/** Aplica o padding do FIPS 180-4: bit 1, zeros e o tamanho em bits (big-endian, 64 bits). */
function pad(message: Uint8Array): Uint8Array {
    const bitLength = message.length * 8;
    // Total = mensagem + byte 0x80 + zeros + 8 bytes de comprimento, arredondado
    // para o proximo multiplo de 64. Precisa ser `ceil`: quando `length + 9` ja e
    // multiplo exato do bloco (ex.: 55 bytes), um bloco extra produziria hash errado.
    const paddedLength = Math.ceil((message.length + 9) / BLOCK_SIZE) * BLOCK_SIZE;
    const padded = new Uint8Array(paddedLength);

    padded.set(message);
    padded[message.length] = 0x80;

    // O comprimento cabe em 53 bits com seguranca (limite do Number), entao
    // gravamos as 8 palavras finais derivando de cima para baixo.
    const high = Math.floor(bitLength / 0x100000000);
    const low = bitLength >>> 0;
    const lengthOffset = paddedLength - 8;
    padded[lengthOffset] = (high >>> 24) & 0xff;
    padded[lengthOffset + 1] = (high >>> 16) & 0xff;
    padded[lengthOffset + 2] = (high >>> 8) & 0xff;
    padded[lengthOffset + 3] = high & 0xff;
    padded[lengthOffset + 4] = (low >>> 24) & 0xff;
    padded[lengthOffset + 5] = (low >>> 16) & 0xff;
    padded[lengthOffset + 6] = (low >>> 8) & 0xff;
    padded[lengthOffset + 7] = low & 0xff;

    return padded;
}

/** Calcula o digest SHA-256 de `message`. */
export function sha256(message: Uint8Array): Uint8Array {
    const h = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);

    compress(h, pad(message));

    const digest = new Uint8Array(SHA256_DIGEST_LENGTH);
    for (let i = 0; i < 8; i += 1) {
        digest[i * 4] = (h[i] >>> 24) & 0xff;
        digest[i * 4 + 1] = (h[i] >>> 16) & 0xff;
        digest[i * 4 + 2] = (h[i] >>> 8) & 0xff;
        digest[i * 4 + 3] = h[i] & 0xff;
    }
    return digest;
}

/** HMAC-SHA256 conforme RFC 2104. */
export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
    const normalizedKey = new Uint8Array(BLOCK_SIZE);
    normalizedKey.set(key.length > BLOCK_SIZE ? sha256(key) : key);

    const inner = new Uint8Array(BLOCK_SIZE + message.length);
    const outer = new Uint8Array(BLOCK_SIZE + SHA256_DIGEST_LENGTH);

    for (let i = 0; i < BLOCK_SIZE; i += 1) {
        inner[i] = normalizedKey[i] ^ 0x36;
        outer[i] = normalizedKey[i] ^ 0x5c;
    }
    inner.set(message, BLOCK_SIZE);
    outer.set(sha256(inner), BLOCK_SIZE);

    return sha256(outer);
}
