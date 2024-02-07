import { $, $e, _ } from './helper.js';
import { Browser } from 'webextension-polyfill';
import { debug, error, Level, loadSettings, persistLogLevel } from './logger.js';
import { Selectors } from './constants.js';
import {
  changeAskContainerSetting,
  changeCloseMovedTabsSetting,
  changeCreateThumbnailsSetting,
  changeDebugViewSetting,
  changeHideTabsSetting,
  changeIncludeBookmarksSetting,
  changeIncludeHistorySetting,
  changeOpenTabInSameContainer,
  readSettings,
} from './settings.js';

const component = 'options-ui';

declare let browser: Browser;

async function showHideDebugUI() {
  const params = new URLSearchParams(window.location.search);
  let debugParam = params.get('debug');

  if (debugParam === '1') {
    await changeDebugViewSetting(true);
  }

  if (debugParam === '0') {
    await changeDebugViewSetting(false);
  }

  if ((await readSettings())!.debugView) {
    $('section#debug')!.style.display = 'block';
  }
}

function newSelectionBox(component: string): Element {
  return $e('li', {}, [
    $e('span', { content: component }),
    $e('select', { name: component }, [
      $e('option', { value: Level.Debug, content: Level.Debug }),
      $e('option', { value: Level.Info, content: Level.Info }),
      $e('option', { value: Level.Warn, content: Level.Warn }),
      $e('option', { value: Level.Error, content: Level.Error }),
    ]),
  ]);
}

async function syncUIWithSettings() {
  // set debug options
  const settings = await readSettings();
  ($('#open-tab-in-same-container') as HTMLInputElement).checked = settings.openTabInSameContainer;
  ($('#hide-tabs') as HTMLInputElement).checked = settings.hideTabs;
  ($('#create-thumbnails') as HTMLInputElement).checked = settings.createThumbnails;
  ($('#include-bookmarks') as HTMLInputElement).checked = settings.includeBookmarks;
  ($('#include-history') as HTMLInputElement).checked = settings.includeHistory;
  ($('#ask-target-container') as HTMLInputElement).checked = settings.askContainer;
  ($('#close-reopened-container') as HTMLInputElement).checked = settings.closeMovedTabs;
}

document.addEventListener('DOMContentLoaded', async () => {
  let secretCnt: number = 0;
  await showHideDebugUI();

  $('#secret')!.addEventListener('click', async () => {
    secretCnt += 1;
    if (secretCnt >= 5) {
      $('#show-debug-section-link')!.style.display = 'inherit';
    }
  });

  const logSettings = await loadSettings();
  await syncUIWithSettings();

  const selectorContainer = $('#debug-level-selector')!;
  // prefill logging selection boxes
  for (const key in logSettings) {
    const value = logSettings[key];

    const selectionBox = newSelectionBox(key);
    const option = selectionBox!.querySelector(`option[value=${value}]`);

    if (option) option.setAttribute('selected', 'selected');

    await debug(component, `adding selection box for component ${key}`);

    selectorContainer.appendChild(selectionBox);
  }

  selectorContainer.addEventListener('click', async (e) => {
    const value = (e.target as HTMLOptionElement).value;
    const selectedComponent = ((e.target as HTMLOptionElement).parentNode as HTMLSelectElement).name;
    await debug(component, `log-level adjustment: component ${selectedComponent}=${value}`);
    await persistLogLevel(selectedComponent, value as Level);
  });

  $(Selectors.settingsForm)!.addEventListener('change', async (e: Event) => {
    const optionSwitch = e.target! as HTMLInputElement;
    const optionName = optionSwitch.id;
    const optionValue = optionSwitch.checked;
    await debug(component, `${optionName} settings changed to ${optionValue}`);
    switch (optionName) {
      case 'open-tab-in-same-container':
        await changeOpenTabInSameContainer(optionValue);
        break;
      case 'hide-tabs':
        await changeHideTabsSetting(optionValue);
        break;
      case 'create-thumbnails':
        await changeCreateThumbnailsSetting(optionValue);
        break;
      case 'include-bookmarks':
        await changeIncludeBookmarksSetting(optionValue);
        break;
      case 'include-history':
        await changeIncludeHistorySetting(optionValue);
        break;
      case 'ask-target-container':
        await changeAskContainerSetting(optionValue);
        break;
      case 'close-reopened-container':
        await changeCloseMovedTabsSetting(optionValue);
        break;
      default:
        await error(component, `invalid setting with name ${optionName} was changed`);
    }
  });
  // const containers = await browser.contextualIdentities.query({});
  // await renderContainers(containers, { bookmarks: true, history: false, order: [] });
  return;
});

browser.permissions.onRemoved.addListener(async (permissions) => {
  await debug(component, 'remove permission called');
  if (permissions.permissions!.includes('browserSettings')) {
    await changeOpenTabInSameContainer(false);
  }
  if (permissions.permissions!.includes('bookmarks')) {
    await changeIncludeBookmarksSetting(false);
  }
  if (permissions.permissions!.includes('history')) {
    await changeIncludeHistorySetting(false);
  }
  if (permissions.permissions!.includes('tabHide')) {
    await changeHideTabsSetting(false);
    alert(_('show-all-tabs-alert'));
  }
  await syncUIWithSettings();
});
