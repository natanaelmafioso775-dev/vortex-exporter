import { VoxelButton } from '../types/internal';

/**
 * Generates the state management and event handling for buttons
 */
export function generateButtonCode(buttons: VoxelButton[]): string {
  const lines: string[] = [];

  if (buttons.length === 0) return '';

  lines.push('-- Button click handling');
  lines.push('addEventHandler("onClientClick", root, function(button, state, absoluteX, absoluteY)');
  lines.push('    if not isOpen then return end');
  lines.push('    if button ~= "left" or state ~= "down" then return end');
  lines.push('');

  for (const btn of buttons) {
    const varName = `btn_${btn.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`    -- Button: ${escapeLuaString(btn.text)}`);
    lines.push(`    if isMouseInPosition(winX + ${Math.round(btn.x)}, winY + ${Math.round(btn.y)}, ${Math.round(btn.width)}, ${Math.round(btn.height)}) then`);
    
    if (btn.onClick) {
      // Custom event handler
      lines.push(`        triggerEvent("${btn.onClick}", localPlayer, resourceRoot)`);
    } else {
      // Default handler - output a generic message that user can customize
      lines.push(`        outputChatBox("Button clicked: ${escapeLuaString(btn.text)}")`);
    }
    
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