/// <reference types="@figma/plugin-typings" />

/**
 * Vortex UI Exporter — Component Detector
 * Detecta nós do Figma que correspondem a componentes UI_*
 * Lê nome, propriedades e hierarquia
 */
import { COMPONENT_PREFIX, COMPONENT_MAP, UIComponent } from './types';

/**
 * Verifica se o nome do nó indica um componente UI
 */
export function isUIComponent(name: string): boolean {
  return name.startsWith(COMPONENT_PREFIX) && name in COMPONENT_MAP;
}

/**
 * Extrai o tipo de componente a partir do nome do nó
 */
export function getComponentType(name: string): string | null {
  for (const [prefix, type] of Object.entries(COMPONENT_MAP)) {
    if (name === prefix || name.startsWith(prefix + '_')) {
      return type;
    }
  }
  return null;
}

/**
 * Extrai propriedades do nome do componente Figma (UI_Button, UI_Input_Password, etc.)
 * e das propriedades de componente Figma (Variants, Component Properties)
 */
export function extractProperties(node: SceneNode, componentType: string): Record<string, any> {
  const props: Record<string, any> = {};
  const name = node.name;

  // Detecta propriedades especiais pelo nome
  // Ex: UI_Button_Disabled → disabled=true
  const nameParts = name.split('_');
  
  if (componentType === 'input') {
    // UI_Input_Password → password=true
    if (nameParts.includes('Password')) {
      props.password = true;
    }
    // UI_Input_Email → placeholder="Email"
    if (nameParts.includes('Email')) {
      props.placeholder = 'Email';
    }
  }

  if (componentType === 'button') {
    if (nameParts.includes('Disabled')) {
      props.disabled = true;
    }
    if (nameParts.includes('Secondary')) {
      props.theme = 'secondary';
    }
  }

  // Tenta ler propriedades de Variants do Figma
  if ('variantProperties' in node && node.variantProperties) {
    const variants = node.variantProperties as Record<string, string>;
    if (variants['State']) {
      // Pode mapear estados para props
    }
    if (variants['Theme'] && componentType === 'button') {
      props.theme = variants['Theme'].toLowerCase();
    }
    if (variants['Disabled'] && componentType === 'button') {
      props.disabled = variants['Disabled'] === 'true';
    }
  }

  // Tenta ler Component Properties do Figma (novo sistema)
  if ('componentPropertyDefinitions' in node) {
    const defs = (node as any).componentPropertyDefinitions as Record<string, any>;
    if (defs) {
      for (const [key, def] of Object.entries(defs)) {
        if (def.type === 'TEXT' && componentType === 'text') {
          props.text = def.defaultValue || props.text;
        }
        if (def.type === 'BOOLEAN' && key === 'disabled') {
          props.disabled = def.defaultValue;
        }
      }
    }
  }

  return props;
}

/**
 * Verifica se um nó é uma Window (UI_Window)
 */
export function isWindow(node: SceneNode): boolean {
  return node.name.startsWith('UI_Window');
}

/**
 * Detecta todos os componentes UI na seleção atual
 * Retorna window node e array de children
 */
export function detectComponents(selection: readonly SceneNode[]): {
  windowNode: SceneNode | null;
  children: SceneNode[];
  errors: string[];
} {
  const errors: string[] = [];
  let windowNode: SceneNode | null = null;
  const children: SceneNode[] = [];

  for (const node of selection) {
    const componentType = getComponentType(node.name);

    if (!componentType) {
      // Não é um componente UI → ignora
      continue;
    }

    if (componentType === 'window') {
      if (windowNode) {
        errors.push('Múltiplas janelas detectadas. Apenas uma UI_Window é permitida.');
      }
      windowNode = node;
    } else {
      children.push(node);
    }
  }

  if (!windowNode) {
    errors.push('Nenhuma UI_Window encontrada na seleção.');
  }

  return { windowNode, children, errors };
}