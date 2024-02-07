import { $, $e, _, ContextualIdentitiesColors } from './helper.js';
import { tabElement } from './tab-element.js';
import { containerElement, countLabel } from './container-element.js';
import { ContextualIdentities, Tabs } from 'webextension-polyfill';
import { ClassSelectors, ConexElements, Ids, Selectors } from './constants.js';
import { error } from './logger.js';
import { getBookmarksAsTabs } from './bookmarks.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;
import Tab = Tabs.Tab;

const component = 'containers';

export const defaultContainer: ContextualIdentityEx = {
  colorCode: ContextualIdentitiesColors.black,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: Ids.defaultCookieStoreId,
  color: 'black',
  name: _('no-container'),
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
  tabs: boolean = true;
  order: Array<string> | null = null;
}

export async function renderContainers(
  containers: Array<ContextualIdentity>,
  options: ContainerRenderOptions = new ContainerRenderOptions()
): Promise<void> {
  let finalContainerList = [defaultContainer, ...containers.map((x) => x as ContextualIdentityEx)];

  if (options.bookmarks) {
    bookmarkDummyContainer.tabCnt = `${(await getBookmarksAsTabs()).length}`;
    finalContainerList.push(bookmarkDummyContainer);
  }

  if (options.history) {
    finalContainerList.push(historyDummyContainer);
  }
  const containerList = $e('ol');

  if (options.order) {
    const cookieStoreIds = finalContainerList.map((c) => c.cookieStoreId);
    const orderedCookieStoreIds = options.order.concat(cookieStoreIds);
    finalContainerList = finalContainerList.sort(
      (a, b) => orderedCookieStoreIds.indexOf(a.cookieStoreId) - orderedCookieStoreIds.indexOf(b.cookieStoreId)
    );
  }

  for (const container of finalContainerList) {
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
    await error(component, `container element for cookieStoreId=${cookieStoreId} not found`);
    return;
  }

  // count
  $(Selectors.tabsCnt, containerElement)!.innerText = `(${tabs.length} ${countLabel(cookieStoreId)})`;

  for (const tab of tabs) {
    if (!containerElements.has(cookieStoreId)) {
      // eslint-disable-next-line no-void
      $('ul', containerElement)?.remove();
      containerElements.set(cookieStoreId, containerElement.appendChild($e('ul')));
    }

    tabSrc += tabElement(tab);
    containerElement.classList.remove(ClassSelectors.emptyContainer);
  }

  if (cookieStoreId) {
    containerElements.get(cookieStoreId).innerHTML = tabSrc;
  }
}
