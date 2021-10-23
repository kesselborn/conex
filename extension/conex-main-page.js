import { ContainerRenderOptions, defaultContainer, formChange, renderContainers, renderTabs } from './conex-containers.js';
import { ConexElements, Selectors } from './conex-selectors.js';
import { keydown, keyup } from './conex-keyboard-input-handler.js';
import { $e, _ } from './conex-helper.js';
export async function renderMainPage(containers = [], options = new ContainerRenderOptions()) {
  if (containers.length === 0) {
    containers = await browser.contextualIdentities.query({});
  }
  const searchField = $e('input', { id: Selectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
  const form = $e('form', {}, [searchField]);
  window.document.body.appendChild(form);
  await renderContainers(containers, options);
  ConexElements.form.addEventListener('change', formChange, true);
  ConexElements.form.addEventListener('keydown', keydown, true);
  ConexElements.form.addEventListener('keyup', keyup, true);
  for (const container of [defaultContainer].concat(containers)) {
    const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
    renderTabs(tabs).then();
  }
}
