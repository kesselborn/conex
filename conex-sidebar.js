window.component = "sidebar";

import "./conex-search-bar.js";
import "./conex-thumbnail-loader.js";
import {keyDownHandler, tabActivated, tabCreated, tabRemoved, tabUpdated} from "./conex-event-handlers.js";
import {getConexDom} from "./conex-helper.js";

window.browser.tabs.onCreated.addListener(tabCreated);
window.browser.tabs.onActivated.addListener(tabActivated);
window.browser.tabs.onUpdated.addListener(tabUpdated);
window.browser.tabs.onRemoved.addListener(tabRemoved);

window.addEventListener("unload", () => {
    window.browser.tabs.onCreated.removeListener(tabCreated);
    window.browser.tabs.onActivated.removeListener(tabActivated);
    window.browser.tabs.onUpdated.removeListener(tabUpdated);
    window.browser.tabs.onRemoved.removeListener(tabRemoved);

    console.debug("side bar unloaded");
}, false);

document.addEventListener("DOMContentLoaded", () => {
    getConexDom(window.browser.extension.getBackgroundPage())();
    document.body.addEventListener("keydown", keyDownHandler);
});

console.debug("conex-sidebar.js loaded");
