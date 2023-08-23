import { $, $$ } from './helper.js';
import { htmlId2TabId, tabId2HtmlCloseTabId } from './tab-element.js';
import { searchInContainer } from './search.js';
import { ConexElements, Selectors } from './selectors.js';
import { debug, info, warn } from './logger.js';
const component = 'keyboard-input-handler';
export function keydown(e) {
  const targetElement = e.target;
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
export function keyup(e) {
  // only search, if search box is still focused (no the case if ArrowDown was handled in keydown)
  if (document.activeElement === ConexElements.search) {
    debug('keyup on search element', e);
    search(ConexElements.search.value);
  }
}
function keyDownOnSearchElement(e) {
  const key = e.key;
  switch (key) {
    case 'ArrowDown':
    case 'Tab':
      e.preventDefault();
      if (!e.shiftKey) {
        $('ol>li', ConexElements.search.parentElement).focus();
      }
      break;
    case 'Enter':
      e.preventDefault();
      info(component, 'opening "a" tab now');
  }
}
function search(value) {
  for (const containerElement of Array.from($$('ol > li'))) {
    searchInContainer(containerElement, value);
  }
}
function downOnContainerElement(containerElement) {
  const tabElement = Array.from($$('ul>li', containerElement)).find((tabElement) => !tabElement.classList.contains(Selectors.noMatch));
  if (tabElement && !containerElement.classList.contains(Selectors.collapsedContainer)) {
    tabElement.focus();
    return tabElement;
  } else {
    return focusNextVisibleContainerSibling(containerElement);
  }
}
function keyDownOnContainerElement(e) {
  const containerElement = e.target;
  const key = e.key;
  const nextTabElement = containerElement.querySelector('li');
  switch (key) {
    case 'Enter':
      e.preventDefault();
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
        const lastTabOfPreviousContainer = Array.from($$('ul>li', previousContainer))
          .reverse()
          .find((tabElement) => !tabElement.classList.contains(Selectors.noMatch));
        if (lastTabOfPreviousContainer && !previousContainer.classList.contains(Selectors.collapsedContainer)) {
          lastTabOfPreviousContainer.focus();
        } else {
          previousContainer.focus();
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
function keyDownOnTabElement(e) {
  const tabElement = e.target;
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
      // we fall through here as we want to focuse the next element when closing this tab
      $(`#${tabId2HtmlCloseTabId(htmlId2TabId(tabElement.id))}`).click();
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
        while (curTabElement.nextElementSibling) {
          curTabElement = curTabElement.nextElementSibling;
          if (!curTabElement.classList.contains(Selectors.noMatch)) {
            curTabElement.focus();
            debug(component, 'found next tab to focus on', curTabElement);
            return;
          }
        }
        // no more tabs within this container group ... focus next container element if there is one
        focusNextVisibleContainerSibling(curTabElement.parentElement.parentElement);
        warn(component, 'did not find a tab to focus on');
        break;
      }
      // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
      // eslint-disable-next-line no-fallthrough
    case 'ArrowUp':
      while (curTabElement.previousElementSibling) {
        curTabElement = curTabElement.previousElementSibling;
        if (!curTabElement.classList.contains(Selectors.noMatch)) {
          curTabElement.focus();
          return;
        }
      }
      // no more tabs within this container group ... focus the parent container element
      curTabElement.parentElement.parentElement.focus();
      break;
    case 'ArrowLeft': {
      const tabContainerElement = curTabElement.parentElement.parentElement;
      tabContainerElement.classList.add(Selectors.collapsedContainer);
      tabContainerElement.focus();
      focusNextVisibleContainerSibling(tabContainerElement);
      break;
    }
  }
}
function focusNextVisibleContainerSibling(curContainerElement) {
  while (curContainerElement.nextElementSibling) {
    curContainerElement = curContainerElement.nextElementSibling;
    if (!curContainerElement.classList.contains(Selectors.noMatch)) {
      curContainerElement.focus();
      break;
    }
  }
  return curContainerElement;
}
function previousVisibleContainerSibling(curContainerElement) {
  while (curContainerElement.previousElementSibling) {
    curContainerElement = curContainerElement.previousElementSibling;
    if (!curContainerElement.classList.contains(Selectors.noMatch)) {
      return curContainerElement;
    }
  }
}
function isContainerElement(element) {
  return element.nodeName === 'OL' || element.parentElement.nodeName === 'OL';
}
function isTabElement(element) {
  return element.nodeName === 'UL' || element.parentElement.nodeName === 'UL';
}
