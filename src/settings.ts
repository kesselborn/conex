import { Browser } from 'webextension-polyfill';

export interface Settings {
  debugView: boolean;
}

declare let browser: Browser;

export async function readSettings(): Promise<Settings> {
  return (await browser.storage.local.get('settings')) as Settings;
}

export async function writeSettings(settings: Settings): Promise<void> {
  return await browser.storage.local.set({ settings: settings });
}
