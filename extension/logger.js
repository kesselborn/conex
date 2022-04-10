'use strict';
var Level;
(function (Level) {
  Level[Level.Debug = 0] = 'Debug';
  Level[Level.Info = 1] = 'Info';
  Level[Level.Warn = 2] = 'Warn';
  Level[Level.Error = 3] = 'Error';
})(Level || (Level = {}));
function debug(component, ...data) {
  log(Level.Debug, component, data);
}
function log(level, component, ...data) {
  switch (level) {
    case Level.Debug:
      return console.debug(`[conex:${component}]`, ...data);
  }
}
