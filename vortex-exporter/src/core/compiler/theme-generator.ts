import { ThemeConfig, ThemeColor } from '../types/internal';

/**
 * Generates the Lua theme table from the project's theme configuration
 */
export function generateThemeCode(theme: ThemeConfig): string {
  const lines: string[] = [];
  const colors = theme.colors;

  lines.push('-- Theme Configuration');
  lines.push('local theme = {}');

  for (const [name, color] of Object.entries(colors)) {
    lines.push(
      `theme.${name} = tocolor(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    );
  }

  lines.push(''); // empty line after theme
  return lines.join('\n');
}

/**
 * Generate code to get a theme color by name with fallback
 */
export function getThemeColorCode(token: string, fallbackToken: string = 'primary'): string {
  return `theme.${token} or theme.${fallbackToken}`;
}