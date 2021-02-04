import { $, $$ } from "../conex-helper.js";
import { renderContainers, fillContainer, defaultContainer } from "../conex-containers.js";
import { fakeContainers, expect, clear } from "./conex-test-helper.js"

describe('render containers', function () {
  afterEach(clear);

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
    const order = ['container-4', 'container-1', defaultContainer.cookieStoreId, 'container-0', 'container-2', 'container-3'];

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
        { cookieStoreId: container.cookieStoreId, id: container.color, title: `${container.color} tab`, url: `http://example.com/${container.color}` },
        { cookieStoreId: container.cookieStoreId, id: `${container.color}-2`, title: `${container.color} tab 2`, url: `http://example.com/${container.color}` },
      ];
      tabCnt += tabs.length;
      await fillContainer(Promise.resolve(tabs));
    }

    expect($$('form ul>li').length).to.equal(tabCnt);
  });
});