const deletedTabOpacity = 0.3;
const containersTabsMapCreating = bg.getTabsByContainer();
const tabContainerRendering = renderTabContainers($1('#tabcontainers'));
const bookmarkQuerying = browser.bookmarks.search({});
let focusSetter;

const keyHandling = function(event) {
  //console.log('keypress', event);
  try{ clearInterval(focusSetter); } catch(e) {}
  const searchElement = $1('#search');

  if(event.key == 'Enter') {
    try {
      if(document.activeElement.dataset.tabId) { // a normal tab
        bg.activateTab(document.activeElement.dataset.tabId);
      } else if(document.activeElement.dataset.url) { // a history or bookmark entry
        renderRestoreMenu(document.activeElement);
        return;
      } else if(document.activeElement.dataset.cookieStore && event.ctrlKey) { // a container section / ctrl+enter+shift
        browser.tabs.create({cookieStoreId: document.activeElement.dataset.cookieStore, active: true});
      } else if(document.activeElement.dataset.cookieStore && event.ctrlKey) { // a container section / ctrl+enter
        bg.switchToContainer(document.activeElement.dataset.cookieStore);
      } else if(document.activeElement.dataset.cookieStore) { // a container section
        expandTabContainer(document.activeElement.dataset.cookieStore);
        return;
      } else {
        console.error('unhandled active element:', document.activeElement);
      }
      window.close();
    } catch(e){console.error(e);}
  } else if(event.key == 'Backspace' && document.activeElement.dataset.tabId) { // close tab
    removeTab(document.activeElement);
  } else if(event.key == 'Tab') { // needed to eat the tab event
  } else if(document.activeElement != searchElement) {
    searchElement.focus();
    searchElement.value = '';
    if(event.key.length == 1) {
      searchElement.value = event.key;
    }
  }
};

const expandTabContainer = function(cookieStoreId) {
  resetPopup();
  for(const element of $('li.tab')) {
    element.style.display = 'none';
  }

  const tabContainer = $1(`ul#${cookieStoreId}`);
  if(tabContainer.dataset.expanded != "true") {
    for(const element of $(`ul#${cookieStoreId} li.tab`)) {
      const thumbnailElement = $1('.image', element);
      if(thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
        setBgImage(thumbnailElement, element.dataset.url);
      }
      element.style.display = element.style.display == 'none' ? '' : 'none';
    }
    tabContainer.dataset.expanded = true;
  } else {
    tabContainer.dataset.expanded = false;
  }
}

document.body.addEventListener('keypress', keyHandling);

const removeTab = function(element) {
  element.style.opacity = deletedTabOpacity;
  element.tabIndex = -1;
  bg.closeTab(element.dataset.tabId);
  updateTabCount();
}

const insertTabElements = function(tabContainers) {
  for(tabContainer in tabContainers) {
    const ul = $1(`#${tabContainer}`);
    if(!ul) {
      console.error(`couldn't find tab container with id ${tabContainer}`);
      continue;
    }

    for(const element of tabContainers[tabContainer]) {
      element.addEventListener('click', () => {
        bg.activateTab(element.dataset.tabId);
        window.close();
      });

      $1('.close-button', element).addEventListener('click', function(event) {
        try{ clearInterval(focusSetter); } catch(e) {}
        event.stopPropagation();
        removeTab(element);
        return false;
      });

      ul.appendChild(element);
    }
  }
  updateTabCount();
};

const tabIsDeleted = function(e) {
  return e.style.opacity == deletedTabOpacity;
}

const updateTabCount = function() {
  for(const tabContainer of $('#tabcontainers ul')) {
    const tabCnt = Array.from($('li.tab', tabContainer)).filter(e => !tabIsDeleted(e)).length;
    const tabCntElement = $1('.tabs-count', tabContainer);
    tabCntElement.removeChild(tabCntElement.firstChild);
    tabCntElement.appendChild(document.createTextNode(`(${tabCnt} tabs)`));
  }
}

const resetPopup = function() {
  { const history = $1('#history ul'); if(history) { history.remove() }}
  { const bookmarks = $1('#bookmarks ul'); if(bookmarks) { bookmarks.remove(); }}
  for(ul of $('#tabcontainers ul')) {
    ul.style.display = '';
    ul.querySelector('li.section').tabIndex = 1;
  }

  for(li of $('#tabcontainers li.tab')) {
    li.style.display = 'none';
  }
};

const renderResults = function(results, parent) {
  const tabLinks = Array.from($('.tab')).map(t => t.dataset.url.toLowerCase());

  results
    .sort((a,b) => b.visitCount - a.visitCount)
    .filter(e => e.url && ! tabLinks.includes(cleanUrl(e.url)))
    .forEach(searchResult => parent.appendChild(createHistoryElement(searchResult)));
}

const fillBookmarksSection = function(searchQuery) {
  const bookmarks = $1('#bookmarks');
  if(bookmarks.children.length > 0) { return; }

  const tabContainerHeader = createTabContainerHeaderElement('', 'bookmarks', 'bookmarks', -1, '★ ');

  if($1('ul', bookmarks)) {
    $1('ul', bookmarks).replaceWith(tabContainerHeader);
  } else {
    bookmarks.appendChild(tabContainerHeader);
  }

  browser.bookmarks.search({
    query: searchQuery
  }).then(results => renderResults(results, $1('ul', bookmarks)), e => console.error(e));
};

const fillHistorySection = function(searchQuery) {
  const history = $1('#history');
  if(history.children.length > 0) { $1('ul', history).remove(); }
  const tabContainerHeader = createTabContainerHeaderElement('', 'history', 'history', -1);

  if($1('ul', history)) {
    $1('ul', history).replaceWith(tabContainerHeader);
  } else {
    history.appendChild(tabContainerHeader);
  }

  browser.history.search({
    text: searchQuery,
    startTime: 0
  }).then(results => renderResults(results, $1('ul', history)), e => console.error(e));
};

const setBgImage = async function(element, url) {
  element.dataset.bgSet = 'true';
  const cachedThumbnails = await browser.storage.local.get(url);
  if(cachedThumbnails[url] && cachedThumbnails[url].thumbnail) {
    element.style.background = "url("+cachedThumbnails[url].thumbnail+")";
  }
}

const showHideTabEntries = function(searchQuery) {
  for(element of $('.tab')) {
    const text = (element.dataset.title + cleanUrl(element.dataset.url)).toLowerCase();

    if(text) {
      // if the search query consists of multiple words, check if ALL words match -- regardless of the order
      const match = searchQuery.split(' ').every(q => {
        return text.indexOf(q) >= 0
      });

      if(match) {
        const thumbnailElement = $1('.image', element);
        if(thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
          setBgImage(thumbnailElement, element.dataset.url);
        }
      }
      element.style.display = match ? '' : 'none';
    }
  }
};

const showHideTabContainerHeader = function(searchQuery) {
  for(ul of $('ul')) {
    const tabContainerHeader = ul.querySelector('li.section');
    const text = $('span', tabContainerHeader)[1].innerText.toLowerCase();

    // if the search query consists of multiple words, check if ALL words match -- regardless of the order
    const match = searchQuery.split(' ').every(q => {
      return text.indexOf(q) >= 0
    });

    if(match) { // don't hide header if it matches the current search
      ul.style.display = '';
      tabContainerHeader.tabIndex = 1;
      continue;
    }

    tabContainerHeader.tabIndex = -1; // section should not be selectable when we have search results

    // hide sections that don't have tabs that match the search
    if(Array.from(ul.querySelectorAll('li.tab')).filter(li => li.style.display != 'none') == 0) {
      ul.style.display = 'none';
    } else {
      ul.style.display = '';
    }
  }
};

const onSearchChange = function(event) {
  let searchQuery = "";
  if(event.type == "paste") {
    searchQuery = event.clipboardData.getData("text");
  } else {
    searchQuery = event.target.value.toLowerCase();
  }

  if(searchQuery == '') {
    return resetPopup();
  }

  showHideTabEntries(searchQuery);
  showHideTabContainerHeader(searchQuery);

  fillHistorySection(searchQuery);
  fillBookmarksSection(searchQuery);
};

const startTime = Date.now();
tabContainerRendering.then(() => {
  for(const section of $('.section')) {
    section.addEventListener('click', () => { expandTabContainer(section.dataset.cookieStore); });
  }

  Promise.all([containersTabsMapCreating, bookmarkQuerying]).then(results => {
    insertTabElements(results[0], results[1]);
    if(!results[0]['firefox-private']) {
      $1('#firefox-private').remove();
    }
  });

  document.querySelector('#search').addEventListener('keyup', onSearchChange);
  $1('#search').addEventListener('paste', onSearchChange);
  console.log("rendering time: ", Date.now() - startTime);
  focusSetter = setInterval(function(){document.getElementById('search').focus()}, 150);
}, e => console.error(e));

