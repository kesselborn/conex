import { $e, _, ContexturalIdentitiesColorCodes } from './conex-helper.js';
import { keydown, keyup } from './conex-keyboard-input-handler.js';
import { htmlId2TabId, tabElement } from './conex-tab-element.js';
import { containerElement } from './conex-container-element.js';
import { ConexElements, Selectors } from './conex-selectors.js';
async function formChange(e) {
  if (!e.target || !(e.target instanceof HTMLInputElement)) {
    return;
  }
  const target = e.target;
  console.info('form change', e, 'target:', target);
  switch (target.name) {
    case Selectors.toggleTabsVisibilityName: {
      target.checked = false;
      const containerElement = target.parentElement; // this action always has a parent
      containerElement.classList.toggle('collapsed');
      break;
    }
    case Selectors.openTabName: {
      target.checked = false;
      const tabElement = target.parentElement;
      browser.tabs.update(htmlId2TabId(tabElement.id), { active: true });
      break;
    }
    case Selectors.closeTabName: {
      target.checked = false;
      const tabElement = target.parentElement; // this action always has a parent
      // save url, so we can undo the closing
      const tab = await browser.tabs.get(htmlId2TabId(tabElement.id));
      if (tab) {
        tabElement.dataset.url = tab.url;
        browser.tabs.remove(tab.id);
        tabElement.classList.add('closed');
      }
      break;
    }
  }
}
export const defaultContainer = {
  colorCode: ContexturalIdentitiesColorCodes.black,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'firefox-default',
  color: 'black',
  name: _('no container'),
};
export const bookmarkDummyContainer = {
  colorCode: ContexturalIdentitiesColorCodes.gold,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'bookmarks',
  color: 'gold',
  name: _('bookmarks'),
};
export const historyDummyContainer = {
  colorCode: ContexturalIdentitiesColorCodes.white,
  icon: 'circle',
  iconUrl: '',
  cookieStoreId: 'history',
  color: 'white',
  name: _('history'),
};
// TODO: make options a fixed type; remove ts ignores for options
export async function renderContainers(_containers, options = {}) {
  const additionalContainers = [defaultContainer];
  // @ts-ignore
  if (options.bookmarks) {
    additionalContainers.push(bookmarkDummyContainer);
  }
  let containers = additionalContainers.concat(_containers);
  // @ts-ignore
  if (options.history) {
    containers.push(historyDummyContainer);
  }
  const containerList = $e('ol');
  // @ts-ignore
  if (options.order) {
    const cookieStoreIds = containers.map((c) => c.cookieStoreId);
    // @ts-ignore
    const orderedCookieStoreIds = options.order.concat(cookieStoreIds);
    containers = containers.sort((a, b) => orderedCookieStoreIds.indexOf(a.cookieStoreId) - orderedCookieStoreIds.indexOf(b.cookieStoreId));
  }
  for (const container of containers) {
    containerList.appendChild(containerElement(container));
  }
  const searchField = $e('input', { id: Selectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
  const form = $e('form', {}, [searchField, containerList]);
  window.document.body.appendChild(form);
  ConexElements.form.addEventListener('change', formChange, true);
  ConexElements.form.addEventListener('keydown', keydown, true);
  ConexElements.form.addEventListener('keyup', keyup, true);
}
export async function renderTabs(tabs) {
  const containerElements = new Map();
  for (const tab of await tabs) {
    const cookieStoreId = tab.cookieStoreId;
    const containerElement = ConexElements.container(cookieStoreId);
    if (!containerElement) {
      console.error(`container element for cookieStoreId=${cookieStoreId} not found`);
      return;
    }
    if (!containerElements.has(cookieStoreId)) {
      containerElements.set(cookieStoreId, containerElement.appendChild($e('ul')));
    }
    containerElements.get(cookieStoreId).appendChild(tabElement(tab));
    containerElement.classList.remove(Selectors.emptyContainerClass);
  }
}
