/**
 * Lua code formatter - organizes the generated Lua code with consistent
 * indentation, spacing, and section headers.
 */
export function formatLuaCode(rawCode: string): string {
  const lines = rawCode.split('\n');
  const formatted: string[] = [];
  let inLongBracket = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Preserve long bracket strings ([[ ... ]])
    if (line.includes('[[') && !line.includes(']]')) {
      inLongBracket = true;
    }
    if (inLongBracket) {
      formatted.push(line);
      if (line.includes(']]')) {
        inLongBracket = false;
      }
      continue;
    }

    // Trim trailing whitespace
    line = line.replace(/\s+$/, '');

    // Ensure single space after commas in function args
    line = line.replace(/,\s*/g, ', ');

    // Ensure consistent spacing around operators (basic)
    // This is simplified to avoid breaking Lua patterns

    // Fix multiple blank lines - reduce to max 1 blank line
    if (line === '' && formatted.length > 0 && formatted[formatted.length - 1] === '') {
      continue;
    }

    formatted.push(line);
  }

  // Remove trailing blank lines at the end
  while (formatted.length > 0 && formatted[formatted.length - 1] === '') {
    formatted.pop();
  }

  return formatted.join('\n') + '\n';
}

/**
 * Indent a block of code
 */
export function indentBlock(code: string, level: number = 1): string {
  const indent = '    '.repeat(level);
  return code
    .split('\n')
    .map((line) => (line.trim() ? indent + line : line))
    .join('\n');
}

/**
 * Wrap code in a function declaration
 */
export function wrapInFunction(code: string, name: string, params: string = ''): string {
  return [
    `function ${name}(${params})`,
    indentBlock(code),
    'end',
    '',
  ].join('\n');
}

/**
 * Clean up empty function bodies
 */
export function removeEmptyFunctions(code: string): string {
  // Remove functions with no body
  return code.replace(/function\s+\w+\(.*?\)\s*\n\s*end\n/g, '');
}

/**
 * Add section comment blocks
 */
export function addSectionComment(name: string): string {
  const line = `-- ${'='.repeat(60)}`;
  return `${line}\n-- ${name}\n${line}\n`;
}