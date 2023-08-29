import { $, $$, closeContainer } from '../helper.js';
import { renderTabs } from '../containers.js';
import { clear, expect, timeoutResolver, typeKey } from './helper.js';
import { tabId2HtmlId, tabId2HtmlOpenTabId } from '../tab-element.js';
import type { Browser, Tabs } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { Selectors } from '../selectors.js';
import { debug, info } from '../logger.js';

let newContainerId: string;
let newTab: Tabs.Tab;
let newTab2: Tabs.Tab;
let testingTab: Tabs.Tab | undefined;

declare let browser: Browser;

const component = 'tab-interaction-tests';

describe(component, function () {
  before(async function () {
    testingTab = (await browser.tabs.query({ active: true }))[0];
  });

  beforeEach(async function () {
    await clear();
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
      url: 'about:blank',
    });

    await renderMainPage(await browser.contextualIdentities.query({}));
    await renderTabs(browser.tabs.query({ cookieStoreId: newContainerId }));
  });

  afterEach(async function () {
    await browser.tabs.update(testingTab!.id, { active: true });
    await clear();
    await closeContainer(newContainerId);
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
    debug(component, 'entering test:', 'should switch to first tab in container when hitting enter on container');
    let activeTab = await browser.tabs.query({ active: true });
    expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);
    debug(component, `active & testing tab id: ${testingTab!.id}; new tab id: ${newTab.id}`);

    const tabElement = $(`#${tabId2HtmlId(newTab.id!)}`)!;
    const containerElement = tabElement.parentElement!.parentElement!;

    typeKey({ key: 'Enter' }, containerElement);

    // let the event handling do its work
    timeoutResolver(200);

    activeTab = await browser.tabs.query({ active: true });
    expect(`new-tab-id-${activeTab[0]!.id}`).to.equal(`new-tab-id-${newTab.id}`);
  });

  it('should open a new container tab when hitting enter on a container', async function () {
    expect(false, true);
    let activeTab = await browser.tabs.query({ active: true });
    expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);

    typeKey({ key: 'Enter' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    timeoutResolver(100);

    activeTab = await browser.tabs.query({ active: true });
    expect(`new-tab-id-${activeTab[0]!.id}`).to.equal(`new-tab-id-${newTab.id}`);
  });

  it('should open the first tab of the first container when hitting enter on search box', async function () {
    expect(false, true);
    let activeTab = await browser.tabs.query({ active: true });
    expect(`testing-tab-id-${activeTab[0]!.id}`).to.equal(`testing-tab-id-${testingTab!.id}`);

    typeKey({ key: 'Enter' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    timeoutResolver(100);

    activeTab = await browser.tabs.query({ active: true });
    expect(`new-tab-id-${activeTab[0]!.id}`).to.equal(`new-tab-id-${newTab.id}`);
  });

  it('should close tab when hitting backspace on tab element', async function () {
    let tab;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}

    // @ts-ignore
    expect(tab.id).to.equal(newTab.id);
    typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    await timeoutResolver(200);

    tab = undefined;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}
    expect(tab).to.be.undefined;
    expect($(`#${tabId2HtmlId(newTab.id!)}`)!.classList.contains(Selectors.tabClosed)).to.be.true;
    expect($(`#${tabId2HtmlId(newTab.id!)}`)!.dataset['url']).to.equal(newTab.url);
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
    expect(tab.id).to.equal(newTab.id);
    typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    await timeoutResolver(200);
    debug(component, document.activeElement);
    expect(document.activeElement!.id).to.equal(tabId2HtmlId(newTab2.id!));

    tab = undefined;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}
    expect(tab).to.be.undefined;
  });

  it('should close tab when clicking the close radio button', async function () {
    let tab;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}

    // @ts-ignore
    expect(tab.id).to.equal(newTab.id);
    typeKey({ key: 'Backspace' }, $(`#${tabId2HtmlId(newTab.id!)}`)!);
    // let the event handling do its work
    await timeoutResolver(200);

    tab = undefined;
    try {
      tab = await browser.tabs.get(newTab.id!);
    } catch (_) {}
    expect(tab).to.be.undefined;
    expect($(`#${tabId2HtmlId(newTab.id!)}`)!.classList.contains(Selectors.tabClosed)).to.be.true;
    expect($(`#${tabId2HtmlId(newTab.id!)}`)!.dataset['url']).to.equal(newTab.url);
  });
});
