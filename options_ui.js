const filePicker = $1('#file-picker');
const bg = browser.extension.getBackgroundPage();

filePicker.addEventListener("change", picker => {
  const file = picker.target.files[0];

  const reader  = new FileReader();
  reader.onload = function(r) {
    try {
      const json = JSON.parse(r.target.result);
      const tabGroups = [];

      const windows = [];
      for(const w of json.windows) {
        console.log(1, w);
        const windowTabGroupsJSON = JSON.parse(w.extData['tabview-group']);
        const windowTabGroups = [];

        for(const key in windowTabGroupsJSON) {
          // if group doesn't have a name, give it a stupid dummy name
          const groupName = windowTabGroupsJSON[key].title == "" ? "Group "+tabGroups.length+1 : windowTabGroupsJSON[key].title;

          windowTabGroups.push(groupName);
          tabGroups.push(groupName);
        }

        const tabs = [];
        for(const tab of w.tabs) {
          const extData = JSON.parse(tab.extData['tabview-tab']);
          tabs.push({url: tab.entries[0].url, group: windowTabGroups[Number(extData.groupID)-1]});
        }
        windows.push(tabs);
      }

      bg.restoreTabGroupsBackup(tabGroups, windows);

    } catch(e){ console.error(e); }
  };
  reader.readAsText(file);

});


browser.contextualIdentities.query({}).then(identities => {
  if(!identities) {
    document.querySelector("#missing-tab-container-support").style.display = "block";
  }
});

function showHideTabGroupsMovingDetails() {
  $1('#show-hide-tab-groups-moving-details-link').remove();
  $1('#moving-tabs-explanation').style.display = "block";
  return false;
}

$1('#show-hide-tab-groups-moving-details-link').addEventListener('click', showHideTabGroupsMovingDetails);

browser.storage.local.get("taborama/settings/show-page-action").then(showPageAction => {
  if(showPageAction["taborama/settings/show-page-action"] == true) {
    $1('#move-tab-yes').checked = "checked";
    $1('#error').style.display = "none";
  } else if(showPageAction["taborama/settings/show-page-action"] == false) {
    $1('#move-tab-no').checked = "checked";
    $1('#error').style.display = "none";
  }
});

$1('#move-tab-yes').addEventListener('click', function() {
  $1('#error').style.display = "none";
  browser.storage.local.set({"taborama/settings/show-page-action": true});
});
$1('#move-tab-no').addEventListener('click', function() {
  $1('#error').style.display = "none";
  browser.storage.local.set({"taborama/settings/show-page-action": false});
});
