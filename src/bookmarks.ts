import { Browser, Tabs } from 'webextension-polyfill';
import { Ids } from './constants.js';
import Tab = Tabs.Tab;

declare let browser: Browser;

export async function getBookmarksAsTabs(searchTerm: string = ' '): Promise<Array<Tab>> {
  if (searchTerm === '') searchTerm = ' ';
  return (await browser.bookmarks.search(searchTerm))
    .filter((b) => b.type === 'bookmark')
    .map(
      (b) =>
        ({
          active: false,
          cookieStoreId: Ids.bookmarksCookieStoreId,
          highlighted: false,
          incognito: false,
          index: 0,
          pinned: false,
          title: b.title,
          url: b.url,
        } as Tab)
    );
}
