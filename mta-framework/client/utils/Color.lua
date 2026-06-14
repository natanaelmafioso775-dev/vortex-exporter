--[[
    Vortex UI Framework — Color Utilities
    Gerencia cores com suporte a hex, rgba e tokens de tema
--]]

if not UI then UI = {} end

UI.Color = {}
local Color = UI.Color

-- Cache de cores já convertidas
local colorCache = {}

-- Converte hex (#RRGGBB ou #RRGGBBAA)
function Color.hex(hex)
    if not hex then return tocolor(255, 255, 255, 255) end
    if colorCache[hex] then return colorCache[hex] end

    local r, g, b, a = 255, 255, 255, 255
    local h = hex:gsub("#", "")

    if #h == 6 then
        r = tonumber(h:sub(1, 2), 16) or 255
        g = tonumber(h:sub(3, 4), 16) or 255
        b = tonumber(h:sub(5, 6), 16) or 255
    elseif #h == 8 then
        r = tonumber(h:sub(1, 2), 16) or 255
        g = tonumber(h:sub(3, 4), 16) or 255
        b = tonumber(h:sub(5, 6), 16) or 255
        a = tonumber(h:sub(7, 8), 16) or 255
    end

    local col = tocolor(r, g, b, a)
    colorCache[hex] = col
    return col
end

function Color.rgba(r, g, b, a)
    return tocolor(r or 255, g or 255, b or 255, a or 255)
end

function Color.withAlpha(col, alpha)
    if not col then return tocolor(255, 255, 255, alpha or 255) end
    local r, g, b = fromcolor(col)
    return tocolor(r, g, b, alpha or 255)
end

function Color.clearCache()
    colorCache = {}
end