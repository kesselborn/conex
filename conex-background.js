import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent, ContainerItem} from "./conex-container-component.js";

document.addEventListener("DOMContentLoaded", function(event) {
  debugger;
  let myShadowDom = myCustomElem.shadowRoot;
  window.customElements.define('container-item', ContainerItem);
  document.body.appendChild(createContainerComponent(2, "foo", 2, "blue"));
});

console.debug('conex-background.js loaded');
