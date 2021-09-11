import {$, $e, _, ContexturalIdentitiesColorCodes} from './conex-helper.js';
import {keydown, keyup} from './conex-keyboard-input-handler.js';
import {htmlId2TabId, tabElement} from './conex-tab-element.js';
import {containerElement} from './conex-container-element.js';
import type {Browser} from "webextension-polyfill";
import {ContextualIdentities, Tabs} from "webextension-polyfill";
import ContextualIdentity = ContextualIdentities.ContextualIdentity;
import Tab = Tabs.Tab;

// @ts-ignore
declare let browser: Browser;

async function formChange(e: Event): Promise<void> {
    const target: EventTarget | null = e.target;
    if (!target) {
        return;
    }

    // @ts-ignore
    const action = target.name;

    const targetElement = target as HTMLInputElement;

    console.info('form change', e, 'target:', target);
    switch (action) {
        case 'toggle-tabs-visibility': {
            targetElement.checked = false;
            const containerElement = targetElement.parentElement!; // this action always has a parent
            containerElement.classList.toggle('collapsed');
            break;
        }
        case 'open-tab': {
            targetElement.checked = false;
            const tabElement = targetElement.parentElement!;
            browser.tabs.update(htmlId2TabId(tabElement.id), {active: true});
            break;
        }
        case 'close-tab': {
            targetElement.checked = false;
            const tabElement = targetElement.parentElement!; // this action always has a parent
            const tab = await browser.tabs.get(htmlId2TabId(tabElement.id))!;
            if (tab) {
                tabElement.dataset['url'] = tab.url;
                browser.tabs.remove(tab.id!);
                tabElement.classList.add('closed');
            }
            break;
        }
    }
}

export const defaultContainer: ContextualIdentity = {
    colorCode: ContexturalIdentitiesColorCodes.black,
    icon: 'circle',
    iconUrl: '',
    cookieStoreId: 'firefox-default', color: 'black', name: _('no container')
};

export const bookmarkDummyContainer: ContextualIdentity = {
    colorCode: ContexturalIdentitiesColorCodes.gold,
    icon: 'circle',
    iconUrl: '',
    cookieStoreId: 'bookmarks', color: 'gold', name: _('bookmarks')
};

export const historyDummyContainer: ContextualIdentity = {
    colorCode: ContexturalIdentitiesColorCodes.white,
    icon: 'circle',
    iconUrl: '',
    cookieStoreId: 'history', color: 'white', name: _('history')
};

// TODO: make options a fixed type; remove ts ignores for options
export async function renderContainers(_containers: Array<ContextualIdentity>, options: Object = {}): Promise<void> {
    const additionalContainers = [defaultContainer];
    // @ts-ignore
    if (options.bookmarks) {
        additionalContainers.push(bookmarkDummyContainer);
    }
    let containers = additionalContainers.concat(_containers);
    // @ts-ignore
    if (options.history) {
        containers.push(historyDummyContainer);
    }
    const containerList = $e('ol');

    // @ts-ignore
    if (options.order) {
        const cookieStoreIds = containers.map((c) => c.cookieStoreId);
        // @ts-ignore
        const orderedCookieStoreIds = options.order.concat(cookieStoreIds);
        containers = containers.sort((a, b) => orderedCookieStoreIds.indexOf(a.cookieStoreId) - orderedCookieStoreIds.indexOf(b.cookieStoreId));
    }

    for (const container of containers) {
        containerList.appendChild(containerElement(container));
    }

    const searchField = $e('input', {id: 'search', placeholder: _('searchBoxPlaceholder'), type: 'text'});

    const form = $e('form', {}, [searchField, containerList]);
    window.document.body.appendChild(form);
    $('form')!.addEventListener('change', formChange, true);
    $('form')!.addEventListener('keydown', keydown, true);
    $('form')!.addEventListener('keyup', keyup, true);
}

export async function fillContainer(container: ContextualIdentity, tabs: Promise<Array<Tab>>) {
    const containerElements = new Map;

    for (const tab of await tabs) {
        const cookieStoreId = tab.cookieStoreId!;

        const containerElement = $(`li#${cookieStoreId}`);
        if (!containerElement) {
            console.error(`container element for cookieStoreId=${cookieStoreId} not found`);
            return;
        }

        if (!containerElements.has(cookieStoreId)) {
            containerElements.set(cookieStoreId, containerElement.appendChild($e('ul')));
        }

        containerElements.get(cookieStoreId).appendChild(tabElement(container, tab));
        containerElement.classList.remove('empty');
    }
}
