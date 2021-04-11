import { $e } from './conex-helper.js';

export function containerElement(container) {
  return $e('li', { tabindex: 0, class: 'container-elem empty', id: `${container.cookieStoreId}` }, [
    $e('div', { class: 'container-elem-head' }, [
      $e('div', {
        class: `container-color container-color-${container.color}`,
      }),
      $e('input', {
        id: `e-${container.cookieStoreId}`,
        type: 'radio',
        name: 'toggle-tabs-visibility',
        value: container.cookieStoreId,
      }),
      $e('label', { for: `e-${container.cookieStoreId}`, class: 'tabs-visibility' }, [
        $e('img', {
          class: 'chevron',
          src: './chevron-right.svg',
          width: '25',
          height: '25',
          alt: 'chevron-right',
        }),
      ]),
      $e('input', {
        id: `c-${container.cookieStoreId}`,
        type: 'radio',
        name: 'open-container',
        value: container.cookieStoreId,
      }),
      $e('label', { class: 'container-name', for: `c-${container.cookieStoreId}` }, [$e('h2', { content: container.name })]),
    ]),
  ]);
}
