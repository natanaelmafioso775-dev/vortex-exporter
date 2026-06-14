// ============================================================================
// Figma REST API — Tipos COMPLETOS suportando 100% do Figma
// ============================================================================

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  document: FigmaDocumentNode;
  components: Record<string, FigmaComponentMeta>;
  componentSets: Record<string, FigmaComponentSetMeta>;
  schemaVersion: number;
  styles: Record<string, FigmaStyleMeta>;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface FigmaComponentSetMeta {
  key: string;
  name: string;
  description: string;
}

export interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
  componentSetId: string;
  documentationLinks: string[];
}

export interface FigmaStyleMeta {
  key: string;
  name: string;
  styleType: string;
  description: string;
}

export interface FigmaImageResponse {
  err: string;
  images: Record<string, string>;
}

export interface FigmaImageFillsResponse {
  err: string;
  images: Record<string, string>;
  meta: {
    images: Record<string, string>;
  };
}

// ============================================================================
// NÓ PRINCIPAL DO FIGMA — TODOS OS TIPOS DE NÓ
// ============================================================================

export type FigmaNodeType =
  | 'DOCUMENT' | 'CANVAS' | 'FRAME' | 'GROUP'
  | 'SECTION' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE'
  | 'RECTANGLE' | 'ELLIPSE' | 'TRIANGLE' | 'POLYGON'
  | 'STAR' | 'LINE' | 'VECTOR' | 'TEXT'
  | 'SLICE' | 'STICKY' | 'CONNECTOR'
  | 'TABLE' | 'TABLE_CELL'
  | 'WASHI_TAPE' | 'EMBED' | 'LINK_UNFURL'
  | 'MEDIA' | 'HIGHLIGHT';

export interface FigmaDocumentNode {
  // Identificação
  id: string;
  name: string;
  type: FigmaNodeType;
  visible?: boolean;
  locked?: boolean;
  isFixed?: boolean;
  scrollBehavior?: 'SCROLLS' | 'FIXED';

  // Hierarquia
  children?: FigmaDocumentNode[];
  backgrounds?: FigmaPaint[];

  // Bounding box
  absoluteBoundingBox: FigmaRect;
  absoluteRenderBounds: FigmaRect;
  relativeTransform?: number[][];
  size?: FigmaVector;

  // ===================================================================
  // PREENCHIMENTOS (FILLS) — Suporta SOLID, GRADIENT, IMAGE, VIDEO
  // ===================================================================
  fills?: FigmaPaint[];
  fillOverride?: string;
  fillGeometry?: FigmaGeometryPath[];

  // ===================================================================
  // CONTORNOS (STROKES) — Completo
  // ===================================================================
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeJoin?: 'MITER' | 'ROUND' | 'BEVEL';
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
  strokeDashes?: number[];
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  strokeMiterAngle?: number;
  strokeGeometry?: FigmaGeometryPath[];
  strokeStyle?: 'SOLID' | 'DASHED' | 'DOTTED' | 'GROOVE' | 'RIDGE';

  // ===================================================================
  // CANTOS (CORNER) — Suporta cantos individuais e smoothing
  // ===================================================================
  cornerRadius?: number;
  cornerSmoothing?: number;
  rectangleCornerRadii?: [number, number, number, number];
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;

  // ===================================================================
  // EFEITOS (EFFECTS) — Sombras, blur, glow
  // ===================================================================
  effects?: FigmaEffect[];

  // ===================================================================
  // OPACIDADE
  // ===================================================================
  opacity?: number;
  blendMode?: FigmaBlendMode;
  isMask?: boolean;
  maskType?: 'ALPHA' | 'LUMINANCE' | 'VECTOR';

  // ===================================================================
  // TEXTO (TEXT) — Completo
  // ===================================================================
  characters?: string;
  style?: FigmaTypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<number, FigmaTypeStyle>;
  lineTypes?: ('NONE' | 'ORDERED' | 'UNORDERED' | 'TASK')[][];
  lineIndentations?: number[];
  hangingList?: boolean;
  hangingPunctuation?: string;

  // ===================================================================
  // AUTO LAYOUT (FRAME) — Completo
  // ===================================================================
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  itemReverseZIndex?: boolean;
  strokesIncludedInLayout?: boolean;
  layoutAlign?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT';
  layoutGrow?: number;
  layoutPositioning?: 'AUTO' | 'ABSOLUTE';

  // ===================================================================
  // CONSTRAINTS (RESPONSIVO) — Completo
  // ===================================================================
  constraints?: FigmaConstraints;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // ===================================================================
  // CLIPPING / OVERFLOW
  // ===================================================================
  clipsContent?: boolean;

  // ===================================================================
  // GRID / LAYOUT GRID
  // ===================================================================
  layoutGrids?: FigmaLayoutGrid[];

  // ===================================================================
  // GUIA / GUIDES
  // ===================================================================
  guides?: FigmaGuide[];

  // ===================================================================
  // COMPONENT PROPERTIES (VARIANTES)
  // ===================================================================
  componentProperties?: Record<string, FigmaComponentProperty>;

  // ===================================================================
  // EXPORT SETTINGS
  // ===================================================================
  exportSettings?: FigmaExportSetting[];

  // ===================================================================
  // TRANSITION / PROTOTYPE
  // ===================================================================
  transitionDuration?: number;
  transitionEasing?: FigmaEasingType;

  // ===================================================================
  // REACTIONS (CLICK INTERACTIONS)
  // ===================================================================
  reactions?: FigmaReaction[];

  // ===================================================================
  // VECTOR PATHS
  // ===================================================================
  vectorData?: FigmaVectorData;
  vectorNetwork?: FigmaVectorNetwork;
}

// ============================================================================
// PROPRIEDADES BÁSICAS
// ============================================================================

export interface FigmaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ============================================================================
// CONSTRAINTS
// ============================================================================

export interface FigmaConstraints {
  vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
  horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
}

// ============================================================================
// GEOMETRY / PATHS
// ============================================================================

export interface FigmaGeometryPath {
  windingRule: 'NONZERO' | 'EVENODD';
  path: string;  // SVG path data
}

export interface FigmaVectorData {
  originX?: number;
  originY?: number;
  unitValue?: number;
  handleMirroring?: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
}

export interface FigmaVectorNetwork {
  regions?: FigmaVectorRegion[];
  segments?: FigmaVectorSegment[];
  vertices?: FigmaVectorVertex[];
}

export interface FigmaVectorRegion {
  windingRule: 'NONZERO' | 'EVENODD';
  loops: number[][];
  fill: number;  // index into fills
}

export interface FigmaVectorSegment {
  start: number;
  end: number;
  tangentStart?: FigmaVector;
  tangentEnd?: FigmaVector;
}

export interface FigmaVectorVertex {
  x: number;
  y: number;
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
  strokeJoin?: 'MITER' | 'ROUND' | 'BEVEL';
  cornerRadius?: number;
  handleMirroring?: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
}

// ============================================================================
// PAINT (FILL / STROKE) — Completo
// ============================================================================

export type FigmaPaintType =
  | 'SOLID'
  | 'GRADIENT_LINEAR'
  | 'GRADIENT_RADIAL'
  | 'GRADIENT_ANGULAR'
  | 'GRADIENT_DIAMOND'
  | 'IMAGE'
  | 'EMOJI'
  | 'VIDEO';

export interface FigmaPaint {
  type: FigmaPaintType;
  color?: FigmaColor;
  opacity?: number;
  visible?: boolean;
  blendMode?: FigmaBlendMode;

  // Gradient
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaGradientStop[];

  // Image / Video
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageRef?: string;
  imageTransform?: number[][];
  scalingFactor?: number;
  rotation?: number;
  flicker?: number;

  // GIF properties
  gifRef?: string;
  mediaPlaybackMode?: 'PLAY_ONCE' | 'LOOP';
}

export type FigmaBlendMode =
  | 'PASS_THROUGH' | 'NORMAL'
  | 'DARKEN' | 'MULTIPLY' | 'LINEAR_BURN' | 'COLOR_BURN'
  | 'LIGHTEN' | 'SCREEN' | 'LINEAR_DODGE' | 'COLOR_DODGE'
  | 'OVERLAY' | 'SOFT_LIGHT' | 'HARD_LIGHT'
  | 'DIFFERENCE' | 'EXCLUSION'
  | 'HUE' | 'SATURATION' | 'COLOR' | 'LUMINOSITY';

export interface FigmaGradientStop {
  color: FigmaColor;
  position: number;
}

// ============================================================================
// EFFECTS — Completo
// ============================================================================

export type FigmaEffectType =
  | 'INNER_SHADOW'
  | 'DROP_SHADOW'
  | 'LAYER_BLUR'
  | 'BACKGROUND_BLUR';

export interface FigmaEffect {
  type: FigmaEffectType;
  visible: boolean;
  radius: number;
  offset?: FigmaVector;
  color?: FigmaColor;
  spread?: number;
  showShadowBehindNode?: boolean;
}

// ============================================================================
// TYPE STYLE (TEXT) — Completo
// ============================================================================

export interface FigmaTypeStyle {
  fontFamily?: string;
  fontPostScriptName?: string;
  fontWeight?: number;
  fontSize?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';
  hangingPunctuation?: string;
  hangingList?: boolean;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
  textDecoration?: 'NONE' | 'STRIKETHROUGH' | 'UNDERLINE';
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  hyperlink?: FigmaHyperlink;
  opentypeFlags?: Record<string, number>;
}

export interface FigmaHyperlink {
  type: 'URL' | 'NODE';
  url?: string;
  nodeId?: string;
}

// ============================================================================
// LAYOUT GRID
// ============================================================================

export type FigmaLayoutGridPattern = 'COLUMNS' | 'ROWS' | 'GRID';

export interface FigmaLayoutGrid {
  pattern: FigmaLayoutGridPattern;
  sectionSize: number;
  visible: boolean;
  color: FigmaColor;
  alignment: 'MIN' | 'MAX' | 'CENTER' | 'STRETCH';
  gutterSize?: number;
  offset?: number;
  count?: number;
}

// ============================================================================
// GUIDE
// ============================================================================

export interface FigmaGuide {
  axis: 'X' | 'Y';
  offset: number;
}

// ============================================================================
// EXPORT SETTINGS
// ============================================================================

export interface FigmaExportSetting {
  suffix: string;
  format: 'PNG' | 'JPG' | 'PDF' | 'SVG';
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

// ============================================================================
// EASING / TRANSITIONS
// ============================================================================

export type FigmaEasingType =
  | 'EASE_IN' | 'EASE_OUT' | 'EASE_IN_AND_OUT'
  | 'LINEAR'
  | 'GENTLE' | 'GENTLE_SPRING'
  | 'SPRING' | 'SPRING_FAST'
  | 'BOUNCE' | 'BOUNCE_SMALL';

// ============================================================================
// REACTIONS (PROTOTYPE)
// ============================================================================

export interface FigmaReaction {
  action: FigmaReactionAction;
  trigger: FigmaReactionTrigger;
}

export interface FigmaReactionTrigger {
  type: 'ON_CLICK' | 'ON_HOVER' | 'ON_PRESS' | 'ON_DRAG'
      | 'AFTER_TIMEOUT' | 'MOUSE_ENTER' | 'MOUSE_LEAVE'
      | 'MOUSE_DOWN' | 'MOUSE_UP';
  timeout?: number;
}

export interface FigmaReactionAction {
  type: 'NAVIGATE' | 'SWAP' | 'OVERLAY' | 'BACK' | 'CLOSE'
      | 'URL' | 'UPDATE_STATE' | 'SET_VARIABLE';
  destinationId?: string;
  navigation?: 'NAVIGATE' | 'SWAP' | 'OVERLAY' | 'SCROLL_TO';
  transitionDuration?: number;
  transitionEasing?: FigmaEasingType;
  preserveScrollPosition?: boolean;
  url?: string;
  scrollToNodeId?: string;
}

// ============================================================================
// COMPONENT PROPERTIES
// ============================================================================

export interface FigmaComponentProperty {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  value: string | boolean | number;
  defaultValue: string | boolean | number;
  preferredValues?: FigmaPreferredValue[];
}

export interface FigmaPreferredValue {
  value: string | boolean | number;
  label: string;
}

// ============================================================================
// LOCAL VARIABLES (Design Tokens)
// ============================================================================

export interface FigmaVariablesResponse {
  status: number;
  error?: boolean;
  meta: {
    variableCollections: Record<string, FigmaVariableCollection>;
    variables: Record<string, FigmaVariable>;
  };
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  hiddenFromPublishing: boolean;
  variableIds: string[];
  defaultModeId: string;
  modes: { modeId: string; name: string }[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  valuesByMode: Record<string, any>;
  type: string;
  scopes: string[];
  hiddenFromPublishing: boolean;
  description: string;
}