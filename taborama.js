let prevDuplicates = -1;
let imageQuality = 8;
let defaultThumbnail = "http://eromate.se/images/no-thumbnail.jpg";
let thumbnailWidth = 200;
let defaultCookieStoreId = "firefox-default";
let lastCookieStoreId = defaultCookieStoreId;

let storeScreenshot = function(details) {
  browser.tabs.get(details.tabId||details).then(tab => {
    if(!tab) {
      console.warning("couldn't find tab for browser.webNavigation.onBeforeNavigate, details: ", details);
      return;
    }

    console.log("lastCookieStoreId: "+lastCookieStoreId+" / thisCookieStoreId: "+tab.cookieStoreId);
    if(tab.cookieStoreId == defaultCookieStoreId && lastCookieStoreId != defaultCookieStoreId && tab.url.indexOf("about:") != 0 ) {
      browser.pageAction.show(Number(tab.id));
    } else if(tab.cookieStoreId != defaultCookieStoreId && tab.cookieStoreId != lastCookieStoreId) {
      console.info(`cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId;
      browser.pageAction.hide(Number(tab.id));
    }

    let capturing = browser.tabs.captureVisibleTab(null, {format: "jpeg", quality: 10});
    capturing.then(function(imageData) {
      let setting = browser.storage.local.set({[tab.url] : {thumbnail: imageData, favicon: tab.favIconUrl}});
      setting.then(
          function(_) {
            console.info("succesfully created thumbnail for", tab.url);
          }, function(e) {
            console.error(`error creating thumbnail for ${tab.url}: ${e}`);
          }
          );
    });
  });
};

function activateTab(tabId) {
  browser.tabs.update(Number(tabId), {active: true});
}

function getImageTags() {
  return new Promise((resolve, reject) => {
    browser.tabs.query({}).then(tabs => {
      let tabUrls = tabs.map(tab => tab.url);
      let items = browser.storage.local.get(tabUrls);
      items.then(items => {
        let imageTags = tabs.map(tab => {
          let backroundImg = defaultThumbnail;
          if(items[tab.url]) {
            backroundImg = items[tab.url].thumbnail;
          }
          let url = tab.url.replace("http://", "").replace("https://", "");
          let searchTerm = tab.title+" "+url;
          return "<li tabindex='1' data-search-terms='"+searchTerm.toLowerCase()+"' data-tab-id="+tab.id+" class='thumbnail'><div><div class='image' style='background:url("+backroundImg+")'><img src='"+tab.favIconUrl+"'></div><div class='text'><div class='tab-title'>"+tab.title+"</div><div class='tab-url'>"+url+"</div></div></div></li>"
        });
        imageTags.unshift("<li tabindex='1' class='section'><div><span class='circle-blue'>&nbsp;</span><span>privat</span><span>(19 tabs)</span></div></li>");
        resolve(imageTags.join(""));
      });
    });
  });
}

console.log("taborama loaded");

browser.tabs.onActivated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(storeScreenshot);

browser.commands.onCommand.addListener(function(command) {
  if (command == "new-tab-in-same-group") {
    browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
      .then(tabs => browser.tabs.get(tabs[0].id))
      .then(tab => {
        console.info(tab);
        browser.tabs.create({
          cookieStoreId: tab.cookieStoreId
        }, error => {
          console.error(error);
        });
      });
  }
});

browser.browserAction.onClicked.addListener((tab) => {
  var creating = browser.tabs.create({
    url: "popup/popup.html",
    active: true
  });
});

function getCurrentContainer() {
  return new Promise((resolve, reject) => {
    browser.contextualIdentities.query({}).then(contexts => {
      resolve(contexts.find(function(c) { return c.cookieStoreId == lastCookieStoreId; }));
    });
  })
}

browser.pageAction.onClicked.addListener(tab => {
  getCurrentContainer().then(context => {
    browser.tabs.create({
      active: true,
      cookieStoreId: context.cookieStoreId,
      url: tab.url
    });
    browser.tabs.remove(tab.id);
  });
});
