const renderTabGroups = function() {
  const tabGroups = $1('#tabgroups');

  return new Promise((resolve, reject) => {
    browser.contextualIdentities.query({}).then(identities => {
      browser.browserAction.setBadgeText({text: ''});
      for(const context of identities.concat({cookieStoreId: 'firefox-default', color: 'none', name: 'default'})) {
        tabGroups.appendChild(createTabGroupHeaderElement(context.cookieStoreId, context.color, context.name));
      }
    }, e => reject(e));
    resolve({});
  });
}

