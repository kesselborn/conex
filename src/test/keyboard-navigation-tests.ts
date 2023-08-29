import {$, $$} from '../helper.js';
import {renderTabs} from '../containers.js';
import {clear, expect, fakeContainers, maxTabId, timeoutResolver, typeKey} from './helper.js';
import {tabId2HtmlId} from '../tab-element.js';
import {ConexElements, Selectors} from '../selectors.js';
import {renderMainPage} from '../main-page.js';
import {debug, info} from '../logger.js';
import {search} from '../keyboard-input-handler.js';

// TODO: when typing, restart search
const component = 'keyboard-navigation-tests';

describe(component, function () {
  afterEach(clear);

  it('should go to the first tab that matches even if the first container is hidden', async function () {
    await renderMainPage(fakeContainers);
    const containerElements = $$('ol li');

    let tabIdCnt = 0;
    const tabIdOffset = await maxTabId();

    const fakeTabs = (cookieStoreId: string) => {
      return [
        {
          cookieStoreId: cookieStoreId,
          id: tabIdOffset + tabIdCnt++,
          title: `tab0${cookieStoreId}`,
          url: `http://example.com/${cookieStoreId}`,
        },
        {
          cookieStoreId: cookieStoreId,
          id: tabIdOffset + tabIdCnt++,
          title: `tab1${cookieStoreId}`,
          url: `http://example.com/${cookieStoreId}`,
        },
      ];
    };

    // @ts-ignore
    await renderTabs(Promise.resolve(fakeTabs(fakeContainers[1].cookieStoreId)));
    // @ts-ignore
    await renderTabs(Promise.resolve(fakeTabs(fakeContainers[2].cookieStoreId)));

    const searchTerm = 'tab1container2';
    const searchInputField = $(`#${Selectors.searchId}`)! as HTMLInputElement;
    searchInputField.value = searchTerm;
    search(searchTerm);
    searchInputField.focus();

    const container2Element = containerElements[3];

    typeKey({ key: 'ArrowDown' }, document.activeElement!);
    expect(document.activeElement! as HTMLElement).to.equal(container2Element);
  });

  it('should react on down and up arrow keys for empty container elements correctly', async function () {
    info(component, 'entering test:', 'should react on down and up arrow keys for empty container elements correctly');
    await renderMainPage(fakeContainers);
    const containerElements = $$('ol li');

    containerElements[0]!.focus();
    debug(component, '    arrow up;');
    typeKey({ key: 'ArrowUp' }, document.activeElement!);
    expect(document.activeElement!).to.equal(ConexElements.search);

    debug(component, '    arrow down;');
    typeKey({ key: 'ArrowDown' }, document.activeElement!);
    expect(document.activeElement!).to.equal(containerElements[0]);

    debug(component, '    arrow down;');
    typeKey({ key: 'ArrowDown' }, document.activeElement!);
    expect(document.activeElement!).to.equal(containerElements[1]);

    debug(component, '    arrow up;');
    typeKey({ key: 'ArrowUp' }, document.activeElement!);
    expect(document.activeElement!).to.equal(containerElements[0]);
  });

  it('should react on down and up arrow keys for container elements with tabs correctly', async function () {
    await renderMainPage(fakeContainers);

    let tabIdCnt = 0;
    const tabIdOffset = await maxTabId();

    const fakeTabs = (cookieStoreId: string) => {
      return [
        {
          cookieStoreId: cookieStoreId,
          id: tabIdOffset + tabIdCnt++,
          title: `tab 0 / fake ${cookieStoreId}`,
          url: `http://example.com/${cookieStoreId}`,
        },
        {
          cookieStoreId: cookieStoreId,
          id: tabIdOffset + tabIdCnt++,
          title: `tab 1 / fake ${cookieStoreId}`,
          url: `http://example.com/${cookieStoreId}`,
        },
      ];
    };

    for (let i = 0; i < fakeContainers.length; i++) {
      const container = fakeContainers[i]!;
      switch (i) {
        // first container contains two tabs
        case 0: // containerElements[1]
          // @ts-ignore
          await renderTabs(Promise.resolve(fakeTabs(fakeContainers[i].cookieStoreId)));
          $(`#${fakeContainers[i]!.cookieStoreId}`)!.classList.remove(Selectors.collapsedContainer);
          break;
        // second tab contains a tab that should be hidden (class == no-match)
        case 1: // containerElements[2]
          {
            const tabs = fakeTabs(fakeContainers[i]!.cookieStoreId);

            // @ts-ignore
            await renderTabs(Promise.resolve(tabs));
            $(`#${tabId2HtmlId(tabs[0]!.id)}`)!.classList.add(Selectors.noMatch);
            $(`#${fakeContainers[i]!.cookieStoreId}`)!.classList.remove(Selectors.collapsedContainer);
          }
          break;
        // third container only contains hidden tabs and is hidden as well (happens on search)
        case 2: // containerElements[3]
          {
            const tabs = fakeTabs(fakeContainers[i]!.cookieStoreId);
            // @ts-ignore
            await renderTabs(Promise.resolve(tabs));
            $(`#${container.cookieStoreId}`)!.classList.add(Selectors.noMatch);
            $(`#${tabId2HtmlId(tabs[0]!.id)}`)!.classList.add(Selectors.noMatch);
            $(`#${tabId2HtmlId(tabs[1]!.id)}`)!.classList.add(Selectors.noMatch);
          }
          break;
        case 3: // containerElements[4]
          {
            const tabs = fakeTabs(fakeContainers[i]!.cookieStoreId);
            // @ts-ignore
            await renderTabs(Promise.resolve(tabs));
            $(`#${container.cookieStoreId}`)!.classList.add(Selectors.collapsedContainer);
          }
          break;
        case 4: // containerElements[5]
          {
            const tabs = fakeTabs(fakeContainers[i]!.cookieStoreId);
            // @ts-ignore
            await renderTabs(Promise.resolve(tabs));
            $(`#${tabId2HtmlId(tabs[1]!.id)}`)!.classList.add(Selectors.noMatch);
            $(`#${fakeContainers[i]!.cookieStoreId}`)!.classList.remove(Selectors.collapsedContainer);
          }
          break;
        case 5: // containerElements[6]
          $(`#${container.cookieStoreId}`)!.classList.add(Selectors.noMatch);
          break;
      }
    }

    // the layout:
    //
    // .
    // ├── containerElements[0] - firefox -default container
    // ├── containerElements[1] === fakeContainers[0]
    // │   ├── tab 0 === nth - child(1)
    // │   └── tab 1 === nth - child(2)
    // ├── containerElements[2] === fakeContainers[1]
    // │   ├── tab 2 === nth - child(1) ==> HIDDEN (class: no-match)
    // │   └── tab 3 === nth - child(2)
    // ├── containerElements[3] === fakeContainers[2] ==> HIDDEN (class: no-match)
    // │   ├── tab 4 === nth - child(1) ==> HIDDEN (class: no-match)
    // │   └── tab 5 === nth - child(2) ==> HIDDEN (class: no-match)
    // ├── containerElements[4] === fakeContainers[3] ==> COLLAPSED
    // │   ├── tab 6 === nth - child(1)
    // │   └── tab 7 === nth - child(2)
    // ├── containerElements[5] === fakeContainers[4]
    // │   ├── tab 8 === nth - child(1)
    // │   └── tab 9 === nth - child(2) ==> HIDDEN (class: no-match)
    // └── containerElements[6] === fakeContainers[5] ==> HIDDEN (class: no-match)

    const containerElements = $$('ol>li', document.forms[0]);
    for (const keys of [
      { down: { key: 'ArrowDown' }, up: { key: 'ArrowUp' }, left: { key: 'ArrowLeft' } },
      { down: { key: 'Tab' }, up: { key: 'Tab', shiftKey: true }, left: { key: 'ArrowLeft' } },
    ]) {
      // this includes the firefox default container on positions 0 that does not have tabs
      // make the testing output more concise, otherwise the error messages are unparseable
      let cnt = 0;
      let oddEvenCnt = 0;
      const e2t = (element: HTMLElement): string => {
        oddEvenCnt++;
        if (oddEvenCnt % 2) {
          // only increase counter every two calls
          cnt++;
        }
        return `test ${cnt} ${JSON.stringify(keys)}: ${element.innerText.trim()}`;
      };
      containerElements[0]!.focus(); // default container

      // one arrow left: we should now be on the first fakeContainers container as arrow left collapses
      // the container and jumps to the next container
      // Test 1
      typeKey(keys.left, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[1]!));

      // one arrow down:  we should now be on the first tab within the first container
      // Test 2
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(1)', containerElements[1]!)!)
      );

      // one arrow down:  we should now be on the second tab within the first container
      // Test 3
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(2)', containerElements[1]!)!)
      );

      // one arrow down:  we should now be on the second container element
      // Test 4
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[2]!));

      // one arrow down:  we should now be on the _second_ tab (as the first one has class Selectors.noMatch) of the second container element
      // Test 5
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(2)', containerElements[2]!)!)
      );

      // one arrow down:  we should now be on the fourth container element as the third container element is hidden with Selectors.noMatch class
      // Test 6
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[4]!));

      // one arrow down:  we should now be on the fifth container element as the fourth container is collapsed
      // Test 7
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[5]!));

      // one arrow down:  we should now be on the first tab of the fifth container element
      // Test 8
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(1)', containerElements[5]!)!)
      );

      // one arrow down:  we should still be on the first tab of the fifth container element
      // as the second container of the fifth container is hidden
      // Test 9
      typeKey(keys.down, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(1)', containerElements[5]!)!)
      );

      /// /////////////////// going up again
      // Test 10
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[5]!)!);

      // Test 11
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[4]!)!);

      // Test 12
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(2)', containerElements[2]!)!)
      );

      // Test 13
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[2]!)!);

      // Test 14
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(2)', containerElements[1]!)!)
      );

      // Test 15
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(
        e2t($('ul>li:nth-child(1)', containerElements[1]!)!)
      );

      // Test 16
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[1]!));

      // Test 17
      typeKey(keys.up, document.activeElement!);
      expect(e2t(document.activeElement! as HTMLElement)).to.equal(e2t(containerElements[0]!));
    }
  });

  it('should select search term when returning to search field', async function () {
    await renderMainPage(fakeContainers);
    ConexElements.search.value = 'fake';
    $('ol > li')!.focus();
    // containerElements[0].focus();
    typeKey({ key: 'ArrowUp' }, document.activeElement!);
    expect(document.activeElement!).to.equal(ConexElements.search);

    await timeoutResolver(100);
    expect(ConexElements.search.selectionStart).to.equal(0);
    expect(ConexElements.search.selectionEnd).to.equal(4);
  });
});
