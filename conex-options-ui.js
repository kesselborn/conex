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
  return new Promise(resolve => {
    const mapping = {
      'search-bookmarks': {permissions: ['bookmarks']},
      'search-history': {permissions: ['history']},
      'hide-tabs': {permissions: ['tabHide', 'notifications']}
      /* 'create-thumbnail': {origins: ['<all_urls>']}, <all_urls> does not work correctly for optional permissions :( */
    };

    const permissions = mapping[setting];
    if (permissions) {
      if (value) {
        browser.permissions.request(permissions).then(_ => {
          browser.permissions.getAll().then(permissions => console.info('current conex permissions:', permissions.permissions, 'origins:', permissions.origins));
          resolve();
        }).catch(e => {
          console.error(`error requesting permission ${setting}`);
        });
      } else {
        browser.permissions.remove(permissions).then(_ => {
          browser.permissions.getAll().then(permissions => console.info('current conex permissions:', permissions.permissions, 'origins:', permissions.origins));
          resolve();
        }).catch(e => {
          console.error(`error removing permission ${setting}`);
        });
      }
    }
  });
}

readSettings.then(_ => {
  for (const key in settings) {
    if(settings[key]) {
      $1('#' + key).checked = 'checked';
    }
  }
  bg.setupMenus();
});

for(const element of $('input[type=checkbox]')) {
  element.addEventListener('click', event => {
    const settingId = 'conex/settings/' + event.target.id;
    const value = event.target.checked;

    console.debug(`setting ${settingId} to ${value}`);
    browser.storage.local.set({ [settingId] : value }).catch(e => {
      console.error(`error setting ${settingId} to ${value}: ${e}`)
    });

    bg.refreshSettings();

    if (event.target.id == 'hide-tabs') {
      if (value == true) {
        handlePermission(event.target.id, value).then(_ => {
          browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT }).then(tabs => {
            const activeTab = tabs[0];
            bg.showHideTabs(activeTab.id);
          });
        });
      } else {
        browser.tabs.query({}).then(tabs => {
          browser.tabs.show(tabs.map(t => t.id)).then(_ => handlePermission(event.target.id, value));
        });
      }
    } else {
      handlePermission(event.target.id, value);
    }

    bg.setupMenus();
  });
}