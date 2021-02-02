// todo: make debugging a setting
// eslint-disable-next-line no-empty-function
// console.origDebug = console.debug;
// console.debug = () => {};

export const placeholderImage = browser.runtime.getURL("transparent.png");
export const placeholderFailedImage = browser.runtime.getURL("transparent-failed.png");

// alias for document.querySelectorAll
export const $$ = (s, parent) => (parent || window.document).querySelectorAll(s);

// alias for document.querySelector
export const $ = (s, parent) => (parent || window.document).querySelector(s);

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
export const $e = (name, attributes, children) => {
  const e = window.document.createElement(name);

  for (const key in attributes) {
    if (key === "content") {
      e.appendChild(window.document.createTextNode(attributes[key]));
    } else {
      e.setAttribute(key.replace(/_/ug, "-"), attributes[key]);
    }
  }

  for (const child of children || []) {
    e.appendChild(child);
  }

  return e;
};

export const _ = browser.i18n.getMessage;

export const getConexDom = backgroundPage => () => {
  const startupLoop = setInterval(() => {
    if (backgroundPage.initializingConex) {
      backgroundPage.initializingConex.then(
        getDomTree => {
          window.getThumbnail = backgroundPage.window.getThumbnail;
          window.settings = backgroundPage.window.settings;
          document.body.firstElementChild.replaceWith(getDomTree());
        },
        e => console.error(e)
      );
      clearInterval(startupLoop);
    } else {
      console.debug("waiting for background page to be initialized");
    }
  }, 100);
};


// const cleanUrl = url => {
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

export const debounce = (func, wait, immediate) => {
  let timeout = null;
  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) {
        Reflect.apply(func, null, args);
      }
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait || 200);

    if (callNow) {
      Reflect.apply(func, null, args);
    }
  };
};
