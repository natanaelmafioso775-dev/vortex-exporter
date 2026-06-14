import { VoxelSvg } from '../types/internal';

/**
 * Generates SVG rendering code for MTA DX panels
 */
export function generateSvgCode(svgs: VoxelSvg[]): string {
  const lines: string[] = [];

  if (svgs.length === 0) return '';

  lines.push('-- SVG Components');
  lines.push('local svgElements = {}');
  lines.push('');

  for (const svg of svgs) {
    const varName = `svg_${svg.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    if (svg.svgContent) {
      // Inline SVG content - need to create SVG element
      lines.push(`-- SVG: ${svg.assetPath || 'inline'}`);
      lines.push(`svgElements["${svg.id}"] = svgCreate(${Math.round(svg.width)}, ${Math.round(svg.height)}, [[`);
      lines.push(svg.svgContent);
      lines.push(`]])`);
      lines.push('');
    } else if (svg.assetPath) {
      // SVG from file - load at runtime
      lines.push(`-- SVG from file: ${svg.assetPath}`);
      lines.push(`-- Loaded via dxDrawImage in render`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generates the SVG resource cleanup code
 */
export function generateSvgCleanupCode(svgs: VoxelSvg[]): string {
  if (svgs.length === 0) return '';

  const lines: string[] = [];
  lines.push('-- SVG cleanup');
  lines.push('addEventHandler("onClientResourceStop", resourceRoot, function()');
  
  for (const svg of svgs) {
    if (svg.svgContent) {
      lines.push(`    if svgElements["${svg.id}"] then`);
      lines.push(`        destroyElement(svgElements["${svg.id}"])`);
      lines.push(`    end`);
    }
  }

  lines.push('end)');
  lines.push('');

  return lines.join('\n');
}