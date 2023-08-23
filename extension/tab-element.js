import { $e, _ } from './helper.js';
import { Selectors } from './selectors.js';
export function tabId2HtmlId(id) {
  return `t-${id}`;
}
export function htmlId2TabId(id) {
  return Number(id.slice(2));
}
export function tabId2HtmlOpenTabId(id) {
  return `ot-${id}`;
}
export function htmlOpenTabId2TabId(id) {
  return Number(id.slice(3));
}
export function tabId2HtmlCloseTabId(id) {
  return `x-${id}`;
}
export function htmlCloseTabId2TabId(id) {
  return Number(id.slice(2));
}
export function tabElement(tab) {
  let favicon = tab.favIconUrl;
  // this favIconUrl is returned on some firefox tabs but not accessible
  if (favicon === 'chrome://mozapps/skin/extensions/extension.svg') {
    favicon = '';
  }
  // ot prefix: open tab
  // x prefix: close tab
  return $e('li', { tabindex: '0', id: tabId2HtmlId(tab.id) }, [
    $e('input', { id: tabId2HtmlOpenTabId(tab.id), type: 'radio', name: Selectors.openTabName, value: `${tab.id}` }),
    $e('label', { for: tabId2HtmlOpenTabId(tab.id), class: 'tab-center' }, [
      $e('div', { class: 'images' }, [
        $e('img', { class: 'favicon', src: favicon || '' }),
        $e('img', { class: 'thumbnail', src: favicon || '' }),
      ]),
      $e('div', { class: 'tab-names' }, [$e('h3', { content: tab.title || '' }), $e('h4', { content: tab.url || '' })]),
    ]),
    $e('input', {
      id: tabId2HtmlCloseTabId(tab.id),
      type: 'radio',
      name: Selectors.closeTabName,
      value: `${tab.id}`,
    }),
    $e('label', {
      for: tabId2HtmlCloseTabId(tab.id),
      class: 'close',
      content: 'x',
      title: _('closeWithDetails', ['tab', tab.title]),
    }),
  ]);
}
