/// <reference types="@figma/plugin-typings" />

/**
 * Vortex UI Exporter — Component Detector v2.0
 * Usa COMPONENT_MAP para detectar componentes por prefixo
 */
import { COMPONENT_MAP } from './types';

/**
 * Extrai o tipo de componente a partir do nome do nó
 * Suporta match por nome exato ou prefixo
 */
export function getComponentType(name: string): string | null {
  for (const [prefix, type] of Object.entries(COMPONENT_MAP)) {
    if (name === prefix || name.startsWith(prefix + '_') || name.startsWith(prefix + '(')) {
      return type;
    }
  }
  return null;
}

/**
 * Verifica se um nó é uma Window (UI_Window)
 */
export function isWindow(node: SceneNode): boolean {
  return node.name.startsWith('UI_Window');
}