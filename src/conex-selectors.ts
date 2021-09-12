import { $ } from './conex-helper.js';

export enum Selectors {
  searchId = 'searchId',
  toggleTabsVisibilityName = 'toggle-tabs-visibility',
  openContainerName = 'open-container',
  openTabName = 'open-tab',
  closeTabName = 'close-tab',
  emptyContainerClass = 'empty',
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
