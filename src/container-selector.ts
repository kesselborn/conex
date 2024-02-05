import { renderMainPage } from './main-page.js';
import { debug } from './logger.js';
import { ContainerRenderOptions } from './containers.js';

const component = 'container-selector';

document.addEventListener('DOMContentLoaded', async () => {
  await debug(component, 'dom content loaded');

  const containerRenderOptions = {
    bookmarks: false,
    history: false,
    tabs: false,
  } as ContainerRenderOptions;

  setTimeout(() => renderMainPage([], containerRenderOptions), 0);
});
