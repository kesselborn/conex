import {$} from "./conex-helper.js";
import {createContainerItem} from "./conex-container-item.js";
import {createTabItem} from "./conex-tab-item.js";
import {getThumbnail} from "./conex-thumbnail.js";

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
    const c = d.appendChild(createContainerItem(container.cookieStoreId, container.name, container.color));

    // eslint-disable-next-line no-await-in-loop
    for(const tab of await tabs) {
      console.debug(`   creating tab element ${tab.title}`);
      c.appendChild(createTabItem(tab.id, tab.title, tab.url, container.color, tab.favIconUrl, null));
    }
    c.sortTabItems();
  }

  document.body.firstElementChild.replaceWith(d);
  document.body.firstElementChild.focus();
  initialized = true;
};

document.addEventListener("DOMContentLoaded", () => {
  try {
    initializeBackgroundHtml();
  } catch(e) {
    console.error(`error initializing background page: ${e}`);
  }
});

console.debug("conex-background.js loaded");
