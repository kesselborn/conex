import {$1} from "./conex-helper.js";

export const tabCreated = tab => {
    const containerItem = $1(`container-item[container-id='${tab.cookieStoreId}']`);
    containerItem.onTabCreated(tab);
};

export const tabActivated = activeInfo => {
    browser.tabs.get(activeInfo.tabId).then(tab => {
        const containerItem = $1(`container-item[container-id='${tab.cookieStoreId}']`);
        containerItem.sortTabItems(tab.cookieStoreId);
    });
};

export const tabUpdated = (tabId, changeInfo, tab) => {
    const tabItem = $1(`tab-item[tab-id='${tabId}']`);

    // sometimes the updated event fires before the tabItem exists
    if(tabItem) {
        tabItem.onUpdated(tabId, changeInfo, tab);
    }
};

export const tabRemoved = tabId => {
    const tabItem = $1(`tab-item[tab-id='${tabId}']`);
    tabItem.onRemoved(tabId);
};
