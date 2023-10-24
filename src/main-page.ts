import {
  ContainerRenderOptions,
  ContextualIdentityEx,
  defaultContainer,
  formChange,
  renderContainers,
  renderTabs,
} from './containers.js';
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

  ConexElements.search.focus();

  setTimeout(async () => {
    for (const container of [defaultContainer].concat(containers.map((c) => c as ContextualIdentityEx))) {
      if (container.cookieStoreId !== 'bookmarks' && container.cookieStoreId !== 'history') {
        const tabs = Array.from(await browser.tabs.query({ cookieStoreId: container.cookieStoreId })!);
        tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

        renderTabs(await tabs);
      }
    }
  }, 100);
}
