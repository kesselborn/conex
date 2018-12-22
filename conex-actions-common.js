const renderTabContainers = async function(parent, topContainer) {
  const tabs = browser.tabs.query({audible: true});
  const identities = browser.contextualIdentities.query({});

  browser.browserAction.setBadgeText({text: ''});
  const identitiesWithAudibleContainers = (await tabs).map(x => x.cookieStoreId);

  const contexts = [{cookieStoreId: 'firefox-private', color: 'private', name: 'private browsing tabs'},
    {cookieStoreId: 'firefox-default', color: 'default', name: 'default'}]
    .concat((await identities).sort((a,b) => a.name.toLowerCase() > b.name.toLowerCase()))

  if(topContainer) {
    const topElement = contexts.splice(contexts.findIndex(e => e.cookieStoreId == topContainer), 1);
    contexts.unshift(null);
    contexts.unshift(topElement[0]);
  }

  for(const context of contexts) {
    if(context == null) {
      parent.appendChild($e('br'));
    } else {
      parent.appendChild(
        createTabContainerHeaderElement(
          context.cookieStoreId,
          context.color,
          context.name,
          1,
          '',
          identitiesWithAudibleContainers.includes(context.cookieStoreId)));
    }
  }
}
