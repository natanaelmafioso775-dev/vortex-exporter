--[[
    Vortex UI Framework — Responsive System
    Ancoragem e escala automática baseada na resolução
--]]

if not UI then UI = {} end

UI.Responsive = {}
local R = UI.Responsive

local baseWidth = 1920
local baseHeight = 1080
local screenX, screenY = guiGetScreenSize()

function R.update()
    screenX, screenY = guiGetScreenSize()
end

function R.setBase(w, h)
    baseWidth = w or 1920
    baseHeight = h or 1080
end

function R.scaleX()
    return screenX / baseWidth
end

function R.scaleY()
    return screenY / baseHeight
end

function R.scale()
    return math.min(R.scaleX(), R.scaleY())
end

function R.x(value)
    if not value then return 0 end
    return value * R.scaleX()
end

function R.y(value)
    if not value then return 0 end
    return value * R.scaleY()
end

function R.s(value)
    if not value then return 0 end
    return value * R.scale()
end

function R.anchor(anchor, elementWidth, elementHeight)
    anchor = anchor or "center"
    local w = R.s(elementWidth or 0)
    local h = R.s(elementHeight or 0)

    local positions = {
        ["center"]       = { (screenX - w) / 2, (screenY - h) / 2 },
        ["top-left"]     = { 0, 0 },
        ["top-right"]    = { screenX - w, 0 },
        ["bottom-left"]  = { 0, screenY - h },
        ["bottom-right"] = { screenX - w, screenY - h },
        ["top"]          = { (screenX - w) / 2, 0 },
        ["bottom"]       = { (screenX - w) / 2, screenY - h },
        ["left"]         = { 0, (screenY - h) / 2 },
        ["right"]        = { screenX - w, (screenY - h) / 2 },
    }

    local pos = positions[anchor]
    if pos then return pos[1], pos[2] end
    return 0, 0
end

function R.getScreenSize()
    return screenX, screenY
end