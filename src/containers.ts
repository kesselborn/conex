import { $e, _, ContextualIdentitiesColors } from './helper.js';
import { htmlId2TabId, tabElement, tabElement2 } from './tab-element.js';
import { containerElement } from './container-element.js';
import type { Browser } from 'webextension-polyfill';
import { ContextualIdentities, Tabs } from 'webextension-polyfill';
import { ConexElements, Selectors } from './selectors.js';
import { debug, error } from './logger.js';
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
    case Selectors.toggleTabsVisibilityName: {
      target.checked = false;
      const containerElement = target.parentElement!; // this action always has a parent
      containerElement.classList.toggle(Selectors.collapsedContainer);
      break;
    }
    case Selectors.openTabName: {
      target.checked = false;
      const tabElement = target.parentElement!;
      browser.tabs.update(htmlId2TabId(tabElement.id), { active: true });
      window.close();
      break;
    }
    case Selectors.closeTabName: {
      target.checked = false;
      const tabElement = target.parentElement!; // this action always has a parent

      // save url, so we can undo the closing
      const tab = await browser.tabs.get(htmlId2TabId(tabElement.id))!;
      if (tab) {
        tabElement.dataset['url'] = tab.url;
        browser.tabs.remove(tab.id!);
        tabElement.classList.add(Selectors.tabClosed);
      }
      break;
    }
  }
}

export const defaultContainer: ContextualIdentity = {
  colorCode: ContextualIdentitiesColors.black,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'firefox-default',
  color: 'black',
  name: _('no container'),
};

export const bookmarkDummyContainer: ContextualIdentity = {
  colorCode: ContextualIdentitiesColors.gold,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'bookmarks',
  color: 'gold',
  name: _('bookmarks'),
};

export const historyDummyContainer: ContextualIdentity = {
  colorCode: ContextualIdentitiesColors.white,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'history',
  color: 'white',
  name: _('history'),
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
    additionalContainers.push(bookmarkDummyContainer);
  }
  containers = additionalContainers.concat(containers);

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
    containerList.appendChild(containerElement(container));
  }

  if (ConexElements.containerList) {
    ConexElements.containerList.replaceWith(containerList);
  } else {
    ConexElements.form.appendChild(containerList);
  }

  // @ts-ignore
  const bg = await browser.runtime.getBackgroundPage();
  // @ts-ignore
  bg.xxx = document.innerHTML;
}

export async function renderTabs(tabs: Promise<Array<Tab>>) {
  const containerElements = new Map();

  for (const tab of await tabs) {
    const cookieStoreId = tab.cookieStoreId!;

    const containerElement = ConexElements.container(cookieStoreId);
    if (!containerElement) {
      error(component, `container element for cookieStoreId=${cookieStoreId} not found`);
      return;
    }

    if (!containerElements.has(cookieStoreId)) {
      containerElements.set(cookieStoreId, containerElement.appendChild($e('ul')));
    }

    containerElements.get(cookieStoreId).appendChild(tabElement(tab));
    containerElement.classList.remove(Selectors.emptyContainerClass);
  }
}

export async function renderTabs2(tabs: Promise<Array<Tab>>) {
  const containerElements = new Map();
  let tabSrc = '';
  let cookieStoreId;

  for (const tab of await tabs) {
    cookieStoreId = tab.cookieStoreId!;

    const containerElement = ConexElements.container(cookieStoreId);
    if (!containerElement) {
      error(component, `container element for cookieStoreId=${cookieStoreId} not found`);
      return;
    }

    if (!containerElements.has(cookieStoreId)) {
      containerElements.set(cookieStoreId, containerElement.appendChild($e('ul')));
    }

    tabSrc += tabElement2(tab);
    // containerElements.get(cookieStoreId).appendChild(tabElement(tab));
    containerElement.classList.remove(Selectors.emptyContainerClass);
  }

  if (cookieStoreId) {
    containerElements.get(cookieStoreId).innerHTML = tabSrc;
  }
}
