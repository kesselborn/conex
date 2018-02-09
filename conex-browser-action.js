const deletedTabOpacity = 0.3;
const containersTabsMapCreating = bg.getTabsByContainer();
const tabContainerRendering = renderTabContainers($1('#tabcontainers'));
let focusSetter;

const keyHandling = function(event) {
  //console.log('keypress', event, document.activeElement);
  try{ clearInterval(focusSetter); } catch(e) {}
  const searchElement = $1('#search');

  if(event.key == 'Enter') {
    try {
      if(document.activeElement.dataset.tabId && document.activeElement.dataset.tabId > 0) { // a normal tab
        bg.activateTab(document.activeElement.dataset.tabId);
      } else if(document.activeElement.dataset.url) { // a history or bookmark entry
        renderRestoreMenu(document.activeElement);
        return;
      } else if(document.activeElement.dataset.cookieStore && event.ctrlKey && event.shiftKey ) { // a container section / ctrl+enter+shift
        browser.tabs.create({cookieStoreId: document.activeElement.dataset.cookieStore, active: true});
      } else if(document.activeElement.dataset.cookieStore && event.ctrlKey) { // a container section / ctrl+enter
        expandTabContainer(document.activeElement.dataset.cookieStore);
        return;
      } else if(document.activeElement.dataset.cookieStore) { // a container section
        bg.switchToContainer(document.activeElement.dataset.cookieStore);
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
    $1('.arrow-right', tabContainer).className = 'arrow-down';
    for(const element of $(`ul#${cookieStoreId} li.tab`)) {
      const thumbnailElement = $1('.image', element);
      if(thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
        setBgImage(thumbnailElement, element.dataset.url);
      }
      element.style.display = element.style.display == 'none' ? '' : 'none';
    }
    tabContainer.dataset.expanded = true;
  } else {
    {
      const e =  $1('.arrow-down', tabContainer);
      if(e) { e.className = 'arrow-right'; }
    }
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

    let cnt = 0;
    for(const element of tabContainers[tabContainer]) {
      element.addEventListener('click', _ => {
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
      cnt++;
    }
    console.log(`inserted ${cnt} tabs to ${tabContainer}`);
  }
  updateTabCount();
};

const tabIsDeleted = function(e) {
  return e.style.opacity == deletedTabOpacity;
}

const updateTabCount = function() {
  console.log('updating tab count');
  for(const tabContainer of $('#tabcontainers ul')) {
    const tabCnt = Array.from($('li.tab', tabContainer)).filter(e => !tabIsDeleted(e)).length;
    console.log(`found ${tabCnt} tabs for container`,  tabContainer);
    const tabCntElement = $1('.tabs-count', tabContainer);
    tabCntElement.removeChild(tabCntElement.firstChild);
    tabCntElement.appendChild(document.createTextNode(`(${tabCnt} tabs)`));
    $1('.name', tabContainer).title = `change to this container (${tabCnt} tabs)`;

    // hide private browsing tabs section if we don't have any private tabs open
    if(tabCnt == 0 && tabContainer.id == "firefox-private") {
      tabContainer.remove();
    }
  }
}

const resetPopup = function() {
  { const history = $1('#history ul'); if(history) { history.remove() }}
  { const bookmarks = $1('#bookmarks ul'); if(bookmarks) { bookmarks.remove(); }}
  for(ul of $('#tabcontainers ul')) {
    ul.style.display = '';
    ul.querySelector('li.section').tabIndex = 1;

    {
      const arrowDown = $1('.arrow-down', ul);
      if(arrowDown) {
        arrowDown.className = 'arrow-right';
      }
    }
  }

  for(li of $('#tabcontainers li.tab')) {
    li.style.display = 'none';
  }
};

const renderResults = function(results, parent) {
  const tabLinks = Array.from($('.tab')).map(t => t.dataset.url.toLowerCase());

  {
    const arrowRight = $1('.arrow-right', parent);
    if (arrowRight) {
      arrowRight.className = 'arrow-down';
    }
  }

  results
    .sort((a,b) => b.visitCount - a.visitCount)
    .filter(e => e.url && ! tabLinks.includes(cleanUrl(e.url)))
    .forEach(searchResult => {
      const element = createHistoryOrBookmarkElement(searchResult);
      const thumbnailElement = $1('.image', element);
      if(thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
        setBgImage(thumbnailElement, element.dataset.url);
      }
      parent.appendChild(element);
    });
}

const fillBookmarksSection = function(searchQuery) {
  const bookmarks = $1('#bookmarks');
  if(bookmarks.children.length > 0) { return; }

  const tabContainerHeader = createTabContainerHeaderElement('', 'bookmarks', 'bookmarks', -1, '★  ');

  browser.bookmarks.search({
    query: searchQuery
  }).then(results => {
    renderResults(results, tabContainerHeader);

    if ($1('ul', bookmarks)) {
      $1('ul', bookmarks).replaceWith(tabContainerHeader);
    } else {
      bookmarks.appendChild(tabContainerHeader);
    }
  }, e => console.error(`Error searching ${searchQuery}: `, e));
};

const fillHistorySection = function(searchQuery) {
  const history = $1('#history');
  if(history.children.length > 0) { $1('ul', history).remove(); }
  const tabContainerHeader = createTabContainerHeaderElement('', 'history', 'history', -1);

  browser.history.search({
    text: searchQuery,
    maxResults: 30,
    startTime: 0
  }).then(results => { 
    renderResults(results, tabContainerHeader);

    if ($1('ul', history)) {
      $1('ul', history).replaceWith(tabContainerHeader);
    } else {
      history.appendChild(tabContainerHeader);
    }
  }, e => console.error(`Error searching ${searchQuery}: `, e));
};

const setBgImage = async function(element, url) {
  await readSettings;
  if(settings['create-thumbnail']) {
    const cleanedUrl = cleanUrl(url);

    element.dataset.bgSet = 'true';
    const cachedThumbnails = await browser.storage.local.get(cleanedUrl);
    if (cachedThumbnails[cleanedUrl] && cachedThumbnails[cleanedUrl].thumbnail) {
      element.style.background = "url(" + cachedThumbnails[cleanedUrl].thumbnail + ")";
    }
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

    {
      const arrowDown = $1('.arrow-right', tabContainerHeader);
      if(arrowDown) {
        arrowDown.className = 'arrow-down';
      }
    }

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

  if(settings["search-history"]) {
    fillHistorySection(searchQuery);
  }

  if(settings["search-bookmarks"]) {
    fillBookmarksSection(searchQuery);
  }
};

const startTime = Date.now();
tabContainerRendering.then(_ => {
  for(const section of $('.section')) {
    $1('.icon', section).addEventListener('click', _ => {
      try { clearInterval(focusSetter); } catch (e) { }
      expandTabContainer(section.dataset.cookieStore);
    });

    $1('.new-tab-button', section).addEventListener('click', _ => {
      try { clearInterval(focusSetter); } catch (e) { }
      browser.tabs.create({cookieStoreId: section.dataset.cookieStore, active: true});
    });

    $1('.name', section).addEventListener('click', _ => {
      bg.switchToContainer(section.dataset.cookieStore);
      window.close();
    });
  }

  containersTabsMapCreating.then(containerTabs => {
      insertTabElements(containerTabs);
  }, e => console.error(e));

  document.querySelector('#search').addEventListener('keyup', onSearchChange);
  $1('#search').addEventListener('paste', onSearchChange);
  console.log("rendering time: ", Date.now() - startTime);
  focusSetter = setInterval(function(){document.getElementById('search').focus()}, 150);
}, e => console.error(e));
