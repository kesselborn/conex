const imageQuality = 8;
const defaultCookieStoreId = 'firefox-default';
let lastCookieStoreId = defaultCookieStoreId;

//////////////////////////////////// exported functions (es6 import / export stuff is not supported in webextensions)
function activateTab(tabId) {
  browser.tabs.update(Number(tabId), {active: true});
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

function openInDifferentContainer(cookieStoreId) {
  browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
    .then(tabs => {
      browser.tabs.create({
        active: true,
        cookieStoreId: cookieStoreId,
        url: tabs[0].url,
        index: tabs[0].index+1
      });
      browser.tabs.remove(tabs[0].id);
    }, e=> console.error(e));
}

function getTabsByGroup() {
  return new Promise((resolve, reject) => {
    const groupsTabsMap = new Map();

    browser.tabs.query({}).then(tabs => {
      const tabUrls = tabs.map(tab => tab.url);

      browser.storage.local.get(tabUrls).then(cachedThumbnails => {
        for(const tab of tabs) {
          let backroundImg = tab.favIconUrl;
          if(cachedThumbnails[tab.url]) {
            backroundImg = cachedThumbnails[tab.url].thumbnail;
          }

          const thumbnailElement = createTabElement(tab, backroundImg);

          if(groupsTabsMap[tab.cookieStoreId]) {
            groupsTabsMap[tab.cookieStoreId].push(thumbnailElement);
          } else {
            groupsTabsMap[tab.cookieStoreId] = [thumbnailElement];
          }
        }
      }, e => reject(e));
      resolve(groupsTabsMap);
    }, e => reject(e));
  });
}

//////////////////////////////////// end of exported functions (again: es6 features not supported yet

const showHidePageAction = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.url.indexOf('about:') != 0 ) {
      browser.pageAction.show(Number(tab.id));
    }
  })
};

const updateCookieStoreId = function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if(tab.cookieStoreId != defaultCookieStoreId && tab.cookieStoreId != lastCookieStoreId) {
      console.log(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId;
    }
  });
};

const storeScreenshot = function(tabId) {
  const tabQuerying = browser.tabs.get(tabId);
  const capturing = browser.tabs.captureVisibleTab(null, {format: 'jpeg', quality: imageQuality});

  Promise.all([tabQuerying, capturing]).then(results => {
    const tab = results[0];
    const imageData = results[1];

    browser.storage.local.set({[tab.url] : {thumbnail: imageData, favicon: tab.favIconUrl}})
      .then(() => console.info('succesfully created thumbnail for', tab.url),
            e  => console.error(e));

  }, error => console.error(error));
};


/////////////////////////// setup listeners
browser.commands.onCommand.addListener(function(command) {
  if (command == 'new-tab-in-same-group') {
    newTabInCurrentContainerGroup();
  }
});

browser.tabs.onActivated.addListener(function(activeInfo) { storeScreenshot(activeInfo.tabId) });
browser.tabs.onActivated.addListener(showHidePageAction);
browser.tabs.onActivated.addListener(updateCookieStoreId);

browser.tabs.onUpdated.addListener(storeScreenshot);

console.log('taborama loaded');
