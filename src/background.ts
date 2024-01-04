import { debug } from './logger.js';
import { Browser, Tabs } from 'webextension-polyfill';

interface OnActivatedActiveInfoType {
  tabId: number;
  previousTabId?: number;
  windowId: number;
}

const component = 'background';

debug(component, '👋');

declare let browser: Browser;

export async function showHideTabs(newlyActiveTab: Tabs.Tab) {
  if (newlyActiveTab.pinned) {
    debug(component, 'not adjusting hidden tabs as this is a pinned tab');
    return;
  }

  debug(component, `start showing container ${newlyActiveTab.cookieStoreId}/ hiding the rest`);
  const tabs = await browser.tabs.query({});
  const tabsToBeShown: number[] = tabs
    .filter((tab) => tab.cookieStoreId === newlyActiveTab.cookieStoreId)
    .map((tab) => tab.id!);
  const tabsToBeHidden = tabs.filter((tab) => tab.cookieStoreId !== newlyActiveTab.cookieStoreId).map((tab) => tab.id!);

  await browser.tabs.show(tabsToBeShown);
  await browser.tabs.hide(tabsToBeHidden);

  debug(component, '  done');
}

// @ts-ignore
async function showHideTabsCallback(activeInfo: OnActivatedActiveInfoType) {
  const tab = await browser.tabs.get(activeInfo.tabId);
  showHideTabs(tab);
}

browser.tabs.onActivated.addListener(showHideTabsCallback);
