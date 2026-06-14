--[[
    Vortex UI Framework — Init Bootstrap
    Módulos são carregados na ordem correta via meta.xml
    Este arquivo apenas configura o render loop e inicializa o sistema
--]]

if not UI then
    UI = {}
end

---- WINDOWS ATIVAS ----
UI.activeWindows = {}

---- RENDER LOOP ----

local function onRender()
    -- Atualiza animações
    if UI.Animation and UI.Animation.update then
        UI.Animation.update()
    end

    -- Renderiza todas as janelas ativas
    for _, window in ipairs(UI.activeWindows) do
        if window and window.visible and window.render then
            window:render()
        end
    end
end

---- FACTORY ----

function UI.createWindow(props)
    if not UI.Window then
        outputDebugString("[Vortex UI] Window component not loaded", 2)
        return nil
    end
    local window = UI.Window(props)
    table.insert(UI.activeWindows, window)
    return window
end

function UI.destroyWindow(window)
    if not window then return end
    for i, w in ipairs(UI.activeWindows) do
        if w == window then
            table.remove(UI.activeWindows, i)
            break
        end
    end
    if window.destroy then
        window:destroy()
    end
end

function UI.closeAll()
    for i = #UI.activeWindows, 1, -1 do
        local window = UI.activeWindows[i]
        if window and window.destroy then
            window:destroy()
        end
    end
    UI.activeWindows = {}
    if UI.InputManager then
        UI.InputManager.setCursorEnabled(false)
    end
end

---- INPUT HANDLERS ----

local function setupInputHandlers()
    if not UI.InputManager then return end

    addEventHandler("onClientCursorMove", root, function(...)
        if UI.InputManager.isCursorEnabled() then
            UI.InputManager.onCursorMove(...)
        end
    end)

    addEventHandler("onClientClick", root, function(button, state, absoluteX, absoluteY)
        if UI.InputManager.isCursorEnabled() then
            UI.InputManager.onClick(button, state, absoluteX, absoluteY)
        end
    end)

    addEventHandler("onClientKey", root, function(key, state)
        if UI.InputManager.isCursorEnabled() then
            UI.InputManager.onKey(key, state)
        end
    end)

    addEventHandler("onClientCharacter", root, function(character)
        if UI.InputManager.isCursorEnabled() then
            UI.InputManager.onCharacter(character)
        end
    end)

    addEventHandler("onClientPaste", root, function(text)
        if UI.InputManager.isCursorEnabled() then
            UI.InputManager.onPaste(text)
        end
    end)
end

---- BOOTSTRAP ----

addEventHandler("onClientResourceStart", resourceRoot, function()
    setupInputHandlers()
    addEventHandler("onClientRender", root, onRender)

    if UI.Responsive then
        UI.Responsive.update()
    end

    if UI.Theme then
        UI.Theme.setTheme("dark")
    end

    outputDebugString("[Vortex UI] Framework initialized successfully")
end)

addEventHandler("onClientResourceStop", resourceRoot, function()
    UI.closeAll()
    removeEventHandler("onClientRender", root, onRender)
    outputDebugString("[Vortex UI] Framework stopped")
end)