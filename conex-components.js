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

function createHeaderElement(value) {
  return $e('h2', {content: 're-store tab in'});
}

function createTabContainerHeaderElement(id, color, name, tabindex, icon) {
  const elment =
    $e('ul', {id: id}, [
        $e('li', {tabindex: tabindex || 1, class: 'section', data_cookie_store: id, title: 'enter: to expand\nctrl-enter: switch to container\nctrl-shift-enter: new tab in container'}, [
          $e('div', {class: 'summary'}, [
            $e('span', {class: `circle circle-${color}`, content: icon || ' '}),
            $e('span', {content: name}),
            $e('span', {content: '', class: 'tabs-count'}),
          ]),
        ])
    ]);

  return elment;
}

function createTabElement(tab, isBookmarkUrl) {
  if(!tab.id || tab.id == browser.tabs.TAB_ID_NONE) {
    return;
  }

  return renderEntry(tab.url ? cleanUrl(tab.url) : '',
    tab.title ? tab.title : '',
    tab.id,
    tab.favIconUrl,
    isBookmarkUrl);
}

function createHistoryOrBookmarkElement(historyItem) {
  const favIconUrl = (new URL(historyItem.url)).protocol + '//' + (new URL(historyItem.url)).host + '/favicon.ico';
  const element = renderEntry(historyItem.url.toLowerCase(), historyItem.title.toLowerCase(), 0, favIconUrl);
  element.style.display = "";

  element.addEventListener('click', () => renderRestoreMenu(element));

  return element;
}

const renderEntry = function(url, title, id, favIconUrl, drawBookmarkIcon) {
  const isHistoryOrBookmark = (id == 0);
  const defaultFavIconUrl = './favicon.ico';
  const elClass = drawBookmarkIcon ? 'tab is-bookmark' : 'tab';
  const searchTerm = '${title} ${url}';

  const tooltip = isHistoryOrBookmark ? 'enter: re-open tab' : 'enter: jump to tab\nbackspace: close tab';

  const element =
    $e('li', {tabindex: 1, class: elClass, data_title: title.toLowerCase(), data_url: url.toLowerCase(), data_tab_id: id,
              style: 'display:none', title: tooltip } ,[
      $e('div', {}, [
        $e('div', {class: 'image', data_bg_set: 'false', style: `background:url('${defaultFavIconUrl}')`}, [
          $e('img', {src: defaultFavIconUrl})
        ]),
        $e('div', {class: 'text'}, [
          $e('div', {class: 'tab-title', content: title}),
          $e('div', {class: 'tab-url', content: url})
        ]),
        $e('div', {class: 'close', style: isHistoryOrBookmark ? 'display: none' : ''}, [
          $e('span', {content: '╳', title: 'close this tab', class: 'close-button', data_tab_id: id}),
          $e('span', {content: '★', title: 'this tab is a bookmark', class: 'bookmark-marker', data_tab_id: id})
        ])
      ]),
    ]);

  fetch(favIconUrl, { method: "GET", }).then(function(res) {
    if (res.ok) {
      $1('img', element).src = favIconUrl;
    } else {
      //console.log(`error fetching favicon for ${favIconUrl} -- response was`, res);
    }
  }, e => console.log(`error fetching ${favIconUrl}: ${e}`));

  return element;
}

