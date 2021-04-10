import { $$, $ } from './conex-helper.js';
import { htmlId2TabId, tabId2HtmlCloseTabId } from './conex-tab-element.js';

export function keydown(e) {
  console.debug('keydown', e);
  const targetElement = e.target;
  const searchBox = $('#search');
  const addContainer = $('#add-container');

  if (targetElement === searchBox) {
    return keyDownOnSearchElement(e);
  }
  if (isContainerElement(targetElement)) {
    keyDownOnContainerElement(e);
  }
  if (isTabElement(targetElement)) {
    keyDownOnTabElement(e);
  }
  if (targetElement === addContainer) {
    return keyDownOnAddContainerElement(e);
  }
}

export function keyup(e) {
  console.debug('keyup', e);
  const searchBox = $('#search');

  // only search, if search box is still focused (no the case if ArrowDown was handled in keydown)
  if (document.activeElement === searchBox) {
    search(searchBox.value);
  }
}

function keyDownOnAddContainerElement(e) {
  const key = e.key;
  const addContainer = $('#add-container');
  switch (key) {
    case 'ArrowDown':
    case 'Tab':
      e.preventDefault();
      $('ol>li', addContainer.closest('form')).focus();
      break;
    case 'ArrowLeft':
      $('#search').focus();
      break;
  }
}

function keyDownOnSearchElement(e) {
  const key = e.key;
  const searchBox = $('#search');

  switch (key) {
    case 'ArrowDown':
      $('ol>li', searchBox.closest('form')).focus();
      break;
    case 'Tab':
      e.preventDefault();
      if (!e.shiftKey) {
        // $('ol>li', searchBox.closest("form")).focus();
        $('#add-container').focus();
        // $('#add-container', searchBox.closest("#form-head")).focus();
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      $('#add-container').focus();
      break;
    case 'Enter':
      e.preventDefault();
      console.log('opening "a" tab now');
  }
}

function search(value) {
  console.debug(`searching for ${value}`);
}

function keyDownOnContainerElement(e) {
  const containerElement = e.target;
  const key = e.key;

  switch (key) {
    case 'ArrowDown':
    case 'Tab':
      e.preventDefault();
      // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
      if (!e.shiftKey) {
        const tabElement = Array.from($$('ul>li', containerElement)).find(
          (tabElement) => !tabElement.classList.contains('no-match')
        );
        if (tabElement && !containerElement.classList.contains('collapsed')) {
          tabElement.focus();
        } else {
          focusNextVisibleContainerSibling(containerElement);
        }
        break;
      }
    // eslint-disable-next-line no-fallthrough
    case 'ArrowUp': {
      const previousContainer = previousVisibleContainerSibling(containerElement);
      if (previousContainer) {
        const lastTabOfPreviousContainer = Array.from($$('ul>li', previousContainer))
          .reverse()
          .find((tabElement) => !tabElement.classList.contains('no-match'));
        if (lastTabOfPreviousContainer && !previousContainer.classList.contains('collapsed')) {
          lastTabOfPreviousContainer.focus();
        } else {
          previousContainer.focus();
        }
      } else {
        $('#search').focus();
      }
      break;
    }
    case 'ArrowLeft':
      containerElement.classList.add('collapsed');
      focusNextVisibleContainerSibling(containerElement);
      break;
    case 'ArrowRight':
      containerElement.classList.remove('collapsed');
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
      break;
    }
    case 'Backspace':
      e.preventDefault();
      $(`#${tabId2HtmlCloseTabId(htmlId2TabId(tabElement.id))}`).click();
      break;
    case 'ArrowDown':
    case 'Tab':
      e.preventDefault();
      // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
      if (!e.shiftKey) {
        while (curTabElement.nextElementSibling) {
          curTabElement = curTabElement.nextElementSibling;
          if (!curTabElement.classList.contains('no-match')) {
            curTabElement.focus();
            return;
          }
        }

        // no more tabs within this container group ... focus next container element if there is one
        focusNextVisibleContainerSibling(curTabElement.parentElement.parentElement);
        break;
      }
    // FALLTHROUGH ON PURPOSE: if the shiftKey is pressed, fall through to 'ArrowUp'
    // eslint-disable-next-line no-fallthrough
    case 'ArrowUp':
      while (curTabElement.previousElementSibling) {
        curTabElement = curTabElement.previousElementSibling;
        if (!curTabElement.classList.contains('no-match')) {
          curTabElement.focus();
          return;
        }
      }

      // no more tabs within this container group ... focus the parent container element
      curTabElement.parentElement.parentElement.focus();
      break;
    case 'ArrowLeft': {
      const tabContainerElement = curTabElement.parentElement.parentElement;
      tabContainerElement.classList.add('collapsed');
      tabContainerElement.focus();
      focusNextVisibleContainerSibling(tabContainerElement);
      break;
    }
  }
}

function focusNextVisibleContainerSibling(curContainerElement) {
  while (curContainerElement.nextElementSibling) {
    curContainerElement = curContainerElement.nextElementSibling;
    if (!curContainerElement.classList.contains('no-match')) {
      curContainerElement.focus();
      return;
    }
  }
}

function previousVisibleContainerSibling(curContainerElement) {
  while (curContainerElement.previousElementSibling) {
    curContainerElement = curContainerElement.previousElementSibling;
    if (!curContainerElement.classList.contains('no-match')) {
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
