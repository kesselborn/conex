let tabGroups = renderTabGroups();

const keyHandling = function(event) {
  if(event.key == 'Enter') {
    try {
      if(cookieStoreId = document.activeElement.dataset.cookieStore) {
        bg.openInDifferentContainer(cookieStoreId);
      }
      window.close();
    } catch(e){ console.error(e); };
    return false;
  }
};

setTimeout(() => {
  tabGroups.then(() => {
    $1('li').focus();
    if(bg.lastCookieStoreId != bg.defaultCookieStoreId) {
      $1('#'+bg.lastCookieStoreId+' li').focus();
    }
  });
  document.body.addEventListener('keypress', keyHandling);
}, 200);
