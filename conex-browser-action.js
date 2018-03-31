const deletedTabOpacity = 0.3;
const containersTabsMapCreating = bg.getTabsByContainer();
const tabContainerRendering = renderTabContainers($1('#tabcontainers'));
let focusSetter;

const keyDownHandling = function(event) {
  //console.debug('keydown', event, document.activeElement);
  try{ clearInterval(focusSetter); } catch(e) { console.error(e); }

  if(event.target.id == 'search' && event.ctrlKey && event.key == '+') {
    showNewContainerUi();
  } else if(document.activeElement.dataset.cookieStore && event.ctrlKey && event.key == '+' ) { // a container section / ctrl+enter+shift
    browser.tabs.create({cookieStoreId: document.activeElement.dataset.cookieStore, active: true});
    window.close();
  } else if(document.activeElement.dataset.cookieStore && event.ctrlKey && event.shiftKey && event.key == 'Enter' ) { // a container section / ctrl+enter+shift
    browser.tabs.create({cookieStoreId: document.activeElement.dataset.cookieStore, active: true});
    window.close();
  } else if(document.activeElement.dataset.cookieStore && (event.key == 'ArrowRight' || event.key == 'ArrowLeft')) { // a container section
    expandTabContainer(document.activeElement.dataset.cookieStore);
    return;
  } else if(event.key == 'Backspace') {
    if(document.activeElement.dataset.tabId) {
      removeTab(document.activeElement);
    } else if(document.activeElement.dataset.cookieStore) {
      $1('.delete-container-button', event.target).click();
    }
  } else if(event.key == 'Enter') {
    console.error('unhandled active element:', document.activeElement);
    return false;
  }
}

const keyPressHandling = function(event) {
  //console.debug('keypress', event, document.activeElement);
  try{ clearInterval(focusSetter); } catch(e) { console.error(e); }
  const searchElement = $1('#search');

  if(event.key == 'Enter') {
    try {
      if(document.activeElement.dataset.tabId && document.activeElement.dataset.tabId > 0) { // a normal tab
        bg.activateTab(document.activeElement.dataset.tabId);
      } else if(document.activeElement.dataset.url) { // a history or bookmark entry
        bg.openContainerSelector(document.activeElement.dataset.url, document.activeElement.dataset.title);
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

document.body.addEventListener('keypress', keyPressHandling);
document.body.addEventListener('keydown', keyDownHandling);

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
        try{ clearInterval(focusSetter); } catch(e) { console.error(e); }
        event.stopPropagation();
        removeTab(element);
        return false;
      });

      ul.appendChild(element);
      cnt++;
    }
  }
  updateTabCount();
};

const tabIsDeleted = function(e) {
  return e.style.opacity == deletedTabOpacity;
}

const updateTabCount = function() {
  console.debug('updating tab count');
  for(const tabContainer of $('#tabcontainers ul')) {
    const tabCnt = Array.from($('li.tab', tabContainer)).filter(e => !tabIsDeleted(e)).length;
    const tabCntElement = $1('.tabs-count', tabContainer);
    tabCntElement.removeChild(tabCntElement.firstChild);
    tabCntElement.appendChild(document.createTextNode(`(${tabCnt} tabs)`));
    $1('.name', tabContainer).title = `change to this container (${tabCnt} tabs)`;
    $1('.confirmation-tabs-count', tabContainer).innerHTML = `If you remove this container now, <b><em>${tabCnt} tabs will be closed</em></b>. Are you sure you want to remove this container?`;

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
    const text = $1('.name', tabContainerHeader).innerText.toLowerCase();

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

const setupNewContainerElement = async function() {
  $1('#color').addEventListener('change', e => {
    try { clearInterval(focusSetter); } catch (e) { console.error(e);  };
    $1('#color').className = e.target.options[e.target.options.selectedIndex].className;
  });
  $1('#new-container-name').addEventListener('focus', e => {
    try { clearInterval(focusSetter); } catch (e) { console.error(e);  };
  });
  $1('#color').options.selectedIndex = 0;
  $1('#color').className = $1('#color').options[0].className;
  $1('#new-container-form').addEventListener('submit', e => {
    e.stopPropagation();
    const name = $1('#new-container-name').value;
    const color = $1('#color').options[$1('#color').options.selectedIndex].className;

    if(name == "") {
      return;
    }

    console.debug(`creating new container ${name} with color ${color}`);
    browser.contextualIdentities.create({
      name: name,
      color: color,
      icon: 'circle'
    }).then(newContainer => {
      console.info('successfully created container ', newContainer);
      bg.switchToContainer(newContainer.cookieStoreId);
      $1('body').className = '';
      window.close();
    }, e => console.error('error creating new container:', e));
    return false;
  });
};

const deleteContainer = (cookieStoreId, name) => {
  browser.contextualIdentities.remove(cookieStoreId);
  window.close();
};

const setupSectionListeners = function() {
  for(const section of $('.section')) {
    $1('.icon', section).addEventListener('click', _ => {
      try { clearInterval(focusSetter); } catch (e) { console.error(e);  }
      expandTabContainer(section.dataset.cookieStore);
    });

    $1('.new-tab-button', section).addEventListener('click', _ => {
      try { clearInterval(focusSetter); } catch (e) { console.error(e);  }
      browser.tabs.create({cookieStoreId: section.dataset.cookieStore, active: true});
      window.close();
    });

    $1('.delete-container-button', section).addEventListener('click', e => {
      const cookieStoreId = e.target.dataset.cookieStore;
      const name = e.target.dataset.name;
      browser.tabs.query({cookieStoreId: cookieStoreId}).then(tabs => {
        if(tabs.length > 0) {
          e.target.parentElement.classList.add('confirming');
        } else {
          deleteContainer(cookieStoreId, name);
        }
      });
    });

    $1('.no', section).addEventListener('click', e => {
      e.target.parentElement.parentElement.classList.remove('confirming');
    });

    $1('.yes', section).addEventListener('click', e => {
      const cookieStoreId = e.target.parentElement.parentElement.dataset.cookieStore;
      browser.tabs.query({pinned: false}).then(tabs => {
        browser.tabs.update(tabs[0].id, {active: true});
      });
      browser.tabs.query({cookieStoreId: cookieStoreId}).then(tabs => {
        browser.tabs.remove(tabs.map(x => x.id));
        deleteContainer(cookieStoreId, e.target.parentElement.parentElement.dataset.name);
      });
    });

    $1('.name', section).addEventListener('click', _ => {
      bg.switchToContainer(section.dataset.cookieStore);
      window.close();
    });
  }
};

const showNewContainerUi = function() {
  $1('body').className = 'new-container';
  $1('#new-container-name').focus();
};

const startTime = Date.now();
tabContainerRendering.then(_ => {
  setupSectionListeners();

  containersTabsMapCreating.then(containerTabs => {
      insertTabElements(containerTabs);
  }, e => console.error(e));

  $1('#search').addEventListener('keyup', onSearchChange);
  $1('#search').addEventListener('paste', onSearchChange);
  console.debug("rendering time: ", Date.now() - startTime);
  focusSetter = setInterval(function(){document.getElementById('search').focus()}, 150);
  const mouseMoveListener = function() {
    try { clearInterval(focusSetter); } catch (e) { console.error(e);  };
    try { $1('body').removeEventListener('mousemove', mouseMoveListener); } catch (e) { console.error(e); };
  }
  $1('body').addEventListener('mousemove', mouseMoveListener);
  $1('#search').addEventListener('blur', function() { try { clearInterval(focusSetter); } catch (e) { console.error(e);  }; });

  $1('#new-container-button').addEventListener('click', showNewContainerUi);

  setupNewContainerElement();

}, e => console.error(e));
