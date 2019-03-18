import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent, ContainerItem} from "./conex-container-component.js";

const bg = browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", function(event) {
  console.debug(`${bg}`);
  document.body.appendChild(bg.getConexDom());
});

console.debug('conex-background.js loaded');
