import {$e, _, ContextualIdentitiesColors} from '../conex-helper.js';
import type {Browser, ContextualIdentities} from 'webextension-polyfill';
import {Tabs} from "webextension-polyfill";
import {ConexElements, Selectors} from '../conex-selectors.js';
import Tab = Tabs.Tab;

declare let browser: Browser;


export const fakeContainers: Array<ContextualIdentities.ContextualIdentity> = [
    {
        cookieStoreId: 'container0',
        color: 'orange',
        name: 'fake container-0 foo',
        colorCode: ContextualIdentitiesColors.orange,
        icon: 'circle',
        iconUrl: '',
    },
    {
        cookieStoreId: 'container1',
        color: 'blue',
        name: 'fake container-1 bar',
        colorCode: ContextualIdentitiesColors.blue,
        icon: 'circle',
        iconUrl: '',
    },
    {
        cookieStoreId: 'container2',
        color: 'red',
        name: 'fake container-2 baz',
        colorCode: ContextualIdentitiesColors.red,
        icon: 'circle',
        iconUrl: '',
    },
    {
        cookieStoreId: 'container3',
        color: 'turquoise',
        name: 'fake container-3 foobar',
        colorCode: ContextualIdentitiesColors.turquoise,
        icon: 'circle',
        iconUrl: '',
    },
    {
        cookieStoreId: 'container4',
        color: 'yellow',
        name: 'fake container-4 foobaz',
        colorCode: ContextualIdentitiesColors.yellow,
        icon: 'circle',
        iconUrl: '',
    },
];

// @ts-ignore
chai.config.includeStack = true;
// @ts-ignore
export const expect = chai.expect;

export function renderMainPageStub() {
    const searchField = $e('input', {id: Selectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text'});
    const form = $e('form', {}, [searchField]);
    window.document.body.appendChild(form);
}

export async function maxTabId(): Promise<number> {
    const maxId = (await browser.tabs.query({})).map((tab: Tab) => tab.id || 0)
        .reduce((previous, current) => {
            return previous > current ? previous : current
        }, 0)

    return maxId + 100
}

export function typeKey(key: KeyboardEventInit, element: Element) {
    const keyDownEvent = new KeyboardEvent('keydown', key);
    const keyUpEvent = new KeyboardEvent('keyup', key);

    element.dispatchEvent(keyDownEvent);
    element.dispatchEvent(keyUpEvent);
}

export async function clear() {
    if (window.location.search === '') {
        if (ConexElements.form) {
            ConexElements.form.remove();
        }
    }
}

export function timeoutResolver(ms: number) {
    return new Promise((resolve) => {
        setTimeout(function () {
            resolve(true);
        }, ms);
    });
}
