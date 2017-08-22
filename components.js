const bg = browser.extension.getBackgroundPage();

// creates a dom element, can contain children; attributes contains a map of the elements attributes
// with 'content' being a special attribute representing the text node's content; underscores in
// keys will be changed to dashes
//
// $e('div', {class: 'foo'}, [
//   $e('span', {class: 'bar1', data_foo: 'bar', content: 'baz1'}),
//   $e('span', {class: 'bar2', content: 'baz2y})
// ]);
//
// will produce:
//
// <div class='foo'><span class='bar1' data-foo='bar'>baz1</span><span class='bar2'>baz2</span></div>
//
const $e = function(name, attributes, children) {
  const e = document.createElement(name);
  for(const key in attributes) {
    if(key == 'content') {
      e.appendChild(document.createTextNode(attributes[key]));
    } else {
      e.setAttribute(key.replace(/_/g, '-'), attributes[key]);
    }
  }

  for(const child of children || []) {
    e.appendChild(child);
  }

  return e;
};

function createTabGroupHeaderElement(id, color, name, tabindex) {
  const elment =
    $e('ul', {id: id},[
        $e('li', {tabindex: tabindex || 1, class: 'section', data_cookie_store: id}, [
          $e('div', {class: 'summary'}, [
            $e('span', {class: `circle circle-${color}`, content: ' '}),
            $e('span', {content: name}),
            $e('span', {content: '', class: 'tabs-count'}),
          ]),
        ])
    ]);

  return elment;
}

function createTabElement(tab, backroundImg) {
  const url = tab.url.replace('http://', '').replace('https://', '');
  const searchTerm = "${tab.title} ${url}";

  const element =
    $e('li', {tabindex: 1, class: 'tab', data_title: tab.title.toLowerCase(), data_url: url.toLowerCase(), data_tab_id: tab.id, style: 'display:none'} ,[
        $e('div', {}, [
          $e('div', {class: 'image', style: `background:url('${backroundImg}')`}, [
            (backroundImg == tab.favIconUrl || !tab.favIconUrl) ? $e('span') : $e('img', {src: tab.favIconUrl})
          ]),
          $e('div', {class: 'text'}, [
            $e('div', {class: 'tab-title', content: tab.title}),
            $e('div', {class: 'tab-url', content: url})
          ]),
          $e('div', {class: 'close'}, [
            $e('span', {content: '╳', title: 'close this tab', class: 'close-button', data_tab_id: tab.id})
          ])
        ]),
    ]);

  return element;
}

function createHistoryElement(historyItem) {
  const element =
    $e('li', {tabindex: 1, class: 'tab', data_title: historyItem.title.toLowerCase(), data_url: historyItem.url.toLowerCase()}, [
        $e('div', {}, [
          $e('div', {class: 'text'}, [
            $e('div', {class: 'tab-title', content: historyItem.title}),
            $e('div', {class: 'tab-url', content: historyItem.url.replace('http://','').replace('https://','')})
          ])
        ])
    ]);

  element.addEventListener('click', () => bg.newTabInCurrentContainerGroup(historyItem.url));
  return element;
}

