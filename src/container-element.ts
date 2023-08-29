import { ContextualIdentities } from 'webextension-polyfill';
import { Selectors } from './selectors.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;

export function containerElement(container: ContextualIdentity): Element {
  const e = window.document.createElement('div');

  e.innerHTML = `
    <li tabindex="0"
        class="collapsed container-color-${container.color} ${Selectors.emptyContainerClass}"
        id="${container.cookieStoreId}">
      <input id="e-${container.cookieStoreId}"
             type="radio"
             name="${Selectors.toggleTabsVisibilityName}"
             value="${container.cookieStoreId}"/>
      <label for="e-${container.cookieStoreId}" class="tabs-visibility"></label>
      <input id="c-${container.cookieStoreId}"
             type="radio"
             name="${Selectors.openContainerName}"
             value="${container.cookieStoreId}"/>
      <label for="c-${container.cookieStoreId}">
        <h2>${container.name}</h2>
      </label>
    </li>`;

  return e.firstElementChild!;
}
