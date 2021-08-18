import { renderContainers, fillContainer, defaultContainer } from './conex-containers.js';
import { $ } from './conex-helper.js';
document.addEventListener('DOMContentLoaded', async () => {
  // const bg = browser.extension.getBackgroundPage();

  const containers = await browser.contextualIdentities.query({});
  renderContainers(containers);

  for (const container of [defaultContainer].concat(containers)) {
    const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
    fillContainer(container, tabs);
  }

  $('#search').focus();
});
