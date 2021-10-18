import { $ } from './conex-helper.js';
export var Selectors;
(function (Selectors) {
  Selectors.closeTabName = 'close-tab';
  Selectors.collapsedContainer = 'collapsed';
  Selectors.emptyContainerClass = 'empty';
  Selectors.noMatch = 'no-match';
  Selectors.openContainerName = 'open-container';
  Selectors.openTabName = 'open-tab';
  Selectors.searchId = 'searchId';
  Selectors.tabClosed = 'closed';
  Selectors.toggleTabsVisibilityName = 'toggle-tabs-visibility';
})(Selectors || (Selectors = {}));
export class ConexElements {
  static get search() {
    return $(`#${Selectors.searchId}`);
  }

  static get form() {
    return $('form');
  }

  static container(cookieStoreId) {
    return $(`li#${cookieStoreId}`);
  }
}
