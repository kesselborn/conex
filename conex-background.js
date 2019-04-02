// import "./pica.js";

import {$e} from "./conex-helper.js";
import {createContainerComponent} from "./conex-container-component.js";
import {createTabComponent} from "./conex-tab-component.js";
import {resizeImage} from "./conex-resize-image.js";

console.debugging = true;

let initialized = false;

const getConexDom = function() {
  return document.body.firstElementChild.cloneNode(true);
};

window.initializingConex = new Promise((resolve) => {
    const domTreeTimer = setInterval(() => {
      if (initialized) {
        clearInterval(domTreeTimer);
        resolve(getConexDom);
      }
    }, 100);
});

const createThumbnail = async function(tab) {
  let thumbnailElement = null;
  try {
    console.debug(`creating thumbnail for ${tab.url}`);
    let start = Date.now();
    const screenshot = await browser.tabs.captureTab(tab.id, {
      format: "jpeg",
      quality: 20
    });
    let end = Date.now();
    console.log(`screenshot took ${end - start}ms`);

    start = Date.now();
    thumbnailElement = await resizeImage($e("img", {
      src: screenshot,
      style: "border:solid red 1px;"
    }), 300, 200);
    end = Date.now();
    console.log(`resize took ${end - start}ms`);
  } catch (e) {
    console.error(`error creating thumbnail of ${tab.url}: `, e);
    return null;
  }

  return thumbnailElement.src;
};

const initializeBackgroundHtml = async function() {
  const d = document.createElement("div");
  const containers = await browser.contextualIdentities.query({});
  containers.unshift({
    color: "blue",
    cookieStoreId: "firefox-default",
    name: "default"
  });

  for(const container of containers) {
    console.debug(`container ${container.name}`);
    const tabs = browser.tabs.query({cookieStoreId: container.cookieStoreId});
    const c = d.appendChild(createContainerComponent(container.cookieStoreId, container.name, container.color));

    // todo: asynchronize this
    // eslint-disable-next-line no-await-in-loop
    for(const tab of await tabs) {
      console.debug(`   tab ${tab.title}`);
      // eslint-disable-next-line no-await-in-loop
      const thumbnail = await createThumbnail(tab);
      c.appendChild(createTabComponent(tab.id, tab.title, tab.url, container.color, thumbnail, tab.favIconUrl));
    }
  }

  document.body.firstElementChild.replaceWith(d);
  document.body.firstElementChild.focus();
  initialized = true;
};

document.addEventListener("DOMContentLoaded", () => {
  initializeBackgroundHtml();
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if(changeInfo.status === "complete") {
    createThumbnail(tab);
  }
}, {properties: ["status"]});

console.debug("conex-background.js loaded");
