#!/usr/bin/env node
/**
 * Vortex Compiler — CLI Entry
 * Compila JSON schema Vortex em código Lua
 *
 * Uso:
 *   node dist/index.js input.json output.lua
 *   node dist/index.js --stdin > output.lua
 *   npx vortex-compile login.json login.lua
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateSchema } from './validator';
import { generateLua } from './lua-generator';
import { formatLua, addSectionComments } from './lua-formatter';
import { CompilerResult } from './types';

function printHelp(): void {
  console.log(`
Vortex UI Compiler — JSON → Lua
================================
Compila arquivos JSON do Vortex Schema para código Lua executável no MTA.

Uso:
  vortex-compile <input.json> [output.lua]
  vortex-compile --stdin [output.lua]
  vortex-compile --help

Opções:
  --stdin         Lê o JSON da entrada padrão
  --validate      Apenas valida o schema, sem gerar código
  --no-format     Não formata o código de saída
  --no-sections   Não adiciona comentários de seção
  --help          Mostra esta ajuda

Exemplos:
  vortex-compile login.json login.lua
  cat login.json | vortex-compile --stdin login.lua
  vortex-compile --validate login.json
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  let inputFile: string | null = null;
  let outputFile: string | null = null;
  let useStdin = false;
  let validateOnly = false;
  let shouldFormat = true;
  let shouldAddSections = true;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--stdin':
        useStdin = true;
        break;
      case '--validate':
        validateOnly = true;
        break;
      case '--no-format':
        shouldFormat = false;
        break;
      case '--no-sections':
        shouldAddSections = false;
        break;
      default:
        if (!inputFile && !useStdin) {
          inputFile = args[i];
        } else {
          outputFile = args[i];
        }
        break;
    }
  }

  // Read input
  let rawJson: string;
  let sourceName: string;

  if (useStdin) {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    rawJson = Buffer.concat(chunks).toString('utf-8');
    sourceName = 'stdin';
  } else if (inputFile) {
    if (!fs.existsSync(inputFile)) {
      console.error(`Erro: Arquivo "${inputFile}" não encontrado.`);
      process.exit(1);
    }
    rawJson = fs.readFileSync(inputFile, 'utf-8');
    sourceName = path.basename(inputFile);
  } else {
    console.error('Erro: Nenhum arquivo de entrada especificado.');
    console.error('Use --help para ver as opções.');
    process.exit(1);
  }

  // Parse JSON
  let schema: any;
  try {
    schema = JSON.parse(rawJson);
  } catch (e: any) {
    console.error(`Erro ao parsear JSON: ${e.message}`);
    process.exit(1);
  }

  // Validate
  const validation = validateSchema(schema);

  if (validation.errors.length > 0) {
    console.error('ERROS DE VALIDAÇÃO:');
    for (const err of validation.errors) {
      console.error(`  ✗ ${err}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('AVISOS:');
    for (const warn of validation.warnings) {
      console.warn(`  ⚠ ${warn}`);
    }
  }

  if (!validation.valid) {
    console.error(`\nValidação falhou com ${validation.errors.length} erro(s).`);
    process.exit(1);
  }

  if (validateOnly) {
    console.log(`✓ Schema válido (${sourceName})`);
    process.exit(0);
  }

  // Generate Lua
  let luaCode = generateLua(schema);

  // Format
  if (shouldFormat) {
    luaCode = formatLua(luaCode);
  }

  // Add section comments
  if (shouldAddSections) {
    luaCode = addSectionComments(luaCode);
  }

  // Output
  if (outputFile) {
    fs.writeFileSync(outputFile, luaCode, 'utf-8');
    console.log(`✓ Compilado com sucesso: ${outputFile}`);
  } else {
    // Output to stdout
    process.stdout.write(luaCode);
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});