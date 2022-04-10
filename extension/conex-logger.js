var Level;
(function (Level) {
  Level.Debug = 'debug';
  Level.Info = 'info';
  Level.Warn = 'warn';
  Level.Error = 'error';
})(Level || (Level = {}));
const context = 'logger';
const logSettingsKey = 'log-settings';
const conexDefaultLogLevelKey = 'conex-default';
const defaultLevel = Level.Info;
let logSettings = {};
async function init() {
  const foo = await browser.storage.local.get(logSettingsKey);
  logSettings = foo[logSettingsKey] || {};
  const defaultLogLevel = await getLogLevel(conexDefaultLogLevelKey);
  console.error('xxxx', defaultLogLevel);
  debug(context, `conex default log level is: '${defaultLogLevel}'`);
  window.addEventListener('storage', () => {
    console.log('XXXXXXXXXXXXXXXXXXXXXXX');
  });
}
async function persistLogLevel(component, level) {
  logSettings[component] = level;
  await browser.storage.local.set({
    logSettingsKey: logSettings,
  });
  debug(component, `persisting log setting '${component}' to '${level}'`);
}
async function getLogLevel(component) {
  let level = logSettings[component];
  if (level === undefined && component === conexDefaultLogLevelKey) {
    await persistLogLevel(component, defaultLevel);
    return defaultLevel;
  }
  if (level === undefined) {
    const defaultLoggingSetting = await getLogLevel(conexDefaultLogLevelKey);
    debug(context, `log component ${component} not set yet: setting to: ${defaultLoggingSetting}`);
    await persistLogLevel(component, defaultLoggingSetting);
    level = defaultLoggingSetting;
  }
  return level;
}
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
function log(level, component, data) {
  const callStack = (new Error()).stack.split('\n').slice(2)[0];
  let componentLogSetting = logSettings[component];
  if (componentLogSetting === undefined) {
    componentLogSetting = logSettings[conexDefaultLogLevelKey] || defaultLevel;
    getLogLevel(component).catch(e => {
      console.error(e);
    });
  }
  if (level === Level.Debug && logSettings[component] === Level.Debug) { return console.debug(`🐞 [conex:${component}]`, ...data, '\n', callStack); } else if (level === Level.Info && [Level.Debug, Level.Info].includes(componentLogSetting)) { return console.log(`[conex:${component}]`, ...data); } else if (level === Level.Warn && [Level.Debug, Level.Info, Level.Warn].includes(componentLogSetting)) { return console.warn(`[conex:${component}]`, ...data); } else if (level === Level.Error && [Level.Debug, Level.Info, Level.Warn, Level.Error].includes(componentLogSetting)) { return console.error(`[conex:${component}]`, ...data); }
}
init();
export { debug, info, warn, error, persistLogLevel, Level };
