import { renderMainPage } from './main-page.js';
import { debug } from './logger.js';
import { ContainerRenderOptions } from './containers.js';
import { Browser } from 'webextension-polyfill';
import { $, _, timeoutResolver } from './helper.js';

declare let browser: Browser;
const component = 'container-selector';

document.addEventListener('DOMContentLoaded', async () => {
  await debug(component, 'dom content loaded');

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const url = urlParams.get('url'); // "value1"

  $('h1')!.innerText = _('container-selector-h1');
  $('h2')!.innerHTML = `<a href="">${url}</a>`;

  const containerRenderOptions = {
    bookmarks: false,
    history: false,
    tabs: false,
    newTabUrl: url,
  } as ContainerRenderOptions;

  await debug(component, `url to open is: ${url}`);

  await timeoutResolver();
  renderMainPage(await browser.contextualIdentities.query({}), containerRenderOptions);
});
