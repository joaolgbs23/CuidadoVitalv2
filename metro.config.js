// Configuracao do Metro.
// Necessaria por causa do expo-sqlite na web: o modulo carrega o SQLite
// compilado em WebAssembly, e o bundler precisa (1) tratar `.wasm` como asset e
// (2) servir as paginas com os cabecalhos COOP/COEP, exigidos pelo navegador
// para SharedArrayBuffer e para o sistema de arquivos privado (OPFS).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => (req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        return middleware(req, res, next);
    },
};

module.exports = config;
