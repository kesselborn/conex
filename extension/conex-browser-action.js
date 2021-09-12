import { ConexElements } from './conex-selectors.js';
import { renderMainPage } from './conex-main-page.js';
document.addEventListener('DOMContentLoaded', async () => {
  await renderMainPage();
  ConexElements.search.focus();
});
