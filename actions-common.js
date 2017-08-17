// get handle to background page
const bg = browser.extension.getBackgroundPage();

// creates a section element
const sectionElement = function(id, color, name, tabindex) {
  return $e('ul', {id: id},[
           $e('li', {tabindex: tabindex || 1, class: 'section', data_cookie_store: id}, [
             $e('div', {}, [
               $e('span', {class: `circle circle-${color}`, content: ' '}),
               $e('span', {content: name}),
             ])
           ])
         ]);
}

const makeHistoryItem = function(historyItem) {
  const element =
    $e('li', {tabindex: 1, class: 'thumbnail', data_title: historyItem.title.toLowerCase(), data_url: historyItem.url.toLowerCase()}, [
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

const renderTabGroups = function() {
  const tabGroups = $1('#tabgroups');
  return new Promise((resolve, reject) => {
    browser.contextualIdentities.query({}).then(contexts => {
      for(const context of contexts.concat({cookieStoreId: 'firefox-default', color: 'none', name: 'default'})) {
        tabGroups.appendChild(sectionElement(context.cookieStoreId, context.color, context.name));
      }
    }, e => reject(e));
    resolve({});
  });
}

