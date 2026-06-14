--[[
    Vortex UI Framework — Math Utilities
    Funções matemáticas auxiliares para UI
--]]

if not UI then UI = {} end

UI.Math = {}

-- Clamp: limita value entre min e max
function UI.Math.clamp(value, min, max)
    if not value or not min or not max then return value end
    if value < min then return min end
    if value > max then return max end
    return value
end

-- Lerp: interpolação linear entre a e b por t (0-1)
function UI.Math.lerp(a, b, t)
    if not a or not b or not t then return a end
    t = UI.Math.clamp(t, 0, 1)
    return a + (b - a) * t
end

-- Map: mapeia um valor de um range para outro
function UI.Math.map(value, fromMin, fromMax, toMin, toMax)
    if not value or not fromMin or not fromMax or not toMin or not toMax then return value end
    local normalized = (value - fromMin) / (fromMax - fromMin)
    return toMin + normalized * (toMax - toMin)
end

-- Round para número de casas decimais
function UI.Math.round(value, decimals)
    decimals = decimals or 0
    local mult = 10 ^ decimals
    return math.floor(value * mult + 0.5) / mult
end

-- Checa se ponto (px, py) está dentro do retângulo (x, y, w, h)
function UI.Math.isPointInRect(px, py, x, y, w, h)
    if not px or not py or not x or not y or not w or not h then return false end
    return px >= x and px <= x + w and py >= y and py <= y + h
end

-- Distância entre dois pontos 2D
function UI.Math.distance(x1, y1, x2, y2)
    local dx = (x2 or 0) - (x1 or 0)
    local dy = (y2 or 0) - (y1 or 0)
    return math.sqrt(dx * dx + dy * dy)
end

-- Verifica igualdade aproximada (evita erros de float)
function UI.Math.approx(a, b, epsilon)
    epsilon = epsilon or 0.001
    return math.abs((a or 0) - (b or 0)) < epsilon
end