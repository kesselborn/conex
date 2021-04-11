import { _, $, $e } from './conex-helper.js';
import { keydown, keyup, showNewContainerTemplate } from './conex-keyboard-input-handler.js';
import { tabElement, htmlId2TabId } from './conex-tab-element.js';
import { containerElement } from './conex-container-element.js';

async function formChange(e) {
  const target = e.target;
  const action = target.name;

  console.info('form change', e, 'target:', e.target);
  switch (action) {
    case 'toggle-tabs-visibility': {
      target.checked = false;
      const containerElement = target.closest('.container-elem');
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

export const defaultContainer = { cookieStoreId: 'firefox-default', color: 'black', name: _('no container') };

export const bookmarkDummyContainer = { cookieStoreId: 'bookmarks', color: 'gold', name: _('bookmarks') };

export const historyDummyContainer = { cookieStoreId: 'history', color: 'white', name: _('history') };

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
  containerList.classList.add('containers-wrapper');

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

  const colors = ['gold', 'black', 'blue', 'turquoise', 'green', 'yellow', 'orange', 'red', 'pink', 'purple'];
  let selectColor = $e('select', { color: 'blue' });
  selectColor.addEventListener('change', function () {
    this.setAttribute('color', this.options[this.selectedIndex].getAttribute('color'));
  });
  colors.map(color => {
    selectColor.appendChild($e('option', { color, value: '●', content: '●' }));
  });
  // selectColor = optionsArray.map(option => selectColor.appendChild(option));

  const formHead = $e('div', { id: 'form-head' }, [
    $e('div', { id: 'search-wrapper' }, [
      $e('label', { for: 'search' }),
      $e('input', { id: 'search', placeholder: _('searchBoxPlaceholder'), type: 'text' }),
    ]),
    $e('div', { id: 'add-container-wrapper', tabindex: 0 }, [
      $e('img', { width: '25', height: '25', src: './plus.svg', alt: 'add-container' }),
      // $e('label', { for: 'add-container' }, [
      // ]),
      // $e('input', { id: 'add-container', type: 'button' }),
    ]),
    $e('div', { id: 'new-container', class: 'container-elem' }, [
      selectColor,
      $e('input', { required: '', placeholder: 'new container', type: 'text' }),
      // $e('input', { placeholder: _('newContainerPlaceholder'), type: 'text' }),
    ]),
  ]);

  const form = $e('form', {}, [formHead, containerList]);
  window.document.body.appendChild(form);
  $('form').addEventListener('change', formChange, {}, true);
  $('form').addEventListener('keydown', keydown, true);
  $('form').addEventListener('keyup', keyup, true);
  $('#add-container-wrapper').addEventListener("click", showNewContainerTemplate);
}

export async function fillContainer(container, tabs) {
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
    containerElements[cookieStoreId].appendChild(tabElement(container, tab));
    containerElement.classList.remove('empty');
  }
}
