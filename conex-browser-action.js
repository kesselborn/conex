import "./conex-search-bar.js";
import {getConexDom} from "./conex-helper.js";

const bg = window.browser.extension.getBackgroundPage();

window.document.body.tabActivatedCallback = () => {
    window.close();
};

document.addEventListener("DOMContentLoaded", getConexDom(bg));
console.debug("conex-browser-action.js loaded");
