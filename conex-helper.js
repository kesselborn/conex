// alias for document.querySelectorAll
const $ = function(s, parent){ return (parent || document).querySelectorAll(s); };

// alias for document.querySelector
const $1 = function(s, parent){ return (parent || document).querySelector(s); };

const cleanUrl = function(url) {
  return url.replace('http://','').replace('https://','').toLowerCase();
};

var settings = {};

function _refreshSettings() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get([
      'conex/settings/create-thumbnail',
      'conex/settings/experimental-features',
      'conex/settings/hide-tabs',
      'conex/settings/search-bookmarks',
      'conex/settings/search-history',
      'conex/settings/settings-version',
      'conex/settings/show-container-selector',
      'conex/settings/show-favicons',
      'conex/settings/close-reopened-tabs',
    ]).then(localSettings => {
      for (const key in localSettings) {
        // conex/settings/create-thumbnail -> create-thumbnail
        const id = key.split('/')[key.split('/').length - 1];
        settings[id] = localSettings[key];
      }
      console.info('settings: ', settings);
      resolve();
    }, e => console.error(e));
  });
}

let readSettings = _refreshSettings();
