import {
  ContainerRenderOptions,
  ContextualIdentityEx,
  defaultContainer,
  renderContainers,
  renderTabs,
} from './containers.js';
import { Browser, ContextualIdentities } from 'webextension-polyfill';
import { ConexElements, IdSelectors } from './constants.js';
import { keydown, keyup } from './keyboard-input-handler.js';
import { $e, _ } from './helper.js';
import { getBookmarksAsTabs } from './bookmarks.js';
import { formChange } from './mouse-handler.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;

declare let browser: Browser;

export async function renderMainPage(
  containers: Array<ContextualIdentity> = [],
  options: ContainerRenderOptions = new ContainerRenderOptions()
) {
  if (containers.length === 0) {
    containers = await browser.contextualIdentities.query({});
  }

  const searchField = $e('input', { id: IdSelectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
  const form = $e('form', { id: 'browser-action' }, [searchField]);
  window.document.body.appendChild(form);

  await renderContainers(containers, options);

  ConexElements.form.addEventListener('change', formChange, true);
  ConexElements.form.addEventListener('keydown', keydown, true);
  ConexElements.form.addEventListener('keyup', keyup, true);

  ConexElements.search.focus();

  const waiters: Promise<void>[] = [];
  setTimeout(async () => {
    if (options.bookmarks) {
      waiters.push(renderTabs(await getBookmarksAsTabs()));
    }
    for (const container of [defaultContainer].concat(containers.map((c) => c as ContextualIdentityEx))) {
      if (container.cookieStoreId !== 'history') {
        const tabs = Array.from((await browser.tabs.query({ cookieStoreId: container.cookieStoreId }))!);
        tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
        if (options.tabs) {
          waiters.push(renderTabs(tabs));
        }
      }
    }
  }, 200);
  await Promise.all(waiters);
}
