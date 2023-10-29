import { $, $e, _, ContextualIdentitiesColors } from './helper.js';
import { htmlId2TabId, tabElement } from './tab-element.js';
import { containerElement, countLabel } from './container-element.js';
import type { Browser } from 'webextension-polyfill';
import { ContextualIdentities, Tabs } from 'webextension-polyfill';
import { ClassSelectors, ConexElements, Ids, InputNameSelectors, Selectors } from './constants.js';
import { debug, error } from './logger.js';
import { removeContainer } from './keyboard-input-handler.js';
import { getBookmarksAsTabs } from './bookmarks.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;
import Tab = Tabs.Tab;

declare let browser: Browser;

const component = 'containers';

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
      browser.tabs.update(htmlId2TabId(tabElement.id), { active: true });
      window.close();
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

export const defaultContainer: ContextualIdentityEx = {
  colorCode: ContextualIdentitiesColors.black,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'firefox-default',
  color: 'black',
  name: _('no container'),
  hidden: false,
  tabCnt: undefined,
};

export interface ContextualIdentityEx extends ContextualIdentity {
  hidden: boolean;
  tabCnt: string | undefined;
}

export const bookmarkDummyContainer: ContextualIdentityEx = {
  colorCode: ContextualIdentitiesColors.gold,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: Ids.bookmarksCookieStoreId,
  color: 'gold',
  name: _('bookmarks'),
  hidden: true,
  tabCnt: '?',
};

export const historyDummyContainer: ContextualIdentityEx = {
  colorCode: ContextualIdentitiesColors.white,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: Ids.historyCookieStoreId,
  color: 'white',
  name: _('history'),
  hidden: true,
  tabCnt: _('many'),
};

export class ContainerRenderOptions {
  bookmarks: boolean = false;
  history: boolean = false;
  order: Array<string> | null = null;
}

export async function renderContainers(
  containers: Array<ContextualIdentity>,
  options: ContainerRenderOptions = new ContainerRenderOptions()
): Promise<void> {
  const additionalContainers = [defaultContainer];

  if (options.bookmarks) {
    bookmarkDummyContainer.tabCnt = `${(await getBookmarksAsTabs()).length}`;
    additionalContainers.push(bookmarkDummyContainer);
  }
  containers = additionalContainers.concat(containers.map((x) => x as ContextualIdentityEx));

  if (options.history) {
    containers.push(historyDummyContainer);
  }
  const containerList = $e('ol');

  if (options.order) {
    const cookieStoreIds = containers.map((c) => c.cookieStoreId);
    const orderedCookieStoreIds = options.order.concat(cookieStoreIds);
    containers = containers.sort(
      (a, b) => orderedCookieStoreIds.indexOf(a.cookieStoreId) - orderedCookieStoreIds.indexOf(b.cookieStoreId)
    );
  }

  for (const container of containers) {
    containerList.appendChild(await containerElement(container as ContextualIdentityEx));
  }

  if (ConexElements.containerList) {
    ConexElements.containerList.replaceWith(containerList);
  } else {
    ConexElements.form.appendChild(containerList);
  }
}

export async function renderTabs(tabs: Array<Tab>) {
  if (tabs.length === 0) {
    return;
  }
  const containerElements = new Map();
  let tabSrc = '';
  let cookieStoreId = tabs[0]!.cookieStoreId!;
  const containerElement = ConexElements.container(cookieStoreId);
  if (!containerElement) {
    error(component, `container element for cookieStoreId=${cookieStoreId} not found`);
    return;
  }

  // count
  $(Selectors.tabsCnt, containerElement)!.innerText = `(${(await tabs).length} ${countLabel(cookieStoreId)})`;

  for (const tab of await tabs) {
    if (!containerElements.has(cookieStoreId)) {
      // eslint-disable-next-line no-void
      await $('ul', containerElement)?.remove();
      containerElements.set(cookieStoreId, containerElement.appendChild($e('ul')));
    }

    tabSrc += tabElement(tab);
    containerElement.classList.remove(ClassSelectors.emptyContainer);
  }

  if (cookieStoreId) {
    containerElements.get(cookieStoreId).innerHTML = tabSrc;
  }
}
