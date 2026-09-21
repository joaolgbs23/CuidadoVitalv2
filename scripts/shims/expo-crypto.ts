// Stub de expo-crypto para rodar a logica fora do aparelho.
import { randomBytes, randomUUID as nodeRandomUUID } from 'node:crypto';

export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array> {
  return new Uint8Array(randomBytes(byteCount));
}
export function getRandomBytes(byteCount: number): Uint8Array {
  return new Uint8Array(randomBytes(byteCount));
}
export function randomUUID(): string {
  return nodeRandomUUID();
}
