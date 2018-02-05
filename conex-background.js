const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
const privateCookieStorePrefix = 'firefox-private';

let lastCookieStoreId = defaultCookieStoreId;

//////////////////////////////////// exported functions (es6 import / export stuff is not supported in webextensions)
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
    const createProperties = { cookieStoreId: tabs[0].cookieStoreId };
    if(url) {
      createProperties['url'] = url
    }

    browser.tabs.create(createProperties).catch(e => console.error(e));
  }, e => console.error(e));
}

function openActiveTabInDifferentContainer(cookieStoreId) {
  if(!cookieStoreId.startsWith(privateCookieStorePrefix)) {
    console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${cookieStoreId}`);
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
      console.log('error querying bookmarks: ', e);
    }
  }

  for(const tab of await tabs) {
    const url = tab.url || "";
    const thumbnailElement = createTabElement(tab, bookmarkUrls.indexOf(url.toLowerCase()) >= 0);

    if(!containersTabsMap[tab.cookieStoreId]) {
      containersTabsMap[tab.cookieStoreId] = [];
    }

    containersTabsMap[tab.cookieStoreId].push(thumbnailElement);
  }
  return containersTabsMap;
}

// TODO: make async?
function restoreTabContainersBackup(tabContainers, windows) {
  createMissingTabContainers(tabContainers).then(identities => {
    for(const tabs of windows) {
      browser.windows.create({}).then(w => {
        for(const tab of tabs) {
          let cookieStoreId = defaultCookieStoreId;
          if(tab.container) {
            cookieStoreId = identities.get(tab.container.toLowerCase());
          }
          browser.tabs.create({url: tab.url, cookieStoreId: cookieStoreId, windowId: w.id, active: false}).then(tab => {
            // we need to wait for the first onUpdated event before discarding, otherwise the tab is in limbo
            const listener = browser.tabs.onUpdated.addListener(function(tabId) {
              if(tabId == tab.id) {
                browser.tabs.onCreated.removeListener(listener);
                browser.tabs.discard(tab.id);
              }
            });
            console.log(`creating tab ${tab.url} in container ${tab.container} (cookieStoreId: ${cookieStoreId})`);
          }, e => console.error(e));
        }
      }, e => console.error(e));
    }
  }, e => console.error(e));
}

async function setupMenus() {
  await readSettings;
  await browser.menus.removeAll();
  const identities = browser.contextualIdentities.query({});

  browser.menus.create({
    id: "settings",
    title: "Conex settings",
    onclick: function() {browser.runtime.openOptionsPage(); },
    contexts: ["browser_action", "page_action"]
  });

  if(settings['tab-moving-allowed'] && settings['prefer-context']) {
    browser.menus.create({
      id: 'headline',
      enabled: false,
      title: "re-open current tab in ...",
      contexts: ["page"],
    });
    browser.menus.create({
      id: 'separator',
      type: 'separator',
      contexts: ["page"],
    });

    for(const identity of await identities) {
      browser.menus.create({
        id: menuId(identity.cookieStoreId),
        title: `${identity.name}`,
        contexts: ["page"],
        icons: { "16": `icons/${identity.color}_dot.svg` },
        onclick: function() {openActiveTabInDifferentContainer(identity.cookieStoreId)}
      });
    }

    browser.menus.create({
      id: 'separator2',
      type: 'separator',
      contexts: ["page"],
    });

    browser.menus.create({
      id: 'refresh-container-list',
      title: "refresh container list",
      contexts: ["page"],
      onclick: setupMenus
    });
  }
}

async function switchToContainer(cookieStoreId) {
  const tabs = await browser.tabs.query({cookieStoreId: cookieStoreId});
  if(tabs.length == 0) {
    browser.tabs.create({cookieStoreId: cookieStoreId, active: true});
  } else {

    const lastAccessedTabs = tabs.sort((a,b) => b.lastAccessed - a.lastAccessed);

	// Try to switch to an unpinned tab, as switching a to pinned tab
    // will not update the visible tabs
    for (const tab of lastAccessedTabs) {
      if (!tab.pinned) {
        browser.tabs.update(tab.id, {active: true});
        browser.windows.update(tab.windowId, {focused: true});
        return;
      }
	}
    // All tabs in this container are pinned. Just switch to first one
    browser.tabs.update(lastAccessedTabs[0].id, {active: true});
    browser.windows.update(lastAccessedTabs[0].windowId, {focused: true});
  }
}

function openLinkInContainer(link, cookieStoreId) {
  browser.tabs.create({url: link, cookieStoreId: cookieStoreId});
}

async function showHideTabs(activeTabId) {
  await readSettings;
  if(!settings["hide-tabs"] ) {
    return;
  }

  const activeTab = await browser.tabs.get(activeTabId);
  if(activeTab.pinned) {
    return;
  }

  const allTabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});

  const visibleTabs = allTabs.filter(t => t.cookieStoreId == activeTab.cookieStoreId).map(t => t.id);
  const hiddenTabs = allTabs.filter(t => t.cookieStoreId != activeTab.cookieStoreId).map(t => t.id);

  console.log('visible tabs', visibleTabs);
  console.log('hidden tabs', hiddenTabs);

  try {
    showTabs(visibleTabs);
    hideTabs(hiddenTabs);
  } catch(e) {
    console.error('error showing / hiding tabs', e);
  }
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
    if(settings['prefer-context']) {
      browser.pageAction.hide(tabId);
      enableContextMenu(isBlessedUrl((await tab).url));
    } else {
      url = (await tab).url;
      if(isBlessedUrl(url)) {
        browser.pageAction.setIcon({
          tabId: tabId,
          path: { 19: 'icons/icon_19.png', 38: 'icons/icon_38.png', 48: 'icons/icon_48.png'}
        });
        browser.pageAction.setPopup({tabId: (await tab).id, popup: "conex-page-action.html"});
        browser.pageAction.show(tabId);
      }
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
      console.log('please activate tab hiding', e);
    });
  }
  browser.tabs.hide(tabIds);
}

const updateLastCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.cookieStoreId != lastCookieStoreId && !tab.cookieStoreId.startsWith(privateCookieStorePrefix)) {
      console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
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

  if(lastCookieStoreId != defaultCookieStoreId && (await tab).cookieStoreId == defaultCookieStoreId && details.url.startsWith('http')) {
    if(settings['tab-moving-allowed']) {
      console.log(`opening ${details.url} in current container`);
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
    const settings = ['create-thumbnail', 'hide-tabs', 'prefer-context', 'search-bookmarks', 'search-history', 'tab-moving-allowed'];
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

/////////////////////////// setup listeners
browser.runtime.onInstalled.addListener(handleSettingsMigration);
browser.webNavigation.onBeforeNavigate.addListener(openExternalLinksInCurrentContainer);

browser.tabs.onCreated.addListener(tab => {
  if(tab.url == 'about:newtab' && tab.cookieStoreId == defaultCookieStoreId && lastCookieStoreId != defaultCookieStoreId) {
    openInDifferentContainer(lastCookieStoreId, tab);
  }
});


browser.tabs.onActivated.addListener(activeInfo => { showHideMoveTabActions(activeInfo.tabId)});
browser.tabs.onActivated.addListener(updateLastCookieStoreId);

browser.tabs.onActivated.addListener(function(activeInfo) {
  showHideTabs(activeInfo.tabId);
});

browser.tabs.onUpdated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(showHideMoveTabActions);
browser.tabs.onActivated.addListener(activeInfo => showHideMoveTabActions(activeInfo.tabId));

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

setupMenus();
console.log('conex loaded');
