--[[
    Vortex UI Framework — SVG Component
    Renderiza ícones SVG usando svgCreate nativo do MTA
--]]

if not UI then UI = {} end

UI.SVG = {}
_G.VortexSVG = UI.SVG
local SVG = UI.SVG
local SVG_mt = { __index = SVG }

function SVG:new(props)
    props = props or {}

    local instance = {
        src = props.src or nil,
        width = props.width or 24,
        height = props.height or 24,
        _color = props.color or tocolor(255, 255, 255, 255),
        rotation = props.rotation or 0,
        _svgElement = nil, -- elemento svg criado

        -- Posição
        x = 0, y = 0,
        alpha = 255,
        visible = true,
    }

    setmetatable(instance, SVG_mt)

    -- Cria SVG se src fornecido
    if instance.src then
        instance:_createSVG()
    end

    return instance
end

function SVG:_createSVG()
    if not self.src then return end

    -- Destroi anterior se existir
    if self._svgElement and isElement(self._svgElement) then
        destroyElement(self._svgElement)
    end

    -- svgCreate retorna um elemento texture, não um userdata de SVG
    -- No MTA: svgCreate(width, height, path, callback)
    local result = svgCreate(self.width, self.height, self.src, function(element)
        if element then
            self._svgElement = element
        end
    end)

    -- svgCreate também pode retornar diretamente um svg element
    if result and isElement(result) then
        self._svgElement = result
    end
end

---- RENDER ----

function SVG:render(x, y, w, h, parentAlpha)
    if not self.visible then return end
    if not self._svgElement then return end

    self.x = x or self.x
    self.y = y or self.y

    local renderW = w or self.width
    local renderH = h or self.height

    -- Ajusta tamanho do SVG via svgSetSize se necessário
    if renderW ~= self.width or renderH ~= self.height then
        if self._svgElement then
            svgSetSize(self._svgElement, renderW, renderH)
        end
    end

    -- Alpha combinado
    local finalAlpha = math.floor(self.alpha * (parentAlpha or 255) / 255)
    local r, g, b = fromcolor(self._color)
    local finalColor = tocolor(r, g, b, finalAlpha)

    -- Renderiza SVG como imagem
    dxDrawImage(self.x, self.y, renderW, renderH, self._svgElement, self.rotation, 0, 0, finalColor, false)
end

---- HIT TEST ----

function SVG:hitTest(px, py)
    return false
end

---- METHODS ----

function SVG:setSrc(src)
    self.src = src
    self:_createSVG()
end

function SVG:setColor(color)
    self._color = color or tocolor(255, 255, 255, 255)
end

function SVG:destroy()
    if self._svgElement and isElement(self._svgElement) then
        destroyElement(self._svgElement)
    end
    self._svgElement = nil
end

setmetatable(SVG, {
    __call = function(_, props)
        return SVG:new(props)
    end
})