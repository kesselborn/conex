import { Browser } from 'webextension-polyfill';

declare let browser: Browser;

export enum ContextualIdentitiesColors {
  orange = '#ff9f00',
  blue = '#37adff',
  turquoise = '#00c79a',
  green = '#51cd00',
  yellow = '#ffcb00',
  red = '#ff613d',
  pink = '#ff4bda',
  purple = '#af51f5',
  gold = '#daa520',
  black = '#000000',
  white = '#ffffff',
}

export const placeholderImage = browser.runtime.getURL('transparent.png');

export const placeholderFailedImage = browser.runtime.getURL('transparent-failed.png');

// alias for document.querySelectorAll
export function $$(s: string, parent: Element | Document = window.document): NodeListOf<HTMLElement> {
  return parent.querySelectorAll(s);
}

// alias for document.querySelector
/**
 * @param {string} s
 * @param {*} parent
 */
export function $(s: string, parent: Element | Document = window.document): HTMLElement | null {
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

export function $e(
  name: string,
  attributes: Record<string, string> = {},
  children: Array<Element> = Array.from([]) as Array<Element>
): Element {
  const e = window.document.createElement(name);

  for (const key in attributes) {
    const value = attributes[key]!;
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

export function debounce(func: Function, wait: number = 200, immediate: boolean) {
  let timeoutFuncHandlerId: NodeJS.Timeout | null;

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

export async function closeContainer(containerId: string) {
  const tabClosings = [];
  for (const tab of await browser.tabs.query({ cookieStoreId: containerId })) {
    tabClosings.push(browser.tabs.remove(tab.id!));
  }
  await Promise.all(tabClosings);
  await browser.contextualIdentities.remove(containerId);
}
