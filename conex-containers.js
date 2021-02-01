import { $, $e } from "./conex-helper.js";

function formChange(e) {
    console.debug('change', e);
    console.debug(e.target);
    console.debug(e.target.name);
    console.debug(e.target.value);
    e.currentTarget.reset();
}

function keydown(e) {
    console.debug('keydown', e);
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
        containerList.appendChild(
            $e('li', { tabindex: 0, id: `${container.cookieStoreId}` }, [
                $e('input', { id: `e${container.cookieStoreId}`, type: 'radio', name: 'toggle-tabs-visibility', value: container.cookieStoreId }),
                $e('label', { for: `e${container.cookieStoreId}`, class: `tabs-visibility border-color-${container.color}`, content: '>' }),
                $e('input', { id: `c${container.cookieStoreId}`, type: 'radio', name: 'open-container', value: container.cookieStoreId }),
                $e('label', { for: `c${container.cookieStoreId}` }, [
                    $e('h2', { content: container.name })
                ])
            ])
        );
    }

    const form = $e('form', {}, [containerList])
    window.document.body.appendChild(form);
    $('form').addEventListener('change', formChange, {}, true);
    $('form').addEventListener('keydown', keydown, true);
    $('form').addEventListener('keyup', keyup, true);
}

export async function fillContainer(container) {
    const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
    const tabsList = $(`li#${container.cookieStoreId}`).appendChild($e('ul'));

    console.log(await tabs);
    for (const tab of (await tabs)) {
        tabsList.appendChild(
            $e('li', { id: tab.id, class: 'border-color-red' }, [
                $e('input', { id: `t${tab.id}`, type: 'radio', name: 'open-tab', value: tab.id }),
                $e('label', { class: 'tab-center', for: `t${tab.id}` }, [
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
                $e('input', { id: `x${tab.id}`, type: 'radio', name: 'close-tab', value: tab.id }),
                $e('label', { for: `x${tab.id}`, class: 'close', content: 'x' })
            ])
        )
    }

}