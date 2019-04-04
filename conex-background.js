import {createContainerComponent} from "./conex-container-component.js";
import {createTabComponent} from "./conex-tab-component.js";
import {getThumbnail} from "./conex-thumbnail.js";

console.debugging = true;
let initialized = false;

const getConexDom = () => document.body.firstElementChild.cloneNode(true);

window.getThumbnail = getThumbnail;

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
  containers.unshift({
    color: "blue",
    cookieStoreId: "firefox-default",
    name: "default"
  });
  containers.push({
    color: "private",
    cookieStoreId: "firefox-private",
    name: "private"
  });

  for (const container of containers) {
    console.debug(`container ${container.name}`);
    const tabs = browser.tabs.query({cookieStoreId: container.cookieStoreId});
    const c = d.appendChild(createContainerComponent(container.cookieStoreId, container.name, container.color));

    // eslint-disable-next-line no-await-in-loop
    for (const tab of await tabs) {
      console.debug(`   tab ${tab.title}`);
      c.appendChild(createTabComponent(tab.id, tab.title, tab.url, container.color, tab.favIconUrl, null));
    }
  }

  document.body.firstElementChild.replaceWith(d);
  document.body.firstElementChild.focus();
  initialized = true;
};

document.addEventListener("DOMContentLoaded", () => {
  initializeBackgroundHtml();
});

// browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if(changeInfo.status === "complete") {
//     createThumbnail(tab);
//   }
// }, {properties: ["status"]});

console.debug("conex-background.js loaded");
