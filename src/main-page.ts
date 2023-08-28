import { ContainerRenderOptions, defaultContainer, formChange, renderContainers, renderTabs2 } from './containers.js';
import { Browser, ContextualIdentities } from 'webextension-polyfill';
import { ConexElements, Selectors } from './selectors.js';
import { keydown, keyup } from './keyboard-input-handler.js';
import { $e, _ } from './helper.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;

declare let browser: Browser;

export async function renderMainPage(
  containers: Array<ContextualIdentity> = [],
  options: ContainerRenderOptions = new ContainerRenderOptions()
) {
  if (containers.length === 0) {
    containers = await browser.contextualIdentities.query({});
  }

  const searchField = $e('input', { id: Selectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
  const form = $e('form', {}, [searchField]);
  await window.document.body.appendChild(form);

  await renderContainers(containers, options);

  ConexElements.form.addEventListener('change', formChange, true);
  ConexElements.form.addEventListener('keydown', keydown, true);
  ConexElements.form.addEventListener('keyup', keyup, true);

  for (const container of [defaultContainer].concat(containers)) {
    const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
    await renderTabs2(tabs);
  }
  ConexElements.search.focus();
}
