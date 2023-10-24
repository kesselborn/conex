import { Browser } from 'webextension-polyfill';
import { debug } from './logger.js';

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
  debug(component, 'changing settings: ', settings);
  return await browser.storage.local.set({ settings: settings });
}

export async function changeAskContainerSetting(value: boolean) {
  const settings = await readSettings();
  settings.closeMovedTabs = value;
  writeSettings(settings);
}

export async function changeCloseMovedTabsSetting(value: boolean) {
  const settings = await readSettings();
  settings.closeMovedTabs = value;
  writeSettings(settings);
}

export async function changeCreateThumbnailsSetting(value: boolean) {
  const settings = await readSettings();
  settings.createThumbnails = value;
  writeSettings(settings);
}

export async function changeDebugViewSetting(value: boolean) {
  const settings = await readSettings();
  settings.debugView = value;
  writeSettings(settings);
}

export async function changeHideTabsSetting(value: boolean) {
  const settings = await readSettings();
  settings.hideTabs = value;
  writeSettings(settings);
}

export async function changeIncludeBookmarksSetting(value: boolean) {
  const settings = await readSettings();
  settings.includeBookmarks = value;
  writeSettings(settings);
}

export async function changeIncludeHistorySetting(value: boolean) {
  const settings = await readSettings();
  settings.includeHistory = value;
  writeSettings(settings);
}
