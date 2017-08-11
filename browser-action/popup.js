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
    $1('#search').value = event.key;
    //document.dispatchEvent(event);
  }
}

document.body.addEventListener("keypress", keyHandling);

function renderTabGroups() {
	return new Promise((resolve, _) => {
		let getContexts = browser.contextualIdentities.query({});
		getContexts.then(contexts => {
			for(let i in contexts) {
				$1('#tabgroups').appendChild(
						$e('ul', {id: contexts[i].cookieStoreId},[
							$e('li', {tabindex: 1, class: 'section'}, [
								$e('div', {}, [
									$e('span', {class: 'circle circle-'+contexts[i].color, content: ' '}),
									$e('span', {content: contexts[i].name}),
								])
							])
						])
						);
			}
		});
		resolve({});
	});
}

function getTabsByGroup() {
	return new Promise((resolve, _) => {
		let elements = new Map();
		browser.tabs.query({}).then(tabs => {
			let tabUrls = tabs.map(tab => tab.url);
			let items = browser.storage.local.get(tabUrls);
			items.then(items => {
				tabs.forEach(function(tab) {
          let backroundImg = tab.favIconUrl;
					if(items[tab.url]) {
            backroundImg = items[tab.url].thumbnail;
						let url = tab.url.replace("http://", "").replace("https://", "");
						let searchTerm = tab.title+" "+url;
						let thumbnail = $e('li', {tabindex: 1, data_search_terms: searchTerm.toLowerCase(), data_tab_id: tab.id, class: 'thumbnail'} ,[
							$e('div', {}, [
								$e('div', {class: 'image', style: `background:url('${backroundImg}')`}),
								$e('img', {src: tab.favIconUrl})
							]),
							$e('div', {class: 'text'}, [
								$e('div', {class: 'tab-title', content: tab.title}),
								$e('div', {class: 'tab-url', content: url})
							])
						]);

						if(elements[tab.cookieStoreId]) {
							elements[tab.cookieStoreId].push(thumbnail);
						} else {
							elements[tab.cookieStoreId] = [thumbnail];
						}
					}
				});
			});
		});
		console.log(elements);
		resolve(elements);
	});
}

let tabGroups = renderTabGroups();
let tabs = getTabsByGroup();

tabGroups.then(_ => {
	console.log("tab groups loaded");
	document.addEventListener("load", function(event) {
	console.log("tab groups loaded");
		tabs.then(elements => {
			console.log('yy');
			console.log(document.querySelectorAll('body'));
			console.log(document.querySelector('#tabgroups'));
			console.log($1('#tabgroups').querySelectorAll('ul'));
			$('#tabgroups ul').forEach(function(ul) {
				console.log(ul);
				console.log(ul.id);
				elements[key].forEach(function(element) {
					console.log(element);
				});
			});
			//ul.appendChild(elements[key][i]);
		});
	});
});

//bg.getImageTags().then(src => {
//  document.getElementById('list').innerHTML = src;
//  Array.from(document.getElementsByClassName("thumbnail")).forEach(function(element) {
//    element.addEventListener("click", function(_) {
//      bg.activateTab(element.dataset.tabId);
//      window.close();
//    });
//  });
//  //document.getElementById('search').focus();
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
//    });
//  });
//});
