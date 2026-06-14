--[[
    Vortex UI Framework — Event System
    EventEmitter pattern para comunicação entre componentes
--]]

if not UI then UI = {} end

UI.EventSystem = {}
local ES = UI.EventSystem

local listeners = {}

function ES.on(eventName, callback)
    if not eventName or not callback then return end
    if not listeners[eventName] then listeners[eventName] = {} end
    table.insert(listeners[eventName], { callback = callback, once = false })
end

function ES.once(eventName, callback)
    if not eventName or not callback then return end
    if not listeners[eventName] then listeners[eventName] = {} end
    table.insert(listeners[eventName], { callback = callback, once = true })
end

function ES.off(eventName, callback)
    if not eventName or not listeners[eventName] then return end
    for i, entry in ipairs(listeners[eventName]) do
        if entry.callback == callback then
            table.remove(listeners[eventName], i)
            break
        end
    end
    if #listeners[eventName] == 0 then listeners[eventName] = nil end
end

function ES.emit(eventName, ...)
    if not eventName or not listeners[eventName] then return end
    local toRemove = {}
    for i, entry in ipairs(listeners[eventName]) do
        if entry.callback then
            local success, err = pcall(entry.callback, ...)
            if not success then
                outputDebugString("[Vortex UI] Event error '" .. eventName .. "': " .. tostring(err), 2)
            end
        end
        if entry.once then table.insert(toRemove, i) end
    end
    for i = #toRemove, 1, -1 do
        table.remove(listeners[eventName], toRemove[i])
    end
    if #listeners[eventName] == 0 then listeners[eventName] = nil end
end

function ES.clear(eventName)
    if eventName then listeners[eventName] = nil else listeners = {} end
end