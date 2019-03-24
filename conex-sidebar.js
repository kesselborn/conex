import "./conex-tab-component.js";
import "./conex-container-component.js";
import {$1} from "./conex-helper.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", () => {
  bg.initializingConex.then(
    getDomTree => {
      document.body.firstElementChild.replaceWith(getDomTree());
      $1("container-item").focus();
    },
    e => console.error(e)
  );

});

console.debug("conex-sidebar.js loaded");
