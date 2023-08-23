import { $, $$, $e, _ } from '../conex-helper.js';
import { renderContainers, renderTabs } from '../conex-containers.js';
import { tabId2HtmlId } from '../conex-tab-element.js';
import { clear, expect, fakeContainers, renderMainPageStub } from './conex-test-helper.js';
import { Selectors } from '../conex-selectors.js';
import { Tabs } from 'webextension-polyfill';
import Tab = Tabs.Tab;

const component = 'tabs-rendering-tests';

describe(component, function () {
  afterEach(clear);

  it('should render tabs elements correctly', async function () {
    let tabCnt = 0;

    const searchField = $e('input', { id: Selectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
    const form = $e('form', {}, [searchField]);
    window.document.body.appendChild(form);

    renderMainPageStub();
    await renderContainers(fakeContainers);
    for (const container of fakeContainers) {
      const tabs = Array.from([
        {
          cookieStoreId: container.cookieStoreId,
          id: tabCnt++,
          title: `${container.color} tab`,
          url: `http://example.com/${container.color}`,
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: tabCnt++,
          title: `${container.color} tab 2`,
          url: `http://example.com/${container.color}`,
        },
      ]) as Array<Tab>;

      await renderTabs(Promise.resolve(tabs));
      expect($(`#${tabId2HtmlId(tabCnt - 2)} > input`)!.getAttribute('name')).to.equal(Selectors.openTabName);
      expect($(`#${tabId2HtmlId(tabCnt - 1)} > input`)!.getAttribute('name')).to.equal(Selectors.openTabName);
    }

    expect($$('form ul>li').length).to.equal(tabCnt);
  });
});
