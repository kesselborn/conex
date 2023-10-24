import { Browser, Tabs } from 'webextension-polyfill';
import Tab = Tabs.Tab;

declare let browser: Browser;

export async function getBookmarksAsTabs(searchTerm: string): Promise<Array<Tab>> {
  return (await browser.bookmarks.search(searchTerm))
    .filter((b) => b.type === 'bookmark')
    .map(
      (b) =>
        ({
          active: false,
          cookieStoreId: 'bookmarks',
          highlighted: false,
          incognito: false,
          index: 0,
          pinned: false,
          title: b.title,
          url: b.url,
        } as Tab)
    );
}

export async function bookmarkCnt(): Promise<number> {
  return (await browser.bookmarks.search(' ')).filter((b) => b.type === 'bookmark').length;
}
