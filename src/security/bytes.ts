/**
 * Conversoes de bytes usadas pela camada de seguranca.
 *
 * React Native nao expoe `Buffer` nem `TextEncoder` de forma consistente entre
 * plataformas, entao as conversoes ficam explicitas aqui.
 */

/** Codifica uma string UTF-8 em bytes. */
export function utf8ToBytes(text: string): Uint8Array {
    const bytes: number[] = [];

    for (let i = 0; i < text.length; i += 1) {
        let codePoint = text.charCodeAt(i);

        if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < text.length) {
            const next = text.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                codePoint = (codePoint - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
                i += 1;
            }
        }

        if (codePoint < 0x80) {
            bytes.push(codePoint);
        } else if (codePoint < 0x800) {
            bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
        } else if (codePoint < 0x10000) {
            bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
        } else {
            bytes.push(
                0xf0 | (codePoint >> 18),
                0x80 | ((codePoint >> 12) & 0x3f),
                0x80 | ((codePoint >> 6) & 0x3f),
                0x80 | (codePoint & 0x3f),
            );
        }
    }

    return Uint8Array.from(bytes);
}

/** Representa bytes como string hexadecimal minuscula. */
export function bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i += 1) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}

/** Converte uma string hexadecimal de volta para bytes. */
export function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
        throw new Error('hexToBytes: string hexadecimal com tamanho impar.');
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1) {
        const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) {
            throw new Error('hexToBytes: caractere invalido na string hexadecimal.');
        }
        bytes[i] = byte;
    }
    return bytes;
}

/**
 * Compara dois blocos de bytes em tempo constante em relacao ao conteudo.
 * Evita que o tempo de resposta do login vaze quantos bytes do hash bateram.
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let diff = 0;
    for (let i = 0; i < a.length; i += 1) {
        diff |= a[i] ^ b[i];
    }
    return diff === 0;
}
