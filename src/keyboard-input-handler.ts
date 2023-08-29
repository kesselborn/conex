import { $, $$ } from './helper.js';
import { htmlId2TabId, tabId2HtmlCloseTabId } from './tab-element.js';
import { searchInContainer } from './search.js';
import type { Browser } from 'webextension-polyfill';
import { ConexElements, Selectors } from './selectors.js';
import { debug, info } from './logger.js';

declare let browser: Browser;

const component = 'keyboard-input-handler';

export function keydown(e: KeyboardEvent): void {
  const targetElement = e.target as Element;

  if (targetElement === ConexElements.search) {
    debug(component, `keydown on search element (key: ${e.key})`, e);
    return keyDownOnSearchElement(e);
  }
  if (isContainerElement(targetElement)) {
    debug(component, `keydown on container element (key: ${e.key})`, e);
    keyDownOnContainerElement(e);
  }
  if (isTabElement(targetElement)) {
    debug(component, `keydown on tab element (key: ${e.key})`, e);
    keyDownOnTabElement(e);
  }
}

export function keyup(e: KeyboardEvent) {
  // only search, if search box is still focused (no the case if ArrowDown was handled in keydown)
  if (document.activeElement === ConexElements.search) {
    debug(component, 'keyup on search element', e);
    search(ConexElements.search.value);
  }
}

function keyDownOnSearchElement(e: KeyboardEvent): void {
  const key = e.key;

  switch (key) {
    case 'ArrowDown':
    case 'Tab':
      e.preventDefault();
      if (!e.shiftKey) {
        $(Selectors.containerElementsMatch, ConexElements.search.parentElement!)!.focus();
      }
      break;
    case 'Enter':
      e.preventDefault();
      info(component, 'opening "a" tab now');
  }
}

export function search(value: string): void {
  for (const containerElement of Array.from($$(Selectors.containerElements))) {
    searchInContainer(containerElement, value);
  }
}

function downOnContainerElement(containerElement: Element): Element {
  const tabElement = $(Selectors.tabElementsMatch, containerElement);

  if (tabElement && !containerElement.classList.contains(Selectors.collapsedContainer)) {
    tabElement.focus();
    return tabElement;
  } else {
    return focusNextVisibleContainerSibling(containerElement);
  }
}

function keyDownOnContainerElement(e: KeyboardEvent): void {
  const containerElement: Element = e.target as Element;
  const key = e.key;
  const nextTabElement = $(Selectors.tabElementsMatch, containerElement);

  switch (key) {
    case 'Enter':
      e.preventDefault();
      debug(component, 'enter on container ... will open the first tab in that container', nextTabElement);
      if (nextTabElement) {
        const tabId = htmlId2TabId(nextTabElement.id);
        browser.tabs.update(tabId, { active: true });
      }
      break;
    case 'ArrowDown':
    // @ts-ignore
    // eslint-disable-next-line no-fallthrough
    case 'Tab':
      e.preventDefault();

      // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
      if (!e.shiftKey) {
        downOnContainerElement(containerElement);
        break;
      }
    // eslint-disable-next-line no-fallthrough
    case 'ArrowUp': {
      const previousContainer = previousVisibleContainerSibling(containerElement);
      if (previousContainer) {
        const lastTabOfPreviousContainer = Array.from($$(Selectors.tabElementsMatch, previousContainer)).pop();
        if (lastTabOfPreviousContainer && !previousContainer.classList.contains(Selectors.collapsedContainer)) {
          lastTabOfPreviousContainer.focus();
        } else {
          (previousContainer as HTMLElement).focus();
        }
      } else {
        ConexElements.search.focus();
        setTimeout(function () {
          ConexElements.search.select();
        }, 0);
      }
      break;
    }
    case 'ArrowLeft':
      containerElement.classList.add(Selectors.collapsedContainer);
      focusNextVisibleContainerSibling(containerElement);
      break;
    case 'ArrowRight':
      containerElement.classList.remove(Selectors.collapsedContainer);
      break;
  }
}

function keyDownOnTabElement(e: KeyboardEvent): void {
  const tabElement: Element = e.target! as HTMLElement;
  const key = e.key;

  let curTabElement = tabElement;
  switch (key) {
    case 'Enter': {
      e.preventDefault();
      const tabId = htmlId2TabId(tabElement.id);
      browser.tabs.update(tabId, { active: true });
      window.close();
      break;
    }

    // @ts-ignore
    case 'Backspace':
      // we fall through here as we want to focus the next element when closing this tab
      $(`#${tabId2HtmlCloseTabId(htmlId2TabId(tabElement.id))}`)!.click();
    // @ts-ignore
    // eslint-disable-next-line no-fallthrough
    case 'ArrowDown':
    // @ts-ignore
    // eslint-disable-next-line no-fallthrough
    case 'Tab':
      e.preventDefault();
      // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
      if (!e.shiftKey) {
        debug(component, 'searching for next tab to focus on');
        const tabId = tabElement.id;
        const nextVisibleTabInContainer = $(`#${tabId} ~ :not(.${Selectors.noMatch}`, tabElement.parentElement!);
        if (nextVisibleTabInContainer) {
          debug(component, '  found tab', nextVisibleTabInContainer);
          nextVisibleTabInContainer.focus();
          return;
        }

        const tabsContainer = curTabElement.parentElement!.parentElement as Element;
        debug(component, '  no more visible containers in container', tabsContainer);

        // no more tabs within this container group ... focus next container element if there is one
        focusNextVisibleContainerSibling(tabsContainer);
        break;
      }
    // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
    // eslint-disable-next-line no-fallthrough
    case 'ArrowUp':
      while (curTabElement.previousElementSibling) {
        curTabElement = curTabElement.previousElementSibling;
        if (!curTabElement.classList.contains(Selectors.noMatch)) {
          (curTabElement as HTMLElement).focus();
          return;
        }
      }

      // no more tabs within this container group ... focus the parent container element
      curTabElement.parentElement!.parentElement!.focus();
      break;
    case 'ArrowLeft': {
      const tabContainerElement = curTabElement.parentElement!.parentElement!;
      tabContainerElement.classList.add(Selectors.collapsedContainer);
      tabContainerElement.focus();
      focusNextVisibleContainerSibling(tabContainerElement);
      break;
    }
  }
}

function focusNextVisibleContainerSibling(curContainerElement: Element): Element {
  const nextVisibleContainerSibling = $(`#${curContainerElement.id} ~ :not(.${Selectors.noMatch})`);
  if (nextVisibleContainerSibling) {
    nextVisibleContainerSibling.focus();
  }
  return nextVisibleContainerSibling as Element;
}

function previousVisibleContainerSibling(curContainerElement: Element): Element | void {
  while (curContainerElement.previousElementSibling) {
    curContainerElement = curContainerElement.previousElementSibling;
    if (!curContainerElement.classList.contains(Selectors.noMatch)) {
      return curContainerElement;
    }
  }
}

function isContainerElement(element: Element): boolean {
  return element.nodeName === 'OL' || element.parentElement!.nodeName === 'OL';
}

function isTabElement(element: Element) {
  return element.nodeName === 'UL' || element.parentElement!.nodeName === 'UL';
}
