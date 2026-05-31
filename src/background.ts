import { Browser, Tabs, WebRequest } from 'webextension-polyfill';
import { Ids } from './constants.js';
import { debug, info } from './logger.js';
import { readSettings } from './settings.js';
import { showHideTabs } from './tab-management.js';

interface OnActivatedActiveInfoType {
  tabId: number;
  previousTabId?: number;
  windowId: number;
}

const component = 'background';

debug(component, '👋').then();

declare let browser: Browser;

let lastCookieStoreId = Ids.defaultCookieStoreId as string;

// we save tab ids of tabs, that get freshly created but probably discarded as they should
// be opened in the same container ... otherwise, we will show/hide default container tabs
// unnecessarily
const newTabs = new Set();

// URLs the selector just dispatched; bypassed by webRequest once.
const dispatchedFromSelector = new Map<string, number>();
const dispatchedFromSelectorTtlMs = 10_000;

function normalizeUrl(u: string): string {
  try {
    return new URL(u).href;
  } catch {
    return u;
  }
}

// Marking and tabs.create must happen in the same JS turn so webRequest sees
// the URL in the map; selector-side sendMessage→tabs.create is racy.
browser.runtime.onMessage.addListener((msg: unknown) => {
  if (
    msg &&
    typeof msg === 'object' &&
    (msg as { type?: unknown }).type === 'openInContainerFromSelector' &&
    typeof (msg as { url?: unknown }).url === 'string' &&
    typeof (msg as { cookieStoreId?: unknown }).cookieStoreId === 'string'
  ) {
    const m = msg as { url: string; cookieStoreId: string; windowId?: number };
    const normalized = normalizeUrl(m.url);
    dispatchedFromSelector.set(normalized, Date.now());
    debug(component, `openInContainerFromSelector ${normalized} -> ${m.cookieStoreId}`).then();

    const createOptions: Tabs.CreateCreatePropertiesType = {
      active: true,
      cookieStoreId: m.cookieStoreId,
      url: m.url,
    };
    if (typeof m.windowId === 'number') {
      createOptions.windowId = m.windowId;
    }
    return browser.tabs.create(createOptions).then(() => ({ ok: true }));
  }
  return Promise.resolve();
});

async function setLastCookieStoreId(activeInfo: OnActivatedActiveInfoType) {
  if (!newTabs.has(activeInfo.tabId)) {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (
      (tab.url !== 'about:blank' || (tab.url === 'about:blank' && tab.cookieStoreId !== Ids.defaultCookieStoreId)) &&
      tab.cookieStoreId !== lastCookieStoreId &&
      !tab.cookieStoreId!.startsWith(Ids.privateCookieStorePrefix)
    ) {
      await debug(component, `cookieStoreId changed from ${lastCookieStoreId} -> ${tab.cookieStoreId}`);
      lastCookieStoreId = tab.cookieStoreId!;
    }
  }
}

// @ts-ignore
async function showHideTabsCallback(activeInfo: OnActivatedActiveInfoType) {
  if (!newTabs.has(activeInfo.tabId)) {
    const tab = await browser.tabs.get(activeInfo.tabId);
    await showHideTabs(tab, lastCookieStoreId);
  }
}

// Heuristic: no originUrl + no openerTabId + default container = external open.
// Same approach as temporary-containers / MAC.
async function showContainerSelectionOnExternalLinks(
  requestDetails: WebRequest.OnBeforeRequestDetailsType
): Promise<WebRequest.BlockingResponse> {
  debug(component, `external link check: tabId: ${requestDetails.tabId}, originUrl: ${requestDetails.originUrl}, url: ${requestDetails.url}`);

  if (requestDetails.tabId < 0) {
    debug(component, '    nope: tabId is < 0');
    return { cancel: false };
  }

  if (!requestDetails.url.startsWith('http')) {
    debug(component, '    nope: not an http(s) url');
    return { cancel: false };
  }

  // Bypass + burn entries dispatched by the selector.
  const requestUrlNormalized = normalizeUrl(requestDetails.url);
  const dispatchedAt = dispatchedFromSelector.get(requestUrlNormalized);
  if (dispatchedAt !== undefined && Date.now() - dispatchedAt < dispatchedFromSelectorTtlMs) {
    dispatchedFromSelector.delete(requestUrlNormalized);
    debug(component, `    nope: dispatched from container-selector (${requestUrlNormalized})`);
    return { cancel: false };
  }
  for (const [url, ts] of dispatchedFromSelector) {
    if (Date.now() - ts >= dispatchedFromSelectorTtlMs) dispatchedFromSelector.delete(url);
  }

  if (requestDetails.originUrl && requestDetails.originUrl !== browser.runtime.getURL('')) {
    debug(component, `    nope: originUrl is set (${requestDetails.originUrl})`);
    return { cancel: false };
  }

  // tabs.get is reliable; tabs.onCreated is racy with this event.
  let tab: Tabs.Tab;
  try {
    tab = await browser.tabs.get(requestDetails.tabId);
  } catch (e) {
    debug(component, '    nope: tabs.get failed', e);
    return { cancel: false };
  }

  if (
    tab.cookieStoreId &&
    tab.cookieStoreId !== Ids.defaultCookieStoreId &&
    !tab.cookieStoreId.startsWith(Ids.privateCookieStorePrefix)
  ) {
    debug(component, `    nope: tab already in non-default container ${tab.cookieStoreId}`);
    return { cancel: false };
  }

  if (tab.openerTabId !== undefined) {
    debug(component, `    nope: tab has openerTabId ${tab.openerTabId}`);
    return { cancel: false };
  }

  const settings = await readSettings();
  if (settings.askContainer) {
    const redirectUrl = browser.runtime.getURL(
      `container-selector.html?url=${encodeURIComponent(requestDetails.url)}`
    );
    debug(component, `    yes: redirecting to ${redirectUrl}`, requestDetails, tab);
    return { redirectUrl };
  } else {
    debug(component, '    re-opening tab in', lastCookieStoreId, tab);
    browser.tabs.create({
      active: tab.active,
      cookieStoreId: lastCookieStoreId,
      url: requestDetails.url,
    });
    browser.tabs.remove(requestDetails.tabId);
    return { cancel: true };
  }
}

// TODO: test with askContainer option true / false
async function openNewTabInSameContainer(newTab: Tabs.Tab): Promise<void> {
  newTabs.add(newTab.id);
  const openInSameContainerOption = (await readSettings()).openTabInSameContainer;
  if (openInSameContainerOption) {
    const newTabUrl = (await browser.browserSettings.newTabPageOverride.get({})).value as string;
    debug(
      component,
      `same container check: newTabUrl from settings: ${newTabUrl}, newTab.id: ${newTab.id}, newTab.url: ${newTab.url}, newTab.openerTabId: ${newTab.openerTabId}, newTab.cookieStoreId: ${newTab.cookieStoreId}, openTabInSameContainerOption: ${openInSameContainerOption}`
    ).then();
    if (
      openInSameContainerOption &&
      newTab.url === newTabUrl &&
      newTab.openerTabId === undefined &&
      newTab.cookieStoreId === Ids.defaultCookieStoreId
    ) {
      debug(component, `    last cookieStoreID is: ${lastCookieStoreId}`).then();
      const waiters: Promise<void | Tabs.Tab>[] = [];
      if (newTab.cookieStoreId !== lastCookieStoreId) {
        debug(component, `    opening tab in last used container`).then();
        waiters.push(browser.tabs.remove(newTab.id!));
        waiters.push(
          browser.tabs.create({
            windowId: newTab.windowId,
            cookieStoreId: lastCookieStoreId,
          })
        );
        await Promise.all(waiters);
      }
    } else {
      lastCookieStoreId = newTab.cookieStoreId!;
      await showHideTabs(newTab);
    }
    newTabs.delete(newTab.id);
  } else {
    await showHideTabs(newTab);
  }
}

browser.tabs.onActivated.addListener(showHideTabsCallback);
browser.tabs.onActivated.addListener(setLastCookieStoreId);
browser.tabs.onUpdated.addListener((tabId) => newTabs.delete(tabId));

browser.windows.onFocusChanged.addListener(async (windowId) => {
  const tabs = await browser.tabs.query({ active: true, windowId: windowId });
  if (tabs.length > 0) {
    lastCookieStoreId = tabs[0]!.cookieStoreId!;
  }
});


async function setupRequestInterceptor() {
  const settings = await readSettings();
  if (typeof browser.webRequest == 'object' && settings.askContainer) {
    info(component, 'set up request interceptor');
    browser.webRequest.onBeforeRequest.addListener(
      showContainerSelectionOnExternalLinks,
      { urls: ['<all_urls>'], types: ['main_frame'] },
      ['blocking']
    );
  }

  if (!(await readSettings()).askContainer) {
    browser.tabs.onCreated.addListener(openNewTabInSameContainer);
  }
}
setupRequestInterceptor();
// browser.storage.onChanged.addListener((_change, area) => {
//   if (area === "local") {
//     setupRequestInterceptor();
//   }
// })


// async function newEmptyTabDetector(tab: Tabs.Tab) {
//   const newTabUrl = (await browser.browserSettings.newTabPageOverride.get({})).value as string;
//   debug(component, `new tab detector: tab.url: ${tab.url}, new tab url: ${newTabUrl}, tab.Id: ${tab.Id}, tab.openerTabId: ${tab.openerTabId}, tab.cookieStoreId: ${tab.cookieStoreId}`);
//   if (tab.url === newTabUrl && tab.openerTabId === undefined && tab.cookieStoreId === Ids.defaultCookieStoreId) {
//     debug(component, "    yep: it's a new tab");
//     newTabs.add(tab.id);
//     openNewTabInSameContainer(tab)
//   } else {
//     debug(component, "    not a new tab!");
//   }
// }

// TODO: test somehow?
browser.tabs.onCreated.addListener(openNewTabInSameContainer)

// const closeIfReopened = async function(tab) {
//   if(!settings['close-reopened-tabs']) {
//     return;
//   }
//
//   const title = tab.title;
//   const index = tab.index;
//   const potentialOpenerIndex = index - 1;
//
//   if(potentialOpenerIndex < 0) {
//     return;
//   }
//
//   try {
//     const potentialOpeners = await browser.tabs.query({index: potentialOpenerIndex});
//     if(potentialOpeners.length > 0) {
//       if(potentialOpeners[0].url.includes(title)) {
//         console.info("detected re-opening of", potentialOpeners[0], " ... closing original tab");
//         await browser.tabs.remove(potentialOpeners[0].id);
//         showCurrentContainerTabsOnly(tab.id);
//       }
//     }
//   } catch(e) { console.debug(`error closing reopened tab with index: ${potentialOpenerIndex}, url: ${title}: ${e}`); }
// }
// browser.tabs.onCreated.addListener(tab => {
//   if(tab.url == 'about:blank') {
//     closeIfReopened(tab);
//   }
// });

// const openInDifferentContainer = function(cookieStoreId, tab) {
//   const tabProperties = {
//     active: true,
//     cookieStoreId: cookieStoreId,
//     index: tab.index+1
//   };
//
//   if(tab.url != 'about:newtab' && tab.url != 'about:blank') {
//     tabProperties.url = tab.url;
//   }
//
//   browser.tabs.create(tabProperties);
//   browser.tabs.remove(tab.id);
// }
//
// browser.tabs.onCreated.addListener(tab => {
//   if(tab.url == 'about:newtab' && tab.openerTabId == undefined && tab.cookieStoreId == defaultCookieStoreId && lastCookieStoreId != defaultCookieStoreId) {
//     openInDifferentContainer(lastCookieStoreId, tab);
//   }
// });
