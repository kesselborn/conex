import {$1} from "./conex-helper.js";

export const tabCreated = tab => {
    const containerItem = $1(`container-item[container-id='${tab.cookieStoreId}']`);

    // todo: listen to new containers
    containerItem.onTabCreated(tab);
};

export const tabActivated = activeInfo => {
    const searchBarHeight = 60;
    browser.tabs.get(activeInfo.tabId).then(tab => {
        // todo: better a function on tab-item component?
        const activeTabItem = $1("tab-item.active");
        if (activeTabItem) {
            activeTabItem.classList.remove("active");
        }

        const containerItem = $1(`container-item[container-id='${tab.cookieStoreId}']`);
        const tabItem = $1(`tab-item[tab-id="${tab.id}"]`);

        tabItem.classList.add("active");

        containerItem.sortTabItems(tab.cookieStoreId).then(() => {
            const containerItemCollapsed = containerItem.classList.contains("collapsed");

            if(containerItemCollapsed) {
                containerItem.expandContainerItem();
            }
            // if(tabItem.scrollHeight === 0) {
            //     window.scrollBy(0, -1 * searchBarHeight);
            // }

            setTimeout(() => {
                if(window.document.body.dataset.context === "sidebar") {
                    tabItem.scrollIntoView();
                    window.scrollBy(0, -1 * searchBarHeight);
                }
            }, 1000);
        });


        $1("search-bar").reset();
    });

};

export const tabUpdated = (tabId, changeInfo, tab) => {
    const tabItem = $1(`tab-item[tab-id='${tabId}']`);
    // sometimes the updated event fires before the tabItem exists
    if (tabItem) {
        tabItem.onUpdated(tabId, changeInfo, tab);
    }
};

export const tabRemoved = tabId => {
    const tabItem = $1(`tab-item[tab-id='${tabId}']`);
    tabItem.onRemoved(tabId);
};

export const keyDownHandler = e => {
    // console.debug(e);
    if (e.key === "Shift") {
        return;
    }
    if(e.key === "Escape") {
        $1("search-bar", document).reset();
        return;
    }

    if (e.target.handleKeyDown) {
        e.stopPropagation();
        if (e.target.handleKeyDown(e)) {
            $1("form input#search-term", document).focus();
        } else {
            e.preventDefault();
        }
    }
};
