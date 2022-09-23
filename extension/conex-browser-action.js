import { ConexElements } from './conex-selectors.js';
import { renderMainPage } from './conex-main-page.js';
import { debug, info } from './conex-logger.js';
document.addEventListener('DOMContentLoaded', async () => {
  debug('action', 'debug1');
  info('action', 'hallo');
  debug('action', 'debug2');
  await renderMainPage();
  ConexElements.search.focus();
});
