import "./conex-tab-component.js";
import "./conex-container-component.js";
import {$1} from "./conex-helper.js";

const bg = window.browser.extension.getBackgroundPage();
window.getThumbnail = bg.window.getThumbnail;

document.addEventListener("DOMContentLoaded", () => {
  const startupLoop = setInterval(() => {
    if(bg.initializingConex) {
      bg.initializingConex.then(
        getDomTree => {
          document.body.firstElementChild.replaceWith(getDomTree());
          $1("container-item").focus();
        },
        e => console.error(e)
      );
      clearInterval(startupLoop);
    } else {
      console.debug("waiting for background page to be initialized");
    }
  }, 100);

});

console.debug("conex-sidebar.js loaded");
