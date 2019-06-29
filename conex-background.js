import {$} from "./conex-helper.js";
import {createContainerComponent} from "./conex-container-component.js";
import {createTabComponent} from "./conex-tab-component.js";
import {getThumbnail} from "./conex-thumbnail.js";

console.debugging = true;
let initialized = false;

const getConexDom = () => {
  const conexDom = document.body.firstElementChild.cloneNode(true);
  for(const tabItem of $("tab-item", conexDom)) {
    tabItem.disconnectedCallback();
  }
  return conexDom;
};

window.getThumbnail = getThumbnail;

window.settings = {
  loadThumbnails: true,
  order: "lru"
};

window.initializingConex = new Promise((resolve) => {
  const domTreeTimer = setInterval(() => {
    if (initialized) {
      clearInterval(domTreeTimer);
      resolve(getConexDom);
    }
  }, 100);
});

const initializeBackgroundHtml = async() => {
  const d = document.createElement("div");
  const containers = await browser.contextualIdentities.query({});

  // add default container at the beginning ...
  containers.unshift({
    color: "blue",
    cookieStoreId: "firefox-default",
    name: "default"
  });

  // ... and the private container at the very end of the container list
  containers.push({
    color: "private",
    cookieStoreId: "firefox-private",
    name: "private"
  });

  for (const container of containers) {
    console.debug(`creating container element ${container.name}`);
    const tabs = browser.tabs.query({cookieStoreId: container.cookieStoreId});
    const c = d.appendChild(createContainerComponent(container.cookieStoreId, container.name, container.color));

    // eslint-disable-next-line no-await-in-loop
    for(const tab of await tabs) {
      console.debug(`   creating tab element ${tab.title}`);
      c.appendChild(createTabComponent(tab.id, tab.title, tab.url, container.color, tab.favIconUrl, null));
    }
    c.sortTabs();
  }

  document.body.firstElementChild.replaceWith(d);
  document.body.firstElementChild.focus();
  initialized = true;
};

document.addEventListener("DOMContentLoaded", () => {
  initializeBackgroundHtml();
});

console.debug("conex-background.js loaded");
