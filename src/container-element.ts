import { $e } from './helper.js';
import { ContextualIdentities } from 'webextension-polyfill';
import { Selectors } from './selectors.js';
import ContextualIdentity = ContextualIdentities.ContextualIdentity;

export function containerElement(container: ContextualIdentity): Element {
  return $e(
    'li',
    {
      tabindex: '0',
      class: `collapsed container-color-${container.color} ${Selectors.emptyContainerClass}`,
      id: `${container.cookieStoreId}`,
    },
    [
      $e('input', {
        id: `e-${container.cookieStoreId}`,
        type: 'radio',
        name: Selectors.toggleTabsVisibilityName,
        value: container.cookieStoreId,
      }),
      $e('label', { for: `e-${container.cookieStoreId}`, class: `tabs-visibility` }),
      $e('input', {
        id: `c-${container.cookieStoreId}`,
        type: 'radio',
        name: Selectors.openContainerName,
        value: container.cookieStoreId,
      }),
      $e('label', { for: `c-${container.cookieStoreId}` }, [$e('h2', { content: container.name })]),
    ]
  );
}
