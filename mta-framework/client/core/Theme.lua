--[[
    Vortex UI Framework — Theme System
    Sistema de temas com tokens (cores, fontes, espaçamentos)
--]]

if not UI then UI = {} end

UI.Theme = {}
local Theme = UI.Theme

local currentTheme = nil
local themes = {}

---- Paleta Dark (default) ----
themes.dark = {
    background =       tocolor(10, 10, 14, 245),
    surface =          tocolor(18, 18, 24, 245),
    surfaceAlt =       tocolor(24, 24, 34, 245),
    overlay =          tocolor(0, 0, 0, 180),

    primary =          tocolor(0, 170, 255, 255),
    primaryHover =     tocolor(0, 140, 220, 255),
    primaryActive =    tocolor(0, 110, 190, 255),
    primaryText =      tocolor(255, 255, 255, 255),

    secondary =        tocolor(100, 100, 115, 255),
    secondaryHover =   tocolor(130, 130, 145, 255),

    textPrimary =      tocolor(255, 255, 255, 240),
    textSecondary =    tocolor(180, 180, 190, 200),
    textMuted =        tocolor(130, 130, 140, 150),

    border =           tocolor(255, 255, 255, 20),
    borderFocus =      tocolor(0, 170, 255, 180),
    borderError =      tocolor(255, 60, 60, 200),

    success =          tocolor(60, 220, 100, 255),
    warning =          tocolor(255, 180, 50, 255),
    error =            tocolor(255, 60, 60, 255),

    inputBackground =  tocolor(14, 14, 20, 230),
    inputPlaceholder = tocolor(150, 150, 160, 120),

    shadow =           tocolor(0, 0, 0, 80),
}

---- Paleta Light ----
themes.light = {
    background =       tocolor(240, 242, 248, 250),
    surface =          tocolor(255, 255, 255, 250),
    surfaceAlt =       tocolor(245, 245, 250, 250),
    overlay =          tocolor(0, 0, 0, 80),

    primary =          tocolor(0, 120, 230, 255),
    primaryHover =     tocolor(0, 100, 200, 255),
    primaryActive =    tocolor(0, 80, 170, 255),
    primaryText =      tocolor(255, 255, 255, 255),

    secondary =        tocolor(140, 140, 150, 255),
    secondaryHover =   tocolor(160, 160, 170, 255),

    textPrimary =      tocolor(20, 20, 30, 240),
    textSecondary =    tocolor(100, 100, 115, 200),
    textMuted =        tocolor(150, 150, 160, 150),

    border =           tocolor(0, 0, 0, 12),
    borderFocus =      tocolor(0, 120, 230, 200),
    borderError =      tocolor(230, 40, 40, 200),

    success =          tocolor(40, 190, 80, 255),
    warning =          tocolor(240, 160, 30, 255),
    error =            tocolor(230, 40, 40, 255),

    inputBackground =  tocolor(240, 242, 248, 230),
    inputPlaceholder = tocolor(140, 140, 150, 120),

    shadow =           tocolor(0, 0, 0, 40),
}

local spacing = { xs = 4, sm = 8, md = 12, lg = 16, xl = 24, xxl = 32 }
local radius = { none = 0, sm = 4, md = 8, lg = 12, xl = 16, full = 999 }

function Theme.setTheme(themeName)
    if themes[themeName] then currentTheme = themes[themeName] end
end

function Theme.color(token)
    local t = currentTheme or themes.dark
    return t[token] or tocolor(255, 255, 255, 255)
end

function Theme.spacing(token)
    return spacing[token] or 0
end

function Theme.radius(token)
    return radius[token] or 0
end

function Theme.font(token)
    return "default"
end

function Theme.register(name, palette)
    if name and palette then themes[name] = palette end
end

Theme.setTheme("dark")