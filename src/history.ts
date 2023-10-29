import { Browser, Tabs } from 'webextension-polyfill';
import { Ids } from './constants.js';
import Tab = Tabs.Tab;

declare let browser: Browser;

export async function getHistoryAsTabs(searchTerm: string = ' '): Promise<Array<Tab>> {
  let cnt = 0;
  if (searchTerm === '') searchTerm = ' ';
  return (await browser.history.search({ text: searchTerm, startTime: 0 }))
    .filter((h) => h.title !== null)
    .map(
      (b) =>
        ({
          id: cnt++,
          active: false,
          cookieStoreId: Ids.historyCookieStoreId,
          highlighted: false,
          incognito: false,
          index: 0,
          pinned: false,
          title: b.title,
          url: b.url,
        } as Tab)
    );
}
