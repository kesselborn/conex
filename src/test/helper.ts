import { $e, _, ContextualIdentitiesColors } from '../helper.js';
import type { Browser, ContextualIdentities } from 'webextension-polyfill';
import { Tabs } from 'webextension-polyfill';
import { ConexElements, IdSelectors } from '../constants.js';
import Tab = Tabs.Tab;

declare let browser: Browser;

export const fakeContainers: Array<ContextualIdentities.ContextualIdentity> = [
  {
    cookieStoreId: 'container0',
    color: 'orange',
    name: 'fake container-0 foo',
    colorCode: ContextualIdentitiesColors.orange,
    icon: 'circle',
    iconUrl: '',
  },
  {
    cookieStoreId: 'container1',
    color: 'blue',
    name: 'fake container-1 bar',
    colorCode: ContextualIdentitiesColors.blue,
    icon: 'circle',
    iconUrl: '',
  },
  {
    cookieStoreId: 'container2',
    color: 'red',
    name: 'fake container-2 baz',
    colorCode: ContextualIdentitiesColors.red,
    icon: 'circle',
    iconUrl: '',
  },
  {
    cookieStoreId: 'container3',
    color: 'turquoise',
    name: 'fake container-3 foobar',
    colorCode: ContextualIdentitiesColors.turquoise,
    icon: 'circle',
    iconUrl: '',
  },
  {
    cookieStoreId: 'container4',
    color: 'yellow',
    name: 'fake container-4 foobaz',
    colorCode: ContextualIdentitiesColors.yellow,
    icon: 'circle',
    iconUrl: '',
  },
];

// @ts-ignore
chai.config.includeStack = true;
// @ts-ignore
export const expect = chai.expect;

export async function waitForTabIdToBeActive(id: number): Promise<boolean> {
  let tabBecameActive = false;
  const listenerFn = function (info: Tabs.OnActivatedActiveInfoType) {
    if (info.tabId === id) {
      browser.tabs.onActivated.removeListener(listenerFn);
      tabBecameActive = true;
    }
  };
  browser.tabs.onActivated.addListener(listenerFn);
  for (let i = 0; i < 10; i++) {
    await timeoutResolver(50);
    if (tabBecameActive) {
      return true;
    }
  }
  browser.tabs.onActivated.removeListener(listenerFn);
  throw `tab with id ${id} never became active`;
}

export async function waitForTabIdToBeClosed(id: number): Promise<boolean> {
  let tabClosed = false;
  const listenerFn = function (tabId: number, _info: Tabs.OnRemovedRemoveInfoType) {
    if (tabId === id) {
      browser.tabs.onRemoved.removeListener(listenerFn);
      tabClosed = true;
    }
  };
  browser.tabs.onRemoved.addListener(listenerFn);
  for (let i = 0; i < 10; i++) {
    await timeoutResolver(50);
    if (tabClosed) {
      return true;
    }
  }
  browser.tabs.onRemoved.removeListener(listenerFn);
  throw `tab with id ${id} was never removed`;
}

export async function waitForTabToAppear(url: string): Promise<number> {
  let tabCreated = false;
  let tabId = 0;
  const listenerFn = function (_tabId: number, info: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab) {
    if (tab.url === url && (info.status === 'loading' || info.status === 'compliete')) {
      browser.tabs.onUpdated.removeListener(listenerFn);
      tabCreated = true;
      tabId = tab.id!;
    }
  };
  browser.tabs.onUpdated.addListener(listenerFn);
  for (let i = 0; i < 10; i++) {
    await timeoutResolver(50);
    if (tabCreated) {
      return tabId;
    }
  }

  browser.tabs.onUpdated.removeListener(listenerFn);
  throw `no tab with url ${url} created`;
}

export function renderMainPageStub() {
  const searchField = $e('input', { id: IdSelectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
  const form = $e('form', {}, [searchField]);
  window.document.body.appendChild(form);
}

export async function maxTabId(): Promise<number> {
  const maxId = (await browser.tabs.query({}))
    .map((tab: Tab) => tab.id || 0)
    .reduce((previous, current) => {
      return previous > current ? previous : current;
    }, 0);

  return maxId + 100;
}

export function typeKey(key: KeyboardEventInit, element: Element) {
  const keyDownEvent = new KeyboardEvent('keydown', key);
  // const keyUpEvent = new KeyboardEvent('keyup', key);

  element.dispatchEvent(keyDownEvent);
  // element.dispatchEvent(keyUpEvent);
}

export async function clear() {
  if (ConexElements.form) {
    ConexElements.form.remove();
  }
}

export function timeoutResolver(ms: number) {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve(true);
    }, ms);
  });
}
