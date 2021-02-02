import { $, $e } from "./conex-helper.js";

function formChange(e) {
    console.debug('form change', e, 'target:', e.target);
    e.currentTarget.reset();
}

function isContainerElement(element) {
    return element.parentElement.nodeName === "OL";
}

function keydown(e) {
    const targetElement = e.target;
    const key = e.key;

    if (isContainerElement(targetElement)) {
        switch (key) {
            case 'ArrowDown':
                if (targetElement.nextElementSibling) {
                    targetElement.nextElementSibling.focus();
                }
                break;
            case 'ArrowUp':
                if (targetElement.previousElementSibling) {
                    targetElement.previousElementSibling.focus();
                }
                break;
        }
    }
}

function keyup(e) {
    console.debug('keyup', e);
}

export const defaultContainer =
    { cookieStoreId: 'firefox-default', color: "black", name: 'no container' };

export const bookmarkDummyContainer =
    { cookieStoreId: 'bookmarks', color: "gold", name: 'bookmarks' };

export const historyDummyContainer =
    { cookieStoreId: 'history', color: "white", name: 'history' };

export async function renderContainers(_containers, options = {}) {
    let additionalContainers = [defaultContainer];
    if (options.bookmarks) {
        additionalContainers.push(bookmarkDummyContainer);
    }
    let containers = additionalContainers.concat(_containers);
    if (options.history) {
        containers.push(historyDummyContainer);
    }
    const containerList = $e('ol');

    if (options.order) {
        const cookieStoreIds = containers.map(c => c.cookieStoreId);
        const orderedCookieStoreIds = options.order.concat(cookieStoreIds);
        containers = containers.sort(function (a, b) {
            return orderedCookieStoreIds.indexOf(a.cookieStoreId) > orderedCookieStoreIds.indexOf(b.cookieStoreId);
        });
        console.log(containers);
    }

    for (const container of containers) {
        containerList.appendChild(containerElement(container));
    }

    const form = $e('form', {}, [containerList])
    window.document.body.appendChild(form);
    $('form').addEventListener('change', formChange, {}, true);
    $('form').addEventListener('keydown', keydown, true);
    $('form').addEventListener('keyup', keyup, true);
}

export async function fillContainer(tabs) {
    const containerElements = {};

    for (const tab of (await tabs)) {
        const cookieStoreId = tab.cookieStoreId;
        const containerElement = $(`li#${cookieStoreId}`);
        if (!containerElement) {
            console.error(`container element for cookieStoreId=${cookieStoreId} not found`);
        }
        if (!containerElements[cookieStoreId]) {
            containerElements[cookieStoreId] = containerElement.appendChild($e('ul'));;
        }
        containerElements[cookieStoreId].appendChild(tabElement(tab));
    }
}

function containerElement(container) {
    return $e('li', { tabindex: 0, id: `${container.cookieStoreId}` }, [
        $e('input', { id: `e-${container.cookieStoreId}`, type: 'radio', name: 'toggle-tabs-visibility', value: container.cookieStoreId }),
        $e('label', { for: `e-${container.cookieStoreId}`, class: `tabs-visibility border-color-${container.color}`, content: '>' }),
        $e('input', { id: `c-${container.cookieStoreId}`, type: 'radio', name: 'open-container', value: container.cookieStoreId }),
        $e('label', { for: `c-${container.cookieStoreId}` }, [
            $e('h2', { content: container.name })
        ])
    ]);
}

function tabElement(tab) {
    return $e('li', { id: tab.id, class: 'border-color-red' }, [
        $e('input', { id: `t-${tab.id}`, type: 'radio', name: 'open-tab', value: tab.id }),
        $e('label', { for: `t-${tab.id}`, class: 'tab-center' }, [
            $e('div', { class: 'images' }, [
                $e('img', { class: 'favicon', src: tab.favIconUrl }),
                $e('img', { class: 'thumbnail', src: tab.favIconUrl }),
            ]),
            $e('div', { class: 'tab-names' }, [
                $e('h3', { content: tab.title }),
                $e('h4', { content: tab.url }),
            ])
        ]
        ),
        $e('input', { id: `x-${tab.id}`, type: 'radio', name: 'close-tab', value: tab.id }),
        $e('label', { for: `x-${tab.id}`, class: 'close', content: 'x' })
    ])
}
