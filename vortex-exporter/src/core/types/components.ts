// ============================================================================
// Component Detection Rules — Mapeia nós do Figma para componentes Voxel
// ============================================================================

import { FigmaNodeType } from './figma';

export interface ComponentRule {
  prefix: string;
  type: ComponentMappedType;
  requiredProps: string[];
  optionalProps: string[];
  allowedChildren: string[];
  figmaNodeType?: FigmaNodeType;
}

export type ComponentMappedType =
  | 'window'
  | 'button'
  | 'input'
  | 'text'
  | 'image'
  | 'svg'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'progress'
  | 'tabs'
  | 'tooltip'
  | 'scrollview'
  | 'group';

export const COMPONENT_RULES: ComponentRule[] = [
  // ==== WINDOW / FRAME ====
  {
    prefix: 'UI_Window',
    type: 'window',
    requiredProps: [],
    optionalProps: ['title', 'theme', 'anchor', 'responsive', 'movable', 'resizable'],
    allowedChildren: ['*'],
    figmaNodeType: 'FRAME',
  },
  {
    prefix: 'UI_Frame',
    type: 'group',
    requiredProps: [],
    optionalProps: ['theme', 'layout', 'gap'],
    allowedChildren: ['*'],
    figmaNodeType: 'FRAME',
  },

  // ==== FORMAS BÁSICAS (detectadas automaticamente pelo tipo de nó) ====
  // RECTANGLE: detectado pelo nó 'RECTANGLE'
  // ELLIPSE: detectado pelo nó 'ELLIPSE'
  // TRIANGLE: detectado pelo nó 'TRIANGLE'
  // POLYGON: detectado pelo nó 'POLYGON'
  // STAR: detectado pelo nó 'STAR'
  // LINE: detectado pelo nó 'LINE'
  // VECTOR: detectado pelo nó 'VECTOR'

  // ==== BUTTON ====
  {
    prefix: 'UI_Button',
    type: 'button',
    requiredProps: [],
    optionalProps: ['text', 'animation', 'theme', 'onClick', 'hoverColor', 'icon', 'iconPos', 'loading', 'fontSize', 'fontWeight', 'disabled'],
    allowedChildren: ['text'],
  },
  {
    prefix: 'Btn',
    type: 'button',
    requiredProps: [],
    optionalProps: ['text', 'animation', 'theme', 'onClick'],
    allowedChildren: ['text'],
  },

  // ==== INPUT ====
  {
    prefix: 'UI_Input',
    type: 'input',
    requiredProps: [],
    optionalProps: ['placeholder', 'masked', 'maxLength', 'defaultValue', 'animation', 'theme', 'prefix', 'suffix', 'type', 'multiline', 'autofocus', 'align'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_TextInput',
    type: 'input',
    requiredProps: [],
    optionalProps: ['placeholder', 'masked', 'maxLength', 'defaultValue', 'animation', 'theme'],
    allowedChildren: [],
  },

  // ==== TEXT ====
  {
    prefix: 'UI_Text',
    type: 'text',
    requiredProps: [],
    optionalProps: ['text', 'fontSize', 'align', 'color', 'animation', 'fontFamily', 'fontWeight', 'textCase', 'decoration', 'letterSpacing', 'lineHeight'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Label',
    type: 'text',
    requiredProps: [],
    optionalProps: ['text', 'fontSize', 'align', 'color', 'animation'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Title',
    type: 'text',
    requiredProps: [],
    optionalProps: ['text', 'fontSize', 'align', 'color', 'animation'],
    allowedChildren: [],
  },

  // ==== IMAGE ====
  {
    prefix: 'UI_Image',
    type: 'image',
    requiredProps: [],
    optionalProps: ['src', 'animation', 'scaleMode'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Img',
    type: 'image',
    requiredProps: [],
    optionalProps: ['src', 'animation'],
    allowedChildren: [],
  },

  // ==== SVG ====
  {
    prefix: 'UI_SVG',
    type: 'svg',
    requiredProps: [],
    optionalProps: ['src', 'animation'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Svg',
    type: 'svg',
    requiredProps: [],
    optionalProps: ['src', 'animation'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: DROPDOWN ====
  {
    prefix: 'UI_Dropdown',
    type: 'dropdown',
    requiredProps: [],
    optionalProps: ['text', 'options', 'default', 'searchable', 'maxVisible', 'theme'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Select',
    type: 'dropdown',
    requiredProps: [],
    optionalProps: ['text', 'options', 'default', 'theme'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: CHECKBOX ====
  {
    prefix: 'UI_Checkbox',
    type: 'checkbox',
    requiredProps: [],
    optionalProps: ['text', 'default', 'theme', 'fontSize'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Check',
    type: 'checkbox',
    requiredProps: [],
    optionalProps: ['text', 'default', 'theme'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: RADIO ====
  {
    prefix: 'UI_Radio',
    type: 'radio',
    requiredProps: [],
    optionalProps: ['text', 'default', 'group', 'theme'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: SWITCH ====
  {
    prefix: 'UI_Switch',
    type: 'switch',
    requiredProps: [],
    optionalProps: ['text', 'default', 'theme', 'activeColor'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Toggle',
    type: 'switch',
    requiredProps: [],
    optionalProps: ['text', 'default', 'theme'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: SLIDER ====
  {
    prefix: 'UI_Slider',
    type: 'slider',
    requiredProps: [],
    optionalProps: ['min', 'max', 'default', 'step', 'suffix', 'prefix', 'orientation', 'showValue', 'format'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Range',
    type: 'slider',
    requiredProps: [],
    optionalProps: ['min', 'max', 'default', 'step', 'suffix'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: PROGRESS ====
  {
    prefix: 'UI_Progress',
    type: 'progress',
    requiredProps: [],
    optionalProps: ['min', 'max', 'default', 'label', 'variant', 'thickness', 'showLabel', 'color', 'trackColor'],
    allowedChildren: [],
  },
  {
    prefix: 'UI_Loading',
    type: 'progress',
    requiredProps: [],
    optionalProps: ['min', 'max', 'default', 'variant'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: TABS ====
  {
    prefix: 'UI_Tabs',
    type: 'tabs',
    requiredProps: [],
    optionalProps: ['tabs', 'default', 'position', 'theme'],
    allowedChildren: ['*'],
  },

  // ==== AVANÇADO: TOOLTIP ====
  {
    prefix: 'UI_Tooltip',
    type: 'tooltip',
    requiredProps: [],
    optionalProps: ['text', 'position', 'delay', 'maxWidth', 'theme'],
    allowedChildren: [],
  },

  // ==== AVANÇADO: SCROLL VIEW ====
  {
    prefix: 'UI_Scroll',
    type: 'scrollview',
    requiredProps: [],
    optionalProps: ['scrollbar', 'theme'],
    allowedChildren: ['*'],
  },
  {
    prefix: 'UI_ScrollView',
    type: 'scrollview',
    requiredProps: [],
    optionalProps: ['scrollbar', 'theme'],
    allowedChildren: ['*'],
  },
];

// ============================================================================
// HELPERS DE DETECÇÃO
// ============================================================================

/**
 * Detecta o tipo de componente mapeado pelo nome do nó
 */
export function detectComponentType(name: string): ComponentMappedType | null {
  for (const rule of COMPONENT_RULES) {
    if (name.startsWith(rule.prefix)) {
      return rule.type;
    }
  }
  return null;
}

/**
 * Detecta automaticamente o tipo de componente BASEADO NO TIPO DE NÓ FIGMA
 * (para formas geométricas que não precisam de prefixo UI_)
 */
export function detectShapeByNodeType(nodeType: FigmaNodeType): ComponentMappedType | null {
  const shapeMap: Partial<Record<FigmaNodeType, ComponentMappedType>> = {
    RECTANGLE: 'window',   // Rectangle puro vira window/container
    ELLIPSE: 'button',     // Elipse vira botão ou forma
    TRIANGLE: 'button',
    POLYGON: 'button',
    STAR: 'button',
    LINE: 'button',
    VECTOR: 'svg',
    TEXT: 'text',
  };
  return shapeMap[nodeType] || null;
}

export function getRuleByType(type: ComponentMappedType): ComponentRule | undefined {
  return COMPONENT_RULES.find((r) => r.type === type);
}

// ============================================================================
// EXTRAÇÃO DE PROPRIEDADES DO NOME
// ============================================================================

export function extractPropsFromName(name: string): Record<string, string> {
  const props: Record<string, string> = {};

  // Remove o prefixo UI_ para obter o nome base
  const baseName = name.replace(/^(UI_[A-Za-z]+|Btn|UI_)/, '');

  // Procura por padrões prop=value no nome
  const propPatterns = [
    // prop=value
    /([a-zA-Z_]+)=([a-zA-Z0-9_.]+)/g,
    // prop:value
    /([a-zA-Z_]+):([a-zA-Z0-9_.]+)/g,
  ];

  for (const pattern of propPatterns) {
    let match;
    while ((match = pattern.exec(baseName)) !== null) {
      const key = match[1].toLowerCase();
      const value = match[2];
      props[key] = value;
    }
  }

  // Procura por parâmetros separados por _ ou espaço
  const parts = baseName.split(/[_]/);

  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex > 0) {
      const key = part.substring(0, eqIndex).toLowerCase();
      const value = part.substring(eqIndex + 1);
      props[key] = value;
    }
  }

  return props;
}

// ============================================================================
// PALAVRAS-CHAVE DE ANIMAÇÃO
// ============================================================================

const ANIMATION_KEYWORDS: { keyword: string; animType: string }[] = [
  // Fades
  { keyword: 'fadein', animType: 'fadeIn' },
  { keyword: 'fadeout', animType: 'fadeOut' },
  { keyword: 'fade', animType: 'fadeIn' },

  // Hover
  { keyword: 'hoverscale', animType: 'hoverScale' },
  { keyword: 'hovercolor', animType: 'hoverColor' },
  { keyword: 'hover', animType: 'hoverScale' },

  // Slides
  { keyword: 'slideleft', animType: 'slideLeft' },
  { keyword: 'slideright', animType: 'slideRight' },
  { keyword: 'slideup', animType: 'slideUp' },
  { keyword: 'slidedown', animType: 'slideDown' },
  { keyword: 'slide', animType: 'slideLeft' },

  // Zoom
  { keyword: 'zoomin', animType: 'zoomIn' },
  { keyword: 'zoomout', animType: 'zoomOut' },
  { keyword: 'zoom', animType: 'zoomIn' },

  // Premium
  { keyword: 'spring', animType: 'spring' },
  { keyword: 'bounce', animType: 'bounce' },
  { keyword: 'elastic', animType: 'elastic' },
  { keyword: 'rotate', animType: 'rotate' },

  // Scale
  { keyword: 'scalein', animType: 'scaleIn' },
  { keyword: 'scaleout', animType: 'scaleOut' },
  { keyword: 'scale', animType: 'scaleIn' },
];

export function extractAnimation(name: string): string | null {
  const lower = name.toLowerCase();
  for (const { keyword, animType } of ANIMATION_KEYWORDS) {
    if (lower.includes(keyword)) {
      return animType;
    }
  }
  return null;
}

// ============================================================================
// PALAVRAS-CHAVE DE TEMA
// ============================================================================

const THEME_KEYWORDS = [
  'primary', 'secondary', 'surface', 'success', 'danger', 'warning',
  'info', 'light', 'dark', 'accent', 'error', 'ghost',
  'outline', 'gradient', 'neon', 'glow', 'glass',
];

export function extractTheme(name: string): string | null {
  const lower = name.toLowerCase();
  for (const theme of THEME_KEYWORDS) {
    if (lower.includes(theme)) {
      return theme;
    }
  }
  return null;
}

// ============================================================================
// EXTRAÇÃO DE TEXTO DO NOME
// ============================================================================

export function extractText(name: string): string | null {
  const nameWithoutPrefix = name.replace(/^(UI_[A-Za-z]+|Btn|UI_)/, '');

  // Check for text=value pattern
  const textMatch = nameWithoutPrefix.match(/text=([A-Za-z0-9_À-ÿ\s]+)/);
  if (textMatch) {
    return textMatch[1].trim();
  }

  // Check for parenthesized text (e.g., UI_Button(Entrar))
  const parenMatch = nameWithoutPrefix.match(/[\(\[\{]([^\)\]\}]+)[\)\]\}]/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }

  return null;
}

// ============================================================================
// EXTRAÇÃO DE OPÇÕES DE DROPDOWN DO NOME
// ============================================================================

export function extractListOptions(name: string): string[] | null {
  // Procura por options=[a,b,c] ou options=a|b|c
  const bracketMatch = name.match(/options=\[([^\]]+)\]/);
  if (bracketMatch) {
    return bracketMatch[1].split(',').map((s) => s.trim());
  }

  const pipeMatch = name.match(/options=([a-zA-Z0-9_|]+)/);
  if (pipeMatch) {
    return pipeMatch[1].split('|').map((s) => s.trim());
  }

  return null;
}

// ============================================================================
// DETECÇÃO DE ÍCONE DO NOME
// ============================================================================

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

export function extractIcon(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [iconName, iconChar] of Object.entries(ICON_NAMES)) {
    if (lower.includes(iconName)) {
      return iconChar;
    }
  }
  return null;
}