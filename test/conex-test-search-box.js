// value not deleted when navigating away
// value selected when returning to search box
// select first tab on enter
// esc === clear

import { fakeContainers, expect, clear } from './conex-test-helper.js';
import { renderContainers, fillContainer } from '../conex-containers.js';
import { $, $$ } from '../conex-helper.js';
import { searchInContainer } from '../conex-search.js';

describe('search box', function () {
  afterEach(clear);

  beforeEach(async () => {
    await renderContainers(fakeContainers);
    const firstFakeContainer = fakeContainers[0];
    const lastFakeContainer = fakeContainers[fakeContainers.length - 1];

    for (const container of [firstFakeContainer, lastFakeContainer]) {
      const fakeTabs = [
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-0-${container.cookieStoreId}`,
          title: 'Hacker News',
          url: 'https://news.ycombinator.com',
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-1-${container.cookieStoreId}`,
          title: 'Reddit',
          url: 'https://reddit.com',
        },
        {
          cookieStoreId: container.cookieStoreId,
          id: `tab-2-${container.cookieStoreId}`,
          title: 'Firefox',
          url: 'https://firefox.com',
        },
      ];
      await fillContainer(container, fakeTabs);
    }
  });

  it('simple search should work', async function () {
    const firstContainer = $$('ol > li')[1];
    const searchTerm = 'reDdI';

    searchInContainer(firstContainer, searchTerm);

    expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
    expect($('h3', $('li:not(.no-match)', firstContainer)).innerHTML).to.equal('<em>Reddi</em>t');
    expect($('h4', $('li:not(.no-match)', firstContainer)).innerHTML).to.equal('https://<em>reddi</em>t.com');
  });

  it('multiple search terms should highlight multiple elements', async function () {
    const firstContainer = $$('ol > li')[1];
    const searchTerm = 'reDdI hAcker';

    searchInContainer(firstContainer, searchTerm);

    expect($$('li:not(.no-match)', firstContainer).length).to.equal(2);
    expect($('h3', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('<em>Hacker</em> News');
    expect($('h4', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('https://news.ycombinator.com');

    expect($('h3', $$('li:not(.no-match)', firstContainer)[1]).innerHTML).to.equal('<em>Reddi</em>t');
    expect($('h4', $$('li:not(.no-match)', firstContainer)[1]).innerHTML).to.equal('https://<em>reddi</em>t.com');
  });

  it('containers with not matches should be hidden', async function () {
    const firstContainer = $$('ol > li')[1];
    const searchTerm = 'xxxxxx';

    searchInContainer(firstContainer, searchTerm);

    expect(firstContainer.classList.contains('no-match')).to.be.true;
  });
});
