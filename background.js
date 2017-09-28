const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
const tabMovingSettingKey = 'conex/settings/tab-moving-allowed';

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
  lastCookieStoreId = cookieStoreId;
  browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
    .then(tabs => {
      openInDifferentContainer(cookieStoreId, tabs[0]);
    }, e=> console.error(e));
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

//////////////////////////////////// end of exported functions (again: es6 features not supported yet
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
  browser.storage.local.get(tabMovingSettingKey).then(showPageAction => {
    if(showPageAction[tabMovingSettingKey]) {
      browser.pageAction.show(tabId);
    } else {
      browser.runtime.openOptionsPage();
    }
  });
}

const showHidePageAction = function(tabId) {
  Promise.all([browser.tabs.get(tabId), browser.storage.local.get(tabMovingSettingKey)]).then(results => {
    const tab = results[0];
    const showPageAction = results[1];

    if(showPageAction[tabMovingSettingKey] == true) {
      if(tab.url.startsWith('http') || tab.url.startsWith('about:blank') || tab.url.startsWith('about:newtab')) {
        browser.pageAction.setIcon({
          tabId: tabId,
          path: { 19: 'icons/icon_19.png', 38: 'icons/icon_38.png', 48: 'icons/icon_48.png'}
        });
        browser.pageAction.setPopup({tabId: tab.id, popup: "page-action.html"});
        browser.pageAction.show(tabId);
      }
    } else if(showPageAction[tabMovingSettingKey] == undefined) {
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

const storeScreenshot = function(tabId, changeInfo, tab) {
  if(changeInfo.status == 'complete' && tab.url != 'about:blank' && tab.url != 'about:newtab') {
    browser.tabs.captureVisibleTab(null, {format: 'jpeg', quality: imageQuality}).then(imageData => {
      browser.storage.local.set({[cleanUrl(tab.url)] : {thumbnail: imageData, favicon: tab.favIconUrl}})
        .then(() => console.info('succesfully created thumbnail for', cleanUrl(tab.url)),
            e  => console.error(e));

    });
  }
};

/////////////////////////// setup listeners

browser.webNavigation.onBeforeNavigate.addListener(details => {
  browser.tabs.get(details.tabId).then(tab => {
    if(lastCookieStoreId != defaultCookieStoreId &&
        tab.cookieStoreId == defaultCookieStoreId &&
        details.url.startsWith('http')) {
      browser.storage.local.get(tabMovingSettingKey).then(showPageAction => {
        if(showPageAction[tabMovingSettingKey]) {
          openInDifferentContainer(lastCookieStoreId, {id: tab.id, index: tab.index, url: details.url});
        }
      });
    }
  });
});

browser.tabs.onCreated.addListener(tab => {
  if(tab.url == 'about:newtab' && tab.cookieStoreId == defaultCookieStoreId && lastCookieStoreId != defaultCookieStoreId) {
    openInDifferentContainer(lastCookieStoreId, tab);
  }
});


browser.tabs.onActivated.addListener(activeInfo => { showHidePageAction(activeInfo.tabId)});
browser.tabs.onActivated.addListener(updateLastCookieStoreId);

browser.tabs.onUpdated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(showHidePageAction);

browser.pageAction.onClicked.addListener(openPageActionPopup)

  console.log('conex loaded');
