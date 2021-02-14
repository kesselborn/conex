import { tabId2HtmlId, htmlId2TabId, htmlOpenTabId2TabId, tabId2HtmlOpenTabId, htmlCloseTabId2TabId, tabId2HtmlCloseTabId } from '../conex-tab-element.js';
import { expect } from "./conex-test-helper.js"

describe('simple unit tests', function () {
    it('translate tab element html ids correctly', async function () {
        expect(6).to.equal(htmlId2TabId(tabId2HtmlId('6')));
        expect(6).to.equal(htmlId2TabId(tabId2HtmlId(6)));
    });

    it('translate open tab html ids correctly', async function () {
        expect(6).to.equal(htmlOpenTabId2TabId(tabId2HtmlOpenTabId('6')));
        expect(6).to.equal(htmlOpenTabId2TabId(tabId2HtmlOpenTabId(6)));
    });

    it('translate close tab html ids correctly', async function () {
        expect(6).to.equal(htmlCloseTabId2TabId(tabId2HtmlCloseTabId('6')));
        expect(6).to.equal(htmlCloseTabId2TabId(tabId2HtmlCloseTabId(6)));
    });
});