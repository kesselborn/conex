let prevDuplicates = -1;
let imageQuality = 8;
let defaultThumbnail = "http://eromate.se/images/no-thumbnail.jpg";
let thumbnailWidth = 200;

let storeScreenshot = function(details) {
  browser.tabs.get(details.tabId).then(tab => {
    if(!tab) {
      console.warning("couldn't find tab for browser.webNavigation.onBeforeNavigate, details: ", details);
      return;
    }
    let capturing = browser.tabs.captureVisibleTab(null, {format: "png", quality: imageQuality});
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

function getEmptyImageTags() {
  return new Promise((resolve, reject) => {
    browser.tabs.query({}).then(tabs => {
      let tabUrls = tabs.map(tab => tab.url);
      let imageTags = tabUrls.map(url => "<div class='thumbnail'><img style='max-width: 190px; max-height: 90px' src='" + defaultThumbnail +"'/></div>");
      resolve(imageTags.join(""));
    });
  });
}

function getImageTags() {
  return new Promise((resolve, reject) => {
    browser.tabs.query({}).then(tabs => {
      let tabUrls = tabs.map(tab => tab.url);
      let items = browser.storage.local.get(tabUrls);
      items.then(items => {
        let imageTags = tabUrls.map(url => "<div class='thumbnail'><img style='max-width: 200px; max-height: 100px; display: inline;' src='" + (items[url] && items[url].thumbnail || defaultThumbnail) +"'/></div>");
        resolve(imageTags.join(""));
      });
    });
  });
}

console.log("taborama loaded");

browser.webNavigation.onBeforeNavigate.addListener(storeScreenshot);
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
