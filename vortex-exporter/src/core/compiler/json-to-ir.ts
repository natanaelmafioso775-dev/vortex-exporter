// ============================================================================
// JSON Panel → VoxelProject (IR) Converter v2.0
// Suporta POSIÇÃO, HIERARQUIA, FONTES, CORES, FILLS, STROKES, EFEITOS
// Compatível com o schema do Vortex Figma Plugin v2.0
// ============================================================================

import { VoxelProject, VoxelComponent, WindowConfig, ThemeConfig } from '../types/internal';
import { logger } from '../../shared/logger';

// ===== JSON TYPES (do plugin Figma) =====
export interface PanelJson {
  version: string;
  metadata?: { name?: string; author?: string; theme?: 'dark' | 'light'; description?: string };
  window: {
    type?: string; title?: string; width: number; height: number; x?: number; y?: number; anchor?: string; closable?: boolean; draggable?: boolean;
    cornerRadius?: number; alpha?: number;
    fills?: any[]; strokes?: any[]; effects?: any[];
    animation?: any;
  };
  background?: {
    type?: string; title?: string; width: number; height: number;
    fills?: any[]; strokes?: any[]; effects?: any[];
    alpha?: number;
  };
  children: PanelComponentJson[];
}

export interface PanelComponentJson {
  type: string;
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  alpha?: number;
  zIndex?: number;
  cornerRadius?: number;
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number }; opacity?: number; gradientStops?: any[] }>;
  strokes?: Array<{ color?: { r: number; g: number; b: number; a: number }; weight?: number; align?: string }>;
  effects?: Array<{ type: string; radius: number; offsetX?: number; offsetY?: number; color?: { r: number; g: number; b: number; a: number }; visible?: boolean }>;
  children?: PanelComponentJson[];
  // Button
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontColor?: string;
  textAlign?: string;
  theme?: string;
  disabled?: boolean;
  onClick?: string;
  icon?: string;
  iconPos?: string;
  loading?: boolean;
  // Input
  placeholder?: string;
  password?: boolean;
  masked?: boolean;
  maxLength?: number;
  defaultValue?: string;
  // Text
  align?: string;
  alignX?: string;
  alignY?: string;
  verticalAlign?: string;
  textCase?: string;
  textDecoration?: string;
  letterSpacing?: number;
  lineHeight?: number;
  scale?: number;
  font?: string;
  wordBreak?: boolean;
  color?: string;
  // Image/SVG
  src?: string;
  fitMode?: string;
  // Dropdown
  options?: string[];
  selectedIndex?: number;
  // Checkbox
  checked?: boolean;
  // Slider
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  orientation?: string;
  showValue?: boolean;
  suffix?: string;
  prefix?: string;
  // Group
  layout?: string;
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

// ===== CONVERTER =====

export function convertPanelJsonToIR(json: PanelJson): VoxelProject {
  logger.info(`[JsonToIR] Converting panel: ${json.metadata?.name || 'Panel'}`);

  // Converte fills da window
  const windowFills: any[] = (json.window.fills || []).map((f: any) => ({
    type: f.type === 'gradient-linear' ? 'gradient-linear' as const : 'solid' as const,
    color: f.color || undefined,
    opacity: f.opacity ?? 1,
    visible: true,
    blendMode: 'normal' as const,
    gradientStops: f.gradientStops?.map((s: any) => ({ color: s.color, position: s.position })),
  }));

  // Converte strokes da window
  const windowStrokes: any[] = (json.window.strokes || []).map((s: any) => ({
    paint: {
      type: 'solid' as const,
      color: s.color || { r: 255, g: 255, b: 255, a: 255 },
      opacity: 1, visible: true, blendMode: 'normal' as const,
    },
    weight: s.weight ?? 1,
    align: (s.align === 'INSIDE' ? 'inside' : s.align === 'OUTSIDE' ? 'outside' : 'center') as any,
    cap: 'none' as const, join: 'miter' as const, dashes: [], offset: 0,
  }));

  // Converte efeitos da window
  const windowEffects: any[] = (json.window.effects || []).filter((e: any) => e.visible !== false).map((e: any) => ({
    type: e.type as any,
    radius: e.radius,
    offsetX: e.offsetX || 0,
    offsetY: e.offsetY || 0,
    spread: e.spread || 0,
    color: e.color,
    visible: true,
  }));

  const windowConfig: WindowConfig = {
    width: json.window.width || 400,
    height: json.window.height || 500,
    x: json.window.x,
    y: json.window.y,
    title: json.window.title || json.metadata?.name || 'Panel',
    anchor: (json.window.anchor as any) || 'center',
    movable: json.window.draggable !== false,
    theme: json.metadata?.theme || 'dark',
    cornerRadius: json.window.cornerRadius ?? 0,
    alpha: json.window.alpha ?? 1,
    backgroundFills: windowFills.length > 0 ? windowFills : undefined,
    strokes: windowStrokes.length > 0 ? windowStrokes : undefined,
    effects: windowEffects.length > 0 ? windowEffects : undefined,
  };

  const theme = buildDefaultTheme(json.metadata?.theme || 'dark');

  const components: VoxelComponent[] = [];
  let childIndex = 0;

  for (const child of json.children || []) {
    const comp = convertComponent(child, childIndex);
    if (comp) components.push(comp);
    childIndex++;
  }

  // Converte background (opcional)
  let backgroundConfig: WindowConfig | undefined;
  if (json.background) {
    const bgFills: any[] = (json.background.fills || []).map((f: any) => ({
      type: f.type === 'gradient-linear' ? 'gradient-linear' as const : 'solid' as const,
      color: f.color || undefined,
      opacity: f.opacity ?? 1,
      visible: true,
      blendMode: 'normal' as const,
    }));
    backgroundConfig = {
      width: json.background.width || 0,
      height: json.background.height || 0,
      alpha: json.background.alpha ?? 0.7,
      backgroundFills: bgFills.length > 0 ? bgFills : undefined,
    };
  }

  const project: VoxelProject = {
    version: '2.0.0',
    meta: {
      name: json.metadata?.name || 'Panel',
      sourceFile: '',
      sourceUrl: '',
      exportedAt: new Date().toISOString(),
      thumbnailUrl: '',
      lastModified: '',
    },
    window: windowConfig,
    background: backgroundConfig,
    components,
    assets: [],
    theme,
    fonts: [],
    variables: [],
    interactions: [],
    animations: [],
    layoutGrids: [],
  };

  logger.info(`[JsonToIR] Converted ${components.length} component(s)`);
  return project;
}

function convertComponent(json: PanelComponentJson, index: number): VoxelComponent | null {
  const id = json.id || `comp_${index}`;
  const x = json.x ?? 0;
  const y = json.y ?? 0;
  const w = json.width ?? 200;
  const h = json.height ?? 40;
  const visible = json.visible !== false;
  const opacity = json.alpha ?? 1;
  const cornerRadius = json.cornerRadius ?? 0;

  // Converte fills
  const fills: any[] = (json.fills || []).map((f) => ({
    type: f.type === 'gradient-linear' ? 'gradient-linear' as const
      : f.type === 'gradient-radial' ? 'gradient-radial' as const
      : f.type === 'image' ? 'image' as const
      : 'solid' as const,
    color: f.color || undefined,
    opacity: f.opacity ?? 1,
    visible: true,
    blendMode: 'normal' as const,
    gradientStops: f.gradientStops?.map((s) => ({
      color: s.color,
      position: s.position,
    })),
  }));

  // Converte strokes
  const strokes: any[] = (json.strokes || []).map((s) => ({
    paint: {
      type: 'solid' as const,
      color: s.color || { r: 255, g: 255, b: 255, a: 255 },
      opacity: 1,
      visible: true,
      blendMode: 'normal' as const,
    },
    weight: s.weight ?? 1,
    align: (s.align as any) || 'center',
    cap: 'none' as const,
    join: 'miter' as const,
    dashes: [],
    offset: 0,
  }));

  // Converte efeitos
  const effects: any[] = (json.effects || []).filter((e) => e.visible !== false).map((e) => ({
    type: e.type === 'drop-shadow' ? 'drop-shadow' as const
      : e.type === 'inner-shadow' ? 'inner-shadow' as const
      : e.type === 'layer-blur' ? 'layer-blur' as const
      : e.type === 'background-blur' ? 'background-blur' as const
      : 'glow' as const,
    radius: e.radius,
    offsetX: e.offsetX || 0,
    offsetY: e.offsetY || 0,
    spread: 0,
    color: e.color,
    visible: true,
  }));

  // Processa filhos
  const children: VoxelComponent[] = [];
  if (json.children) {
    json.children.forEach((c, i) => {
      const comp = convertComponent(c, i);
      if (comp) children.push(comp);
    });
  }

  const base = {
    id,
    x, y, width: w, height: h,
    visible,
    opacity,
    effects,
    fills,
    strokes,
    zIndex: json.zIndex ?? index,
    locked: false,
    blendMode: 'normal' as const,
    isMask: false,
    clipContent: false,
    cornerRadius,
    animation: undefined as string | undefined,
    theme: json.theme,
  };

  switch (json.type) {
    case 'group':
    case 'frame':
      return {
        ...base,
        type: 'group',
        children,
        layoutMode: json.layout === 'vertical' ? 'VERTICAL' as const : 'HORIZONTAL' as const,
        padding: json.padding || { left: 0, right: 0, top: 0, bottom: 0 },
        itemSpacing: json.gap || 0,
        primaryAlign: 'MIN',
        counterAlign: 'MIN',
      };

    case 'rectangle':
    case 'rect':
      return { ...base, type: 'rectangle' };

    case 'ellipse':
    case 'circle':
      return { ...base, type: 'ellipse' };

    case 'button': {
      const btnChildren: VoxelComponent[] = json.children ? json.children
        .filter((c) => c.type !== 'text' || c.text !== json.text)
        .map((c, i) => convertComponent(c, i)!).filter(Boolean) : [];
      return {
        ...base,
        type: 'button',
        text: json.text || 'Button',
        fontSize: json.fontSize ?? 14,
        fontFamily: json.fontFamily,
        fontWeight: json.fontWeight ?? 600,
        textCase: (json.textCase as any) || 'normal',
        onClick: json.onClick,
        icon: json.icon,
        iconPosition: (json.iconPos as any) || 'left',
        disabled: json.disabled || false,
        hoverColor: undefined,
        loadingText: undefined,
      };
    }

    case 'input':
    case 'textinput':
      return {
        ...base,
        type: 'input',
        placeholder: json.placeholder || json.text || 'Enter text...',
        masked: json.masked || json.password || false,
        maxLength: json.maxLength ?? 64,
        defaultValue: json.defaultValue || '',
        fontSize: json.fontSize ?? 14,
        fontFamily: json.fontFamily,
        textAlign: (json.textAlign as any) || (json.alignX as any) || 'left',
        inputType: (json.masked || json.password) ? 'password' : 'text',
        multiline: false,
        autoFocus: false,
        prefix: json.prefix,
        suffix: json.suffix,
      };

    case 'text':
    case 'label':
    case 'title':
      return {
        ...base,
        type: 'text',
        text: json.text || '',
        fontSize: json.fontSize ?? (json.type === 'title' ? 24 : 14),
        fontFamily: json.fontFamily || json.font || 'default',
        fontWeight: json.fontWeight ?? 400,
        align: (json.align as any) || (json.alignX as any) || 'left',
        verticalAlign: (json.verticalAlign as any) || (json.alignY as any) || 'top',
        color: json.fontColor || json.color || '#ffffff',
        textCase: (json.textCase as any) || 'normal',
        textDecoration: (json.textDecoration as any) || 'none',
        letterSpacing: json.letterSpacing ?? 0,
        lineHeight: json.lineHeight ?? 1.2,
        lineHeightUnit: 'percent' as const,
        italic: false,
        paragraphSpacing: 0,
        paragraphIndent: 0,
        listSpacing: 0,
        richTextSegments: [],
      };

    case 'image':
    case 'img':
      return {
        ...base,
        type: 'image',
        src: json.src || json.text || '',
        assetUrl: json.src || json.text || '',
        downloaded: false,
        scaleMode: (json.fitMode as any) || 'fill',
        rotation: 0,
      };

    case 'svg':
      return {
        ...base,
        type: 'svg',
        svgContent: json.text || '',
        assetPath: json.src,
      };

    case 'dropdown':
    case 'select':
      return {
        ...base,
        type: 'dropdown',
        text: json.text || 'Select',
        options: json.options || [],
        selectedIndex: json.selectedIndex ?? 0,
        open: false,
        fontSize: json.fontSize ?? 14,
        maxVisible: 5,
        searchable: false,
      };

    case 'checkbox':
    case 'check':
      return {
        ...base,
        type: 'checkbox',
        text: json.text || '',
        checked: json.checked || false,
        fontSize: json.fontSize ?? 14,
      };

    case 'radio':
      return {
        ...base,
        type: 'radio',
        text: json.text || '',
        selected: json.checked || false,
        groupName: 'radio_group',
        fontSize: json.fontSize ?? 14,
      };

    case 'switch':
    case 'toggle':
      return {
        ...base,
        type: 'switch',
        text: json.text || '',
        checked: json.checked || false,
      };

    case 'slider':
    case 'range':
      return {
        ...base,
        type: 'slider',
        min: json.min ?? 0,
        max: json.max ?? 100,
        value: json.value ?? 50,
        step: json.step ?? 1,
        orientation: (json.orientation as any) || 'horizontal',
        showValue: json.showValue || false,
        suffix: json.suffix,
        prefix: json.prefix,
      };

    case 'progress':
    case 'loading':
      return {
        ...base,
        type: 'progress',
        min: json.min ?? 0,
        max: json.max ?? 100,
        value: json.value ?? 0,
        showLabel: json.showValue || false,
        variant: 'linear',
        thickness: 8,
      };

    case 'tabs':
      return {
        ...base,
        type: 'tabs',
        tabs: [],
        selectedIndex: 0,
        tabPosition: 'top',
      };

    case 'scrollview':
    case 'scroll':
      return {
        ...base,
        type: 'scrollview',
        contentWidth: w,
        contentHeight: h * 4,
        scrollX: 0,
        scrollY: 0,
        showScrollbar: true,
        scrollbarWidth: 6,
        children,
      };

    default:
      if (children.length > 0 || base.height > 0 || base.width > 0) {
        return { ...base, type: 'group', children, layoutMode: 'NONE' };
      }
      return null;
  }
}

function buildDefaultTheme(themeName: string): ThemeConfig {
  const isDark = themeName === 'dark';
  return {
    colors: {
      primary: { r: 0, g: 170, b: 255, a: 255, token: 'primary', original: 'Primary' },
      primaryHover: { r: 0, g: 136, b: 204, a: 255, token: 'primaryHover', original: 'Primary Hover' },
      primaryLight: { r: 224, g: 238, b: 255, a: 255, token: 'primaryLight', original: 'Primary Light' },
      secondary: { r: 108, g: 117, b: 125, a: 255, token: 'secondary', original: 'Secondary' },
      success: { r: 40, g: 167, b: 69, a: 255, token: 'success', original: 'Success' },
      danger: { r: 220, g: 53, b: 69, a: 255, token: 'danger', original: 'Danger' },
      warning: { r: 255, g: 193, b: 7, a: 255, token: 'warning', original: 'Warning' },
      text: { r: 255, g: 255, b: 255, a: 255, token: 'text', original: 'Text' },
      textSecondary: { r: 173, g: 181, b: 189, a: 255, token: 'textSecondary', original: 'Text Secondary' },
      background: isDark ? { r: 17, g: 24, b: 39, a: 255, token: 'background', original: 'Background' }
        : { r: 240, g: 242, b: 245, a: 255, token: 'background', original: 'Background' },
      surface: isDark ? { r: 30, g: 39, b: 58, a: 255, token: 'surface', original: 'Surface' }
        : { r: 255, g: 255, b: 255, a: 255, token: 'surface', original: 'Surface' },
      border: isDark ? { r: 60, g: 70, b: 90, a: 255, token: 'border', original: 'Border' }
        : { r: 200, g: 200, b: 210, a: 255, token: 'border', original: 'Border' },
    },
    fonts: { default: 'default', bold: 'default-bold', mono: 'clear', sans: 'default', serif: 'default' },
    spacings: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    shadows: {},
    opacities: { disabled: 0.5, hover: 0.9, active: 1.0 },
  };
}