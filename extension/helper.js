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
export function debounce(func, wait = 200, immediate) {
  let timeoutFuncHandlerId;
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
