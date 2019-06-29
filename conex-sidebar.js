import "./conex-search-bar.js";
import {tabActivated, tabCreated, tabRemoved, tabUpdated} from "./conex-event-handlers.js";
import {getConexDom} from "./conex-helper.js";

const bg = window.browser.extension.getBackgroundPage();

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

document.addEventListener("DOMContentLoaded", getConexDom(bg));
console.debug("conex-sidebar.js loaded");
