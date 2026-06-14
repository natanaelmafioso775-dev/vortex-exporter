--[[
    Vortex UI Framework — Animation System
    Gerencia animações usando interpolateBetween do MTA
--]]

if not UI then UI = {} end

UI.Animation = {}
local Anim = UI.Animation

local activeAnimations = {}

Anim.easings = {
    linear = "Linear",
    inQuad = "InQuad",
    outQuad = "OutQuad",
    inOutQuad = "InOutQuad",
    outElastic = "OutElastic",
    outBounce = "OutBounce",
    inOutBack = "InOutBack",
}

function Anim.create(props)
    if not props then return end

    local anim = {
        from = props.from or 0,
        to = props.to or 1,
        value = props.from or 0,
        startTime = getTickCount(),
        duration = props.duration or 300,
        easing = props.easing or "OutQuad",
        onUpdate = props.onUpdate,
        onComplete = props.onComplete,
        active = true,
        finished = false,
    }

    table.insert(activeAnimations, anim)
    return anim
end

function Anim.cancel(anim)
    if anim then anim.active = false end
end

function Anim.cancelAll()
    activeAnimations = {}
end

function Anim.update()
    local now = getTickCount()
    local toRemove = {}

    for i, anim in ipairs(activeAnimations) do
        if not anim.active or anim.finished then
            table.insert(toRemove, i)
        else
            local progress = (now - anim.startTime) / anim.duration
            if progress >= 1.0 then
                progress = 1.0
                anim.finished = true
            end

            anim.value = interpolateBetween(anim.from, 0, 0, anim.to, 0, 0, progress, anim.easing)

            if anim.onUpdate then anim.onUpdate(anim.value, progress) end

            if anim.finished and anim.onComplete then
                anim.onComplete()
                table.insert(toRemove, i)
            end
        end
    end

    for i = #toRemove, 1, -1 do
        table.remove(activeAnimations, toRemove[i])
    end
end

function Anim.fadeIn(target, props)
    props = props or {}
    props.from = props.from or 0
    props.to = props.to or 255
    props.onUpdate = function(v)
        if target and target.setAlpha then target:setAlpha(math.floor(v)) end
    end
    return Anim.create(props)
end

function Anim.fadeOut(target, props)
    props = props or {}
    props.from = props.from or (target and target.alpha or 255)
    props.to = 0
    props.onUpdate = function(v)
        if target and target.setAlpha then target:setAlpha(math.floor(v)) end
    end
    return Anim.create(props)
end

function Anim.scale(target, props)
    props = props or {}
    props.from = props.from or 0.8
    props.to = props.to or 1.0
    props.easing = props.easing or "OutBack"
    props.onUpdate = function(v)
        if target then target.scale = v end
    end
    return Anim.create(props)
end