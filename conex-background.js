import {createTabComponent} from "./conex-tab-component.js";
import {createContainerComponent} from "./conex-container-component.js";

const domTree = null;

window.getConexDom = function() {
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
    const c = d.appendChild(createContainerComponent(tabIndex++, container.cookieStoreId, container.name, container.color));
    for(const tab of (await tabs)) {
      console.debug(`   tab ${tab.title}`);
      c.appendChild(createTabComponent(tabIndex++, tab.id, tab.title, tab.url, container.color));
    }
  }

  return d;
}

document.addEventListener("DOMContentLoaded", function(event) {
  initializeBackgroundHtml().then(d => document.body.appendChild(d));
});

console.debug('conex-background.js loaded');
