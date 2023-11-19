import { $, $$, closeContainer } from '../helper.js';
import { clear, expect, typeKey, waitForTabToAppear, waitForTabToBeActive, waitForTabToBeClosed } from './helper.js';
import { tabId2HtmlId, tabId2HtmlOpenTabId } from '../tab-element.js';
import type { Browser, Tabs } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { ClassSelectors, Ids, IdSelectors, InputNameSelectors, Selectors } from '../constants.js';
import { debug, info } from '../logger.js';
import { renderTabs } from '../containers.js';
import { search } from '../keyboard-input-handler.js';
import { readSettings } from '../settings.js';

let newContainerId: string;
let newTab: Tabs.Tab;
let newTab2: Tabs.Tab;
let testingTab: Tabs.Tab | undefined;

let uniqUrlSearchString = `tab${Math.random()}`.replace('.', '');

declare let browser: Browser;

let component = 'tab-interaction-tests-';

describe(component, function () {
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

    newTab = await browser.tabs.create({
      active: false,
      cookieStoreId: newContainerId,
      url: 'about:blank',
    });
    newTab2 = await browser.tabs.create({
      active: false,
      cookieStoreId: newContainerId,
      url: `about:blank?id=${uniqUrlSearchString}`,
    });

    await renderMainPage(await browser.contextualIdentities.query({}), {
      bookmarks: false,
      history: false,
      order: null,
    });
    await renderTabs(await browser.tabs.query({ cookieStoreId: newContainerId }));
  });

  afterEach(async function () {
    await closeContainer(newContainerId);
    await clear();
    await browser.tabs.update(testingTab!.id, { active: true });
  });

  describe('normal tabs', function () {
    // test does not work but functionality is working ... handing over to future daniel
    it('should open the first tab of the first container when hitting enter on search box', async function () {
      let activeTab = await browser.tabs.query({ active: true });
      expect(`${activeTab[0]!.id}`, 'pre-check: active tab is the testing tab').to.equal(`${testingTab!.id}`);

      const searchElement = $(`#${IdSelectors.searchId}`)! as HTMLInputElement;
      searchElement.value = uniqUrlSearchString;
      await search(uniqUrlSearchString);
      typeKey({ key: 'Enter' }, searchElement);

      activeTab = await browser.tabs.query({ active: true });
      expect(`${activeTab[0]!.id}`, 'when pressing enter, the active tab is tab with the uniqUrlSearchString').to.equal(
        `${newTab2.id}`
      );
    });

    it('should switch tabs when clicking with mouse on the open-tab radio button', async function () {
      let activeTab = await browser.tabs.query({ active: true });
      expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);

      const tabActiveWaiter = waitForTabToBeActive(newTab.id!);
      $(`#${tabId2HtmlOpenTabId(newTab.id!)}`)!.click();

      expect(await tabActiveWaiter, 'tab should become active').to.not.throw;
    });

    it('should switch tabs when hitting enter on tab element', async function () {
      let activeTab = await browser.tabs.query({ active: true });
      expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);

      const tabActiveWaiter = waitForTabToBeActive(newTab.id!);
      typeKey({ key: 'Enter' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
      expect(await tabActiveWaiter, 'tab should become active').to.not.throw;
    });

    it('should switch to first tab in container when hitting enter on container', async function () {
      let activeTab = await browser.tabs.query({ active: true });
      expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);
      debug(component, `active & testing tab id: ${testingTab!.id}; new tab id: ${newTab.id}`);

      const tabElement = $(`#${tabId2HtmlId(newTab.id!)}`)!;
      const containerElement = tabElement.parentElement!.parentElement!;

      const tabActiveWaiter = waitForTabToBeActive(newTab.id!);
      typeKey({ key: 'Enter' }, containerElement);
      expect(await tabActiveWaiter, 'tab should become active').to.not.throw;
    });

    it('should close tab when hitting backspace on tab element', async function () {
      let tab: Tabs.Tab | undefined = await browser.tabs.get(newTab.id!)!;

      // @ts-ignore
      const tabElementToBeDeleted = $(`#${tabId2HtmlId(newTab.id!)}`)!;
      expect(tab.id, 'make sure we have the right tab').to.equal(newTab.id);

      const tabClosedWaiter = waitForTabToBeClosed(newTab.id!);
      typeKey({ key: 'Backspace' }, tabElementToBeDeleted);

      expect(await tabClosedWaiter, 'tab should be removed').to.not.throw;

      expect(
        tabElementToBeDeleted.classList.contains(ClassSelectors.tabClosed),
        'make sure tab element contains "tab-closed" style'
      ).to.be.true;
      expect(tabElementToBeDeleted.dataset['url'], 'tab url is saved in dataset-url').to.equal(newTab.url);
    });

    it('should jump to next item after closing tab', async function () {
      for (const e of Array.from($$(`.${ClassSelectors.collapsedContainer}`)!)) {
        e.classList.remove(ClassSelectors.collapsedContainer);
      }
      info(component, 'entering test:', 'should jump to next item after closing tab');
      let tab;
      try {
        tab = await browser.tabs.get(newTab.id!);
      } catch (_) {}

      // @ts-ignore
      expect(tab.id, 'make sure we have the correct tab').to.equal(newTab.id);
      const tabClosedWaiter = waitForTabToBeClosed(newTab.id!);
      typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
      expect(await tabClosedWaiter, 'tab should be removed').to.not.throw;

      expect(document.activeElement!.id, 'should jump to the next tab when the other tab was closed').to.equal(
        tabId2HtmlId(newTab2.id!)
      );
    });

    it('should close tab when clicking the close radio button', async function () {
      let tab;
      try {
        tab = await browser.tabs.get(newTab.id!);
      } catch (_) {}

      // @ts-ignore
      expect(tab.id, 'we have the correct tab').to.equal(newTab.id);
      const tabElementToBeDeleted = $(`#${tabId2HtmlId(newTab.id!)}`)!;

      const tabClosedWaiter = waitForTabToBeClosed(newTab.id!);
      typeKey({ key: 'Backspace' }, tabElementToBeDeleted);
      expect(await tabClosedWaiter, 'tab should be removed').to.not.throw;

      expect(tabElementToBeDeleted.classList.contains(ClassSelectors.tabClosed)).to.be.true;
      expect(tabElementToBeDeleted.dataset['url']).to.equal(newTab.url);
    });
  });

  describe('history tabs', function () {
    beforeEach(async function () {
      expect((await readSettings()).includeHistory, 'history support must be enabled for testing').to.equal(true);
    });

    it('should open new tab when clicking with mouse on the open-tab radio button in a history item', async function () {
      // hack the new container to be the history container
      $(`#${newContainerId}`)!.id = Ids.historyCookieStoreId;
      const historyContainer = $(`#${Ids.historyCookieStoreId}`)!;

      const tabCnt = (await browser.tabs.query({})).length;
      const historyTab = $$(Selectors.tabElements, historyContainer)[1]!;

      historyTab.dataset['url'] += '-conex-history-opener-test-mouse';

      const newTabWaiter = waitForTabToAppear(historyTab.dataset['url']!);
      $(`input[name="${InputNameSelectors.openTab}"]`, historyTab)!.click();
      expect(await newTabWaiter, 'new tab should be created').to.not.throw;

      const tabCntNew = (await browser.tabs.query({})).length;
      expect(tabCntNew, 'expect click on history item to open a new tab').to.equal(tabCnt + 1);

      const activeTab = (await browser.tabs.query({ active: true }))[0]!;
      expect(activeTab.url, 'the current tab is the history item tab').to.equal(historyTab.dataset['url']);
      await browser.tabs.remove(await newTabWaiter);
    });

    it('should open new tab when hitting enter on a history item', async function () {
      // hack the new container to be the history container
      $(`#${newContainerId}`)!.id = Ids.historyCookieStoreId;
      const historyContainer = $(`#${Ids.historyCookieStoreId}`)!;

      const tabCnt = (await browser.tabs.query({})).length;
      const historyTab = $$(Selectors.tabElements, historyContainer)[1]!;
      historyTab.dataset['url'] += '-conex-history-opener-test-keyboard';

      const newTabWaiter = waitForTabToAppear(historyTab.dataset['url']!);
      typeKey({ key: 'Enter' }, historyTab);
      expect(await newTabWaiter, 'new tab should be created').to.not.throw;

      const tabCntNew = (await browser.tabs.query({})).length;
      expect(tabCntNew, 'expect click on history item to open a new tab').to.equal(tabCnt + 1);

      const activeTab = (await browser.tabs.query({ active: true }))[0]!;
      expect(activeTab.url, 'the current tab is the history item tab').to.equal(historyTab.dataset['url']);
      await browser.tabs.remove(await newTabWaiter);
    });
  });

  describe('bookmark tabs', function () {
    beforeEach(async function () {
      expect((await readSettings()).includeHistory, 'bookmark support must be enabled for testing').to.equal(true);
    });

    afterEach(async function () {});

    it('should open new tab when clicking with mouse on the open-tab radio button in a bookmark item', async function () {
      // hack the new container to be the bookmark container
      $(`#${newContainerId}`)!.id = Ids.bookmarksCookieStoreId;
      const bookmarkContainer = $(`#${Ids.bookmarksCookieStoreId}`)!;

      const tabCnt = (await browser.tabs.query({})).length;
      const bookmarkTab = $$(Selectors.tabElements, bookmarkContainer)[1]!;
      bookmarkTab.dataset['url'] += '-conex-bookmark-opener-test-mouse';

      const newTabWaiter = waitForTabToAppear(bookmarkTab.dataset['url']!);

      $(`input[name="${InputNameSelectors.openTab}"]`, bookmarkTab)!.click();

      expect(await newTabWaiter, 'new tab should be created').to.not.throw;

      const tabCntNew = (await browser.tabs.query({})).length;
      expect(tabCntNew, 'expect click on bookmark item to open a new tab').to.equal(tabCnt + 1);

      const activeTab = (await browser.tabs.query({ active: true }))[0]!;
      expect(activeTab.url, 'the current tab is the bookmark item tab').to.equal(bookmarkTab.dataset['url']);

      await browser.tabs.remove(await newTabWaiter);
    });

    it('should open new tab when hitting enter on a bookmark item', async function () {
      // hack the new container to be the bookmark container
      $(`#${newContainerId}`)!.id = Ids.bookmarksCookieStoreId;
      const bookmarkContainer = $(`#${Ids.bookmarksCookieStoreId}`)!;

      const tabCnt = (await browser.tabs.query({})).length;

      const bookmarkTab = $$(Selectors.tabElements, bookmarkContainer)[1]!;
      bookmarkTab.dataset['url'] += '-conex-bookmark-opener-test-keyboard';

      const newTabWaiter = waitForTabToAppear(bookmarkTab.dataset['url']!);
      typeKey({ key: 'Enter' }, bookmarkTab);
      expect(await newTabWaiter, 'new tab should be created').to.not.throw;

      const tabCntNew = (await browser.tabs.query({})).length;
      expect(tabCntNew, 'expect click on bookmark item to open a new tab').to.equal(tabCnt + 1);

      const activeTab = (await browser.tabs.query({ active: true }))[0]!;
      expect(activeTab.url, 'the current tab is the bookmark item tab').to.equal(bookmarkTab.dataset['url']);
      await browser.tabs.remove(await newTabWaiter);
    });
  });
});
