--[[
    Vortex UI Framework — Input Manager
    Gerencia foco, clique, teclado e estados de input
--]]

if not UI then UI = {} end

UI.InputManager = {}
local IM = UI.InputManager

local focusedComponent = nil
local hoveredComponent = nil
local registeredComponents = {}
local mouseX, mouseY = 0, 0
local mouseDown = false
local cursorEnabled = false

function IM.register(component)
    if not component then return end
    registeredComponents[component] = true
end

function IM.unregister(component)
    if not component then return end
    registeredComponents[component] = nil
    if focusedComponent == component then IM.setFocus(nil) end
    if hoveredComponent == component then hoveredComponent = nil end
end

function IM.setFocus(component)
    if focusedComponent and focusedComponent ~= component then
        focusedComponent.focused = false
        if focusedComponent.onBlur then focusedComponent:onBlur() end
        if UI.EventSystem then UI.EventSystem.emit("input:blur", focusedComponent) end
    end
    focusedComponent = component
    if focusedComponent then
        focusedComponent.focused = true
        if focusedComponent.onFocus then focusedComponent:onFocus() end
        if UI.EventSystem then UI.EventSystem.emit("input:focus", focusedComponent) end
    end
end

function IM.getFocus()
    return focusedComponent
end

function IM.clearFocus()
    IM.setFocus(nil)
end

function IM.setCursorEnabled(enabled)
    cursorEnabled = enabled
    showCursor(enabled)
    guiSetInputEnabled(enabled and "no_binds_when_editing" or false)
end

function IM.isCursorEnabled()
    return cursorEnabled
end

function IM.onCursorMove(_, _, absoluteX, absoluteY)
    mouseX = absoluteX
    mouseY = absoluteY

    local topComponent = nil
    for comp, _ in pairs(registeredComponents) do
        if comp.visible and comp:hitTest(absoluteX, absoluteY) then
            if not topComponent or (comp.zIndex or 0) >= (topComponent.zIndex or 0) then
                topComponent = comp
            end
        end
    end

    if topComponent ~= hoveredComponent then
        if hoveredComponent then
            hoveredComponent.hovered = false
            if hoveredComponent.onMouseLeave then hoveredComponent:onMouseLeave() end
        end
        if topComponent then
            topComponent.hovered = true
            if topComponent.onMouseEnter then topComponent:onMouseEnter() end
        end
        hoveredComponent = topComponent
    end
end

function IM.onClick(button, state, absoluteX, absoluteY)
    if button ~= "left" then return end

    if state == "down" then
        mouseDown = true
        for comp, _ in pairs(registeredComponents) do
            if comp.visible and comp:hitTest(absoluteX, absoluteY) then
                IM.setFocus(comp)
                if comp.onMouseDown then comp:onMouseDown(absoluteX, absoluteY) end
                if UI.EventSystem then UI.EventSystem.emit("input:mouseDown", comp, absoluteX, absoluteY) end
                return
            end
        end
        IM.setFocus(nil)
    elseif state == "up" then
        mouseDown = false
        local target = focusedComponent
        if target and target.visible and target:hitTest(absoluteX, absoluteY) then
            if target.onClick then target:onClick(absoluteX, absoluteY) end
            if UI.EventSystem then UI.EventSystem.emit("input:click", target, absoluteX, absoluteY) end
        end
    end
end

function IM.onKey(key, state)
    if not focusedComponent then return end
    if state then
        if focusedComponent.onKeyDown then focusedComponent:onKeyDown(key) end
    else
        if focusedComponent.onKeyUp then focusedComponent:onKeyUp(key) end
    end
end

function IM.onCharacter(character)
    if not focusedComponent then return end
    if focusedComponent.onCharacter then focusedComponent:onCharacter(character) end
end

function IM.onPaste(text)
    if not focusedComponent then return end
    if focusedComponent.onPaste then focusedComponent:onPaste(text) end
end

function IM.getMousePosition()
    return mouseX, mouseY
end

function IM.isMouseDown()
    return mouseDown
end