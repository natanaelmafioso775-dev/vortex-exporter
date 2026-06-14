/**
 * Vortex Compiler — Types
 * Tipos compartilhados para validação e geração de código
 */

export interface VortexSchema {
  version: string;
  metadata?: {
    name?: string;
    author?: string;
    theme?: 'dark' | 'light';
    description?: string;
  };
  window: WindowComponent;
  children: UIComponent[];
}

export interface WindowComponent {
  type: 'window';
  title?: string;
  width?: number;
  height?: number;
  anchor?: string;
  closable?: boolean;
  draggable?: boolean;
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
  | SvgComponent;

export interface BaseComponent {
  id?: string;
  visible?: boolean;
  alpha?: number;
  animation?: { enter?: string; duration?: number };
}

export interface ButtonComponent extends BaseComponent {
  type: 'button';
  text?: string;
  width?: number;
  height?: number;
  theme?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface InputComponent extends BaseComponent {
  type: 'input';
  placeholder?: string;
  password?: boolean;
  maxLength?: number;
  value?: string;
  width?: number;
  height?: number;
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  text?: string;
  color?: string;
  scale?: number;
  font?: string;
  alignX?: 'left' | 'center' | 'right';
  alignY?: 'top' | 'center' | 'bottom';
  wordBreak?: boolean;
}

export interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  width?: number;
  height?: number;
  fitMode?: 'fill' | 'contain' | 'cover';
}

export interface SvgComponent extends BaseComponent {
  type: 'svg';
  src: string;
  width?: number;
  height?: number;
  color?: string;
}

export interface CompilerResult {
  code: string;
  errors: string[];
  warnings: string[];
}