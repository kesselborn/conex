let prevDuplicates = -1;
let imageQuality = 8;
let defaultThumbnail = "http://eromate.se/images/no-thumbnail.jpg";
let thumbnailWidth = 200;
let defaultCookieStoreId = "firefox-default";
let lastCookieStoreId = defaultCookieStoreId;

var $ = function(s){ return document.querySelectorAll(s); };
var $1 = function(s){ return document.querySelector(s); };
var $e = function(name, attributes, children) {
  let e = document.createElement(name);
  for(let key in attributes) {
    if(key == 'content') {
      e.appendChild(document.createTextNode(attributes[key]));
      continue;
    }
    e.setAttribute(key.replace(/_/g, '-'), attributes[key]);
  }

  for(let i in children) {
    e.appendChild(children[i]);
  }

  return e;
};


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
      setting.then(_ => console.info("succesfully created thumbnail for", tab.url),
                   e => console.error(e));
    }, error => console.error(error));
  }, error => console.error(error));
};

function activateTab(tabId) {
  browser.tabs.update(Number(tabId), {active: true});
}

console.log("taborama loaded");

browser.tabs.onActivated.addListener(storeScreenshot);
browser.tabs.onUpdated.addListener(storeScreenshot);

function newTabInCurrentContainerGroup(url) {
  browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
    .then(tabs => browser.tabs.get(tabs[0].id), error => console.error(error))
    .then(tab => {
      console.info(tab);
      browser.tabs.create({
        cookieStoreId: tab.cookieStoreId,
        url: url
      }, error => {
        console.error(error);
      });
    }, error => console.error(error));
}

browser.commands.onCommand.addListener(function(command) {
  if (command == "new-tab-in-same-group") {
    newTabInCurrentContainerGroup();
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
    }, error => console.error(error));
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
  }, e => console.error(e));
});

function createThumbnailElement(tab, backroundImg) {
  let url = tab.url.replace("http://", "").replace("https://", "");
  let searchTerm = tab.title+" "+url;
  let thumbnail = $e('li', {tabindex: 1, data_title: tab.title.toLowerCase(), data_url: url.toLowerCase(), data_tab_id: tab.id, class: 'thumbnail', style: 'display:none'} ,[
      $e('div', {}, [
        $e('div', {class: 'image', style: `background:url('${backroundImg}')`}, [
          (backroundImg == tab.favIconUrl || !tab.favIconUrl) ? $e('span') : $e('img', {src: tab.favIconUrl})
        ]),
        $e('div', {class: 'text'}, [
          $e('div', {class: 'tab-title', content: tab.title}),
          $e('div', {class: 'tab-url', content: url})
        ])
      ]),
  ]);
  return thumbnail;
}

function getTabsByGroup() {
  return new Promise((resolve, _) => {
    let elements = new Map();
    browser.tabs.query({active: false}).then(tabs => {
      let tabUrls = tabs.map(tab => tab.url);
      let items = browser.storage.local.get(tabUrls);
      items.then(items => {
        tabs.forEach(function(tab) {
          let backroundImg = tab.favIconUrl;
          if(items[tab.url]) {
            backroundImg = items[tab.url].thumbnail;
          }

          let thumbnail = createThumbnailElement(tab, backroundImg);

          if(elements[tab.cookieStoreId]) {
            elements[tab.cookieStoreId].push(thumbnail);
          } else {
            elements[tab.cookieStoreId] = [thumbnail];
          }
        });
      }, e => console.error(e));
      resolve(elements);
    }, error => console.log(error));
  });
}

