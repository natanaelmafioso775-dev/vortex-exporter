--[[
    Vortex UI Framework — Text Component
    Label de texto simples com suporte a alinhamento e word break
--]]

if not UI then UI = {} end

UI.Text = {}
_G.VortexText = UI.Text
local Text = UI.Text
local Text_mt = { __index = Text }

function Text:new(props)
    props = props or {}

    local instance = {
        text = props.text or "",
        -- Cor: string (token) ou tocolor direto
        _color = props.color or "textPrimary",
        scale = props.scale or 1,
        font = props.font or "default",
        alignX = props.alignX or "left",
        alignY = props.alignY or "center",
        wordBreak = props.wordBreak or false,
        clip = props.clip or false,

        -- Dimensões
        width = props.width or 0,
        height = props.height or 0,

        -- Posição
        x = 0, y = 0,
        alpha = 255,
        visible = true,
    }

    setmetatable(instance, Text_mt)
    return instance
end

---- RESOLVE COLOR ----

function Text:_resolveColor(parentAlpha)
    local col
    if type(self._color) == "string" and UI.Theme then
        col = UI.Theme.color(self._color)
    else
        col = self._color
    end

    if not col then
        col = tocolor(255, 255, 255, 255)
    end

    local finalAlpha = math.floor(self.alpha * (parentAlpha or 255) / 255)
    local r, g, b = fromcolor(col)
    return tocolor(r, g, b, finalAlpha)
end

---- RENDER ----

function Text:render(x, y, w, parentAlpha)
    if not self.visible then return end
    if not UI.Renderer then return end
    if self.text == "" then return end

    self.x = x or self.x
    self.y = y or self.y

    local renderW = w or self.width or 200
    local renderH = self.height or UI.Renderer.getFontHeight(self.scale, self.font) + 4
    local color = self:_resolveColor(parentAlpha)

    UI.Renderer.drawText(
        self.text,
        self.x, self.y,
        renderW, renderH,
        color, self.scale, self.font,
        self.alignX, self.alignY,
        self.clip, self.wordBreak, false
    )
end

---- HIT TEST ----

function Text:hitTest(px, py)
    return false -- não interativo por padrão
end

---- METHODS ----

function Text:setText(text)
    self.text = text or ""
end

function Text:getText()
    return self.text
end

function Text:setColor(color)
    self._color = color
end

setmetatable(Text, {
    __call = function(_, props)
        return Text:new(props)
    end
})