--[[
    Vortex UI Framework — Renderer
    Wrapper sobre dxDraw* com suporte a border-radius simulado
--]]

if not UI then UI = {} end

UI.Renderer = {}
local Rnd = UI.Renderer

-- Desenha retângulo com borda arredondada simulada via dxDrawCircle
function Rnd.drawRect(x, y, w, h, color, radius, postGUI)
    if not x or not y or not w or not h or not color then return end
    postGUI = postGUI ~= false
    local r = radius or 0

    if r <= 0 then
        dxDrawRectangle(x, y, w, h, color, postGUI)
        return
    end

    -- Corpo principal
    dxDrawRectangle(x + r, y, w - 2 * r, h, color, postGUI)
    dxDrawRectangle(x, y + r, r, h - 2 * r, color, postGUI)
    dxDrawRectangle(x + w - r, y + r, r, h - 2 * r, color, postGUI)

    -- Cantos
    dxDrawCircle(x + r, y + r, r, 180, 270, color, color, 16, 1, postGUI)
    dxDrawCircle(x + w - r, y + r, r, 270, 360, color, color, 16, 1, postGUI)
    dxDrawCircle(x + w - r, y + h - r, r, 0, 90, color, color, 16, 1, postGUI)
    dxDrawCircle(x + r, y + h - r, r, 90, 180, color, color, 16, 1, postGUI)
end

-- Desenha borda de retângulo (contorno)
function Rnd.drawBorder(x, y, w, h, color, thickness, radius, postGUI)
    if not x or not y or not w or not h or not color then return end
    local t = thickness or 1
    postGUI = postGUI ~= false
    local r = radius or 0

    if r <= 0 then
        dxDrawRectangle(x, y, w, t, color, postGUI)
        dxDrawRectangle(x, y + h - t, w, t, color, postGUI)
        dxDrawRectangle(x, y, t, h, color, postGUI)
        dxDrawRectangle(x + w - t, y, t, h, color, postGUI)
        return
    end

    dxDrawRectangle(x + r, y, w - 2 * r, t, color, postGUI)
    dxDrawRectangle(x + r, y + h - t, w - 2 * r, t, color, postGUI)
    dxDrawRectangle(x, y + r, t, h - 2 * r, color, postGUI)
    dxDrawRectangle(x + w - t, y + r, t, h - 2 * r, color, postGUI)

    dxDrawCircle(x + r, y + r, r, 180, 270, color, color, 16, t, postGUI)
    dxDrawCircle(x + w - r, y + r, r, 270, 360, color, color, 16, t, postGUI)
    dxDrawCircle(x + w - r, y + h - r, r, 0, 90, color, color, 16, t, postGUI)
    dxDrawCircle(x + r, y + h - r, r, 90, 180, color, color, 16, t, postGUI)
end

-- Desenha texto
function Rnd.drawText(text, x, y, w, h, color, scale, font, alignX, alignY, clip, wordBreak, postGUI)
    if not text or text == "" or not x or not y then return end
    postGUI = postGUI ~= false
    dxDrawText(text, x, y, (w and x + w) or x + 100, (h and y + h) or y + 20,
        color or tocolor(255, 255, 255, 255), scale or 1, font or "default",
        alignX or "left", alignY or "top", clip or false, wordBreak or false, postGUI)
end

-- Desenha imagem
function Rnd.drawImage(image, x, y, w, h, rotation, color, postGUI)
    if not image or not x or not y or not w or not h then return end
    postGUI = postGUI ~= false
    dxDrawImage(x, y, w, h, image, rotation or 0, 0, 0, color or tocolor(255, 255, 255, 255), postGUI)
end

-- Desenha linha
function Rnd.drawLine(x1, y1, x2, y2, color, width, postGUI)
    if not x1 or not y1 or not x2 or not y2 or not color then return end
    dxDrawLine(x1, y1, x2, y2, color, width or 1, postGUI ~= false)
end

-- Desenha círculo
function Rnd.drawCircle(x, y, radius, color, postGUI)
    if not x or not y or not radius or not color then return end
    dxDrawCircle(x, y, radius, 0, 360, color, color, 32, 1, postGUI ~= false)
end

-- Alinha filho dentro do container
function Rnd.alignChild(parentX, parentW, childW, align, padding)
    padding = padding or 0
    childW = childW or 0
    if align == "center" then return parentX + (parentW - childW) / 2
    elseif align == "right" then return parentX + parentW - childW - padding
    else return parentX + padding end
end

-- Largura de texto
function Rnd.getTextWidth(text, scale, font)
    return dxGetTextWidth(text or "", scale or 1, font or "default")
end

-- Altura de fonte
function Rnd.getFontHeight(scale, font)
    return dxGetFontHeight(scale or 1, font or "default")
end