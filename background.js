const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
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

function newTabInCurrentContainerGroup(url) {
  browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT}).then(tabs => {
    const createProperties = { cookieStoreId: tabs[0].cookieStoreId };
    if(url) {
      createProperties['url'] = url
    }

    browser.tabs.create(createProperties).catch(e => console.error(e));
  }, e => console.error(e));
}

function openActiveTabInDifferentContainer(cookieStoreId) {
  browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
    .then(tabs => {
      openInDifferentContainer(cookieStoreId, tabs[0]);
    }, e=> console.error(e));
}

function getTabsByGroup() {
  return new Promise((resolve, reject) => {
    const groupsTabsMap = {};

    browser.tabs.query({}).then(tabs => {
      const tabUrls = tabs.map(tab => tab.url);

      browser.storage.local.get(tabUrls).then(cachedThumbnails => {
        for(const tab of tabs) {
          let backroundImg = tab.favIconUrl;
          if(cachedThumbnails[tab.url]) {
            backroundImg = cachedThumbnails[tab.url].thumbnail;
          }

          const thumbnailElement = createTabElement(tab, backroundImg);

          if(!groupsTabsMap[tab.cookieStoreId]) {
            groupsTabsMap[tab.cookieStoreId] = [];
          }

          groupsTabsMap[tab.cookieStoreId].push(thumbnailElement);
        }
      }, e => reject(e));
      resolve(groupsTabsMap);
    }, e => reject(e));
  });
}

function restoreTabGroupsBackup(tabGroups, windows) {
  createMissingTabGroups(tabGroups).then(identities => {
    for(const tabs of windows) {
      browser.windows.create({}).then(w => {
        for(const tab of tabs) {
          const cookieStoreId = identities.get(tab.group.toLowerCase());
          browser.tabs.create({url: tab.url, cookieStoreId: cookieStoreId, windowId: w.id, active: false}).then(() => {
            console.log(`creating tab ${tab.url} in group ${tab.group} (cookieStoreId: ${cookieStoreId})`);
          });
        }
      }, e => console.error(e));
    }
  }, e => console.error(e));
}

//////////////////////////////////// end of exported functions (again: es6 features not supported yet
const openInDifferentContainer = function(cookieStoreId, tab) {
  const tabProperties = {
    active: true,
    cookieStoreId: cookieStoreId,
    index: tab.index+1
  };
  if(tab.url != 'about:newtab') {
    tabProperties.url = tab.url;
  }

  browser.tabs.create(tabProperties);
  browser.tabs.remove(tab.id);
}


const createMissingTabGroups = function(tabGroups) {
  return new Promise((resolve, reject) => {
    const colors = ["blue", "turquoise", "green", "yellow", "orange", "red", "pink", "purple"];

    browser.contextualIdentities.query({}).then(identities => {
      const nameCookieStoreIdMap = new Map(identities.map(identity => [identity.name.toLowerCase(), identity.cookieStoreId]));
      const promises = [];

      for(const tabGroup of tabGroups) {
        if(!nameCookieStoreIdMap.get(tabGroup.toLowerCase())) {
          console.info(`creating tab group ${tabGroup}`);
          const newIdentity = {name: tabGroup, icon: 'circle', color: colors[Math.floor(Math.random() * (8 - 0)) + 0]};
          browser.contextualIdentities.create(newIdentity).then(identity => {
            nameCookieStoreIdMap.set(identity.name.toLowerCase(), identity.cookieStoreId);
          }, e => reject(e));
        }
      }
      resolve(nameCookieStoreIdMap);
    }, e => reject(e) );
  });
};

const openPageActionPopup = function(tab) {
  browser.storage.local.get("taborama/settings/show-page-action").then(showPageAction => {
    if(showPageAction["taborama/settings/show-page-action"]) {
      browser.pageAction.setPopup({tabId: tab.id, popup: "page-action.html"});
    } else {
      browser.runtime.openOptionsPage();
    }
  });
}

const showHidePageAction = function(tabId) {
  const querying = browser.tabs.get(tabId);
  const setting = browser.storage.local.get("taborama/settings/show-page-action");

  Promise.all([querying, setting]).then(results => {
    const tab = results[0];
    const showPageAction = results[1];

    if(showPageAction["taborama/settings/show-page-action"] == true) {
      if(tab.url.indexOf('about:') != 0 ) {
        browser.pageAction.setIcon({
          tabId: tabId,
          path: { 19: 'icons/icon_19.png', 38: 'icons/icon_38.png', 48: 'icons/icon_48.png'}
        });
        browser.pageAction.show(tabId);
      }
    } else if(showPageAction["taborama/settings/show-page-action"] == undefined) {
      browser.pageAction.setIcon({
        tabId: tabId,
        path: { 19: 'icons/icon_error_19.png', 38: 'icons/icon_error_38.png', 48: 'icons/icon_error_48.png'}
      });
      browser.pageAction.show(tabId);
    } else {
      browser.pageAction.hide(tabId);
    }
  });
};

const updateLastCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.cookieStoreId != defaultCookieStoreId && tab.cookieStoreId != lastCookieStoreId) {
      console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId;
    }
  });
};

const storeScreenshot = function(tabId) {
  browser.tabs.get(tabId).then(tab => {
    if(tab.url == "about:blank" || tab.url == "about:newtab") {
      return;
    }

    browser.tabs.captureVisibleTab(null, {format: 'jpeg', quality: imageQuality}).then(imageData => {
      browser.storage.local.set({[tab.url] : {thumbnail: imageData, favicon: tab.favIconUrl}})
        .then(() => console.info('succesfully created thumbnail for', tab.url),
            e  => console.error(e));

    }, e => console.error(e));
  }, e => console.error(e));
};


/////////////////////////// setup listeners
browser.tabs.onCreated.addListener(function(tab){
  if(tab.url == 'about:newtab' && tab.cookieStoreId == defaultCookieStoreId && lastCookieStoreId != defaultCookieStoreId) {
    openInDifferentContainer(lastCookieStoreId, tab);
  }
});
browser.tabs.onActivated.addListener(function(activeInfo) { storeScreenshot(activeInfo.tabId) });
browser.tabs.onActivated.addListener(function(activeInfo) { showHidePageAction(activeInfo.tabId)});
browser.tabs.onActivated.addListener(updateLastCookieStoreId);

browser.tabs.onUpdated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(showHidePageAction);

browser.pageAction.onClicked.addListener(openPageActionPopup)

console.log('taborama loaded');
