const component = 'logging';
var Level;
(function (Level) {
  Level.Debug = 'debug';
  Level.Info = 'info';
  Level.Warn = 'warn';
  Level.Error = 'error';
})(Level || (Level = {}));
const logSettingsKey = 'log-settings';
const defaultLevel = Level.Warn;
let logSettings = null;
async function loadSettings() {
  if (!logSettings) {
    const data = await browser.storage.local.get(logSettingsKey);
    logSettings = data[logSettingsKey];
  }
  if (!logSettings) {
    logSettings = {};
  }
  return logSettings;
}
async function debug(component, ...data) {
  await log(Level.Debug, component, data);
}
async function info(component, ...data) {
  await log(Level.Info, component, data);
}
async function warn(component, ...data) {
  await log(Level.Warn, component, data);
}
async function error(component, ...data) {
  await log(Level.Error, component, data);
}
async function persistLogLevel(component, level) {
  await loadSettings();
  logSettings[component] = level;
  browser.storage.local.set({
    [logSettingsKey]: logSettings,
  }).catch(e => console.error(`
error persisting log levels:
    component: '${component}'
    logSettingsKey: '${logSettingsKey}'
    logSettings:
    `, logSettings, `
    error:`, e));
  // TODO: this was here: browser.storage.onChanged
}
async function log(level, component, data) {
  await loadSettings();
  let componentLogSetting = logSettings[component.toString()];
  if (!componentLogSetting) {
    componentLogSetting = defaultLevel;
    await persistLogLevel(component, defaultLevel);
  }
  if (level === Level.Debug && logSettings[component] === Level.Debug) {
    const callStack = (new Error()).stack.split('\n').slice(2)[0];
    console.debug(`[conex:${component}] 🐞`, ...data, '\n', callStack);
  } else if (level === Level.Info && [Level.Debug, Level.Info].includes(componentLogSetting)) { console.log(`[conex:${component}]`, ...data); } else if (level === Level.Warn && [Level.Debug, Level.Info, Level.Warn].includes(componentLogSetting)) {
    const callStack = (new Error()).stack.split('\n').slice(2)[0];
    console.warn(`[conex:${component}]`, ...data, '\n', callStack);
  } else if (level === Level.Error && [Level.Debug, Level.Info, Level.Warn, Level.Error].includes(componentLogSetting)) { console.error(`[conex:${component}]`, ...data); }
}
browser.storage.onChanged.addListener((change, area) => {
  if (area === 'local') {
    const newLogSettings = change[logSettingsKey];
    if (newLogSettings) {
      logSettings = newLogSettings.newValue;
      console.debug(`[conex:${component}] new logging settings detected`, logSettings);
    }
  }
});
export { debug, info, warn, error, loadSettings, persistLogLevel, Level };
