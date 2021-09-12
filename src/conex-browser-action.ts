import type { Browser } from 'webextension-polyfill';
import { defaultContainer, renderContainers, renderTabs } from './conex-containers.js';
import { ConexElements } from './conex-selectors.js';

declare let browser: Browser;

document.addEventListener('DOMContentLoaded', async () => {
  // const bg = browser.extension.getBackgroundPage();

  const containers = await browser.contextualIdentities.query({});
  await renderContainers(containers);

  for (const container of [defaultContainer].concat(containers)) {
    const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
    renderTabs(tabs).then();
  }

  ConexElements.search.focus();
});
