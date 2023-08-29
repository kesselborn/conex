import { Browser, ContextualIdentities } from 'webextension-polyfill';
import { Selectors } from './selectors.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;

declare let browser: Browser;

export async function containerElement(container: ContextualIdentity): Promise<Element> {
  const e = window.document.createElement('div');
  const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });

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
        <h2>
            <span>${container.name}</span>
            <span class="container-cnt" id="c-${container.cookieStoreId}-cnt">(${(await tabs).length} tabs)</span>
        </h2>
      </label>
    </li>`;

  return e.firstElementChild!;
}
