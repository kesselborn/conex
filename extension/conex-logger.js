var Level;
(function (Level) {
  Level.Debug = 'debug';
  Level.Info = 'info';
  Level.Warn = 'warn';
  Level.Error = 'error';
})(Level || (Level = {}));
const logSettingsKey = 'log-settings';
const defaultLevel = Level.Info;
let logSettings = {};
browser.storage.local.get(logSettingsKey);
function debug(component, formatstring, ...data) {
  log(Level.Debug, component, [formatstring, ...data]);
}
function info(component, formatstring, ...data) {
  log(Level.Info, component, [formatstring, ...data]);
}
function warn(component, formatstring, ...data) {
  log(Level.Warn, component, [formatstring, ...data]);
}
function error(component, formatstring, ...data) {
  log(Level.Error, component, [formatstring, ...data]);
}
function persistLogLevel(component, level) {
  logSettings[component] = level;
  browser.storage.local.set({
    [logSettingsKey]: logSettings,
  }).catch(e => console.error('error persisting log levels: ', e));
  // TODO: this was here: browser.storage.onChanged
}
function log(level, component, data) {
  const callStack = (new Error()).stack.split('\n').slice(2)[0];
  let componentLogSetting = logSettings[component];
  if (!componentLogSetting) {
    componentLogSetting = defaultLevel;
    persistLogLevel(component, defaultLevel);
  }
  if (level === Level.Debug && logSettings[component] === Level.Debug) { return console.debug(`🐞 [conex:${component}]`, ...data, '\n', callStack); } else if (level === Level.Info && [Level.Debug, Level.Info].includes(componentLogSetting)) { return console.log(`[conex:${component}]`, ...data); } else if (level === Level.Warn && [Level.Debug, Level.Info, Level.Warn].includes(componentLogSetting)) { return console.warn(`[conex:${component}]`, ...data); } else if (level === Level.Error && [Level.Debug, Level.Info, Level.Warn, Level.Error].includes(componentLogSetting)) { return console.error(`[conex:${component}]`, ...data); }
}
browser.storage.onChanged.addListener((change, area) => {
  if (area === 'local') {
    const newLogSettings = change[logSettingsKey];
    if (newLogSettings) {
      logSettings = newLogSettings.newValue;
      console.log('[conex:logging] new logging settings detected', logSettings);
    }
  }
});
export { debug, info, warn, error, persistLogLevel, Level };
