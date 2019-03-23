import "./conex-tab-component.js";
import "./conex-container-component.js";

const bg = window.browser.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", () => {
  bg.initializingConex.then(getDomTree => document.body.firstElementChild.replaceWith(getDomTree()), e => console.error(e));
});

console.debug("conex-sidebar.js loaded");
