--[[
    Vortex UI Framework — Image Component
    Exibe textura/imagem com suporte a fit modes (fill, contain, cover)
--]]

if not UI then UI = {} end

UI.Image = {}
_G.VortexImage = UI.Image
local Image = UI.Image
local Image_mt = { __index = Image }

function Image:new(props)
    props = props or {}

    local instance = {
        -- Fonte
        src = props.src or nil,
        _texture = nil, -- textura carregada

        -- Dimensões
        width = props.width or 100,
        height = props.height or 100,

        -- Nativo (detectado da textura)
        _texWidth = 0,
        _texHeight = 0,

        -- Visual
        rotation = props.rotation or 0,
        _color = props.color or tocolor(255, 255, 255, 255),
        fitMode = props.fitMode or "fill", -- "fill", "contain", "cover"

        -- Posição
        x = 0, y = 0,
        alpha = 255,
        visible = true,
    }

    setmetatable(instance, Image_mt)

    -- Carrega textura se src for string
    if instance.src and type(instance.src) == "string" then
        instance:_loadTexture()
    elseif instance.src then
        -- src é um elemento textura
        instance._texture = instance.src
        -- Tenta obter tamanho nativo
        local matSize = dxGetMaterialSize(instance._texture)
        if matSize then
            instance._texWidth = matSize[1]
            instance._texHeight = matSize[2]
        end
    end

    return instance
end

function Image:_loadTexture()
    if not self.src then return end
    self._texture = dxCreateTexture(self.src)
    if self._texture then
        local matSize = dxGetMaterialSize(self._texture)
        if matSize then
            self._texWidth = matSize[1]
            self._texHeight = matSize[2]
        end
    end
end

---- FIT MODE CALC ----

function Image:_getDrawRect(x, y, w, h)
    if not self._texture or self._texWidth <= 0 or self._texHeight <= 0 then
        return x, y, w, h
    end

    local tw = self._texWidth
    local th = self._texHeight

    if self.fitMode == "fill" then
        return x, y, w, h
    elseif self.fitMode == "contain" then
        local scale = math.min(w / tw, h / th)
        local dw = tw * scale
        local dh = th * scale
        return x + (w - dw) / 2, y + (h - dh) / 2, dw, dh
    elseif self.fitMode == "cover" then
        local scale = math.max(w / tw, h / th)
        local dw = tw * scale
        local dh = th * scale
        return x + (w - dw) / 2, y + (h - dh) / 2, dw, dh
    end

    return x, y, w, h
end

---- RENDER ----

function Image:render(x, y, w, h, parentAlpha)
    if not self.visible then return end
    if not UI.Renderer then return end
    if not self._texture then return end

    self.x = x or self.x
    self.y = y or self.y

    local renderW = w or self.width
    local renderH = h or self.height

    -- Calcula retângulo de draw baseado no fit mode
    local dx, dy, dw, dh = self:_getDrawRect(self.x, self.y, renderW, renderH)

    -- Alpha combinado
    local finalAlpha = math.floor(self.alpha * (parentAlpha or 255) / 255)
    local r, g, b = fromcolor(self._color)
    local finalColor = tocolor(r, g, b, finalAlpha)

    UI.Renderer.drawImage(self._texture, dx, dy, dw, dh, self.rotation, finalColor, false)
end

---- HIT TEST ----

function Image:hitTest(px, py)
    return false
end

---- METHODS ----

function Image:setSrc(src)
    self.src = src
    if self._texture and isElement(self._texture) then
        destroyElement(self._texture)
    end
    self._texture = nil
    self._texWidth = 0
    self._texHeight = 0

    if src and type(src) == "string" then
        self:_loadTexture()
    elseif src then
        self._texture = src
        local matSize = dxGetMaterialSize(src)
        if matSize then
            self._texWidth = matSize[1]
            self._texHeight = matSize[2]
        end
    end
end

function Image:setFitMode(mode)
    self.fitMode = mode or "fill"
end

function Image:setColor(color)
    self._color = color or tocolor(255, 255, 255, 255)
end

function Image:destroy()
    if self._texture and isElement(self._texture) and self.src then
        -- Só destrói se foi criado por nós (string src)
        if type(self.src) == "string" then
            destroyElement(self._texture)
        end
    end
    self._texture = nil
end

setmetatable(Image, {
    __call = function(_, props)
        return Image:new(props)
    end
})