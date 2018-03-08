const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
const privateCookieStorePrefix = 'firefox-private';
const newTabs = new Set();
const newTabsUrls = new Map();
const newTabsTitles = new Map();

let lastCookieStoreId = defaultCookieStoreId;

//////////////////////////////////// exported functions (es6 import / export stuff is not supported in webextensions)
function interceptRequests() {
  if(typeof browser.webRequest == 'object') {
    console.info('set up request interceptor');
    browser.webRequest.onBeforeRequest.addListener(
      showContainerSelectionOnNewTabs,
      { urls: ["<all_urls>"], types: ["main_frame"] },
      ["blocking"]
    );
  }
}

function activateTab(tabId) {
  browser.tabs.update(Number(tabId), {active: true}).then(tab => {
    browser.windows.update(tab.windowId, {focused: true});
  }, e => console.error(e));
}

function refreshSettings() {
  readSettings = _refreshSettings();
}

function closeTab(tabId) {
  browser.tabs.remove(Number(tabId));
}

function newTabInCurrentContainer(url) {
  browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT}).then(tabs => {
    const createProperties = { 
      cookieStoreId: tabs[0].cookieStoreId 
    };
    if(url) {
      createProperties['url'] = url
    }

    browser.tabs.create(createProperties).catch(e => console.error(e));
  }, e => console.error(e));
}

function openActiveTabInDifferentContainer(cookieStoreId) {
  if(!cookieStoreId.startsWith(privateCookieStorePrefix)) {
    console.debug(`cookieStoreId changed from ${lastCookieStoreId} -> ${cookieStoreId}`);
    lastCookieStoreId = cookieStoreId;
    browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT}).then(tabs => {
      const activeTab = tabs[0];
      if(isBlessedUrl(activeTab.url)) {
        openInDifferentContainer(cookieStoreId, activeTab);
      } else {
        console.error(`not re-opening current tab in new container as it's not a http(s) url (url is: ${activeTab.url})`);
      }
    }, e=> console.error(e));
  }
}

async function getTabsByContainer() {
  await readSettings;
  const containersTabsMap = {};

  const tabs = browser.tabs.query({});

  let bookmarkUrls = [];

  if(settings['search-bookmarks']) {
    const bookmarks = browser.bookmarks.search({});
    try {
      bookmarkUrls = (await bookmarks).filter(b => b.url != undefined).map(b => b.url.toLowerCase());
    } catch (e) {
      console.error('error querying bookmarks: ', e);
    }
  }

  for(const tab of (await tabs).sort((a,b) => b.lastAccessed - a.lastAccessed)) {
    const url = tab.url || "";
    const thumbnailElement = createTabElement(tab, bookmarkUrls.indexOf(url.toLowerCase()) >= 0);

    if (!containersTabsMap[tab.cookieStoreId]) {
      containersTabsMap[tab.cookieStoreId] = [];
    }

    containersTabsMap[tab.cookieStoreId].push(thumbnailElement);
  }
  return containersTabsMap;
}

async function restoreTabContainersBackup(tabContainers, windows) {
  const identities = createMissingTabContainers(tabContainers);
  for (const tabs of windows) {
    const w = browser.windows.create({});
    for (const tab of tabs) {
      if (!isBlessedUrl(tab.url)) {
        continue;
      }

      let cookieStoreId = defaultCookieStoreId;
      if (tab.container) {
        cookieStoreId = (await identities).get(tab.container.toLowerCase());
      }

      const newTab = browser.tabs.create({ url: tab.url, cookieStoreId: cookieStoreId, windowId: (await w).id, active: false });

      // we need to wait for the first onUpdated event before discarding, otherwise the tab is in limbo
      const onUpdatedHandler = async function(tabId, changeInfo) {
        if (tabId == (await newTab).id && changeInfo.status == "complete") {
          browser.tabs.onCreated.removeListener(onUpdatedHandler);
          browser.tabs.discard(tabId);
        }
      }

      browser.tabs.onUpdated.addListener(onUpdatedHandler);
      console.info(`creating tab ${tab.url} in container ${(await newTab).cookieStoreId} (cookieStoreId: ${cookieStoreId})`);
    }
  }
}

async function containerChanged() {
  setupMenus();
}

async function setupMenus() {
  await readSettings;
  await browser.menus.removeAll();
  const identitiesQuery = browser.contextualIdentities.query({});

  browser.menus.create({
    id: "settings",
    title: "Conex settings",
    onclick: function() {browser.runtime.openOptionsPage(); },
    contexts: ["browser_action", "page_action"]
  });

  if(settings['tab-moving-allowed']) {
    browser.menus.create({
      id: 'headline',
      enabled: false,
      title: "re-open current tab in ...",
      contexts: ["page", "tab"],
    });
    browser.menus.create({
      id: 'separator',
      type: 'separator',
      contexts: ["page", "tab"],
    });

    //const identities = [{cookieStoreId: 'firefox-default', color: 'default', name: 'default'}]
    //  .concat((await identitiesQuery).sort((a,b) => a.name.toLowerCase() > b.name.toLowerCase()));
    const identities = (await identitiesQuery).sort((a,b) => a.name.toLowerCase() > b.name.toLowerCase());

    for(const identity of identities) {
      browser.menus.create({
        id: menuId(identity.cookieStoreId),
        title: `${identity.name}`,
        contexts: ["page", "tab"],
        icons: { "16": `icons/${identity.color}_dot.svg` },
        onclick: function(menuDetails, tab) {
          console.info(`move tab to ${identity.cookieStoreId}`, {menuDetails: menuDetails, tab: tab}); 
          browser.tabs.create({
            active: tab.active, 
            cookieStoreId: identity.cookieStoreId, 
            url: tab.url, 
            openerTabId: tab.id}).then(_ => browser.tabs.remove(tab.id));

          if(tab.active) {
            showContainerTabsOnly(identity.cookieStoreId);
          } else {
            showContainerTabsOnly(tab.cookieStoreId);
          }
        }
      });
    }
  }
}

async function switchToContainer(cookieStoreId) {
  const tabs = await browser.tabs.query({ cookieStoreId: cookieStoreId });
  if (tabs.length == 0) {
    browser.tabs.create({ cookieStoreId: cookieStoreId, active: true });
  } else {

    const lastAccessedTabs = tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);

    // Try to switch to an unpinned tab, as switching a to pinned tab
    // will not update the visible tabs
    for (const tab of lastAccessedTabs) {
      if (!tab.pinned) {
        browser.tabs.update(tab.id, { active: true });
        browser.windows.update(tab.windowId, { focused: true });
        return;
      }
    }
    // All tabs in this container are pinned. Just switch to first one
    browser.tabs.update(lastAccessedTabs[0].id, { active: true });
    browser.windows.update(lastAccessedTabs[0].windowId, { focused: true });
  }
}

function openLinkInContainer(link, cookieStoreId) {
  browser.tabs.create({url: link, cookieStoreId: cookieStoreId});
}

async function showCurrentContainerTabsOnly(activeTabId) {
  await readSettings;
  if(!settings["hide-tabs"] ) {
    return;
  }

  const activeTab = await browser.tabs.get(activeTabId);
  if(activeTab.pinned) {
    return;
  }

  showContainerTabsOnly(activeTab.cookieStoreId);
}

async function showContainerTabsOnly(cookieStoreId) {
  const allTabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});

  const visibleTabs = allTabs.filter(t => t.cookieStoreId == cookieStoreId).map(t => t.id);
  const hiddenTabs = allTabs.filter(t => t.cookieStoreId != cookieStoreId).map(t => t.id);

  console.debug('visible tabs', visibleTabs, 'hidden tabs', hiddenTabs);

  try {
    showTabs(visibleTabs);
    hideTabs(hiddenTabs);
  } catch(e) {
    console.error('error showing / hiding tabs', e);
  }
}

async function openContainerSelector(url, title) {
  const tab = await browser.tabs.create({
    active: true,
    cookieStoreId: defaultCookieStoreId,
    url: url,
  });

  newTabsTitles.set(tab.id, title);
}

//////////////////////////////////// end of exported functions (again: es6 features not supported yet
const menuId = function(s) {
  return `menu_id_for_${s}`;
}

const openInDifferentContainer = function(cookieStoreId, tab) {
  const tabProperties = {
    active: true,
    cookieStoreId: cookieStoreId,
    index: tab.index+1
  };

  if(tab.url != 'about:newtab' && tab.url != 'about:blank') {
    tabProperties.url = tab.url;
  }

  browser.tabs.create(tabProperties);
  browser.tabs.remove(tab.id);
}


const createMissingTabContainers = async function(tabContainers) {
  const colors = ["blue", "turquoise", "green", "yellow", "orange", "red", "pink", "purple"];

  const identities = await browser.contextualIdentities.query({});

  const nameCookieStoreIdMap = new Map(identities.map(identity => [identity.name.toLowerCase(), identity.cookieStoreId]));
  const promises = [];

  for(const tabContainer of tabContainers) {
    if(!nameCookieStoreIdMap.get(tabContainer.toLowerCase())) {
      console.info(`creating tab container ${tabContainer}`);
      const newIdentity = {name: tabContainer, icon: 'circle', color: colors[Math.floor(Math.random() * (8 - 0)) + 0]};
      const identity = await browser.contextualIdentities.create(newIdentity);

      nameCookieStoreIdMap.set(identity.name.toLowerCase(), identity.cookieStoreId);
    }
  }

  return nameCookieStoreIdMap;
};

const openPageActionPopup = function(tab) {
  if(settings['tab-moving-allowed']) {
    browser.pageAction.show(tab.id);
  }
}

const isBlessedUrl = function(url) {
  return url.startsWith('http') || url.startsWith('about:blank') || url.startsWith('about:newtab');
}

const showHideMoveTabActions = async function(tabId) {
  await readSettings;
  const tab = browser.tabs.get(tabId);
  const identities = browser.contextualIdentities.query({});
  
  const enableContextMenu = async function(enable) {
    for(identity of (await identities)) {
      browser.menus.update(menuId(identity.cookieStoreId), { enabled: enable });
    }
  };

  const showMoveTabMenu = async function() {
    //enableContextMenu(isBlessedUrl((await tab).url));
    url = (await tab).url;
    if (isBlessedUrl(url)) {
      browser.pageAction.setIcon({
        tabId: tabId,
        path: { 19: 'icons/icon_19.png', 38: 'icons/icon_38.png', 48: 'icons/icon_48.png' }
      });
      browser.pageAction.setPopup({ tabId: (await tab).id, popup: "conex-page-action.html" });
      browser.pageAction.show(tabId);
    }
  };

  if((await tab).cookieStoreId.startsWith(privateCookieStorePrefix)) {
    browser.pageAction.hide(tabId);
    enableContextMenu(false);
    // temporary workaround: until https://bugzilla.mozilla.org/show_bug.cgi?id=1329304 is fixed disable browser action
    browser.browserAction.disable(tabId);
    return;
  }

  if((await tab).url.startsWith('about:blank') || (await tab).url.startsWith('about:newtab')) {
    showMoveTabMenu();
    return;
  }

  if(!settings['tab-moving-allowed']) {
    browser.pageAction.hide(tabId);
    return;
  }

  showMoveTabMenu();
};

const showTabs = async function(tabIds) {
  browser.tabs.show(tabIds);
}

const hideTabs = async function(tabIds) {
  if(tabIds.length == 0) {
    return;
  }

  // sometimes the tab that just got closed is in this list as well and will produce an error
  // not connected to hiding
  if(tabIds.length > 1) {
    browser.tabs.hide(tabIds.pop()).catch(e => {
      browser.notifications.create(null, {
        type: 'basic',
        title: 'Configuration setting missing',
        message: 'Tab hiding has to be manually configured in order to work. Please see conex settings for instructions.',
      })
      console.info('please activate tab hiding', e);
    });
  }
  browser.tabs.hide(tabIds);
}

const updateLastCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.url != 'about:blank' && tab.cookieStoreId != lastCookieStoreId && !tab.cookieStoreId.startsWith(privateCookieStorePrefix)) {
      console.debug(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId;
    }
  }, e => console.error(e));
};

const storeScreenshot = async function(tabId, changeInfo, tab) {
  await readSettings;
  if(settings['create-thumbnail']) {
    if (changeInfo.status == 'complete' && tab.url != 'about:blank' && tab.url != 'about:newtab') {
      try {
        const imageData = await browser.tabs.captureVisibleTab(null, { format: 'jpeg', quality: imageQuality });
        await browser.storage.local.set({ [cleanUrl(tab.url)]: { thumbnail: imageData, favicon: tab.favIconUrl } });
        console.debug('succesfully created thumbnail for', cleanUrl(tab.url));
      } catch(e) {
        console.error('error creating tab screenshot:', e);
      }
    }
  }
};

const openExternalLinksInCurrentContainer = async function(details) {
  await readSettings;
  const tab = browser.tabs.get(details.tabId);

  if(lastCookieStoreId != defaultCookieStoreId 
    && (await tab).cookieStoreId == defaultCookieStoreId 
    && details.url.startsWith('http')) {
    if(settings['tab-moving-allowed']) {
      console.info(`opening ${details.url} in current container`);
      openInDifferentContainer(lastCookieStoreId, {id: (await tab).id, index: (await tab).index, url: details.url});
    }
  }
}

const handleSettingsMigration = async function(details) {
  await readSettings;
  const currentVersion = 2;
  if(settings['settings-version'] == currentVersion) {
    return;
  }

  // old setting or first install: open the setting page
  if (settings['settings-version'] == undefined) {
    const settings = ['create-thumbnail', 'hide-tabs', 'search-bookmarks', 'search-history', 'tab-moving-allowed'];
    for(let setting of settings) {
      const settingId = 'conex/settings/' + setting;
      console.debug(`setting ${settingId} to false`);
      try {
        browser.storage.local.set({ [settingId]: false });
      } catch(e) {
        console.error(`error persisting ${settingId}: ${e}`)
      }
    }
  } 
  
  // setting version 1: tabHide was not optional
  if(settings['settings-version'] == 1) {
      try {
        const tabs = await browser.tabs.query({});
        await browser.tabs.show(tabs.map(t => t.id));
        await browser.storage.local.set({ 'conex/settings/hide-tabs': false });
        await browser.permissions.remove({permissions: ['tabHide', 'notifications']});
        await browser.storage.local.set({ 'conex/settings/settings-version': currentVersion });
      } catch(e) {
        console.error(`error persisting settings: ${e}`)
      }
  }

  try {
    await browser.storage.local.set({ 'conex/settings/settings-version': currentVersion });
  } catch (e) {
    console.error(`error persisting ${settingId}: ${e}`)
  }

  refreshSettings();
  await readSettings;
  browser.runtime.openOptionsPage();
}

const showContainerSelectionOnNewTabs = async function(requestDetails) {
  const tab = browser.tabs.get(requestDetails.tabId);

  if (!requestDetails.originUrl && newTabs.has(requestDetails.tabId) && requestDetails.url.startsWith('http')) {
    if(settings['show-container-selector']) {
      console.debug('is new tab', newTabs.has(requestDetails.tabId), requestDetails, (await tab));
      newTabsUrls.set(requestDetails.tabId, requestDetails.url);
      return { redirectUrl: browser.extension.getURL("container-selector.html") };
    } else {
      console.debug('re-opening tab in ', lastCookieStoreId);
      browser.tabs.create({
        active: true,
        openerTabId: Number(requestDetails.tabId),
        cookieStoreId: lastCookieStoreId,
        url: requestDetails.url
      });
      browser.tabs.remove(Number(requestDetails.tabId));

      return { cancel: true };
    }
  } else {
    return { cancel: false };
  }
};

const createContainerSelectorHTML = async function() {
  const main = document.body.appendChild($e('div', {id: 'main'}, [
    $e('h2', { id: 'title' }),
    $e('tt', { id: 'url' }),
    $e('span', {content: 'open in:'}),
    $e('div', {id: 'tabcontainers'})
  ]));

  document.body.appendChild(main);
  const tabContainers = $1("#tabcontainers");
  await renderTabContainers(tabContainers);
  const src = $1('#main').innerHTML;
  document.body.removeChild($1('#main'));

  return src.replace(/(\r\n|\n|\r)/gm,"");
}
const containerSelectorHTML = createContainerSelectorHTML();

const fillContainerSelector = async function(details) {
  if(details.url == browser.extension.getURL("container-selector.html")) {
    const url = newTabsUrls.get(details.tabId);
    newTabsUrls.delete(details.tabId);
    
    const title = newTabsTitles.get(details.tabId) ? newTabsTitles.get(details.tabId) : '';
    newTabsTitles.delete(details.tabId);
    
    browser.tabs.executeScript(details.tabId, {code: 
      `const port = browser.runtime.connect(); \
       document.querySelector('#main').innerHTML = '${await containerSelectorHTML}'; \
       document.querySelector('#title').innerHTML = '${title}'; \
       document.querySelector('#url').innerHTML = '${url}'; \
       document.title = '${url}'; \
       for(const ul of document.querySelectorAll('#tabcontainers ul')) {  \
        const post = _ => port.postMessage({tabId: '${details.tabId}', url: '${url}', container: ul.id});
        ul.addEventListener('click', post);
        ul.addEventListener('keypress', e => {
          if(e.key == 'Enter') { post(); }
        });
       }`});
       browser.history.deleteUrl({url: browser.extension.getURL("container-selector.html")});
  }
}

browser.runtime.onConnect.addListener(function(p){
  p.onMessage.addListener(function(msg) {
    browser.tabs.create({
      active: true,
      openerTabId: Number(msg.tabId),
      cookieStoreId: msg.container,
      url: msg.url
    });
    browser.tabs.remove(Number(msg.tabId));
  });
});

/////////////////////////// setup listeners
browser.runtime.onInstalled.addListener(handleSettingsMigration);
//browser.webNavigation.onBeforeNavigate.addListener(openExternalLinksInCurrentContainer);

browser.webNavigation.onCompleted.addListener(fillContainerSelector);

browser.tabs.onCreated.addListener(tab => {
  if(tab.url == 'about:newtab' 
     && tab.openerTabId == undefined
     && tab.cookieStoreId == defaultCookieStoreId 
     && lastCookieStoreId != defaultCookieStoreId) {
    openInDifferentContainer(lastCookieStoreId, tab);
  }
});

browser.tabs.onCreated.addListener(tab => {
  if(tab.url == 'about:blank'
     && tab.openerTabId == undefined 
     && tab.cookieStoreId == defaultCookieStoreId) {
    newTabs.add(tab.id);
  }
});

browser.tabs.onUpdated.addListener(tab => newTabs.delete(tab.id));

browser.tabs.onActivated.addListener(activeInfo => { showHideMoveTabActions(activeInfo.tabId)});
browser.tabs.onActivated.addListener(updateLastCookieStoreId);

browser.tabs.onActivated.addListener(function(activeInfo) {
  showCurrentContainerTabsOnly(activeInfo.tabId);
});

browser.tabs.onUpdated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(showHideMoveTabActions);
browser.tabs.onActivated.addListener(activeInfo => showHideMoveTabActions(activeInfo.tabId));

browser.contextualIdentities.onUpdated.addListener(_ => containerChanged());
browser.contextualIdentities.onCreated.addListener(_ => containerChanged());
browser.contextualIdentities.onRemoved.addListener(_ => containerChanged());

browser.windows.onFocusChanged.addListener(windowId => {
  if(windowId != browser.windows.WINDOW_ID_NONE) {
    browser.tabs.query({active: true, windowId: windowId}).then(tab => {
      if(tab.length > 0) {
        showHideMoveTabActions(tab[0].id);
      }
    }, e => console.error(e));
  }
});

browser.pageAction.onClicked.addListener(openPageActionPopup)

containerChanged();
interceptRequests();
browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT}).then(tabs => {
  lastCookieStoreId = tabs[0].cookieStoreId;
});
console.info('conex loaded');
