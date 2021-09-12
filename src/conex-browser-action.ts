import type { Browser } from 'webextension-polyfill';
import { ConexElements } from './conex-selectors.js';
import { renderMainPage } from './conex-main-page.js';

declare let browser: Browser;

document.addEventListener('DOMContentLoaded', async () => {
  await renderMainPage();

  ConexElements.search.focus();
});
