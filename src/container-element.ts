import { Browser } from 'webextension-polyfill';
import { ClassSelectors, Ids, InputNameSelectors } from './constants.js';
import { _ } from './helper.js';
import { ContextualIdentityEx } from './containers.js';

declare let browser: Browser;

export function htmlCloseContainerId2ContainerId(htmlId: string): string {
  return htmlId.slice(2);
}

export function containerId2HtmlCloseContainerId(containerId: string): string {
  return `x-${containerId}`;
}

export function countLabel(cookieStoreId: string): string {
  switch (cookieStoreId) {
    case Ids.bookmarksCookieStoreId:
      return _('bookmarks');
    case Ids.historyCookieStoreId:
      return _('history-label');
    default:
      return _('tabs');
  }
}

export async function containerElement(container: ContextualIdentityEx): Promise<Element> {
  const e = window.document.createElement('div');
  const tabCnt = container.tabCnt
    ? container.tabCnt
    : (await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length;

  e.innerHTML = `
    <li tabindex="0"
        class="collapsed container-color-${container.color} ${ClassSelectors.emptyContainer}"
        id="${container.cookieStoreId}">
      <input id="e-${container.cookieStoreId}"
             type="radio"
             name="${InputNameSelectors.toggleTabsVisibilityName}"
             value="${container.cookieStoreId}"/>
      <label for="e-${container.cookieStoreId}" class="tabs-visibility"></label>
      <input id="c-${container.cookieStoreId}"
             type="radio"
             name="${InputNameSelectors.openContainer}"
             value="${container.cookieStoreId}"/>
      <label for="c-${container.cookieStoreId}">
        <h2>
            <span>${container.name}</span>
            <span class="container-cnt" id="c-${container.cookieStoreId}-cnt">(${tabCnt} ${countLabel(
    container.cookieStoreId
  )})</span>
        </h2>
      </label>
      <input id="${containerId2HtmlCloseContainerId(container.cookieStoreId)}" type="radio" name="${
    InputNameSelectors.closeContainer
  }" value="${container.cookieStoreId}"/>
      <label for="${containerId2HtmlCloseContainerId(container.cookieStoreId)}" class="close" title="${_(
    'closeWithDetails',
    ['container', container.name]
  )}">X</label>
    </li>`;

  return e.firstElementChild!;
}
