import { $ } from './helper.js';
import { Browser } from 'webextension-polyfill';

declare let browser: Browser;

export enum Selectors {
  closeTabName = 'close-tab',
  collapsedContainer = 'collapsed',
  emptyContainerClass = 'empty',
  openContainerName = 'open-container',
  openTabName = 'open-tab',
  searchId = 'searchId',
  tabClosed = 'closed',
  toggleTabsVisibilityName = 'toggle-tabs-visibility',

  // no variable substitution in enums .. remember to adjust all values if you change one
  noMatch = 'no-match',
  containerElements = 'ol>li',
  containerElementsNoMatch = `ol>li.no-match`,
  containerElementsMatch = `ol>li:not(.no-match)`,
  tabElements = 'ul>li',
  tabElementsNoMatch = 'ul>li.no-match',
  tabElementsMatch = 'ul>li:not(.no-match)',
}

export class ConexElements {
  static get search(): HTMLInputElement {
    return $(`#${Selectors.searchId}`)! as HTMLInputElement;
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
