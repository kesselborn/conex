import { renderMainPage } from './main-page.js';
import { debug } from './logger.js';
const component = 'browser-action';
document.addEventListener('DOMContentLoaded', async () => {
    debug(component, 'browser-action dom content loaded');
    // @ts-ignore
    const bg = await browser.runtime.getBackgroundPage();
    // @ts-ignore
    // if (bg.xxx) document.body.innerHTML = bg.xxx;
    // @ts-ignore
    debug(component, 'xxx', bg.xxx);
    setTimeout(() => renderMainPage(), 0);
});
