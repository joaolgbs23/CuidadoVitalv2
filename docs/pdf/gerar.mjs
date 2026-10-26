/**
 * Gera os PDFs de entrega a partir dos documentos em Markdown.
 *
 * Pipeline: pandoc converte o Markdown em HTML com sumario, e o Chromium
 * imprime esse HTML em PDF. Nao usa LaTeX, entao nao precisa de TeX instalado.
 *
 * Uso:
 *   node docs/pdf/gerar.mjs [pasta-de-saida]
 *
 * Requer `pandoc` no PATH e o Chromium do playwright-core:
 *   npx playwright-core install chromium
 *
 * Os dados da capa ficam em `capa.json`. Preencha os nomes dos integrantes la
 * e rode de novo — nao edite este arquivo para isso.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const SAIDA = path.resolve(process.argv[2] ?? path.join(RAIZ, 'docs', 'pdf', 'saida'));

const CAPA = JSON.parse(fs.readFileSync(path.join(AQUI, 'capa.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(AQUI, 'estilo.css'), 'utf8');

const DOCS = [
    {
        md: 'docs/plano-de-testes.md',
        pdf: 'Plano-de-Testes-CuidadoVital.pdf',
        titulo: 'Plano de Testes',
        subtitulo: 'Aplicativo CuidadoVital',
    },
    {
        md: 'docs/casos-de-teste.md',
        pdf: 'Casos-de-Teste-CuidadoVital.pdf',
        titulo: 'Casos de Teste',
        subtitulo: 'Aplicativo CuidadoVital',
    },
];

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function capaHtml(titulo, subtitulo) {
    const alunos = CAPA.alunos?.length
        ? CAPA.alunos.map(esc).join(', ')
        : '<span class="pendente">preencher os integrantes em docs/pdf/capa.json</span>';

    return `<div class="capa">
        <div class="instituicao">${esc(CAPA.instituicao)}</div>
        <div class="curso">${esc(CAPA.curso)}</div>
        <div class="titulo">${esc(titulo)}</div>
        <div class="subtitulo">${esc(subtitulo)}</div>
        <div class="alunos"><strong>Alunos:</strong>${alunos}</div>
        <div class="local">${esc(CAPA.local)}<br>${esc(CAPA.ano)}</div>
    </div>`;
}

fs.mkdirSync(SAIDA, { recursive: true });

if (!CAPA.alunos?.length) {
    console.warn('AVISO: a lista de alunos em capa.json esta vazia; a capa sai com marcador.\n');
}

const navegador = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

for (const doc of DOCS) {
    // O primeiro titulo de nivel 1 vira a capa, entao sai do corpo.
    const markdown = fs.readFileSync(path.join(RAIZ, doc.md), 'utf8').replace(/^# .*\n/, '');
    const tmpMd = path.join(SAIDA, path.basename(doc.md));
    fs.writeFileSync(tmpMd, markdown);

    const corpo = execFileSync(
        'pandoc',
        [tmpMd, '--from=gfm', '--to=html5', '--toc', '--toc-depth=2', `--template=${path.join(AQUI, 'modelo.html')}`],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );

    const htmlPath = path.join(SAIDA, doc.pdf.replace(/\.pdf$/, '.html'));
    fs.writeFileSync(
        htmlPath,
        `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(doc.titulo)} — CuidadoVital</title><style>${CSS}</style></head>
<body>${capaHtml(doc.titulo, doc.subtitulo)}${corpo}</body></html>`,
    );

    const pagina = await navegador.newPage();
    await pagina.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
    await pagina.pdf({
        path: path.join(SAIDA, doc.pdf),
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="width:100%;font-size:8pt;color:#6b7680;padding:0 18mm;
            font-family:Georgia,serif;display:flex;justify-content:space-between;">
            <span>${esc(doc.titulo)} — CuidadoVital</span>
            <span><span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>`,
        margin: { top: '22mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });
    await pagina.close();

    fs.rmSync(tmpMd, { force: true });
    fs.rmSync(htmlPath, { force: true });

    const kb = (fs.statSync(path.join(SAIDA, doc.pdf)).size / 1024).toFixed(0);
    console.log(`gerado  ${doc.pdf}  (${kb} KB)`);
}

await navegador.close();
console.log(`\nPDFs em ${SAIDA}`);
