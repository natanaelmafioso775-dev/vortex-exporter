--[[
    Vortex UI Framework — Window Component
    Container principal que armazena todos os componentes filhos
    Suporte a título, close button, dragging, redimensionamento
--]]

if not UI then UI = {} end

UI.Window = {}
_G.VortexWindow = UI.Window
local Window = UI.Window

local Window_mt = { __index = Window }

-- Constantes de layout
local TITLE_BAR_HEIGHT = 40
local CONTENT_PADDING = 16
local CLOSE_BUTTON_SIZE = 28

function Window:new(props)
    props = props or {}

    local instance = {
        -- Identidade
        title = props.title or "Window",
        -- Dimensões (base, serão escaladas pelo Responsive)
        baseWidth = props.width or 600,
        baseHeight = props.height or 400,
        -- Posição (calculada pela âncora)
        x = 0, y = 0,
        width = 0, height = 0,
        -- Âncora
        anchor = props.anchor or "center",
        -- Visibilidade e alpha
        visible = true,
        alpha = props.alpha or 255,
        -- Escala (para animação de entrada)
        scale = props.scale or 1.0,
        -- Flags
        closable = props.closable ~= false,
        draggable = props.draggable ~= false,
        -- Z-index
        zIndex = props.zIndex or 1,
        -- Animação
        animation = props.animation or { enter = "fadeIn" },
        -- Filhos
        children = {},
        -- Drag state
        _dragging = false,
        _dragOffsetX = 0,
        _dragOffsetY = 0,
        -- Eventos customizados
        onClose = props.onClose,
        -- Layout cache
        _lastScreenW = 0,
        _lastScreenH = 0,
    }

    setmetatable(instance, Window_mt)
    instance:_recalculateLayout()
    return instance
end

---- LAYOUT ----

function Window:_recalculateLayout()
    if not UI.Responsive then return end
    UI.Responsive.update()
    self.width = UI.Responsive.s(self.baseWidth)
    self.height = UI.Responsive.s(self.baseHeight)
    self.x, self.y = UI.Responsive.anchor(self.anchor, self.baseWidth, self.baseHeight)
    local sx, sy = UI.Responsive.getScreenSize()
    self._lastScreenW = sx
    self._lastScreenH = sy
end

---- CHILDREN MANAGEMENT ----

function Window:addChild(child)
    if not child then return end
    table.insert(self.children, child)
    child._parent = self
    return child
end

function Window:removeChild(child)
    if not child then return end
    for i, c in ipairs(self.children) do
        if c == child then
            table.remove(self.children, i)
            child._parent = nil
            break
        end
    end
end

---- VISIBILITY ----

function Window:setVisible(visible)
    self.visible = visible
    if visible and UI.InputManager then
        UI.InputManager.register(self)
    elseif not visible and UI.InputManager then
        UI.InputManager.unregister(self)
    end
end

function Window:setAlpha(alpha)
    self.alpha = alpha or 255
end

function Window:setTitle(title)
    self.title = title or ""
end

---- HIT TEST ----

function Window:hitTest(px, py)
    if not self.visible then return false end
    return px >= self.x and px <= self.x + self.width
       and py >= self.y and py <= self.y + self.height
end

---- CLOSE ----

function Window:close()
    self.visible = false
    if UI.InputManager then
        UI.InputManager.unregister(self)
    end
    if UI.InputManager and UI.InputManager.getFocus() == self then
        UI.InputManager.clearFocus()
    end
    if UI.EventSystem then
        UI.EventSystem.emit("window:close", self)
    end
    if self.onClose then
        self.onClose(self)
    end
end

function Window:destroy()
    self:close()
    -- Destroi filhos
    for _, child in ipairs(self.children) do
        if child.destroy then
            child:destroy()
        end
    end
    self.children = {}
    if UI.EventSystem then
        UI.EventSystem.emit("window:destroy", self)
    end
end

---- MOUSE EVENTS ----

function Window:onMouseDown(mx, my)
    if not self.draggable then return end
    -- Verifica se clicou na title bar
    local titleBarBottom = self.y + TITLE_BAR_HEIGHT
    local closeX = self.x + self.width - CLOSE_BUTTON_SIZE - 8
    local closeY = self.y + (TITLE_BAR_HEIGHT - CLOSE_BUTTON_SIZE) / 2

    -- Se clicou no close button, ignora drag
    if self.closable and mx >= closeX and mx <= closeX + CLOSE_BUTTON_SIZE
        and my >= closeY and my <= closeY + CLOSE_BUTTON_SIZE then
        self:close()
        return
    end

    -- Se clicou na title bar, inicia drag
    if my >= self.y and my <= titleBarBottom then
        self._dragging = true
        self._dragOffsetX = mx - self.x
        self._dragOffsetY = my - self.y
    end
end

function Window:onMouseUp(mx, my)
    self._dragging = false
end

function Window:onMouseEnter()
    -- placeholder
end

function Window:onMouseLeave()
    self._dragging = false
end

---- RENDER ----

function Window:render()
    if not self.visible then return end
    if not UI.Renderer or not UI.Theme then return end

    -- Recalcula layout se a tela redimensionou
    local sx, sy = guiGetScreenSize()
    if sx ~= self._lastScreenW or sy ~= self._lastScreenH then
        self:_recalculateLayout()
    end

    -- Atualiza drag
    if self._dragging and UI.InputManager then
        local mx, my = UI.InputManager.getMousePosition()
        self.x = mx - self._dragOffsetX
        self.y = my - self._dragOffsetY
    end

    -- Aplica escala para animação
    local scaledX = self.x + (self.width * (1 - self.scale)) / 2
    local scaledY = self.y + (self.height * (1 - self.scale)) / 2
    local scaledW = self.width * self.scale
    local scaledH = self.height * self.scale

    -- Fundo da janela (surface)
    UI.Renderer.drawRect(scaledX, scaledY, scaledW, scaledH,
        UI.Theme.color("surface"), UI.Theme.radius("md"), false)

    -- Borda da janela
    UI.Renderer.drawBorder(scaledX, scaledY, scaledW, scaledH,
        UI.Theme.color("border"), 1, UI.Theme.radius("md"), false)

    -- Title bar background
    UI.Renderer.drawRect(scaledX, scaledY, scaledW, TITLE_BAR_HEIGHT,
        UI.Theme.color("surfaceAlt"), UI.Theme.radius("md"), false)
    -- Corrige cantos inferiores da title bar (flat)
    dxDrawRectangle(scaledX, scaledY + TITLE_BAR_HEIGHT - UI.Theme.radius("md"),
        scaledW, UI.Theme.radius("md"), UI.Theme.color("surfaceAlt"), false)

    -- Título
    local titleX = scaledX + CONTENT_PADDING
    local titleW = scaledW - CONTENT_PADDING * 2 - CLOSE_BUTTON_SIZE - 8
    UI.Renderer.drawText(self.title, titleX, scaledY, titleW, TITLE_BAR_HEIGHT,
        UI.Theme.color("textPrimary"), 1, "default", "left", "center", true, false, false)

    -- Close button (X)
    if self.closable then
        local closeX = scaledX + scaledW - CLOSE_BUTTON_SIZE - 8
        local closeY = scaledY + (TITLE_BAR_HEIGHT - CLOSE_BUTTON_SIZE) / 2
        local closeColor = UI.Theme.color("textSecondary")
        -- Hover effect (simplificado)
        UI.Renderer.drawText("✕", closeX, closeY, CLOSE_BUTTON_SIZE, CLOSE_BUTTON_SIZE,
            closeColor, 1, "default", "center", "center", false, false, false)
    end

    -- Área de conteúdo
    local contentX = scaledX + CONTENT_PADDING
    local contentY = scaledY + TITLE_BAR_HEIGHT + CONTENT_PADDING
    local contentW = scaledW - CONTENT_PADDING * 2
    local contentH = scaledH - TITLE_BAR_HEIGHT - CONTENT_PADDING * 2

    -- Renderiza filhos
    local childY = contentY
    for _, child in ipairs(self.children) do
        if child and child.visible ~= false and child.render then
            -- Calcula alpha combinado
            local combinedAlpha = math.floor(self.alpha * (child.alpha or 255) / 255)
            -- Passa posição para o filho
            child:render(contentX, childY, contentW, combinedAlpha)
            -- Avança posição Y para o próximo filho (layout vertical automático)
            childY = childY + (child.height or 0) + UI.Theme.spacing("sm")
        end
    end
end

setmetatable(Window, {
    __call = function(_, props)
        return Window:new(props)
    end
})