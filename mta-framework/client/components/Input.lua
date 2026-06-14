--[[
    Vortex UI Framework — Input Component
    Campo de texto com suporte a placeholder, senha, cursor piscante
    Estados: default, focused, hovered
--]]

if not UI then UI = {} end

UI.Input = {}
_G.VortexInput = UI.Input
local Input = UI.Input
local Input_mt = { __index = Input }

function Input:new(props)
    props = props or {}

    local instance = {
        placeholder = props.placeholder or "",
        value = props.value or "",
        password = props.password or false,
        maxLength = props.maxLength or 64,
        width = props.width or 300,
        height = props.height or 44,
        onChange = props.onChange,
        onSubmit = props.onSubmit,

        -- Estado
        focused = false,
        hovered = false,

        -- Caret
        caretPos = #(props.value or ""),
        _caretTick = 0,
        _caretVisible = true,

        -- Scroll horizontal
        _scrollOffset = 0,

        -- Posição
        x = 0, y = 0,
        alpha = 255,
        visible = true,
        zIndex = 3,
    }

    setmetatable(instance, Input_mt)
    return instance
end

---- RENDER ----

function Input:render(x, y, containerW, parentAlpha)
    if not self.visible then return end
    if not UI.Renderer or not UI.Theme then return end

    self.x = x or self.x
    self.y = y or self.y
    if containerW and containerW < self.width then
        self.width = containerW
    end

    local w = self.width
    local h = self.height
    local finalAlpha = math.floor(self.alpha * (parentAlpha or 255) / 255)

    -- Background
    local bgRaw = UI.Theme.color("inputBackground")
    local bgR, bgG, bgB = fromcolor(bgRaw)
    local bgColor = tocolor(bgR, bgG, bgB, finalAlpha)
    UI.Renderer.drawRect(self.x, self.y, w, h, bgColor, UI.Theme.radius("md"), false)

    -- Border
    local borderColor
    if self.focused then
        borderColor = UI.Theme.color("borderFocus")
    elseif self.hovered then
        borderColor = UI.Theme.color("textSecondary")
    else
        borderColor = UI.Theme.color("border")
    end
    local brR, brG, brB = fromcolor(borderColor)
    local finalBorder = tocolor(brR, brG, brB, finalAlpha)
    UI.Renderer.drawBorder(self.x, self.y, w, h, finalBorder, 1, UI.Theme.radius("md"), false)

    -- Texto ou placeholder
    local textX = self.x + UI.Theme.spacing("md")
    local textY = self.y
    local textW = w - UI.Theme.spacing("md") * 2

    if self.value ~= "" then
        -- Mostrar valor (ou bullets se password)
        local displayText = self.value
        if self.password then
            displayText = string.rep("•", #self.value)
        end

        -- Scroll horizontal se o texto exceder a largura
        local textPixelWidth = UI.Renderer.getTextWidth(displayText, 1, "default")
        self._scrollOffset = math.max(0, math.min(self._scrollOffset, textPixelWidth - textW + 10))

        local textRaw = UI.Theme.color("textPrimary")
        local trR, trG, trB = fromcolor(textRaw)
        local finalTextColor = tocolor(trR, trG, trB, finalAlpha)

        UI.Renderer.drawText(displayText, textX - self._scrollOffset, textY, textW + self._scrollOffset, h,
            finalTextColor, 1, "default", "left", "center", true, false, false)
    else
        -- Placeholder
        local phRaw = UI.Theme.color("inputPlaceholder")
        local prR, prG, prB = fromcolor(phRaw)
        local finalPlaceholder = tocolor(prR, prG, prB, math.floor(finalAlpha * 0.6))

        UI.Renderer.drawText(self.placeholder, textX, textY, textW, h,
            finalPlaceholder, 1, "default", "left", "center", true, false, false)
    end

    -- Caret (cursor piscante)
    if self.focused then
        self._caretTick = (self._caretTick + 1) % 60 -- 60 frames
        self._caretVisible = self._caretTick < 30

        if self._caretVisible then
            local caretText = string.sub(self.value, 1, self.caretPos)
            if self.password then
                caretText = string.rep("•", self.caretPos)
            end
            local caretX = textX + UI.Renderer.getTextWidth(caretText, 1, "default") - self._scrollOffset
            local caretRaw = UI.Theme.color("textPrimary")
            local crR, crG, crB = fromcolor(caretRaw)
            local finalCaret = tocolor(crR, crG, crB, finalAlpha)

            dxDrawRectangle(caretX, self.y + 8, 2, h - 16, finalCaret, false)
        end
    end
end

---- HIT TEST ----

function Input:hitTest(px, py)
    if not self.visible then return false end
    return UI.Math and UI.Math.isPointInRect(px, py, self.x, self.y, self.width, self.height)
end

---- EVENTS ----

function Input:onMouseEnter()
    self.hovered = true
end

function Input:onMouseLeave()
    self.hovered = false
end

function Input:onFocus()
    self.focused = true
    self.caretPos = #self.value
end

function Input:onBlur()
    self.focused = false
    self.caretPos = 0
end

function Input:onCharacter(char)
    if not self.focused then return end
    if #self.value >= self.maxLength then return end

    self.value = string.sub(self.value, 1, self.caretPos)
        .. char
        .. string.sub(self.value, self.caretPos + 1)
    self.caretPos = self.caretPos + 1

    if UI.EventSystem then
        UI.EventSystem.emit("input:change", self, self.value)
    end
    if self.onChange then
        self.onChange(self, self.value)
    end
end

function Input:onKeyDown(key)
    if not self.focused then return end

    if key == "backspace" then
        if self.caretPos > 0 then
            self.value = string.sub(self.value, 1, self.caretPos - 1)
                .. string.sub(self.value, self.caretPos + 1)
            self.caretPos = self.caretPos - 1

            if UI.EventSystem then
                UI.EventSystem.emit("input:change", self, self.value)
            end
            if self.onChange then
                self.onChange(self, self.value)
            end
        end
    elseif key == "enter" or key == "return" then
        if self.onSubmit then
            self.onSubmit(self, self.value)
        end
        if UI.EventSystem then
            UI.EventSystem.emit("input:submit", self, self.value)
        end
    elseif key == "arrow_l" then
        self.caretPos = math.max(0, self.caretPos - 1)
    elseif key == "arrow_r" then
        self.caretPos = math.min(#self.value, self.caretPos + 1)
    elseif key == "home" then
        self.caretPos = 0
    elseif key == "end" then
        self.caretPos = #self.value
    end
end

function Input:onPaste(text)
    if not self.focused then return end
    if not text then return end
    local available = self.maxLength - #self.value
    if available <= 0 then return end
    local pasteText = string.sub(text, 1, available)

    self.value = string.sub(self.value, 1, self.caretPos)
        .. pasteText
        .. string.sub(self.value, self.caretPos + 1)
    self.caretPos = self.caretPos + #pasteText

    if UI.EventSystem then
        UI.EventSystem.emit("input:change", self, self.value)
    end
    if self.onChange then
        self.onChange(self, self.value)
    end
end

---- METHODS ----

function Input:getValue()
    return self.value
end

function Input:setValue(text)
    self.value = text or ""
    self.caretPos = #self.value
end

function Input:setPlaceholder(text)
    self.placeholder = text or ""
end

function Input:setPassword(isPassword)
    self.password = isPassword
end

function Input:clear()
    self.value = ""
    self.caretPos = 0
    if self.onChange then
        self.onChange(self, self.value)
    end
end

setmetatable(Input, {
    __call = function(_, props)
        return Input:new(props)
    end
})