import { clear, expect, waitForTabToAppear } from './helper.js';
import { closeContainer } from '../helper.js';
import type { Browser, Tabs } from 'webextension-polyfill';
import { readSettings, writeSettings } from '../settings.js';
import { Ids } from '../constants.js';

const component = 'container-selector-tests';

declare let browser: Browser;

let newContainerId: string;
let testingTab: Tabs.Tab | undefined;
let newTab: Tabs.Tab;
let openTabInSameContainerSetting: boolean;

describe(component, function () {
  describe('open tab in same container', function () {
    before(async function () {
      testingTab = (await browser.tabs.query({ active: true }))[0];
      openTabInSameContainerSetting = (await readSettings()).openTabInSameContainer;
    });

    after(async function () {
      const settings = await readSettings();
      settings.openTabInSameContainer = openTabInSameContainerSetting;
      await writeSettings(settings);
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
    });

    afterEach(async function () {
      await closeContainer(newContainerId);
      await clear();
      await browser.tabs.update(testingTab!.id, { active: true });
    });

    // Note to self: this test has been shown flaky behaviour connected to overwriting the
    // new tab default in settings
    it('should open tab in same container if open-in-same-container is activated', async function () {
      const settings = await readSettings();
      const newTabUrl = (await browser.browserSettings.newTabPageOverride.get({})).value as string;
      settings.openTabInSameContainer = true;
      await writeSettings(settings);

      const tabCntNewContainerBefore = (await browser.tabs.query({ cookieStoreId: newContainerId })).length;
      const tabCntDefaultContainerBefore = (await browser.tabs.query({ cookieStoreId: Ids.defaultCookieStoreId }))
        .length;

      await browser.tabs.update(newTab.id, { active: true });

      const waiter = waitForTabToAppear(newTabUrl);
      const newTabId = (await browser.tabs.create({})).id!;
      await waiter;

      const tabCntNewContainer = (await browser.tabs.query({ cookieStoreId: newContainerId })).length;
      const tabCntDefaultContainer = (await browser.tabs.query({ cookieStoreId: Ids.defaultCookieStoreId })).length;

      expect(
        tabCntDefaultContainerBefore,
        'NOTE: IF THIS FAILS, MAKE SURE YOUR NEW TABS SETTING IS SET TO FIREFOX HOME ... default container should have the same tab count'
      ).to.be.equal(tabCntDefaultContainer);
      expect(tabCntNewContainerBefore + 1, 'new container should have one additional tab').to.be.equal(
        tabCntNewContainer
      );
      try {
        await browser.tabs.remove(newTabId);
      } catch (_) {}
    });

    it('should open tab in default container if open-in-same-container is deactivated', async function () {
      const settings = await readSettings();
      settings.openTabInSameContainer = false;
      await writeSettings(settings);

      const tabCntNewContainerBefore = (await browser.tabs.query({ cookieStoreId: newContainerId })).length;
      const tabCntDefaultContainerBefore = (await browser.tabs.query({ cookieStoreId: Ids.defaultCookieStoreId }))
        .length;

      await browser.tabs.update(newTab.id, { active: true });

      const newTabId = (await browser.tabs.create({})).id!;

      const tabCntNewContainer = (await browser.tabs.query({ cookieStoreId: newContainerId })).length;
      const tabCntDefaultContainer = (await browser.tabs.query({ cookieStoreId: Ids.defaultCookieStoreId })).length;

      expect(tabCntDefaultContainerBefore + 1, 'default container should have one additional tab').to.be.equal(
        tabCntDefaultContainer
      );
      expect(tabCntNewContainerBefore, 'new container should have the same tab count').to.be.equal(tabCntNewContainer);
      await browser.tabs.remove(newTabId);
    });
  });
});
