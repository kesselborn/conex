import { _, $, $e } from './conex-helper.js';
import { keydown, keyup } from './conex-keyboard-input-handler.js';
import { tabElement, htmlId2TabId } from './conex-tab-element.js';
import { containerElement } from './conex-container-element.js';

async function formChange(e) {
  const target = e.target;
  const action = target.name;

  console.info('form change', e, 'target:', e.target);
  switch (action) {
    case 'toggle-tabs-visibility': {
      target.checked = false;
      const containerElement = target.parentElement;
      containerElement.classList.toggle('collapsed');
      break;
    }
    case 'open-tab': {
      target.checked = false;
      const tabElement = target.parentElement;
      browser.tabs.update(htmlId2TabId(tabElement.id), { active: true });
      break;
    }
    case 'close-tab': {
      target.checked = false;
      const tabElement = target.parentElement;
      const tab = await browser.tabs.get(htmlId2TabId(tabElement.id));
      tabElement.dataset.url = tab.url;
      browser.tabs.remove(tab.id);
      tabElement.classList.add('closed');
      break;
    }
  }
}

export const defaultContainer = { cookieStoreId: 'firefox-default', color: 'black', name: 'no container' };

export const bookmarkDummyContainer = { cookieStoreId: 'bookmarks', color: 'gold', name: 'bookmarks' };

export const historyDummyContainer = { cookieStoreId: 'history', color: 'white', name: 'history' };

export async function renderContainers(_containers, options = {}) {
  const additionalContainers = [defaultContainer];
  if (options.bookmarks) {
    additionalContainers.push(bookmarkDummyContainer);
  }
  let containers = additionalContainers.concat(_containers);
  if (options.history) {
    containers.push(historyDummyContainer);
  }
  const containerList = $e('ol');

  if (options.order) {
    const cookieStoreIds = containers.map((c) => c.cookieStoreId);
    const orderedCookieStoreIds = options.order.concat(cookieStoreIds);
    containers = containers.sort(function (a, b) {
      return orderedCookieStoreIds.indexOf(a.cookieStoreId) > orderedCookieStoreIds.indexOf(b.cookieStoreId);
    });
  }

  for (const container of containers) {
    containerList.appendChild(containerElement(container));
  }

  const searchField = $e('input', { id: 'search', placeholder: _('searchBoxPlaceholder'), type: 'text' });

  const form = $e('form', {}, [searchField, containerList]);
  window.document.body.appendChild(form);
  $('form').addEventListener('change', formChange, {}, true);
  $('form').addEventListener('keydown', keydown, true);
  $('form').addEventListener('keyup', keyup, true);
}

export async function fillContainer(tabs) {
  const containerElements = {};

  for (const tab of await tabs) {
    const cookieStoreId = tab.cookieStoreId;
    const containerElement = $(`li#${cookieStoreId}`);
    if (!containerElement) {
      console.error(`container element for cookieStoreId=${cookieStoreId} not found`);
    }
    if (!containerElements[cookieStoreId]) {
      containerElements[cookieStoreId] = containerElement.appendChild($e('ul'));
    }
    containerElements[cookieStoreId].appendChild(tabElement(tab));
    containerElement.classList.remove('empty');
  }
}
