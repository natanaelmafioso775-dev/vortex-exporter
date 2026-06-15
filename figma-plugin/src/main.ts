/// <reference types="@figma/plugin-typings" />

/**
 * Vortex UI Exporter — Main Plugin Entry
 * Plugin Figma que exporta componentes UI_* para JSON Vortex Schema
 * 
 * O HTML da UI é injetado pelo build script (esbuild) como a constante HTML_UI
 */

import { parseSelection } from './parser';
import { ParseResult } from './types';
import { getComponentType } from './component-detector';

// Esta constante será substituída pelo build.js com o conteúdo de ui.html
declare const HTML_UI: string;

// Estado do plugin
let lastResult: ParseResult | null = null;

/**
 * Processa a seleção atual e gera o JSON
 */
function processSelection(): void {
  const selection = figma.currentPage.selection;

  console.log('[Vortex] === processSelection ===');
  console.log('[Vortex] Selection count:', selection.length);
  console.log('[Vortex] Selection names:', selection.map((n) => `"${n.name}" (type=${n.type})`).join(', '));

  if (selection.length === 0) {
    console.log('[Vortex] No selection — showing error');
    figma.ui.postMessage({
      type: 'error',
      message: 'Nenhum elemento selecionado. Selecione um frame UI_Window com componentes UI_Button, UI_Input, etc.',
    });
    return;
  }

  // Loga o tipo detectado de cada nó
  for (const node of selection) {
    const ct = getComponentType(node.name);
    console.log(`[Vortex]   Node "${node.name}" → componentType: ${ct || 'NULL'}`);
    if ('children' in node) {
      const frame = node as FrameNode;
      console.log(`[Vortex]   Children count: ${frame.children.length}`);
      for (const child of frame.children) {
        const cct = getComponentType(child.name);
        console.log(`[Vortex]     Child "${child.name}" (type=${child.type}) → componentType: ${cct || 'NULL'}`);
      }
    }
  }

  try {
    const result = parseSelection(selection, {
      name: figma.root.name || 'Vortex RP',
      author: 'Vortex RP',
      theme: 'dark',
    });

    lastResult = result;

    console.log('[Vortex] Parse result:', JSON.stringify({
      window: result.schema.window,
      childrenCount: result.schema.children.length,
      errors: result.errors,
      warnings: result.warnings,
    }));

    if (result.errors.length > 0) {
      console.log('[Vortex] Errors found:', result.errors);
      figma.ui.postMessage({
        type: 'error',
        message: result.errors.join('\n'),
      });
      return;
    }

    // Envia o schema como JSON para a UI
    const jsonText = JSON.stringify(result.schema, null, 2);
    console.log(`[Vortex] Sending JSON (${jsonText.length} bytes)`);
    console.log(`[Vortex] JSON preview:`, jsonText.substring(0, 200));
    figma.ui.postMessage({
      type: 'json',
      json: jsonText,
      warnings: result.warnings,
    });
  } catch (err: any) {
    console.error('[Vortex] PARSE ERROR:', err);
    figma.ui.postMessage({
      type: 'error',
      message: `Erro interno: ${err.message}`,
    });
  }
}

// Escuta mudanças de seleção
figma.on('selectionchange', () => {
  console.log('[Vortex] selectionchange event fired');
  processSelection();
});

// Escuta mensagens da UI
figma.ui.onmessage = (msg: any) => {
  console.log('[Vortex] UI message:', msg.type);
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
console.log('[Vortex] Plugin starting, showing UI...');
figma.showUI(HTML_UI, { width: 340, height: 520 });

// Processa seleção inicial
setTimeout(() => {
  processSelection();
}, 500);
