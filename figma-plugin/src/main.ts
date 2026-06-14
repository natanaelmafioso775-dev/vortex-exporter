/// <reference types="@figma/plugin-typings" />

/**
 * Vortex UI Exporter — Main Plugin Entry
 * Plugin Figma que exporta componentes UI_* para JSON Vortex Schema
 * 
 * O HTML da UI é injetado pelo build script (esbuild) como a constante HTML_UI
 */

import { parseSelection } from './parser';
import { ParseResult } from './types';

// Esta constante será substituída pelo build.js com o conteúdo de ui.html
declare const HTML_UI: string;

// Estado do plugin
let lastResult: ParseResult | null = null;

/**
 * Processa a seleção atual e gera o JSON
 */
function processSelection(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Nenhum elemento selecionado. Selecione um frame UI_Window com componentes UI_Button, UI_Input, etc.',
    });
    return;
  }

  const result = parseSelection(selection, {
    name: figma.root.name || 'Vortex RP',
    author: 'Vortex RP',
    theme: 'dark',
  });

  lastResult = result;

  if (result.errors.length > 0) {
    figma.ui.postMessage({
      type: 'error',
      message: result.errors.join('\n'),
    });
    return;
  }

  // Envia o schema como JSON para a UI
  const jsonText = JSON.stringify(result.schema, null, 2);
  figma.ui.postMessage({
    type: 'json',
    json: jsonText,
    warnings: result.warnings,
  });
}

// Escuta mudanças de seleção
figma.on('selectionchange', () => {
  processSelection();
});

// Escuta mensagens da UI
figma.ui.onmessage = (msg: any) => {
  switch (msg.type) {
    case 'refresh':
      processSelection();
      break;
    case 'close':
      figma.closePlugin();
      break;
  }
};

// Mostra a UI com o HTML inline
figma.showUI(HTML_UI, { width: 320, height: 480 });

// Processa seleção inicial
processSelection();