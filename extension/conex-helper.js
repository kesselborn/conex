// todo: make debugging a setting
// eslint-disable-next-line no-empty-function
// console.origDebug = console.debug;
// console.debug = () => {};
// console.debug = function (..._) { }
export var ContextualIdentitiesColors;
(function (ContextualIdentitiesColors) {
  ContextualIdentitiesColors.orange = '#ff9f00';
  ContextualIdentitiesColors.blue = '#37adff';
  ContextualIdentitiesColors.turquoise = '#00c79a';
  ContextualIdentitiesColors.green = '#51cd00';
  ContextualIdentitiesColors.yellow = '#ffcb00';
  ContextualIdentitiesColors.red = '#ff613d';
  ContextualIdentitiesColors.pink = '#ff4bda';
  ContextualIdentitiesColors.purple = '#af51f5';
  ContextualIdentitiesColors.gold = '#daa520';
  ContextualIdentitiesColors.black = '#000000';
  ContextualIdentitiesColors.white = '#ffffff';
})(ContextualIdentitiesColors || (ContextualIdentitiesColors = {}));
export const placeholderImage = browser.runtime.getURL('transparent.png');
export const placeholderFailedImage = browser.runtime.getURL('transparent-failed.png');
// alias for document.querySelectorAll
export function $$(s, parent = window.document) {
  return parent.querySelectorAll(s);
}
// alias for document.querySelector
/**
 * @param {string} s
 * @param {*} parent
 */
export function $(s, parent = window.document) {
  return parent.querySelector(s);
}
// creates a dom element, can contain children; attributes contains a map of the elements attributes
// with 'content' being a special attribute representing the text node's content; underscores in
// keys will be changed to dashes
//
// $e('div', {class: 'foo'}, [
//   $e('span', {class: 'bar1', data_foo: 'bar', content: 'baz1'}),
//   $e('span', {class: 'bar2', content: 'baz2y})
// ]);
//
// will produce:
//
// <div class='foo'><span class='bar1' data-foo='bar'>baz1</span><span class='bar2'>baz2</span></div>
//
export function $e(name, attributes = {}, children = Array.from([])) {
  const e = window.document.createElement(name);
  for (const key in attributes) {
    const value = attributes[key];
    if (key === 'content') {
      e.appendChild(window.document.createTextNode(value));
    } else {
      e.setAttribute(key.replace(/_/gu, '-'), value);
    }
  }
  for (const child of children) {
    e.appendChild(child);
  }
  return e;
}
export const _ = browser.i18n.getMessage;
// const cleanUrl = url => {
//   return url.replace('http://','').replace('https://','').toLowerCase();
// };
//
// var settings = {};
//
// function _refreshSettings() {
//   return new Promise((resolve, reject) => {
//     browser.storage.local.get([
//       'conex/settings/create-thumbnail',
//       'conex/settings/experimental-features',
//       'conex/settings/hide-tabs',
//       'conex/settings/search-bookmarks',
//       'conex/settings/search-history',
//       'conex/settings/settings-version',
//       'conex/settings/show-container-selector',
//       'conex/settings/show-favicons',
//       'conex/settings/close-reopened-tabs',
//     ]).then(localSettings => {
//       for (const key in localSettings) {
//         // conex/settings/create-thumbnail -> create-thumbnail
//         const id = key.split('/')[key.split('/').length - 1];
//         settings[id] = localSettings[key];
//       }
//       console.info('settings: ', settings);
//       resolve();
//     }, e => console.error(e));
//   });
// }
//
// let readSettings = _refreshSettings();
export function debounce(func, wait = 200, immediate) {
  let timeoutFuncHandlerId = null;
  // @ts-ignore
  return (...args) => {
    const later = () => {
      timeoutFuncHandlerId = null;
      if (!immediate) {
        Reflect.apply(func, null, args);
      }
    };
    const callNow = immediate && !timeoutFuncHandlerId;
    if (timeoutFuncHandlerId) {
      clearTimeout(timeoutFuncHandlerId);
    }
    timeoutFuncHandlerId = setTimeout(later, wait);
    if (callNow) {
      Reflect.apply(func, null, args);
    }
  };
}
export async function closeContainer(containerId) {
  const tabClosings = [];
  for (const tab of await browser.tabs.query({ cookieStoreId: containerId })) {
    tabClosings.push(browser.tabs.remove(tab.id));
  }
  await Promise.all(tabClosings);
  await browser.contextualIdentities.remove(containerId);
}
