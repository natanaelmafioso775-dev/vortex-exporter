/**
 * Vortex Compiler — Lua Generator
 * Converte o schema JSON Vortex em código Lua executável no MTA
 */

import {
  VortexSchema,
  WindowComponent,
  ButtonComponent,
  InputComponent,
  TextComponent,
  ImageComponent,
  SvgComponent,
  UIComponent,
} from './types';

/**
 * Escapa string para literal Lua
 */
function escapeLuaString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Gera código Lua para uma tabela de props
 */
function generateProps(props: Record<string, any>, indent: string = '    '): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;

    if (key === 'id' || key === 'type') continue; // Props internos, ignorar

    if (typeof value === 'string') {
      lines.push(`${indent}${key} = "${escapeLuaString(value)}"`);
    } else if (typeof value === 'number') {
      lines.push(`${indent}${key} = ${value}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${indent}${key} = ${value}`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Objeto aninhado (ex: animation)
      const nested = generateProps(value, indent + '    ');
      if (nested) {
        lines.push(`${indent}${key} = {`);
        lines.push(nested);
        lines.push(`${indent}}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Gera código para um componente Button
 */
function generateButton(comp: ButtonComponent, varName: string): string {
  const props = generateProps({
    text: comp.text || 'Button',
    width: comp.width || 200,
    height: comp.height || 50,
    theme: comp.theme || 'primary',
    disabled: comp.disabled || false,
  });

  return `local ${varName} = UI.Button({\n${props}\n})`;
}

/**
 * Gera código para um componente Input
 */
function generateInput(comp: InputComponent, varName: string): string {
  const props = generateProps({
    placeholder: comp.placeholder || '',
    password: comp.password || false,
    maxLength: comp.maxLength || 64,
    value: comp.value || '',
    width: comp.width || 300,
    height: comp.height || 44,
  });

  return `local ${varName} = UI.Input({\n${props}\n})`;
}

/**
 * Gera código para um componente Text
 */
function generateText(comp: TextComponent, varName: string): string {
  const props = generateProps({
    text: comp.text || '',
    color: comp.color || 'textPrimary',
    scale: comp.scale || 1,
    font: comp.font || 'default',
    alignX: comp.alignX || 'left',
    alignY: comp.alignY || 'center',
    wordBreak: comp.wordBreak || false,
  });

  return `local ${varName} = UI.Text({\n${props}\n})`;
}

/**
 * Gera código para um componente Image
 */
function generateImage(comp: ImageComponent, varName: string): string {
  const props = generateProps({
    src: comp.src,
    width: comp.width || 100,
    height: comp.height || 100,
    fitMode: comp.fitMode || 'fill',
  });

  return `local ${varName} = UI.Image({\n${props}\n})`;
}

/**
 * Gera código para um componente SVG
 */
function generateSvg(comp: SvgComponent, varName: string): string {
  const props = generateProps({
    src: comp.src,
    width: comp.width || 24,
    height: comp.height || 24,
    color: comp.color || 'white',
  });

  return `local ${varName} = UI.SVG({\n${props}\n})`;
}

/**
 * Gera código Lua para um componente
 */
function generateComponent(comp: UIComponent, index: number): string {
  const varName = comp.id
    ? `comp_${comp.id.replace(/[^a-zA-Z0-9]/g, '_')}`
    : `${comp.type}_${index + 1}`;

  switch (comp.type) {
    case 'button': return generateButton(comp, varName);
    case 'input':  return generateInput(comp, varName);
    case 'text':   return generateText(comp, varName);
    case 'image':  return generateImage(comp, varName);
    case 'svg':    return generateSvg(comp, varName);
    default:       return `-- Tipo desconhecido: ${(comp as any).type}`;
  }
}

/**
 * Gerador principal: schema → código Lua
 */
export function generateLua(schema: VortexSchema): string {
  const lines: string[] = [];

  // Header
  const panelName = schema.metadata?.name || 'GeneratedPanel';
  lines.push(`--[[`);
  lines.push(`    Vortex UI Framework — ${panelName}`);
  if (schema.metadata?.author) {
    lines.push(`    Autor: ${schema.metadata.author}`);
  }
  lines.push(`    Gerado automaticamente pelo Vortex Compiler`);
  lines.push(`    Versão do schema: ${schema.version}`);
  lines.push(`--]]`);
  lines.push('');

  // Função que cria o painel
  lines.push('local panelWindow = nil');
  lines.push('');
  lines.push(`function open${capitalize(panelName.replace(/[^a-zA-Z0-9]/g, ''))}()`);
  lines.push('    if panelWindow then');
  lines.push('        UI.destroyWindow(panelWindow)');
  lines.push('    end');
  lines.push('');

  // Window
  const win = schema.window;
  const winProps = generateProps({
    title: win.title || 'Window',
    width: win.width || 600,
    height: win.height || 400,
    anchor: win.anchor || 'center',
    closable: win.closable !== false,
    draggable: win.draggable !== false,
  });

  lines.push(`    panelWindow = UI.Window({`);
  lines.push(winProps);
  lines.push(`    })`);
  lines.push('');

  // Children
  const childVarNames: string[] = [];
  if (schema.children && schema.children.length > 0) {
    for (let i = 0; i < schema.children.length; i++) {
      const child = schema.children[i];
      const code = generateComponent(child, i);
      const varName = code.match(/^local (\w+)/)?.[1] || '';
      
      lines.push(`    ${code}`);
      lines.push(`    panelWindow:addChild(${varName})`);
      if (varName) childVarNames.push(varName);
      lines.push('');
    }
  }

  // InputManager setup
  lines.push('    -- Habilita cursor e registra input');
  lines.push('    UI.InputManager.setCursorEnabled(true)');
  lines.push('    UI.InputManager.register(panelWindow)');
  lines.push('');

  // Foca no primeiro input
  const firstInput = childVarNames.find(name => name.startsWith('input_'));
  if (firstInput) {
    lines.push(`    UI.InputManager.setFocus(${firstInput})`);
  }
  lines.push('');

  // Animação de entrada
  lines.push('    -- Animação de entrada');
  lines.push('    panelWindow.scale = 0.9');
  lines.push('    panelWindow.alpha = 0');
  lines.push('    UI.Animation.fadeIn(panelWindow, { duration = 300 })');
  lines.push('    UI.Animation.scale(panelWindow, { from = 0.9, to = 1.0, duration = 300 })');
  lines.push('end');
  lines.push('');

  // Fecha no ESC
  lines.push('-- Fecha painel ao pressionar ESC');
  lines.push('bindKey("escape", "down", function()');
  lines.push('    if panelWindow and panelWindow.visible then');
  lines.push('        panelWindow:close()');
  lines.push('        UI.InputManager.setCursorEnabled(false)');
  lines.push('    end');
  lines.push('end)');
  lines.push('');

  // Comando
  const cmdName = panelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  lines.push(`-- Comando para abrir`);
  lines.push(`addCommandHandler("${cmdName}", function()`);
  lines.push(`    open${capitalize(panelName.replace(/[^a-zA-Z0-9]/g, ''))}()`);
  lines.push('end)');
  lines.push('');

  // Auto-abre (opcional, comentado)
  lines.push('-- Descomente para abrir automaticamente ao iniciar o resource');
  lines.push('-- addEventHandler("onClientResourceStart", resourceRoot, function()');
  lines.push(`--     setTimer(open${capitalize(panelName.replace(/[^a-zA-Z0-9]/g, ''))}, 1000, 1)`);
  lines.push('-- end)');
  lines.push('');

  return lines.join('\n');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}