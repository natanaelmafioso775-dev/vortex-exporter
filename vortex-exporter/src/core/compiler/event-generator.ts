/**
 * Generates global event handlers for resource start/stop
 */
export function generateEventCode(panelName: string): string {
  const lowerName = panelName.toLowerCase();
  const escapedName = escapeLuaString(panelName);
  const escapedLower = escapeLuaString(lowerName);
  
  return `-- Resource event handlers
addEventHandler("onClientResourceStart", resourceRoot, function()
    outputChatBox("[${escapedName}] Panel loaded successfully!", 0, 170, 255)
end)

addEventHandler("onClientResourceStop", resourceRoot, function()
    -- Cleanup
    isOpen = false
end)

-- Toggle panel visibility with a command
addCommandHandler("${escapedLower}", function()
    isOpen = not isOpen
    showCursor(isOpen, true)
    guiSetInputEnabled(isOpen)
    
    if isOpen then
        outputChatBox("[${escapedName}] Panel opened", 0, 170, 255)
    else
        activeInput = nil
        outputChatBox("[${escapedName}] Panel closed", 255, 100, 100)
    end
end)
`;
}

/**
 * Generates a custom event declaration block
 */
export function generateCustomEvents(events: string[]): string {
  if (events.length === 0) return '';

  const lines: string[] = ['-- Custom events'];
  for (const event of events) {
    lines.push(`addEvent("${event}", true)`);
  }
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