const filePicker = $1('#file-picker');
const bg = browser.extension.getBackgroundPage();

filePicker.addEventListener('change', picker => {
  const file = picker.target.files[0];

  const reader = new FileReader();
  reader.onload = function (r) {
    try {
      const json = JSON.parse(r.target.result);
      const tabContainers = [];

      const windows = [];
      for (const w of json.windows) {
        const windowTabContainers = {};
        if (w.extData && w.extData['tabview-group']) {
          const windowTabContainersJSON = JSON.parse(w.extData['tabview-group']);

          for (const key in windowTabContainersJSON) {
            if (windowTabContainersJSON[key].title) {
              windowTabContainers[key] = windowTabContainersJSON[key].title;
              tabContainers.push(windowTabContainers[key]);
            }
          }
        }

        const tabs = [];
        for (const tab of w.tabs) {
          if (tab.extData && tab.extData['tabview-tab']) {
            const extData = JSON.parse(tab.extData['tabview-tab']);
            if (extData && extData.groupID && windowTabContainers[Number(extData.groupID)]) {
              tabs.push({ url: tab.entries[tab.entries.length - 1].url, container: windowTabContainers[Number(extData.groupID)] });
            } else {
              tabs.push({ url: tab.entries[tab.entries.length - 1].url, container: null });
            }
          } else {
            tabs.push({ url: tab.entries[tab.entries.length - 1].url, container: null });
          }
        }
        windows.push(tabs);
      }

      bg.restoreTabContainersBackup(tabContainers, windows);

    } catch (e) { console.error(e); }
  };
  reader.readAsText(file);

});

async function fillShortcutFields(field) {
  const commands = await browser.commands.getAll();
  for(command of commands) {
    if(field == undefined || field == command.name) {
      $1('#' + command.name).value = command.shortcut;
    }
  }
}

async function setupShortcutListeners() {
  const isMac = /^Mac/i.test(navigator.platform);
  fillShortcutFields();

  for (input of $('.keyboard-shortcut')) {
    input.addEventListener('focus', e => {
      e.target.value = "";
      e.target.placeholder = "type shortcut";
    });

    input.addEventListener('blur', e => {
      fillShortcutFields(e.target.id);
    });

    input.addEventListener('keypress', e => {
      if(typeof browser.commands.update != 'function') {
        alert('shortcut remapping is only available in Firefox >= v60');
        return;
      }
      const normalizedKey = normalizeKey(e.code);
      if((e.ctrlKey || e.altKey || e.metaKey) && normalizedKey) {
        const shortcutParts = [e.ctrlKey ? (isMac ? "MacCtrl" : "Ctrl") : (e.altKey ? "Alt" : "Command")];
        if (e.shiftKey) {
          shortcutParts.push("Shift");
        }

        shortcutParts.push(normalizedKey);
        const shortcut = shortcutParts.join("+");

        for(const e of $('.keyboard-shortcut')) {
          if(shortcut == e.value) {
            alert('Key combinations must differ');
            e.target.blur();
            return;
          }
        }
        
        e.target.value = shortcut;
        browser.commands.update({
          name: e.target.id,
          shortcut: shortcut
        });
        console.debug(`mapping ${e.target.id} to ${shortcut}`);
        e.target.blur();
      } else {
        alert(`
Key combinations must consist of two or three keys:

- modifier (mandatory, except for function keys). This can be any of: "Ctrl", "Alt", "Command", "MacCtrl".
- secondary modifier (optional). If supplied, this must be "Shift".
- key (mandatory). This can be any one of:
    the letters A-Z
    the numbers 0-9
    the function keys F1-F12
    Comma, Period, Home, End, PageUp, PageDown, Space, Insert, Delete, Up, Down, Left, Right`);
        e.target.blur();
      }
    });
  }
}

// from: https://github.com/piroor/webextensions-lib-shortcut-customize-ui/blob/master/ShortcutCustomizeUI.js
function normalizeKey(value) {
  const aKey = value.trim().replace(/^Digit/,"").replace(/^Key/,"").toLowerCase();
  const normalizedKey = aKey.replace(/\s+/g, '');
  if (/^[a-z0-9]$/i.test(normalizedKey) ||
      /^F([1-9]|1[0-2])$/i.test(normalizedKey))
    return aKey.toUpperCase();

  switch (normalizedKey) {
    case 'comma':
      return 'Comma';
    case 'period':
      return 'Period';
    case 'home':
      return 'Home';
    case 'end':
      return 'End';
    case 'pageup':
      return 'PageUp';
    case 'pagedown':
      return 'PageDown';
    case 'space':
      return 'Space';
    case 'del':
    case 'delete':
      return 'Delete';
    case 'up':
      return 'Up';
    case 'down':
      return 'Down';
    case 'left':
      return 'Left';
    case 'right':
      return 'right';
    case 'next':
    case 'medianexttrack':
      return 'MediaNextTrack';
    case 'play':
    case 'pause':
    case 'mediaplaypause':
      return 'MediaPlayPause';
    case 'prev':
    case 'previous':
    case 'mediaprevtrack':
      return 'MediaPrevTrack';
    case 'stop':
    case 'mediastop':
      return 'MediaStop';

    default:
      for (let map of [keyNameMapLocales[browser.i18n.getUILanguage()] || 
                       keyNameMapLocales[browser.i18n.getUILanguage().replace(/[-_].+$/, '')] || 
                       {}, keyNameMapLocales.global]) {
        for (let key of Object.keys(map)) {
          if (Array.isArray(map[key])) {
            if (map[key].some(aLocalizedKey => aLocalizedKey.toLowerCase() == aKey))
              return key;
        }
        else {
            if (map[key] &&
                map[key].toLowerCase() == aKey)
              return key;
          }
        }
      }
      break;
  }
  return '';
}

const keyNameMapLocales = {
  global: {
    Comma:  [','],
    Period: ['.'],
    Space:  [' '],
    Up:     ['↑'],
    Down:   ['↓'],
    Left:   ['←', '<=', '<-'],
    Right:  ['→', '=>', '->'],
  },
  // define tables with https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/i18n/LanguageCode
  ja: {
    // key: valid key name listed at https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/commands#Shortcut_values
    // value: array of localized key names
    Up:    ['上'],
    Down:  ['下'],
    Left:  ['左'],
    Right: ['右'],
    // you can localize modifier keys also.
    // Alt:     ['オルト'],
    // Ctrl:    ['コントロール'],
    // MacCtrl: ['コントロール'], // for macOS
    // Command: ['コマンド`], // for macOS
    // Shift:   ['シフト`],
  },
  ru: {
    // key: valid key name listed at https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/commands#Shortcut_values
    // value: array of localized key names
    Up:    ['Вверх'],
    Down:  ['Вниз'],
    Left:  ['Влево'],
    Right: ['Вправо'],
    Comma: ['Запятая'],
    Period: ['Точка'],
    Space: ['Пробел'],
    MediaNextTrack: ['Следующий трек'],
    MediaPrevTrack: ['Предыдущий трек'],
    MediaPlayPause: ['Пауза проигрывания'],
    MediaStop: ['Остановка проигрывания']
  },
  // de: {...},
  // fr: {...},
}

setupShortcutListeners();


browser.contextualIdentities.query({}).then(identities => {
  if (!identities) {
    document.querySelector('#missing-tab-container-support').style.display = 'block';
  }
}, e => console.error(e));

function showHideTabContainersMovingDetails() {
  $1('#moving-tabs-explanation').style.display = 'block';
  $1('#moving-tabs-explanation').scrollIntoView(); // necessary when embedded in about:addons page
  return false;
}

$1('#show-hide-tab-containers-moving-details-link').addEventListener('click', showHideTabContainersMovingDetails);

var handlePermission = function(setting, value) {
  return new Promise((resolve, reject) => {
    const mapping = {
      'search-bookmarks': {permissions: ['bookmarks']},
      'search-history': {permissions: ['history']},
      'hide-tabs': {permissions: ['tabHide', 'notifications']},
      /* 'create-thumbnail': {origins: ['<all_urls>']}, <all_urls> does not work correctly for optional permissions :( */
    };

    const permissions = mapping[setting];
    if (permissions) {
      if (value) {
        permissionQueryOpen = true;
        browser.permissions.request(permissions).then(success => {
          browser.permissions.getAll().then(permissions => console.debug('current conex permissions:', permissions.permissions, 'origins:', permissions.origins));
          resolve(success);
        }).catch(e => {
          console.error(`error requesting permission ${setting}`);
          reject(e);
        });
      } else {
        browser.permissions.remove(permissions).then(success => {
          browser.permissions.getAll().then(permissions => console.debug('current conex permissions:', permissions.permissions, 'origins:', permissions.origins));
          resolve(success);
        }).catch(e => {
          console.error(`error removing permission ${setting}`);
          reject(e);
        });
      }
    } else {
      resolve(true);
    }
  });
}

readSettings.then(_ => {
  for (const key in settings) {
    const checkbox = $1('#' + key);
    if(settings[key] && checkbox) {
      checkbox.checked = 'checked';
    }
  }
  bg.setupMenus();
});

let permissionQueryOpen = false;
for(const element of $('input[type=checkbox]')) {
  element.addEventListener('click', event => {
    const settingId = 'conex/settings/' + event.target.id;
    const value = event.target.checked;
    if(permissionQueryOpen) {
        event.target.checked = !event.target.checked;
        return;
    }


    const handlePermissionResult = function(success) {
      permissionQueryOpen = false;
      if (success) {
        console.info(`setting ${settingId} to ${value}`);
        browser.storage.local.set({ [settingId]: value }).catch(e => {
          console.error(`error setting ${settingId} to ${value}: ${e}`)
        });
        bg.refreshSettings();
      } else {
        event.target.checked = !event.target.checked;
      }
    }


    if (event.target.id == 'hide-tabs') {
      if (value == true) {
        handlePermission(event.target.id, value).then(success => {
          if(success) {
            browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT }).then(tabs => {
              const activeTab = tabs[0];
              bg.showCurrentContainerTabsOnly(activeTab.id);
            });
          }
          handlePermissionResult(success);
        }).catch(e => {
          permissionQueryOpen = false;
          consol.error('error handling permissions:', e);
        });
      } else {
        browser.tabs.query({}).then(tabs => {
          browser.tabs.show(tabs.map(t => t.id)).then(_ => {
            handlePermission(event.target.id, value).then(success => {
              handlePermissionResult(success);
            }).catch(e => {
              permissionQueryOpen = false;
              consol.error('error handling permissions:', e);
            });
          });
        });
      }
    } else {
      handlePermission(event.target.id, value).then(success => {
        handlePermissionResult(success);
      });
    }

    bg.setupMenus();
  });
}