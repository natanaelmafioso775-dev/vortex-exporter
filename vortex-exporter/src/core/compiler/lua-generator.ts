// ============================================================================
// Lua Generator — Compilador principal (orquestrador)
// Converte VoxelProject → Código Lua MTA:SA completo
// ============================================================================

import {
  VoxelProject, VoxelComponent, VoxelButton, VoxelInput, VoxelDropdown,
  VoxelCheckbox, VoxelRadio, VoxelSwitch, VoxelSlider, VoxelProgress,
  VoxelTabs, VoxelTooltip,
} from '../types/internal';
import { generateThemeCode } from './theme-generator';
import { generateRenderCode, generateHitTestCode, generateScreenVars } from './render-generator';
import { generateButtonCode } from './button-generator';
import { generateInputCode } from './input-generator';
import { generateAnimationCode, generateHoverAnimationCode } from './animation-generator';
import { generateSvgCode, generateSvgCleanupCode } from './svg-generator';
import { generateEventCode, generateCustomEvents } from './event-generator';
import { logger } from '../../shared/logger';

export interface CompileResult {
  code: string;
  lineCount: number;
  warnings: string[];
}

// ============================================================================
// COMPILADOR PRINCIPAL
// ============================================================================

export function compileToLua(project: VoxelProject): CompileResult {
  logger.info(`[Compiler] Compiling project: ${project.meta.name}`);

  const panelName = normalizePanelName(project.meta.name);
  const warnings: string[] = [];
  const sections: string[] = [];

  // === 1. HEADER ===
  sections.push(generateHeader(panelName, project.meta.sourceFile));

  // === 2. SCREEN VARS ===
  sections.push(generateScreenVars());

  // === 3. STATE VARIABLES ===
  sections.push(generateStateVariables(project));

  // === 4. COMPONENT STATES (dropdown, checkbox, radio, switch, slider, progress, tabs, tooltip) ===
  sections.push(generateAllComponentStates(project));

  // === 5. THEME ===
  sections.push(generateThemeCode(project.theme));

  // === 6. HIT TEST ===
  sections.push(generateHitTestCode());

  // === 7. SVG ELEMENTS ===
  const svgCode = generateSvgCode(project.components.filter((c) => c.type === 'svg') as any);
  if (svgCode) sections.push(svgCode);

  // === 8. INPUT STATE ===
  const inputCode = generateInputCode(project.components.filter((c) => c.type === 'input') as VoxelInput[]);
  if (inputCode) sections.push(inputCode);

  // === 9. ANIMATION SYSTEM ===
  const animCode = generateAnimationCode(project.components);
  if (animCode) sections.push(animCode);

  const hoverAnimCode = generateHoverAnimationCode();
  if (hoverAnimCode) sections.push(hoverAnimCode);

  // === 10. RENDER (main onClientRender) ===
  const renderCode = generateRenderCode(panelName, project.window, project.components);
  sections.push(renderCode);

  // === 11. BUTTON EVENTS ===
  const buttonCode = generateButtonCode(project.components.filter((c) => c.type === 'button') as VoxelButton[]);
  if (buttonCode) sections.push(buttonCode);

  // === 12. DROPDOWN EVENTS ===
  const dropdownCode = generateDropdownEvents(project.components.filter((c) => c.type === 'dropdown') as VoxelDropdown[]);
  if (dropdownCode) sections.push(dropdownCode);

  // === 13. CHECKBOX EVENTS ===
  const checkboxCode = generateCheckboxEvents(project.components.filter((c) => c.type === 'checkbox') as VoxelCheckbox[]);
  if (checkboxCode) sections.push(checkboxCode);

  // === 14. RADIO EVENTS ===
  const radioCode = generateRadioEvents(project.components.filter((c) => c.type === 'radio') as VoxelRadio[]);
  if (radioCode) sections.push(radioCode);

  // === 15. SWITCH EVENTS ===
  const switchCode = generateSwitchEvents(project.components.filter((c) => c.type === 'switch') as VoxelSwitch[]);
  if (switchCode) sections.push(switchCode);

  // === 16. SLIDER EVENTS ===
  const sliderCode = generateSliderEvents(project.components.filter((c) => c.type === 'slider') as VoxelSlider[]);
  if (sliderCode) sections.push(sliderCode);

  // === 17. TABS EVENTS ===
  const tabsCode = generateTabsEvents(project.components.filter((c) => c.type === 'tabs') as VoxelTabs[]);
  if (tabsCode) sections.push(tabsCode);

  // === 18. TOOLTIP EVENTS ===
  const tooltipCode = generateTooltipEvents(project.components.filter((c) => c.type === 'tooltip') as VoxelTooltip[]);
  if (tooltipCode) sections.push(tooltipCode);

  // === 19. CUSTOM EVENTS ===
  const customEvents = extractCustomEventNames(project);
  if (customEvents.length > 0) {
    sections.push(generateCustomEvents(customEvents));
  }

  // === 20. RESOURCE EVENTS ===
  sections.push(generateEventCode(panelName));

  // === 21. SVG CLEANUP ===
  const svgCleanup = generateSvgCleanupCode(project.components.filter((c) => c.type === 'svg') as any);
  if (svgCleanup) sections.push(svgCleanup);

  // === 22. ASSET COMMENTS ===
  if (project.assets.length > 0) {
    sections.push(generateAssetComments(project));
  }
  if (project.fonts.length > 0) {
    sections.push(generateFontComments(project));
  }

  // Combine all sections
  const finalCode = sections.join('\n');
  const lineCount = finalCode.split('\n').length;

  logger.info(`[Compiler] Complete: ${lineCount} lines, ${project.components.length} components`);

  return { code: finalCode, lineCount, warnings };
}

// ============================================================================
// HEADER
// ============================================================================

function generateHeader(panelName: string, sourceFile: string): string {
  return `--[[
  Generated by Vortex Exporter v2.0.0 — Full Figma Support
  Source: ${sourceFile}
  Panel: ${panelName}
  Date: ${new Date().toISOString()}
  
  Features: Shapes, Gradients, Glow/Neon, Auto-Layout,
  Premium Animations (Spring, Bounce, Elastic), 
  Dropdowns, Checkboxes, Radios, Switches,
  Sliders, Progress Bars, Tabs, Tooltips,
  Rich Text, Custom Fonts, Design Tokens
  
  Do NOT edit manually. Edit the Figma file and re-export.
]]--
`;
}

// ============================================================================
// STATE VARIABLES
// ============================================================================

function generateStateVariables(project: VoxelProject): string {
  const lines: string[] = [];

  lines.push('--============================================================================');
  lines.push('-- Panel State Variables');
  lines.push('--============================================================================');
  lines.push('');
  lines.push('local isOpen = true');
  lines.push('local activeInput = nil');

  // Drag state
  if (project.window.movable !== false) {
    lines.push('');
    lines.push('-- Window dragging');
    lines.push('local isDragging = false');
    lines.push('local dragOffsetX = 0');
    lines.push('local dragOffsetY = 0');
    lines.push('local winX, winY = 0, 0');
  }

  // Scroll states
  const scrollViews = project.components.filter((c) => c.type === 'scrollview');
  if (scrollViews.length > 0) {
    lines.push('');
    lines.push('-- Scroll states');
    for (const sv of scrollViews) {
      lines.push(`local scrollStates_${sv.id} = { x = 0, y = 0 }`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// COMPONENT STATES — Inicializa estados de todos os componentes interativos
// ============================================================================

function generateAllComponentStates(project: VoxelProject): string {
  const lines: string[] = [];

  const dropdowns = project.components.filter((c) => c.type === 'dropdown') as VoxelDropdown[];
  const checkboxes = project.components.filter((c) => c.type === 'checkbox') as VoxelCheckbox[];
  const radios = project.components.filter((c) => c.type === 'radio') as VoxelRadio[];
  const switches = project.components.filter((c) => c.type === 'switch') as VoxelSwitch[];
  const sliders = project.components.filter((c) => c.type === 'slider') as VoxelSlider[];
  const progresses = project.components.filter((c) => c.type === 'progress') as VoxelProgress[];
  const tabs = project.components.filter((c) => c.type === 'tabs') as VoxelTabs[];
  const tooltips = project.components.filter((c) => c.type === 'tooltip') as VoxelTooltip[];

  const total = dropdowns.length + checkboxes.length + radios.length + switches.length +
    sliders.length + progresses.length + tabs.length + tooltips.length;
  if (total === 0) return '';

  lines.push('--============================================================================');
  lines.push('-- Interactive Component States');
  lines.push('--============================================================================');
  lines.push('');

  // Dropdown states
  if (dropdowns.length > 0) {
    lines.push('-- Dropdown states');
    lines.push('local dropdownStates = {}');
    lines.push('local dropdownSelections = {}');
    for (const dd of dropdowns) {
      lines.push(`dropdownStates["${dd.id}"] = false`);
      lines.push(`dropdownSelections["${dd.id}"] = ${Math.max(1, dd.selectedIndex + 1)}`);
      lines.push(`local dd_${dd.id}_options = { ${dd.options.map((o) => `"${escapeLuaString(o)}"`).join(', ')} }`);
    }
    lines.push('');
  }

  // Checkbox states
  if (checkboxes.length > 0) {
    lines.push('-- Checkbox states');
    lines.push('local checkboxStates = {}');
    for (const cb of checkboxes) {
      lines.push(`checkboxStates["${cb.id}"] = ${cb.checked ? 'true' : 'false'}`);
    }
    lines.push('');
  }

  // Radio states
  if (radios.length > 0) {
    lines.push('-- Radio states');
    lines.push('local radioStates = {}');
    // Group radios by groupName — only one selected per group
    const groups = new Map<string, VoxelRadio[]>();
    for (const radio of radios) {
      const g = groups.get(radio.groupName) || [];
      g.push(radio);
      groups.set(radio.groupName, g);
    }
    for (const [groupName, groupRadios] of groups) {
      for (const radio of groupRadios) {
        lines.push(`radioStates["${radio.id}"] = ${radio.selected ? 'true' : 'false'}`);
      }
    }
    lines.push('');
  }

  // Switch states
  if (switches.length > 0) {
    lines.push('-- Switch states');
    lines.push('local switchStates = {}');
    for (const sw of switches) {
      lines.push(`switchStates["${sw.id}"] = ${sw.checked ? 'true' : 'false'}`);
    }
    lines.push('');
  }

  // Slider states
  if (sliders.length > 0) {
    lines.push('-- Slider states');
    lines.push('local sliderStates = {}');
    for (const sl of sliders) {
      lines.push(`sliderStates["${sl.id}"] = ${sl.value}`);
    }
    lines.push('');
  }

  // Progress states
  if (progresses.length > 0) {
    lines.push('-- Progress states');
    lines.push('local progressStates = {}');
    for (const pr of progresses) {
      lines.push(`progressStates["${pr.id}"] = ${pr.value}`);
    }
    lines.push('');
  }

  // Tab states
  if (tabs.length > 0) {
    lines.push('-- Tab states');
    lines.push('local tabStates = {}');
    for (const tb of tabs) {
      lines.push(`tabStates["${tb.id}"] = ${tb.selectedIndex + 1}`);
    }
    lines.push('');
  }

  // Tooltip states
  if (tooltips.length > 0) {
    lines.push('-- Tooltip states');
    lines.push('local tooltipTimers = {}');
    lines.push('local tooltipHovering = {}');
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// DROPDOWN EVENTS
// ============================================================================

function generateDropdownEvents(dropdowns: VoxelDropdown[]): string {
  if (dropdowns.length === 0) return '';

  const lines: string[] = [];
  lines.push('--============================================================================');
  lines.push('-- Dropdown Events');
  lines.push('--============================================================================');
  lines.push('');

  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen or button ~= "left" or state ~= "down" then return end');
  lines.push('');

  for (const dd of dropdowns) {
    const vn = `dd_${dd.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`    -- Dropdown: ${escapeLuaString(dd.text)}`);
    lines.push(`    if isMouseInPosition(winX + ${Math.round(dd.x)}, winY + ${Math.round(dd.y)}, ${Math.round(dd.width)}, ${Math.round(dd.height)}) then`);
    lines.push(`        dropdownStates["${dd.id}"] = not dropdownStates["${dd.id}"]`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');

    // Option clicks
    const maxVisible = dd.maxVisible || 6;
    const itemH = 30;
    const listH = Math.min(dd.options.length, maxVisible) * itemH + 4;
    for (let i = 0; i < dd.options.length; i++) {
      const optY = `${Math.round(dd.y)} + ${Math.round(dd.height)} + 2 + ${i * itemH}`;
      lines.push(`    if dropdownStates["${dd.id}"] and isMouseInPosition(winX + ${Math.round(dd.x)} + 2, winY + ${optY}, ${Math.round(dd.width)} - 4, ${itemH}) then`);
      lines.push(`        dropdownSelections["${dd.id}"] = ${i + 1}`);
      lines.push(`        dropdownStates["${dd.id}"] = false`);
      lines.push(`        outputChatBox("Dropdown selected: ${escapeLuaString(dd.options[i])}")`);
      lines.push(`        return`);
      lines.push(`    end`);
      lines.push('');
    }
  }

  // Click outside closes all dropdowns
  lines.push('    -- Click outside closes dropdowns');
  for (const dd of dropdowns) {
    lines.push(`    dropdownStates["${dd.id}"] = false`);
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// CHECKBOX EVENTS
// ============================================================================

function generateCheckboxEvents(checkboxes: VoxelCheckbox[]): string {
  if (checkboxes.length === 0) return '';

  const lines: string[] = [];
  lines.push('--============================================================================');
  lines.push('-- Checkbox Events');
  lines.push('--============================================================================');
  lines.push('');

  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen or button ~= "left" or state ~= "down" then return end');
  lines.push('');

  for (const cb of checkboxes) {
    const size = Math.min(cb.width, cb.height, 20);
    lines.push(`    if isMouseInPosition(winX + ${Math.round(cb.x)}, winY + ${Math.round(cb.y)} + (${Math.round(cb.height)} - ${size}) / 2, ${size}, ${size}) then`);
    lines.push(`        checkboxStates["${cb.id}"] = not checkboxStates["${cb.id}"]`);
    lines.push(`        return`);
    lines.push(`    end`);
    const textSize = Math.round(cb.width) - size - 8;
    lines.push(`    if isMouseInPosition(winX + ${Math.round(cb.x)} + ${size + 8}, winY + ${Math.round(cb.y)}, ${textSize}, ${Math.round(cb.height)}) then`);
    lines.push(`        checkboxStates["${cb.id}"] = not checkboxStates["${cb.id}"]`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// RADIO EVENTS
// ============================================================================

function generateRadioEvents(radios: VoxelRadio[]): string {
  if (radios.length === 0) return '';

  const lines: string[] = [];
  lines.push('--============================================================================');
  lines.push('-- Radio Events');
  lines.push('--============================================================================');
  lines.push('');

  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen or button ~= "left" or state ~= "down" then return end');
  lines.push('');

  for (const radio of radios) {
    const size = Math.min(radio.width, radio.height, 20);
    lines.push(`    if isMouseInPosition(winX + ${Math.round(radio.x)}, winY + ${Math.round(radio.y)} + (${Math.round(radio.height)} - ${size}) / 2, ${size}, ${size}) then`);
    lines.push(`        -- Deselect all in group "${escapeLuaString(radio.groupName)}"`);
    lines.push(`        for k, v in pairs(radioStates) do`);
    lines.push(`            radioStates[k] = false`);
    lines.push(`        end`);
    lines.push(`        radioStates["${radio.id}"] = true`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// SWITCH EVENTS
// ============================================================================

function generateSwitchEvents(switches: VoxelSwitch[]): string {
  if (switches.length === 0) return '';

  const lines: string[] = [];
  const trackW = 44;
  const trackH = 24;

  lines.push('--============================================================================');
  lines.push('-- Switch Events');
  lines.push('--============================================================================');
  lines.push('');

  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen or button ~= "left" or state ~= "down" then return end');
  lines.push('');

  for (const sw of switches) {
    lines.push(`    if isMouseInPosition(winX + ${Math.round(sw.x)} + ${Math.round(sw.width)} - ${trackW}, winY + ${Math.round(sw.y)} + (${Math.round(sw.height)} - ${trackH}) / 2, ${trackW}, ${trackH}) then`);
    lines.push(`        switchStates["${sw.id}"] = not switchStates["${sw.id}"]`);
    lines.push(`        return`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// SLIDER EVENTS
// ============================================================================

function generateSliderEvents(sliders: VoxelSlider[]): string {
  if (sliders.length === 0) return '';

  const lines: string[] = [];
  lines.push('--============================================================================');
  lines.push('-- Slider Events');
  lines.push('--============================================================================');
  lines.push('');

  // Mouse down to start dragging
  lines.push('local sliderDragging = {}');
  lines.push('');

  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen then return end');
  lines.push('');

  for (const sl of sliders) {
    lines.push(`    if button == "left" and state == "down" then`);
    lines.push(`        if isMouseInPosition(winX + ${Math.round(sl.x)} + 10, winY + ${Math.round(sl.y)} + ${Math.round(sl.height / 2 - 8)}, ${Math.round(sl.width)} - 20, 16) then`);
    lines.push(`            sliderDragging["${sl.id}"] = true`);
    lines.push(`            return`);
    lines.push(`        end`);
    lines.push(`    elseif state == "up" then`);
    lines.push(`        sliderDragging["${sl.id}"] = false`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');

  // Mouse move to update slider
  lines.push('addEventHandler("onClientCursorMove", root, function()');
  lines.push('    if not isOpen then return end');
  lines.push('    local cx, cy = getCursorPosition()');
  lines.push('    local sx, sy = guiGetScreenSize()');
  lines.push('    local cursorX = cx * sx');
  lines.push('');

  for (const sl of sliders) {
    lines.push(`    if sliderDragging["${sl.id}"] then`);
    lines.push(`        local trackStart = winX + ${Math.round(sl.x)} + 10`);
    lines.push(`        local trackEnd = trackStart + ${Math.round(sl.width)} - 20`);
    lines.push(`        local ratio = (cursorX - trackStart) / (trackEnd - trackStart)`);
    lines.push(`        ratio = clamp(ratio, 0, 1)`);
    lines.push(`        sliderStates["${sl.id}"] = math.floor((${sl.min} + ratio * (${sl.max} - ${sl.min})) / ${sl.step}) * ${sl.step}`);
    lines.push(`        sliderStates["${sl.id}"] = clamp(sliderStates["${sl.id}"], ${sl.min}, ${sl.max})`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// TABS EVENTS
// ============================================================================

function generateTabsEvents(tabs: VoxelTabs[]): string {
  if (tabs.length === 0) return '';

  const lines: string[] = [];
  lines.push('--============================================================================');
  lines.push('-- Tabs Events');
  lines.push('--============================================================================');
  lines.push('');

  lines.push('addEventHandler("onClientClick", root, function(button, state)');
  lines.push('    if not isOpen or button ~= "left" or state ~= "down" then return end');
  lines.push('');

  for (const tb of tabs) {
    const tabWidth = Math.floor(tb.width / tb.tabs.length);
    const tabHeight = 36;
    for (let i = 0; i < tb.tabs.length; i++) {
      lines.push(`    if isMouseInPosition(winX + ${Math.round(tb.x)} + ${i * tabWidth}, winY + ${Math.round(tb.y)}, ${tabWidth}, ${tabHeight}) then`);
      lines.push(`        tabStates["${tb.id}"] = ${i + 1}`);
      lines.push(`        return`);
      lines.push(`    end`);
    }
    lines.push('');
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// TOOLTIP EVENTS
// ============================================================================

function generateTooltipEvents(tooltips: VoxelTooltip[]): string {
  if (tooltips.length === 0) return '';

  const lines: string[] = [];
  lines.push('--============================================================================');
  lines.push('-- Tooltip Events');
  lines.push('--============================================================================');
  lines.push('');

  // Track mouse position and check hover
  lines.push('addEventHandler("onClientCursorMove", root, function()');
  lines.push('    if not isOpen then return end');
  lines.push('    local now = getTickCount()');
  lines.push('');

  for (const tip of tooltips) {
    // Find target component by searching all components
    // For now, use the tooltip's own position (target is nearby)
    lines.push(`    -- Tooltip for target: ${escapeLuaString(tip.text)}`);
    lines.push(`    if isMouseInPosition(winX + ${Math.round(tip.x)}, winY + ${Math.round(tip.y)}, ${Math.round(tip.width)}, ${Math.round(tip.height)}) then`);
    lines.push(`        if not tooltipTimers["${tip.id}"] then`);
    lines.push(`            tooltipTimers["${tip.id}"] = now`);
    lines.push(`        end`);
    lines.push(`        tooltipHovering["${tip.id}"] = true`);
    lines.push(`    else`);
    lines.push(`        tooltipTimers["${tip.id}"] = nil`);
    lines.push(`        tooltipHovering["${tip.id}"] = false`);
    lines.push(`    end`);
    lines.push('');
  }

  lines.push('end)');
  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// HELPERS
// ============================================================================

function extractCustomEventNames(project: VoxelProject): string[] {
  const events = new Set<string>();
  for (const comp of project.components) {
    if (comp.type === 'button' && (comp as VoxelButton).onClick) {
      events.add((comp as VoxelButton).onClick!);
    }
  }
  return Array.from(events);
}

function generateAssetComments(project: VoxelProject): string {
  const lines: string[] = ['-- Assets:'];
  for (const asset of project.assets) {
    lines.push(`--   ${asset.filename} (${asset.type})`);
  }
  lines.push('');
  return lines.join('\n');
}

function generateFontComments(project: VoxelProject): string {
  const lines: string[] = ['-- Fonts required:'];
  for (const font of project.fonts) {
    lines.push(`--   ${font.family} ${font.weight}${font.style === 'italic' ? ' italic' : ''}`);
  }
  lines.push('');
  return lines.join('\n');
}

function normalizePanelName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_À-ÿ]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase() || 'panel';
}

function escapeLuaString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}