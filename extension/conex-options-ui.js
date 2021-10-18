import { $ } from './conex-helper.js';
async function showHideDebugUI() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
        await browser.storage.local.set({
            showDebugUI: true,
        });
    }
    if (params.get('debug') === '0') {
        await browser.storage.local.set({
            showDebugUI: false,
        });
    }
    if ((await browser.storage.local.get('showDebugUI'))['showDebugUI'] === true) {
        $('section#debug').style.display = 'block';
    }
    // if (params.get('log')) {
    //   logLevel(params.get('log'));
    // }
    console.log('boom');
    // debug('console.debug output');
}
showHideDebugUI();
