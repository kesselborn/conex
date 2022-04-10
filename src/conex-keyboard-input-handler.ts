import {$, $$} from './conex-helper.js';
import {htmlId2TabId, tabId2HtmlCloseTabId} from './conex-tab-element.js';
import {searchInContainer} from './conex-search.js';
import type {Browser} from 'webextension-polyfill';
import {ConexElements, Selectors} from './conex-selectors.js';

declare let browser: Browser;

export function keydown(e: KeyboardEvent): void {
    const targetElement = e.target as Element;

    if (targetElement === ConexElements.search) {
        console.debug('keydown on search element', e);
        return keyDownOnSearchElement(e);
    }
    if (isContainerElement(targetElement)) {
        console.debug('keydown on container element', e);
        keyDownOnContainerElement(e);
    }
    if (isTabElement(targetElement)) {
        console.debug('keydown on tab element', e);
        keyDownOnTabElement(e);
    }
}

export function keyup(e: KeyboardEvent) {

    // only search, if search box is still focused (no the case if ArrowDown was handled in keydown)
    if (document.activeElement === ConexElements.search) {
        console.debug('keyup on search element', e);
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
                $('ol>li', ConexElements.search.parentElement!)!.focus();
            }
            break;
        case 'Enter':
            e.preventDefault();
            console.log('opening "a" tab now');
    }
}

function search(value: string): void {
    for (const containerElement of Array.from($$('ol > li'))) {
        searchInContainer(containerElement, value);
    }
}

function downOnContainerElement(containerElement: Element): Element {
    const tabElement = Array.from($$('ul>li', containerElement)).find(
        (tabElement) => !tabElement.classList.contains(Selectors.noMatch)
    );

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

    switch (key) {
        case 'Enter':
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
            browser.tabs.update(tabId, {active: true});
            break;
        }

        // @ts-ignore
        case 'Backspace':
            e.preventDefault();
            // we fall through here as we want to focuse the next element when closing this tab
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
                while (curTabElement.nextElementSibling) {
                    curTabElement = curTabElement.nextElementSibling;
                    if (!curTabElement.classList.contains(Selectors.noMatch)) {
                        (curTabElement as HTMLElement).focus();
                        return;
                    }
                }

                // no more tabs within this container group ... focus next container element if there is one
                focusNextVisibleContainerSibling(curTabElement.parentElement!.parentElement as Element);
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
    while (curContainerElement.nextElementSibling) {
        curContainerElement = curContainerElement.nextElementSibling;
        if (!curContainerElement.classList.contains(Selectors.noMatch)) {
            (curContainerElement as HTMLElement).focus();
            break;
        }
    }
    return curContainerElement;
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
