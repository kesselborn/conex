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
        browser.tabs.create({cookieStoreId: cookieStoreId})
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

document.body.addEventListener('keypress', keyHandling);

const addTabGroupSections = function(tabGroups) {
  for(tabGroup in tabGroups) {
    let ul = $1(`#${tabGroup}`);
    for(const element of tabGroups[tabGroup]) {
      element.addEventListener('click', function() {
        bg.activateTab(element.dataset.tabId);
        window.close();
      });
      ul.appendChild(element);
    }
  }
};

const resetSearch = function() {
  document.getElementById('history').innerHTML = '';
  for(ul of $('#tabgroups ul')) {
    ul.style.display = '';
    ul.querySelector('li.section').tabIndex = 1;
  }

  for(li of $('#tabgroups li.thumbnail')) {
    li.style.display = 'none';
  }
};

const fillHistorySection = function(searchQuery) {
  const historyUl = $1('#history');

  historyUl.innerHTML = '';
  historyUl.appendChild(createTabGroupElement('', 'none', 'history', -1));

  browser.history.search({
    text: searchQuery,
    startTime: 0
  }).then(result => {
    const tabLinks = Array.from($('.thumbnail')).map(t => t.dataset.url.toLowerCase());

    result
      .sort((a,b) => b.visitCount - a.visitCount)
      .filter(e => ! tabLinks.includes(e.url.replace('http://','').replace('https://','').toLowerCase()))
      .forEach(searchResult => historyUl.appendChild(createHistoryElement(searchResult)));
  }, e => console.error(e));
};

const showHideTabEntries = function(searchQuery) {
  for(element of $('.thumbnail')) {
    const text = (element.dataset.title + element.dataset.url.replace('http://','').replace('https://')).toLowerCase();
    if(text) {
      // if the search query consists of multiple work, we search for a match of any of the words
      const match = searchQuery.split(' ').every(q => {
        return text.indexOf(q) >= 0
      });
      element.style.display = match ? '' : 'none';
    }
  }
};

const showHideGroupEntries = function(searchQuery) {
  for(ul of $('#tabgroups ul')) {
    ul.querySelector('li.section').tabIndex = -1; // section should not be selectable when we have search results

    // hide sections that don't have tabs that match the search
    if(Array.from(ul.querySelectorAll('li.thumbnail')).filter(li => li.style.display != 'none') == 0) {
      ul.style.display = 'none';
    } else {
      ul.style.display = '';
    }
  }
};

const onSearchChange = function(event) {
  const searchQuery = event.target.value.toLowerCase();
  if(searchQuery == '') {
    return resetSearch();
  }

  showHideTabEntries(searchQuery);
  showHideGroupEntries(searchQuery);

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
    groupsTabsMapCreating.then(addTabGroupSections);
    document.querySelector('#search').addEventListener('keyup', onSearchChange);
  }, e => console.error(e));
},400);

