// ============================================================================
// JSON Panel → VoxelProject (IR) Converter
// Suporta o formato JSON simplificado de plugins Figma
// ============================================================================

import { VoxelProject, VoxelComponent, WindowConfig, ThemeConfig, ProjectMeta } from '../types/internal';
import { logger } from '../../shared/logger';

export interface PanelJson {
  version: string;
  metadata: {
    name: string;
    author?: string;
    theme?: string;
  };
  window: {
    type: string;
    title?: string;
    width: number;
    height: number;
    anchor?: string;
    closable?: boolean;
    draggable?: boolean;
    animation?: {
      enter?: string;
      duration?: number;
    };
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
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: string;
  masked?: boolean;
  placeholder?: string;
  maxLength?: number;
  default?: string;
  onClick?: string;
  theme?: string;
  animation?: string;
  icon?: string;
  iconPos?: string;
  disabled?: boolean;
  hoverColor?: string;
  loading?: boolean;
  fontWeight?: string;
  options?: string[];
  selectedIndex?: number;
  checked?: boolean;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  orientation?: string;
  showValue?: boolean;
  suffix?: string;
  prefix?: string;
  children?: PanelComponentJson[];
}

/**
 * Converte um JSON de painel Figma para VoxelProject (IR)
 */
export function convertPanelJsonToIR(json: PanelJson): VoxelProject {
  logger.info(`[JsonToIR] Converting panel: ${json.metadata.name}`);

  const windowConfig: WindowConfig = {
    width: json.window.width || 400,
    height: json.window.height || 500,
    title: json.window.title || json.metadata.name,
    anchor: (json.window.anchor as any) || 'center',
    movable: json.window.draggable !== false,
    theme: json.metadata.theme || 'dark',
  };

  const theme = buildDefaultTheme(json.metadata.theme || 'dark');

  const components: VoxelComponent[] = [];
  let childIndex = 0;

  for (const child of json.children || []) {
    const comp = convertComponent(child, childIndex);
    if (comp) components.push(comp);
    childIndex++;
  }

  const project: VoxelProject = {
    version: '2.0.0',
    meta: {
      name: json.metadata.name || 'Panel',
      sourceFile: '',
      sourceUrl: '',
      exportedAt: new Date().toISOString(),
      thumbnailUrl: '',
      lastModified: '',
    },
    window: windowConfig,
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
  const id = json.id || `component_${index}`;
  const baseX = json.x || 0;
  const baseY = json.y || 0;
  const baseW = json.width || 200;
  const baseH = json.height || 40;

  const base = {
    id,
    x: baseX,
    y: baseY,
    width: baseW,
    height: baseH,
    visible: true,
    opacity: 1,
    effects: [],
    fills: [],
    strokes: [],
    zIndex: index,
    locked: false,
    blendMode: 'normal' as const,
    isMask: false,
    clipContent: false,
    animation: json.animation,
    theme: json.theme,
  };

  switch (json.type) {
    case 'window':
    case 'frame':
    case 'group': {
      const children: VoxelComponent[] = [];
      if (json.children) {
        json.children.forEach((child, i) => {
          const c = convertComponent(child, i);
          if (c) children.push(c);
        });
      }
      return {
        ...base,
        type: 'group',
        children,
        layoutMode: 'VERTICAL',
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
      };
    }

    case 'button':
      return {
        ...base,
        type: 'button',
        text: json.text || 'Button',
        onClick: json.onClick,
        fontSize: json.fontSize || 16,
        fontWeight: json.fontWeight === 'bold' ? 700 : 400,
        disabled: json.disabled || false,
        icon: json.icon,
        iconPosition: (json.iconPos as any) || 'left',
        hoverColor: json.hoverColor,
      };

    case 'input':
    case 'textinput':
      return {
        ...base,
        type: 'input',
        placeholder: json.placeholder || '',
        masked: json.masked || false,
        maxLength: json.maxLength || 50,
        defaultValue: json.default || '',
        fontSize: json.fontSize || 16,
        textAlign: (json.align as any) || 'left',
        inputType: json.masked ? 'password' : 'text',
        multiline: false,
        autoFocus: false,
      };

    case 'title':
    case 'text':
    case 'label':
      return {
        ...base,
        type: 'text',
        text: json.text || '',
        fontSize: json.fontSize || (json.type === 'title' ? 24 : 16),
        align: (json.align as any) || 'left',
        verticalAlign: 'top',
        fontWeight: json.fontWeight === 'bold' ? 700 : 400,
        fontFamily: json.fontFamily || 'default',
        color: json.color || '#ffffff',
        letterSpacing: 0,
        lineHeight: 1.2,
        lineHeightUnit: 'percent',
        textCase: 'normal',
        textDecoration: 'none',
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
        src: json.text || '',
        assetUrl: json.text || '',
        downloaded: false,
        scaleMode: 'fill',
        rotation: 0,
      };

    case 'svg':
      return {
        ...base,
        type: 'svg',
        svgContent: json.text || '',
      };

    case 'dropdown':
    case 'select':
      return {
        ...base,
        type: 'dropdown',
        text: json.text || 'Select',
        options: json.options || [],
        selectedIndex: json.selectedIndex || 0,
        open: false,
        fontSize: json.fontSize || 14,
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
        fontSize: json.fontSize || 14,
      };

    case 'radio':
      return {
        ...base,
        type: 'radio',
        text: json.text || '',
        selected: json.checked || false,
        groupName: 'radio_group',
        fontSize: json.fontSize || 14,
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
        min: json.min || 0,
        max: json.max || 100,
        value: json.value ?? json.default ? parseFloat(json.default as string) : 50,
        step: json.step || 1,
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
        min: json.min || 0,
        max: json.max || 100,
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
    case 'scroll': {
      const scrollChildren: VoxelComponent[] = [];
      if (json.children) {
        json.children.forEach((child, i) => {
          const c = convertComponent(child, i);
          if (c) scrollChildren.push(c);
        });
      }
      return {
        ...base,
        type: 'scrollview',
        contentWidth: baseW,
        contentHeight: baseH * (json.children?.length || 1) * 2,
        scrollX: 0,
        scrollY: 0,
        showScrollbar: true,
        scrollbarWidth: 6,
        children: scrollChildren,
      };
    }

    default:
      // Rectangle/ellipse etc. vira group
      return {
        ...base,
        type: 'group',
        children: [],
      };
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
      background: isDark
        ? { r: 17, g: 24, b: 39, a: 255, token: 'background', original: 'Background' }
        : { r: 240, g: 242, b: 245, a: 255, token: 'background', original: 'Background' },
      surface: isDark
        ? { r: 30, g: 39, b: 58, a: 255, token: 'surface', original: 'Surface' }
        : { r: 255, g: 255, b: 255, a: 255, token: 'surface', original: 'Surface' },
      border: isDark
        ? { r: 60, g: 70, b: 90, a: 255, token: 'border', original: 'Border' }
        : { r: 200, g: 200, b: 210, a: 255, token: 'border', original: 'Border' },
    },
    fonts: {
      default: 'default', bold: 'default-bold', mono: 'clear', sans: 'default', serif: 'default',
    },
    spacings: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    shadows: {},
    opacities: { disabled: 0.5, hover: 0.9, active: 1.0 },
  };
}