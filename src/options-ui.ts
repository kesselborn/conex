import { $, $e } from './helper.js';
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

document.addEventListener('DOMContentLoaded', async () => {
  let secretCnt: number = 0;
  showHideDebugUI();

  $('#secret')!.addEventListener('click', async () => {
    secretCnt += 1;
    if (secretCnt >= 5) {
      $('#show-debug-section-link')!.style.display = 'inherit';
    }
  });

  const logSettings = await loadSettings();

  // set debug options
  const settings = await readSettings();
  ($('#hide-tabs') as HTMLInputElement).checked = settings.hideTabs;
  ($('#create-thumbnails') as HTMLInputElement).checked = settings.createThumbnails;
  ($('#include-bookmarks') as HTMLInputElement).checked = settings.includeBookmarks;
  ($('#include-history') as HTMLInputElement).checked = settings.includeHistory;
  ($('#ask-target-container') as HTMLInputElement).checked = settings.askContainer;
  ($('#close-reopened-container') as HTMLInputElement).checked = settings.closeMovedTabs;

  const selectorContainer = $('#debug-level-selector')!;
  // prefill logging selection boxes
  for (const key in logSettings) {
    const value = logSettings[key];

    const selectionBox = newSelectionBox(key);
    const option = selectionBox!.querySelector(`option[value=${value}]`);

    if (option) option.setAttribute('selected', 'selected');

    debug(component, `adding selection box for component ${key}`);

    await selectorContainer.appendChild(selectionBox);
  }

  selectorContainer.addEventListener('click', async (e) => {
    const value = (e.target as HTMLOptionElement).value;
    const selectedComponent = ((e.target as HTMLOptionElement).parentNode as HTMLSelectElement).name;
    debug(component, `log-level adjustment: component ${selectedComponent}=${value}`);
    persistLogLevel(selectedComponent, value as Level);
  });

  // eslint-disable-next-line no-void
  $(Selectors.settingsForm)?.addEventListener('change', async (e: Event) => {
    const optionSwitch = e.target! as HTMLInputElement;
    const optionName = optionSwitch.id;
    const optionValue = optionSwitch.checked;
    debug(component, `${optionName} settings changed to ${optionValue}`);
    switch (optionName) {
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
        error(component, `invalid setting with name ${optionName} was changed`);
    }

    return;
  });
});
