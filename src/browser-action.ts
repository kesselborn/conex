import type { Browser } from 'webextension-polyfill';
import { renderMainPage } from './main-page.js';
import { debug } from './logger.js';
import { ContainerRenderOptions } from './containers.js';
import { readSettings } from './settings.js';

declare let browser: Browser;

const component = 'browser-action';

document.addEventListener('DOMContentLoaded', async () => {
  debug(component, 'browser-action dom content loaded');

  const settings = await readSettings();

  const containerRenderOptions = {
    bookmarks: settings.includeBookmarks,
    history: settings.includeHistory,
  } as ContainerRenderOptions;

  setTimeout(() => renderMainPage([], containerRenderOptions), 0);
});
