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

function sectionElement(id, color, name, tabindex) {
  return $e('ul', {id: id},[
      $e('li', {tabindex: tabindex || 1, class: 'section', data_cookie_store: id}, [
        $e('div', {}, [
          $e('span', {class: 'circle circle-'+color, content: ' '}),
          $e('span', {content: name}),
        ])
      ])
  ]);
}

function makeHistoryItem(searchItem) {
  let openMenu = Array.from(contexts).map(c => $('div', {content: c.cookieStoreId}));
  console.log(openMenu.length);
  element = $e('li', {tabindex: 1, class: 'thumbnail', data_title: searchItem.title.toLowerCase(), data_url: searchItem.url.toLowerCase()}, [
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

let contexts = undefined;
function renderTabGroups() {
  return new Promise((resolve, _) => {
    let getContexts = browser.contextualIdentities.query({});
    getContexts.then(_contexts => {
      contexts = _contexts;
      for(let i in contexts) {
        $1('#tabgroups').appendChild(sectionElement(contexts[i].cookieStoreId, contexts[i].color, contexts[i].name));
      }
      $1('#tabgroups').appendChild(sectionElement('firefox-default', 'none', 'default'));
    }, e => console.error(e));
    resolve({});
  });
}

