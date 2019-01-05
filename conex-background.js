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

async function switchToContainer(cookieStoreId) {
  const tabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT, cookieStoreId: cookieStoreId});
  if (tabs.length == 0) {
    const openerTab = (await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT}))[0];
    browser.tabs.create({ openerTabId: openerTab.id, cookieStoreId: cookieStoreId, active: true });
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

const isBlessedUrl = function(url) {
  return url.startsWith('http') || url.startsWith('about:blank') || url.startsWith('about:newtab');
}

const showTabs = async function(tabIds) {
  browser.tabs.show(tabIds);
}

const hideTabs = async function(tabIds) {
  if(tabIds.length == 0) {
    return;
  }

  browser.tabs.hide(tabIds);
}

const updateLastCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if((tab.url != 'about:blank' || (tab.url == 'about:blank' && tab.cookieStoreId != defaultCookieStoreId))
      && tab.cookieStoreId != lastCookieStoreId
      && !tab.cookieStoreId.startsWith(privateCookieStorePrefix)) {
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

const handleSettingsMigration = async function(details) {
  await readSettings;
  const currentVersion = 3;
  if(settings['settings-version'] == currentVersion) {
    return;
  }

  // old setting or first install: open the setting page
  if (settings['settings-version'] == undefined) {
    const settings = ['create-thumbnail', 'hide-tabs', 'search-bookmarks', 'search-history'];
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
      console.log("migrating settings from version 1")
      const tabs = await browser.tabs.query({});
      await browser.tabs.show(tabs.map(t => t.id));
      await browser.storage.local.set({ 'conex/settings/hide-tabs': false });
      await browser.permissions.remove({permissions: ['tabHide', 'notifications']});
      await browser.storage.local.set({ 'conex/settings/settings-version': currentVersion });
    } catch(e) {
      console.error(`error persisting settings: ${e}`)
    }
  }

  // setting version 2: no notifications necessary anymore
  if(settings['settings-version'] == 2) {
    try {
      await browser.permissions.remove({permissions: ['notifications']});
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

  if ((!requestDetails.originUrl || requestDetails.originUrl == browser.extension.getURL("")) &&
       newTabs.has(requestDetails.tabId) && requestDetails.url.startsWith('http')) {
    if(settings['show-container-selector']) {
      console.debug('is new tab', newTabs.has(requestDetails.tabId), requestDetails, (await tab));
      newTabsUrls.set(requestDetails.tabId, requestDetails.url);
      return { redirectUrl: browser.extension.getURL("container-selector.html") };
    } else {
      console.debug('re-opening tab in ', lastCookieStoreId, (await tab));
      browser.tabs.create({
        active: (await tab).active,
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
    $e('span', {content: 'open in:'}),
    $e('div', {id: 'tabcontainers'}),
    $e('tt', { id: 'url' })
  ]));

  document.body.appendChild(main);
  const tabContainers = $1("#tabcontainers");
  await renderTabContainers(tabContainers, lastCookieStoreId);
  const src = $1('#main').innerHTML;
  document.body.removeChild($1('#main'));

  return src.replace(/(\r\n|\n|\r)/gm,"");
}

const fillContainerSelector = async function(details) {
  if(details.url == browser.extension.getURL("container-selector.html")) {
    const url = newTabsUrls.get(details.tabId).replace(/'/g, "\\\'");
    newTabsUrls.delete(details.tabId);

    const title = newTabsTitles.get(details.tabId) ? newTabsTitles.get(details.tabId) : '';
    newTabsTitles.delete(details.tabId);

    browser.tabs.executeScript(details.tabId, {code:
      `const port = browser.runtime.connect(); \
      document.querySelector('#main').innerHTML = '${await createContainerSelectorHTML()}'; \
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

const openIncognito = async function(url) {
  const windows = await browser.windows.getAll();
  for(const window of windows) {
    if(window.incognito) {
      await browser.windows.update(window.id, {focused: true});
      try {
        await browser.tabs.create({
          active: true,
          url: url,
          windowId: window.id});
        console.debug("incognito tab created");
      } catch(e) { console.error("error creating new tab: ", e) };
      return;
    }
  }

  try {
  browser.windows.create({
    url: url,
    incognito: true
  })} catch(e) { console.error("error creating private window: ", e)};
}

browser.runtime.onConnect.addListener(function(p){
  p.onMessage.addListener(function(msg) {
    if(msg.container == "firefox-private") {
      openIncognito(msg.url).then(browser.tabs.remove(Number(msg.tabId)));
    } else {
      browser.tabs.create({
        active: true,
        openerTabId: Number(msg.tabId),
        cookieStoreId: msg.container,
        url: msg.url
      }).then(_ => browser.tabs.remove(Number(msg.tabId)),
        e => console.error("error creating new tab: ", e));
    }
  });
});

/////////////////////////// setup listeners
browser.runtime.onInstalled.addListener(handleSettingsMigration);

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

browser.windows.onFocusChanged.addListener(windowId => {
  browser.tabs.query({active: true, windowId: windowId}).then(tabs => {
    lastCookieStoreId = tabs[0].cookieStoreId;
  });
});

browser.tabs.onUpdated.addListener(tab => newTabs.delete(tab.id));
browser.tabs.onActivated.addListener(updateLastCookieStoreId);
browser.tabs.onActivated.addListener(function(activeInfo) {
  showCurrentContainerTabsOnly(activeInfo.tabId);
});

browser.tabs.onUpdated.addListener(storeScreenshot);

interceptRequests();
browser.menus.create({ id: "settings", title: "Conex settings", onclick: function() {browser.runtime.openOptionsPage(); },
                     contexts: ["browser_action"]});

browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT}).then(tabs => {
  lastCookieStoreId = tabs[0].cookieStoreId;
});

browser.commands.onCommand.addListener(function(command) {
  console.debug("command called", command);
  if(command == "new-container") {
    browser.browserAction.setBadgeText({text: "new"});
    browser.browserAction.openPopup();
  }
});

console.info('conex loaded');
