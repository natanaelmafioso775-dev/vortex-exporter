/// <reference types="@figma/plugin-typings" />

import {
  VortexSchema, WindowComponent, UIComponent,
  ParseResult, FillDef, StrokeDef, EffectDef,
} from './types';
import { getComponentType } from './component-detector';

// ============================================================================
// NAME PROPERTY PARSER — Extrai props do nome do layer
// ============================================================================

const ANIMATION_KEYWORDS: Record<string, string> = {
  'fadein': 'fadeIn', 'fadeout': 'fadeOut', 'fade': 'fadeIn',
  'hoverscale': 'hoverScale', 'hovercolor': 'hoverColor', 'hover': 'hoverScale',
  'slideleft': 'slideLeft', 'slideright': 'slideRight', 'slideup': 'slideUp',
  'slidedown': 'slideDown', 'slide': 'slideLeft',
  'zoomin': 'zoomIn', 'zoomout': 'zoomOut', 'zoom': 'zoomIn',
  'spring': 'spring', 'bounce': 'bounce', 'elastic': 'elastic', 'rotate': 'rotate',
  'scalein': 'scaleIn', 'scaleout': 'scaleOut', 'scale': 'scaleIn',
};

const THEME_KEYWORDS = [
  'primary', 'secondary', 'surface', 'success', 'danger', 'warning',
  'info', 'light', 'dark', 'accent', 'error', 'ghost',
  'outline', 'gradient', 'neon', 'glow', 'glass',
];

const ICON_NAMES: Record<string, string> = {
  'home': '🏠', 'user': '👤', 'settings': '⚙️', 'search': '🔍',
  'plus': '+', 'minus': '-', 'close': '✕', 'check': '✓',
  'arrow-left': '←', 'arrow-right': '→', 'arrow-up': '↑', 'arrow-down': '↓',
  'heart': '♥', 'star': '★', 'clock': '⏱', 'calendar': '📅',
  'mail': '✉', 'phone': '📞', 'camera': '📷', 'video': '🎥',
  'music': '🎵', 'play': '▶', 'pause': '⏸', 'stop': '⏹',
  'download': '⬇', 'upload': '⬆', 'trash': '🗑', 'edit': '✏',
  'lock': '🔒', 'unlock': '🔓', 'bell': '🔔', 'info': 'ℹ',
};

/** Extrai texto entre parênteses/colchetes no nome */
function extractParenthesizedText(name: string): string | null {
  const match = name.match(/[\(\[\{]([^\)\]\}]+)[\)\]\}]/);
  return match ? match[1].trim() : null;
}

/** Extrai propriedades do nome: prop=value, prop:value, animações, temas, ícones */
function parseNameProps(name: string): Record<string, string> {
  const props: Record<string, string> = {};

  // Remove o prefixo UI_XXX para pegar só os parâmetros
  const baseName = name.replace(/^(UI_[A-Za-z]+|Btn|UI_)/, '');

  // prop=value ou prop:value
  const propRegex = /([a-zA-Z_]+)[=:]([a-zA-Z0-9_.#-]+)/g;
  let match;
  while ((match = propRegex.exec(name)) !== null) {
    props[match[1].toLowerCase()] = match[2];
  }
  while ((match = propRegex.exec(baseName)) !== null) {
    props[match[1].toLowerCase()] = match[2];
  }

  // Texto entre parênteses
  const parenText = extractParenthesizedText(name) || extractParenthesizedText(baseName);
  if (parenText && !props['text']) {
    props['text'] = parenText;
  }

  // Animação
  const lower = name.toLowerCase();
  for (const [keyword, animType] of Object.entries(ANIMATION_KEYWORDS)) {
    if (lower.includes(keyword)) {
      props['animation'] = animType;
      break;
    }
  }

  // Tema
  for (const theme of THEME_KEYWORDS) {
    if (lower.includes(theme)) {
      props['theme'] = theme;
      break;
    }
  }

  // Ícone
  for (const [iconKey, iconChar] of Object.entries(ICON_NAMES)) {
    if (lower.includes(iconKey)) {
      props['icon'] = iconChar;
      break;
    }
  }

  return props;
}

// ============================================================================
// UTILS
// ============================================================================

/** Lê cor de um nó a partir de fills/strokes */
function extractFigmaColor(paint: Paint): { r: number; g: number; b: number; a: number } | null {
  if (paint.type === 'SOLID' && paint.color) {
    return {
      r: Math.round(paint.color.r * 255),
      g: Math.round(paint.color.g * 255),
      b: Math.round(paint.color.b * 255),
      a: paint.opacity !== undefined ? Math.round(paint.opacity * 255) : 255,
    };
  }
  return null;
}

/** Extrai cor hexadecimal (#rrggbb ou #rrggbbaa) a partir de Paint */
function colorToHex(color: { r: number; g: number; b: number; a: number } | null): string {
  if (!color) return '#ffffff';
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');
  const a = color.a < 255 ? color.a.toString(16).padStart(2, '0') : '';
  return `#${r}${g}${b}${a}`;
}

/** Extrai todos os fills visíveis de um nó */
function extractFills(node: SceneNode): FillDef[] {
  const fills: FillDef[] = [];
  if ('fills' in node && Array.isArray((node as any).fills)) {
    for (const paint of (node as any).fills as Paint[]) {
      if (!paint.visible && paint.visible !== undefined) continue;
      if (paint.type === 'SOLID') {
        fills.push({
          type: 'solid',
          color: extractFigmaColor(paint) || undefined,
          opacity: paint.opacity,
        });
      } else if (paint.type === 'GRADIENT_LINEAR') {
        const gradientStops = paint.gradientStops?.map((stop: any) => ({
          color: {
            r: Math.round(stop.color.r * 255),
            g: Math.round(stop.color.g * 255),
            b: Math.round(stop.color.b * 255),
            a: Math.round((stop.color.a ?? 1) * 255),
          },
          position: stop.position,
        }));
        fills.push({
          type: 'gradient-linear',
          gradientStops,
          opacity: paint.opacity,
        });
      } else if (paint.type === 'GRADIENT_RADIAL') {
        const gradientStops = paint.gradientStops?.map((stop: any) => ({
          color: {
            r: Math.round(stop.color.r * 255),
            g: Math.round(stop.color.g * 255),
            b: Math.round(stop.color.b * 255),
            a: Math.round((stop.color.a ?? 1) * 255),
          },
          position: stop.position,
        }));
        fills.push({
          type: 'gradient-radial',
          gradientStops,
          opacity: paint.opacity,
        });
      }
    }
  }
  return fills;
}

/** Extrai strokes de um nó */
function extractStrokes(node: SceneNode): StrokeDef[] {
  const strokes: StrokeDef[] = [];
  if ('strokes' in node && Array.isArray((node as any).strokes)) {
    for (const paint of (node as any).strokes as Paint[]) {
      if (!paint.visible && paint.visible !== undefined) continue;
      if (paint.type === 'SOLID') {
        strokes.push({
          color: extractFigmaColor(paint) || undefined,
          weight: (node as any).strokeWeight,
          align: (node as any).strokeAlign,
        });
      }
    }
  }
  return strokes;
}

/** Extrai efeitos (shadow, blur, glow, noise, texture) */
function extractEffects(node: SceneNode): EffectDef[] {
  const effects: EffectDef[] = [];
  if ('effects' in node && Array.isArray((node as any).effects)) {
    console.log(`[Vortex] Raw effects for "${node.name}":`, (node as any).effects.map((e: any) => ({ type: e.type, visible: e.visible, radius: e.radius })));
    for (const eff of (node as any).effects) {
      if (!eff.visible && eff.visible !== undefined) continue;
      console.log(`[Vortex]   Effect: type=${eff.type}, visible=${eff.visible}, radius=${eff.radius}`);

      if (eff.type === 'DROP_SHADOW' || eff.type === 'INNER_SHADOW') {
        effects.push({
          type: eff.type === 'DROP_SHADOW' ? 'drop-shadow' : 'inner-shadow',
          radius: eff.radius,
          offsetX: eff.offset?.x || 0,
          offsetY: eff.offset?.y || 0,
          spread: eff.spread || 0,
          color: eff.color ? {
            r: Math.round(eff.color.r * 255),
            g: Math.round(eff.color.g * 255),
            b: Math.round(eff.color.b * 255),
            a: Math.round((eff.color.a ?? 1) * 255),
          } : undefined,
          visible: true,
        });
      } else if (eff.type === 'LAYER_BLUR') {
        effects.push({
          type: 'layer-blur',
          radius: eff.radius,
          offsetX: 0, offsetY: 0,
          visible: true,
        });
      } else if (eff.type === 'BACKGROUND_BLUR') {
        effects.push({
          type: 'background-blur',
          radius: eff.radius,
          offsetX: 0, offsetY: 0,
          visible: true,
        });
      } else if (eff.type === 'GLOW' || eff.type === 'INNER_GLOW') {
        effects.push({
          type: eff.type === 'INNER_GLOW' ? 'glow' : 'glow',
          radius: eff.radius,
          offsetX: 0, offsetY: 0,
          spread: eff.spread || 0,
          color: eff.color ? {
            r: Math.round(eff.color.r * 255),
            g: Math.round(eff.color.g * 255),
            b: Math.round(eff.color.b * 255),
            a: Math.round((eff.color.a ?? 1) * 255),
          } : undefined,
          visible: true,
        });
      } else if (eff.type === 'TEXTURE' || eff.type === 'NOISE') {
        effects.push({
          type: 'layer-blur', // Noise/texture são armazenados como layer-blur com radius 0
          radius: 0,
          offsetX: 0, offsetY: 0,
          visible: true,
        });
      } else {
        console.log(`[Vortex]   ⚠ Unknown effect type: ${eff.type} — skipping`);
      }
    }
  }
  return effects;
}

/** Extrai propriedades de fonte de um TextNode */
function extractFontProps(node: TextNode) {
  const fontSize = typeof node.fontSize === 'number' ? node.fontSize : 16;
  const fontName = node.fontName as FontName;
  return {
    fontSize,
    fontFamily: fontName?.family || 'Inter',
    fontWeight: fontName?.style === 'Bold' ? 700 : fontName?.style === 'Medium' ? 500 : 400,
    textCase: (node.textCase || 'ORIGINAL').toLowerCase() as any,
    textDecoration: (node.textDecoration || 'NONE').toLowerCase() === 'underline' ? 'underline' as const
      : (node.textDecoration || 'NONE').toLowerCase() === 'strikethrough' ? 'strikethrough' as const
      : 'none' as const,
    letterSpacing: typeof node.letterSpacing === 'number' ? node.letterSpacing : 0,
    lineHeight: typeof node.lineHeight === 'number' ? node.lineHeight : node.lineHeight?.value ?? 100,
  };
}

/** Extrai cor de um TextNode (dos fills) */
function extractTextColor(node: TextNode): string {
  if ('fills' in node && Array.isArray((node as any).fills)) {
    for (const paint of (node as any).fills as Paint[]) {
      if (!paint.visible) continue;
      if (paint.type === 'SOLID' && paint.color) {
        return colorToHex(extractFigmaColor(paint));
      }
    }
  }
  return '#ffffff';
}

// ============================================================================
// PARSE NODES
// ============================================================================

/**
 * Converte um SceneNode do Figma em um componente UI
 * Agora captura posição, filhos, fontes, cores, fills etc.
 */
function parseNode(node: SceneNode): UIComponent | null {
  const componentType = getComponentType(node.name);
  if (!componentType || componentType === 'window') return null;

  // Posição e dimensões
  const x = Math.round('x' in node ? node.x : 0);
  const y = Math.round('y' in node ? node.y : 0);
  const width = Math.round('width' in node ? node.width : 0);
  const height = Math.round('height' in node ? node.height : 0);
  const cornerRadius = (node as any).cornerRadius || ((node as any).topLeftRadius || (node as any).rectangleCornerRadii?.[0]) || 0;
  const visible = !('visible' in node) || node.visible !== false;
  const alpha = 'opacity' in node ? node.opacity : 1;

  // Properties visuais
  const fills = extractFills(node);
  const strokes = extractStrokes(node);
  const effects = extractEffects(node);

  // Filhos aninhados
  const children: UIComponent[] = [];
  if ('children' in node) {
    const frame = node as FrameNode;
    for (const child of frame.children) {
      const parsed = parseNode(child);
      if (parsed) children.push(parsed);
    }
  }

  const base: any = {
    id: node.id,
    x, y, width, height,
    visible,
    alpha,
    zIndex: children.length,
    cornerRadius: Math.round(cornerRadius),
    fills: fills.length > 0 ? fills : undefined,
    strokes: strokes.length > 0 ? strokes : undefined,
    effects: effects.length > 0 ? effects : undefined,
    children: children.length > 0 ? children : undefined,
  };

  const nameProps = parseNameProps(node.name);

  switch (componentType) {
    case 'button': {
      // Procura filho de texto dentro do botão
      let buttonText = nameProps['text'] || '';
      let btnFontSize: number | undefined = nameProps['fontsize'] ? parseInt(nameProps['fontsize']) : undefined;
      let btnFontFamily: string | undefined = nameProps['fontfamily'];
      let btnFontWeight: number | undefined = nameProps['fontweight'] === 'bold' ? 700 : nameProps['fontweight'] ? parseInt(nameProps['fontweight']) : undefined;
      let btnFontColor: string | undefined = nameProps['color'] || nameProps['hovercolor'] ? undefined : undefined;

      if ('children' in node) {
        for (const child of (node as FrameNode).children) {
          if (child.type === 'TEXT') {
            const textNode = child as TextNode;
            buttonText = buttonText || textNode.characters;
            const fp = extractFontProps(textNode);
            btnFontSize = btnFontSize || fp.fontSize;
            btnFontFamily = btnFontFamily || fp.fontFamily;
            btnFontWeight = btnFontWeight || fp.fontWeight;
            btnFontColor = btnFontColor || extractTextColor(textNode);
            break;
          }
        }
      }

      if (!buttonText) {
        buttonText = node.name.replace(/^(UI_Button|Btn)_?/, '').replace(/_.*/, '') || 'Button';
      }

      return {
        ...base,
        type: 'button',
        text: buttonText,
        fontSize: btnFontSize || 14,
        fontFamily: btnFontFamily || 'Inter',
        fontWeight: btnFontWeight || 600,
        fontColor: btnFontColor || '#ffffff',
        textAlign: nameProps['align'] as any || 'center',
        theme: (nameProps['theme'] || (node.name.includes('secondary') ? 'secondary'
          : node.name.includes('danger') ? 'danger'
          : node.name.includes('ghost') ? 'ghost'
          : 'primary')) as any,
        disabled: nameProps['disabled'] === 'true' || node.name.includes('Disabled'),
        onClick: nameProps['onclick'],
        icon: nameProps['icon'],
        iconPos: (nameProps['iconpos'] as any) || 'left',
        loading: nameProps['loading'] === 'true',
        animation: nameProps['animation'] || undefined,
      };
    }

    case 'input': {
      let placeholder = nameProps['placeholder'] || '';
      let inputFontSize: number | undefined = nameProps['fontsize'] ? parseInt(nameProps['fontsize']) : undefined;
      let inputFontColor: string | undefined = nameProps['color'] ? undefined : undefined;

      if ('children' in node) {
        for (const child of (node as FrameNode).children) {
          if (child.type === 'TEXT') {
            const textNode = child as TextNode;
            placeholder = placeholder || textNode.characters;
            inputFontSize = inputFontSize || (typeof textNode.fontSize === 'number' ? textNode.fontSize : undefined);
            inputFontColor = inputFontColor || extractTextColor(textNode);
            break;
          }
        }
      }

      return {
        ...base,
        type: 'input',
        placeholder: placeholder || node.name.replace(/^(UI_Input|UI_TextInput)_?/, '') || 'Enter text...',
        password: nameProps['masked'] === 'true' || node.name.includes('Password'),
        masked: nameProps['masked'] === 'true' || node.name.includes('Password') || node.name.includes('Senha'),
        maxLength: nameProps['maxlength'] ? parseInt(nameProps['maxlength']) : 64,
        defaultValue: nameProps['defaultvalue'] || nameProps['default'] || '',
        fontSize: inputFontSize || 14,
        fontColor: inputFontColor || '#ffffff',
        textAlign: nameProps['align'] as any || 'left',
        theme: nameProps['theme'] || undefined,
        animation: nameProps['animation'] || undefined,
      };
    }

    case 'text': {
      let textContent = nameProps['text'] || '';
      if (node.type === 'TEXT') {
        const textNode = node as TextNode;
        textContent = textContent || textNode.characters;
        const fp = extractFontProps(textNode);
        return {
          ...base,
          type: 'text',
          text: textContent,
          fontSize: nameProps['fontsize'] ? parseInt(nameProps['fontsize']) : fp.fontSize,
          fontFamily: nameProps['fontfamily'] || fp.fontFamily,
          fontWeight: nameProps['fontweight'] === 'bold' ? 700 : nameProps['fontweight'] ? parseInt(nameProps['fontweight']) : fp.fontWeight,
          fontColor: nameProps['color'] || extractTextColor(textNode),
          align: (nameProps['align'] as any) || (textNode.textAlignHorizontal || 'LEFT').toLowerCase(),
          verticalAlign: (textNode.textAlignVertical || 'TOP').toLowerCase() as any,
          textCase: (nameProps['textcase'] as any) || fp.textCase,
          textDecoration: (nameProps['decoration'] as any) || fp.textDecoration,
          letterSpacing: nameProps['letterspacing'] ? parseFloat(nameProps['letterspacing']) : fp.letterSpacing,
          lineHeight: nameProps['lineheight'] ? parseFloat(nameProps['lineheight']) : fp.lineHeight,
          animation: nameProps['animation'] || undefined,
          theme: nameProps['theme'] || undefined,
        };
      }
      return {
        ...base,
        type: 'text',
        text: textContent || node.name,
        fontSize: nameProps['fontsize'] ? parseInt(nameProps['fontsize']) : 14,
        fontFamily: nameProps['fontfamily'],
        fontWeight: nameProps['fontweight'] === 'bold' ? 700 : undefined,
        fontColor: nameProps['color'],
        align: (nameProps['align'] as any) || 'left',
        animation: nameProps['animation'] || undefined,
        theme: nameProps['theme'] || undefined,
      };
    }

    case 'image':
      return {
        ...base,
        type: 'image',
        src: nameProps['src'] || '',
        animation: nameProps['animation'] || undefined,
      };

    case 'svg':
      return {
        ...base,
        type: 'svg',
        src: nameProps['src'] || '',
        animation: nameProps['animation'] || undefined,
      };

    case 'group':
      return {
        ...base,
        type: 'group',
        layout: nameProps['layout'] || ((node as any).layoutMode === 'VERTICAL' ? 'vertical' : 'horizontal'),
        gap: nameProps['gap'] ? parseInt(nameProps['gap']) : ((node as any).itemSpacing || 0),
        padding: {
          top: (node as any).paddingTop || 0,
          right: (node as any).paddingRight || 0,
          bottom: (node as any).paddingBottom || 0,
          left: (node as any).paddingLeft || 0,
        },
        theme: nameProps['theme'] || undefined,
      };

    case 'dropdown':
    case 'select':
      return {
        ...base,
        type: 'dropdown' as any,
        text: nameProps['text'] || 'Select',
        options: nameProps['options']?.split(',').map((s: string) => s.trim().replace(/^\[|\]$/g, '')) || [],
        selectedIndex: 0,
        theme: nameProps['theme'] || undefined,
      };

    case 'checkbox':
    case 'check':
      return {
        ...base,
        type: 'checkbox' as any,
        text: nameProps['text'] || '',
        checked: nameProps['default'] === 'true',
        fontSize: nameProps['fontsize'] ? parseInt(nameProps['fontsize']) : 14,
        theme: nameProps['theme'] || undefined,
      };

    case 'radio':
      return {
        ...base,
        type: 'radio' as any,
        text: nameProps['text'] || '',
        selected: nameProps['default'] === 'true',
        theme: nameProps['theme'] || undefined,
      };

    case 'switch':
    case 'toggle':
      return {
        ...base,
        type: 'switch' as any,
        text: nameProps['text'] || '',
        checked: nameProps['default'] === 'true',
        theme: nameProps['theme'] || undefined,
      };

    case 'slider':
    case 'range':
      return {
        ...base,
        type: 'slider' as any,
        min: nameProps['min'] ? parseInt(nameProps['min']) : 0,
        max: nameProps['max'] ? parseInt(nameProps['max']) : 100,
        value: nameProps['default'] ? parseInt(nameProps['default']) : 50,
        step: nameProps['step'] ? parseInt(nameProps['step']) : 1,
        suffix: nameProps['suffix'],
        prefix: nameProps['prefix'],
        showValue: nameProps['showvalue'] === 'true',
        theme: nameProps['theme'] || undefined,
      };

    case 'progress':
    case 'loading':
      return {
        ...base,
        type: 'progress' as any,
        min: nameProps['min'] ? parseInt(nameProps['min']) : 0,
        max: nameProps['max'] ? parseInt(nameProps['max']) : 100,
        value: nameProps['default'] ? parseInt(nameProps['default']) : 0,
        showLabel: nameProps['showlabel'] === 'true',
        theme: nameProps['theme'] || undefined,
      };

    case 'tabs':
      return {
        ...base,
        type: 'tabs' as any,
        tabs: [],
        selectedIndex: 0,
        theme: nameProps['theme'] || undefined,
      };

    case 'tooltip':
      return {
        ...base,
        type: 'tooltip' as any,
        text: nameProps['text'] || '',
        position: (nameProps['position'] as any) || 'top',
        delay: nameProps['delay'] ? parseInt(nameProps['delay']) : 500,
        maxWidth: nameProps['maxwidth'] ? parseInt(nameProps['maxwidth']) : 200,
        theme: nameProps['theme'] || undefined,
      };

    case 'scrollview':
    case 'scroll':
      return {
        ...base,
        type: 'scrollview' as any,
        showScrollbar: nameProps['scrollbar'] !== 'none',
        theme: nameProps['theme'] || undefined,
      };

    case 'rectangle':
      return { ...base, type: 'rectangle' as any };

    default:
      return { ...base, type: 'group' };
  }
}

/**
 * Converte o nó Window para WindowComponent (agora com dados visuais)
 */
function parseWindow(node: SceneNode): WindowComponent {
  const nameProps = parseNameProps(node.name);
  const cornerRadius = (node as any).cornerRadius || ((node as any).topLeftRadius || (node as any).rectangleCornerRadii?.[0]) || 0;
  const alpha = 'opacity' in node ? node.opacity : 1;
  const fills = extractFills(node);
  const strokes = extractStrokes(node);
  const effects = extractEffects(node);

  // Posição absoluta da window no Figma
  const winX = 'x' in node ? Math.round(node.x) : 0;
  const winY = 'y' in node ? Math.round(node.y) : 0;

  // Auto-detecta o anchor baseado na posição se não tiver anchor= no nome
  let anchor = nameProps['anchor'] as any;
  if (!anchor) {
    // Se o frame está no centro (aproximadamente), usa center
    // Caso contrário, usa a posição absoluta como offset
    anchor = 'center';
  }

  return {
    type: 'window',
    title: nameProps['title'] || extractParenthesizedText(node.name) || node.name.replace(/^UI_Window_?/, '') || 'Window',
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: winX,
    y: winY,
    anchor: anchor,
    closable: nameProps['closable'] !== 'false',
    draggable: nameProps['draggable'] !== 'false',
    alpha: alpha,
    cornerRadius: Math.round(cornerRadius),
    fills: fills.length > 0 ? fills : undefined,
    strokes: strokes.length > 0 ? strokes : undefined,
    effects: effects.length > 0 ? effects : undefined,
    animation: { enter: nameProps['animation'] || 'fadeIn', duration: nameProps['duration'] ? parseInt(nameProps['duration']) : 300 },
  };
}

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

export function parseSelection(
  selection: readonly SceneNode[],
  metadata?: { name?: string; author?: string; theme?: 'dark' | 'light' }
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let windowNode: SceneNode | null = null;

  // 1. Procura UI_Window na seleção ou nos filhos
  for (const node of selection) {
    if (getComponentType(node.name) === 'window') {
      windowNode = node;
      break;
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        if (getComponentType(child.name) === 'window') {
          windowNode = child;
          break;
        }
      }
    }
    if (windowNode) break;
  }

  if (!windowNode) {
    errors.push('Nenhuma UI_Window encontrada. Selecione um frame com nome "UI_Window".');
    return {
      schema: {
        version: '1.0',
        metadata: { name: 'Untitled', author: 'Vortex RP', theme: 'dark' },
        window: { type: 'window', title: 'Untitled', width: 600, height: 400, anchor: 'center' },
        children: [],
      },
      errors,
      warnings,
    };
  }

  const window = parseWindow(windowNode);

  // Posição absoluta da window no Figma (para converter coordenadas pra relativo)
  const windowX = 'x' in windowNode ? windowNode.x : 0;
  const windowY = 'y' in windowNode ? windowNode.y : 0;
  console.log(`[Vortex] Window absolute position: (${windowX}, ${windowY})`);

  // 1b. Procura UI_Background opcional na seleção
  let backgroundNode: SceneNode | null = null;
  for (const node of selection) {
    if (node.name === 'UI_Background' || node.name.startsWith('UI_Background_')) {
      backgroundNode = node;
      break;
    }
  }
  let background: WindowComponent | undefined;
  if (backgroundNode) {
    background = parseWindow(backgroundNode);
    console.log(`[Vortex] UI_Background detected`);
  } else {
    console.log(`[Vortex] No UI_Background — window only, no overlay`);
  }

  // 2. Parse todos os filhos da window (preservando hierarquia)
  const children: UIComponent[] = [];
  const seenIds = new Set<string>();

  /**
   * Helper: converte coordenadas absolutas para relativas à window
   */
  function makeRelative(comp: UIComponent): UIComponent {
    if (comp.x !== undefined) comp.x = Math.round(comp.x - windowX);
    if (comp.y !== undefined) comp.y = Math.round(comp.y - windowY);
    if (comp.children) {
      comp.children = comp.children.map(makeRelative);
    }
    return comp;
  }

  // 2a. Lê os filhos DENTRO da window (aninhados)
  if ('children' in windowNode) {
    const frame = windowNode as FrameNode;
    for (const child of frame.children) {
      const parsed = parseNode(child);
      if (parsed && parsed.id && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        // Filhos dentro do frame já são relativos no Figma — verificar
        console.log(`[Vortex]   Child "${child.name}" figma x=${child.x}, y=${child.y}, w=${child.width}, h=${child.height}`);
        if (parsed.x !== undefined) console.log(`[Vortex]     → Parsed position: (${parsed.x}, ${parsed.y})`);
        children.push(parsed);
      }
    }
  }

  // 2b. Lê componentes da SELEÇÃO ATUAL (coordenadas absolutas → corrigir pra relativo)
  for (const node of selection) {
    const ct = getComponentType(node.name);
    if (ct && ct !== 'window' && node.id && !seenIds.has(node.id)) {
      const parsed = parseNode(node);
      if (parsed && parsed.id && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        console.log(`[Vortex]   Selection "${node.name}" figma x=${node.x}, y=${node.y}, windowX=${windowX}, windowY=${windowY}`);
        const relative = makeRelative(parsed);
        console.log(`[Vortex]     → Relative position: (${relative.x}, ${relative.y})`);
        children.push(relative);
      }
    }
    // Se o nó da seleção tem filhos UI, processa também
    if ('children' in node) {
      const frame = node as FrameNode;
      for (const child of frame.children) {
        const cct = getComponentType(child.name);
        if (cct && cct !== 'window' && child.id && !seenIds.has(child.id)) {
          const parsed = parseNode(child);
          if (parsed && parsed.id && !seenIds.has(parsed.id)) {
            seenIds.add(parsed.id);
            children.push(makeRelative(parsed));
          }
        }
      }
    }
  }

  console.log(`[Vortex] Total children parsed: ${children.length}`);

  const schema: VortexSchema = {
    version: '1.0',
    metadata: {
      name: metadata?.name || windowNode.name.replace(/^UI_Window_?/, '') || 'Panel',
      author: metadata?.author || 'Vortex RP',
      theme: metadata?.theme || 'dark',
    },
    window,
    background: background,
    children,
  };

  return { schema, errors, warnings };
}