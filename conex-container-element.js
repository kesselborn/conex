import { $e } from './conex-helper.js';

export function containerElement(container) {
  return $e('li', { tabindex: 0, class: 'empty', id: `${container.cookieStoreId}` }, [
    $e('input', { id: `e-${container.cookieStoreId}`, type: 'radio', name: 'toggle-tabs-visibility', value: container.cookieStoreId }),
    $e('label', { for: `e-${container.cookieStoreId}`, class: `tabs-visibility border-color-${container.color}` }),
    $e('input', { id: `c-${container.cookieStoreId}`, type: 'radio', name: 'open-container', value: container.cookieStoreId }),
    $e('label', { for: `c-${container.cookieStoreId}` }, [
      $e('h2', { content: container.name }),
    ]),
  ]);
}
