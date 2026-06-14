--[[
    Vortex UI Framework — Exemplo: Login Panel
    Demonstra o uso da framework para criar um painel de login moderno
    Window + Text + Input + Button
--]]

---- SERVER SIDE (server/login_server.lua) ----
--[[
addEvent("vortex:login", true)
addEventHandler("vortex:login", root, function(username, password)
    -- Validar credenciais no servidor
    outputServerLog("[Vortex] Login attempt: " .. username)
    -- Responde ao client
    triggerClientEvent(client, "vortex:loginResponse", resourceRoot, true, "Bem-vindo, " .. username .. "!")
end)
]]

---- CLIENT SIDE ----

local loginWindow = nil

function openLoginPanel()
    -- Se já existe, destrói e recria
    if loginWindow then
        UI.destroyWindow(loginWindow)
    end

    -- Cria janela
    loginWindow = UI.Window({
        title = "Vortex RP",
        width = 400,
        height = 340,
        anchor = "center",
        animation = { enter = "fadeIn" },
        closable = true,
    })

    -- Título "Bem-vindo"
    local titleText = UI.Text({
        text = "Bem-vindo de volta",
        color = "textPrimary",
        scale = 1.4,
        alignX = "center",
        height = 30,
    })
    loginWindow:addChild(titleText)

    -- Subtítulo
    local subtitleText = UI.Text({
        text = "Entre com suas credenciais",
        color = "textSecondary",
        scale = 0.9,
        alignX = "center",
        height = 20,
    })
    loginWindow:addChild(subtitleText)

    -- Espaçador
    local spacer = UI.Text({ text = "", height = 8 })
    loginWindow:addChild(spacer)

    -- Input: Usuário
    local usernameInput = UI.Input({
        placeholder = "Usuário",
        width = 320,
        height = 44,
        maxLength = 32,
    })
    loginWindow:addChild(usernameInput)

    -- Input: Senha
    local passwordInput = UI.Input({
        placeholder = "Senha",
        password = true,
        width = 320,
        height = 44,
        maxLength = 64,
    })
    loginWindow:addChild(passwordInput)

    -- Espaçador
    local spacer2 = UI.Text({ text = "", height = 8 })
    loginWindow:addChild(spacer2)

    -- Status text (feedback)
    local statusText = UI.Text({
        text = "",
        color = "textMuted",
        scale = 0.85,
        alignX = "center",
        height = 20,
    })
    loginWindow:addChild(statusText)

    -- Botão Entrar
    local loginButton = UI.Button({
        text = "Entrar",
        width = 320,
        height = 48,
        theme = "primary",
        onClick = function()
            local username = usernameInput:getValue()
            local password = passwordInput:getValue()

            -- Validação básica
            if username == "" then
                statusText:setText("Digite seu usuário")
                statusText:setColor("error")
                return
            end
            if password == "" then
                statusText:setText("Digite sua senha")
                statusText:setColor("error")
                return
            end

            statusText:setText("Conectando...")
            statusText:setColor("primary")

            -- Simula envio ao servidor
            -- triggerServerEvent("vortex:login", localPlayer, username, password)

            -- Demo: simula resposta após 1.5s
            setTimer(function()
                statusText:setText("Login bem-sucedido! Bem-vindo, " .. username)
                statusText:setColor("success")

                -- Fecha o painel após 1.5s
                setTimer(function()
                    loginWindow:close()
                end, 1500, 1)
            end, 1500, 1)
        end,
    })
    loginWindow:addChild(loginButton)

    -- Espaçador final
    local spacer3 = UI.Text({ text = "", height = 4 })
    loginWindow:addChild(spacer3)

    -- Link "Criar conta"
    local registerText = UI.Text({
        text = "Não tem conta? Registre-se",
        color = "primary",
        scale = 0.85,
        alignX = "center",
        height = 20,
    })
    loginWindow:addChild(registerText)

    -- Registra a janela no InputManager
    UI.InputManager.setCursorEnabled(true)
    UI.InputManager.register(loginWindow)

    -- Foca no primeiro input
    UI.InputManager.setFocus(usernameInput)

    -- Animação de entrada
    loginWindow.scale = 0.9
    loginWindow.alpha = 0
    UI.Animation.fadeIn(loginWindow, { duration = 300 })
    UI.Animation.scale(loginWindow, { from = 0.9, to = 1.0, duration = 300 })
end

-- Fecha painel ao pressionar ESC
bindKey("escape", "down", function()
    if loginWindow and loginWindow.visible then
        loginWindow:close()
        UI.InputManager.setCursorEnabled(false)
    end
end)

-- Comando para abrir o painel
addCommandHandler("login", function()
    openLoginPanel()
end)

-- Abre automaticamente ao iniciar o resource (para demo)
addEventHandler("onClientResourceStart", resourceRoot, function()
    setTimer(openLoginPanel, 1000, 1)
    outputChatBox("[Vortex UI] Digite /login para abrir o painel de login", 0, 170, 255)
end)