// alias for document.querySelectorAll
export const $ = function(s, parent){ return (parent || document).querySelectorAll(s); };

// alias for document.querySelector
export const $1 = function(s, parent){ return (parent || document).querySelector(s); };

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
export const $e = function(name, attributes, children) {
  const e = window.document.createElement(name);
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

// const cleanUrl = function(url) {
//   return url.replace('http://','').replace('https://','').toLowerCase();
// };
// 
// var settings = {};
// 
// function _refreshSettings() {
//   return new Promise((resolve, reject) => {
//     browser.storage.local.get([
//       'conex/settings/create-thumbnail',
//       'conex/settings/experimental-features',
//       'conex/settings/hide-tabs',
//       'conex/settings/search-bookmarks',
//       'conex/settings/search-history',
//       'conex/settings/settings-version',
//       'conex/settings/show-container-selector',
//       'conex/settings/show-favicons',
//       'conex/settings/close-reopened-tabs',
//     ]).then(localSettings => {
//       for (const key in localSettings) {
//         // conex/settings/create-thumbnail -> create-thumbnail
//         const id = key.split('/')[key.split('/').length - 1];
//         settings[id] = localSettings[key];
//       }
//       console.info('settings: ', settings);
//       resolve();
//     }, e => console.error(e));
//   });
// }
// 
// let readSettings = _refreshSettings();
