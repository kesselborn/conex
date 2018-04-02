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
  return $e('h2', {content: value});
}

function createTabContainerHeaderElement(id, color, name, tabindex, icon, containsAudibleTab) {
  let iconElement = $e('span', {class: 'icon', title: 'expand container list'}, [$e('span', {class: 'arrow-right'})]);
  if(color == "bookmarks" || color == "history") {
    iconElement = $e('span', {class: 'icon'}, [$e('span', { class: `icon-${color}`, content: icon || ' ' })]);
  }
  const tooltip = id == 'firefox-default' ? 'close all tabs' : 'delete this container';

  const elment =
    $e('ul', {id: id, class: color}, [
        $e('li', {tabindex: tabindex || 1, class: 'section', data_match: 'true', data_name: name, data_cookie_store: id, title: 'enter: to expand\nctrl-enter: switch to container\nctrl-shift-enter: new tab in container'}, [
          $e('div', {class: 'delete-container-confirmation'}, [
            $e('span', {class: 'confirmation-tabs-count'}),
            $e('span', {content: 'yes', class: 'yes', title: 'yes, delete container on all its tabs'}),
            $e('span', {content: 'no', class: 'no', title: "abort mission -- abort mission!"}),
          ]),
          iconElement,
          $e('span', { class: 'name', title: 'change to this container (x tabs)', content: name }),
          $e('img',  { class: `audible-${containsAudibleTab}`, src: 'icons/loudspeaker.svg'}),
          $e('span', { class: 'tabs-count', content: '(x tabs)'}),
          $e('span', { class: 'toolbar new-tab-button', title: 'open new tab in this container', content: '+'}),
          $e('span', { class: 'toolbar delete-container-button', data_name: name, data_cookie_store: id, title: tooltip, content: 'x'})
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
    isBookmarkUrl,
    tab.audible
  );
}

function createHistoryOrBookmarkElement(historyItem) {
  const favIconUrl = (new URL(historyItem.url)).protocol + '//' + (new URL(historyItem.url)).host + '/favicon.ico';
  const element = renderEntry(historyItem.url, historyItem.title.toLowerCase(), 0, favIconUrl);
  element.style.display = "";

  element.addEventListener('click', _ => {
      bg.openContainerSelector(element.dataset.url, element.dataset.title);
      window.close();
    }
  );

  return element;
}

const renderEntry = function(url, title, id, favIconUrl, drawBookmarkIcon, drawAudibleIcon) {
  const isHistoryOrBookmark = (id == 0);
  const defaultFavIconUrl = './favicon.ico';
  const elClass = drawBookmarkIcon ? 'tab is-bookmark' : 'tab';
  const searchTerm = '${title} ${url.toLowerCase()}';

  const tooltip = isHistoryOrBookmark ? 'enter: re-open tab' : 'enter: jump to tab\nbackspace: close tab';

  let thumbnailElement = $e('span');
  if(bg.settings['show-favicons']) {
    thumbnailElement = $e('img', { src: defaultFavIconUrl, class: 'no-thumbnail' });
  }
  if(bg.settings['create-thumbnail']) {
    thumbnailElement = $e('div', { class: 'image', data_bg_set: 'false', style: `background:url('${defaultFavIconUrl}')` }, [
      $e('img', { src: defaultFavIconUrl })
    ]);
  }

  const element =
    $e('li', {tabindex: 1, class: elClass, data_match: 'true', data_title: title.toLowerCase(), data_url: url, data_tab_id: id,
              style: 'display:none', title: tooltip } ,[
      $e('div', {}, [
        thumbnailElement,
        $e('div', {class: 'text'}, [
          $e('div', {class: 'tab-title', content: title}),
          $e('div', {class: 'tab-url', content: url})
        ]),
        $e('div', {class: 'close', style: isHistoryOrBookmark ? 'display: none' : ''}, [
          $e('span', {content: '★', title: 'this tab is a bookmark', class: 'bookmark-marker', data_tab_id: id}),
          $e('span', {content: '╳', title: 'close this tab', class: 'close-button', data_tab_id: id}),
          $e('img', {src: 'icons/loudspeaker.svg', title: 'this tab is playing audio', class: `audible-${drawAudibleIcon}`}),
        ])
      ]),
    ]);

  if (bg.settings['show-favicons'] && favIconUrl && favIconUrl.startsWith('http')) {
    fetch(favIconUrl, { method: "GET", }).then(res => {
      if (res.ok) {
        $1('img', element).src = favIconUrl;
      } else {
        console.error(`error fetching favicon for ${favIconUrl} -- response was`, res);
      }
    }, e => console.error(`error fetching ${favIconUrl}: ${e}`));
  }

  return element;
}

