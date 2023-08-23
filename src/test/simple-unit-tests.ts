import {
  htmlCloseTabId2TabId,
  htmlId2TabId,
  htmlOpenTabId2TabId,
  tabId2HtmlCloseTabId,
  tabId2HtmlId,
  tabId2HtmlOpenTabId,
} from '../tab-element.js';
import { expect } from './helper.js';

const component = 'simple-unit-tests';

describe(component, function () {
  it('translate tab element html ids correctly', async function () {
    expect(6).to.equal(htmlId2TabId(tabId2HtmlId(6)));
  });

  it('translate open tab html ids correctly', async function () {
    expect(6).to.equal(htmlOpenTabId2TabId(tabId2HtmlOpenTabId(6)));
  });

  it('translate close tab html ids correctly', async function () {
    expect(6).to.equal(htmlCloseTabId2TabId(tabId2HtmlCloseTabId(6)));
  });
});
