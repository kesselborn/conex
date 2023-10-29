import { $ } from './helper.js';
import { Browser } from 'webextension-polyfill';

declare let browser: Browser;

export enum InputNameSelectors {
  closeContainer = 'close-container',
  closeTab = 'close-tab',
  openContainer = 'open-container',
  openTab = 'open-tab',
  toggleTabsVisibilityName = 'toggle-tabs-visibility',
}

export enum ClassSelectors {
  collapsedContainer = 'collapsed',
  emptyContainer = 'empty',
  noMatch = 'no-match',
  tabClosed = 'closed',
}

export enum IdSelectors {
  searchId = 'searchId',
}

export enum Selectors {
  // no variable substitution in enums .. remember to adjust all values if you change one
  containerElements = 'ol>li',
  containerElementsMatch = `ol>li:not(.no-match)`,
  containerElementsNoMatch = `ol>li.no-match`,
  containerName = 'h2 span:nth-child(1)',
  settingsForm = 'form#settings',
  tabElements = 'ul>li',
  tabElementsMatch = 'ul>li:not(.no-match)',
  tabElementsNoMatch = 'ul>li.no-match',
  tabsCnt = 'h2 span:nth-child(2)',
}

export enum Ids {
  bookmarksCookieStoreId = 'bookmarks',
  historyCookieStoreId = 'history',
}

export class ConexElements {
  static get search(): HTMLInputElement {
    return $(`#${IdSelectors.searchId}`)! as HTMLInputElement;
  }

  static get form(): HTMLElement {
    return $('form')!;
  }

  static get containerList(): HTMLElement | null {
    return $(Selectors.containerElements, ConexElements.form) as HTMLElement;
  }

  static container(cookieStoreId: string): HTMLElement | null {
    return $(`li#${cookieStoreId}`);
  }
}
