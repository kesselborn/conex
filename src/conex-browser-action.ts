import type {Browser} from 'webextension-polyfill';
import {ConexElements} from './conex-selectors.js';
import {renderMainPage} from './conex-main-page.js';
import {debug} from './conex-logger.js';

declare let browser: Browser;

const component = 'browser-action'

document.addEventListener('DOMContentLoaded', async () => {
    debug(component, 'browser-action dom content loaded')
    await renderMainPage();

    ConexElements.search.focus();
});
