import { $ } from '../helper.js';
import { renderTabs } from '../containers.js';
import { clear, expect, fakeContainers, maxTabId, typeKey } from './helper.js';
import { tabId2HtmlId } from '../tab-element.js';
import { Selectors } from '../selectors.js';
import { Tabs } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { debug, info } from '../logger.js';
import Tab = Tabs.Tab;

// TODO: when typing, restart search
const component = 'keyboard-action-tests';

describe(component, function () {
  afterEach(clear);

  it('should react on collapse / un-collapse keys', async function () {
    info(component, 'entering test:', 'should react on collapse / un-collapse keys');
    await renderMainPage(fakeContainers);
    const firstFakeContainer = fakeContainers[0]!;
    const lastFakeContainer = fakeContainers[fakeContainers.length - 1]!;

    let cnt = 0;
    let tabIdOffset = await maxTabId();

    for (const container of [firstFakeContainer, lastFakeContainer]) {
      const fakeTabs = Array.from([
        {
          cookieStoreId: container.cookieStoreId,
          id: tabIdOffset + cnt++,
          title: `tab 0 / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: tabIdOffset + cnt++,
          title: `tab 1 / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
      ]) as Array<Tab>;

      await renderTabs(Promise.resolve(fakeTabs));
    }

    const firstFakeContainerElement = $(`#${firstFakeContainer.cookieStoreId}`)!;
    const firstTabInFirstFakeContainerElement = $(`#${tabId2HtmlId(tabIdOffset)}`)!;
    const lastFakeContainerElement = $(`#${lastFakeContainer.cookieStoreId}`)!;
    const tabInLastFakeContainerElement = $(`#${tabId2HtmlId(tabIdOffset + 3)}`)!;

    // when collapsing on a container element, go to the next container element
    debug(component, '    1 arrow left');
    firstFakeContainerElement.classList.remove(Selectors.collapsedContainer);
    firstFakeContainerElement.focus();
    expect(document.activeElement!.classList.contains(Selectors.collapsedContainer)).to.be.false;
    typeKey({ key: 'ArrowLeft' }, document.activeElement!);
    expect(firstFakeContainerElement.classList.contains(Selectors.collapsedContainer)).to.be.true;
    expect(document.activeElement!).to.equal(firstFakeContainerElement.nextElementSibling);

    debug(component, '    2 arrow right');
    firstFakeContainerElement.focus();
    typeKey({ key: 'ArrowRight' }, document.activeElement!);
    expect(document.activeElement!.classList.contains(Selectors.collapsedContainer)).to.be.false;
    expect(document.activeElement!).to.equal(firstFakeContainerElement);

    // when collapsing on a tab element, jump to the next container element
    debug(component, '    3 arrow left');
    firstTabInFirstFakeContainerElement.focus();
    typeKey({ key: 'ArrowLeft' }, document.activeElement!);
    expect(firstFakeContainerElement.classList.contains(Selectors.collapsedContainer)).to.be.true;
    expect(document.activeElement!).to.equal(firstFakeContainerElement.nextElementSibling);

    debug(component, '    4 arrow right');
    typeKey({ key: 'ArrowRight' }, document.activeElement!);

    // when collapsing on a tab element of the _last_ container element, jump to the current container element
    tabInLastFakeContainerElement.focus();
    debug(component, '    5 arrow left');
    typeKey({ key: 'ArrowLeft' }, tabInLastFakeContainerElement);
    expect(lastFakeContainerElement.classList.contains(Selectors.collapsedContainer)).to.be.true;
    expect(document.activeElement!).to.equal(lastFakeContainerElement);
  });
});
