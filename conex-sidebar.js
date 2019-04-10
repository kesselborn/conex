import "./conex-tab-component.js";
import "./conex-container-component.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", () => {
  const startupLoop = setInterval(() => {
    if (bg.initializingConex) {
      bg.initializingConex.then(
        getDomTree => {
          window.getThumbnail = bg.window.getThumbnail;
          window.settings = bg.window.settings;
          document.body.firstElementChild.replaceWith(getDomTree());
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
