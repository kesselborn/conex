import { $, $$ } from '../conex-helper.js';
import { renderContainers, fillContainer } from '../conex-containers.js';
import { typeKey, fakeContainers, expect, clear } from './conex-test-helper.js';
import { tabId2HtmlId } from '../conex-tab-element.js';

describe('keyboard actions', function () {
  afterEach(clear);

  it('should react on collapse / un-collapse keys', async function () {
    await renderContainers(fakeContainers);
    const firstFakeContainer = fakeContainers[0];
    const lastFakeContainer = fakeContainers[fakeContainers.length - 1];

    for (const container of [firstFakeContainer, lastFakeContainer]) {
      const fakeTabs = [
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-0-${container.cookieStoreId}`,
          title: `tab 0 / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-1-${container.cookieStoreId}`,
          title: `tab 1 / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
      ];
      await fillContainer(fakeTabs);
    }

    const firstFakeContainerElement = $(`#${firstFakeContainer.cookieStoreId}`);
    const tabInFirstFakeContainerElement = $(`#${tabId2HtmlId('tab-1')}-${firstFakeContainer.cookieStoreId}`);
    const lastFakeContainerElement = $(`#${lastFakeContainer.cookieStoreId}`);
    const tabInLastFakeContainerElement = $(`#${tabId2HtmlId('tab-1')}-${lastFakeContainer.cookieStoreId}`);

    // when collapsing on a container element, go to the next container element
    firstFakeContainerElement.focus();
    expect(document.activeElement.classList.contains('collapsed')).to.be.false;
    typeKey({ key: 'ArrowLeft' }, document.activeElement);
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.true;
    expect(document.activeElement).to.equal(firstFakeContainerElement.nextElementSibling);

    firstFakeContainerElement.focus();
    typeKey({ key: 'ArrowRight' }, document.activeElement);
    expect(document.activeElement.classList.contains('collapsed')).to.be.false;
    expect(document.activeElement).to.equal(firstFakeContainerElement);

    // when collapsing on a tab element, jump to the next container element
    tabInFirstFakeContainerElement.focus();
    typeKey({ key: 'ArrowLeft' }, document.activeElement);
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.true;
    expect(document.activeElement).to.equal(firstFakeContainerElement.nextElementSibling);

    typeKey({ key: 'ArrowRight' }, document.activeElement);

    // when collapsing on a tab element of the _last_ container element, jump to the current container element
    tabInLastFakeContainerElement.focus();
    typeKey({ key: 'ArrowLeft' }, document.activeElement);
    expect(lastFakeContainerElement.classList.contains('collapsed')).to.be.true;
    expect(document.activeElement).to.equal(lastFakeContainerElement);
  });
});

describe('keyboard navigation', function () {
  afterEach(clear);

  it('should react on down and up arrow keys for empty container elements correctly', async function () {
    await renderContainers(fakeContainers);
    const containerElements = $$('ol li');

    containerElements[0].focus();
    typeKey({ key: 'ArrowUp' }, document.activeElement);
    expect(document.activeElement).to.equal($('#search'));

    typeKey({ key: 'ArrowDown' }, document.activeElement);
    expect(document.activeElement).to.equal(containerElements[0]);

    typeKey({ key: 'ArrowDown' }, document.activeElement);
    expect(document.activeElement).to.equal(containerElements[1]);

    typeKey({ key: 'ArrowUp' }, document.activeElement);
    expect(document.activeElement).to.equal(containerElements[0]);
  });

  it('should react on down and up arrow keys for container elements with tabs correctly', async function () {
    await renderContainers(fakeContainers);

    for (let i = 0; i < fakeContainers.length; i++) {
      const container = fakeContainers[i];
      const fakeTabs = [
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-0-${container.cookieStoreId}`,
          title: `tab 0 / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-1-${container.cookieStoreId}`,
          title: `tab 1 / fake ${container.cookieStoreId}`,
          url: `http://example.com/${container.color}`,
        },
      ];

      switch (i) {
        // first container contains two tabs
        case 0: // containerElements[1]
          await fillContainer(Promise.resolve(fakeTabs));
          break;
        // second tab contains a tab that should be hidden (class == no-match)
        case 1: // containerElements[2]
          await fillContainer(Promise.resolve(fakeTabs));
          $(`#${tabId2HtmlId(fakeTabs[0].id)}`).classList.add('no-match');
          break;
        // third container only contains hidden tabs and is hidden as well (happens on search)
        case 2: // containerElements[3]
          await fillContainer(Promise.resolve(fakeTabs));
          $(`#${container.cookieStoreId}`).classList.add('no-match');
          $(`#${tabId2HtmlId(fakeTabs[0].id)}`).classList.add('no-match');
          $(`#${tabId2HtmlId(fakeTabs[1].id)}`).classList.add('no-match');
          break;
        case 3: // containerElements[4]
          await fillContainer(Promise.resolve(fakeTabs));
          $(`#${container.cookieStoreId}`).classList.add('collapsed');
          break;
        case 4: // containerElements[5]
          await fillContainer(Promise.resolve(fakeTabs));
          $(`#${tabId2HtmlId(fakeTabs[1].id)}`).classList.add('no-match');
          break;
        case 5: // containerElements[6]
          $(`#${container.cookieStoreId}`).classList.add('no-match');
          break;
      }
    }

    // the layout:
    //
    // .
    // ├── containerElements[0] - firefox -default container
    // ├── containerElements[1] === fakeContainers[0]
    // │   ├── tab 0 === nth - child(1)
    // │    tab 1 === nth - child(2)
    // ├── containerElements[2] === fakeContainers[1]
    // │   ├── tab 0 === nth - child(1) ==> HIDDEN (class: no-match)
    // │   └── tab 1 === nth - child(2)
    // ├── containerElements[3] === fakeContainers[2] ==> HIDDEN (class: no-match)
    // │   ├── tab 0 === nth - child(1) ==> HIDDEN (class: no-match)
    // │   └── tab 1 === nth - child(2) ==> HIDDEN (class: no-match)
    // ├── containerElements[4] === fakeContainers[3] ==> COLLAPSED
    // │   ├── tab 0 === nth - child(1)
    // │   └── tab 1 === nth - child(2)
    // ├── containerElements[5] === fakeContainers[4]
    // │   ├── tab 0 === nth - child(1)
    // │   └── tab 1 === nth - child(2) ==> HIDDEN (class: no-match)
    // └── containerElements[6] === fakeContainers[5] ==> HIDDEN (class: no-match)

    const containerElements = $$('ol>li', document.form);
    for (const keys of [
      { down: { key: 'ArrowDown' }, up: { key: 'ArrowUp' } },
      { down: { key: 'Tab' }, up: { key: 'Tab', shift: true } },
    ]) {
      // this includes the firefox default container on positions 0 that does not have tabs
      // make the testing output more concise, otherwise the error messages are unparseable
      let cnt = 0;
      let oddEvenCnt = 0;
      const e2t = (element) => {
        oddEvenCnt++;
        if (oddEvenCnt % 2) {
          // only increase counter every two calls
          cnt++;
        }
        return `test ${cnt} ${JSON.stringify(keys)}: ${element.innerText.trim()}`;
      };
      containerElements[0].focus(); // default coantiner

      // one arrow down: we should now be on the first fakeContainers container as the default container is empty
      // Test 1
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[1]));

      // one arrow down:  we should now be on the first tab within the first container
      // Test 2
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(1)', containerElements[1])));

      // one arrow down:  we should now be on the second tab within the first container
      // Test 3
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(2)', containerElements[1])));

      // one arrow down:  we should now be on the second container element
      // Test 4
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[2]));

      // one arrow down:  we should now be on the _second_ tab (as the first one has class 'no-match') of the second container element
      // Test 5
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(2)', containerElements[2])));

      // one arrow down:  we should now be on the fourth container element as the third container element is hidden with 'no-match' class
      // Test 6
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[4]));

      // one arrow down:  we should now be on the fifth container element as the fourth container is collapsed
      // Test 7
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[5]));

      // one arrow down:  we should now be on the first tab of the fifth container element
      // Test 8
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(1)', containerElements[5])));

      // one arrow down:  we should still be on the first tab of the fifth container element
      // as the second container of the fifth container is hidden
      // Test 9
      typeKey(keys.down, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(1)', containerElements[5])));

      /// /////////////////// going up again
      // Test 10
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[5]));

      // Test 11
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[4]));

      // Test 12
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(2)', containerElements[2])));

      // Test 13
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[2]));

      // Test 14
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(2)', containerElements[1])));

      // Test 15
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('ul>li:nth-child(1)', containerElements[1])));

      // Test 16
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[1]));

      // Test 17
      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t(containerElements[0]));

      typeKey(keys.up, document.activeElement);
      expect(e2t(document.activeElement)).to.equal(e2t($('#search')));
    }
  });
});
