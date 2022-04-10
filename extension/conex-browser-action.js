import { ConexElements } from './conex-selectors.js';
import { renderMainPage } from './conex-main-page.js';
import { debug, info, Level, persistLogLevel } from './conex-logger.js';
document.addEventListener('DOMContentLoaded', async () => {
  debug('action', 'debug1');
  info('action', 'hallo');
  await persistLogLevel('action', Level.Debug);
  debug('action', 'debug2');
  await persistLogLevel('action', Level.Info);
  await renderMainPage();
  ConexElements.search.focus();
});
