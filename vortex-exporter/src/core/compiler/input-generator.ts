import { VoxelInput } from '../types/internal';

/**
 * Generates the input handling code for text inputs
 */
export function generateInputCode(inputs: VoxelInput[]): string {
  const lines: string[] = [];

  if (inputs.length === 0) return '';

  // Generate state variables for each input
  for (const input of inputs) {
    const varName = `input_${input.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`-- Input state: ${escapeLuaString(input.placeholder)}`);
    lines.push(`local ${varName}_value = "${escapeLuaString(input.defaultValue)}"`);
    lines.push('');
  }

  // Click to focus
  lines.push('-- Input focus on click');
  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen or button ~= "left" or state ~= "down" then return end');
  lines.push('    ');
  
  for (const input of inputs) {
    const varName = `input_${input.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`    if isMouseInPosition(winX + ${Math.round(input.x)}, winY + ${Math.round(input.y)}, ${Math.round(input.width)}, ${Math.round(input.height)}) then`);
    lines.push(`        activeInput = "${input.id}"`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');
  }

  // Click outside clears focus
  lines.push('    -- Click outside clears focus');
  lines.push('    activeInput = nil');
  lines.push('end)');
  lines.push('');

  // Character input
  lines.push('-- Character input handler');
  lines.push('addEventHandler("onClientCharacter", root, function(char)');
  lines.push('    if not isOpen then return end');
  lines.push('');

  for (const input of inputs) {
    const varName = `input_${input.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`    if activeInput == "${input.id}" then`);
    lines.push(`        if string.len(${varName}_value) < ${input.maxLength} then`);
    lines.push(`            ${varName}_value = ${varName}_value .. char`);
    lines.push(`        end`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');

  // Backspace handling
  lines.push('-- Backspace handler for inputs');
  lines.push('addEventHandler("onClientKey", root, function(button, press)');
  lines.push('    if not isOpen or not press then return end');
  lines.push('    ');

  for (const input of inputs) {
    const varName = `input_${input.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`    if activeInput == "${input.id}" then`);
    lines.push(`        if button == "backspace" then`);
    lines.push(`            ${varName}_value = string.sub(${varName}_value, 1, -2)`);
    lines.push(`        end`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');

  return lines.join('\n');
}

function escapeLuaString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}