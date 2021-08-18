import { $ } from '../conex-helper.js';

export const fakeContainers = [
  { cookieStoreId: 'container0', color: 'orange', name: 'fake container-0' },
  { cookieStoreId: 'container1', color: 'blue', name: 'fake container-1' },
  { cookieStoreId: 'container2', color: 'red', name: 'fake container-2' },
  { cookieStoreId: 'container3', color: 'tourqouise', name: 'fake container-3' },
  { cookieStoreId: 'container4', color: 'yellow', name: 'fake container-4' },
];

chai.config.includeStack = true;
export const expect = chai.expect;

export function typeKey(key, element) {
  const keyDownEvent = new KeyboardEvent('keydown', { key: key.key, shiftKey: !!key.shift });
  const keyUpEvent = new KeyboardEvent('keyup', { key: key.key, shiftKey: !!key.shift });

  element.dispatchEvent(keyDownEvent);
  element.dispatchEvent(keyUpEvent);
}

export async function clear() {
  const form = $('form');
  if (form) {
    form.remove();
  }
}

export function timeoutResolver(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve(true);
    }, ms);
  });
}
