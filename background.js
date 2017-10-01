const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
const tabMovingEnabledKey = 'conex/settings/tab-moving-allowed';
const tabMovingPreferContextMenuKey = 'conex/settings/tab-moving-allowed/prefer-context-menu';

let lastCookieStoreId = defaultCookieStoreId;

//////////////////////////////////// exported functions (es6 import / export stuff is not supported in webextensions)
function activateTab(tabId) {
  browser.tabs.update(Number(tabId), {active: true}).then(tab => {
    browser.windows.update(tab.windowId, {focused: true});
  });
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
  if(!cookieStoreId.startsWith('firefox-private')) {
    console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${cookieStoreId}`);
    lastCookieStoreId = cookieStoreId;
    browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT}).then(tabs => {
      const activeTab = tabs[0];
      if(activeTab.url.startsWith('http') || activeTab.url.startsWith('about:blank') || activeTab.url.startsWith('about:newtab')) {
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

  const bookmarkUrls = (await bookmarks).filter(b => b.url != undefined).map(b => b.url.toLowerCase());
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

function restoreTabContainersBackup(tabContainers, windows) {
  createMissingTabContainers(tabContainers).then(identities => {
    for(const tabs of windows) {
      browser.windows.create({}).then(w => {
        for(const tab of tabs) {
          let cookieStoreId = defaultCookieStoreId;
          if(tab.container) {
            cookieStoreId = identities.get(tab.container.toLowerCase());
          }
          browser.tabs.create({url: tab.url, cookieStoreId: cookieStoreId, windowId: w.id, active: false}).then(() => {
            console.log(`creating tab ${tab.url} in container ${tab.container} (cookieStoreId: ${cookieStoreId})`);
          });
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
  });
}

const showHideMoveTabActions = async function(tabId) {
  const tab = browser.tabs.get(tabId);
  const settings = browser.storage.local.get([tabMovingEnabledKey, tabMovingPreferContextMenuKey]);
  const identities = browser.contextualIdentities.query({});

  const tabMovingEnabled = (await settings)[tabMovingEnabledKey];
  const tabMovingPreferContextMenu = (await settings)[tabMovingPreferContextMenuKey];

  console.log('tabMovingEnabled: ', tabMovingEnabled, 'preferContextMenu: ', tabMovingPreferContextMenu);

  const showMoveTabMenu = async function() {
    if(tabMovingPreferContextMenu) {
      browser.pageAction.hide(tabId);
      const enableMoveTabMenu = ((await tab).url.startsWith('http') || (await tab).url.startsWith('about:blank') || (await tab).url.startsWith('about:newtab')) ? true : false;
      console.log(`${enableMoveTabMenu ? 'enabling' : 'disabling'} context menu for moving tabs`);
      for(identity of (await identities)) {
        browser.menus.update(menuId(identity.cookieStoreId), { enabled: enableMoveTabMenu });
      }
    } else {
      if((await tab).url.startsWith('http') || (await tab).url.startsWith('about:blank') || (await tab).url.startsWith('about:newtab')) {
        browser.pageAction.setIcon({
          tabId: tabId,
          path: { 19: 'icons/icon_19.png', 38: 'icons/icon_38.png', 48: 'icons/icon_48.png'}
        });
        browser.pageAction.setPopup({tabId: (await tab).id, popup: "page-action.html"});
        browser.pageAction.show(tabId);
      }
    }
  };

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

const updateLastCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.cookieStoreId != defaultCookieStoreId && tab.cookieStoreId != lastCookieStoreId && !tab.cookieStoreId.startsWith('firefox-private')) {
      console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId;
    }
  });
};

const storeScreenshot = function(tabId, changeInfo, tab) {
  if(changeInfo.status == 'complete' && tab.url != 'about:blank' && tab.url != 'about:newtab') {
    browser.tabs.captureVisibleTab(null, {format: 'jpeg', quality: imageQuality}).then(imageData => {
      browser.storage.local.set({[cleanUrl(tab.url)] : {thumbnail: imageData, favicon: tab.favIconUrl}})
        .then(() => console.info('succesfully created thumbnail for', cleanUrl(tab.url)),
            e  => console.error(e));

    });
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

browser.tabs.onUpdated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(showHideMoveTabActions);

browser.pageAction.onClicked.addListener(openPageActionPopup)

setupMenus();
console.log('conex loaded');
