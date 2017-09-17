const renderTabContainers = function() {
  const tabContainers = $1('#tabcontainers');

  return new Promise((resolve, reject) => {
    browser.contextualIdentities.query({}).then(identities => {
      browser.browserAction.setBadgeText({text: ''});
      for(const context of identities.concat({cookieStoreId: 'firefox-default', color: 'default', name: 'default'})) {
        tabContainers.appendChild(createTabContainerHeaderElement(context.cookieStoreId, context.color, context.name));
      }
      resolve({});
    }, e => reject(e));
  });
}

