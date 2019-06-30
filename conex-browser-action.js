import "./conex-search-bar.js";
import {$1, getConexDom} from "./conex-helper.js";
import {keyDownHandler} from "./conex-event-handlers.js";

window.document.body.tabActivatedCallback = () => window.close();
window.document.body.tabCreatedCallback = () => window.close();
window.document.body.tabRemovedCallback = () => window.close();

// for some reason auto focusing browser action elements does not work
// so we have to work around this
const focusSearchTerm = () => {
    const interval = setInterval(() => {
        try {
            $1("#search-term").focus();
            clearInterval(interval);
        // eslint-disable-next-line no-empty
        } catch (_) {}
    }, 30);
};

document.addEventListener("DOMContentLoaded", () => {
    getConexDom(window.browser.extension.getBackgroundPage())();
    document.body.addEventListener("keydown", keyDownHandler);
    focusSearchTerm();
});

console.debug("conex-browser-action.js loaded");
