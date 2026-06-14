// ============================================================================
// Animation Generator — Gera animações PREMIUM para MTA:SA DX
// Suporta: Spring, Bounce, Elastic, Keyframe, Stagger, Easing personalizados
// ============================================================================

import { VoxelComponent, AnimationType, AnimationTrigger, EasingType, AnimationProperty } from '../types/internal';

export interface AnimationConfig {
  id: string;
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number;
  delay: number;
  easing: EasingType;
  properties: AnimationProperty[];
  stagger?: number;
  loop: boolean;
  yoyo: boolean;
}

// ============================================================================
// GERADOR PRINCIPAL DE ANIMAÇÕES
// ============================================================================

export function generateAnimationCode(components: VoxelComponent[]): string {
  const lines: string[] = [];

  const animatedComponents = components.filter((c) => c.animation && c.animation !== 'none');
  if (animatedComponents.length === 0) return '';

  lines.push('--============================================================================');
  lines.push('-- PREMIUM ANIMATION SYSTEM');
  lines.push('--============================================================================');
  lines.push('');

  // Animation state table
  lines.push('-- Animation state storage');
  lines.push('local animations = {}');
  lines.push('local animTick = getTickCount()');
  lines.push('');

  // ========================================================================
  // GENERATE EASING FUNCTIONS
  // ========================================================================
  lines.push('--============================================================================');
  lines.push('-- EASING FUNCTIONS — Todas as curvas de easing');
  lines.push('--============================================================================');
  lines.push('');

  // Linear
  lines.push('function easeLinear(t) return t end');
  lines.push('');

  // Quad
  lines.push('function easeInQuad(t) return t * t end');
  lines.push('function easeOutQuad(t) return t * (2 - t) end');
  lines.push('function easeInOutQuad(t) return t < 0.5 and 2 * t * t or -1 + (4 - 2 * t) * t end');
  lines.push('');

  // Cubic
  lines.push('function easeInCubic(t) return t * t * t end');
  lines.push('function easeOutCubic(t) return (t - 1) ^ 3 + 1 end');
  lines.push('function easeInOutCubic(t) return t < 0.5 and 4 * t * t * t or (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 end');
  lines.push('');

  // Quart
  lines.push('function easeInQuart(t) return t * t * t * t end');
  lines.push('function easeOutQuart(t) return 1 - (t - 1) ^ 4 end');
  lines.push('function easeInOutQuart(t) return t < 0.5 and 8 * t * t * t * t or 1 - 8 * (t - 1) ^ 4 end');
  lines.push('');

  // Quint
  lines.push('function easeInQuint(t) return t * t * t * t * t end');
  lines.push('function easeOutQuint(t) return 1 + (t - 1) ^ 5 end');
  lines.push('function easeInOutQuint(t) return t < 0.5 and 16 * t ^ 5 or 1 + 16 * (t - 1) ^ 5 end');
  lines.push('');

  // Sine
  lines.push('function easeInSine(t) return 1 - math.cos(t * math.pi / 2) end');
  lines.push('function easeOutSine(t) return math.sin(t * math.pi / 2) end');
  lines.push('function easeInOutSine(t) return -(math.cos(math.pi * t) - 1) / 2 end');
  lines.push('');

  // Back
  lines.push('function easeInBack(t) local c1 = 1.70158; local c3 = c1 + 1; return c3 * t ^ 3 - c1 * t * t end');
  lines.push('function easeOutBack(t) local c1 = 1.70158; local c3 = c1 + 1; return 1 + c3 * (t - 1) ^ 3 + c1 * (t - 1) ^ 2 end');
  lines.push('function easeInOutBack(t) local c1 = 1.70158; local c2 = c1 * 1.525; return t < 0.5 and ((2 * t) ^ 2 * ((c2 + 1) * 2 * t - c2)) / 2 or ((2 * t - 2) ^ 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2 end');
  lines.push('');

  // Elastic
  lines.push('function easeInElastic(t) local c4 = (2 * math.pi) / 3; if t == 0 then return 0 elseif t == 1 then return 1 else return -(2 ^ (10 * t - 10)) * math.sin((t * 10 - 10.75) * c4) end end');
  lines.push('function easeOutElastic(t) local c4 = (2 * math.pi) / 3; if t == 0 then return 0 elseif t == 1 then return 1 else return 2 ^ (-10 * t) * math.sin((t * 10 - 0.75) * c4) + 1 end end');
  lines.push('function easeInOutElastic(t) local c5 = (2 * math.pi) / 4.5; if t == 0 then return 0 elseif t == 1 then return 1 elseif t < 0.5 then return -(2 ^ (20 * t - 10) * math.sin((20 * t - 11.125) * c5)) / 2 else return (2 ^ (-20 * t + 10) * math.sin((20 * t - 11.125) * c5)) / 2 + 1 end end');
  lines.push('');

  // Bounce
  lines.push('function easeOutBounce(t) local n1 = 7.5625; local d1 = 2.75; if t < 1 / d1 then return n1 * t * t elseif t < 2 / d1 then t = t - 1.5 / d1; return n1 * t * t + 0.75 elseif t < 2.5 / d1 then t = t - 2.25 / d1; return n1 * t * t + 0.9375 else t = t - 2.625 / d1; return n1 * t * t + 0.984375 end end');
  lines.push('function easeInBounce(t) return 1 - easeOutBounce(1 - t) end');
  lines.push('function easeInOutBounce(t) return t < 0.5 and (1 - easeOutBounce(1 - 2 * t)) / 2 or (1 + easeOutBounce(2 * t - 1)) / 2 end');
  lines.push('');

  // SPRING — Simulação física realista
  lines.push('-- SPRING PHYSICS — Simulação de mola realista');
  lines.push('function createSpring(mass, stiffness, damping)');
  lines.push('    return { mass = mass or 1, stiffness = stiffness or 200, damping = damping or 15, velocity = 0, position = 0, target = 1 }');
  lines.push('end');
  lines.push('');
  lines.push('function updateSpring(spring, dt)');
  lines.push('    local displacement = spring.position - spring.target');
  lines.push('    local force = -spring.stiffness * displacement - spring.damping * spring.velocity');
  lines.push('    local acceleration = force / spring.mass');
  lines.push('    spring.velocity = spring.velocity + acceleration * dt');
  lines.push('    spring.position = spring.position + spring.velocity * dt');
  lines.push('    if math.abs(displacement) < 0.001 and math.abs(spring.velocity) < 0.001 then');
  lines.push('        spring.position = spring.target');
  lines.push('        spring.velocity = 0');
  lines.push('    end');
  lines.push('    return spring.position');
  lines.push('end');
  lines.push('');

  // ========================================================================
  // GENERATE EASING DISPATCHER
  // ========================================================================
  lines.push('-- Easing dispatcher');
  lines.push('function applyEasing(t, easingType)');
  lines.push('    local easings = {');
  lines.push('        ["linear"] = easeLinear,');
  lines.push('        ["ease"] = easeOutQuad,');
  lines.push('        ["ease-in"] = easeInQuad,');
  lines.push('        ["ease-out"] = easeOutQuad,');
  lines.push('        ["ease-in-out"] = easeInOutQuad,');
  lines.push('        ["in-quad"] = easeInQuad,');
  lines.push('        ["out-quad"] = easeOutQuad,');
  lines.push('        ["in-out-quad"] = easeInOutQuad,');
  lines.push('        ["in-cubic"] = easeInCubic,');
  lines.push('        ["out-cubic"] = easeOutCubic,');
  lines.push('        ["in-out-cubic"] = easeInOutCubic,');
  lines.push('        ["in-quart"] = easeInQuart,');
  lines.push('        ["out-quart"] = easeOutQuart,');
  lines.push('        ["in-out-quart"] = easeInOutQuart,');
  lines.push('        ["in-quint"] = easeInQuint,');
  lines.push('        ["out-quint"] = easeOutQuint,');
  lines.push('        ["in-out-quint"] = easeInOutQuint,');
  lines.push('        ["in-sine"] = easeInSine,');
  lines.push('        ["out-sine"] = easeOutSine,');
  lines.push('        ["in-out-sine"] = easeInOutSine,');
  lines.push('        ["in-back"] = easeInBack,');
  lines.push('        ["out-back"] = easeOutBack,');
  lines.push('        ["in-out-back"] = easeInOutBack,');
  lines.push('        ["in-elastic"] = easeInElastic,');
  lines.push('        ["out-elastic"] = easeOutElastic,');
  lines.push('        ["in-out-elastic"] = easeInOutElastic,');
  lines.push('        ["in-bounce"] = easeInBounce,');
  lines.push('        ["out-bounce"] = easeOutBounce,');
  lines.push('        ["in-out-bounce"] = easeInOutBounce,');
  lines.push('    }');
  lines.push('    local fn = easings[easingType] or easeLinear');
  lines.push('    return fn(t)');
  lines.push('end');
  lines.push('');

  // ========================================================================
  // INITIALIZE ANIMATIONS FOR EACH COMPONENT
  // ========================================================================
  lines.push('--============================================================================');
  lines.push('-- Animation instances');
  lines.push('--============================================================================');
  lines.push('');

  for (const comp of animatedComponents) {
    const animType = comp.animation || 'none';
    const animId = comp.id;
    const duration = getDurationForType(animType);
    const delay = getDelayForType(animType);
    const easing = getEasingForType(animType);

    lines.push(`-- ${comp.type}: ${animType} (${duration}ms, ${delay}ms delay)`);
    lines.push(`animations["${animId}"] = {`);
    lines.push(`    type = "${animType}",`);
    lines.push(`    duration = ${duration},`);
    lines.push(`    delay = ${delay},`);
    lines.push(`    elapsed = 0,`);
    lines.push(`    startTime = animTick + ${delay},`);
    lines.push(`    progress = 0,`);
    lines.push(`    value = 0,`);
    lines.push(`    direction = 1,`);
    lines.push(`    loop = ${isLoopType(animType) ? 'true' : 'false'},`);
    lines.push(`    yoyo = ${isYoyoType(animType) ? 'true' : 'false'},`);
    lines.push(`    finished = false,`);
    lines.push(`    easing = "${easing}",`);
    lines.push('}');

    // Spring physics setup
    if (animType === 'spring') {
      lines.push(`animations["${animId}"].spring = createSpring(1, 200, 15)`);
    }

    lines.push('');
  }

  // ========================================================================
  // ANIMATION UPDATE LOOP
  // ========================================================================
  lines.push('--============================================================================');
  lines.push('-- Animation update (on each frame)');
  lines.push('--============================================================================');
  lines.push('');
  lines.push('addEventHandler("onClientRender", root, function()');
  lines.push('    local now = getTickCount()');
  lines.push('    local dt = math.min((now - animTick) / 1000, 0.1) -- delta time in seconds, capped');
  lines.push('    animTick = now');
  lines.push('');
  lines.push('    for id, anim in pairs(animations) do');
  lines.push('        if anim.finished and not anim.loop then');
  lines.push('            continue');
  lines.push('        end');
  lines.push('');
  lines.push('        if now < anim.startTime then');
  lines.push('            anim.progress = 0');
  lines.push('            anim.value = 0');
  lines.push('            continue');
  lines.push('        end');
  lines.push('');
  lines.push('        anim.elapsed = now - anim.startTime');
  lines.push('        local t = math.min(anim.elapsed / anim.duration, 1)');
  lines.push('        anim.progress = t');
  lines.push('');

  // Spring
  lines.push('        if anim.type == "spring" then');
  lines.push('            updateSpring(anim.spring, dt)');
  lines.push('            anim.value = anim.spring.position');
  lines.push('            if anim.spring.position >= 1 and anim.spring.velocity == 0 then');
  lines.push('                anim.finished = true');
  lines.push('                anim.value = 1');
  lines.push('            end');
  lines.push('        else');
  // Regular easing
  lines.push('            local eased = applyEasing(t, anim.easing)');
  lines.push('            anim.value = eased');
  lines.push('');
  lines.push('            if t >= 1 then');
  lines.push('                if anim.yoyo then');
  lines.push('                    anim.direction = anim.direction * -1');
  lines.push('                    anim.startTime = now');
  lines.push('                    anim.elapsed = 0');
  lines.push('                elseif anim.loop then');
  lines.push('                    anim.startTime = now');
  lines.push('                    anim.elapsed = 0');
  lines.push('                else');
  lines.push('                    anim.finished = true');
  lines.push('                    anim.value = 1');
  lines.push('                end');
  lines.push('            end');
  lines.push('        end');
  lines.push('    end');
  lines.push('end)');
  lines.push('');

  // ========================================================================
  // ANIMATION APPLICATION HELPERS
  // ========================================================================
  lines.push('--============================================================================');
  lines.push('-- Animation application functions');
  lines.push('--============================================================================');
  lines.push('');

  // Get animation value for a component
  lines.push('-- Get animation value (0-1) for a component');
  lines.push('function getAnimValue(componentId)');
  lines.push('    local anim = animations[componentId]');
  lines.push('    if not anim then return 0 end');
  lines.push('    return anim.value');
  lines.push('end');
  lines.push('');

  // Get animation alpha (for fade effects)
  lines.push('-- Get animation alpha for fade effects');
  lines.push('function getAnimAlpha(componentId)');
  lines.push('    local anim = animations[componentId]');
  lines.push('    if not anim then return 255 end');
  lines.push('');
  lines.push('    if anim.type == "fadeIn" then');
  lines.push('        return math.floor(anim.value * 255)');
  lines.push('    elseif anim.type == "fadeOut" then');
  lines.push('        return math.floor((1 - anim.value) * 255)');
  lines.push('    end');
  lines.push('');
  lines.push('    return 255');
  lines.push('end');
  lines.push('');

  // Apply animation transform (position, scale, rotation)
  lines.push('-- Apply animation transform to a component');
  lines.push('function applyAnimTransform(componentId, baseX, baseY, baseW, baseH)');
  lines.push('    local anim = animations[componentId]');
  lines.push('    if not anim then return baseX, baseY, baseW, baseH, 0 end');
  lines.push('');
  lines.push('    local x, y, w, h = baseX, baseY, baseW, baseH');
  lines.push('    local rot = 0');
  lines.push('    local v = anim.value');
  lines.push('    local scale = 1');
  lines.push('');
  lines.push('    if anim.type == "fadeIn" or anim.type == "fadeOut" then');
  lines.push('        -- Alpha handled separately');
  lines.push('');
  lines.push('    elseif anim.type == "slideLeft" then');
  lines.push('        x = x - (1 - v) * baseW');
  lines.push('');
  lines.push('    elseif anim.type == "slideRight" then');
  lines.push('        x = x + (1 - v) * baseW');
  lines.push('');
  lines.push('    elseif anim.type == "slideUp" then');
  lines.push('        y = y - (1 - v) * baseH');
  lines.push('');
  lines.push('    elseif anim.type == "slideDown" then');
  lines.push('        y = y + (1 - v) * baseH');
  lines.push('');
  lines.push('    elseif anim.type == "scaleIn" then');
  lines.push('        scale = 0.5 + v * 0.5');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('        y = baseY - (h - baseH) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "scaleOut" then');
  lines.push('        scale = 1 + (1 - v) * 0.5');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('        y = baseY - (h - baseH) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "zoomIn" then');
  lines.push('        scale = v * v');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('        y = baseY - (h - baseH) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "zoomOut" then');
  lines.push('        scale = 2 - v');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('        y = baseY - (h - baseH) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "spring" then');
  lines.push('        scale = 0.8 + v * 0.2');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('        y = baseY - (h - baseH) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "bounce" then');
  lines.push('        scale = 1 - (1 - v) * 0.3');
  lines.push('        y = baseY - (1 - v) * 15');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "elastic" then');
  lines.push('        scale = 0.7 + v * 0.3');
  lines.push('        w = baseW * scale');
  lines.push('        h = baseH * scale');
  lines.push('        x = baseX - (w - baseW) / 2');
  lines.push('        y = baseY - (h - baseH) / 2');
  lines.push('');
  lines.push('    elseif anim.type == "rotate" then');
  lines.push('        rot = v * 360');
  lines.push('    end');
  lines.push('');
  lines.push('    return x, y, w, h, rot');
  lines.push('end');
  lines.push('');

  // Hover scale
  lines.push('-- Get hover scale factor');
  lines.push('function getHoverScale(componentId, baseScale)');
  lines.push('    local anim = animations[componentId]');
  lines.push('    if anim and anim.type == "hoverScale" then');
  lines.push('        return baseScale + (anim.value * 0.05)');
  lines.push('    end');
  lines.push('    return baseScale');
  lines.push('end');
  lines.push('');

  // Stagger animation trigger
  lines.push('-- Trigger stagger animation sequence');
  lines.push('function staggerAnimate(componentIds, delay)');
  lines.push('    for i, id in ipairs(componentIds) do');
  lines.push('        local anim = animations[id]');
  lines.push('        if anim then');
  lines.push('            anim.startTime = getTickCount() + (i - 1) * (delay or 50)');
  lines.push('            anim.finished = false');
  lines.push('            anim.elapsed = 0');
  lines.push('            anim.value = 0');
  lines.push('        end');
  lines.push('    end');
  lines.push('end');
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// HOVER ANIMATION GENERATOR
// ============================================================================

export function generateHoverAnimationCode(): string {
  return `-- Hover scale animation for buttons
function startHoverAnim(componentId)
    local anim = animations[componentId]
    if anim and anim.type == "hoverScale" then
        anim.startTime = getTickCount()
        anim.finished = false
        anim.value = 0
        anim.direction = 1
    end
end

function stopHoverAnim(componentId)
    local anim = animations[componentId]
    if anim and anim.type == "hoverScale" then
        anim.startTime = getTickCount()
        anim.finished = false
        anim.value = 1
        anim.direction = -1
    end
end
`;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDurationForType(animType: string): number {
  switch (animType) {
    case 'fadeIn': return 300;
    case 'fadeOut': return 300;
    case 'slideLeft': return 400;
    case 'slideRight': return 400;
    case 'slideUp': return 400;
    case 'slideDown': return 400;
    case 'scaleIn': return 350;
    case 'scaleOut': return 350;
    case 'zoomIn': return 500;
    case 'zoomOut': return 500;
    case 'hoverScale': return 200;
    case 'hoverColor': return 200;
    case 'spring': return 800;
    case 'bounce': return 600;
    case 'elastic': return 700;
    case 'rotate': return 500;
    case 'keyframe': return 1000;
    default: return 300;
  }
}

function getDelayForType(animType: string): number {
  switch (animType) {
    case 'spring': return 100;
    case 'bounce': return 100;
    case 'elastic': return 100;
    default: return 0;
  }
}

function getEasingForType(animType: string): string {
  switch (animType) {
    case 'fadeIn': return 'ease-out';
    case 'fadeOut': return 'ease-in';
    case 'slideLeft': return 'ease-out';
    case 'slideRight': return 'ease-out';
    case 'slideUp': return 'ease-out';
    case 'slideDown': return 'ease-out';
    case 'scaleIn': return 'out-back';
    case 'scaleOut': return 'in-back';
    case 'zoomIn': return 'out-quart';
    case 'zoomOut': return 'in-quart';
    case 'hoverScale': return 'ease-out';
    case 'bounce': return 'out-bounce';
    case 'elastic': return 'out-elastic';
    case 'rotate': return 'linear';
    case 'keyframe': return 'linear';
    default: return 'ease-out';
  }
}

function isLoopType(animType: string): boolean {
  return animType === 'rotate' || animType === 'hoverScale';
}

function isYoyoType(animType: string): boolean {
  return animType === 'hoverScale' || animType === 'hoverColor';
}