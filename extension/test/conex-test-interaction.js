import { $, closeContainer } from '../conex-helper.js';
import { renderTabs } from '../conex-containers.js';
import { clear, expect, timeoutResolver, typeKey } from './conex-test-helper.js';
import { tabId2HtmlId, tabId2HtmlOpenTabId } from '../conex-tab-element.js';
import { renderMainPage } from '../conex-main-page.js';
import { Selectors } from '../conex-selectors.js';
let newContainerId;
let newTab;
let testingTab;
describe('container management', function () {
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
describe('interactions', function () {
    before(async function () {
        testingTab = (await browser.tabs.query({ active: true }))[0];
    });
    beforeEach(async function () {
        const newContainer = await browser.contextualIdentities.create({
            name: new Date().toString(),
            color: 'blue',
            icon: 'circle',
        });
        newContainerId = newContainer.cookieStoreId;
        newTab = await browser.tabs.create({ active: false, cookieStoreId: newContainerId, url: 'http://example.com' });
        await renderMainPage(await browser.contextualIdentities.query({}));
        await renderTabs(browser.tabs.query({ cookieStoreId: newContainerId }));
    });
    afterEach(async function () {
        await browser.tabs.update(testingTab.id, { active: true });
        await clear();
        await closeContainer(newContainerId);
    });
    it('should switch tabs when clicking with mouse on the open-tab radio button', async function () {
        let activeTab = await browser.tabs.query({ active: true });
        expect(`testing-tab-id-${activeTab[0].id}`).to.equal(`testing-tab-id-${testingTab.id}`);
        $(`#${tabId2HtmlOpenTabId(newTab.id)}`).click();
        // let the event handling do its work
        timeoutResolver(100);
        activeTab = await browser.tabs.query({ active: true });
        expect(`new-tab-id-${activeTab[0].id}`).to.equal(`new-tab-id-${newTab.id}`);
    });
    it('should switch tabs when hitting enter on tab element', async function () {
        let activeTab = await browser.tabs.query({ active: true });
        expect(`testing-tab-id-${activeTab[0].id}`).to.equal(`testing-tab-id-${testingTab.id}`);
        typeKey({ key: 'Enter' }, $(`#${tabId2HtmlId(newTab.id)}`));
        // let the event handling do its work
        timeoutResolver(100);
        activeTab = await browser.tabs.query({ active: true });
        expect(`new-tab-id-${activeTab[0].id}`).to.equal(`new-tab-id-${newTab.id}`);
    });
    it('should close tab when hitting backspace on tab element', async function () {
        let tab;
        try {
            tab = await browser.tabs.get(newTab.id);
        }
        catch (_) { }
        // @ts-ignore
        expect(tab.id).to.equal(newTab.id);
        typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id)}`));
        // let the event handling do its work
        await timeoutResolver(200);
        tab = undefined;
        try {
            tab = await browser.tabs.get(newTab.id);
        }
        catch (_) { }
        expect(tab).to.be.undefined;
        expect($(`#${tabId2HtmlId(newTab.id)}`).classList.contains(Selectors.tabClosed)).to.be.true;
        expect($(`#${tabId2HtmlId(newTab.id)}`).dataset['url']).to.equal(newTab.url);
    });
    it('should close tab when clicking the close radio button', async function () {
        let tab;
        try {
            tab = await browser.tabs.get(newTab.id);
        }
        catch (_) { }
        // @ts-ignore
        expect(tab.id).to.equal(newTab.id);
        typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id)}`));
        // let the event handling do its work
        await timeoutResolver(200);
        tab = undefined;
        try {
            tab = await browser.tabs.get(newTab.id);
        }
        catch (_) { }
        expect(tab).to.be.undefined;
        expect($(`#${tabId2HtmlId(newTab.id)}`).classList.contains(Selectors.tabClosed)).to.be.true;
        expect($(`#${tabId2HtmlId(newTab.id)}`).dataset['url']).to.equal(newTab.url);
    });
});
