import { Browser, Manifest } from 'webextension-polyfill';
import { debug, info } from './logger.js';
import { showHideTabs } from './background.js';
import OptionalPermission = Manifest.OptionalPermission;

export interface Settings {
  askContainer: boolean;
  closeMovedTabs: boolean;
  createThumbnails: boolean;
  debugView: boolean;
  hideTabs: boolean;
  includeBookmarks: boolean;
  includeHistory: boolean;
}

declare let browser: Browser;

const component = 'settings';

export async function readSettings(): Promise<Settings> {
  const settings = (await browser.storage.local.get('settings'))!['settings'] as Settings;

  return settings || ({} as Settings);
}

export async function writeSettings(settings: Settings): Promise<void> {
  await debug(component, 'changing settings: ', settings);
  return await browser.storage.local.set({ settings: settings });
}

async function changeOptionalPermissions(value: boolean, permissions: Manifest.OptionalPermission[]) {
  if (value) {
    await info(component, 'removing bookmark permissions');
    //
    // THIS CALL MUST HAPPEN BEFORE ANY AWAIT!!! SEE https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/User_actions
    //
    await browser.permissions.request({ permissions });
  } else {
    await info(component, 'requesting bookmark permissions');
    await browser.permissions.remove({ permissions });
  }
}

export async function changeAskContainerSetting(value: boolean) {
  const settings = await readSettings();
  settings.closeMovedTabs = value;
  await writeSettings(settings);
}

export async function changeCloseMovedTabsSetting(value: boolean) {
  const settings = await readSettings();
  settings.closeMovedTabs = value;
  await writeSettings(settings);
}

export async function changeCreateThumbnailsSetting(value: boolean) {
  const settings = await readSettings();
  settings.createThumbnails = value;
  await writeSettings(settings);
}

export async function changeDebugViewSetting(value: boolean) {
  const settings = await readSettings();
  settings.debugView = value;
  await writeSettings(settings);
}

export async function changeHideTabsSetting(value: boolean) {
  const permissions = ['tabHide'] as OptionalPermission[];
  await changeOptionalPermissions(value, permissions);

  const settings = await readSettings();
  settings.hideTabs = value;
  await writeSettings(settings);
  if (value) {
    const activeTab = (await browser.tabs.query({ active: true }))[0]!;
    await debug(component, `showing all tabs from ${activeTab.cookieStoreId}`);
    await showHideTabs(activeTab);
  }
}

export async function changeIncludeBookmarksSetting(value: boolean) {
  const permissions = ['bookmarks'] as OptionalPermission[];
  await changeOptionalPermissions(value, permissions);

  const settings = await readSettings();
  settings.includeBookmarks = value;

  await writeSettings(settings);
}

export async function changeIncludeHistorySetting(value: boolean) {
  const permissions = ['history'] as OptionalPermission[];
  await changeOptionalPermissions(value, permissions);

  const settings = await readSettings();
  settings.includeHistory = value;
  await writeSettings(settings);
}
