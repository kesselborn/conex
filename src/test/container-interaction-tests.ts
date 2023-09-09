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
    const name = `${component}-2-${new Date().toString()}`;
    const container = await browser.contextualIdentities.create({ name: name, color: 'blue', icon: 'circle' });
    await renderMainPage([container]);

    const containerElement = $$(Selectors.containerElements)[1]!;
    typeKey({ key: 'Enter', shiftKey: true }, containerElement!);

    expect((await browser.tabs.query({ cookieStoreId: container.cookieStoreId })).length).to.equal(1);
    await closeContainer(container.cookieStoreId);
  });
});
