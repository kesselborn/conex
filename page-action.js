let tabGroups = renderTabGroups();

function keyHandling(event) {
  console.log(event);
  if(event.key == "Enter") {
    try {
      if(cookieStoreId = document.activeElement.dataset.cookieStore) {
        bg.openInDifferentContainer(cookieStoreId);
      }
      window.close();
    } catch(e){};
    return false;
  }
}

document.body.addEventListener("keypress", keyHandling);

setTimeout(_ => {
tabGroups.then(_ => {
  $1('li').focus();
  if(bg.lastCookieStoreId != bg.defaultCookieStoreId) {
    $1('#'+bg.lastCookieStoreId+' li').focus();
  }
})


}, 200);
