/**
 * Vortex Compiler — Validator
 * Valida o schema JSON contra regras de negócio além do schema JSON Schema
 */

import { VortexSchema, UIComponent, CompilerResult } from './types';

const VALID_THEME_TOKENS = [
  'primary', 'secondary', 'textPrimary', 'textSecondary', 'textMuted',
  'primaryText', 'primaryHover', 'primaryActive', 'secondaryHover',
  'border', 'borderFocus', 'borderError', 'background', 'surface',
  'surfaceAlt', 'overlay', 'inputBackground', 'inputPlaceholder',
  'shadow', 'success', 'warning', 'error', 'info',
];

export function validateSchema(schema: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema inválido: não é um objeto.');
    return { valid: false, errors, warnings };
  }

  if (schema.version !== '1.0') {
    warnings.push(`Versão do schema é "${schema.version}", esperado "1.0".`);
  }

  // Validar window
  if (!schema.window || !schema.window.type || schema.window.type !== 'window') {
    errors.push('Schema deve conter um objeto "window" com type="window".');
    return { valid: false, errors, warnings };
  }

  const win = schema.window;
  if (win.width && (typeof win.width !== 'number' || win.width <= 0)) {
    errors.push('window.width deve ser um número positivo.');
  }
  if (win.height && (typeof win.height !== 'number' || win.height <= 0)) {
    errors.push('window.height deve ser um número positivo.');
  }

  // Validar children
  if (schema.children) {
    if (!Array.isArray(schema.children)) {
      errors.push('"children" deve ser um array.');
      return { valid: false, errors, warnings };
    }

    for (let i = 0; i < schema.children.length; i++) {
      const child = schema.children[i];
      if (!child || !child.type) {
        errors.push(`Filho #${i + 1} não tem propriedade "type".`);
        continue;
      }

      validateComponent(child, i, errors, warnings);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateComponent(
  comp: any,
  index: number,
  errors: string[],
  warnings: string[]
): void {
  const prefix = `Filho #${index + 1} (${comp.type}):`;

  switch (comp.type) {
    case 'button':
      if (comp.width && (typeof comp.width !== 'number' || comp.width <= 0)) {
        errors.push(`${prefix} width inválido.`);
      }
      if (comp.height && (typeof comp.height !== 'number' || comp.height <= 0)) {
        errors.push(`${prefix} height inválido.`);
      }
      if (comp.theme && !['primary', 'secondary'].includes(comp.theme)) {
        warnings.push(`${prefix} theme "${comp.theme}" inválido. Use "primary" ou "secondary".`);
      }
      break;

    case 'input':
      if (comp.maxLength && (typeof comp.maxLength !== 'number' || comp.maxLength <= 0)) {
        errors.push(`${prefix} maxLength inválido.`);
      }
      break;

    case 'text':
      if (comp.color) {
        // Verifica se é um token de tema conhecido
        const isToken = typeof comp.color === 'string' && VALID_THEME_TOKENS.includes(comp.color);
        const isHex = typeof comp.color === 'string' && /^#[0-9A-Fa-f]{6,8}$/.test(comp.color);
        if (!isToken && !isHex) {
          warnings.push(`${prefix} color "${comp.color}" pode não ser um token de tema válido.`);
        }
      }
      break;

    case 'image':
    case 'svg':
      if (!comp.src || comp.src === '') {
        errors.push(`${prefix} src é obrigatório.`);
      }
      break;

    default:
      warnings.push(`${prefix} tipo desconhecido "${comp.type}".`);
  }
}