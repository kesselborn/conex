let tabGroups = renderTabGroups();

const openInDifferentContainer = function(element) {
  try {
    if(cookieStoreId = element.dataset.cookieStore) {
      bg.openInDifferentContainer(cookieStoreId);
    }
    window.close();
  } catch(e){ console.error(e); };
}

const keyHandling = function(event) {
  if(event.key == 'Enter') {
    openInDifferentContainer(document.activeElement);
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
  for(const section of $('.section')) {
    section.addEventListener('click', function() { openInDifferentContainer(section); });
  }

  document.body.addEventListener('keypress', keyHandling);
}, 200);
