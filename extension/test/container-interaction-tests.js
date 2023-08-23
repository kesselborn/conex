import { closeContainer } from '../helper.js';
import { expect } from './helper.js';
const component = 'container-interaction-tests';
describe(component, function () {
  it('should close tabs before closing the container', async function () {
    const tabCntBefore = (await browser.tabs.query({})).length;
    const name = new Date().toString();
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await browser.tabs.create({ active: false, cookieStoreId: container.cookieStoreId });
    await closeContainer(container.cookieStoreId);
    const tabCntAfter = (await browser.tabs.query({})).length;
    expect(tabCntAfter).to.equal(tabCntBefore);
  });
});
