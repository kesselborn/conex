import { Browser, Tabs } from 'webextension-polyfill';
import { debug } from './logger.js';

declare let browser: Browser;

const component = 'tab-management';

export async function showHideTabs(newlyActiveTab: Tabs.Tab, lastCookieStoreId: string | undefined = undefined) {
  debug(component, 'showHideTabs with newlyActiveTab:', newlyActiveTab)
  if (newlyActiveTab.pinned) {
    await debug(component, 'not adjusting hidden tabs as this is a pinned tab');
    return;
  }

  if (newlyActiveTab.url?.startsWith(browser.runtime.getURL(''))) {
    await debug(component, 'not adjusting hidden tabs as this is an extension internal tab');
    return;
  }

  if (newlyActiveTab.cookieStoreId !== lastCookieStoreId) {
    await debug(
      component,
      `tab ${newlyActiveTab.id} activated, start showing container ${newlyActiveTab.cookieStoreId} / hiding the rest`
    );
    const tabs = await browser.tabs.query({});
    const tabsToBeShown: number[] = tabs
      .filter((tab) => tab.cookieStoreId === newlyActiveTab.cookieStoreId)
      .map((tab) => tab.id!);
    const tabsToBeHidden = tabs
      .filter((tab) => tab.cookieStoreId !== newlyActiveTab.cookieStoreId)
      .map((tab) => tab.id!);

    await browser.tabs.show(tabsToBeShown);
    await browser.tabs.hide(tabsToBeHidden);
  } else {
    debug(component, 'no hiding necessary ... already showing the correct tabs');
  }
}
