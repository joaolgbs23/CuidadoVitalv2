import { openDatabaseAsync, type SQLiteDatabase } from './shims/expo-sqlite.ts';
import { configureDatabase } from '../src/database';
import { migrate, LATEST_VERSION } from '../src/database/migrations';
import { cadastrar, entrar, recuperarSessao, sair, AuthError } from '../src/services/autenticacao';
import { contarUsuarios, buscarPorEmail } from '../src/database/usuarioRepository';
import { cpfValido, emailValido, formatarCpf, validarSenha, nomeValido, pareceCpf } from '../src/utils/validacao';

let falhas = 0;
function ok(nome: string, cond: boolean, detalhe = '') {
  if (cond) console.log(`ok   ${nome}`);
  else { falhas++; console.log(`FAIL ${nome} ${detalhe}`); }
}
async function esperaErro(nome: string, fn: () => Promise<unknown>, codigo: string, campo?: string) {
  try { await fn(); falhas++; console.log(`FAIL ${nome} (nao lancou erro)`); }
  catch (e) {
    if (e instanceof AuthError && e.code === codigo && (!campo || e.campo === campo)) console.log(`ok   ${nome} -> "${e.message}"`);
    else { falhas++; console.log(`FAIL ${nome} (erro inesperado: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)})`); }
  }
}

// ---------- validacao ----------
ok('CPF valido aceito', cpfValido('529.982.247-25'));
ok('CPF valido aceito (2)', cpfValido('111.444.777-35'));
ok('CPF com DV errado rejeitado', !cpfValido('529.982.247-24'));
ok('CPF repetido rejeitado', !cpfValido('111.111.111-11'));
ok('CPF curto rejeitado', !cpfValido('1234567890'));
ok('mascara CPF', formatarCpf('52998224725') === '529.982.247-25', formatarCpf('52998224725'));
ok('mascara CPF parcial', formatarCpf('5299') === '529.9', formatarCpf('5299'));
ok('mascara ignora excesso', formatarCpf('529982247259999') === '529.982.247-25');
ok('email valido', emailValido('Maria.Silva@Exemplo.com.br'));
ok('email sem dominio rejeitado', !emailValido('maria@exemplo'));
ok('email sem arroba rejeitado', !emailValido('mariaexemplo.com'));
ok('senha curta rejeitada', validarSenha('Ab1') !== null);
ok('senha sem numero rejeitada', validarSenha('somenteletras') !== null);
ok('senha sem letra rejeitada', validarSenha('12345678') !== null);
ok('senha boa aceita', validarSenha('senha1234') === null);
ok('nome completo exigido', !nomeValido('Maria'));
ok('nome completo aceito', nomeValido('Maria Silva'));
ok('pareceCpf so com 11 digitos', pareceCpf('529.982.247-25') && !pareceCpf('a@b.com'));

// ---------- banco ----------
const db: SQLiteDatabase = await openDatabaseAsync(':memory:');
await configureDatabase(db);
const versao = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
ok('migracao aplicou versao', versao?.user_version === LATEST_VERSION, `versao=${versao?.user_version}`);

const tabelas = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
const nomes = tabelas.map((t) => t.name);
ok('tabelas criadas', nomes.includes('usuarios') && nomes.includes('sessoes'), JSON.stringify(nomes));

// migrar de novo deve ser inofensivo
await migrate(db);
ok('migracao e idempotente', (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;'))?.user_version === LATEST_VERSION);

// ---------- cadastro ----------
const t0 = Date.now();
const sessao = await cadastrar(db, {
  nome: '  Maria   da Silva ', cpf: '529.982.247-25', email: '  Maria.Silva@Exemplo.COM  ',
  senha: 'senha1234', confirmacaoSenha: 'senha1234',
});
console.log(`     (cadastro levou ${Date.now() - t0}ms, inclui a derivacao da senha)`);
ok('cadastro retorna usuario', sessao.usuario.nome === 'Maria da Silva', sessao.usuario.nome);
ok('email normalizado', sessao.usuario.email === 'maria.silva@exemplo.com', sessao.usuario.email);
ok('cpf guardado so com digitos', sessao.usuario.cpf === '52998224725', sessao.usuario.cpf);
ok('usuario persistido', (await contarUsuarios(db)) === 1);

const linha = await buscarPorEmail(db, 'maria.silva@exemplo.com');
ok('senha NAO guardada em claro', !!linha && !linha.senha_hash.includes('senha1234'), linha?.senha_hash);
ok('hash no formato esperado', !!linha && /^pbkdf2-sha256\$40000\$[0-9a-f]{32}\$[0-9a-f]{64}$/.test(linha.senha_hash), linha?.senha_hash);

// salt diferente por usuario -> hashes diferentes para a mesma senha
await cadastrar(db, { nome: 'Joao Souza', cpf: '111.444.777-35', email: 'joao@exemplo.com', senha: 'senha1234', confirmacaoSenha: 'senha1234' });
const joao = await buscarPorEmail(db, 'joao@exemplo.com');
ok('salt unico por usuario', !!joao && !!linha && joao.senha_hash !== linha.senha_hash);

// ---------- duplicidade e validacao no cadastro ----------
await esperaErro('email duplicado barrado', () => cadastrar(db, { nome: 'Outra Pessoa', cpf: '111.444.777-35', email: 'MARIA.SILVA@exemplo.com', senha: 'senha1234', confirmacaoSenha: 'senha1234' }), 'email_em_uso', 'email');
await esperaErro('cpf duplicado barrado', () => cadastrar(db, { nome: 'Outra Pessoa', cpf: '52998224725', email: 'nova@exemplo.com', senha: 'senha1234', confirmacaoSenha: 'senha1234' }), 'cpf_em_uso', 'cpf');
await esperaErro('nome incompleto barrado', () => cadastrar(db, { nome: 'Ana', cpf: '111.444.777-35', email: 'a@b.com', senha: 'senha1234', confirmacaoSenha: 'senha1234' }), 'dados_invalidos', 'nome');
await esperaErro('cpf invalido barrado', () => cadastrar(db, { nome: 'Ana Lima', cpf: '123.456.789-00', email: 'a@b.com', senha: 'senha1234', confirmacaoSenha: 'senha1234' }), 'dados_invalidos', 'cpf');
await esperaErro('email invalido barrado', () => cadastrar(db, { nome: 'Ana Lima', cpf: '168.995.350-09', email: 'invalido', senha: 'senha1234', confirmacaoSenha: 'senha1234' }), 'dados_invalidos', 'email');
await esperaErro('senha fraca barrada', () => cadastrar(db, { nome: 'Ana Lima', cpf: '168.995.350-09', email: 'ana@b.com', senha: '123', confirmacaoSenha: '123' }), 'dados_invalidos', 'senha');
await esperaErro('confirmacao divergente barrada', () => cadastrar(db, { nome: 'Ana Lima', cpf: '168.995.350-09', email: 'ana@b.com', senha: 'senha1234', confirmacaoSenha: 'senha4321' }), 'dados_invalidos', 'confirmacaoSenha');
ok('nenhum usuario extra criado', (await contarUsuarios(db)) === 2, String(await contarUsuarios(db)));

// ---------- login ----------
const porEmail = await entrar(db, 'MARIA.SILVA@Exemplo.com ', 'senha1234');
ok('login por email (case/espaco)', porEmail.usuario.id === sessao.usuario.id);
const porCpfMascara = await entrar(db, '529.982.247-25', 'senha1234');
ok('login por CPF com mascara', porCpfMascara.usuario.id === sessao.usuario.id);
const porCpfLimpo = await entrar(db, '52998224725', 'senha1234');
ok('login por CPF sem mascara', porCpfLimpo.usuario.id === sessao.usuario.id);

await esperaErro('senha errada barrada', () => entrar(db, 'maria.silva@exemplo.com', 'senhaErrada1'), 'credenciais_invalidas');
await esperaErro('usuario inexistente barrado', () => entrar(db, 'ninguem@exemplo.com', 'senha1234'), 'credenciais_invalidas');
await esperaErro('identificador vazio barrado', () => entrar(db, '   ', 'senha1234'), 'dados_invalidos', 'identificador');
await esperaErro('senha vazia barrada', () => entrar(db, 'maria.silva@exemplo.com', ''), 'dados_invalidos', 'senha');

// mensagem identica evita enumerar contas
try { await entrar(db, 'maria.silva@exemplo.com', 'errada123'); } catch (a) {
  try { await entrar(db, 'naoexiste@exemplo.com', 'errada123'); } catch (b) {
    const msgA = a instanceof Error ? a.message : String(a);
    const msgB = b instanceof Error ? b.message : String(b);
    ok('mesma mensagem p/ conta inexistente e senha errada', msgA === msgB, `${msgA} != ${msgB}`);
  }
}

// ---------- sessao ----------
const recuperada = await recuperarSessao(db);
ok('sessao recuperada apos reabrir', recuperada?.usuario.id === sessao.usuario.id);
await sair(db, recuperada!.id);
const restantes = await db.getAllAsync<{ id: string }>('SELECT * FROM sessoes;');
ok('sair remove so a sessao usada', restantes.length > 0);
for (const s of restantes) await sair(db, s.id);
ok('sem sessao apos sair de todas', (await recuperarSessao(db)) === null);

// sessao expirada nao vale
await db.runAsync('INSERT INTO sessoes (id, usuario_id, criada_em, expira_em) VALUES (?,?,?,?);',
  ['expirada', sessao.usuario.id, new Date(Date.now() - 86400000).toISOString(), new Date(Date.now() - 1000).toISOString()]);
ok('sessao expirada ignorada', (await recuperarSessao(db)) === null);
ok('sessao expirada removida do banco', (await db.getAllAsync('SELECT * FROM sessoes;')).length === 0);

// ---------- integridade ----------
const fk = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
ok('foreign keys ligadas', fk?.foreign_keys === 1, String(fk?.foreign_keys));
const nova = await entrar(db, 'joao@exemplo.com', 'senha1234');
await db.runAsync('DELETE FROM usuarios WHERE id = ?;', [nova.usuario.id]);
ok('ON DELETE CASCADE apaga sessoes', (await db.getAllAsync('SELECT * FROM sessoes;')).length === 0);

console.log(falhas === 0 ? '\nTODOS OS TESTES DE AUTENTICACAO PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
