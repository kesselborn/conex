import {$1} from "./conex-helper.js";

// todo: listen to new containers
export const tabCreated = tab => {
    const containerItem = $1(`container-item[container-id='${tab.cookieStoreId}']`);
    containerItem.onTabCreated(tab);
};

export const tabActivated = activeInfo => {
    browser.tabs.get(activeInfo.tabId).then(tab => {
        const containerItem = $1(`container-item[container-id='${tab.cookieStoreId}']`);
        containerItem.sortTabItems(tab.cookieStoreId);

        // todo: better a function on tab-item component?
        const activeTabItem = $1("tab-item.active");
        if (activeTabItem) {
            activeTabItem.classList.remove("active");
        }
        $1(`tab-item[tab-id="${tab.id}"]`).classList.add("active");
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
