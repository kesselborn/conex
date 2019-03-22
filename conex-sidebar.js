import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent} from "./conex-container-component.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", function(event) {
  bg.initializingConex.then(getDomTree => document.body.firstElementChild.replaceWith(getDomTree()), e => console.error(e));
});

console.debug('conex-sidebar.js loaded');
