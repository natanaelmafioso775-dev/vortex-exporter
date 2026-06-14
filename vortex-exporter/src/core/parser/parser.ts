// ============================================================================
// Parser — Orquestrador principal: Figma API → VoxelProject (IR)
// ============================================================================

import axios from 'axios';
import { FigmaClient } from '../api/figma';
import { FigmaDocumentNode, FigmaImageResponse, FigmaVariablesResponse } from '../types/figma';
import {
  VoxelProject, VoxelComponent, VoxelGroup, VoxelScrollView, VoxelTooltip,
  ProjectMeta, WindowConfig, ThemeConfig, ThemeColor,
  Anchor, AssetRef, FontRef, VariableRef, Interaction, InteractionAction,
  AnimationDef, VoxelLayoutGrid, VoxelPadding, VoxelBase,
} from '../types/internal';
import {
  detectComponents, DetectedComponent, findMainWindow,
  groupComponentsByWindow, flattenComponents, detectTooltips,
} from './component-detector';
import { createComponent } from './property-extractor';
import { generateAssetFilename } from './asset-downloader';
import { logger } from '../../shared/logger';
import { ParseError } from '../../shared/errors';

const VERSION = '2.0.0';

export interface ParseOptions {
  url: string;
  fileKey: string;
  token: string;
  outputDir: string;
}

export interface ParseResult {
  project: VoxelProject;
  detectedComponents: DetectedComponent[];
  warnings: string[];
}

// ============================================================================
// TEMA PADRÃO
// ============================================================================

const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: { r: 0, g: 122, b: 255, a: 255, token: 'primary', original: 'Primary' },
    primaryHover: { r: 0, g: 102, b: 235, a: 255, token: 'primaryHover', original: 'Primary Hover' },
    primaryLight: { r: 224, g: 238, b: 255, a: 255, token: 'primaryLight', original: 'Primary Light' },
    secondary: { r: 108, g: 117, b: 125, a: 255, token: 'secondary', original: 'Secondary' },
    secondaryHover: { r: 90, g: 98, b: 107, a: 255, token: 'secondaryHover', original: 'Secondary Hover' },
    success: { r: 40, g: 167, b: 69, a: 255, token: 'success', original: 'Success' },
    successHover: { r: 33, g: 136, b: 56, a: 255, token: 'successHover', original: 'Success Hover' },
    danger: { r: 220, g: 53, b: 69, a: 255, token: 'danger', original: 'Danger' },
    dangerHover: { r: 200, g: 35, b: 51, a: 255, token: 'dangerHover', original: 'Danger Hover' },
    warning: { r: 255, g: 193, b: 7, a: 255, token: 'warning', original: 'Warning' },
    warningHover: { r: 224, g: 168, b: 0, a: 255, token: 'warningHover', original: 'Warning Hover' },
    info: { r: 23, g: 162, b: 184, a: 255, token: 'info', original: 'Info' },
    infoHover: { r: 19, g: 132, b: 155, a: 255, token: 'infoHover', original: 'Info Hover' },
    dark: { r: 33, g: 37, b: 41, a: 255, token: 'dark', original: 'Dark' },
    light: { r: 248, g: 249, b: 250, a: 255, token: 'light', original: 'Light' },
    text: { r: 255, g: 255, b: 255, a: 255, token: 'text', original: 'Text' },
    textSecondary: { r: 173, g: 181, b: 189, a: 255, token: 'textSecondary', original: 'Text Secondary' },
    textMuted: { r: 108, g: 117, b: 125, a: 255, token: 'textMuted', original: 'Text Muted' },
    background: { r: 17, g: 24, b: 39, a: 255, token: 'background', original: 'Background' },
    surface: { r: 30, g: 39, b: 58, a: 255, token: 'surface', original: 'Surface' },
    surfaceHover: { r: 40, g: 50, b: 72, a: 255, token: 'surfaceHover', original: 'Surface Hover' },
    surfaceAlt: { r: 22, g: 28, b: 46, a: 255, token: 'surfaceAlt', original: 'Surface Alt' },
    border: { r: 60, g: 70, b: 90, a: 255, token: 'border', original: 'Border' },
    borderLight: { r: 80, g: 90, b: 110, a: 255, token: 'borderLight', original: 'Border Light' },
    neon: { r: 0, g: 255, b: 200, a: 255, token: 'neon', original: 'Neon' },
    neonGlow: { r: 0, g: 255, b: 200, a: 80, token: 'neonGlow', original: 'Neon Glow' },
    glass: { r: 255, g: 255, b: 255, a: 40, token: 'glass', original: 'Glass' },
    glassBorder: { r: 255, g: 255, b: 255, a: 60, token: 'glassBorder', original: 'Glass Border' },
  },
  fonts: {
    default: 'default', bold: 'default-bold', mono: 'clear', sans: 'default', serif: 'default',
  },
  spacings: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: {},
  opacities: { disabled: 0.5, hover: 0.9, active: 1.0 },
};

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

export async function parseFigmaProject(options: ParseOptions): Promise<ParseResult> {
  const { fileKey, token, url, outputDir } = options;
  logger.info(`[Parser] Starting parse for project: ${fileKey}`);
  const warnings: string[] = [];

  const client = new FigmaClient(token);
  const figmaFile = await client.getFile(fileKey);
  logger.info(`[Parser] File loaded: "${figmaFile.name}"`);

  const detected = detectComponents(figmaFile.document);
  logger.info(`[Parser] Detected ${detected.length} component(s)`);

  if (detected.length === 0) {
    throw new ParseError(
      'No components found. Use UI_ prefix (e.g., UI_Window, UI_Button) or supported node types.',
      { fileKey }
    );
  }

  const mainWindow = findMainWindow(detected);
  if (!mainWindow) {
    warnings.push('No UI_Window found. Using first canvas as window.');
  }

  const mainWindowNode = mainWindow?.node || figmaFile.document.children?.[0];
  const windowBox = mainWindowNode?.absoluteBoundingBox;
  const windowProp = mainWindow?.props || {};

  const windowConfig: WindowConfig = {
    width: windowBox?.width || 800,
    height: windowBox?.height || 600,
    minWidth: mainWindowNode?.minWidth,
    minHeight: mainWindowNode?.minHeight,
    maxWidth: mainWindowNode?.maxWidth,
    maxHeight: mainWindowNode?.maxHeight,
    title: windowProp.text || figmaFile.name,
    movable: windowProp.movable !== 'false',
    resizable: windowProp.resizable === 'true',
    theme: windowProp.theme || 'dark',
    anchor: (windowProp.anchor as Anchor) || 'center',
    responsive: windowProp.responsive === 'true',
    clipsContent: mainWindowNode?.clipsContent || false,
    layoutMode: (mainWindowNode?.layoutMode as any) || 'NONE',
    padding: mainWindowNode ? {
      left: mainWindowNode.paddingLeft || 0,
      right: mainWindowNode.paddingRight || 0,
      top: mainWindowNode.paddingTop || 0,
      bottom: mainWindowNode.paddingBottom || 0,
    } : undefined,
    itemSpacing: mainWindowNode?.itemSpacing || 0,
  };

  logger.info(`[Parser] Window: ${windowConfig.width}x${windowConfig.height} "${windowConfig.title}"`);

  const windows = detected.filter((c) => c.componentType === 'window');
  const grouped = groupComponentsByWindow(detected, windows);
  const tooltipPairs = detectTooltips(detected);

  const components: VoxelComponent[] = [];
  const assets: AssetRef[] = [];
  const imageNodeIds: string[] = [];
  const fonts: FontRef[] = [];
  const variables: VariableRef[] = [];
  const interactions: Interaction[] = [];
  const animations: AnimationDef[] = [];

  for (const detectedComp of detected) {
    if (detectedComp.componentType === 'image' || detectedComp.node.type === 'VECTOR') {
      imageNodeIds.push(detectedComp.node.id);
    }
  }

  let imageUrls: FigmaImageResponse | undefined;
  if (imageNodeIds.length > 0) {
    imageUrls = await client.getImageUrls(fileKey, imageNodeIds, 'png');
    logger.info(`[Parser] Fetched ${Object.keys(imageUrls.images || {}).length} image URL(s)`);
  }

  const svgContentMap: Record<string, string> = {};
  const svgNodeIds = detected.filter((c) => c.node.type === 'VECTOR' || c.componentType === 'svg').map((c) => c.node.id);
  if (svgNodeIds.length > 0) {
    try {
      // Busca todos os SVGs em UMA única chamada (API suporta múltiplos IDs)
      const svgResult = await client.getImageUrls(fileKey, svgNodeIds, 'svg');
      if (svgResult.images) {
        for (const [nodeId, imageUrl] of Object.entries(svgResult.images)) {
          if (imageUrl) {
            try {
              const svg = await axios.get<string>(imageUrl);
              svgContentMap[nodeId] = svg.data;
            } catch {
              logger.warn(`[Parser] Failed to download SVG for node ${nodeId}`);
            }
          }
        }
      }
    } catch (err: any) {
      logger.warn(`[Parser] Failed to fetch SVGs batch: ${err.message}. Rate limit may have been exceeded.`);
    }
  }

  for (const detectedComp of detected) {
    if (detectedComp.componentType === 'window') continue;

    const node = detectedComp.node;
    const props = detectedComp.props;

    let imageUrl: string | undefined;
    let svgContent: string | undefined;

    if (imageUrls && imageUrls.images[node.id]) {
      imageUrl = imageUrls.images[node.id];
      if (!assets.find((a) => a.id === node.id)) {
        assets.push({ id: node.id, type: 'image', url: imageUrl, filename: generateAssetFilename(node.id, node.name, 'image'), localPath: '' });
      }
    }

    if (svgContentMap[node.id]) {
      svgContent = svgContentMap[node.id];
      if (!assets.find((a) => a.id === node.id)) {
        assets.push({ id: node.id, type: 'svg', url: '', filename: generateAssetFilename(node.id, node.name, 'svg'), localPath: '' });
      }
    }

    let children: VoxelComponent[] | undefined;
    if (['group', 'scrollview'].includes(detectedComp.componentType)) {
      children = [];
      for (const child of detectedComp.children || []) {
        children.push(createComponent(child.componentType, child.node, child.props, {
          imageUrl: imageUrls?.images[child.node.id],
          svgContent: svgContentMap[child.node.id],
          children: undefined,
          parentId: node.id,
        }));
      }
    }

    const tooltipPair = tooltipPairs.find((p) => p.tooltip.node.id === node.id);
    const parentId = tooltipPair?.target.node.id || props.target;

    components.push(createComponent(detectedComp.componentType, node, props, { imageUrl, svgContent, children, parentId }));
  }

  components.sort((a, b) => (a as any).zIndex - (b as any).zIndex);

  extractFonts(detected, fonts);
  const theme = buildTheme(figmaFile);
  extractInteractions(detected, interactions);
  const layoutGrids = extractLayoutGrids(mainWindowNode);

  try {
    const figmaVariables = await client.getFileVariables?.(fileKey);
    if (figmaVariables) {
      extractVariables(figmaVariables, variables);
      // applyVariablesToTheme(variables, theme); - if needed
      logger.info(`[Parser] Extracted ${variables.length} variable(s)`);
    }
  } catch {
    logger.debug('[Parser] No local variables available');
  }

  const project: VoxelProject = {
    version: VERSION,
    meta: {
      name: figmaFile.name,
      sourceFile: fileKey,
      sourceUrl: url,
      exportedAt: new Date().toISOString(),
      thumbnailUrl: figmaFile.thumbnailUrl || '',
      lastModified: figmaFile.lastModified || '',
    },
    window: windowConfig,
    components,
    assets,
    theme,
    fonts,
    variables,
    interactions,
    animations,
    layoutGrids,
  };

  logger.info(`[Parser] Parse complete: ${components.length} component(s), ${assets.length} asset(s), ${fonts.length} font(s)`);
  return { project, detectedComponents: detected, warnings };
}

function extractFonts(detected: DetectedComponent[], fonts: FontRef[]): void {
  const seen = new Set<string>();
  for (const comp of detected) {
    const node = comp.node;
    if (node.style?.fontFamily) {
      const key = `${node.style.fontFamily}-${node.style.fontWeight || 400}`;
      if (!seen.has(key)) { seen.add(key); fonts.push({ family: node.style.fontFamily, weight: node.style.fontWeight || 400, style: node.style.italic ? 'italic' : 'normal', downloaded: false }); }
    }
    if (node.styleOverrideTable) {
      for (const [_, style] of Object.entries(node.styleOverrideTable)) {
        if (style.fontFamily) {
          const key = `${style.fontFamily}-${style.fontWeight || 400}`;
          if (!seen.has(key)) { seen.add(key); fonts.push({ family: style.fontFamily, weight: style.fontWeight || 400, style: style.italic ? 'italic' : 'normal', downloaded: false }); }
        }
      }
    }
  }
}

function buildTheme(figmaFile: { styles?: Record<string, { name: string; styleType: string }> }): ThemeConfig {
  return JSON.parse(JSON.stringify(DEFAULT_THEME));
}

function extractVariables(figmaVariables: FigmaVariablesResponse, variables: VariableRef[]): void {
  if (!figmaVariables.meta?.variables) return;
  for (const [id, variable] of Object.entries(figmaVariables.meta.variables)) {
    const collectionName = figmaVariables.meta.variableCollections?.[variable.variableCollectionId]?.name || 'Unknown';
    const firstModeId = Object.keys(variable.valuesByMode)[0];
    const value = firstModeId ? variable.valuesByMode[firstModeId] : null;
    if (value !== null) {
      variables.push({ id: variable.id, name: variable.name, resolvedType: variable.resolvedType as any, value, collectionName });
    }
  }
}

function extractInteractions(detected: DetectedComponent[], interactions: Interaction[]): void {
  for (const comp of detected) {
    const node = comp.node;
    if (node.reactions) {
      for (const reaction of node.reactions) {
        const trigger = mapTrigger(reaction.trigger.type);
        if (!trigger) continue;
        const actionType = mapAction(reaction.action.type);
        if (!actionType) continue;
        interactions.push({
          trigger,
          action: {
            type: actionType,
            target: reaction.action.destinationId,
            transitionDuration: reaction.action.transitionDuration || node.transitionDuration,
            transitionEasing: mapEasing(reaction.action.transitionEasing || node.transitionEasing),
            value: reaction.action.url, // store URL in value
          },
          sourceId: node.id,
        });
      }
    }
  }
}

function mapTrigger(trigger: string): Interaction['trigger'] | null {
  const map: Record<string, Interaction['trigger']> = {
    'ON_CLICK': 'on-click', 'ON_HOVER': 'on-hover', 'ON_PRESS': 'on-press',
    'MOUSE_ENTER': 'on-mouse-enter', 'MOUSE_LEAVE': 'on-mouse-leave',
    'MOUSE_DOWN': 'on-mouse-down', 'MOUSE_UP': 'on-mouse-up',
    'AFTER_TIMEOUT': 'after-timeout', 'ON_DRAG': 'on-drag',
  };
  return map[trigger] || null;
}

function mapAction(action: string): InteractionAction['type'] | null {
  const map: Record<string, InteractionAction['type']> = {
    'NAVIGATE': 'navigate', 'SWAP': 'navigate', 'OVERLAY': 'navigate',
    'BACK': 'close', 'CLOSE': 'close', 'URL': 'url',
    'UPDATE_STATE': 'set-value', 'SET_VARIABLE': 'set-value',
  };
  return map[action] || null;
}

function mapEasing(easing?: string): string | undefined {
  if (!easing) return undefined;
  const map: Record<string, string> = {
    'EASE_IN': 'ease-in', 'EASE_OUT': 'ease-out', 'EASE_IN_AND_OUT': 'ease-in-out',
    'LINEAR': 'linear', 'GENTLE': 'ease-out', 'GENTLE_SPRING': 'spring',
    'SPRING': 'spring', 'SPRING_FAST': 'spring', 'BOUNCE': 'bounce', 'BOUNCE_SMALL': 'bounce',
  };
  return map[easing];
}

function extractLayoutGrids(node?: FigmaDocumentNode): VoxelLayoutGrid[] {
  if (!node?.layoutGrids) return [];
  return node.layoutGrids.filter((g) => g.visible !== false).map((g) => ({
    pattern: g.pattern.toLowerCase() as VoxelLayoutGrid['pattern'],
    sectionSize: g.sectionSize,
    visible: g.visible !== false,
    color: { r: g.color.r, g: g.color.g, b: g.color.b, a: g.color.a },
    alignment: g.alignment.toLowerCase() as VoxelLayoutGrid['alignment'],
    gutterSize: g.gutterSize,
    count: g.count,
    offset: g.offset,
  }));
}