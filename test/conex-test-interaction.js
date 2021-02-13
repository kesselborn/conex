import { closeContainer } from "../conex-helper.js";
import { renderContainers, fillContainer, defaultContainer } from "../conex-containers.js";
import { expect, clear } from "./conex-test-helper.js"

let containerId;
let tab;
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

describe('interactions', function () {
    beforeEach(async function () {
        testingTab = (await browser.tabs.query({ active: true }))[0];
        const name = (new Date()).toString();
        const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
        containerId = container.cookieStoreId;

        tab = await browser.tabs.create({ active: true, cookieStoreId: containerId, url: 'https://news.ycombinator.com/' })
    })

    afterEach(async function () {
        await browser.tabs.update(testingTab.id, { active: true });
        await clear();
        await browser.contextualIdentities.remove(containerId);
    });

    it.skip('should be true', async function (done) {
        await browser.tabs.update(tab.id, { active: true })
        expect(true).to.be.true;
        done();
    });
});
