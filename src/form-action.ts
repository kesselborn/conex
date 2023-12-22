import { ClassSelectors, Ids, InputNameSelectors } from './constants.js';
import { debug } from './logger.js';
import { htmlId2TabId } from './tab-element.js';
import { removeContainer } from './keyboard-input-handler.js';
import { Browser } from 'webextension-polyfill';

const component = 'form-action';
declare let browser: Browser;

function isHistoryOrBookmarkItem(e: HTMLElement): boolean {
  while (e.parentElement) {
    e = e.parentElement;
    if (e.id === Ids.historyCookieStoreId || e.id === Ids.bookmarksCookieStoreId) {
      return true;
    }
  }
  return false;
}

export function openTab(tabElement: HTMLElement) {
  debug(component, 'tab to be opened is', tabElement);
  if (isHistoryOrBookmarkItem(tabElement)) {
    debug(component, 'request to open history or bookmark item');
    browser.tabs.create({
      active: true,
      url: tabElement.dataset['url'],
    });
  } else {
    debug(component, 'request to switch to open tab');
    const tabId = htmlId2TabId(tabElement.id);
    browser.tabs.update(tabId, { active: true });
  }
  window.close();
}

export async function formChange(e: Event): Promise<void> {
  if (!e.target || !(e.target instanceof HTMLInputElement)) {
    return;
  }

  const target = e.target as HTMLInputElement;

  debug(component, 'form change', e, 'target:', target);
  switch (target.name) {
    case InputNameSelectors.toggleTabsVisibilityName: {
      target.checked = false;
      const containerElement = target.parentElement!; // this action always has a parent
      containerElement.classList.toggle(ClassSelectors.collapsedContainer);
      break;
    }
    case InputNameSelectors.openTab: {
      target.checked = false;
      const tabElement = target.parentElement!;
      openTab(tabElement);
      break;
    }
    case InputNameSelectors.closeTab: {
      target.checked = false;
      const tabElement = target.parentElement!; // this action always has a parent

      // save url, so we can undo the closing
      const tab = await browser.tabs.get(htmlId2TabId(tabElement.id))!;
      if (tab) {
        tabElement.dataset['url'] = tab.url;
        browser.tabs.remove(tab.id!);
        tabElement.classList.add(ClassSelectors.tabClosed);
      }
      break;
    }
    case InputNameSelectors.closeContainer: {
      target.checked = false;
      const containerElement = target.parentElement!; // this action always has a parent

      await removeContainer(containerElement);
      break;
    }
  }
}
