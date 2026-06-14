import { VoxelProject, VoxelComponent, VoxelButton, VoxelInput, VoxelText, VoxelImage, VoxelSvg } from '../types/internal';
import { COMPONENT_RULES, getRuleByType } from '../types/components';
import { ValidationError, logger } from '../../shared';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  componentId?: string;
}

/**
 * Main validator for the VoxelProject (Intermediate Representation)
 */
export function validateProject(project: VoxelProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  logger.info(`Validating project: ${project.meta.name}`);

  // Validate project metadata
  if (!project.meta.name) {
    issues.push({ type: 'error', message: 'Project name is missing' });
  }
  // Source file key só é obrigatório em exportações Figma (não em JSON import)
  if (project.meta.sourceFile && !project.meta.sourceFile.startsWith('http') && project.meta.sourceFile.length > 0) {
    if (!/^[a-zA-Z0-9_-]+$/.test(project.meta.sourceFile)) {
      issues.push({ type: 'warning', message: 'Source file key looks invalid' });
    }
  }
  // Export timestamp é opcional

  // Validate window
  validateWindow(project, issues);

  // Validate each component
  const seenIds = new Set<string>();
  for (const component of project.components) {
    validateComponent(component, issues, seenIds);
  }

  // Validate theme
  validateTheme(project, issues);

  // Log results
  const errors = issues.filter((i) => i.type === 'error').length;
  const warnings = issues.filter((i) => i.type === 'warning').length;

  if (errors > 0) {
    logger.warn(`Validation complete: ${errors} error(s), ${warnings} warning(s)`);
  } else {
    logger.info(`Validation complete: ${errors} error(s), ${warnings} warning(s)`);
  }

  return issues;
}

function validateWindow(project: VoxelProject, issues: ValidationIssue[]): void {
  const win = project.window;

  if (win.width <= 0 || win.height <= 0) {
    issues.push({
      type: 'error',
      message: `Window has invalid dimensions: ${win.width}x${win.height}`,
    });
  }

  if (win.width > 3840 || win.height > 2160) {
    issues.push({
      type: 'warning',
      message: `Window dimensions seem too large: ${win.width}x${win.height}`,
    });
  }

  if (!win.title) {
    issues.push({
      type: 'warning',
      message: 'Window has no title',
    });
  }
}

function validateComponent(
  component: VoxelComponent,
  issues: ValidationIssue[],
  seenIds: Set<string>
): void {
  const id = component.id;

  // Check for duplicate IDs
  if (seenIds.has(id)) {
    issues.push({
      type: 'error',
      message: `Duplicate component ID: ${id}`,
      componentId: id,
    });
  }
  seenIds.add(id);

  // Validate component type
  const mappedType = componentTypeToMapped(component.type) as any;
  const rule = mappedType ? getRuleByType(mappedType) : undefined;
  if (!rule) {
    issues.push({
      type: 'error',
      message: `Unknown component type: ${component.type}`,
      componentId: id,
    });
    return;
  }

  // Validate dimensions
  if (component.width <= 0) {
    issues.push({
      type: 'error',
      message: `Component "${id}" has width <= 0 (${component.width})`,
      componentId: id,
    });
  }
  if (component.height <= 0) {
    issues.push({
      type: 'error',
      message: `Component "${id}" has height <= 0 (${component.height})`,
      componentId: id,
    });
  }

  // Validate zIndex
  if (component.zIndex < 0) {
    issues.push({
      type: 'warning',
      message: `Component "${id}" has negative zIndex (${component.zIndex})`,
      componentId: id,
    });
  }

  // Component-specific validation
  switch (component.type) {
    case 'button':
      validateButton(component as VoxelButton, issues);
      break;
    case 'input':
      validateInput(component as VoxelInput, issues);
      break;
    case 'text':
      validateText(component as VoxelText, issues);
      break;
    case 'image':
      validateImage(component as VoxelImage, issues);
      break;
    case 'svg':
      validateSvg(component as VoxelSvg, issues);
      break;
  }
}

function validateButton(btn: VoxelButton, issues: ValidationIssue[]): void {
  if (!btn.text || btn.text.trim().length === 0) {
    issues.push({
      type: 'warning',
      message: `Button "${btn.id}" has no text`,
      componentId: btn.id,
    });
  }

  if (btn.fontSize && (btn.fontSize < 8 || btn.fontSize > 72)) {
    issues.push({
      type: 'warning',
      message: `Button "${btn.id}" has unusual fontSize: ${btn.fontSize}`,
      componentId: btn.id,
    });
  }

  // Validate onClick references a valid event name
  if (btn.onClick && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(btn.onClick)) {
    issues.push({
      type: 'warning',
      message: `Button "${btn.id}" has invalid onClick event name: "${btn.onClick}"`,
      componentId: btn.id,
    });
  }
}

function validateInput(input: VoxelInput, issues: ValidationIssue[]): void {
  if (input.maxLength < 1 || input.maxLength > 1024) {
    issues.push({
      type: 'warning',
      message: `Input "${input.id}" has invalid maxLength: ${input.maxLength}`,
      componentId: input.id,
    });
  }

  if (!input.placeholder && input.defaultValue.length === 0) {
    issues.push({
      type: 'warning',
      message: `Input "${input.id}" has no placeholder and no default value`,
      componentId: input.id,
    });
  }
}

function validateText(text: VoxelText, issues: ValidationIssue[]): void {
  if (!text.text || text.text.trim().length === 0) {
    issues.push({
      type: 'warning',
      message: `Text component "${text.id}" has no content`,
      componentId: text.id,
    });
  }

  if (text.fontSize < 1 || text.fontSize > 200) {
    issues.push({
      type: 'warning',
      message: `Text "${text.id}" has unusual fontSize: ${text.fontSize}`,
      componentId: text.id,
    });
  }
}

function validateImage(img: VoxelImage, issues: ValidationIssue[]): void {
  if (!img.src) {
    issues.push({
      type: 'error',
      message: `Image "${img.id}" has no source path`,
      componentId: img.id,
    });
  }
}

function validateSvg(svg: VoxelSvg, issues: ValidationIssue[]): void {
  if (!svg.svgContent && !svg.assetPath) {
    issues.push({
      type: 'warning',
      message: `SVG "${svg.id}" has no content and no asset path`,
      componentId: svg.id,
    });
  }
}

function componentTypeToMapped(type: string): string | null {
  const map: Record<string, string> = {
    'rectangle': 'window', 'ellipse': 'window', 'triangle': 'window',
    'polygon': 'window', 'star': 'window', 'line': 'window', 'vector': 'svg',
    'button': 'button', 'input': 'input', 'text': 'text', 'image': 'image',
    'svg': 'svg', 'dropdown': 'dropdown', 'checkbox': 'checkbox',
    'radio': 'radio', 'switch': 'switch', 'slider': 'slider',
    'progress': 'progress', 'tabs': 'tabs', 'tooltip': 'tooltip',
    'scrollview': 'scrollview', 'group': 'group',
  };
  return map[type] || null;
}

// Shared validation utilities

function validateTheme(project: VoxelProject, issues: ValidationIssue[]): void {
  const colors = project.theme?.colors;
  if (!colors || Object.keys(colors).length === 0) {
    issues.push({
      type: 'warning',
      message: 'No theme colors defined - using defaults',
    });
    return;
  }

  for (const [name, color] of Object.entries(colors)) {
    if (typeof color.r !== 'number' || typeof color.g !== 'number' ||
        typeof color.b !== 'number' || typeof color.a !== 'number') {
      issues.push({
        type: 'error',
        message: `Theme color "${name}" has invalid values: r=${color.r}, g=${color.g}, b=${color.b}, a=${color.a}`,
      });
    }
  }
}