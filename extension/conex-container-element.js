import { $e } from './conex-helper.js';
import { Selectors } from './conex-selectors.js';
export function containerElement(container) {
  return $e('li', {
    tabindex: '0',
    class: `collapsed container-color-${container.color} ${Selectors.emptyContainerClass}`,
    id: `${container.cookieStoreId}`,
  }, [
    $e('input', {
      id: `e-${container.cookieStoreId}`,
      type: 'radio',
      name: Selectors.toggleTabsVisibilityName,
      value: container.cookieStoreId,
    }),
    $e('label', { for: `e-${container.cookieStoreId}`, class: 'tabs-visibility' }),
    $e('input', {
      id: `c-${container.cookieStoreId}`,
      type: 'radio',
      name: Selectors.openContainerName,
      value: container.cookieStoreId,
    }),
    $e('label', { for: `c-${container.cookieStoreId}` }, [$e('h2', { content: container.name })]),
  ]);
}
