const tabContainers = renderTabContainers($1('#tabcontainers'));

const openInDifferentContainer = function(element) {
  try {
    if(element.dataset.cookieStore) {
      bg.openActiveTabInDifferentContainer(element.dataset.cookieStore);
    }
    window.close();
  } catch(e){ console.error(e); }
};

const keyHandling = function(event) {
  if(event.key == 'Enter') {
    openInDifferentContainer(document.activeElement);
    return false;
  }
};

tabContainers.then(_ => {
  $1('li').focus();
  if(bg.lastCookieStoreId != bg.defaultCookieStoreId) {
    $1('#'+bg.lastCookieStoreId+' li').focus();
  }
  $1('#firefox-private').remove();

  for(const section of $('.section')) {
    section.addEventListener('click', _ => { openInDifferentContainer(section); });
  }
});

document.body.addEventListener('keypress', keyHandling);
