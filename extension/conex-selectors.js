import { $ } from './conex-helper.js';
export var Selectors;
(function (Selectors) {
  Selectors.searchId = 'searchId';
  Selectors.toggleTabsVisibilityName = 'toggle-tabs-visibility';
  Selectors.openContainerName = 'open-container';
  Selectors.openTabName = 'open-tab';
  Selectors.closeTabName = 'close-tab';
  Selectors.emptyContainerClass = 'empty';
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
