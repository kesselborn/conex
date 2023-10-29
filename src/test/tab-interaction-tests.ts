import { $, $$, closeContainer } from '../helper.js';
import { clear, expect, timeoutResolver, typeKey } from './helper.js';
import { tabId2HtmlId, tabId2HtmlOpenTabId } from '../tab-element.js';
import type { Browser, Tabs } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { Selectors } from '../selectors.js';
import { debug, info } from '../logger.js';
import { renderTabs } from '../containers.js';
import { search } from '../keyboard-input-handler.js';

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

  // test does not work but functionality is working ... handing over to future daniel
  it('should open the first tab of the first container when hitting enter on search box', async function () {
    let activeTab = await browser.tabs.query({ active: true });
    expect(`${activeTab[0]!.id}`, 'pre-check: active tab is the testing tab').to.equal(`${testingTab!.id}`);

    const searchElement = $(`#${Selectors.searchId}`)! as HTMLInputElement;
    searchElement.value = uniqUrlSearchString;
    search(uniqUrlSearchString);
    await timeoutResolver(100);
    typeKey({ key: 'Enter' }, searchElement);
    // let the event handling do its work
    await timeoutResolver(200);

    activeTab = await browser.tabs.query({ active: true });
    expect(`${activeTab[0]!.id}`, 'when pressing enter, the active tab is tab with the uniqUrlSearchString').to.equal(
      `${newTab2.id}`
    );
  });

  it('should switch tabs when clicking with mouse on the open-tab radio button', async function () {
    let activeTab = await browser.tabs.query({ active: true });
    expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);

    $(`#${tabId2HtmlOpenTabId(newTab.id!)}`)!.click();
    // let the event handling do its work
    timeoutResolver(100);

    activeTab = await browser.tabs.query({ active: true });
    expect(`new-tab-id-${activeTab[0]!.id}`).to.equal(`new-tab-id-${newTab.id}`);
  });

  it('should switch tabs when hitting enter on tab element', async function () {
    let activeTab = await browser.tabs.query({ active: true });
    expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);

    typeKey({ key: 'Enter' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    timeoutResolver(100);

    activeTab = await browser.tabs.query({ active: true });
    expect(`new-tab-id-${activeTab[0]!.id}`).to.equal(`new-tab-id-${newTab.id}`);
  });

  it('should switch to first tab in container when hitting enter on container', async function () {
    let activeTab = await browser.tabs.query({ active: true });
    expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);
    debug(component, `active & testing tab id: ${testingTab!.id}; new tab id: ${newTab.id}`);

    const tabElement = $(`#${tabId2HtmlId(newTab.id!)}`)!;
    const containerElement = tabElement.parentElement!.parentElement!;

    typeKey({ key: 'Enter' }, containerElement);

    // let the event handling do its work
    await timeoutResolver(200);

    activeTab = await browser.tabs.query({ active: true });
    expect(`new-tab-id-${activeTab[0]!.id}`).to.equal(`new-tab-id-${newTab.id}`);
  });

  it('should close tab when hitting backspace on tab element', async function () {
    let tab: Tabs.Tab | undefined = await browser.tabs.get(newTab.id!)!;

    // @ts-ignore
    const tabElementToBeDeleted = $(`#${tabId2HtmlId(newTab.id!)}`)!;
    expect(tab.id, 'make sure we have the right tab').to.equal(newTab.id);
    typeKey({ key: 'Backspace' }, tabElementToBeDeleted);
    // let the event handling do its work
    await timeoutResolver(200);

    tab = undefined;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}
    expect(tab, 'tab should not exist anymore').to.be.undefined;
    expect(
      tabElementToBeDeleted.classList.contains(Selectors.tabClosed),
      'make sure tab element contains "tab-closed" style'
    ).to.be.true;
    expect(tabElementToBeDeleted.dataset['url'], 'tab url is saved in dataset-url').to.equal(newTab.url);
  });

  it('should jump to next item after closing tab', async function () {
    for (const e of Array.from($$(`.${Selectors.collapsedContainer}`)!)) {
      e.classList.remove(Selectors.collapsedContainer);
    }
    info(component, 'entering test:', 'should jump to next item after closing tab');
    let tab;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}

    // @ts-ignore
    expect(tab.id, 'make sure we have the correct tab').to.equal(newTab.id);
    typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    await timeoutResolver(200);
    debug(component, document.activeElement);
    expect(document.activeElement!.id, 'should jump to the next tab when the other tab was closed').to.equal(
      tabId2HtmlId(newTab2.id!)
    );

    tab = undefined;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}
    expect(tab, 'tab should not exist anymore').to.be.undefined;
  });

  it('should close tab when clicking the close radio button', async function () {
    let tab;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}

    // @ts-ignore
    expect(tab.id, 'we have the correct tab').to.equal(newTab.id);
    const tabElementToBeDeleted = $(`#${tabId2HtmlId(newTab.id!)}`)!;
    typeKey({ key: 'Backspace' }, tabElementToBeDeleted);
    // let the event handling do its work
    await timeoutResolver(200);

    tab = undefined;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}
    expect(tab, 'tab should not exist anymore').to.be.undefined;
    expect(tabElementToBeDeleted.classList.contains(Selectors.tabClosed)).to.be.true;
    expect(tabElementToBeDeleted.dataset['url']).to.equal(newTab.url);
  });
});
