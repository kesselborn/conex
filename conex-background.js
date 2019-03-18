import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent, ContainerItem} from "./conex-container-component.js";

document.addEventListener("DOMContentLoaded", function(event) {
  let c = createContainerComponent(2, "foo", 2, "blue");
  c.appendChild(createTabComponent(42, 1, "title", "http://heise.de", "blue"));
  c.appendChild(createTabComponent(43, 2, "title", "http://heise.de", "blue"));
  c.appendChild(createTabComponent(44, 3, "title", "http://heise.de", "blue"));
  document.body.appendChild(c);
});

console.debug('conex-background.js loaded');
