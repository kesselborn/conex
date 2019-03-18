import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent, ContainerItem} from "./conex-container-component.js";

function getConexDom() {
  return document.body.firstChild.cloneNode(true);
}

document.addEventListener("DOMContentLoaded", function(event) {
  const d = document.createElement('div');
  const c = d.appendChild(createContainerComponent(2, "foo", 2, "blue"));
  c.appendChild(createTabComponent(42, 1, "title", "http://heise.de", "blue"));
  c.appendChild(createTabComponent(43, 2, "title", "http://heise.de", "blue"));
  c.appendChild(createTabComponent(44, 3, "title", "http://heise.de", "blue"));
  document.body.appendChild(d);
});

console.debug('conex-background.js loaded');
