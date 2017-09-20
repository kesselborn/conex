const filePicker = $1('#file-picker');
const bg = browser.extension.getBackgroundPage();

filePicker.addEventListener("change", picker => {
  const file = picker.target.files[0];

  const reader  = new FileReader();
  reader.onload = function(r) {
    try {
      const json = JSON.parse(r.target.result);
      const tabContainers = [];

      const windows = [];
      for(const w of json.windows) {
        const windowTabContainersJSON = JSON.parse(w.extData['tabview-group']);
        const windowTabContainers = [];

        for(const key in windowTabContainersJSON) {
          // if group doesn't have a name, give it a stupid dummy name
          const containerName = windowTabContainersJSON[key].title == "" ? "Container "+tabContainers.length+1 : windowTabContainersJSON[key].title;

          windowTabContainers.push(containerName);
          tabContainers.push(containerName);
        }

        const tabs = [];
        for(const tab of w.tabs) {
          const extData = JSON.parse(tab.extData['tabview-tab']);
          tabs.push({url: tab.entries[0].url, container: windowTabContainers[Number(extData.groupID)-1]});
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
    document.querySelector("#missing-tab-container-support").style.display = "block";
  }
});

function showHideTabContainersMovingDetails() {
  $1('#show-hide-tab-containers-moving-details-link').remove();
  $1('#moving-tabs-explanation').style.display = "block";
  return false;
}

$1('#show-hide-tab-containers-moving-details-link').addEventListener('click', showHideTabContainersMovingDetails);

browser.storage.local.get("taborama/settings/tab-moving-allowed").then(showPageAction => {
  const on = showPageAction["taborama/settings/tab-moving-allowed"];
  if(on) {
    $1('#move-tab-yes').checked = "checked";
  } else {
    $1('#move-tab-no').checked = "checked";
  }
  $1('#error').style.display = "none";
});

$1('#move-tab-yes').addEventListener('click', () => {
  $1('#error').style.display = "none";
  browser.storage.local.set({"taborama/settings/tab-moving-allowed": true});
});
$1('#move-tab-no').addEventListener('click', () => {
  $1('#error').style.display = "none";
  browser.storage.local.set({"taborama/settings/tab-moving-allowed": false});
});
