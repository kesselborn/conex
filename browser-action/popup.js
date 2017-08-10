var bg = browser.extension.getBackgroundPage();

function keyHandling(event) {
  let searchElement = document.querySelector('#search');
  if(event.key == "Enter") {
    try {
      let tabId = document.activeElement.dataset.tabId;
      bg.activateTab(tabId);
      window.close();
    } catch(e){};
    return false;
  } else if(event.key == "Tab") {
  } else if(document.activeElement != searchElement) {
    document.querySelector('#search').focus();
    document.querySelector('#search').value = event.key;
    document.dispatchEvent(event);
  }
}

document.body.addEventListener("keypress", keyHandling);

bg.getImageTags().then(src => {
  document.getElementById('list').innerHTML = src;
  Array.from(document.getElementsByClassName("thumbnail")).forEach(function(element) {
    element.addEventListener("click", function(_) {
      bg.activateTab(element.dataset.tabId);
      window.close();
    });
  });
  //document.getElementById('search').focus();
  setTimeout(() => {
      document.getElementById('search').focus();
  }, 100);

  document.querySelector('#search').addEventListener("keyup", function(event) {
    if(event.key != "ArrowUp" && event.key != "ArrowDown") {
      currentSelection = document.querySelector('.selected');
      currentSelection && currentSelection.classList.remove('selected');
    }
    Array.from(document.querySelectorAll('.thumbnail')).forEach(function(element) {
      let searchTerms = element.dataset.searchTerms;
      if(searchTerms) {
        let matchesSearchTerms = event.target.value.split(" ").every(function(searchTerm) {
          return searchTerms.indexOf(searchTerm.toLowerCase()) >= 0
        });
        element.style.display = matchesSearchTerms ? "block" : "none";
      }
    });

    var searching = browser.history.search({
      text: event.target.value,
      maxResults: 50
    }).then(result => {
       let historyTags = result
         .sort(function(a,b) { return b.visitCount - a.visitCount; })
         .map(x => `<li tabindex='1' class='thumbnail'><div><div class='text'><div class='tab-title'>${x.title}</div><div class='tab-url'>${x.url}</div></div></div></li>`);
       document.getElementById('history').innerHTML = historyTags.join("");
    });
  });
});
