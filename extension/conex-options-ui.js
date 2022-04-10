import { $ } from './conex-helper.js';
import { debug } from './conex-logger.js';
async function showHideDebugUI() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    debug('options', 'enabling debug section');
    await browser.storage.local.set({
      showDebugUI: true,
    });
  }
  if (params.get('debug') === '0') {
    debug('options', 'disabling debug section');
    await browser.storage.local.set({
      showDebugUI: false,
    });
  }
  if ((await browser.storage.local.get('showDebugUI')).showDebugUI === true) {
    $('section#debug').style.display = 'block';
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  var _a;
  let secretCnt = 0;
  showHideDebugUI();
  (_a = $('#secret')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', async () => {
    secretCnt += 1;
    if (secretCnt >= 5) {
      $('#show-debug-section-link').style.display = 'inherit';
    }
  });
});
