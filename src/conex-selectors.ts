import { $ } from './conex-helper.js';

export enum Selectors {
  closeTabName = 'close-tab',
  collapsedContainer = 'collapsed',
  emptyContainerClass = 'empty',
  noMatch = 'no-match',
  openContainerName = 'open-container',
  openTabName = 'open-tab',
  searchId = 'searchId',
  tabClosed = 'closed',
  toggleTabsVisibilityName = 'toggle-tabs-visibility',
}

export class ConexElements {
  static get search(): HTMLInputElement {
    return $(`#${Selectors.searchId}`)! as HTMLInputElement;
  }

  static get form(): HTMLElement {
    return $('form')!;
  }

  static container(cookieStoreId: string): HTMLElement | null {
    return $(`li#${cookieStoreId}`);
  }
}
