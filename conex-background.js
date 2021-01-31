console.log('hello from conex-background.js');

let xx = "original value"

window.foo = function () {
  return xx;
}

window.bar = function () {
  xx = "new value";
}