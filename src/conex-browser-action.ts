import type {Browser} from 'webextension-polyfill';
import {renderMainPage} from './conex-main-page.js';
import {debug} from './conex-logger.js';

declare let browser: Browser;

const component = 'browser-action'

document.addEventListener('DOMContentLoaded', async () => {
    debug(component, 'browser-action dom content loaded')

    // @ts-ignore
    const bg = await browser.runtime.getBackgroundPage()
    // @ts-ignore
    // if (bg.xxx) document.body.innerHTML = bg.xxx;
    // @ts-ignore
    console.log('xxx', bg.xxx)

    setTimeout(() => renderMainPage(), 500);

});
