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
    e.setAttribute(key.replace('_', '-'), attributes[key]);
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
      let tabId = document.activeElement.dataset.tabId;
      bg.activateTab(tabId);
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
      $e('li', {tabindex: 1, class: 'section'}, [
        $e('div', {}, [
          $e('span', {class: 'circle circle-'+color, content: ' '}),
          $e('span', {content: name}),
        ])
      ])
  ]);
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
    } else {
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
//    var searching = browser.history.search({
//      text: event.target.value,
//      maxResults: 50
//    }).then(result => {
//       let historyTags = result
//         .sort(function(a,b) { return b.visitCount - a.visitCount; })
//         .map(x => `<li tabindex='1' class='thumbnail'><div><div class='text'><div class='tab-title'>${x.title}</div><div class='tab-url'>${x.url}</div></div></div></li>`);
//       document.getElementById('history').innerHTML = historyTags.join("");
//    }, e => console.error(e));
//  });
//}, e => console.error(e));
