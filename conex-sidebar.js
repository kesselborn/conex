import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent} from "./conex-container-component.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", function(event) {
  document.body.appendChild(bg.getConexDom());
});

console.debug('conex-background.js loaded');
