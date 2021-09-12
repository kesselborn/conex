import { renderContainers, renderTabs } from '../conex-containers.js';
import { fakeContainers } from './conex-test-helper.js';
import { Tabs } from 'webextension-polyfill';
import Tab = Tabs.Tab;

describe('finally: render somthing to play around with', function () {
  it('renders', async function () {
    await renderContainers(fakeContainers);
    for (const container of fakeContainers) {
      // @ts-ignore
      const tabs = Array.from([
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-0-${container.cookieStoreId}`,
          title: `http://zombo.com / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-1-${container.cookieStoreId}`,
          title: `https://www.allyourbasearebelongtous.com / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
      ]) as Array<Tab>;

      await renderTabs(new Promise((resolve) => resolve(tabs)));
    }
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
