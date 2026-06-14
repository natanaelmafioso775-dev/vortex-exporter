--[[
    Vortex UI Framework — Button Component
    Botão clicável com estados (default, hover, pressed, disabled)
    Suporte a animações de hover e clique
--]]

if not UI then UI = {} end

UI.Button = {}
_G.VortexButton = UI.Button
local Button = UI.Button
local Button_mt = { __index = Button }

function Button:new(props)
    props = props or {}

    local instance = {
        text = props.text or "Button",
        width = props.width or 200,
        height = props.height or 50,
        theme = props.theme or "primary", -- "primary" ou "secondary"
        onClick = props.onClick,
        onMouseDown = props.onMouseDown,
        disabled = props.disabled or false,
        animation = props.animation ~= false, -- true por default

        -- Estado
        hovered = false,
        pressed = false,
        focused = false,

        -- Posição (definida no render)
        x = 0, y = 0,
        alpha = 255,
        visible = true,
        zIndex = 2,

        -- Escala para animação hover
        scale = 1.0,
        _targetScale = 1.0,
    }

    setmetatable(instance, Button_mt)
    return instance
end

---- STATE ----

function Button:_getStateColor()
    if self.disabled then
        return UI.Theme.color("surfaceAlt"), UI.Theme.color("textMuted")
    end

    local themeKey = self.theme -- "primary" or "secondary"

    if self.pressed then
        return UI.Theme.color(themeKey .. "Active"), UI.Theme.color("primaryText")
    elseif self.hovered then
        return UI.Theme.color(themeKey .. "Hover"), UI.Theme.color("primaryText")
    else
        return UI.Theme.color(themeKey), UI.Theme.color("primaryText")
    end
end

---- RENDER ----

function Button:render(x, y, containerW, parentAlpha)
    if not self.visible then return end
    if not UI.Renderer or not UI.Theme then return end

    -- Atualiza bounds
    self.x = x or self.x
    self.y = y or self.y
    if containerW and containerW < self.width then
        self.width = containerW
    end

    -- Animação de escala
    if self.animation then
        self._targetScale = self.hovered and 1.02 or 1.0
        self.scale = UI.Math and UI.Math.lerp(self.scale, self._targetScale, 0.15) or self._targetScale
    end

    -- Aplica escala ao redor do centro
    local scale = self.scale
    local scaledW = self.width * scale
    local scaledH = self.height * scale
    local scaledX = self.x + (self.width - scaledW) / 2
    local scaledY = self.y + (self.height - scaledH) / 2

    -- Alpha combinado
    local finalAlpha = math.floor(self.alpha * (parentAlpha or 255) / 255)

    -- Cores por estado
    local bgColor, textColor = self:_getStateColor()
    local fgR, fgG, fgB = fromcolor(bgColor)
    local finalBg = tocolor(fgR, fgG, fgB, finalAlpha)
    local trR, trG, trB = fromcolor(textColor)
    local finalText = tocolor(trR, trG, trB, finalAlpha)

    -- Background arredondado
    UI.Renderer.drawRect(scaledX, scaledY, scaledW, scaledH, finalBg, UI.Theme.radius("md"), false)

    -- Texto centralizado
    UI.Renderer.drawText(self.text, scaledX, scaledY, scaledW, scaledH,
        finalText, 1, "default", "center", "center", false, false, false)
end

---- HIT TEST ----

function Button:hitTest(px, py)
    if not self.visible or self.disabled then return false end
    return UI.Math and UI.Math.isPointInRect(px, py, self.x, self.y, self.width, self.height)
end

---- EVENTS ----

function Button:onMouseEnter()
    self.hovered = true
end

function Button:onMouseLeave()
    self.hovered = false
    self.pressed = false
end

function Button:onMouseDown(mx, my)
    if self.disabled then return end
    self.pressed = true
end

function Button:onMouseUp(mx, my)
    if self.disabled then return end
    if self.pressed and self.onClick then
        self.onClick(self)
    end
    self.pressed = false
end

function Button:onClick(mx, my)
    -- delegado para onMouseUp internamente
end

---- METHODS ----

function Button:setText(text)
    self.text = text or ""
end

function Button:setEnabled(enabled)
    self.disabled = not enabled
    if self.disabled then
        self.hovered = false
        self.pressed = false
    end
end

function Button:setOnClick(callback)
    self.onClick = callback
end

setmetatable(Button, {
    __call = function(_, props)
        return Button:new(props)
    end
})