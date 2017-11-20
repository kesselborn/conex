const filePicker = $1('#file-picker');
const bg = browser.extension.getBackgroundPage();

filePicker.addEventListener('change', picker => {
  const file = picker.target.files[0];

  const reader  = new FileReader();
  reader.onload = function(r) {
    try {
      const json = JSON.parse(r.target.result);
      const tabContainers = [];

      const windows = [];
      for(const w of json.windows) {
        const windowTabContainers = {};
        if(w.extData && w.extData['tabview-group']) {
          const windowTabContainersJSON = JSON.parse(w.extData['tabview-group']);

          for(const key in windowTabContainersJSON) {
            if(windowTabContainersJSON[key].title) {
              windowTabContainers[key] = windowTabContainersJSON[key].title;
              tabContainers.push(windowTabContainers[key]);
            }
          }
        }

        const tabs = [];
        for(const tab of w.tabs) {
          if(tab.extData && tab.extData['tabview-tab']) {
            const extData = JSON.parse(tab.extData['tabview-tab']);
            if(extData && extData.groupID && windowTabContainers[Number(extData.groupID)]) {
              tabs.push({url: tab.entries[tab.entries.length - 1].url, container: windowTabContainers[Number(extData.groupID)]});
            } else {
              tabs.push({url: tab.entries[tab.entries.length - 1].url, container: null});
            }
          } else {
            tabs.push({url: tab.entries[tab.entries.length - 1].url, container: null});
          }
        }
        windows.push(tabs);
      }

      bg.restoreTabContainersBackup(tabContainers, windows);

    } catch(e){ console.error(e); }
  };
  reader.readAsText(file);

});


browser.contextualIdentities.query({}).then(identities => {
  if(!identities) {
    document.querySelector('#missing-tab-container-support').style.display = 'block';
  }
});

function showHideTabContainersMovingDetails() {
  $1('#show-hide-tab-containers-moving-details-link').remove();
  $1('#moving-tabs-explanation').style.display = 'block';
  return false;
}

$1('#show-hide-tab-containers-moving-details-link').addEventListener('click', showHideTabContainersMovingDetails);

browser.storage.local.get('conex/settings/tab-moving-allowed').then(settings => {
  const on = settings['conex/settings/tab-moving-allowed'];
  if(on) {
    $1('#move-tab-yes').checked = 'checked';
    $1('#error').style.display = 'none';
  } else if(on == false) {
    $1('#move-tab-no').checked = 'checked';
    $1('#error').style.display = 'none';
  }
  bg.setupMenus();
});

$1('#move-tab-yes').addEventListener('click', _ => {
  $1('#error').style.display = 'none';
  browser.storage.local.set({'conex/settings/tab-moving-allowed': true});
  bg.setupMenus();
});

$1('#move-tab-no').addEventListener('click', _ => {
  $1('#error').style.display = 'none';
  browser.storage.local.set({'conex/settings/tab-moving-allowed': false});
  browser.storage.local.set({tabMovingSettingKey: false});
  bg.setupMenus();
});

browser.storage.local.get('conex/settings/tab-moving-allowed/prefer-context-menu').then(settings => {
  const on = settings['conex/settings/tab-moving-allowed/prefer-context-menu'];
  if(on) {
    $1('#move-tab-menu-context-menu').checked = 'checked';
  } else {
    $1('#move-tab-menu-page-action').checked = 'checked';
  }
});

$1('#move-tab-menu-context-menu').addEventListener('click', _ => {
  browser.storage.local.set({'conex/settings/tab-moving-allowed/prefer-context-menu' : true});
  bg.setupMenus();
});

$1('#move-tab-menu-page-action').addEventListener('click', _ => {
  browser.storage.local.set({'conex/settings/tab-moving-allowed/prefer-context-menu' : false});
  bg.setupMenus();
});
