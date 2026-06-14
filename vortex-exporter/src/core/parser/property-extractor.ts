// ============================================================================
// Property Extractor — Extrai TODAS as propriedades dos nós Figma
// Suporta: formas, gradients, strokes, effects, texto rico, auto-layout
// ============================================================================

import { FigmaDocumentNode, FigmaPaint, FigmaEffect, FigmaTypeStyle, FigmaColor } from '../types/figma';
import {
  VoxelBase, VoxelButton, VoxelInput, VoxelText, VoxelImage, VoxelSvg,
  VoxelRectangle, VoxelEllipse, VoxelTriangle, VoxelPolygon, VoxelStar,
  VoxelLine, VoxelVector, VoxelDropdown, VoxelCheckbox, VoxelRadio,
  VoxelSwitch, VoxelSlider, VoxelProgress, VoxelTabs, VoxelTooltip,
  VoxelScrollView, VoxelGroup, VoxelComponent, ThemeColor, VoxelEffect,
  VoxelPaint, VoxelStroke, VoxelConstraints, GradientStop, BlendMode,
  RichTextSegment, VectorPath, TabItem, EffectType, Anchor,
} from '../types/internal';
import { ComponentMappedType } from '../types/components';

let componentIdCounter = 0;

function generateId(): string {
  componentIdCounter++;
  return `voxel_${componentIdCounter}`;
}

// ============================================================================
// PARSE DE COR
// ============================================================================

function parseFigmaColor(color?: { r: number; g: number; b: number; a?: number } | null, opacity?: number): { r: number; g: number; b: number; a: number } {
  const r = Math.round((color?.r || 0) * 255);
  const g = Math.round((color?.g || 0) * 255);
  const b = Math.round((color?.b || 0) * 255);
  const a = Math.round((opacity ?? color?.a ?? 1) * 255);
  return { r, g, b, a };
}

function parseThemeColor(color?: { r: number; g: number; b: number; a?: number }, opacity?: number, token: string = 'custom'): ThemeColor {
  const parsed = parseFigmaColor(color, opacity);
  return { ...parsed, token };
}

// ============================================================================
// PARSE DE EFFECTS (Sombras, blur, glow)
// ============================================================================

function extractEffects(figmaEffects?: FigmaEffect[]): VoxelEffect[] {
  if (!figmaEffects) return [];

  const effects: VoxelEffect[] = [];

  for (const e of figmaEffects) {
    if (e.visible === false) continue;

    const effect: VoxelEffect = {
      type: mapEffectType(e.type),
      radius: e.radius || 0,
      offsetX: e.offset?.x || 0,
      offsetY: e.offset?.y || 0,
      spread: e.spread || 0,
      color: e.color ? parseFigmaColor(e.color) : undefined,
      visible: true,
    };

    effects.push(effect);
  }

  return effects;
}

function mapEffectType(type: string): EffectType {
  switch (type) {
    case 'DROP_SHADOW': return 'drop-shadow';
    case 'INNER_SHADOW': return 'inner-shadow';
    case 'LAYER_BLUR': return 'layer-blur';
    case 'BACKGROUND_BLUR': return 'background-blur';
    default: return 'drop-shadow';
  }
}

// ============================================================================
// PARSE DE BLEND MODE
// ============================================================================

const BLEND_MODE_MAP: Record<string, BlendMode> = {
  'PASS_THROUGH': 'normal',
  'NORMAL': 'normal',
  'DARKEN': 'darken',
  'MULTIPLY': 'multiply',
  'LINEAR_BURN': 'color-burn',
  'COLOR_BURN': 'color-burn',
  'LIGHTEN': 'lighten',
  'SCREEN': 'screen',
  'LINEAR_DODGE': 'color-dodge',
  'COLOR_DODGE': 'color-dodge',
  'OVERLAY': 'overlay',
  'SOFT_LIGHT': 'soft-light',
  'HARD_LIGHT': 'hard-light',
  'DIFFERENCE': 'difference',
  'EXCLUSION': 'exclusion',
  'HUE': 'hue',
  'SATURATION': 'saturation',
  'COLOR': 'color',
  'LUMINOSITY': 'luminosity',
};

function parseBlendMode(mode?: string): BlendMode {
  if (!mode) return 'normal';
  return BLEND_MODE_MAP[mode] || 'normal';
}

// ============================================================================
// PARSE DE PAINT (FILL / STROKE) — Suporta SOLID, GRADIENT, IMAGE
// ============================================================================

function parsePaint(figmaPaint: FigmaPaint): VoxelPaint {
  const paint: VoxelPaint = {
    type: mapPaintType(figmaPaint.type),
    color: figmaPaint.color ? parseFigmaColor(figmaPaint.color) : undefined,
    opacity: figmaPaint.opacity ?? 1,
    visible: figmaPaint.visible !== false,
    blendMode: parseBlendMode(figmaPaint.blendMode),
  };

  // Gradient
  if (isGradientType(figmaPaint.type) && figmaPaint.gradientHandlePositions) {
    const positions = figmaPaint.gradientHandlePositions;
    paint.gradientStops = parseGradientStops(figmaPaint.gradientStops);

    if (positions.length >= 2) {
      paint.gradientTransform = {
        x1: positions[0].x,
        y1: positions[0].y,
        x2: positions[1].x,
        y2: positions[1].y,
        r: positions[2] ? calculateGradientRadius(positions[0], positions[1], positions[2]) : undefined,
      };
    }
  }

  // Image — apenas IMAGE (VIDEO não é um tipo de paint válido aqui)
  if (figmaPaint.type === 'IMAGE') {
    paint.imageRef = figmaPaint.imageRef;
    paint.imageScaleMode = mapScaleMode(figmaPaint.scaleMode);
  }

  return paint;
}

function mapPaintType(type: string): VoxelPaint['type'] {
  switch (type) {
    case 'SOLID': return 'solid';
    case 'GRADIENT_LINEAR': return 'gradient-linear';
    case 'GRADIENT_RADIAL': return 'gradient-radial';
    case 'GRADIENT_ANGULAR': return 'gradient-angular';
    case 'GRADIENT_DIAMOND': return 'gradient-diamond';
    case 'IMAGE': return 'image';
    default: return 'solid';
  }
}

function isGradientType(type: string): boolean {
  return ['GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND'].includes(type);
}

function parseGradientStops(stops?: { color: FigmaColor; position: number }[]): GradientStop[] {
  if (!stops) return [];
  return stops.map((s) => ({
    color: parseFigmaColor(s.color),
    position: s.position,
  }));
}

function calculateGradientRadius(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number {
  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function mapScaleMode(mode?: string): VoxelPaint['imageScaleMode'] {
  switch (mode) {
    case 'FILL': return 'fill';
    case 'FIT': return 'fit';
    case 'CROP': return 'crop';
    case 'TILE': return 'tile';
    default: return 'fill';
  }
}

// ============================================================================
// PARSE DE STROKES — Completo
// ============================================================================

function parseStrokes(figmaStrokes?: FigmaPaint[], strokeWeight?: number, strokeAlign?: string, strokeCap?: string, strokeJoin?: string, strokeDashes?: number[]): VoxelStroke[] {
  if (!figmaStrokes) return [];

  return figmaStrokes
    .filter((s) => s.visible !== false)
    .map((s) => ({
      paint: parsePaint(s),
      weight: s.opacity ? (strokeWeight || 1) * s.opacity : strokeWeight || 1,
      align: mapStrokeAlign(strokeAlign),
      cap: mapStrokeCap(strokeCap),
      join: mapStrokeJoin(strokeJoin),
      dashes: strokeDashes || [],
      offset: 0,
    }));
}

function mapStrokeAlign(align?: string): VoxelStroke['align'] {
  switch (align) {
    case 'INSIDE': return 'inside';
    case 'OUTSIDE': return 'outside';
    case 'CENTER': return 'center';
    default: return 'inside';
  }
}

function mapStrokeCap(cap?: string): VoxelStroke['cap'] {
  switch (cap) {
    case 'ROUND': return 'round';
    case 'SQUARE': return 'square';
    case 'ARROW_LINES': case 'ARROW_EQUILATERAL': return 'arrow';
    default: return 'none';
  }
}

function mapStrokeJoin(join?: string): VoxelStroke['join'] {
  switch (join) {
    case 'ROUND': return 'round';
    case 'BEVEL': return 'bevel';
    default: return 'miter';
  }
}

// ============================================================================
// PARSE DE CORNERS
// ============================================================================

function extractCorners(node: FigmaDocumentNode): { cornerRadius?: number; individualCorners?: [number, number, number, number]; cornerSmoothing?: number } {
  const result: { cornerRadius?: number; individualCorners?: [number, number, number, number]; cornerSmoothing?: number } = {};

  if (node.rectangleCornerRadii) {
    result.individualCorners = node.rectangleCornerRadii;
    result.cornerRadius = Math.max(...node.rectangleCornerRadii);
  } else if (node.cornerRadius !== undefined && node.cornerRadius !== 0) {
    result.cornerRadius = node.cornerRadius;
  } else if (node.topLeftRadius !== undefined) {
    result.individualCorners = [
      node.topLeftRadius || 0,
      node.topRightRadius || 0,
      node.bottomRightRadius || 0,
      node.bottomLeftRadius || 0,
    ];
    result.cornerRadius = Math.max(node.topLeftRadius || 0, node.topRightRadius || 0, node.bottomRightRadius || 0, node.bottomLeftRadius || 0);
  }

  if (node.cornerSmoothing && node.cornerSmoothing > 0) {
    result.cornerSmoothing = node.cornerSmoothing;
  }

  return result;
}

// ============================================================================
// PARSE DE CONSTRAINTS
// ============================================================================

function extractConstraints(node: FigmaDocumentNode): VoxelConstraints | undefined {
  if (!node.constraints) return undefined;
  return {
    horizontal: node.constraints.horizontal as VoxelConstraints['horizontal'],
    vertical: node.constraints.vertical as VoxelConstraints['vertical'],
  };
}

// ============================================================================
// PARSE DE BASE — Extrai propriedades comuns a TODOS os componentes
// ============================================================================

export interface ExtractedBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  cornerRadius?: number;
  individualCorners?: [number, number, number, number];
  cornerSmoothing?: number;
  effects: VoxelEffect[];
  fills: VoxelPaint[];
  strokes: VoxelStroke[];
  strokeWeight: number;
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
  locked: boolean;
  zIndex: number;
}

function extractBaseProperties(node: FigmaDocumentNode, parentZIndex: number = 0): ExtractedBase {
  const box = node.absoluteBoundingBox;
  const corners = extractCorners(node);

  return {
    id: generateId(),
    x: box?.x || 0,
    y: box?.y || 0,
    width: box?.width || 0,
    height: box?.height || 0,
    visible: node.visible !== false,
    opacity: node.opacity ?? 1,
    ...corners,
    effects: extractEffects(node.effects),
    fills: (node.fills || []).filter((f) => f.visible !== false).map(parsePaint),
    strokes: parseStrokes(node.strokes, node.strokeWeight, node.strokeAlign, node.strokeCap, node.strokeJoin, node.strokeDashes),
    strokeWeight: node.strokeWeight ?? 0,
    blendMode: parseBlendMode(node.blendMode),
    isMask: node.isMask || false,
    clipContent: node.clipsContent || false,
    constraints: extractConstraints(node),
    layoutGrow: node.layoutGrow,
    layoutAlign: node.layoutAlign as any,
    minWidth: node.minWidth,
    maxWidth: node.maxWidth,
    minHeight: node.minHeight,
    maxHeight: node.maxHeight,
    rotation: node.relativeTransform ? extractRotation(node.relativeTransform) : 0,
    locked: node.locked || false,
    zIndex: parentZIndex + 1,
  };
}

function extractRotation(transform: number[][]): number {
  if (!transform || transform.length < 2) return 0;
  const a = transform[0][0];
  const b = transform[0][1];
  return Math.atan2(b, a) * (180 / Math.PI);
}

// ============================================================================
// PARSE DE ÁNIMATION DO NOME
// ============================================================================

function extractAnimation(props: Record<string, string>): string | undefined {
  const anim = props.animation;
  if (!anim || anim === 'none') return undefined;
  return anim;
}

function extractAnchor(props: Record<string, string>): Anchor | undefined {
  const anchor = props.anchor;
  const validAnchors: Anchor[] = ['center', 'left', 'right', 'top', 'bottom', 'topleft', 'topright', 'bottomleft', 'bottomright'];
  if (anchor && validAnchors.includes(anchor as Anchor)) {
    return anchor as Anchor;
  }
  return undefined;
}

// ============================================================================
// TEXT EXTRACTION — Completo com rich text, textCase, decoration
// ============================================================================

function extractRichTextSegments(node: FigmaDocumentNode): RichTextSegment[] {
  if (!node.characterStyleOverrides || !node.styleOverrideTable) return [];

  const segments: RichTextSegment[] = [];
  const text = node.characters || '';

  // Mapa de estilos por posição
  const styleMap = new Map<number, number>();
  node.characterStyleOverrides.forEach((styleId, charIndex) => {
    if (styleId > 0) {
      styleMap.set(charIndex, styleId);
    }
  });

  // Agrupa em segmentos consecutivos
  if (styleMap.size === 0) return [];

  let currentStart = 0;
  let currentStyleId: number = styleMap.get(0) || 0;

  for (let i = 1; i <= text.length; i++) {
    const styleId = styleMap.get(i);
    if (styleId !== currentStyleId) {
      const styleOverride = currentStyleId > 0 ? node.styleOverrideTable?.[currentStyleId] : undefined;
      segments.push({
        text: text.substring(currentStart, i),
        start: currentStart,
        end: i,
        fontFamily: styleOverride?.fontFamily,
        fontWeight: styleOverride?.fontWeight,
        fontSize: styleOverride?.fontSize,
        italic: styleOverride?.italic,
        underline: styleOverride?.underline,
        strikethrough: styleOverride?.strikethrough,
        hyperlink: styleOverride?.hyperlink?.url,
      });
      currentStart = i;
      currentStyleId = styleId ?? 0;
    }
  }

  return segments;
}

function extractTextStyle(node: FigmaDocumentNode, props: Record<string, string>): any {
  const style = node.style;
  const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
    LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify',
  };

  const verticalAlignMap: Record<string, 'top' | 'center' | 'bottom'> = {
    TOP: 'top', CENTER: 'center', BOTTOM: 'bottom',
  };

  return {
    text: props.text || node.characters || 'Text',
    fontSize: props.fontSize ? parseInt(props.fontSize, 10) : (style?.fontSize || 16),
    fontWeight: props.fontWeight ? parseInt(props.fontWeight, 10) : (style?.fontWeight || 400),
    fontFamily: props.fontFamily || style?.fontFamily || 'default',
    align: props.align ? (props.align as 'left' | 'center' | 'right') : (alignMap[style?.textAlignHorizontal || 'LEFT'] || 'left'),
    verticalAlign: verticalAlignMap[style?.textAlignVertical || 'TOP'] || 'top',
    color: props.color || 'text',
    letterSpacing: style?.letterSpacing ?? 0,
    lineHeight: style?.lineHeightPx || (style?.fontSize || 16) * 1.2,
    lineHeightUnit: style?.lineHeightUnit === 'PIXELS' ? 'px' : 'percent',
    textCase: mapTextCase(style?.textCase || (props.textCase as any)),
    textDecoration: mapTextDecoration(style?.textDecoration || (props.decoration as any)),
    italic: style?.italic || false,
    paragraphSpacing: style?.paragraphSpacing || 0,
    paragraphIndent: style?.paragraphIndent || 0,
    listSpacing: style?.listSpacing || 0,
    richTextSegments: extractRichTextSegments(node),
  };
}

function mapTextCase(textCase?: string): 'upper' | 'lower' | 'title' | 'normal' {
  switch (textCase) {
    case 'UPPER': case 'upper': return 'upper';
    case 'LOWER': case 'lower': return 'lower';
    case 'TITLE': case 'title': return 'title';
    case 'SMALL_CAPS': case 'SMALL_CAPS_FORCED': return 'upper';
    default: return 'normal';
  }
}

function mapTextDecoration(decoration?: string): 'none' | 'underline' | 'strikethrough' {
  switch (decoration) {
    case 'UNDERLINE': case 'underline': return 'underline';
    case 'STRIKETHROUGH': case 'strikethrough': return 'strikethrough';
    default: return 'none';
  }
}

// ============================================================================
// EXTRACT SHAPES
// ============================================================================

export function extractRectangle(node: FigmaDocumentNode): VoxelRectangle {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'rectangle',
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

export function extractEllipse(node: FigmaDocumentNode): VoxelEllipse {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'ellipse',
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

export function extractTriangle(node: FigmaDocumentNode): VoxelTriangle {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'triangle',
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

export function extractPolygon(node: FigmaDocumentNode): VoxelPolygon {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'polygon',
    sides: 6, // Default, could be extracted from name
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

export function extractStar(node: FigmaDocumentNode): VoxelStar {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'star',
    points: 5,
    innerRadius: 0.5,
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

export function extractLine(node: FigmaDocumentNode): VoxelLine {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'line',
    startX: 0,
    startY: base.height / 2,
    endX: base.width,
    endY: base.height / 2,
    arrowStart: false,
    arrowEnd: false,
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

export function extractVector(node: FigmaDocumentNode): VoxelVector {
  const base = extractBaseProperties(node);
  const paths: VectorPath[] = (node.fillGeometry || []).map((g) => ({
    windingRule: g.windingRule === 'EVENODD' ? 'even-odd' : 'non-zero',
    data: g.path,
  }));

  return {
    ...base,
    type: 'vector',
    paths,
    animation: undefined,
    theme: undefined,
    zIndex: base.zIndex,
    anchor: undefined,
  };
}

// ============================================================================
// EXTRACT BUTTON — Completo
// ============================================================================

export function extractButton(node: FigmaDocumentNode, props: Record<string, string>): VoxelButton {
  const base = extractBaseProperties(node);
  const style = node.style;

  return {
    ...base,
    type: 'button',
    text: props.text || node.name.replace(/^(UI_Button|Btn)/, '').replace(/[(_].*/, '').trim() || 'Button',
    onClick: props.onclick || props.onClick,
    hoverColor: props.hoverColor || props.hovercolor,
    fontSize: props.fontSize ? parseInt(props.fontSize, 10) : (style?.fontSize || 14),
    fontFamily: props.fontFamily || style?.fontFamily || 'default',
    fontWeight: props.fontWeight ? parseInt(props.fontWeight, 10) : (style?.fontWeight || 700),
    textCase: mapTextCase(props.textCase),
    icon: props.icon,
    iconPosition: (props.iconPos as 'left' | 'right') || 'left',
    loadingText: props.loading,
    disabled: props.disabled === 'true',
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT INPUT — Correção do bug + multiline + tipos
// ============================================================================

export function extractInput(node: FigmaDocumentNode, props: Record<string, string>): VoxelInput {
  const base = extractBaseProperties(node);
  const style = node.style;

  return {
    ...base,
    type: 'input',
    placeholder: props.placeholder || 'Digite aqui...',
    masked: props.masked === 'true',
    maxLength: props.maxLength ? parseInt(props.maxLength, 10) : 64,
    defaultValue: props.defaultValue || props.default || node.characters || '',
    fontSize: props.fontSize ? parseInt(props.fontSize, 10) : (style?.fontSize || 14),
    fontFamily: props.fontFamily || style?.fontFamily || 'default',
    textAlign: (props.align as 'left' | 'center' | 'right') || 'left',
    prefix: props.prefix,
    suffix: props.suffix,
    inputType: (props.type as 'text' | 'number' | 'email' | 'password') || 'text',
    multiline: props.multiline === 'true',
    autoFocus: props.autofocus === 'true',
    animation: extractAnimation(props),
    theme: props.theme || 'surface',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT TEXT — Completo com rich text
// ============================================================================

export function extractText(node: FigmaDocumentNode, props: Record<string, string>): VoxelText {
  const base = extractBaseProperties(node);
  const textStyle = extractTextStyle(node, props);

  const result: VoxelText = {
    ...base,
    type: 'text',
    text: textStyle.text || 'Text',
    fontSize: textStyle.fontSize || 16,
    align: textStyle.align || 'left',
    verticalAlign: textStyle.verticalAlign || 'top',
    fontWeight: textStyle.fontWeight || 400,
    fontFamily: textStyle.fontFamily || 'default',
    color: textStyle.color || 'text',
    letterSpacing: textStyle.letterSpacing || 0,
    lineHeight: textStyle.lineHeight || 20,
    lineHeightUnit: textStyle.lineHeightUnit || 'px',
    textCase: textStyle.textCase || 'normal',
    textDecoration: textStyle.textDecoration || 'none',
    italic: textStyle.italic || false,
    paragraphSpacing: textStyle.paragraphSpacing || 0,
    paragraphIndent: textStyle.paragraphIndent || 0,
    listSpacing: textStyle.listSpacing || 0,
    richTextSegments: textStyle.richTextSegments || [],
    animation: extractAnimation(props),
    theme: props.theme,
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
  return result;
}

// ============================================================================
// EXTRACT IMAGE
// ============================================================================

export function extractImage(node: FigmaDocumentNode, props: Record<string, string>, imageUrl?: string): VoxelImage {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'image',
    src: props.src || `${node.id}.png`,
    assetUrl: imageUrl || '',
    downloaded: !!imageUrl,
    scaleMode: (props.scaleMode as VoxelImage['scaleMode']) || 'fill',
    rotation: base.rotation || 0,
    animation: extractAnimation(props),
    theme: props.theme,
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT SVG
// ============================================================================

export function extractSvg(node: FigmaDocumentNode, props: Record<string, string>, svgContent?: string): VoxelSvg {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'svg',
    svgContent: svgContent || '',
    assetPath: props.src,
    animation: extractAnimation(props),
    theme: props.theme,
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT DROPDOWN
// ============================================================================

export function extractDropdown(node: FigmaDocumentNode, props: Record<string, string>): VoxelDropdown {
  const base = extractBaseProperties(node);
  const options = props.options ? props.options.split(/[,|]/).map((s) => s.trim()) : ['Opção 1', 'Opção 2'];
  const defaultIndex = props.default ? parseInt(props.default, 10) - 1 : 0;

  return {
    ...base,
    type: 'dropdown',
    text: props.text || 'Selecione...',
    options,
    selectedIndex: Math.max(0, defaultIndex),
    open: false,
    fontSize: props.fontSize ? parseInt(props.fontSize, 10) : 14,
    maxVisible: props.maxVisible ? parseInt(props.maxVisible, 10) : 6,
    searchable: props.searchable === 'true',
    animation: extractAnimation(props),
    theme: props.theme || 'surface',
    anchor: extractAnchor(props),
    zIndex: base.zIndex + 100, // Dropdown fica acima
  };
}

// ============================================================================
// EXTRACT CHECKBOX
// ============================================================================

export function extractCheckbox(node: FigmaDocumentNode, props: Record<string, string>): VoxelCheckbox {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'checkbox',
    text: props.text || 'Checkbox',
    checked: props.default === 'true' || props.default === 'checked',
    fontSize: props.fontSize ? parseInt(props.fontSize, 10) : 14,
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT RADIO
// ============================================================================

export function extractRadio(node: FigmaDocumentNode, props: Record<string, string>): VoxelRadio {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'radio',
    text: props.text || 'Opção',
    selected: props.default === 'true' || props.default === 'selected',
    groupName: props.group || 'default',
    fontSize: props.fontSize ? parseInt(props.fontSize, 10) : 14,
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT SWITCH
// ============================================================================

export function extractSwitch(node: FigmaDocumentNode, props: Record<string, string>): VoxelSwitch {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'switch',
    text: props.text || 'Switch',
    checked: props.default === 'true' || props.default === 'on',
    activeColor: props.activeColor,
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT SLIDER
// ============================================================================

export function extractSlider(node: FigmaDocumentNode, props: Record<string, string>): VoxelSlider {
  const base = extractBaseProperties(node);
  const min = props.min ? parseFloat(props.min) : 0;
  const max = props.max ? parseFloat(props.max) : 100;

  return {
    ...base,
    type: 'slider',
    min,
    max,
    value: props.default ? Math.max(min, Math.min(max, parseFloat(props.default))) : min,
    step: props.step ? parseFloat(props.step) : 1,
    orientation: (props.orientation as 'horizontal' | 'vertical') || 'horizontal',
    showValue: props.showValue !== 'false',
    suffix: props.suffix,
    prefix: props.prefix,
    formatValue: props.format,
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT PROGRESS
// ============================================================================

export function extractProgress(node: FigmaDocumentNode, props: Record<string, string>): VoxelProgress {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'progress',
    min: props.min ? parseFloat(props.min) : 0,
    max: props.max ? parseFloat(props.max) : 100,
    value: props.default ? parseFloat(props.default) : 0,
    showLabel: props.showLabel !== 'false',
    label: props.label,
    variant: (props.variant as 'linear' | 'circular') || 'linear',
    thickness: props.thickness ? parseInt(props.thickness, 10) : 6,
    color: props.color,
    trackColor: props.trackColor,
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT TABS
// ============================================================================

export function extractTabs(node: FigmaDocumentNode, props: Record<string, string>): VoxelTabs {
  const base = extractBaseProperties(node);

  const tabNames = props.tabs ? props.tabs.split(/[,|]/).map((s) => s.trim()) : ['Tab 1', 'Tab 2'];
  const tabs: TabItem[] = tabNames.map((name) => ({ text: name }));

  return {
    ...base,
    type: 'tabs',
    tabs,
    selectedIndex: props.default ? Math.max(0, parseInt(props.default, 10) - 1) : 0,
    tabPosition: (props.position as 'top' | 'left') || 'top',
    animation: extractAnimation(props),
    theme: props.theme || 'primary',
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// EXTRACT TOOLTIP
// ============================================================================

export function extractTooltip(node: FigmaDocumentNode, props: Record<string, string>, parentId?: string): VoxelTooltip {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'tooltip',
    text: props.text || 'Tooltip',
    targetId: props.target || parentId || '',
    position: (props.position as 'top' | 'bottom' | 'left' | 'right') || 'bottom',
    delay: props.delay ? parseInt(props.delay, 10) : 500,
    maxWidth: props.maxWidth ? parseInt(props.maxWidth, 10) : 200,
    animation: extractAnimation(props),
    theme: props.theme || 'surface',
    anchor: extractAnchor(props),
    zIndex: base.zIndex + 1000, // Tooltips sempre no topo
  };
}

// ============================================================================
// EXTRACT GROUP / SCROLLVIEW
// ============================================================================

export function extractGroup(node: FigmaDocumentNode, props: Record<string, string>, children: VoxelComponent[] = []): VoxelGroup {
  const base = extractBaseProperties(node);
  return {
    ...base,
    type: 'group',
    children,
    layoutMode: node.layoutMode || 'NONE',
    padding: {
      left: node.paddingLeft || 0,
      right: node.paddingRight || 0,
      top: node.paddingTop || 0,
      bottom: node.paddingBottom || 0,
    },
    itemSpacing: node.itemSpacing || 0,
    primaryAlign: node.primaryAxisAlignItems as any,
    counterAlign: node.counterAxisAlignItems as any,
    animation: extractAnimation(props),
    theme: props.theme,
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

export function extractScrollView(node: FigmaDocumentNode, props: Record<string, string>, children: VoxelComponent[] = []): VoxelScrollView {
  const base = extractBaseProperties(node);
  // Calculate content dimensions
  let contentWidth = base.width;
  let contentHeight = base.height;
  if (children.length > 0) {
    contentWidth = Math.max(...children.map((c) => c.x + c.width));
    contentHeight = Math.max(...children.map((c) => c.y + c.height));
  }

  return {
    ...base,
    type: 'scrollview',
    contentWidth,
    contentHeight,
    scrollX: 0,
    scrollY: 0,
    showScrollbar: props.scrollbar !== 'false',
    scrollbarWidth: 6,
    children,
    animation: extractAnimation(props),
    theme: props.theme,
    anchor: extractAnchor(props),
    zIndex: base.zIndex,
  };
}

// ============================================================================
// FACTORY PRINCIPAL — Cria qualquer tipo de componente
// ============================================================================

export function createComponent(
  type: ComponentMappedType,
  node: FigmaDocumentNode,
  props: Record<string, string>,
  extra?: { imageUrl?: string; svgContent?: string; children?: VoxelComponent[]; parentId?: string },
): VoxelComponent {
  switch (type) {
    // Formas básicas
    case 'group':
      return extractGroup(node, props, extra?.children || []);

    // Botão
    case 'button':
      return extractButton(node, props);

    // Input
    case 'input':
      return extractInput(node, props);

    // Texto
    case 'text':
      return extractText(node, props);

    // Imagem / SVG
    case 'image':
      return extractImage(node, props, extra?.imageUrl);
    case 'svg':
      return extractSvg(node, props, extra?.svgContent);

    // Avançados
    case 'dropdown':
      return extractDropdown(node, props);
    case 'checkbox':
      return extractCheckbox(node, props);
    case 'radio':
      return extractRadio(node, props);
    case 'switch':
      return extractSwitch(node, props);
    case 'slider':
      return extractSlider(node, props);
    case 'progress':
      return extractProgress(node, props);
    case 'tabs':
      return extractTabs(node, props);
    case 'tooltip':
      return extractTooltip(node, props, extra?.parentId);
    case 'scrollview':
      return extractScrollView(node, props, extra?.children || []);

    // Window / Container é tratado separadamente
    case 'window':
      throw new Error('Window should be handled by parser, not by createComponent');

    default:
      // Fallback para shapes detectados por nodeType
      return extractRectangle(node);
  }
}