import { ContainerRenderOptions, defaultContainer, formChange, renderContainers, renderTabs } from './containers.js';
import { ConexElements, Selectors } from './selectors.js';
import { keydown, keyup } from './keyboard-input-handler.js';
import { $e, _ } from './helper.js';
export async function renderMainPage(containers = [], options = new ContainerRenderOptions()) {
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
    setTimeout(() => {
        for (const container of [defaultContainer].concat(containers)) {
            const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
            renderTabs(tabs);
        }
    }, 100);
}
