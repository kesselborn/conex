const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
const privateCookieStorePrefix = 'firefox-private';
const tabMovingEnabledKey = 'conex/settings/tab-moving-allowed';
const tabMovingPreferContextMenuKey = 'conex/settings/tab-moving-allowed/prefer-context-menu';

let lastCookieStoreId = defaultCookieStoreId;

//////////////////////////////////// exported functions (es6 import / export stuff is not supported in webextensions)
function activateTab(tabId) {
  browser.tabs.update(Number(tabId), {active: true}).then(tab => {
    browser.windows.update(tab.windowId, {focused: true});
  }, e => console.error(e));
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
  const containersTabsMap = {};

  const bookmarks = browser.bookmarks.search({});
  const tabs = browser.tabs.query({});

  let bookmarkUrls = [];
  try {
    bookmarkUrls = (await bookmarks).filter(b => b.url != undefined).map(b => b.url.toLowerCase());
  } catch(e) {
    console.log('error querying bookmarks: ', e);
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
          browser.tabs.create({url: tab.url, cookieStoreId: cookieStoreId, windowId: w.id, active: false}).then(_ => {
            console.log(`creating tab ${tab.url} in container ${tab.container} (cookieStoreId: ${cookieStoreId})`);
          }, e => console.error(e));
        }
      }, e => console.error(e));
    }
  }, e => console.error(e));
}

async function setupMenus() {
  await browser.menus.removeAll();
  const identities = browser.contextualIdentities.query({});
  const settings = browser.storage.local.get([tabMovingEnabledKey, tabMovingPreferContextMenuKey]);

  browser.menus.create({
    id: "settings",
    title: "conex settings",
    onclick: function() {browser.runtime.openOptionsPage(); },
    contexts: ["browser_action", "page_action"]
  });

  if((await settings)[tabMovingEnabledKey] && (await settings)[tabMovingPreferContextMenuKey]) {
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
    browser.tabs.update(tabs[0].id, {active: true});
    browser.windows.update(tabs[0].windowId, {focused: true});
  }
}

function openLinkInContainer(link, cookieStoreId) {
  browser.tabs.create({url: link, cookieStoreId: cookieStoreId});
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
  browser.storage.local.get(tabMovingEnabledKey).then(settings => {
    if(settings[tabMovingEnabledKey]) {
      browser.pageAction.show(tab.id);
    } else {
      browser.runtime.openOptionsPage();
    }
  }, e => console.error(e));
}

const isBlessedUrl = function(url) {
  return url.startsWith('http') || url.startsWith('about:blank') || url.startsWith('about:newtab');
}

const showHideMoveTabActions = async function(tabId) {
  const tab = browser.tabs.get(tabId);
  const settings = browser.storage.local.get([tabMovingEnabledKey, tabMovingPreferContextMenuKey]);
  const identities = browser.contextualIdentities.query({});

  const tabMovingEnabled = (await settings)[tabMovingEnabledKey];
  const tabMovingPreferContextMenu = (await settings)[tabMovingPreferContextMenuKey];

  const enableContextMenu = async function(enable) {
    console.log(`${enable ? 'enabling' : 'disabling'} context menu for moving tabs`);
    for(identity of (await identities)) {
      browser.menus.update(menuId(identity.cookieStoreId), { enabled: enable });
    }
  };

  const showMoveTabMenu = async function() {
    if(tabMovingPreferContextMenu) {
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

  if(tabMovingEnabled == undefined) {
    browser.pageAction.setIcon({
      tabId: tabId,
      path: { 19: 'icons/icon_error_19.png', 38: 'icons/icon_error_38.png', 48: 'icons/icon_error_48.png'}
    });
    browser.pageAction.show(tabId);
    return
  }

  if(tabMovingEnabled == false) {
    browser.pageAction.hide(tabId);
    return;
  }

  showMoveTabMenu();
};

const showTabs = async function(tabIds) {
  for (let tabId of tabIds) {
    browser.tabs.show(tabId);
  }
}

const hideTabs = async function(tabIds) {
  browser.tabs.hide(tabIds.pop()).catch(e => {
    browser.notifications.create(null, {
      type: 'basic',
      title: 'Configuration setting missing',
      message: 'Tab hiding has to be manually configured in order to work. Please see conex settings for instructions.',
    })
    console.log('please activate tab hiding', e);
  });

  for (let tabId of tabIds) {
    browser.tabs.hide(tabId);
  }
}

const showHideTabs = async function(activeInfo) {
  const activeTab = await browser.tabs.get(activeInfo.tabId);
  const allTabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});

  if (activeTab.pinned)
    return;

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

const updateLastCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.cookieStoreId != lastCookieStoreId && !tab.cookieStoreId.startsWith(privateCookieStorePrefix)) {
      console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId;
    }
  }, e => console.error(e));
};

const storeScreenshot = function(tabId, changeInfo, tab) {
  if(changeInfo.status == 'complete' && tab.url != 'about:blank' && tab.url != 'about:newtab') {
    browser.tabs.captureVisibleTab(null, {format: 'jpeg', quality: imageQuality}).then(imageData => {
      browser.storage.local.set({[cleanUrl(tab.url)] : {thumbnail: imageData, favicon: tab.favIconUrl}})
        .then(_ => console.info('succesfully created thumbnail for', cleanUrl(tab.url)),
              e  => console.error(e));

    }, e => console.error(e));
  }
};

const openExternalLinksInCurrentContainer = async function(details) {
  const tab = browser.tabs.get(details.tabId);
  const settings = browser.storage.local.get(tabMovingEnabledKey);

  if(lastCookieStoreId != defaultCookieStoreId && (await tab).cookieStoreId == defaultCookieStoreId && details.url.startsWith('http')) {
    if((await settings)[tabMovingEnabledKey]) {
      console.log(`opening ${details.url} in current container`);
      openInDifferentContainer(lastCookieStoreId, {id: (await tab).id, index: (await tab).index, url: details.url});
    }
  }
}

/////////////////////////// setup listeners

browser.webNavigation.onBeforeNavigate.addListener(openExternalLinksInCurrentContainer);

browser.tabs.onCreated.addListener(tab => {
  if(tab.url == 'about:newtab' && tab.cookieStoreId == defaultCookieStoreId && lastCookieStoreId != defaultCookieStoreId) {
    openInDifferentContainer(lastCookieStoreId, tab);
  }
});


browser.tabs.onActivated.addListener(activeInfo => { showHideMoveTabActions(activeInfo.tabId)});
browser.tabs.onActivated.addListener(updateLastCookieStoreId);

browser.tabs.onActivated.addListener(showHideTabs);

browser.tabs.onUpdated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(showHideMoveTabActions);
browser.tabs.onActivated.addListener(activeInfo => showHideMoveTabActions(activeInfo.tabId));

browser.windows.onFocusChanged.addListener(windowId => {
  if(windowId != browser.windows.WINDOW_ID_NONE) {
    browser.tabs.query({active: true, windowId: windowId}).then(tab => {
      showHideMoveTabActions(tab[0].id);
    }, e => console.error(e));
  }
});

browser.pageAction.onClicked.addListener(openPageActionPopup)

setupMenus();
console.log('conex loaded');
