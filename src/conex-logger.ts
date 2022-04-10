import {Browser} from 'webextension-polyfill';

enum Level {
    Debug = "debug",
    Info = "info",
    Warn = "warn",
    Error = "error"
}

const context = "logger";

const logSettingsKey = "log-settings";
const conexDefaultLogLevelKey = "conex-default";
const defaultLevel = Level.Info;

declare let browser: Browser;

interface LogSettings {
    [index: string]: Level
}

let logSettings: LogSettings = {};

async function init() {
    const foo = await browser.storage.local.get(logSettingsKey);
    logSettings = foo[logSettingsKey] || {};

    const defaultLogLevel = await getLogLevel(conexDefaultLogLevelKey)
    console.error('xxxx', defaultLogLevel);

    debug(context, `conex default log level is: '${defaultLogLevel}'`);

    window.addEventListener('storage', () => {
        console.log('XXXXXXXXXXXXXXXXXXXXXXX');
    });
}

async function persistLogLevel(component: string, level: Level): Promise<void> {
    logSettings[component] = level;

    await browser.storage.local.set({
        logSettingsKey: logSettings
    });

    debug(component, `persisting log setting '${component}' to '${level}'`);
}

async function getLogLevel(component: string): Promise<Level> {
    let level: Level | undefined = logSettings[component as any] as Level | undefined;

    if (level === undefined && component === conexDefaultLogLevelKey) {
        await persistLogLevel(component, defaultLevel);
        return defaultLevel;
    }

    if (level === undefined) {
        const defaultLoggingSetting: Level = await getLogLevel(conexDefaultLogLevelKey);

        debug(context, `log component ${component} not set yet: setting to: ${defaultLoggingSetting}`);
        await persistLogLevel(component, defaultLoggingSetting);

        level = defaultLoggingSetting;
    }

    return level;
}

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

function log(level: Level, component: string, data: any[]): void {
    const callStack = (new Error()).stack!.split('\n').slice(2)[0];

    let componentLogSetting = logSettings[component];

    if (componentLogSetting === undefined) {
        componentLogSetting = logSettings[conexDefaultLogLevelKey] || defaultLevel;
        getLogLevel(component).catch(e => {
            console.error(e)
        });
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

init();

export {debug, info, warn, error, persistLogLevel, Level};