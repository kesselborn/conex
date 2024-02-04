import type { Browser } from 'webextension-polyfill';
import { renderMainPage } from './main-page.js';
import { debug } from './logger.js';
import { ContainerRenderOptions } from './containers.js';

declare let browser: Browser;

const component = 'container-selector';

document.addEventListener('DOMContentLoaded', async () => {
  debug(component, 'dom content loaded');

  const containerRenderOptions = {
    bookmarks: false,
    history: false,
    tabs: false,
  } as ContainerRenderOptions;

  setTimeout(() => renderMainPage([], containerRenderOptions), 0);
});
