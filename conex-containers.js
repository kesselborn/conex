import { $, $e } from "./conex-helper.js";

function formChange(e) {
    console.debug('change', e);
    console.debug(e.target);
    console.debug(e.target.name);
    console.debug(e.target.value);
    e.currentTarget.reset();
}

export async function renderContainers(containers) {
    const containerList = $e('ol');
    for (const container of containers) {
        containerList.appendChild(
            $e('li', { id: `${container.cookieStoreId}` }, [
                $e('input', { id: `e${container.cookieStoreId}`, type: 'radio', name: 'toggle-tabs-visibility', value: container.cookieStoreId }),
                $e('label', { for: `e${container.cookieStoreId}`, class: 'tabs-visibility border-color-red', content: '>' }),
                $e('input', { id: `c${container.cookieStoreId}`, type: 'radio', name: 'open-container', value: container.cookieStoreId }),
                $e('label', { for: `c${container.cookieStoreId}` }, [
                    $e('h2', { content: container.name })
                ])
            ])
        );
    }
    window.document.body.appendChild($e('form', {}, [containerList]));
    $('form').addEventListener('change', formChange, {}, true);
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