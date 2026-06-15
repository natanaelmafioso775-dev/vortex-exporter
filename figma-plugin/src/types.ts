/**
 * Vortex UI Exporter — Types v2.0
 * Suporta posição, nested children, fontes, cores e temas
 */
export const COMPONENT_MAP: Record<string, string> = {
  'UI_Window': 'window',
  'UI_Frame': 'group',
  'UI_Button': 'button',
  'Btn': 'button',
  'UI_Input': 'input',
  'UI_TextInput': 'input',
  'UI_Text': 'text',
  'UI_Label': 'text',
  'UI_Title': 'text',
  'UI_Image': 'image',
  'UI_Img': 'image',
  'UI_SVG': 'svg',
  'UI_Svg': 'svg',
  'UI_Dropdown': 'dropdown',
  'UI_Select': 'dropdown',
  'UI_Checkbox': 'checkbox',
  'UI_Check': 'checkbox',
  'UI_Radio': 'radio',
  'UI_Switch': 'switch',
  'UI_Toggle': 'switch',
  'UI_Slider': 'slider',
  'UI_Range': 'slider',
  'UI_Progress': 'progress',
  'UI_Loading': 'progress',
  'UI_Tabs': 'tabs',
  'UI_Tooltip': 'tooltip',
  'UI_Scroll': 'scrollview',
  'UI_ScrollView': 'scrollview',
};

export interface VortexSchema {
  version: string;
  metadata?: {
    name?: string;
    author?: string;
    theme?: 'dark' | 'light';
    description?: string;
  };
  window: WindowComponent;
  background?: WindowComponent;
  children: UIComponent[];
}

export interface WindowComponent {
  type: 'window';
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  anchor?: string;
  closable?: boolean;
  draggable?: boolean;
  cornerRadius?: number;
  alpha?: number;
  fills?: FillDef[];
  strokes?: StrokeDef[];
  effects?: EffectDef[];
  animation?: {
    enter?: string;
    duration?: number;
  };
}

export type UIComponent =
  | ButtonComponent
  | InputComponent
  | TextComponent
  | ImageComponent
  | SvgComponent
  | GroupComponent
  | RectangleComponent;

export interface BaseComponent {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  alpha?: number;
  zIndex?: number;
  cornerRadius?: number;
  fills?: FillDef[];
  strokes?: StrokeDef[];
  effects?: EffectDef[];
  children?: UIComponent[];
  theme?: string;
}

// === FILLS, STROKES, EFFECTS ===
export interface FillDef {
  type: 'solid' | 'gradient-linear' | 'gradient-radial' | 'image';
  color?: { r: number; g: number; b: number; a: number };
  opacity?: number;
  gradientStops?: { color: { r: number; g: number; b: number; a: number }; position: number }[];
  gradientHandlePositions?: { x: number; y: number }[];
}

export interface StrokeDef {
  color?: { r: number; g: number; b: number; a: number };
  weight?: number;
  align?: 'inside' | 'outside' | 'center';
}

export interface EffectDef {
  type: 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur' | 'glow';
  radius: number;
  offsetX?: number;
  offsetY?: number;
  spread?: number;
  color?: { r: number; g: number; b: number; a: number };
  visible?: boolean;
}

// === COMPONENTES ===
export interface ButtonComponent extends BaseComponent {
  type: 'button';
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  theme?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
  disabled?: boolean;
  onClick?: string;
  icon?: string;
  iconPos?: 'left' | 'right';
  loading?: boolean;
}

export interface InputComponent extends BaseComponent {
  type: 'input';
  placeholder?: string;
  text?: string;
  password?: boolean;
  masked?: boolean;
  maxLength?: number;
  defaultValue?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontColor?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  textCase?: 'upper' | 'lower' | 'title' | 'normal';
  textDecoration?: 'none' | 'underline' | 'strikethrough';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface ImageComponent extends BaseComponent {
  type: 'image';
  src?: string;
  fitMode?: 'fill' | 'contain' | 'cover';
}

export interface SvgComponent extends BaseComponent {
  type: 'svg';
  src?: string;
  color?: string;
}

export interface GroupComponent extends BaseComponent {
  type: 'group';
  layout?: 'horizontal' | 'vertical';
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface RectangleComponent extends BaseComponent {
  type: 'rectangle';
}

// === RESULT ===
export interface ParseResult {
  schema: VortexSchema;
  errors: string[];
  warnings: string[];
}