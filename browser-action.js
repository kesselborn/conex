let tabs = bg.getTabsByGroup();
let tabGroups = renderTabGroups();

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
    if(event.key.length == 1) {
      $1('#search').value = event.key;
    }
  }
}

document.body.addEventListener("keypress", keyHandling);

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
          let searchTerms = element.dataset.title + element.dataset.url.replace('http://','').replace('https://');
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

        // search history for search strings that are longer than one letter
        if(event.target.value.length > 1 && $('#history ul li').length == 0) {
          console.log("fetching history");
          document.getElementById('history').innerHTML = "";
          let historyUl = document.getElementById('history');
          let historySection = sectionElement('', 'none', 'history', -1);
          historyUl.appendChild(historySection);
          var searching = browser.history.search({
            text: event.target.value,
            startTime: 0
          }).then(result => {
            let tabLinks = Array.from($('#tabgroups li')).map(t => t.dataset.url);
            let historyTags = result
              .sort((a,b) => b.visitCount - a.visitCount)
              .filter(e => ! tabLinks.includes(e.url.replace('http://','').replace('https://','').toLowerCase()))
              .forEach(searchResult => historyUl.appendChild(makeHistoryItem(searchResult)));
          }, e => console.error(e));
        } else if(event.target.value.length <= 1) {
          console.log("deleting history");
          document.getElementById('history').innerHTML = "";
        } else {
          console.log("using cached history");
        }
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
},400);

