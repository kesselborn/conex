import { $, closeContainer } from '../conex-helper.js';
import { renderContainers, fillContainer, defaultContainer } from '../conex-containers.js';
import { expect, clear } from './conex-test-helper.js'
import { tabId2HtmlOpenTabId } from '../conex-tab-element.js';

let newContainerId;
let newTab;
let testingTab;

describe('container management', function () {
    it('should close tabs before closing the container', async function () {
        const tabCntBefore = (await browser.tabs.query({})).length;
        const name = (new Date()).toString();
        const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
        await browser.tabs.create({ active: false, cookieStoreId: container.cookieStoreId })

        await closeContainer(container.cookieStoreId);
        const tabCntAfter = (await browser.tabs.query({})).length;

        expect(tabCntAfter).to.equal(tabCntBefore);
    });
});

function timeoutResolver(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve(true);
        }, ms);
    });
}

describe('interactions', function () {
    before(async function () {
        testingTab = (await browser.tabs.query({ active: true }))[0];
    });

    beforeEach(async function () {
        const newContainer = await browser.contextualIdentities.create({ name: (new Date()).toString(), color: 'blue', icon: 'circle' });
        newContainerId = newContainer.cookieStoreId;

        newTab = await browser.tabs.create({ active: false, cookieStoreId: newContainerId, url: 'http://example.com' })

        await renderContainers(await browser.contextualIdentities.query({}));
        await fillContainer(await browser.tabs.query({ cookieStoreId: newContainerId }));
    })

    afterEach(async function () {
        await browser.tabs.update(testingTab.id, { active: true });
        await clear();
        await closeContainer(newContainerId);
    });

    it('tab switching should work correctly', async function () {
        let activeTab = await browser.tabs.query({ active: true });
        expect(`testing-tab-id-${activeTab[0].id}`).to.equal(`testing-tab-id-${testingTab.id}`);

        $(`#${tabId2HtmlOpenTabId(newTab.id)}`).click();
        // let the event handling do its work
        timeoutResolver(100);

        activeTab = await browser.tabs.query({ active: true });
        expect(`new-tab-id-${activeTab[0].id}`).to.equal(`new-tab-id-${newTab.id}`);
    });
});
