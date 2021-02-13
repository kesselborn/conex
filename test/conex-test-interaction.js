import { $, closeContainer } from "../conex-helper.js";
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


function timeoutResolver(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve(true);
        }, ms)
    });
}

describe('interactions', function () {
    beforeEach(async function () {
        testingTab = (await browser.tabs.query({ active: true }))[0];
        const name = (new Date()).toString();
        const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
        containerId = container.cookieStoreId;

        tab = await browser.tabs.create({ active: true, cookieStoreId: containerId })

        await renderContainers(await browser.contextualIdentities.query({}));
        await fillContainer(await browser.tabs.query({ cookieStoreId: containerId }));
    })

    afterEach(async function () {
        await browser.tabs.update(testingTab.id, { active: true });
        await clear();
        await closeContainer(containerId);
    });

    it('tab switching should work correctly', async function () {
        this.timeout(5000);
        let newActiveTabId;
        const setNewActiveTabId = (activeInfo) => {
            newActiveTabId = activeInfo.tabId;
        }

        function tabChangeEventCatcher() {
            return new Promise((resolve, reject) => {
                let x = setInterval(function () {
                    if (newActiveTabId !== undefined) {
                        alert(newActiveTabId);
                        clearInterval(x);
                        resolve();
                    }
                }, 100)
            });
        }
        browser.tabs.onActivated.addListener(setNewActiveTabId);

        $(`#t${tab.id}`).click();
        await tabChangeEventCatcher();
        expect(newActiveTabId).to.not.equal(currentlyActiveTab.id);
    });
});
