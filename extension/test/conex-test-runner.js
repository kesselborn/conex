import { renderContainers, fillContainer } from '../conex-containers.js';
import { fakeContainers } from './conex-test-helper.js';
describe('finally: render somthing to play around with', function () {
    it('renders', async function () {
        await renderContainers(fakeContainers);
        for (const container of fakeContainers) {
            const tabs = [
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
            ];
            // @ts-ignore
            await fillContainer(container, new Promise((resolve) => resolve(tabs)));
        }
    });
});
document.addEventListener('DOMContentLoaded', async () => {
    mocha.checkLeaks();
    mocha.run((failures) => {
        if (failures === 0) {
            document.title = '✅ Conex Tests';
        }
        else {
            document.title = `❌ (${failures} error${failures > 1 ? 's' : ''}) Conext Tests`;
        }
    });
});
