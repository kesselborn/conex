import { $, $$, closeContainer } from '../helper.js';
import { expect, timeoutResolver, typeKey } from './helper.js';
import type { Browser } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { Selectors } from '../constants.js';
import { debug } from '../logger.js';

declare let browser: Browser;

const component = 'container-interaction-tests';

describe(component, function () {
  it('should close tabs before closing the container', async function () {
    const tabCntBefore = (await browser.tabs.query({})).length;
    const name = `${component}-1-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await browser.tabs.create({ active: false, cookieStoreId: container.cookieStoreId });

    await closeContainer(container.cookieStoreId);
    const tabCntAfter = (await browser.tabs.query({})).length;

    expect(tabCntAfter).to.equal(tabCntBefore);
  });

  it('opens a new tab when pressing shift enter on container or enter on an empty container', async function () {
    const testTab = (await browser.tabs.query({ active: true }))[0]!;
    const name = `${component}-2-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await renderMainPage([container]);

    const containerElement = $$(Selectors.containerElements)[1]!;
    // if the container is empty, open a new tab on enter
    typeKey({ key: 'Enter', shiftKey: false }, containerElement!);
    await browser.tabs.update(testTab.id, { active: true });

    // if container has tabs but Enter + Shift is pressed: open new tab
    typeKey({ key: 'Enter', shiftKey: true }, containerElement!);
    await browser.tabs.update(testTab.id, { active: true });

    // if the container is not empty, just jump to the tab
    typeKey({ key: 'Enter', shiftKey: false }, containerElement!);
    await browser.tabs.update(testTab.id, { active: true });

    expect((await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length).to.equal(2);
    await closeContainer(container.cookieStoreId);
  });

  it('delete container on backspace: no confirmation on empty containers', async function () {
    const name = `${component}-3-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    const confirmFunction = window.confirm;

    let confirmCalled = false;
    window.confirm = function (_?: string) {
      confirmCalled = true;
      return true;
    };

    await renderMainPage([container], { bookmarks: false, history: false, order: [container.cookieStoreId] });

    expect(
      (await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length,
      'no tabs in container'
    ).to.equal(0);
    expect(
      (await browser.contextualIdentities.query({ name: container.name })).length,
      'container should exist'
    ).to.equal(1);

    const containerElement = $$(Selectors.containerElements)[0]!;

    typeKey({ key: 'Backspace' }, containerElement);
    await timeoutResolver(100);
    console.log(containerElement);
    expect(
      (await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length,
      'tab count after confirm should be 0'
    ).to.equal(0);
    expect(
      (await browser.contextualIdentities.query({ name: container.name })).length,
      'container should not exist anymore'
    ).to.equal(0);
    expect(containerElement.classList.contains(Selectors.noMatch), 'container element should be hidden').to.equal(true);
    expect(confirmCalled, 'confirm should not have been called').to.equal(false);
    window.confirm = confirmFunction;
  });

  it('delete container on backspace', async function () {
    const name = `${component}-3-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await browser.tabs.create({
      active: false,
      cookieStoreId: container.cookieStoreId,
      url: `about:blank?${component}-3-1`,
    });
    await browser.tabs.create({
      active: false,
      cookieStoreId: container.cookieStoreId,
      url: `about:blank?${component}-3-2`,
    });
    const confirmFunction = window.confirm;
    let confirmMessage: string | undefined = '';

    let confirm = false;
    window.confirm = function (message?: string) {
      debug(component, `fake confirm called with message '${message}'`);
      confirmMessage = message;
      return confirm;
    };

    await renderMainPage([container]);

    expect((await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length).to.equal(2);
    expect((await browser.contextualIdentities.query({ name: container.name })).length, 1);

    const containerElement = $$(Selectors.containerElements)[1]!;

    // first try: simulate confirm === false
    confirm = false;
    typeKey({ key: 'Backspace' }, containerElement!);
    await timeoutResolver(100);
    expect(
      (await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length,
      'tabs cnt after abort'
    ).to.equal(2);
    expect(
      (await browser.contextualIdentities.query({ name: container.name })).length,
      'container cnt after abort'
    ).to.equal(1);

    // second try: simulate confirm === true
    confirm = true;
    typeKey({ key: 'Backspace' }, containerElement!);
    await timeoutResolver(100);
    expect(
      (await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length,
      'tab count after confirm'
    ).to.equal(0);
    expect(
      (await browser.contextualIdentities.query({ name: container.name })).length,
      'container count after confirm'
    ).to.equal(0);
    expect(containerElement.classList.contains(Selectors.noMatch)).to.equal(true);
    expect(confirmMessage).to.equal(`Are you sure you want to close ${container.name} and its 2 tabs?`);
    window.confirm = confirmFunction;
  });

  it('delete container on click on close button', async function () {
    const name = `${component}-3-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await browser.tabs.create({
      active: false,
      cookieStoreId: container.cookieStoreId,
      url: `about:blank?${component}-4-1`,
    });
    await browser.tabs.create({
      active: false,
      cookieStoreId: container.cookieStoreId,
      url: `about:blank?${component}-4-2`,
    });
    const confirmFunction = window.confirm;
    let confirmMessage: string | undefined = '';

    let confirm = false;
    window.confirm = function (message?: string) {
      debug(component, `fake confirm called with message '${message}'`);
      confirmMessage = message;
      return confirm;
    };

    await renderMainPage([container]);

    expect((await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length).to.equal(2);
    expect((await browser.contextualIdentities.query({ name: container.name })).length, 1);

    const containerElement = $$(Selectors.containerElements)[1]!;

    confirm = true;

    const closeButton = $('.close', containerElement)! as HTMLInputElement;
    closeButton.click();
    await timeoutResolver(100);
    expect(
      (await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length,
      'tab count after confirm'
    ).to.equal(0);
    expect(
      (await browser.contextualIdentities.query({ name: container.name })).length,
      'container count after confirm'
    ).to.equal(0);
    expect(containerElement.classList.contains(Selectors.noMatch)).to.equal(true);
    expect(confirmMessage).to.equal(`Are you sure you want to close ${container.name} and its 2 tabs?`);
    window.confirm = confirmFunction;
  });
});
