import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';
import { sha256, hmacSha256 } from '../src/security/sha256';
import { pbkdf2Sha256 } from '../src/security/pbkdf2';
import { utf8ToBytes, bytesToHex, hexToBytes, bytesEqual } from '../src/security/bytes';

let failures = 0;
function check(name: string, actual: string, expected: string) {
  if (actual !== expected) { failures++; console.log(`FAIL ${name}\n  got ${actual}\n  exp ${expected}`); }
  else console.log(`ok   ${name}`);
}

// 1. SHA-256 vs Node, incluindo limites de bloco (55/56/63/64/65 bytes) e UTF-8.
const samples = ['', 'a', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(63), 'x'.repeat(64),
  'x'.repeat(65), 'x'.repeat(1000), 'João da Silva — açúcar 🩺', 'senha#Forte123'];
for (const s of samples) {
  const mine = bytesToHex(sha256(utf8ToBytes(s)));
  const node = createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');
  check(`sha256(len=${Buffer.byteLength(s)})`, mine, node);
}
let edgeFail = 0;
for (let n = 0; n <= 200; n++) {
  const buf = randomBytes(n);
  const mine = bytesToHex(sha256(new Uint8Array(buf)));
  const node = createHash('sha256').update(buf).digest('hex');
  if (mine !== node) { edgeFail++; failures++; console.log(`FAIL sha256 exato len=${n}`); }
}
console.log(edgeFail === 0 ? 'ok   sha256 todos os tamanhos 0..200 bytes' : `FALHA em ${edgeFail} tamanhos`);

// 2. UTF-8 encoder vs Buffer
for (const s of samples) {
  check(`utf8(${Buffer.byteLength(s)})`, bytesToHex(utf8ToBytes(s)), Buffer.from(s, 'utf8').toString('hex'));
}

// 3. HMAC-SHA256 vs Node, com chave curta, exata (64) e longa (>64).
for (const keyLen of [1, 20, 63, 64, 65, 200]) {
  const key = randomBytes(keyLen);
  const msg = randomBytes(137);
  const mine = bytesToHex(hmacSha256(new Uint8Array(key), new Uint8Array(msg)));
  const node = createHmac('sha256', key).update(msg).digest('hex');
  check(`hmac(keyLen=${keyLen})`, mine, node);
}

// 4. PBKDF2-HMAC-SHA256 vs Node (varias iteracoes e tamanhos de chave, inclusive > 32 bytes).
const cases: Array<[string, string, number, number]> = [
  ['password', 'salt', 1, 32], ['password', 'salt', 2, 32], ['password', 'salt', 4096, 32],
  ['passwordPASSWORDpassword', 'saltSALTsaltSALTsaltSALTsaltSALTsalt', 4096, 40],
  ['senha#Forte123', 'aBcD1234', 1000, 64], ['🩺saúde', 'sal', 310, 16],
];
for (const [pw, salt, iter, len] of cases) {
  const mine = bytesToHex(pbkdf2Sha256(utf8ToBytes(pw), utf8ToBytes(salt), iter, len));
  const node = pbkdf2Sync(Buffer.from(pw, 'utf8'), Buffer.from(salt, 'utf8'), iter, len, 'sha256').toString('hex');
  check(`pbkdf2(${iter}it,${len}B)`, mine, node);
}

// 5. hex round-trip e comparacao
const rnd = new Uint8Array(randomBytes(48));
check('hex roundtrip', bytesToHex(hexToBytes(bytesToHex(rnd))), bytesToHex(rnd));
check('bytesEqual igual', String(bytesEqual(rnd, rnd.slice())), 'true');
const other = rnd.slice(); other[47] ^= 1;
check('bytesEqual diferente', String(bytesEqual(rnd, other)), 'false');
check('bytesEqual tamanhos', String(bytesEqual(rnd, rnd.slice(0, 47))), 'false');

// 6. Custo real das iteracoes usadas em producao
for (const iter of [20000, 40000, 60000, 120000]) {
  const t0 = Date.now();
  pbkdf2Sha256(utf8ToBytes('senha#Forte123'), utf8ToBytes('0123456789abcdef'), iter, 32);
  console.log(`tempo de ${iter} iteracoes: ${Date.now() - t0}ms`);
}

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
