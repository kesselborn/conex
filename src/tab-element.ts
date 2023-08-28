import { Tabs } from 'webextension-polyfill';
import { _, Contants } from './helper.js';
import { Selectors } from './selectors.js';

export function tabId2HtmlId(id: number): string {
  return `t-${id}`;
}

export function htmlId2TabId(id: string): number {
  return Number(id.slice(2));
}

export function tabId2HtmlOpenTabId(id: number): string {
  return `ot-${id}`;
}

export function htmlOpenTabId2TabId(id: string): number {
  return Number(id.slice(3));
}

export function tabId2HtmlCloseTabId(id: number): string {
  return `x-${id}`;
}

export function htmlCloseTabId2TabId(id: string): number {
  return Number(id.slice(2));
}

export function tabElement(tab: Tabs.Tab): String {
  let favicon = tab.favIconUrl;
  let thumbnail;

  // this favIconUrl is returned on some firefox tabs but not accessible
  switch (favicon) {
    case 'chrome://mozapps/skin/extensions/extension.svg':
      favicon = Contants.addonsFavicon;
      break;
    case '':
    // fall through on purpose
    case undefined:
      favicon = 'chrome://branding/content/icon64.png';
      break;
  }

  // ot prefix: open tab
  // x prefix: close tab
  let src = `
  <li tabindex="0" id="${tabId2HtmlId(tab.id!)}">
    <input id="${tabId2HtmlOpenTabId(tab.id!)}" type="radio" name="${Selectors.openTabName}" value="${tab.id}"/>
    <label for="${tabId2HtmlOpenTabId(tab.id!)}" class="tab-center">
      <div class="images">`;

  if (thumbnail) {
    src += `
        <img class="favicon" src="${favicon || ''}"/>
        <img class="thumbnail" src="${favicon || ''}"/>
        `;
  } else {
    src += `
        <img class="favicon-only" src="${favicon || ''}"/>
        <img class="thumbnail" src=""/>
        `;
  }

  src += `
      </div>
      <div class="tab-names">
        <h3>${tab.title || ''}</h3>
        <h4>${tab.url || ''}</h4>
      </div>
    </label>
    <input id="${tabId2HtmlCloseTabId(tab.id!)}" type="radio" name="${Selectors.closeTabName}" value="${tab.id}"/>
    <label for="${tabId2HtmlCloseTabId(tab.id!)}" class="close" title="${_('closeWithDetails', ['tab', tab.title])}"/>
  </li>
  `;

  return src;
}
