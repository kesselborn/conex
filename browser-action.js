const deletedTabOpacity = 0.3;
const groupsTabsMapCreating = bg.getTabsByGroup();
const tabGroupRendering = renderTabGroups();

const keyHandling = function(event) {
  const searchElement = $1('#search');

  if(event.key == 'Enter') {
    try {
      if(tabId = document.activeElement.dataset.tabId) {
        bg.activateTab(tabId);
      } else if(url = document.activeElement.dataset.url) {
        bg.newTabInCurrentContainerGroup(url);
      } else if(cookieStoreId = document.activeElement.dataset.cookieStore) {
        expandTabGroup(cookieStoreId);
        return;
      } else {
        console.error('unhandled active element:', document.activeElement);
      }
      window.close();
    } catch(e){};
  } else if(event.key == 'Tab') {
  } else if(document.activeElement != searchElement) {
    searchElement.focus();
    searchElement.value = '';
    if(event.key.length == 1) {
      searchElement.value = event.key;
    }
  }
};

const expandTabGroup = function(cookieStoreId) {
  resetPopup();
  for(const element of $('li.tab')) {
    element.style.display = 'none';
  }

  const tabGroup = $1(`ul#${cookieStoreId}`);
  if(tabGroup.dataset.expanded != "true") {
    for(const element of $(`ul#${cookieStoreId} li.tab`)) {
      element.style.display = element.style.display == 'none' ? '' : 'none';
    }
    tabGroup.dataset.expanded = true;
  } else {
    tabGroup.dataset.expanded = false;
  }
}

document.body.addEventListener('keypress', keyHandling);

const insertTabElements = function(tabGroups) {
  for(tabGroup in tabGroups) {
    let ul = $1(`#${tabGroup}`);
    for(const element of tabGroups[tabGroup]) {
      element.addEventListener('click', function() {
        bg.activateTab(element.dataset.tabId);
        window.close();
      });

      $1('.close-button', element).addEventListener('click', function(event) {
        event.stopPropagation();
        element.style.opacity = deletedTabOpacity;
        element.tabIndex = -1;
        bg.closeTab(this.dataset.tabId);
        updateTabCount();
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
  for(const tabGroup of $('#tabgroups ul')) {
    const tabCnt = Array.from($('li.tab', tabGroup)).filter(e => !tabIsDeleted(e)).length;
    $1('.tabs-count', tabGroup).innerHTML = `(${tabCnt} tabs)`;
  }
}

const resetPopup = function() {
  document.getElementById('history').innerHTML = '';
  for(ul of $('#tabgroups ul')) {
    ul.style.display = '';
    ul.querySelector('li.section').tabIndex = 1;
  }

  for(li of $('#tabgroups li.tab')) {
    li.style.display = 'none';
  }
};

const fillHistorySection = function(searchQuery) {
  const historyUl = $1('#history');

  historyUl.innerHTML = '';
  historyUl.appendChild(createTabGroupHeaderElement('', 'none', 'history', -1));

  browser.history.search({
    text: searchQuery,
    startTime: 0
  }).then(result => {
    const tabLinks = Array.from($('.tab')).map(t => t.dataset.url.toLowerCase());

    result
      .sort((a,b) => b.visitCount - a.visitCount)
      .filter(e => ! tabLinks.includes(e.url.replace('http://','').replace('https://','').toLowerCase()))
      .forEach(searchResult => historyUl.appendChild(createHistoryElement(searchResult)));
  }, e => console.error(e));
};

const showHideTabEntries = function(searchQuery) {
  for(element of $('.tab')) {
    const text = (element.dataset.title + element.dataset.url.replace('http://','').replace('https://')).toLowerCase();

    if(text) {
      // if the search query consists of multiple words, check if ALL words match -- regardless of the order
      const match = searchQuery.split(' ').every(q => {
        return text.indexOf(q) >= 0
      });
      element.style.display = match ? '' : 'none';
    }
  }
};

const showHideTabGroupHeader = function(searchQuery) {
  for(ul of $('#tabgroups ul')) {
    ul.querySelector('li.section').tabIndex = -1; // section should not be selectable when we have search results

    // hide sections that don't have tabs that match the search
    if(Array.from(ul.querySelectorAll('li.tab')).filter(li => li.style.display != 'none') == 0) {
      ul.style.display = 'none';
    } else {
      ul.style.display = '';
    }
  }
};

const onSearchChange = function(event) {
  const searchQuery = event.target.value.toLowerCase();
  if(searchQuery == '') {
    return resetPopup();
  }

  showHideTabEntries(searchQuery);
  showHideTabGroupHeader(searchQuery);

  if(searchQuery.length > 1 && $('#history ul li').length == 0) {
    console.log('fetching history');
    fillHistorySection(searchQuery);
  } else if(searchQuery.length <= 1) {
    console.log('deleting history');
    $1('#history').innerHTML = '';
  }
};

setTimeout(function(){
  document.getElementById('search').focus();
  tabGroupRendering.then(() => {
    for(const section of $('.section')) {
      section.addEventListener('click', function() { expandTabGroup(section.dataset.cookieStore); });
    }
    groupsTabsMapCreating.then(insertTabElements);
    document.querySelector('#search').addEventListener('keyup', onSearchChange);
  }, e => console.error(e));
},400);

