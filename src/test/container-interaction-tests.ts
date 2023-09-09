import { $$, closeContainer } from '../helper.js';
import { expect, typeKey } from './helper.js';
import type { Browser } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { Selectors } from '../selectors.js';

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

  it('opens a new tab when pressing shift enter on container', async function () {
    const testTab = (await browser.tabs.query({ active: true }))[0]!;
    const name = `${component}-2-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await renderMainPage([container]);

    const containerElement = $$(Selectors.containerElements)[1]!;
    // if the container is empty, open a new tab
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
});
