import "./conex-search-bar.js";
import {getConexDom} from "./conex-helper.js";

window.document.body.tabActivatedCallback = () => window.close();

document.addEventListener(
    "DOMContentLoaded",
    getConexDom(window.browser.extension.getBackgroundPage())
);

console.debug("conex-browser-action.js loaded");
