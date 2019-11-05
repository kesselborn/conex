import "./conex-search-bar.js";
import "./conex-thumbnail-loader.js";
import "./conex-thumbnail-backuper.js";
import {tabActivated, tabCreated, tabRemoved, tabUpdated} from "./conex-event-handlers.js";
import {$1} from "./conex-helper.js";
import {createContainerItem} from "./conex-container-item.js";
import {createTabItem} from "./conex-tab-item.js";
import {getThumbnail} from "./conex-thumbnail.js";

let initialized = false;

window.component = "background";
window.browser.tabs.onCreated.addListener(tabCreated);
window.browser.tabs.onActivated.addListener(tabActivated);
window.browser.tabs.onUpdated.addListener(tabUpdated);
window.browser.tabs.onRemoved.addListener(tabRemoved);

const getConexDom = () => {
const conexDom = document.body.firstElementChild.cloneNode(true);
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
  const containerList = $1("div#containers", document.body).cloneNode(false);
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
    // console.debug(`creating container element ${container.name}`);
    const tabs = browser.tabs.query({cookieStoreId: container.cookieStoreId});
    const c = containerList.appendChild(createContainerItem(container.cookieStoreId, container.name, container.color));

    const tabItemsCreating = [];
    // eslint-disable-next-line no-await-in-loop
    for(const tab of await tabs) {
      // console.debug(`   creating tab element ${tab.title}`);
      tabItemsCreating.push(createTabItem(tab.id, tab.title, tab.url, container.color, tab.favIconUrl, null));
    }

    Promise.all(tabItemsCreating).then(tabItems => {
      for (const tabItem of tabItems) {
        c.appendChild(tabItem);
      }
      c.sortTabItems(container.cookieStoreId);
    });

  }

  $1("div#containers").replaceWith(containerList);
  $1("div#containers").focus();
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
// console .log(`
// moz-extension://47bf3fc1-a975-fa45-8fb7-8b25cc42aebe: 1Password Beta
// moz-extension://0f191615-6491-184a-804b-5ff827dc30aa: Privacy Badger
// `);
