/**
 * Vortex UI Exporter — Build Script
 * Usa esbuild para bundle correto para o JSVM do Figma
 * (O Figma não suporta CommonJS, o esbuild resolve isso)
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Carrega o HTML como string para injeção
const uiHtml = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf-8');

// Define um plugin para substituir HTML_UI pela string inline
const htmlPlugin = {
    name: 'html-inline',
    setup(build) {
        build.onLoad({ filter: /main\.ts$/ }, (args) => {
            let code = fs.readFileSync(args.path, 'utf-8');
            // Substitui a declaração declare const HTML_UI e referências a HTML_UI
            // pela string literal do HTML
            code = code.replace(/declare const HTML_UI: string;\n/, '');
            code = code.replace(/HTML_UI/g, JSON.stringify(uiHtml));
            return { contents: code, loader: 'ts' };
        });
    },
};

const watchMode = process.argv.includes('--watch');

async function build() {
    const config = {
        entryPoints: ['src/main.ts'],
        outfile: 'dist/main.js',
        bundle: true,
        platform: 'browser',
        target: 'es2015',
        format: 'iife',
        logLevel: 'info',
        plugins: [htmlPlugin],
        external: [],  // Nada externo
        treeShaking: true,
        minify: false, // Mudar para true em produção
    };

    if (watchMode) {
        const ctx = await esbuild.context(config);
        await ctx.watch();
        console.log('🔁 Watching for changes...');
    } else {
        await esbuild.build(config);
        console.log('✅ Build complete: dist/main.js');
    }
}

build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});