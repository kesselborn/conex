import {Browser} from 'webextension-polyfill';

enum Level {
    Debug = "debug",
    Info = "info",
    Warn = "warn",
    Error = "error"
}

const logSettingsKey = "log-settings";
const defaultLevel = Level.Info;

declare let browser: Browser;

interface LogSettings {
    [index: string]: Level
}

let logSettings: LogSettings = {}
browser.storage.local.get(logSettingsKey)

function debug(component: string, formatstring: string, ...data: any[]): void {
    log(Level.Debug, component, [formatstring, ...data]);
}

function info(component: string, formatstring: string, ...data: any[]): void {
    log(Level.Info, component, [formatstring, ...data]);
}

function warn(component: string, formatstring: string, ...data: any[]): void {
    log(Level.Warn, component, [formatstring, ...data]);
}

function error(component: string, formatstring: string, ...data: any[]): void {
    log(Level.Error, component, [formatstring, ...data]);
}

function persistLogLevel(component: string, level: Level) {
    logSettings[component] = level;
    browser.storage.local.set({
        [logSettingsKey]: logSettings
    }).catch(e => console.error('error persisting log levels: ', e))

    //TODO: this was here: browser.storage.onChanged
}

function log(level: Level, component: string, data: any[]): void {
    const callStack = (new Error()).stack!.split('\n').slice(2)[0];

    let componentLogSetting = logSettings[component];
    if (!componentLogSetting) {
        componentLogSetting = defaultLevel;
        persistLogLevel(component, defaultLevel);
    }

    if (level === Level.Debug && logSettings[component] === Level.Debug)
        return console.debug(`🐞 [conex:${component}]`, ...data, '\n', callStack);
    else if (level === Level.Info && [Level.Debug, Level.Info].includes(componentLogSetting))
        return console.log(`[conex:${component}]`, ...data);
    else if (level === Level.Warn && [Level.Debug, Level.Info, Level.Warn].includes(componentLogSetting))
        return console.warn(`[conex:${component}]`, ...data);
    else if (level === Level.Error && [Level.Debug, Level.Info, Level.Warn, Level.Error].includes(componentLogSetting))
        return console.error(`[conex:${component}]`, ...data);
}

browser.storage.onChanged.addListener((change, area) => {
    if (area === "local") {
        const newLogSettings = change[logSettingsKey];
        if (newLogSettings) {
            logSettings = newLogSettings.newValue as LogSettings;
            console.log('[conex:logging] new logging settings detected', logSettings);
        }
    }
})

export {debug, info, warn, error, persistLogLevel, Level};