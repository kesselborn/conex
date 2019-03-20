import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent} from "./conex-container-component.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", function(event) {
  setTimeout(function() {
    document.body.appendChild(bg.getConexDom());
  }, 2000);
});

console.debug('conex-background.js loaded');
