import {resizeImage} from './conex-resize-image.js'
import {$, $1, $e} from './conex-helper.js'
import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent} from "./conex-container-component.js";
console.debugging = true;


let initialized = false;

window.initializingConex = new Promise((resolve, reject) => {
    const domTreeTimer = setInterval(_ => {
      if (initialized) {
        clearInterval(domTreeTimer);
        resolve(getConexDom);
      }
    }, 100);
});

const getConexDom = function() {
  return document.body.firstElementChild.cloneNode(true);
}

async function initializeBackgroundHtml() {
  const d = document.createElement('div');
  const containers = await browser.contextualIdentities.query({});
  let tabIndex = 0;
  containers.unshift({cookieStoreId: 'firefox-default', name: 'default', color: 'blue'});

  for(const container of containers) {
    console.debug(`container ${container.name}`);
    const tabs = browser.tabs.query({cookieStoreId: container.cookieStoreId});
    const c = d.appendChild(createContainerComponent(tabIndex, container.cookieStoreId, container.name, container.color));
    for(const tab of (await tabs)) {
      console.debug(`   tab ${tab.title}`);
      const thumbnail = await createThumbnail(tab);
      c.appendChild(createTabComponent(tabIndex, tab.id, tab.title, tab.url, container.color, thumbnail, tab.favIconUrl));
    }
  }

  document.body.firstElementChild.replaceWith(d);
  document.body.firstElementChild.focus;
  initialized = true;
}

document.addEventListener("DOMContentLoaded", function(event) {
  initializeBackgroundHtml();
});

async function createThumbnail(tab) {
  try {
    console.debug(`creating thumbnail for ${tab.url}`);
    const screenshot = await browser.tabs.captureTab(tab.id, { format: 'jpeg', quality: 20 });
    const thumbnailElement = await resizeImage($e('img', { src: screenshot, style: 'border:solid red 1px;' }), 300, 200);
    return thumbnailElement.src;
  } catch (e) { console.error(`error creating thumbnail of ${tab.url}: `, e); }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if(changeInfo.status == 'complete') {
    createThumbnail(tab)
  }
}, { properties: ['status'] });

console.debug('conex-background.js loaded');
