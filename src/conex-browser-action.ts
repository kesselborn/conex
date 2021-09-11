import type {Browser} from 'webextension-polyfill';
import {defaultContainer, fillContainer, renderContainers} from './conex-containers.js';
import {$} from './conex-helper.js';

declare let browser: Browser;

document.addEventListener('DOMContentLoaded', async () => {
    // const bg = browser.extension.getBackgroundPage();

    const containers = await browser.contextualIdentities.query({});
    renderContainers(containers);

    for (const container of [defaultContainer].concat(containers)) {
        const tabs = browser.tabs.query({cookieStoreId: container.cookieStoreId});
        fillContainer(container, tabs);
    }

    $('#search')!.focus();
});
