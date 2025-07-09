import { Browser, Tabs } from 'webextension-polyfill';
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

async function openNewTabInSameContainer(newTab: Tabs.Tab): Promise<void> {
  newTabs.add(newTab.id);
  const openInSameContainerOption = (await readSettings()).openTabInSameContainer;
  if (openInSameContainerOption) {
    const newTabUrl = (await browser.browserSettings.newTabPageOverride.get({})).value as string;
    debug(
      component,
      `checking whether to open in same container; newTabUrl from settings: ${newTabUrl}, newTab.id: ${newTab.id}, newTab.url: ${newTab.url}, newTab.openerTabId: ${newTab.openerTabId}, newTab.cookieStoreId: ${newTab.cookieStoreId}, openTabInSameContainerOption: ${openInSameContainerOption}`
    ).then();
    if (
      newTab.url === newTabUrl &&
      newTab.openerTabId === undefined &&
      newTab.cookieStoreId === Ids.defaultCookieStoreId &&
      openInSameContainerOption
    ) {
      debug(component, `last cookieStoreID is: ${lastCookieStoreId}`).then();
      const waiters: Promise<void | Tabs.Tab>[] = [];
      if (newTab.cookieStoreId !== lastCookieStoreId) {
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

browser.tabs.onCreated.addListener(openNewTabInSameContainer);
browser.tabs.onActivated.addListener(showHideTabsCallback);
browser.tabs.onActivated.addListener(setLastCookieStoreId);
browser.tabs.onUpdated.addListener((tabId) => newTabs.delete(tabId));

browser.windows.onFocusChanged.addListener(async (windowId) => {
  const tabs = await browser.tabs.query({ active: true, windowId: windowId });
  if (tabs.length > 0) {
    lastCookieStoreId = tabs[0]!.cookieStoreId!;
  }
});

// async function showContainerSelectionOnNewTabs(
//   requestDetails: WebRequest.OnBeforeRequestDetailsType
// ): Promise<WebRequest.BlockingResponse> {
//   debug(component, 'checking whether to open container selector');
// 
//   const settings = await readSettings();
//   if (requestDetails.tabId < 0) {
//     debug(component, '    nope: tabId is < 0');
//     return { cancel: false };
//   }
// 
//   const tab = browser.tabs.get(requestDetails.tabId);
// 
//   if (
//     (!requestDetails.originUrl || requestDetails.originUrl === browser.runtime.getURL('')) &&
//     newTabs.has(requestDetails.tabId) &&
//     requestDetails.url.startsWith('http')
//   ) {
//     if (settings.askContainer) {
//       const redirectUrl = browser.runtime.getURL(`container-selector.html?url=${requestDetails.url}`)
//       debug(component, `is new tab ... will redirecting to ${redirectUrl}`, newTabs.has(requestDetails.tabId), requestDetails, await tab);
//       return { redirectUrl };
//     } else {
//       debug(component, 're-opening tab in ', lastCookieStoreId, await tab);
//       browser.tabs.create({
//         active: (await tab).active,
//         openerTabId: Number(requestDetails.tabId),
//         cookieStoreId: lastCookieStoreId,
//         url: requestDetails.url,
//       });
//       browser.tabs.remove(Number(requestDetails.tabId));
// 
//       return { cancel: true };
//     }
//   } else {
//     return { cancel: false };
//   }
// }


async function setupRequestInterceptor() {
  const settings = await readSettings();
  if (typeof browser.webRequest == 'object' && settings.askContainer) {
    info(component, 'set up request interceptor');
    //  browser.webRequest.onBeforeRequest.addListener(
    //    showContainerSelectionOnNewTabs,
    //    { urls: ['<all_urls>'], types: ['main_frame'] },
    //    ['blocking']
    //  );
  }

}
setupRequestInterceptor();
browser.storage.onChanged.addListener((_change, area) => {
  if (area === "local") {
    setupRequestInterceptor();
  }
})


// TODO: test somehow?
// external link detector
browser.tabs.onCreated.addListener(tab => {
  if (tab.url === 'about:blank' && tab.openerTabId === undefined && tab.cookieStoreId === Ids.defaultCookieStoreId) {
    debug(component, "link detector executed!");
    newTabs.add(tab.id);
  }
});

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
