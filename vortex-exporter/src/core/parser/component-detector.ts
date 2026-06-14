// ============================================================================
// Component Detector — Detecta TODOS os tipos de componentes do Figma
// Suporta: formas geométricas, UI_* components, instâncias, componentes aninhados
// ============================================================================

import { FigmaDocumentNode, FigmaNodeType } from '../types/figma';
import {
  detectComponentType, detectShapeByNodeType,
  extractAnimation, extractTheme, extractText,
  extractPropsFromName, extractListOptions, extractIcon,
  ComponentMappedType,
} from '../types/components';
import { logger } from '../../shared/logger';

export interface DetectedComponent {
  node: FigmaDocumentNode;
  componentType: ComponentMappedType;
  props: Record<string, string>;
  children: DetectedComponent[];
  parentType?: string;
  zIndex: number;
}

// ============================================================================
// TIPOS DE NÓ FIGMA QUE SÃO FORMAS GEOMÉTRICAS
// ============================================================================

const SHAPE_NODE_TYPES: FigmaNodeType[] = [
  'RECTANGLE', 'ELLIPSE', 'TRIANGLE', 'POLYGON', 'STAR', 'LINE', 'VECTOR',
];

const CONTAINER_NODE_TYPES: FigmaNodeType[] = [
  'FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'CANVAS',
];

/**
 * Detecta se um nó é uma forma geométrica (não precisa de prefixo UI_)
 */
function isShapeNode(node: FigmaDocumentNode): boolean {
  return SHAPE_NODE_TYPES.includes(node.type);
}

/**
 * Detecta se um nó é um container (pode ter filhos)
 */
function isContainerNode(node: FigmaDocumentNode): boolean {
  return CONTAINER_NODE_TYPES.includes(node.type);
}

/**
 * Detecta o tipo de mapeamento para shapes baseado no tipo de nó Figma
 */
function mapShapeNodeType(nodeType: FigmaNodeType): ComponentMappedType | null {
  switch (nodeType) {
    case 'RECTANGLE': return 'window';  // Rectangle vira window/container
    case 'ELLIPSE': return 'window';
    case 'TRIANGLE': return 'window';
    case 'POLYGON': return 'window';
    case 'STAR': return 'window';
    case 'LINE': return 'window';
    case 'VECTOR': return 'svg';
    default: return null;
  }
}

/**
 * Detecta o tipo de componente para um nó, considerando:
 * 1. Prefixo UI_* (maior prioridade)
 * 2. Tipo de nó Figma (formas geométricas)
 * 3. Conteúdo (texto vira text, imagem vira image)
 */
function detectComponentTypeForNode(node: FigmaDocumentNode): ComponentMappedType | null {
  // 1. Tenta detectar pelo prefixo UI_* no nome
  const uiType = detectComponentType(node.name);
  if (uiType) return uiType;

  // 2. Se for nó de texto, vira text
  if (node.type === 'TEXT') return 'text';

  // 3. Se for forma geométrica, mapeia
  if (isShapeNode(node)) {
    const shapeType = mapShapeNodeType(node.type);
    if (shapeType) return shapeType;
  }

  // 4. Se for container, vira group
  if (isContainerNode(node)) return 'group';

  return null;
}

/**
 * Detecta se um nó deve ser ignorado (não renderizável)
 */
function shouldIgnoreNode(node: FigmaDocumentNode): boolean {
  // Ignora nós invisíveis
  if (node.visible === false) return true;

  // Ignora tipos não renderizáveis
  const ignoredTypes: FigmaNodeType[] = [
    'DOCUMENT', 'SLICE',
  ];
  if (ignoredTypes.includes(node.type)) return true;

  return false;
}

// ============================================================================
// DETECTOR PRINCIPAL — Percorre recursivamente todos os nós
// ============================================================================

export function detectComponents(
  node: FigmaDocumentNode,
  depth: number = 0,
  parentType?: string,
  parentZIndex: number = 0,
): DetectedComponent[] {
  const results: DetectedComponent[] = [];

  // Detecta o tipo de componente para este nó
  const componentType = detectComponentTypeForNode(node);

  // Ignora nós não renderizáveis, mas ainda processa filhos
  if (shouldIgnoreNode(node)) {
    // Se o nó deve ser ignorado mas tem filhos (ex: DOCUMENT), processa os filhos
    if (node.children) {
      for (const child of node.children) {
        const childResults = detectComponents(child, depth + 1, parentType, parentZIndex);
        results.push(...childResults);
      }
    }
    return results;
  }

  if (componentType) {
    const props: Record<string, string> = {};

    // Extrai propriedades do nome
    const nameProps = extractPropsFromName(node.name);
    Object.assign(props, nameProps);

    // Extrai texto do nome ou conteúdo do nó
    const textFromName = extractText(node.name);
    if (textFromName) {
      props.text = textFromName;
    } else if (node.characters) {
      props.text = node.characters;
    }

    // Extrai animação
    const anim = extractAnimation(node.name);
    if (anim) props.animation = anim;

    // Extrai tema
    const theme = extractTheme(node.name);
    if (theme) props.theme = theme;

    // Extrai ícone
    const icon = extractIcon(node.name);
    if (icon) props.icon = icon;

    // Extrai opções de dropdown
    const options = extractListOptions(node.name);
    if (options) props.options = options.join(',');

    // Propriedades do auto-layout
    if (node.layoutMode) {
      props.layout = node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical';
      if (node.itemSpacing) props.gap = String(node.itemSpacing);
    }

    // Detecta filhos recursivamente
    const children = detectChildComponents(node, depth + 1, componentType);

    const detected: DetectedComponent = {
      node,
      componentType,
      props,
      children,
      parentType,
      zIndex: parentZIndex + 1 + children.length,
    };

    results.push(detected);
  }

  // Se não for um componente detectado mas tem filhos, processa os filhos
  if (!componentType && node.children) {
    for (const child of node.children) {
      const childResults = detectComponents(child, depth + 1, parentType, parentZIndex);
      results.push(...childResults);
    }
  }

  return results;
}

/**
 * Detecta componentes filhos, considerando hierarquia e auto-layout
 */
function detectChildComponents(
  parentNode: FigmaDocumentNode,
  depth: number,
  parentComponentType: ComponentMappedType,
): DetectedComponent[] {
  if (!parentNode.children) return [];

  const children: DetectedComponent[] = [];
  let childZIndex = 0;

  for (const child of parentNode.children) {
    const childResults = detectComponents(child, depth, parentComponentType, childZIndex);
    
    for (const result of childResults) {
      // Ajusta posição relativa ao pai para auto-layout
      if (parentNode.layoutMode && parentNode.layoutMode !== 'NONE') {
        result.props._layoutChild = 'true';
      }
      children.push(result);
      childZIndex = result.zIndex;
    }
  }

  // Ordena por zIndex (ordem de renderização)
  children.sort((a, b) => a.zIndex - b.zIndex);

  return children;
}

// ============================================================================
// FIND MAIN WINDOW
// ============================================================================

export function findMainWindow(
  components: DetectedComponent[],
): DetectedComponent | undefined {
  // Primeiro tenta encontrar um UI_Window explícito
  const explicitWindow = components.find((c) => c.componentType === 'window' && c.node.name.startsWith('UI_Window'));
  if (explicitWindow) return explicitWindow;

  // Depois tenta encontrar o maior FRAME como janela
  const frames = components.filter((c) => c.componentType === 'window' && isContainerNode(c.node));
  if (frames.length > 0) {
    // Retorna o frame com a maior área
    frames.sort((a, b) => {
      const areaA = (a.node.absoluteBoundingBox?.width || 0) * (a.node.absoluteBoundingBox?.height || 0);
      const areaB = (b.node.absoluteBoundingBox?.width || 0) * (b.node.absoluteBoundingBox?.height || 0);
      return areaB - areaA;
    });
    return frames[0];
  }

  // Finalmente, retorna o primeiro canvas
  return components.find((c) => c.node.type === 'CANVAS');
}

// ============================================================================
// GROUP COMPONENTS BY WINDOW
// ============================================================================

export function groupComponentsByWindow(
  components: DetectedComponent[],
  windows: DetectedComponent[],
): Map<string, DetectedComponent[]> {
  const groups = new Map<string, DetectedComponent[]>();

  // Inicializa grupos para cada janela
  for (const win of windows) {
    groups.set(win.node.id, []);
  }

  // Adiciona um grupo padrão para componentes sem janela
  groups.set('__default__', []);

  // Distribui componentes para suas janelas
  for (const comp of components) {
    if (comp.componentType === 'window') continue;

    // Procura a janela pai mais próxima
    const parentWindow = findParentWindow(comp, windows);
    const groupKey = parentWindow?.node.id || '__default__';
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(comp);
  }

  return groups;
}

/**
 * Encontra a janela pai mais próxima para um componente
 */
function findParentWindow(
  component: DetectedComponent,
  windows: DetectedComponent[],
): DetectedComponent | undefined {
  // Verifica o parentType
  if (component.parentType === 'window') {
    // Procura a janela que contém este componente
    return windows.find((w) => {
      return containsComponent(w, component);
    });
  }
  return undefined;
}

/**
 * Verifica se uma janela contém um componente (baseado em bounding box)
 */
function containsComponent(window: DetectedComponent, component: DetectedComponent): boolean {
  const winBox = window.node.absoluteBoundingBox;
  const compBox = component.node.absoluteBoundingBox;

  if (!winBox || !compBox) return false;

  return (
    compBox.x >= winBox.x &&
    compBox.y >= winBox.y &&
    compBox.x + compBox.width <= winBox.x + winBox.width &&
    compBox.y + compBox.height <= winBox.y + winBox.height
  );
}

// ============================================================================
// FLATTEN — Achata componentes aninhados em uma lista plana
// ============================================================================

export function flattenComponents(detected: DetectedComponent[]): DetectedComponent[] {
  const flat: DetectedComponent[] = [];

  function walk(items: DetectedComponent[]) {
    for (const item of items) {
      flat.push(item);
      if (item.children.length > 0) {
        walk(item.children);
      }
    }
  }

  walk(detected);
  return flat;
}

// ============================================================================
// TOOLTIP DETECTION — Detecta tooltips baseado em posição relativa
// ============================================================================

export function detectTooltips(
  components: DetectedComponent[],
): { tooltip: DetectedComponent; target: DetectedComponent }[] {
  const pairs: { tooltip: DetectedComponent; target: DetectedComponent }[] = [];

  for (const comp of components) {
    if (comp.componentType !== 'tooltip') continue;

    // Procura o componente alvo mais próximo
    const box = comp.node.absoluteBoundingBox;
    if (!box) continue;

    let closestTarget: DetectedComponent | null = null;
    let closestDist = Infinity;

    for (const target of components) {
      if (target === comp) continue;
      if (!['button', 'input', 'text', 'image'].includes(target.componentType)) continue;

      const targetBox = target.node.absoluteBoundingBox;
      if (!targetBox) continue;

      const dist = Math.sqrt(
        Math.pow(box.x - targetBox.x, 2) + Math.pow(box.y - targetBox.y, 2)
      );

      if (dist < closestDist && dist < 200) {
        closestDist = dist;
        closestTarget = target;
      }
    }

    if (closestTarget) {
      pairs.push({ tooltip: comp, target: closestTarget });
    }
  }

  return pairs;
}