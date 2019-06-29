import "./conex-search-bar.js";
import {getConexDom} from "./conex-helper.js";

window.document.body.tabActivatedCallback = () => window.close();
window.document.body.tabCreatedCallback = () => window.close();
window.document.body.tabRemovedCallback = () => window.close();

document.addEventListener(
    "DOMContentLoaded",
    getConexDom(window.browser.extension.getBackgroundPage())
);

console.debug("conex-browser-action.js loaded");
