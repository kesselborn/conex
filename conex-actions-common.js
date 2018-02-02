const renderTabContainers = async function(parent) {
  const identities = await browser.contextualIdentities.query({});

  browser.browserAction.setBadgeText({text: ''});
  for(const context of [{cookieStoreId: 'firefox-default', color: 'default', name: 'default'}]
                       .concat(identities.sort((a,b) => a.name.toLowerCase() > b.name.toLowerCase()))
                       .concat({cookieStoreId: 'firefox-private', color: 'private', name: 'private browsing tabs'})) {
    parent.appendChild(createTabContainerHeaderElement(context.cookieStoreId, context.color, context.name));
  }

  return;
}

const renderRestoreMenu = async function(parent) {
  const header = createHeaderElement('re-store tab in');
  parent.appendChild(header);
  await renderTabContainers(parent);
  for(const section of $('ul .section', parent)) {
    section.addEventListener('click', _ => {
      bg.openLinkInContainer(parent.dataset.url, section.dataset.cookieStore);
      window.close();
    });
    section.addEventListener('keypress', event => {
      if(event.key == 'Enter') {
        bg.openLinkInContainer(parent.dataset.url, section.dataset.cookieStore);
        window.close();
      }
    });
  }
  $1('ul .section', parent).focus();
}
