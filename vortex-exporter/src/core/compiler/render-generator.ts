// ============================================================================
// Render Generator — Gera todo o código de rendering MTA:SA DX
// Suporta: shapes, gradients, glows, strokes, blend modes, auto-layout
// ============================================================================

import {
  WindowConfig, VoxelComponent, VoxelBase,
  VoxelRectangle, VoxelEllipse, VoxelTriangle, VoxelPolygon, VoxelStar,
  VoxelLine, VoxelVector, VoxelButton, VoxelInput, VoxelText, VoxelImage,
  VoxelSvg, VoxelDropdown, VoxelCheckbox, VoxelRadio, VoxelSwitch,
  VoxelSlider, VoxelProgress, VoxelTabs, VoxelTooltip, VoxelScrollView,
  VoxelGroup, VoxelEffect, VoxelPaint, VoxelStroke, VoxelConstraints,
  GradientStop, BlendMode, RichTextSegment,
} from '../types/internal';

// ============================================================================
// MAIN RENDER — Gera o handler onClientRender completo
// ============================================================================

export function generateRenderCode(
  panelName: string,
  windowConfig: WindowConfig,
  components: VoxelComponent[],
  backgroundConfig?: WindowConfig,
): string {
  const lines: string[] = [];

  lines.push('--============================================================================');
  lines.push(`-- ${panelName} — DX Render`);
  lines.push('--============================================================================');
  lines.push('');

  lines.push('-- Main render handler');
  lines.push('addEventHandler("onClientRender", root, function()');
  lines.push('    if not isOpen then return end');
  lines.push('');
  lines.push('    sx, sy = guiGetScreenSize()');
  lines.push('');

  // Responsive scaling (baseado em 1366x768)
  const baseW = windowConfig.baseWidth || windowConfig.width;
  const baseH = windowConfig.baseHeight || windowConfig.height;
  const hasResponsiveScale: boolean = !!(windowConfig.responsive !== false && (windowConfig.baseWidth || windowConfig.baseHeight));

  if (hasResponsiveScale && (baseW !== windowConfig.width || baseH !== windowConfig.height)) {
    lines.push(`    -- Responsive scale (base: ${baseW}x${baseH})`);
    lines.push(`    local scale = math.min(sx / ${baseW}, sy / ${baseH})`);
    lines.push('');
  }

  // Window positioning
  const winW = Math.round(windowConfig.width);
  const winH = Math.round(windowConfig.height);

  lines.push(`    -- ${panelName} Window (${winW}x${winH})`);
  const posCode = generateWindowPositionCode(windowConfig, winW, winH, hasResponsiveScale);
  lines.push(posCode);
  lines.push('');

  // Background overlay (only if UI_Background was provided)
  if (backgroundConfig) {
    const bgFills = backgroundConfig.backgroundFills || [];
    if (bgFills.length > 0) {
      lines.push('    -- Background overlay');
      for (const fill of bgFills) {
        if (fill.type === 'solid' && fill.color) {
          const a = Math.round((fill.opacity || 1) * 255);
          lines.push(`    dxDrawRectangle(0, 0, sx, sy, tocolor(${fill.color.r}, ${fill.color.g}, ${fill.color.b}, ${Math.min(a, 255)}), true)`);
        }
      }
      lines.push('');
    }
  }

  // Window alpha (opacidade)
  const winAlpha = windowConfig.alpha !== undefined ? Math.round(windowConfig.alpha * 255) : 255;

  // Window backgroundFills (custom fill from Figma — solid/gradient)
  const winFills = windowConfig.backgroundFills || [];
  if (winFills.length > 0) {
    for (const fill of winFills) {
      if (fill.type === 'solid' && fill.color) {
        const a = Math.round((fill.opacity || 1) * 255);
        lines.push(`    dxDrawRectangle(winX, winY, ${winW}, ${winH}, tocolor(${fill.color.r}, ${fill.color.g}, ${fill.color.b}, ${Math.min(a, 255)}), true)`);
      }
    }
  } else {
    lines.push(`    dxDrawRectangle(winX, winY, ${winW}, ${winH}, tocolor(30, 39, 58, ${winAlpha < 255 ? winAlpha : 255}), true)`);
  }

  // Window corner radius
  if (windowConfig.cornerRadius && windowConfig.cornerRadius > 0) {
    renderCornerRadius('winX', 'winY', `${winW}`, `${winH}`, windowConfig.cornerRadius, 'theme.background', lines, '    ');
  }
  lines.push('');

  // Window strokes (borders)
  if (windowConfig.strokes && windowConfig.strokes.length > 0) {
    lines.push('    -- Window strokes');
    for (const s of windowConfig.strokes) {
      const w = Math.round(s.weight);
      const c = s.paint?.color || { r: 255, g: 255, b: 255, a: 255 };
      const a = c.a <= 1 ? Math.round(c.a * 255) : Math.min(c.a, 255);
      lines.push(`    dxDrawRectangle(winX, winY, ${winW}, ${w}, tocolor(${c.r}, ${c.g}, ${c.b}, ${a}), true)`);
      lines.push(`    dxDrawRectangle(winX, winY + ${winH - w}, ${winW}, ${w}, tocolor(${c.r}, ${c.g}, ${c.b}, ${a}), true)`);
      lines.push(`    dxDrawRectangle(winX, winY + ${w}, ${w}, ${winH - w * 2}, tocolor(${c.r}, ${c.g}, ${c.b}, ${a}), true)`);
      lines.push(`    dxDrawRectangle(winX + ${winW - w}, winY + ${w}, ${w}, ${winH - w * 2}, tocolor(${c.r}, ${c.g}, ${c.b}, ${a}), true)`);
    }
    lines.push('');
  }

  // Window effects (shadow, blur, glow)
  if (windowConfig.effects && windowConfig.effects.length > 0) {
    lines.push('    -- Window effects');
    for (const eff of windowConfig.effects) {
      if (eff.type === 'drop-shadow' || eff.type === 'inner-shadow') {
        const c = eff.color || { r: 0, g: 0, b: 0, a: 64 };
        const ox = Math.round(eff.offsetX);
        const oy = Math.round(eff.offsetY);
        const a = c.a <= 1 ? Math.round(c.a * 255) : Math.min(c.a, 255);
        lines.push(`    dxDrawRectangle(winX + ${ox}, winY + ${oy}, ${winW}, ${winH}, tocolor(${c.r}, ${c.g}, ${c.b}, ${Math.min(a, 100)}), true)`);
        if (eff.radius > 4) {
          lines.push(`    dxDrawRectangle(winX + ${ox + 2}, winY + ${oy + 2}, ${winW}, ${winH}, tocolor(${c.r}, ${c.g}, ${c.b}, ${Math.min(a, 60)}), true)`);
        }
      } else if (eff.type === 'background-blur') {
        const r = Math.round(eff.radius);
        lines.push(`    dxDrawRectangle(winX - ${r}, winY - ${r}, ${winW + r * 2}, ${winH + r * 2}, tocolor(0, 0, 0, ${Math.min(r * 8, 40)}), true)`);
      }
    }
    lines.push('');
  }

  // Window title
  if (windowConfig.title) {
    lines.push('    -- Window title');
    lines.push(`    dxDrawText("${escapeLuaString(windowConfig.title)}", winX + 15, winY + 10, winX + ${winW} - 15, winY + 35, theme.text, 1.0, "default-bold", "left", "top", false, false, true)`);
    lines.push('');
  }

  // Render each component sorted by zIndex
  const sortedComponents = [...components].sort((a, b) => (a as any).zIndex - (b as any).zIndex);

  for (const component of sortedComponents) {
    renderComponent(component, lines, panelName);
  }

  lines.push('end)');
  lines.push('');

  return lines.join('\n');
}

function generateWindowPositionCode(windowConfig: WindowConfig, winW: number, winH: number, useScale: boolean = false): string {
  const scalePrefix = useScale ? ' * scale' : '';

  // Se tem posição X/Y explícita (em pixels), usa coordenadas absolutas
  if (windowConfig.x !== undefined || windowConfig.y !== undefined) {
    const x = windowConfig.x ?? 0;
    const y = windowConfig.y ?? 0;
    return `    local winX = ${Math.round(x)}\n    local winY = ${Math.round(y)}`;
  }

  const anchor = windowConfig.anchor || 'center';
  switch (anchor) {
    case 'center':
      return `    local winX = (sx - ${winW}) / 2\n    local winY = (sy - ${winH}) / 2`;
    case 'left':
      return `    local winX = 20\n    local winY = (sy - ${winH}) / 2`;
    case 'right':
      return `    local winX = sx - ${winW} - 20\n    local winY = (sy - ${winH}) / 2`;
    case 'top':
      return `    local winX = (sx - ${winW}) / 2\n    local winY = 20`;
    case 'bottom':
      return `    local winX = (sx - ${winW}) / 2\n    local winY = sy - ${winH} - 20`;
    case 'topleft':
      return `    local winX = 20\n    local winY = 20`;
    case 'topright':
      return `    local winX = sx - ${winW} - 20\n    local winY = 20`;
    case 'bottomleft':
      return `    local winX = 20\n    local winY = sy - ${winH} - 20`;
    case 'bottomright':
      return `    local winX = sx - ${winW} - 20\n    local winY = sy - ${winH} - 20`;
    default:
      return `    local winX = (sx - ${winW}) / 2\n    local winY = (sy - ${winH}) / 2`;
  }
}

// ============================================================================
// RENDER COMPONENT — Dispatch para cada tipo
// ============================================================================

function renderComponent(component: VoxelComponent, lines: string[], panelName: string): void {
  const indent = '    ';

  switch (component.type) {
    case 'rectangle':
      renderRectangle(component as VoxelRectangle, lines, indent);
      break;
    case 'ellipse':
      renderEllipse(component as VoxelEllipse, lines, indent);
      break;
    case 'triangle':
      renderTriangle(component as VoxelTriangle, lines, indent);
      break;
    case 'polygon':
      renderPolygon(component as VoxelPolygon, lines, indent);
      break;
    case 'star':
      renderStar(component as VoxelStar, lines, indent);
      break;
    case 'line':
      renderLine(component as VoxelLine, lines, indent);
      break;
    case 'vector':
      renderVector(component as VoxelVector, lines, indent);
      break;
    case 'button':
      renderButton(component as VoxelButton, lines, indent);
      break;
    case 'input':
      renderInput(component as VoxelInput, lines, indent);
      break;
    case 'text':
      renderText(component as VoxelText, lines, indent);
      break;
    case 'image':
      renderImage(component as VoxelImage, lines, indent);
      break;
    case 'svg':
      renderSvg(component as VoxelSvg, lines, indent);
      break;
    case 'dropdown':
      renderDropdown(component as VoxelDropdown, lines, indent);
      break;
    case 'checkbox':
      renderCheckbox(component as VoxelCheckbox, lines, indent);
      break;
    case 'radio':
      renderRadio(component as VoxelRadio, lines, indent);
      break;
    case 'switch':
      renderSwitch(component as VoxelSwitch, lines, indent);
      break;
    case 'slider':
      renderSlider(component as VoxelSlider, lines, indent);
      break;
    case 'progress':
      renderProgress(component as VoxelProgress, lines, indent);
      break;
    case 'tabs':
      renderTabs(component as VoxelTabs, lines, indent);
      break;
    case 'tooltip':
      renderTooltip(component as VoxelTooltip, lines, indent);
      break;
    case 'scrollview':
      renderScrollView(component as VoxelScrollView, lines, indent, panelName);
      break;
    case 'group':
      renderGroup(component as VoxelGroup, lines, indent);
      break;
  }
}

// ============================================================================
// HELPERS DE RENDER
// ============================================================================

function varName(id: string, prefix: string = 'c'): string {
  return `${prefix}_${id.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function escapeLuaString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function renderCornerRadius(vx: string, vy: string, vw: string, vh: string, radius: number, bgColor: string, lines: string[], indent: string): void {
  if (!radius || radius <= 0) return;
  const r = Math.round(radius);
  lines.push(`${indent}-- Corner radius: ${r}px (simulated with circles)`);
  // 4 círculos da cor do fundo nos cantos para "cortar" as pontas
  lines.push(`${indent}dxDrawCircle(${vx} + ${r}, ${vy} + ${r}, ${r}, 180, 270, ${bgColor}, 16)`);
  lines.push(`${indent}dxDrawCircle(${vx} + ${vw} - ${r}, ${vy} + ${r}, ${r}, 270, 360, ${bgColor}, 16)`);
  lines.push(`${indent}dxDrawCircle(${vx} + ${r}, ${vy} + ${vh} - ${r}, ${r}, 90, 180, ${bgColor}, 16)`);
  lines.push(`${indent}dxDrawCircle(${vx} + ${vw} - ${r}, ${vy} + ${vh} - ${r}, ${r}, 0, 90, ${bgColor}, 16)`);
}

function renderEffects(effects: VoxelEffect[], vx: string, vy: string, vw: string, vh: string, lines: string[], indent: string): void {
  for (const effect of effects) {
    if (!effect.visible) continue;

    const colorStr = effect.color
      ? `tocolor(${effect.color.r}, ${effect.color.g}, ${effect.color.b}, ${Math.round(effect.color.a * (effect.radius > 0 ? 0.3 : 1))})`
      : 'tocolor(0, 0, 0, 60)';

    switch (effect.type) {
      case 'drop-shadow':
        lines.push(`${indent}-- Drop shadow (r:${effect.radius}, offX:${effect.offsetX}, offY:${effect.offsetY})`);
        // Multiple layers for intensity
        for (let i = 1; i <= Math.min(3, Math.ceil(effect.radius / 4)); i++) {
          const spread = effect.spread || 0;
          const offX = Math.round(effect.offsetX * i);
          const offY = Math.round(effect.offsetY * i);
          const alpha = Math.round((effect.color?.a || 60) / i);
          lines.push(`${indent}dxDrawRectangle(${vx} + ${offX}, ${vy} + ${offY}, ${vw} + ${spread * 2}, ${vh} + ${spread * 2}, tocolor(0, 0, 0, ${alpha}), true)`);
        }
        break;

      case 'inner-shadow':
        lines.push(`${indent}-- Inner shadow`);
        lines.push(`${indent}dxDrawRectangle(${vx} + ${Math.round(effect.offsetX)}, ${vy} + ${Math.round(effect.offsetY)}, ${vw}, ${vh}, ${colorStr}, true)`);
        break;

      case 'layer-blur':
        lines.push(`${indent}-- Layer blur (r:${effect.radius}) — simulated with semi-transparency`);
        lines.push(`${indent}dxDrawRectangle(${vx}, ${vy}, ${vw}, ${vh}, tocolor(0, 0, 0, ${Math.min(80, Math.round(effect.radius * 3))}), true)`);
        break;

      case 'background-blur':
        lines.push(`${indent}-- Background blur (r:${effect.radius}) — glass effect`);
        lines.push(`${indent}dxDrawRectangle(${vx}, ${vy}, ${vw}, ${vh}, tocolor(255, 255, 255, 30), true)`);
        break;

      case 'glow':
        // NEON GLOW effect — multiple layers with increasing blur
        lines.push(`${indent}-- Neon Glow effect`);
        const glowColor = effect.color || { r: 0, g: 255, b: 200, a: 80 };
        for (let i = 4; i >= 1; i--) {
          const spread = Math.round(effect.radius * i * 2);
          const alpha = Math.round((glowColor.a || 80) / (i * 2));
          lines.push(`${indent}dxDrawRectangle(${vx} - ${spread / 2}, ${vy} - ${spread / 2}, ${vw} + ${spread}, ${vh} + ${spread}, tocolor(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${alpha}), true)`);
        }
        break;
    }
  }
}

function renderFills(fills: VoxelPaint[], vx: string, vy: string, vw: string, vh: string, lines: string[], indent: string): void {
  if (!fills || fills.length === 0) return;

  for (const fill of fills) {
    if (!fill.visible) continue;

    switch (fill.type) {
      case 'solid': {
        const color = fill.color || { r: 255, g: 255, b: 255, a: 255 };
        lines.push(`${indent}dxDrawRectangle(${vx}, ${vy}, ${vw}, ${vh}, tocolor(${color.r}, ${color.g}, ${color.b}, ${Math.round(color.a * fill.opacity)}), true)`);
        break;
      }

      case 'gradient-linear': {
        const stops = fill.gradientStops || [];
        if (stops.length >= 2) {
          const g = fill.gradientTransform || { x1: 0, y1: 0, x2: 1, y2: 1 };
          const c1 = stops[0].color;
          const c2 = stops[stops.length - 1]?.color || stops[0].color;
          lines.push(`${indent}-- Linear gradient (${stops.length} stop(s))`);
          lines.push(`${indent}dxDrawRectangle(${vx}, ${vy}, ${vw}, ${vh}, tocolor(${c1.r}, ${c1.g}, ${c1.b}, ${Math.round(c1.a * fill.opacity)}), true)`);
        }
        break;
      }

      case 'gradient-radial': {
        const stops = fill.gradientStops || [];
        if (stops.length >= 2) {
          const c1 = stops[0].color;
          const c2 = stops[stops.length - 1]?.color || stops[0].color;
          lines.push(`${indent}-- Radial gradient`);
          // Simulate radial with multiple rectangles (concentric approximation)
          const steps = 8;
          for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const r = c1.r + (c2.r - c1.r) * t;
            const g = c1.g + (c2.g - c1.g) * t;
            const b = c1.b + (c2.b - c1.b) * t;
            const a = Math.round((c1.a + (c2.a - c1.a) * t) * fill.opacity * (1 - t * 0.5));
            const s = Math.round(t * 0.5 * 100); // shrink
            lines.push(`${indent}dxDrawRectangle(${vx} + ${s}%, ${vy} + ${s}%, ${vw} - ${s * 2}%, ${vh} - ${s * 2}%, tocolor(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a}), true)`);
          }
        }
        break;
      }

      case 'image': {
        if (fill.imageRef) {
          lines.push(`${indent}-- Image fill`);
          lines.push(`${indent}dxDrawImage(${vx}, ${vy}, ${vw}, ${vh}, "assets/${escapeLuaString(fill.imageRef)}.png", 0, 0, 0, tocolor(255, 255, 255, ${Math.round(fill.opacity * 255)}), true)`);
        }
        break;
      }
    }
  }
}

function renderStrokes(strokes: VoxelStroke[], vx: string, vy: string, vw: string, vh: string, lines: string[], indent: string): void {
  if (!strokes || strokes.length === 0) return;

  for (const stroke of strokes) {
    const color = stroke.paint.color || { r: 255, g: 255, b: 255, a: 255 };
    const w = stroke.weight;
    const alpha = Math.round(color.a * stroke.paint.opacity);

    switch (stroke.align) {
      case 'inside':
        lines.push(`${indent}-- Stroke (inside, w:${w})`);
        // Top
        lines.push(`${indent}dxDrawRectangle(${vx}, ${vy}, ${vw}, ${w}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        // Bottom
        lines.push(`${indent}dxDrawRectangle(${vx}, ${vy} + ${vh} - ${w}, ${vw}, ${w}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        // Left
        lines.push(`${indent}dxDrawRectangle(${vx}, ${vy} + ${w}, ${w}, ${vh} - ${w * 2}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        // Right
        lines.push(`${indent}dxDrawRectangle(${vx} + ${vw} - ${w}, ${vy} + ${w}, ${w}, ${vh} - ${w * 2}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        break;

      case 'outside':
        lines.push(`${indent}-- Stroke (outside, w:${w})`);
        lines.push(`${indent}dxDrawRectangle(${vx} - ${w}, ${vy} - ${w}, ${vw} + ${w * 2}, ${w}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        lines.push(`${indent}dxDrawRectangle(${vx} - ${w}, ${vy} + ${vh}, ${vw} + ${w * 2}, ${w}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        lines.push(`${indent}dxDrawRectangle(${vx} - ${w}, ${vy}, ${w}, ${vh}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        lines.push(`${indent}dxDrawRectangle(${vx} + ${vw}, ${vy}, ${w}, ${vh}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        break;

      case 'center':
        lines.push(`${indent}-- Stroke (center, w:${w}) — simplified`);
        lines.push(`${indent}dxDrawRectangle(${vx} - ${Math.round(w / 2)}, ${vy} - ${Math.round(w / 2)}, ${vw} + ${w}, ${w}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        lines.push(`${indent}dxDrawRectangle(${vx} - ${Math.round(w / 2)}, ${vy} + ${vh} - ${Math.round(w / 2)}, ${vw} + ${w}, ${w}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        lines.push(`${indent}dxDrawRectangle(${vx} - ${Math.round(w / 2)}, ${vy}, ${w}, ${vh}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        lines.push(`${indent}dxDrawRectangle(${vx} + ${vw} - ${Math.round(w / 2)}, ${vy}, ${w}, ${vh}, tocolor(${color.r}, ${color.g}, ${color.b}, ${alpha}), true)`);
        break;
    }
  }
}

// ============================================================================
// RENDER SHAPES
// ============================================================================

function renderRectangle(rect: VoxelRectangle, lines: string[], indent: string): void {
  const vn = varName(rect.id, 'rect');
  lines.push(`${indent}-- Rectangle: ${rect.id}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(rect.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(rect.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(rect.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(rect.height)}`);

  renderEffects(rect.effects, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  renderFills(rect.fills, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  renderStrokes(rect.strokes, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  lines.push('');
}

function renderEllipse(ellipse: VoxelEllipse, lines: string[], indent: string): void {
  const vn = varName(ellipse.id, 'ell');
  lines.push(`${indent}-- Ellipse: ${ellipse.id}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(ellipse.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(ellipse.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(ellipse.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(ellipse.height)}`);
  lines.push(`${indent}local ${vn}CX = ${vn}X + ${vn}W / 2`);
  lines.push(`${indent}local ${vn}CY = ${vn}Y + ${vn}H / 2`);

  // Draw circle/ellipse using dxDrawCircle (MTA SA 1.6+)
  renderEffects(ellipse.effects, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);

  const fill = ellipse.fills?.[0];
  if (fill && fill.visible && fill.color) {
    const c = fill.color;
    const seg = Math.round(ellipse.width * 0.8);
    lines.push(`${indent}dxDrawCircle(${vn}CX, ${vn}CY, math.max(${vn}W, ${vn}H) / 2, 0, 360, tocolor(${c.r}, ${c.g}, ${c.b}, ${Math.round(c.a * fill.opacity)}), ${seg})`);
  }

  lines.push('');
}

function renderTriangle(tri: VoxelTriangle, lines: string[], indent: string): void {
  const vn = varName(tri.id, 'tri');
  lines.push(`${indent}-- Triangle: ${tri.id}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(tri.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(tri.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(tri.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(tri.height)}`);

  const fill = tri.fills?.[0];
  if (fill && fill.visible && fill.color) {
    const c = fill.color;
    // Triangle using dxDrawRectangle (approximation) — real triangle needs dxDrawTriangle
    lines.push(`${indent}-- Triangle approximation (MTA: dxDrawTriangle not available)`);
    lines.push(`${indent}dxDrawRectangle(${vn}X + ${vn}W * 0.25, ${vn}Y, ${vn}W * 0.5, ${vn}H, tocolor(${c.r}, ${c.g}, ${c.b}, ${Math.round(c.a * fill.opacity)}), true)`);
  }
  lines.push('');
}

function renderPolygon(poly: VoxelPolygon, lines: string[], indent: string): void {
  // Simple polygon approximation
  const vn = varName(poly.id, 'poly');
  lines.push(`${indent}-- Polygon (${poly.sides} sides): ${poly.id}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(poly.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(poly.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(poly.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(poly.height)}`);

  renderFills(poly.fills, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  renderStrokes(poly.strokes, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  lines.push('');
}

function renderStar(star: VoxelStar, lines: string[], indent: string): void {
  const vn = varName(star.id, 'star');
  lines.push(`${indent}-- Star (${star.points} points): ${star.id}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(star.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(star.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(star.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(star.height)}`);

  renderFills(star.fills, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  renderStrokes(star.strokes, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  lines.push('');
}

function renderLine(line: VoxelLine, lines: string[], indent: string): void {
  const vn = varName(line.id, 'ln');
  lines.push(`${indent}-- Line: ${line.id}`);
  lines.push(`${indent}local ${vn}X1 = winX + ${Math.round(line.startX)}`);
  lines.push(`${indent}local ${vn}Y1 = winY + ${Math.round(line.startY)}`);
  lines.push(`${indent}local ${vn}X2 = winX + ${Math.round(line.endX)}`);
  lines.push(`${indent}local ${vn}Y2 = winY + ${Math.round(line.endY)}`);

  const stroke = line.strokes?.[0];
  if (stroke && stroke.paint.color) {
    const c = stroke.paint.color;
    const w = Math.max(1, stroke.weight);
    lines.push(`${indent}dxDrawLine(${vn}X1, ${vn}Y1, ${vn}X2, ${vn}Y2, tocolor(${c.r}, ${c.g}, ${c.b}, ${Math.round(c.a * stroke.paint.opacity)}), ${w})`);
  }
  lines.push('');
}

function renderVector(vec: VoxelVector, lines: string[], indent: string): void {
  // Vector paths rendered as SVG
  const vn = varName(vec.id, 'vec');
  lines.push(`${indent}-- Vector: ${vec.id} (${vec.paths.length} path(s))`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(vec.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(vec.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(vec.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(vec.height)}`);
  // Simplified: render as rectangle
  renderFills(vec.fills, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  lines.push('');
}

// ============================================================================
// RENDER BUTTON — Completo com hover, neon, glow, icon
// ============================================================================

function renderButton(btn: VoxelButton, lines: string[], indent: string): void {
  const vn = varName(btn.id, 'btn');
  const themeColor = `theme.${btn.theme || 'primary'}`;
  const hoverColor = btn.hoverColor
    ? `tocolor(${parseColorString(btn.hoverColor)})`
    : `theme.${btn.theme ? btn.theme + 'Hover' : 'primaryHover'}`;

  lines.push(`${indent}-- Button: ${escapeLuaString(btn.text)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(btn.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(btn.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(btn.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(btn.height)}`);
  lines.push(`${indent}local ${vn}Hover = isMouseInPosition(${vn}X, ${vn}Y, ${vn}W, ${vn}H)`);
  lines.push(`${indent}local ${vn}Color = ${vn}Hover and ${hoverColor} or ${themeColor}`);

  // Neon glow effect if theme is 'neon' or 'glow'
  if (btn.theme === 'neon' || btn.theme === 'glow') {
    lines.push(`${indent}-- Neon glow effect`);
    lines.push(`${indent}if ${vn}Hover then`);
    lines.push(`${indent}    dxDrawRectangle(${vn}X - 4, ${vn}Y - 4, ${vn}W + 8, ${vn}H + 8, theme.neonGlow, true)`);
    lines.push(`${indent}    dxDrawRectangle(${vn}X - 2, ${vn}Y - 2, ${vn}W + 4, ${vn}H + 4, theme.neon, true)`);
    lines.push(`${indent}end`);
  }

  // Effects
  renderEffects(btn.effects, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);

  // Background
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y, ${vn}W, ${vn}H, ${vn}Color, true)`);

  // Corner radius
  if (btn.cornerRadius && btn.cornerRadius > 0) {
    const btnBgColor = btn.theme === 'primary' ? 'theme.primary' 
      : btn.theme === 'secondary' ? 'theme.secondary' 
      : 'theme.surfaceAlt';
    renderCornerRadius(`${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, btn.cornerRadius, 'theme.background', lines, indent);
  }

  // Icon
  if (btn.icon) {
    const iconX = btn.iconPosition === 'right' ? `${vn}X + ${vn}W - 30` : `${vn}X + 10`;
    lines.push(`${indent}dxDrawText("${escapeLuaString(btn.icon)}", ${iconX}, ${vn}Y, ${iconX} + 20, ${vn}Y + ${vn}H, theme.text, 1.0, "default", "center", "center")`);
  }

  // Text
  const textX = btn.icon ? (btn.iconPosition === 'right' ? `${vn}X + 10` : `${vn}X + 35`) : `${vn}X`;
  const textAlign = btn.icon ? 'left' : 'center';
  lines.push(`${indent}dxDrawText("${escapeLuaString(btn.text)}", ${textX}, ${vn}Y, ${vn}X + ${vn}W, ${vn}Y + ${vn}H, theme.text, 1.0, "default-bold", "${textAlign}", "center", false, false, ${btn.disabled ? 'false' : 'true'})`);
  lines.push('');
}

// ============================================================================
// RENDER INPUT — Corrigido: placeholder vs value
// ============================================================================

function renderInput(input: VoxelInput, lines: string[], indent: string): void {
  const vn = varName(input.id, 'inp');
  const val = `${vn}_value`;

  lines.push(`${indent}-- Input: ${escapeLuaString(input.placeholder)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(input.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(input.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(input.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(input.height)}`);
  lines.push(`${indent}local ${vn}Focused = (activeInput == "${input.id}")`);

  // Border color based on focus
  lines.push(`${indent}local ${vn}Border = ${vn}Focused and theme.primary or theme.border`);

  // Background
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y, ${vn}W, ${vn}H, theme.surfaceAlt, true)`);

  // Border
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y, ${vn}W, 2, ${vn}Border, true)`);

  // Prefix
  if (input.prefix) {
    lines.push(`${indent}dxDrawText("${escapeLuaString(input.prefix)}", ${vn}X + 10, ${vn}Y, ${vn}X + 40, ${vn}Y + ${vn}H, theme.textSecondary, 1.0, "default", "left", "center")`);
  }

  // Value display
  const displayVar = input.masked ? `${vn}_masked` : val;
  if (input.masked) {
    lines.push(`${indent}local ${vn}_masked = string.rep("*", #${val})`);
  }

  const textOffset = input.prefix ? 40 : 10;
  lines.push(`${indent}if ${displayVar} == "" or ${displayVar} == nil then`);
  lines.push(`${indent}    dxDrawText("${escapeLuaString(input.placeholder)}", ${vn}X + ${textOffset}, ${vn}Y, ${vn}X + ${vn}W - ${textOffset}, ${vn}Y + ${vn}H, theme.textMuted, 1.0, "default", "${input.textAlign}", "center")`);
  lines.push(`${indent}else`);
  lines.push(`${indent}    dxDrawText(${displayVar}, ${vn}X + ${textOffset}, ${vn}Y, ${vn}X + ${vn}W - ${textOffset}, ${vn}Y + ${vn}H, theme.text, 1.0, "default", "${input.textAlign}", "center")`);
  lines.push(`${indent}end`);

  // Cursor blink
  lines.push(`${indent}if ${vn}Focused and math.floor(getTickCount() / 500) % 2 == 0 then`);
  const cursorX = input.prefix ? `(${vn}X + 40 + dxGetTextWidth(${displayVar} == "" and "" or ${displayVar}, 1.0, "default"))` : `(${vn}X + 10 + dxGetTextWidth(${displayVar} == "" and "" or ${displayVar}, 1.0, "default"))`;
  lines.push(`${indent}    dxDrawRectangle(${cursorX}, ${vn}Y + 5, 2, ${vn}H - 10, theme.text)`);
  lines.push(`${indent}end`);

  // Suffix
  if (input.suffix) {
    lines.push(`${indent}dxDrawText("${escapeLuaString(input.suffix)}", ${vn}X + ${vn}W - 40, ${vn}Y, ${vn}X + ${vn}W - 10, ${vn}Y + ${vn}H, theme.textSecondary, 1.0, "default", "right", "center")`);
  }

  lines.push('');
}

// ============================================================================
// RENDER TEXT — Completo com rich text, textCase, decoration
// ============================================================================

function renderText(text: VoxelText, lines: string[], indent: string): void {
  const vn = varName(text.id, 'txt');

  lines.push(`${indent}-- Text: ${escapeLuaString(text.text.substring(0, 40))}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(text.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(text.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(text.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(text.height)}`);

  // Apply textCase
  let displayText = escapeLuaString(text.text);
  if (text.textCase === 'upper') {
    lines.push(`${indent}local ${vn}Text = string.upper("${displayText}")`);
  } else if (text.textCase === 'lower') {
    lines.push(`${indent}local ${vn}Text = string.lower("${displayText}")`);
  } else if (text.textCase === 'title') {
    lines.push(`${indent}local ${vn}Text = "${displayText}" -- title case not applied in Lua`);
  } else {
    lines.push(`${indent}local ${vn}Text = "${displayText}"`);
  }

  // Text decoration
  const textColor = `theme.${text.color || 'text'}`;
  const fontFamily = getFontFamily(text.fontFamily || 'default');
  const fontSize = getFontScale(text.fontSize);

  lines.push(`${indent}dxDrawText(${vn}Text, ${vn}X, ${vn}Y, ${vn}X + ${vn}W, ${vn}Y + ${vn}H, ${textColor}, ${fontSize}, ${fontFamily}, "${text.align}", "${text.verticalAlign}", false, false, true)`);

  // Underline
  if (text.textDecoration === 'underline') {
    lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y + ${vn}H - 2, ${vn}W, 1, ${textColor}, true)`);
  }

  // Strikethrough
  if (text.textDecoration === 'strikethrough') {
    lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y + ${vn}H / 2, ${vn}W, 1, ${textColor}, true)`);
  }

  lines.push('');
}

// ============================================================================
// RENDER IMAGE
// ============================================================================

function renderImage(img: VoxelImage, lines: string[], indent: string): void {
  const vn = varName(img.id, 'img');
  lines.push(`${indent}-- Image: ${escapeLuaString(img.src)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(img.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(img.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(img.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(img.height)}`);

  renderEffects(img.effects, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);

  const rotation = img.rotation || 0;
  if (img.downloaded && img.assetUrl) {
    lines.push(`${indent}dxDrawImage(${vn}X, ${vn}Y, ${vn}W, ${vn}H, "${escapeLuaString(img.src)}", ${rotation}, 0, 0, tocolor(255, 255, 255, ${Math.round(img.opacity * 255)}), true)`);
  } else {
    lines.push(`${indent}-- Image not downloaded: ${escapeLuaString(img.src)}`);
    lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y, ${vn}W, ${vn}H, tocolor(100, 100, 100, 100), true)`);
  }
  lines.push('');
}

// ============================================================================
// RENDER SVG
// ============================================================================

function renderSvg(svg: VoxelSvg, lines: string[], indent: string): void {
  const vn = varName(svg.id, 'svg');
  lines.push(`${indent}-- SVG: ${svg.assetPath || 'inline'}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(svg.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(svg.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(svg.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(svg.height)}`);

  if (svg.svgContent) {
    lines.push(`${indent}if svgElements["${svg.id}"] then`);
    lines.push(`${indent}    dxDrawImage(${vn}X, ${vn}Y, ${vn}W, ${vn}H, svgElements["${svg.id}"], 0, 0, 0, tocolor(255, 255, 255, ${Math.round(svg.opacity * 255)}), true)`);
    lines.push(`${indent}end`);
  } else if (svg.assetPath) {
    lines.push(`${indent}dxDrawImage(${vn}X, ${vn}Y, ${vn}W, ${vn}H, "assets/${escapeLuaString(svg.assetPath)}", 0, 0, 0, tocolor(255, 255, 255, ${Math.round(svg.opacity * 255)}), true)`);
  }
  lines.push('');
}

// ============================================================================
// RENDER DROPDOWN
// ============================================================================

function renderDropdown(dd: VoxelDropdown, lines: string[], indent: string): void {
  const vn = varName(dd.id, 'dd');
  lines.push(`${indent}-- Dropdown: ${escapeLuaString(dd.text)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(dd.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(dd.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(dd.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(dd.height)}`);
  lines.push(`${indent}local ${vn}Open = dropdownStates["${dd.id}"]`);

  // Dropdown button
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y, ${vn}W, ${vn}H, theme.surface, true)`);
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y, ${vn}W, 2, theme.border, true)`);
  const selectedText = `dd_${dd.id}_options[dd_${dd.id}_selected] or "${escapeLuaString(dd.text)}"`;
  lines.push(`${indent}dxDrawText(${selectedText}, ${vn}X + 10, ${vn}Y, ${vn}X + ${vn}W - 30, ${vn}Y + ${vn}H, theme.text, 1.0, "default", "left", "center")`);
  lines.push(`${indent}dxDrawText("▼", ${vn}X + ${vn}W - 20, ${vn}Y, ${vn}X + ${vn}W - 5, ${vn}Y + ${vn}H, theme.textSecondary, 1.0, "default", "center", "center")`);

  // Dropdown list
  lines.push(`${indent}if ${vn}Open then`);
  const maxVisible = dd.maxVisible || 6;
  const itemH = 30;
  const listH = Math.min(dd.options.length, maxVisible) * itemH + 4;
  lines.push(`${indent}    -- Dropdown options (${dd.options.length} items)`);
  lines.push(`${indent}    dxDrawRectangle(${vn}X, ${vn}Y + ${vn}H, ${vn}W, ${listH}, theme.surfaceAlt, true)`);
  lines.push(`${indent}    dxDrawRectangle(${vn}X, ${vn}Y + ${vn}H, ${vn}W, 2, theme.border, true)`);

  for (let i = 0; i < dd.options.length; i++) {
    const optY = `${vn}Y + ${vn}H + 2 + ${i * itemH}`;
    lines.push(`${indent}    dxDrawRectangle(${vn}X + 2, ${optY}, ${vn}W - 4, ${itemH}, theme.surface, true)`);
    lines.push(`${indent}    dxDrawText("${escapeLuaString(dd.options[i])}", ${vn}X + 10, ${optY}, ${vn}X + ${vn}W - 10, ${optY} + ${itemH}, theme.text, 1.0, "default", "left", "center")`);
  }

  lines.push(`${indent}end`);
  lines.push('');
}

// ============================================================================
// RENDER CHECKBOX
// ============================================================================

function renderCheckbox(cb: VoxelCheckbox, lines: string[], indent: string): void {
  const vn = varName(cb.id, 'cb');
  const size = Math.min(cb.width, cb.height, 20);
  lines.push(`${indent}-- Checkbox: ${escapeLuaString(cb.text)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(cb.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(cb.y)}`);
  lines.push(`${indent}local ${vn}Checked = checkboxStates["${cb.id}"]`);

  // Box
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y + (${Math.round(cb.height)} - ${size}) / 2, ${size}, ${size}, theme.surface, true)`);
  lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y + (${Math.round(cb.height)} - ${size}) / 2, ${size}, 2, theme.border, true)`);

  // Check mark
  lines.push(`${indent}if ${vn}Checked then`);
  lines.push(`${indent}    dxDrawText("✓", ${vn}X, ${vn}Y + (${Math.round(cb.height)} - ${size}) / 2, ${vn}X + ${size}, ${vn}Y + (${Math.round(cb.height)} - ${size}) / 2 + ${size}, theme.primary, 1.0, "default-bold", "center", "center")`);
  lines.push(`${indent}end`);

  // Text
  lines.push(`${indent}dxDrawText("${escapeLuaString(cb.text)}", ${vn}X + ${size + 8}, ${vn}Y, ${vn}X + ${Math.round(cb.width)}, ${vn}Y + ${Math.round(cb.height)}, theme.text, 1.0, "default", "left", "center")`);
  lines.push('');
}

// ============================================================================
// RENDER RADIO
// ============================================================================

function renderRadio(radio: VoxelRadio, lines: string[], indent: string): void {
  const vn = varName(radio.id, 'rd');
  const size = Math.min(radio.width, radio.height, 20);
  const cx = `${vn}X + ${size / 2}`;
  const cy = `${vn}Y + ${Math.round(radio.height)} / 2`;

  lines.push(`${indent}-- Radio: ${escapeLuaString(radio.text)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(radio.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(radio.y)}`);
  lines.push(`${indent}local ${vn}Selected = radioStates["${radio.id}"]`);

  // Circle
  lines.push(`${indent}dxDrawCircle(${cx}, ${cy}, ${size / 2}, 0, 360, theme.border, 16)`);
  lines.push(`${indent}dxDrawCircle(${cx}, ${cy}, ${size / 2 - 1}, 0, 360, theme.surface, 16)`);

  // Dot
  lines.push(`${indent}if ${vn}Selected then`);
  lines.push(`${indent}    dxDrawCircle(${cx}, ${cy}, ${size / 4}, 0, 360, theme.primary, 12)`);
  lines.push(`${indent}end`);

  // Text
  lines.push(`${indent}dxDrawText("${escapeLuaString(radio.text)}", ${vn}X + ${size + 8}, ${vn}Y, ${vn}X + ${Math.round(radio.width)}, ${vn}Y + ${Math.round(radio.height)}, theme.text, 1.0, "default", "left", "center")`);
  lines.push('');
}

// ============================================================================
// RENDER SWITCH (iOS-style)
// ============================================================================

function renderSwitch(sw: VoxelSwitch, lines: string[], indent: string): void {
  const vn = varName(sw.id, 'sw');
  const trackW = 44;
  const trackH = 24;
  const thumbSize = 20;
  const trackX = `${vn}X + ${Math.round(sw.width)} - ${trackW}`;

  lines.push(`${indent}-- Switch: ${escapeLuaString(sw.text)}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(sw.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(sw.y)}`);
  lines.push(`${indent}local ${vn}Checked = switchStates["${sw.id}"]`);

  // Track
  const activeColor = sw.activeColor ? `tocolor(${parseColorString(sw.activeColor)})` : 'theme.primary';
  lines.push(`${indent}local ${vn}TrackColor = ${vn}Checked and ${activeColor} or theme.border`);
  lines.push(`${indent}dxDrawRectangle(${trackX}, ${vn}Y + (${Math.round(sw.height)} - ${trackH}) / 2, ${trackW}, ${trackH}, ${vn}TrackColor, true)`);

  // Thumb
  const thumbX = `${vn}Checked and ${trackX} + ${trackW - thumbSize} or ${trackX}`;
  lines.push(`${indent}dxDrawCircle(${thumbX} + ${thumbSize / 2}, ${vn}Y + ${Math.round(sw.height)} / 2, ${thumbSize / 2}, 0, 360, theme.text, 12)`);

  // Label
  lines.push(`${indent}dxDrawText("${escapeLuaString(sw.text)}", ${vn}X, ${vn}Y, ${vn}X + ${Math.round(sw.width)} - ${trackW + 8}, ${vn}Y + ${Math.round(sw.height)}, theme.text, 1.0, "default", "left", "center")`);
  lines.push('');
}

// ============================================================================
// RENDER SLIDER
// ============================================================================

function renderSlider(sl: VoxelSlider, lines: string[], indent: string): void {
  const vn = varName(sl.id, 'sl');
  lines.push(`${indent}-- Slider: ${sl.min}-${sl.max}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(sl.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(sl.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(sl.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(sl.height)}`);
  lines.push(`${indent}local ${vn}Value = sliderStates["${sl.id}"] or ${sl.value}`);
  lines.push(`${indent}local ${vn}Ratio = (${vn}Value - ${sl.min}) / (${sl.max} - ${sl.min})`);
  lines.push(`${indent}local ${vn}TrackX = ${vn}X + 10`);

  // Track
  lines.push(`${indent}dxDrawRectangle(${vn}TrackX, ${vn}Y + ${Math.round(sl.height / 2 - 3)}, ${vn}W - 20, 6, theme.surfaceAlt, true)`);
  // Fill
  lines.push(`${indent}dxDrawRectangle(${vn}TrackX, ${vn}Y + ${Math.round(sl.height / 2 - 3)}, (${vn}W - 20) * ${vn}Ratio, 6, theme.primary, true)`);

  // Thumb
  const thumbX = `${vn}TrackX + (${vn}W - 20) * ${vn}Ratio`;
  lines.push(`${indent}dxDrawCircle(${thumbX}, ${vn}Y + ${Math.round(sl.height / 2)}, 8, 0, 360, theme.text, 16)`);

  // Value
  if (sl.showValue) {
    const prefix = sl.prefix || '';
    const suffix = sl.suffix || '';
    lines.push(`${indent}dxDrawText("${escapeLuaString(prefix)}" .. ${vn}Value .. "${escapeLuaString(suffix)}", ${vn}X, ${vn}Y, ${vn}X + ${Math.round(sl.width)}, ${vn}Y + ${Math.round(sl.height)}, theme.text, 1.0, "default", "center", "center")`);
  }
  lines.push('');
}

// ============================================================================
// RENDER PROGRESS
// ============================================================================

function renderProgress(pr: VoxelProgress, lines: string[], indent: string): void {
  const vn = varName(pr.id, 'pr');
  lines.push(`${indent}-- Progress: ${pr.min}-${pr.max}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(pr.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(pr.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(pr.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(pr.height)}`);
  lines.push(`${indent}local ${vn}Value = progressStates["${pr.id}"] or ${pr.value}`);
  lines.push(`${indent}local ${vn}Ratio = math.max(0, math.min(1, (${vn}Value - ${pr.min}) / (${pr.max} - ${pr.min})))`);

  if (pr.variant === 'linear') {
    // Track
    const trackColor = pr.trackColor ? `tocolor(${parseColorString(pr.trackColor)})` : 'theme.surfaceAlt';
    const fillColor = pr.color ? `tocolor(${parseColorString(pr.color)})` : 'theme.primary';
    lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y + ${Math.round(pr.height / 2 - pr.thickness / 2)}, ${vn}W, ${pr.thickness}, ${trackColor}, true)`);
    lines.push(`${indent}dxDrawRectangle(${vn}X, ${vn}Y + ${Math.round(pr.height / 2 - pr.thickness / 2)}, ${vn}W * ${vn}Ratio, ${pr.thickness}, ${fillColor}, true)`);

    if (pr.showLabel) {
      lines.push(`${indent}dxDrawText(${vn}Value, ${vn}X, ${vn}Y, ${vn}X + ${Math.round(pr.width)}, ${vn}Y + ${Math.round(pr.height)}, theme.text, 1.0, "default", "center", "center")`);
    }
  } else {
    // Circular (progress ring)
    const cx = `${vn}X + ${Math.round(pr.width / 2)}`;
    const cy = `${vn}Y + ${Math.round(pr.height / 2)}`;
    const radius = Math.min(Math.round(pr.width / 2), Math.round(pr.height / 2)) - 5;
    const trackColor = pr.trackColor ? `tocolor(${parseColorString(pr.trackColor)})` : 'theme.surfaceAlt';
    const fillColor = pr.color ? `tocolor(${parseColorString(pr.color)})` : 'theme.primary';
    lines.push(`${indent}dxDrawCircle(${cx}, ${cy}, ${radius}, 0, 360, ${trackColor}, 32)`);
    lines.push(`${indent}dxDrawCircle(${cx}, ${cy}, ${radius}, 0, 360 * ${vn}Ratio, ${fillColor}, 32, ${pr.thickness})`);

    if (pr.showLabel) {
      lines.push(`${indent}dxDrawText(math.floor(${vn}Value * 100) .. "%", ${vn}X, ${vn}Y, ${vn}X + ${Math.round(pr.width)}, ${vn}Y + ${Math.round(pr.height)}, theme.text, 1.0, "default-bold", "center", "center")`);
    }
  }
  lines.push('');
}

// ============================================================================
// RENDER TABS
// ============================================================================

function renderTabs(tabs: VoxelTabs, lines: string[], indent: string): void {
  const vn = varName(tabs.id, 'tb');
  lines.push(`${indent}-- Tabs`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(tabs.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(tabs.y)}`);
  lines.push(`${indent}local ${vn}Selected = tabStates["${tabs.id}"] or ${tabs.selectedIndex}`);

  const tabWidth = Math.floor(tabs.width / tabs.tabs.length);
  const tabHeight = 36;

  for (let i = 0; i < tabs.tabs.length; i++) {
    const tabX = `${vn}X + ${i * tabWidth}`;
    const selected = `(${vn}Selected == ${i + 1})`;
    lines.push(`${indent}-- Tab: ${escapeLuaString(tabs.tabs[i].text)}`);
    lines.push(`${indent}dxDrawRectangle(${tabX}, ${vn}Y, ${tabWidth}, ${tabHeight}, ${selected} and theme.primary or theme.surface, true)`);
    lines.push(`${indent}if ${selected} then`);
    lines.push(`${indent}    dxDrawRectangle(${tabX}, ${vn}Y + ${tabHeight - 2}, ${tabWidth}, 2, theme.primary, true)`);
    lines.push(`${indent}end`);
    lines.push(`${indent}dxDrawText("${escapeLuaString(tabs.tabs[i].text)}", ${tabX}, ${vn}Y, ${tabX} + ${tabWidth}, ${vn}Y + ${tabHeight}, theme.text, 1.0, "default", "center", "center")`);
  }
  lines.push('');
}

// ============================================================================
// RENDER TOOLTIP
// ============================================================================

function renderTooltip(tip: VoxelTooltip, lines: string[], indent: string): void {
  const vn = varName(tip.id, 'tip');

  // Tooltip só aparece se o mouse estiver sobre o alvo
  lines.push(`${indent}-- Tooltip: ${escapeLuaString(tip.text)}`);
  // Check if mouse is hovering over target
  lines.push(`${indent}local ${vn}Show = tooltipTimers["${tip.id}"] and (getTickCount() - tooltipTimers["${tip.id}"] > ${tip.delay})`);
  lines.push(`${indent}if ${vn}Show then`);

  // Position based on target
  lines.push(`${indent}    local ${vn}Width = dxGetTextWidth("${escapeLuaString(tip.text)}", 1.0, "default") + 20`);
  lines.push(`${indent}    local ${vn}X = winX + ${Math.round(tip.x)}`);
  lines.push(`${indent}    local ${vn}Y = winY + ${Math.round(tip.y)}`);

  // Background
  lines.push(`${indent}    dxDrawRectangle(${vn}X, ${vn}Y, ${vn}Width, ${Math.round(tip.height)}, theme.surfaceAlt, true)`);
  lines.push(`${indent}    dxDrawRectangle(${vn}X, ${vn}Y, ${vn}Width, 2, theme.primary, true)`);

  // Text
  lines.push(`${indent}    dxDrawText("${escapeLuaString(tip.text)}", ${vn}X + 10, ${vn}Y, ${vn}X + ${vn}Width - 10, ${vn}Y + ${Math.round(tip.height)}, theme.text, 1.0, "default", "left", "center")`);
  lines.push(`${indent}end`);
  lines.push('');
}

// ============================================================================
// RENDER SCROLLVIEW
// ============================================================================

function renderScrollView(sv: VoxelScrollView, lines: string[], indent: string, panelName: string): void {
  const vn = varName(sv.id, 'sv');
  lines.push(`${indent}-- ScrollView`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(sv.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(sv.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(sv.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(sv.height)}`);
  lines.push(`${indent}local ${vn}ScrollX = scrollStates["${sv.id}_x"] or 0`);
  lines.push(`${indent}local ${vn}ScrollY = scrollStates["${sv.id}_y"] or 0`);

  // Clip rect
  lines.push(`${indent}dxSetRenderTarget() -- clip not available, using bounds`);

  // Children would be rendered here with offset
  for (const child of sv.children) {
    const childIndent = indent + '    ';
    const childWithOffset = { ...(child as any), x: (child as any).x - 0, y: (child as any).y - 0 };
    lines.push(`${indent}    -- Scroll child`);
  }

  // Scrollbar
  if (sv.showScrollbar && sv.contentHeight > sv.height) {
    const scrollbarHeight = Math.round((sv.height / sv.contentHeight) * sv.height);
    lines.push(`${indent}if ${sv.contentHeight} > ${sv.height} then`);
    lines.push(`${indent}    dxDrawRectangle(${vn}X + ${vn}W - ${sv.scrollbarWidth}, ${vn}Y, ${sv.scrollbarWidth}, ${vn}H, theme.surfaceAlt, true)`);
    lines.push(`${indent}    dxDrawRectangle(${vn}X + ${vn}W - ${sv.scrollbarWidth}, ${vn}Y + (${vn}ScrollY / ${sv.contentHeight}) * ${sv.height}, ${sv.scrollbarWidth}, ${scrollbarHeight}, theme.border, true)`);
    lines.push(`${indent}end`);
  }
  lines.push('');
}

// ============================================================================
// RENDER GROUP (Auto-layout)
// ============================================================================

function renderGroup(group: VoxelGroup, lines: string[], indent: string): void {
  const vn = varName(group.id, 'grp');
  lines.push(`${indent}-- Group: ${group.id}`);
  lines.push(`${indent}local ${vn}X = winX + ${Math.round(group.x)}`);
  lines.push(`${indent}local ${vn}Y = winY + ${Math.round(group.y)}`);
  lines.push(`${indent}local ${vn}W = ${Math.round(group.width)}`);
  lines.push(`${indent}local ${vn}H = ${Math.round(group.height)}`);

  // Group background if it has fills
  if (group.fills && group.fills.length > 0) {
    renderFills(group.fills, `${vn}X`, `${vn}Y`, `${vn}W`, `${vn}H`, lines, indent);
  }

  // Don't need to render children here — they're rendered separately by the main loop
  lines.push('');
}

// ============================================================================
// HELPERS: hit test, screen vars, font mapping
// ============================================================================

export function generateHitTestCode(): string {
  return `-- Check if mouse is within a rectangle
function isMouseInPosition(x, y, width, height)
    if not isCursorShowing() then return false end
    local cx, cy = getCursorPosition()
    local sx, sy = guiGetScreenSize()
    local cursorX = cx * sx
    local cursorY = cy * sy
    return (cursorX >= x and cursorX <= x + width
        and cursorY >= y and cursorY <= y + height)
end

-- Check if mouse is within a circle
function isMouseInCircle(cx, cy, radius)
    if not isCursorShowing() then return false end
    local mx, my = getCursorPosition()
    local sx, sy = guiGetScreenSize()
    local cursorX = mx * sx
    local cursorY = my * sy
    local dx = cursorX - cx
    local dy = cursorY - cy
    return (dx * dx + dy * dy) <= (radius * radius)
end

-- Get lerp value for animations
function lerp(a, b, t)
    return a + (b - a) * t
end

-- Clamp value
function clamp(val, min, max)
    return math.max(min, math.min(max, val))
end
`;
}

export function generateScreenVars(): string {
  return `-- Screen dimensions
local sx, sy = guiGetScreenSize()

-- Animation tick
local tickCount = getTickCount()
`;
}

// ============================================================================
// HELPERS DE FONTE
// ============================================================================

function getFontFamily(family: string): string {
  const fontMap: Record<string, string> = {
    'default': '"default"',
    'default-bold': '"default-bold"',
    'clear': '"clear"',
    'arial': '"default"',
    'sans-serif': '"default"',
    'serif': '"default"',
    'monospace': '"clear"',
    'consolas': '"clear"',
    'roboto': '"default"',
    'inter': '"default"',
  };
  return fontMap[family.toLowerCase()] || '"default"';
}

function getFontScale(fontSize: number): string {
  if (fontSize <= 10) return '0.8';
  if (fontSize <= 12) return '0.9';
  if (fontSize <= 14) return '1.0';
  if (fontSize <= 16) return '1.1';
  if (fontSize <= 18) return '1.2';
  if (fontSize <= 20) return '1.3';
  if (fontSize <= 24) return '1.5';
  if (fontSize <= 30) return '1.8';
  if (fontSize <= 36) return '2.0';
  return '2.5';
}

function parseColorString(color: string): string {
  // Try to parse hex color (#ff0000) or rgb
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}, 255`;
    }
  }
  return '255, 255, 255, 255';
}