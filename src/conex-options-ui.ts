import {$, $e} from './conex-helper.js';
import {Browser} from 'webextension-polyfill';
import {debug, Level, loadSettings, persistLogLevel} from './conex-logger.js';

const component = 'options-ui'

declare let browser: Browser;

async function showHideDebugUI() {
    const params = new URLSearchParams(window.location.search);
    let debugParam = params.get('debug')
    let showDebugUISetting = await browser.storage.local.get('showDebugUI')

    if (!debugParam) {
        debugParam = '0'
    }

    if (debugParam === '1') {
        debug(component, "enabling debug section")
        await browser.storage.local.set({
            showDebugUI: true,
        });
    }

    if (debugParam === '0') {
        debug(component, "disabling debug section")
        await browser.storage.local.set({
            showDebugUI: false,
        });
    }

    showDebugUISetting = await browser.storage.local.get('showDebugUI')
    if (showDebugUISetting['showDebugUI'] === true) {
        $('section#debug')!.style.display = 'block';
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    let secretCnt: number = 0;
    showHideDebugUI();

    $('#secret')!.addEventListener('click', async () => {
        secretCnt += 1;
        if (secretCnt >= 5) {
            $('#show-debug-section-link')!.style.display = 'inherit';
        }
    })

    const logSettings = await loadSettings()

    function newSelectionBox(component: string): Element {
        return $e("li", {}, [
            $e("span", {content: component}),
            $e("select", {name: component}, [
                $e("option", {value: Level.Debug, content: Level.Debug}),
                $e("option", {value: Level.Info, content: Level.Info}),
                $e("option", {value: Level.Warn, content: Level.Warn}),
                $e("option", {value: Level.Error, content: Level.Error}),
            ])
        ])
    }

    const selectorContainer = $('#debug-level-selector')!
    for (const key in logSettings) {
        const value = logSettings[key]

        const selectionBox = newSelectionBox(key)
        const option = selectionBox!.querySelector(`option[value=${value}]`)

        if (option)
            option.setAttribute('selected', 'selected')

        debug(component, `adding selection box for component ${key}`)

        await selectorContainer.appendChild(selectionBox)
    }

    selectorContainer.addEventListener('click', (e) => {
        const value = (e.target as HTMLOptionElement).value
        const selectedComponent = ((e.target as HTMLOptionElement).parentNode as HTMLSelectElement).name
        debug(component, `log-level adjustment: component ${selectedComponent}=${value}`)
        persistLogLevel(selectedComponent, value as Level)
    })
});
