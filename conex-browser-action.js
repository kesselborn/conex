const deletedTabOpacity = 0.3;
const containersTabsMapCreating = bg.getTabsByContainer();
const tabContainerRendering = renderTabContainers($1('#tabcontainers'));


const keyDownHandling = function (event) {
  //console.debug('keydown', event, document.activeElement);
  const searchElement = $1('#search');
  const newContainerElement = $1("#new-container-name");

  if (event.key == 'ArrowUp') {
    console.debug('arrowup');
    let prevElement = searchElement;

    for (e of $('li')) {
      if (e.dataset.match == 'true' && e.style.display != 'none') {
        if (e == document.activeElement) {
          prevElement.focus()
          break;
        } else {
          prevElement = e;
        }
      }
    }
  } else if (event.key == 'ArrowDown') {
    console.debug('arrowdown');
    let foundActiveElement = document.activeElement == searchElement || document.activeElement == $1('body');

    for (e of $('li')) {
      if (e.dataset.match == 'true' && e.style.display != 'none') {
        if (e == document.activeElement) {
          foundActiveElement = true;
        } else {
          if (foundActiveElement) {
            e.focus();
            break;
          }
        }
      }
    }
  } else if (event.target.id == 'search' && event.ctrlKey && event.key == '+') {
    showNewContainerUi();
  } else if (document.activeElement.dataset.cookieStore && event.ctrlKey && event.key == '+') { // a container section / ctrl+'+'
    newTabInContainer(document.activeElement.dataset.cookieStore);
  } else if (document.activeElement.dataset.cookieStore && event.ctrlKey && event.shiftKey && event.key == 'Enter') { // a container section / ctrl+enter+shift
    browser.tabs.create({ cookieStoreId: document.activeElement.dataset.cookieStore, active: true });
    window.close();
  } else if (document.activeElement.dataset.cookieStore && (event.key == 'ArrowRight' || event.key == 'ArrowLeft')) { // a container section
    toggleExpandTabContainer(document.activeElement.dataset.cookieStore);
    return;
  } else if (event.key == 'Backspace') {
    if (document.activeElement.dataset.tabId) { // delete tab
      removeTab(document.activeElement);
    } else if (document.activeElement.dataset.cookieStore) { // delete container
      if (event.shiftKey) {
        const doubleClickEvent = document.createEvent('MouseEvents');
        doubleClickEvent.initEvent('dblclick', true, true);
        $1('.delete-container-button', event.target).dispatchEvent(doubleClickEvent);
      } else {
        $1('.delete-container-button', event.target).click();
      }
    }
  } else if (event.key == 'Enter') {
    return false;
  }
}

const keyPressHandling = function (event) {
  //console.debug('keypress', event, document.activeElement);
  const searchElement = $1('#search');

  if (event.key == 'Enter') {
    try {
      if (document.activeElement.dataset.tabId && document.activeElement.dataset.tabId > 0) { // a normal tab
        bg.activateTab(document.activeElement.dataset.tabId);
      } else if (document.activeElement.dataset.url) { // a history or bookmark entry
        bg.openContainerSelector(document.activeElement.dataset.url, document.activeElement.dataset.title);
      } else if (document.activeElement.dataset.cookieStore && event.ctrlKey && event.shiftKey) { // a container section / ctrl+enter+shift
        browser.tabs.create({ cookieStoreId: document.activeElement.dataset.cookieStore, active: true });
      } else if (document.activeElement.dataset.cookieStore && event.ctrlKey) { // a container section / ctrl+enter
        toggleExpandTabContainer(document.activeElement.dataset.cookieStore);
        return;
      } else if (document.activeElement.dataset.cookieStore) { // a container section
        bg.switchToContainer(document.activeElement.dataset.cookieStore);
      } else if (document.activeElement.id == 'search') { // enter in search form == activate first shown container or tab
        let candidate = undefined; // if we enter a section, remember this section but try to find a matching tab in this section first

        for (const e of $('li')) {
          if (e.style.display != 'none' && e.dataset.tabId) {
            if (e.dataset.tabId == 0) { // history or bookmark entry
              console.log('restoringTab', e.dataset.url, e);
              bg.openContainerSelector(e.dataset.url, e.dataset.title);
            } else {                   // a tab that is open
              console.log(`activateTab ${e.dataset.tabId}`, e);
              bg.activateTab(e.dataset.tabId);
            }
            candidate = undefined;
            break;
          } else if (e.style.display != 'none' && e.className == 'section' && e.dataset.match == 'true') {
            if (candidate) {
              console.log('switchToContainer', candidate);
              bg.switchToContainer(candidate);
              candidate = undefined;
              break;
            }
            candidate = e.dataset.cookieStore;
          }
        }
        if (candidate) {
          console.log('switchToContainer', candidate);
          bg.switchToContainer(candidate);
        }
      } else if (document.activeElement.id === "new-container-button") {
        return;
      } else if (document.activeElement.id === "back-to-search-button") {
        document.body.classList.remove("new-container");
        return;
      } else {
        console.error('unhandled keypress active element:', document.activeElement);
      }
      window.close();
    } catch (e) { console.error(e); }
  } else if (event.key == 'Backspace' && document.activeElement.dataset.tabId) { // close tab
    removeTab(document.activeElement);
  } else if (event.key == 'Tab') { // needed to eat the tab event
  } else if (document.activeElement != searchElement) {
    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft') {
      return;
    }
    searchElement.focus();
    searchElement.value = '';
    if (event.key.length == 1) {
      searchElement.value = event.key;
    }
  }
};

const newTabInContainer = function (cookieStoreId) {
  browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT }).then(tabs => {
    if (tabs.length > 0) {
      browser.tabs.create({ cookieStoreId: cookieStoreId, active: true, openerTabId: tabs[0].id }).then(
        _ => window.close(),
        e => console.error('error creating new tab: ', e));
    } else {
      console.error("did not find any active tab in window with id: ", browser.windows.WINDOW_ID_CURRENT);
    }
  }, e => console.error('error getting current tab: ', e));
};

const toggleExpandTabContainer = function (cookieStoreId) {
  const tabContainer = $1(`ul#${cookieStoreId}`);
  if (tabContainer.dataset.expanded == "true") {
    {
      const e = $1('.arrow-down', tabContainer);
      if (e) { e.className = 'arrow-right'; }
    }
    for (const element of $(`ul#${cookieStoreId} li.tab`)) {
      element.style.display = 'none';
    }
    tabContainer.dataset.expanded = 'false';
  } else {
    {
      const e = $1('.arrow-right', tabContainer);
      if (e) { e.className = 'arrow-down'; }
    }
    for (const element of $(`ul#${cookieStoreId} li.tab`)) {
      const thumbnailElement = $1('.image', element);
      if (thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
        setBgImage(thumbnailElement, element.dataset.url);
      }
      element.style.display = element.dataset.match == 'true' ? '' : 'none';
    }
    tabContainer.dataset.expanded = 'true';
  }

}

document.body.addEventListener('keypress', keyPressHandling);
document.body.addEventListener('keydown', keyDownHandling);

const removeTab = function (element) {
  element.style.opacity = deletedTabOpacity;
  element.tabIndex = -1;
  bg.closeTab(element.dataset.tabId);
  updateTabCount();
}

const insertTabElements = function (tabContainers) {
  for (tabContainer in tabContainers) {
    const ul = $1(`#${tabContainer}`);
    if (!ul) {
      console.error(`couldn't find tab container with id ${tabContainer} -- closing all tabs from this container`);
      for (const element of tabContainers[tabContainer]) {
        console.debug(`  closing tab from non-existing container: ${element.dataset.url}`);
        bg.closeTab(element.dataset.tabId);
      }
      continue;
    }

    let cnt = 0;
    for (const element of tabContainers[tabContainer]) {
      element.addEventListener('click', _ => {
        bg.activateTab(element.dataset.tabId);
        window.close();
      });

      $1('.close-button', element).addEventListener('click', function (event) {
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

const tabIsDeleted = function (e) {
  return e.style.opacity == deletedTabOpacity;
}

const updateTabCount = function () {
  console.debug('updating tab count');
  for (const tabContainer of $('#tabcontainers ul')) {
    const tabCnt = Array.from($('li.tab', tabContainer)).filter(e => !tabIsDeleted(e)).length;
    const tabCntElement = $1('.tabs-count', tabContainer);
    tabCntElement.removeChild(tabCntElement.firstChild);
    tabCntElement.appendChild(document.createTextNode(`${tabCnt} tabs`));
    $1('.name', tabContainer).title = `change to this container (${tabCnt} tabs)`;
    $1('.confirmation-tabs-count', tabContainer).innerHTML = tabContainer.id == 'firefox-default' ? `Are you sure you want to close all <b><em>${tabCnt} tabs in the default container</em></b> ?` : `If you remove this container now, <b><em>${tabCnt} tabs will be closed</em></b>. Are you sure you want to remove this container?`;

    // hide private browsing tabs section if we don't have any private tabs open
    if (tabCnt == 0 && tabContainer.id == "firefox-private") {
      tabContainer.remove();
    }
  }
}

const resetPopup = function () {
  { const history = $1('#history ul'); if (history) { history.remove() } }
  { const bookmarks = $1('#bookmarks ul'); if (bookmarks) { bookmarks.remove(); } }
  for (ul of $('#tabcontainers ul')) {
    ul.style.display = '';

    {
      const arrowDown = $1('.arrow-down', ul);
      if (arrowDown) {
        arrowDown.className = 'arrow-right';
      }
    }
  }

  for (li of $('#tabcontainers li.tab')) {
    li.style.display = 'none';
  }
};

const renderResults = function (results, parent) {
  const tabLinks = Array.from($('.tab')).map(t => t.dataset.url.toLowerCase());

  {
    const arrowRight = $1('.arrow-right', parent);
    if (arrowRight) {
      arrowRight.className = 'arrow-down';
    }
  }

  results
    .sort((a, b) => b.visitCount - a.visitCount)
    .filter(e => e.url && !tabLinks.includes(cleanUrl(e.url)))
    .forEach(searchResult => {
      const element = createHistoryOrBookmarkElement(searchResult);
      const thumbnailElement = $1('.image', element);
      if (thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
        setBgImage(thumbnailElement, element.dataset.url);
      }
      parent.appendChild(element);
    });
}

const fillBookmarksSection = function (searchQuery) {
  const bookmarks = $1('#bookmarks');
  if (bookmarks.children.length > 0) { return; }

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

const fillHistorySection = function (searchQuery) {
  const history = $1('#history');
  if (history.children.length > 0) { $1('ul', history).remove(); }
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

const setBgImage = async function (element, url) {
  await readSettings;
  if (settings['create-thumbnail']) {
    const cleanedUrl = cleanUrl(url);

    element.dataset.bgSet = 'true';
    const cachedThumbnails = await browser.storage.local.get(cleanedUrl);
    if (cachedThumbnails[cleanedUrl] && cachedThumbnails[cleanedUrl].thumbnail) {
      element.style.background = "url(" + cachedThumbnails[cleanedUrl].thumbnail + ")";
    }
  }
}

const showHideTabEntries = function (searchQuery) {
  for (element of $('.tab')) {
    const text = (element.dataset.title + cleanUrl(element.dataset.url)).toLowerCase();

    if (text) {
      // if the search query consists of multiple words, check if ALL words match -- regardless of the order
      const match = searchQuery.split(' ').every(q => {
        return text.indexOf(q) >= 0
      });

      if (match) {
        const thumbnailElement = $1('.image', element);
        if (thumbnailElement && thumbnailElement.dataset.bgSet == 'false') {
          setBgImage(thumbnailElement, element.dataset.url);
        }
      }
      element.style.display = match ? '' : 'none';
      element.dataset.match = match;
    }
  }
};

const showHideTabContainerHeader = function (searchQuery) {
  for (ul of $('ul')) {
    const tabContainerHeader = ul.querySelector('li.section');
    const text = $1('.name', tabContainerHeader).innerText.toLowerCase();

    // if the search query consists of multiple words, check if ALL words match -- regardless of the order
    const match = searchQuery.split(' ').every(q => {
      return text.indexOf(q) >= 0
    });

    if (match) { // don't hide header if it matches the current search
      ul.style.display = '';
      tabContainerHeader.dataset.match = 'true';
    } else {
      ul.dataset.expanded = 'true';

      {
        const arrowDown = $1('.arrow-right', tabContainerHeader);
        if (arrowDown) {
          arrowDown.className = 'arrow-down';
        }
      }

      // hide sections that don't have tabs that match the search
      if (Array.from(ul.querySelectorAll('li.tab')).filter(li => li.style.display != 'none') == 0) {
        ul.style.display = 'none';
        tabContainerHeader.dataset.match = 'false';
      } else {
        ul.style.display = '';
        tabContainerHeader.dataset.match = 'true';
      }
    }
  }
};

const onSearchChange = function (event) {
  let searchQuery = "";
  if (event.type == "paste") {
    searchQuery = event.clipboardData.getData("text").toLowerCase();
  } else {
    searchQuery = event.target.value.toLowerCase();
  }

  if (searchQuery == '') {
    return resetPopup();
  }

  showHideTabEntries(searchQuery);
  showHideTabContainerHeader(searchQuery);

  if (settings["search-history"]) {
    fillHistorySection(searchQuery);
  }

  if (settings["search-bookmarks"]) {
    fillBookmarksSection(searchQuery);
  }
};

const createNewContainer = function () {
  const name = $1('#new-container-name').value;
  const color = $1('#color').options[$1('#color').options.selectedIndex].className;

  if (name == "") {
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
};

const setupNewContainerElement = async function () {
  $1('#color').addEventListener('change', e => {
    $1('#color').className = e.target.options[e.target.options.selectedIndex].className;
  });
  $1('#color').options.selectedIndex = 0;
  $1('#color').className = $1('#color').options[0].className;
  $1('#new-container-form').addEventListener('submit', e => {
    createNewContainer();
  });
};

const deleteContainer = (cookieStoreId, name) => {
  browser.contextualIdentities.remove(cookieStoreId);
  window.close();
};

const setupSectionListeners = function () {
  for (const section of $('.section')) {
    $1('.icon', section).addEventListener('click', _ => {
      toggleExpandTabContainer(section.dataset.cookieStore);
    });

    $1('.new-tab-button', section).addEventListener('click', _ => {
      newTabInContainer(section.dataset.cookieStore);
    });

    const deleteContainerHandler = function (e, force) {
      const cookieStoreId = e.target.dataset.cookieStore;
      const name = e.target.dataset.name;
      browser.tabs.query({ cookieStoreId: cookieStoreId }).then(tabs => {
        if (tabs.length > 0 && !force) {
          e.target.parentElement.classList.add('confirming');
        } else if (tabs.length > 0 && force) {
          deleteContainerWithTabs(e.target.parentElement.dataset);
        } else {
          deleteContainer(cookieStoreId, name);
        }
      });
    };

    $1('.delete-container-button', section).addEventListener('click', e => {
      deleteContainerHandler(e, false);
    });

    $1('.delete-container-button', section).addEventListener('dblclick', e => {
      deleteContainerHandler(e, true);
    });

    $1('.no', section).addEventListener('click', e => {
      e.target.parentElement.parentElement.classList.remove('confirming');
    });

    const deleteContainerWithTabs = async function (dataset) {
      const cookieStoreId = dataset.cookieStore;
      const containerTabs = await browser.tabs.query({ cookieStoreId: cookieStoreId });
      await browser.tabs.remove(containerTabs.map(x => x.id));
      deleteContainer(cookieStoreId, dataset.name);
    }

    $1('.yes', section).addEventListener('click', e => {
      deleteContainerWithTabs(e.target.parentElement.parentElement.dataset);
    });

    $1('.name', section).addEventListener('click', _ => {
      bg.switchToContainer(section.dataset.cookieStore);
      window.close();
    });
  }
};

const showNewContainerUi = function () {
  $1('body').className = 'new-container';
  $1('#new-container-name').focus();
};

const startTime = Date.now();
tabContainerRendering.then(newContainerMode => {
  if (newContainerMode) {
    showNewContainerUi();
  }

  setupSectionListeners();

  containersTabsMapCreating.then(containerTabs => {
    insertTabElements(containerTabs);
  }, e => console.error(e));

  $1('#new-container-form').addEventListener('keypress', e => {
    if (e.key == 'Enter') {
      createNewContainer();
    }
  });

  $1('#search').addEventListener('keyup', onSearchChange);
  $1('#search').addEventListener('paste', onSearchChange);
  console.debug("rendering time: ", Date.now() - startTime);
  const mouseMoveListener = function () {
    try { $1('body').removeEventListener('mousemove', mouseMoveListener); } catch (e) { console.error(e); };
  }
  $1('body').addEventListener('mousemove', mouseMoveListener);

  $1('#new-container-button').addEventListener('click', showNewContainerUi);

  setupNewContainerElement();

}, e => console.error(e));

const checkForDarkTheme = async function () {
  await readSettings;
  if (settings["use-system-theme"]) {
    if (window.matchMedia && !!window.matchMedia('(prefers-color-scheme: dark)').matches) {
      settings["enable-dark-theme"] = true;
    }
    else {
      settings["enable-dark-theme"] = false;
    }
  } else {
    if (settings["enable-dark-theme"]) {
      document.body.setAttribute("theme", "dark");
    } else {
      document.body.setAttribute("theme", "light");
    }
  }
}

checkForDarkTheme();