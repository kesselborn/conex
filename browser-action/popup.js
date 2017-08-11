var bg = browser.extension.getBackgroundPage();

let $ = function(s){ return document.querySelectorAll(s); };
let $1 = function(s){ return document.querySelector(s); };
let $e = function(name, attributes, children) {
  let e = document.createElement(name);
  for(let key in attributes) {
    if(key == 'content') {
      e.appendChild(document.createTextNode(attributes[key]));
      continue;
    }
    e.setAttribute(key.replace(/_/g, '-'), attributes[key]);
  }

  for(let i in children) {
    e.appendChild(children[i]);
  }

  return e;
};

function keyHandling(event) {
  let searchElement = $1('#search');
  if(event.key == "Enter") {
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
    return false;
  } else if(event.key == "Tab") {
  } else if(document.activeElement != searchElement) {
    $1('#search').focus();
    $1('#search').value = "";
    if(event.key.match(/[A-Za-z0-1-_\/:]/)) {
      $1('#search').value = event.key;
    }
  }
}

document.body.addEventListener("keypress", keyHandling);

function sectionElement(id, color, name) {
  return $e('ul', {id: id},[
      $e('li', {tabindex: 1, class: 'section', data_cookie_store: id}, [
        $e('div', {}, [
          $e('span', {class: 'circle circle-'+color, content: ' '}),
          $e('span', {content: name}),
        ])
      ])
  ]);
}

function makeHistoryItem(searchItem) {
  element = $e('li', {tabindex: 1, class: 'thumbnail', data_url: searchItem.url}, [
      $e('div', {}, [
        $e('div', {class: 'text'}, [
          $e('div', {class: 'tab-title', content: searchItem.title}),
          $e('div', {class: 'tab-url', content: searchItem.url.replace('http://','').replace('https://','')})
        ])
      ])
  ]);
  element.addEventListener('click', _ => bg.newTabInCurrentContainerGroup(searchItem.url));

  return element;
}

function renderTabGroups() {
  return new Promise((resolve, _) => {
    let getContexts = browser.contextualIdentities.query({});
    getContexts.then(contexts => {
      for(let i in contexts) {
        $1('#tabgroups').appendChild(sectionElement(contexts[i].cookieStoreId, contexts[i].color, contexts[i].name));
      }
      $1('#tabgroups').appendChild(sectionElement('firefox-default', 'none', 'default'));
    }, e => console.error(e));
    resolve({});
  });
}

let tabs = bg.getTabsByGroup();
let tabGroups = renderTabGroups();


setTimeout(function(){
  document.getElementById('search').focus();
  tabGroups.then(_ => {
    tabs.then(elements => {
      for(tabGroup in elements) {
        let ul = $1('#'+tabGroup);
        elements[tabGroup].forEach(function(element) {
          element.addEventListener("click", function() {
            bg.activateTab(element.dataset.tabId);
            window.close();
          });
          ul.appendChild(element);
        });
      }
    });


    // filter results
    document.querySelector('#search').addEventListener("keyup", function(event) {
      if(event.target.value != "") {
        Array.from(document.querySelectorAll('.thumbnail')).forEach(function(element) {
          let searchTerms = element.dataset.searchTerms;
          if(searchTerms) {
            let matchesSearchTerms = event.target.value.split(" ").every(searchTerm => {
              return searchTerms.indexOf(searchTerm.toLowerCase()) >= 0
            });
            element.style.display = matchesSearchTerms ? "" : "none";
          }
        });

        Array.from($('#tabgroups ul')).forEach(ul => {
          ul.querySelector('li.section').tabIndex = -1; // section should not be selectable when we have search results

          // hide sections that don't have tabs that match the search
          if(Array.from(ul.querySelectorAll('li.thumbnail')).filter(li => li.style.display != "none") == 0) {
            ul.style.display = "none";
          } else {
            ul.style.display = "";
          }
        });

        document.getElementById('history').innerHTML = "";
        let historyUl = document.getElementById('history');
        let historySection = sectionElement('', 'none', 'history');
        historySection.tabIndex = -1;
        historyUl.appendChild(historySection);
        console.log('34', historyUl);
        var searching = browser.history.search({
          text: event.target.value,
          startTime: 0
        }).then(result => {
          let historyTags = result
            .sort(function(a,b) { return b.visitCount - a.visitCount; })
            .slice(0,10)
            .forEach(searchResult => historyUl.appendChild(makeHistoryItem(searchResult)));
        }, e => console.error(e));
      } else {
        document.getElementById('history').innerHTML = "";
        Array.from($('#tabgroups ul')).forEach(ul => {
          ul.style.display = "";
          ul.querySelector('li.section').tabIndex = 1;
        });
        Array.from($('#tabgroups li.thumbnail')).forEach(li => li.style.display = "none" )
      }
    });
  }, e => console.error(e));
},200);

//bg.getImageTags().then(src => {
//  setTimeout(() => {
//      document.getElementById('search').focus();
//  }, 100);
//
//  document.querySelector('#search').addEventListener("keyup", function(event) {
//    if(event.key != "ArrowUp" && event.key != "ArrowDown") {
//      currentSelection = document.querySelector('.selected');
//      currentSelection && currentSelection.classList.remove('selected');
//    }
//    Array.from(document.querySelectorAll('.thumbnail')).forEach(function(element) {
//      let searchTerms = element.dataset.searchTerms;
//      if(searchTerms) {
//        let matchesSearchTerms = event.target.value.split(" ").every(function(searchTerm) {
//          return searchTerms.indexOf(searchTerm.toLowerCase()) >= 0
//        });
//        element.style.display = matchesSearchTerms ? "block" : "none";
//      }
//    });
//
//  });
//}, e => console.error(e));
