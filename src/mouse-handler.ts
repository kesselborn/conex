import { ClassSelectors, Ids, InputNameSelectors, Selectors } from './constants.js';
import { debug } from './logger.js';
import { htmlId2TabId } from './tab-element.js';
import { Browser } from 'webextension-polyfill';
import { $, _, closeContainer } from './helper.js';
import { focusNextVisibleContainerSibling } from './keyboard-input-handler.js';

const component = 'mouse-handler';
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

export async function closeTab(tabElement: HTMLElement) {
  // save url, so we can undo the closing
  const tab = (await browser.tabs.get(htmlId2TabId(tabElement.id)))!;
  const waiters: Promise<void>[] = [];
  if (tab) {
    tabElement.dataset['url'] = tab.url;
    waiters.push(browser.tabs.remove(tab.id!));
    tabElement.classList.add(ClassSelectors.tabClosed);
  }

  await Promise.all(waiters);
}

export async function removeContainer(containerElement: Element) {
  const containerId = containerElement.id;
  const tabsInContainer = (await browser.tabs.query({ cookieStoreId: containerId })).length;
  const containerName = $(Selectors.containerName, containerElement)!.innerText!;
  if (tabsInContainer === 0 || confirm(_('closeContainerConfirmationDialoge', [containerName, tabsInContainer]))) {
    focusNextVisibleContainerSibling(containerElement);
    containerElement.classList.add(ClassSelectors.noMatch);
    await closeContainer(containerId);
  }
}

export async function formChange(e: Event): Promise<void> {
  if (!e.target || !(e.target instanceof HTMLInputElement)) {
    return;
  }

  const target = e.target as HTMLInputElement;

  debug(component, 'form change', e, 'target:', target).then();
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
      await openTab(tabElement);
      break;
    }
    case InputNameSelectors.closeTab: {
      target.checked = false;
      const tabElement = target.parentElement!; // this action always has a parent
      await closeTab(tabElement);
      break;
    }
    case InputNameSelectors.closeContainer: {
      target.checked = false;
      const containerElement = target.parentElement!; // this action always has a parent

      await removeContainer(containerElement);
      break;
    }
    case InputNameSelectors.openContainer: {
      target.checked = false;
      const containerElement = target.parentElement!; // this action always has a parent
      const cookieStoreId = containerElement.id;

      debug(component, `opening a new tab in ${cookieStoreId}`).then();

      const waiter = browser.tabs.create({
        active: true,
        cookieStoreId,
      });

      window.close();
      await waiter;
      break;
    }
  }
}

export async function openTabId(tabId: number) {
  const newlyActiveTab = await browser.tabs.update(tabId, { active: true });
  await browser.windows.update(newlyActiveTab.windowId!, { focused: true });
}

export async function openTab(tabElement: HTMLElement) {
  await debug(component, 'tab to be opened is', tabElement);
  if (isHistoryOrBookmarkItem(tabElement)) {
    await debug(component, 'request to open history or bookmark item');
    await browser.tabs.create({
      active: true,
      url: tabElement.dataset['url'],
    });
  } else {
    await debug(component, 'request to switch to open tab');
    const tabId = htmlId2TabId(tabElement.id);
    await openTabId(tabId);
  }
  window.close();
}
