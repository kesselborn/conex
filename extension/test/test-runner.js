import { renderMainPage } from '../main-page.js';
describe('finally: render somthing to play around with', function () {
  it('renders', async function () {
    await renderMainPage();
  });
});
document.addEventListener('DOMContentLoaded', async () => {
  mocha.checkLeaks();
  mocha.run((failures) => {
    if (failures === 0) {
      document.title = '✅ Conex Tests';
    } else {
      document.title = `❌ (${failures} error${failures > 1 ? 's' : ''}) Conext Tests`;
    }
  });
});
