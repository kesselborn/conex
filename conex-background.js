console.log('hello from conex-background.js');

let xx = "original value"

window.foo = function () {
  return xx;
}

window.bar = function () {
  xx = "new value";
}

window.logLevel = function (s) {
  console.error('=> debug');
  debugger;
  switch (s) {
    case 'debug':
      console.debug('=> debug');
      window.debug = console.debug;
      window.info = console.info;
      break;
    case 'info':
      console.debug('=> info');
      window.debug = function () { };
      window.info = console.info;
      break;
  }
}