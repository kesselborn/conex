import { $, $$ } from '../conex-helper.js';
import { renderContainers, fillContainer, defaultContainer } from '../conex-containers.js';
import { tabId2HtmlId } from '../conex-tab-element.js';
import { fakeContainers, expect, clear } from './conex-test-helper.js';

describe('render containers', function () {
  afterEach(clear);

  it('should set class "empty" on empty containers', async function () {
    await renderContainers(fakeContainers);
    const containerElements = $$('ol li');

    const tabs = [
      {
        cookieStoreId: fakeContainers[0].cookieStoreId,
        id: fakeContainers[0].color,
        title: `${fakeContainers[0].color} tab`,
        url: `http://example.com/${fakeContainers[0].color}`,
      },
      {
        cookieStoreId: fakeContainers[0].cookieStoreId,
        id: `${fakeContainers[0].color}-2`,
        title: `${fakeContainers[0].color} tab 2`,
        url: `http://example.com/${fakeContainers[0].color}`,
      },
    ];
    await fillContainer(fakeContainers[0], Promise.resolve(tabs));

    // containerElements[1] == fakeContainers[0] due to default container
    // containerElements[1] contains tab elements (i.e. not empty)
    // containerElements[2] does not contain tabs (i.e. empty)
    expect(containerElements[1].classList.contains('empty')).to.be.false;
    expect(containerElements[2].classList.contains('empty')).to.be.true;
  });

  it('should set correct container color on containers', async function () {
    await renderContainers(fakeContainers);
    const containerElements = $$('ol li');

    const tabs = [
      {
        cookieStoreId: fakeContainers[0].cookieStoreId,
        id: fakeContainers[0].color,
        title: `${fakeContainers[0].color} tab`,
        url: `http://example.com/${fakeContainers[0].color}`,
      },
    ];
    await fillContainer(fakeContainers[0], Promise.resolve(tabs));
    // containerElements[1] == fakeContainers[0] due to default container
    expect($('.tabs-visibility', containerElements[1]).classList.contains(`border-color-${fakeContainers[0].color}`)).to
      .be.true;
  });

  it('should render container elements correctly', async function () {
    await renderContainers(fakeContainers);
    const containerElements = $$('ol li');

    const allContainers = [defaultContainer].concat(fakeContainers);
    expect(containerElements.length).to.equal(allContainers.length);
    for (let i = 0; i < containerElements.length; i++) {
      const label = $('label', containerElements[i]);
      expect(label.classList.contains(`border-color-${allContainers[i].color}`)).to.be.true;
    }
  });

  it('should render history and bookmarks containers if respective options are passed', async function () {
    await renderContainers(fakeContainers, { history: true, bookmarks: true });
    const containerElements = $$('ol li');

    // containers + default container + bookmarks + history
    expect(containerElements.length).to.equal(fakeContainers.length + 3);
  });

  it('should respect container order option', async function () {
    await renderContainers(fakeContainers, { order: ['container-4', 'container-1'] });
    const containerElements = $$('ol li');
    const order = [
      'container-4',
      'container-1',
      defaultContainer.cookieStoreId,
      'container-0',
      'container-2',
      'container-3',
    ];

    for (let i = 0; i < containerElements.length; i++) {
      const input = $('input', containerElements[i]);
      expect(input.value).to.equal(order[i]);
    }
  });
});

describe('render tabs', function () {
  afterEach(clear);

  it('should render tabs elements correctly', async function () {
    let tabCnt = 0;
    await renderContainers(fakeContainers);
    for (const container of fakeContainers) {
      const tabs = [
        {
          cookieStoreId: container.cookieStoreId,
          id: tabCnt++,
          title: `${container.color} tab`,
          url: `http://example.com/${container.color}`,
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: tabCnt++,
          title: `${container.color} tab 2`,
          url: `http://example.com/${container.color}`,
        },
      ];
      await fillContainer(container, Promise.resolve(tabs));
      expect($(`#${tabId2HtmlId(tabCnt - 2)}`).classList.contains(`border-color-${container.color}`)).to.be.true;
      expect($(`#${tabId2HtmlId(tabCnt - 1)}`).classList.contains(`border-color-${container.color}`)).to.be.true;
    }

    expect($$('form ul>li').length).to.equal(tabCnt);
  });
});
