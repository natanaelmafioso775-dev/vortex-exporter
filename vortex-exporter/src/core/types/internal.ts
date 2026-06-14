// ============================================================================
// VoxelProject — Intermediate Representation (IR) Canonical
// Suporta 100% das features do Figma exportadas para MTA:SA Lua
// ============================================================================

export interface VoxelProject {
  version: string;
  meta: ProjectMeta;
  window: WindowConfig;
  components: VoxelComponent[];
  assets: AssetRef[];
  theme: ThemeConfig;
  fonts: FontRef[];
  variables: VariableRef[];
  interactions: Interaction[];
  animations: AnimationDef[];
  layoutGrids: VoxelLayoutGrid[];
}

export interface ProjectMeta {
  name: string;
  sourceFile: string;
  sourceUrl: string;
  exportedAt: string;
  thumbnailUrl: string;
  lastModified: string;
}

// ============================================================================
// WINDOW (Canvas/Frame principal)
// ============================================================================

export interface WindowConfig {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  title?: string;
  movable?: boolean;
  resizable?: boolean;
  theme?: string;
  anchor?: Anchor;
  responsive?: boolean;
  clipsContent?: boolean;
  backgroundFills?: VoxelPaint[];
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  padding?: VoxelPadding;
  itemSpacing?: number;
}

// ============================================================================
// TEMA / CORES
// ============================================================================

export interface ThemeConfig {
  colors: Record<string, ThemeColor>;
  fonts: Record<string, string>;
  spacings: Record<string, number>;
  borderRadius: Record<string, number>;
  shadows: Record<string, VoxelEffect[]>;
  opacities: Record<string, number>;
}

export interface ThemeColor {
  r: number;
  g: number;
  b: number;
  a: number;
  token: string;
  original?: string;  // Figma variable name
}

export type Anchor = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

// ============================================================================
// FONTES
// ============================================================================

export interface FontRef {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  url?: string;
  localPath?: string;
  downloaded: boolean;
}

// ============================================================================
// VARIÁVEIS (Design Tokens)
// ============================================================================

export interface VariableRef {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  value: any;
  collectionName: string;
}

// ============================================================================
// COMPONENTES — TODOS OS TIPOS
// ============================================================================

export type VoxelComponent =
  | VoxelRectangle
  | VoxelEllipse
  | VoxelTriangle
  | VoxelPolygon
  | VoxelStar
  | VoxelLine
  | VoxelVector
  | VoxelButton
  | VoxelInput
  | VoxelText
  | VoxelImage
  | VoxelSvg
  | VoxelDropdown
  | VoxelCheckbox
  | VoxelRadio
  | VoxelSwitch
  | VoxelSlider
  | VoxelProgress
  | VoxelTabs
  | VoxelTooltip
  | VoxelScrollView
  | VoxelGroup;

export type ComponentType =
  | 'rectangle' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line' | 'vector'
  | 'button' | 'input' | 'text' | 'image' | 'svg'
  | 'dropdown' | 'checkbox' | 'radio' | 'switch' | 'slider'
  | 'progress' | 'tabs' | 'tooltip' | 'scrollview' | 'group';

// ============================================================================
// BASE — Todas as propriedades comuns a TODOS os componentes
// ============================================================================

export interface VoxelBase {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  anchor?: Anchor;
  animation?: string;
  theme?: string;
  visible: boolean;
  opacity: number;
  cornerRadius?: number;
  individualCorners?: [number, number, number, number];
  cornerSmoothing?: number;
  effects: VoxelEffect[];
  fills: VoxelPaint[];
  strokes: VoxelStroke[];
  zIndex: number;
  locked: boolean;
  blendMode: BlendMode;
  isMask: boolean;
  clipContent: boolean;
  constraints?: VoxelConstraints;
  layoutGrow?: number;
  layoutAlign?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  rotation?: number;
}

// ============================================================================
// CONSTRAINTS (Responsivo)
// ============================================================================

export interface VoxelConstraints {
  horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
  vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
}

// ============================================================================
// PREENCHIMENTOS (Fills) — Suporta SOLID, GRADIENT, IMAGE
// ============================================================================

export interface VoxelPaint {
  type: 'solid' | 'gradient-linear' | 'gradient-radial' | 'gradient-angular' | 'gradient-diamond' | 'image';
  color?: { r: number; g: number; b: number; a: number };
  opacity: number;
  visible: boolean;
  blendMode: BlendMode;

  // Gradient
  gradientStops?: GradientStop[];
  gradientTransform?: { x1: number; y1: number; x2: number; y2: number; r?: number };

  // Image
  imageRef?: string;
  imageScaleMode?: 'fill' | 'fit' | 'crop' | 'tile';
}

export interface GradientStop {
  color: { r: number; g: number; b: number; a: number };
  position: number;
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

// ============================================================================
// CONTORNOS (Strokes) — Completo
// ============================================================================

export interface VoxelStroke {
  paint: VoxelPaint;
  weight: number;
  align: 'inside' | 'outside' | 'center';
  cap: 'none' | 'round' | 'square' | 'arrow';
  join: 'miter' | 'round' | 'bevel';
  dashes: number[];
  offset: number;
}

// ============================================================================
// EFEITOS (Effects) — Sombras, blur, glow
// ============================================================================

export interface VoxelEffect {
  type: EffectType;
  radius: number;
  offsetX: number;
  offsetY: number;
  spread: number;
  color?: { r: number; g: number; b: number; a: number };
  visible: boolean;
}

export type EffectType =
  | 'drop-shadow'
  | 'inner-shadow'
  | 'layer-blur'
  | 'background-blur'
  | 'glow';

// ============================================================================
// COMPONENTES INDIVIDUAIS
// ============================================================================

export interface VoxelRectangle extends VoxelBase {
  type: 'rectangle';
}

export interface VoxelEllipse extends VoxelBase {
  type: 'ellipse';
  arc?: { start: number; end: number; innerRadius: number };
}

export interface VoxelTriangle extends VoxelBase {
  type: 'triangle';
}

export interface VoxelPolygon extends VoxelBase {
  type: 'polygon';
  sides: number;
}

export interface VoxelStar extends VoxelBase {
  type: 'star';
  points: number;
  innerRadius: number;
}

export interface VoxelLine extends VoxelBase {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  arrowStart: boolean;
  arrowEnd: boolean;
}

export interface VoxelVector extends VoxelBase {
  type: 'vector';
  paths: VectorPath[];
}

export interface VectorPath {
  windingRule: 'non-zero' | 'even-odd';
  data: string;  // SVG path
}

export interface VoxelButton extends VoxelBase {
  type: 'button';
  text: string;
  onClick?: string;
  hoverColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textCase?: 'upper' | 'lower' | 'title' | 'normal';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loadingText?: string;
  disabled: boolean;
}

export interface VoxelInput extends VoxelBase {
  type: 'input';
  placeholder: string;
  masked: boolean;
  maxLength: number;
  defaultValue: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign: 'left' | 'center' | 'right';
  prefix?: string;
  suffix?: string;
  inputType: 'text' | 'number' | 'email' | 'password';
  multiline: boolean;
  autoFocus: boolean;
}

export interface VoxelText extends VoxelBase {
  type: 'text';
  text: string;
  fontSize: number;
  align: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'center' | 'bottom';
  fontWeight: number;
  fontFamily: string;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  lineHeightUnit: 'px' | 'percent';
  textCase: 'upper' | 'lower' | 'title' | 'normal';
  textDecoration: 'none' | 'underline' | 'strikethrough';
  italic: boolean;
  paragraphSpacing: number;
  paragraphIndent: number;
  listSpacing: number;
  richTextSegments: RichTextSegment[];
}

export interface RichTextSegment {
  text: string;
  start: number;
  end: number;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  color?: string;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  hyperlink?: string;
}

export interface VoxelImage extends VoxelBase {
  type: 'image';
  src: string;
  assetUrl: string;
  downloaded: boolean;
  scaleMode: 'fill' | 'fit' | 'crop' | 'tile';
  rotation: number;
}

export interface VoxelSvg extends VoxelBase {
  type: 'svg';
  svgContent: string;
  assetPath?: string;
}

// ============================================================================
// COMPONENTES INTERATIVOS AVANÇADOS
// ============================================================================

export interface VoxelDropdown extends VoxelBase {
  type: 'dropdown';
  text: string;
  options: string[];
  selectedIndex: number;
  open: boolean;
  fontSize?: number;
  maxVisible: number;
  searchable: boolean;
}

export interface VoxelCheckbox extends VoxelBase {
  type: 'checkbox';
  text: string;
  checked: boolean;
  fontSize?: number;
}

export interface VoxelRadio extends VoxelBase {
  type: 'radio';
  text: string;
  selected: boolean;
  groupName: string;
  fontSize?: number;
}

export interface VoxelSwitch extends VoxelBase {
  type: 'switch';
  text: string;
  checked: boolean;
  activeColor?: string;
}

export interface VoxelSlider extends VoxelBase {
  type: 'slider';
  min: number;
  max: number;
  value: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
  showValue: boolean;
  suffix?: string;
  prefix?: string;
  formatValue?: string;
}

export interface VoxelProgress extends VoxelBase {
  type: 'progress';
  min: number;
  max: number;
  value: number;
  showLabel: boolean;
  label?: string;
  variant: 'linear' | 'circular';
  thickness: number;
  color?: string;
  trackColor?: string;
}

export interface VoxelTabs extends VoxelBase {
  type: 'tabs';
  tabs: TabItem[];
  selectedIndex: number;
  tabPosition: 'top' | 'left';
}

export interface TabItem {
  text: string;
  icon?: string;
  content?: VoxelComponent[];
}

export interface VoxelTooltip extends VoxelBase {
  type: 'tooltip';
  text: string;
  targetId: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  delay: number;
  maxWidth: number;
}

export interface VoxelScrollView extends VoxelBase {
  type: 'scrollview';
  contentWidth: number;
  contentHeight: number;
  scrollX: number;
  scrollY: number;
  showScrollbar: boolean;
  scrollbarWidth: number;
  children: VoxelComponent[];
}

export interface VoxelGroup extends VoxelBase {
  type: 'group';
  children: VoxelComponent[];
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  padding?: VoxelPadding;
  itemSpacing?: number;
  primaryAlign?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAlign?: 'MIN' | 'CENTER' | 'MAX';
}

export interface VoxelPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// ============================================================================
// ASSETS
// ============================================================================

export interface AssetRef {
  id: string;
  type: 'image' | 'svg' | 'gif' | 'video' | 'font';
  url: string;
  filename: string;
  localPath: string;
  mimeType?: string;
  size?: number;
}

// ============================================================================
// INTERAÇÕES (Prototype)
// ============================================================================

export interface Interaction {
  trigger: InteractionTrigger;
  action: InteractionAction;
  sourceId: string;
}

export type InteractionTrigger =
  | 'on-click' | 'on-hover' | 'on-press' | 'on-mouse-enter' | 'on-mouse-leave'
  | 'on-mouse-down' | 'on-mouse-up' | 'after-timeout' | 'on-drag';

export interface InteractionAction {
  type: 'navigate' | 'toggle' | 'set-value' | 'close' | 'url' | 'custom';
  target?: string;
  value?: any;
  transitionDuration?: number;
  transitionEasing?: string;
}

// ============================================================================
// ANIMAÇÕES
// ============================================================================

export interface AnimationDef {
  targetId: string;
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number;
  delay: number;
  easing: EasingType;
  properties: AnimationProperty[];
  stagger?: number;
  loop: boolean;
  yoyo: boolean;
}

export type AnimationType =
  | 'fadeIn' | 'fadeOut'
  | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown'
  | 'scaleIn' | 'scaleOut'
  | 'rotate'
  | 'spring'
  | 'bounce'
  | 'elastic'
  | 'keyframe';

export type AnimationTrigger =
  | 'on-load' | 'on-hover' | 'on-click' | 'on-active'
  | 'on-visible' | 'after-delay' | 'scroll';

export type EasingType =
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'spring' | 'bounce' | 'elastic'
  | 'out-quad' | 'out-cubic' | 'out-quart' | 'out-quint'
  | 'in-quad' | 'in-cubic' | 'in-quart' | 'in-quint'
  | 'in-out-quad' | 'in-out-cubic' | 'in-out-quart' | 'in-out-quint'
  | 'out-back' | 'in-back' | 'in-out-back'
  | 'out-elastic' | 'in-elastic' | 'in-out-elastic'
  | 'out-bounce' | 'in-bounce' | 'in-out-bounce';

export interface AnimationProperty {
  property: 'x' | 'y' | 'width' | 'height' | 'opacity' | 'rotation' | 'scale' | 'color';
  from: number;
  to: number;
}

// ============================================================================
// LAYOUT GRID
// ============================================================================

export interface VoxelLayoutGrid {
  pattern: 'columns' | 'rows' | 'grid';
  sectionSize: number;
  visible: boolean;
  color: { r: number; g: number; b: number; a: number };
  alignment: 'min' | 'max' | 'center' | 'stretch';
  gutterSize?: number;
  count?: number;
  offset?: number;
}