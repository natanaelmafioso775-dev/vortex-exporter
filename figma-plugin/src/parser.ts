/// <reference types="@figma/plugin-typings" />

/**
 * Vortex UI Exporter — Parser
 * Converte nós do Figma para o schema Vortex JSON
 */
import {
  COMPONENT_MAP,
  VortexSchema,
  WindowComponent,
  UIComponent,
  ParseResult,
} from './types';
import { getComponentType, extractProperties } from './component-detector';

/**
 * Converte um SceneNode do Figma em um componente Vortex
 */
function parseNode(node: SceneNode): UIComponent | null {
  const componentType = getComponentType(node.name);
  if (!componentType || componentType === 'window') return null;

  const props = extractProperties(node, componentType);

  // Lê dimensões do nó
  const width = Math.round(node.width);
  const height = Math.round(node.height);

  // Lê texto (se for TextNode)
  let text: string | undefined;
  if (node.type === 'TEXT') {
    text = (node as TextNode).characters;
  }

  // Constrói o componente baseado no tipo
  switch (componentType) {
    case 'button': {
      return {
        type: 'button',
        id: node.id,
        text: text || props.text || node.name.replace(/^UI_Button_?/, '') || 'Button',
        width: props.width || width,
        height: props.height || height,
        theme: props.theme || 'primary',
        disabled: props.disabled || false,
      };
    }
    case 'input': {
      return {
        type: 'input',
        id: node.id,
        placeholder: props.placeholder || text || 'Input',
        password: props.password || false,
        maxLength: props.maxLength || 64,
        width: props.width || width,
        height: props.height || height,
      };
    }
    case 'text': {
      return {
        type: 'text',
        id: node.id,
        text: text || props.text || '',
        color: props.color || 'textPrimary',
        scale: props.scale || 1,
        alignX: props.alignX || 'left',
        alignY: props.alignY || 'center',
        font: props.font || 'default',
        wordBreak: props.wordBreak || false,
      };
    }
    case 'image': {
      return {
        type: 'image',
        id: node.id,
        src: props.src || '',
        width: props.width || width,
        height: props.height || height,
        fitMode: props.fitMode || 'fill',
      };
    }
    case 'svg': {
      return {
        type: 'svg',
        id: node.id,
        src: props.src || '',
        width: props.width || width,
        height: props.height || height,
        color: props.color || 'white',
      };
    }
    default:
      return null;
  }
}

/**
 * Converte o nó Window do Figma para WindowComponent
 */
function parseWindow(node: SceneNode): WindowComponent {
  const props = extractProperties(node, 'window');

  return {
    type: 'window',
    title: props.title || node.name.replace(/^UI_Window_?/, '') || 'Window',
    width: props.width || Math.round(node.width),
    height: props.height || Math.round(node.height),
    anchor: props.anchor || 'center',
    closable: props.closable !== false,
    draggable: props.draggable !== false,
    animation: props.animation || { enter: 'fadeIn', duration: 300 },
  };
}

/**
 * Parser principal: recebe seleção do Figma e retorna schema Vortex
 */
export function parseSelection(
  selection: readonly SceneNode[],
  metadata?: { name?: string; author?: string; theme?: 'dark' | 'light' }
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let windowNode: SceneNode | null = null;
  const childrenNodes: SceneNode[] = [];

  // Classifica nós
  for (const node of selection) {
    const componentType = getComponentType(node.name);

    if (!componentType) {
      // Procura recursivamente em children do nó
      if ('children' in node) {
        const frame = node as FrameNode;
        for (const child of frame.children) {
          const childType = getComponentType(child.name);
          if (childType === 'window') {
            if (windowNode) {
              warnings.push('Múltiplas UI_Window encontradas. Usando a primeira.');
            } else {
              windowNode = child;
            }
          } else if (childType && childType !== 'window') {
            childrenNodes.push(child);
          }
        }
      }
      continue;
    }

    if (componentType === 'window') {
      if (windowNode) {
        warnings.push('Múltiplas UI_Window encontradas. Usando a primeira.');
      } else {
        windowNode = node;
      }
    } else {
      childrenNodes.push(node);
    }
  }

  if (!windowNode) {
    errors.push('Nenhuma UI_Window encontrada. Selecione um frame com nome "UI_Window".');
    return {
      schema: {
        version: '1.0',
        window: { type: 'window', title: 'Untitled', width: 600, height: 400, anchor: 'center' },
        children: [],
      },
      errors,
      warnings,
    };
  }

  const window = parseWindow(windowNode);
  const children: UIComponent[] = [];

  for (const childNode of childrenNodes) {
    const component = parseNode(childNode);
    if (component) {
      children.push(component);
    } else {
      warnings.push(`Nó "${childNode.name}" não pôde ser convertido.`);
    }
  }

  const schema: VortexSchema = {
    version: '1.0',
    metadata: {
      name: metadata?.name || windowNode.name.replace(/^UI_Window_?/, 'LoginPanel'),
      author: metadata?.author || 'Vortex RP',
      theme: metadata?.theme || 'dark',
    },
    window,
    children,
  };

  return { schema, errors, warnings };
}