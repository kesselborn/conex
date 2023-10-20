// value not deleted when navigating away
// value selected when returning to search box
// select first tab on enter
// esc === clear

import { clear, expect, fakeContainers } from './helper.js';
import { renderTabs } from '../containers.js';
import { $, $$ } from '../helper.js';
import { searchInContainer } from '../search.js';
import { Tabs } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { Selectors } from '../selectors.js';
import { search } from '../keyboard-input-handler.js';
import { debug } from '../logger.js';
import Tab = Tabs.Tab;

const component = 'search-box-tests';

describe(component, function () {
  afterEach(async () => await clear());

  beforeEach(async () => {
    await renderMainPage(fakeContainers);
    const firstFakeContainer = fakeContainers[0];
    const lastFakeContainer = fakeContainers[fakeContainers.length - 1];

    for (const container of [firstFakeContainer, lastFakeContainer]) {
      // @ts-ignore
      const fakeTabs = Array.from([
        {
          cookieStoreId: container!.cookieStoreId,
          id: `tab-0-${container!.cookieStoreId}`,
          title: 'Hacker News foo',
          url: 'https://news.ycombinator.com',
        },
        {
          cookieStoreId: container!.cookieStoreId,
          id: `tab-1-${container!.cookieStoreId}`,
          title: 'Reddit foo',
          url: 'https://reddit.com',
        },
        {
          cookieStoreId: container!.cookieStoreId,
          id: `tab-2-${container!.cookieStoreId}`,
          title: 'Firefox',
          url: 'https://firefox.com',
        },
      ]) as Array<Tab>;

      await renderTabs(fakeTabs);
    }
  });

  it('resets container when search string is empty again', async function () {
    search('z');
    search('');

    expect($$(Selectors.containerElementsNoMatch, $(Selectors.containerElements)!).length).to.equal(0);
    expect($$('em[class*="match-"]')!.length).to.equal(0);
  });

  it('empty search string should reset the search', async function () {
    const firstContainer = $$(Selectors.containerElements)[1]!;
    const searchTerm = '';

    searchInContainer(firstContainer, searchTerm);

    expect($$(`.${Selectors.noMatch}`, firstContainer).length).to.equal(0);
    expect($$(Selectors.containerElementsNoMatch, $(Selectors.containerElements)!).length).to.equal(0);
  });

  it('simple search should work', async function () {
    const firstContainer = $$(Selectors.containerElements)[1]!;
    const searchTerm = 'reDdI';

    searchInContainer(firstContainer, searchTerm);

    expect($$(Selectors.tabElementsMatch, firstContainer).length).to.equal(1);
    expect($('h3', $(Selectors.tabElementsMatch, firstContainer)!)!.innerHTML).to.equal(
      '<em class="match-1">Reddi</em>t foo'
    );
    expect($('h4', $(Selectors.tabElementsMatch, firstContainer)!)!.innerHTML).to.equal(
      'https://<em class="match-1">reddi</em>t.com'
    );
  });

  it('">" prefix limits search to a specific container', async function () {
    const firstContainer = $$(Selectors.containerElements)[1]!;
    const lastContainer = $$(Selectors.containerElements)[Selectors.containerElements.length]!;
    const searchTerm = '>container-4 Reddi';

    searchInContainer(firstContainer, searchTerm);

    expect(firstContainer.classList.contains(Selectors.noMatch), 'non matching container is hidden').to.equal(true);

    searchInContainer(lastContainer, searchTerm);
    debug(component, lastContainer);
    expect(lastContainer.classList.contains(Selectors.noMatch), 'matching container is not a nomatch').to.equal(false);

    expect(
      $('h3', $(Selectors.tabElementsMatch, lastContainer)!)!.innerHTML,
      'matching container is not hidden'
    ).to.equal('<em class="match-1">Reddi</em>t foo');
    expect(
      $('h4', $(Selectors.tabElementsMatch, lastContainer)!)!.innerHTML,
      'tab element should be highlighted correctly'
    ).to.equal('https://<em class="match-1">reddi</em>t.com');
  });

  it('multiple search terms should should be combined with AND on title', async function () {
    const firstContainer = $$(Selectors.containerElements)[1]!;
    const searchTerm = 'reDdI foo';

    searchInContainer(firstContainer, searchTerm);

    expect(
      $$(Selectors.tabElementsMatch, firstContainer).length,
      'container should have one tab element that matches'
    ).to.equal(1);
    expect(
      $('h3', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML,
      'it should highlight title correctly'
    ).to.equal('<em class="match-1">Reddi</em>t <em class="match-2">foo</em>');

    expect(
      $('h4', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML,
      'it should highlight url correctly'
    ).to.equal('https://<em class="match-1">reddi</em>t.com');
  });

  it('multiple search terms should should be combined with AND on url', async function () {
    const firstContainer = $$(Selectors.containerElements)[1]!;
    const searchTerm = 'reDdI com';

    searchInContainer(firstContainer, searchTerm);

    expect($$(Selectors.tabElementsMatch, firstContainer).length).to.equal(1);

    expect($('h3', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML).to.equal(
      '<em class="match-1">Reddi</em>t foo'
    );

    expect($('h4', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML).to.equal(
      'https://<em class="match-1">reddi</em>t.<em class="match-2">com</em>'
    );
  });

  it('multiple search terms: a blank after a word should not match everything', async function () {
    const firstContainer = $$(Selectors.containerElements)[1]!;
    const searchTerm = 'reDdI ';

    searchInContainer(firstContainer, searchTerm);

    expect($$(Selectors.tabElementsMatch, firstContainer).length).to.equal(1);
    expect($('h3', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML).to.equal(
      '<em class="match-1">Reddi</em>t foo'
    );
    expect($('h4', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML).to.equal(
      'https://<em class="match-1">reddi</em>t.com'
    );
  });

  it('containers with no matches should be hidden', async function () {
    const firstContainer = $$(Selectors.containerElements)[1];
    const searchTerm = 'xxxxxx';

    searchInContainer(firstContainer!, searchTerm);

    expect(firstContainer!.classList.contains(Selectors.noMatch)).to.be.true;
  });

  it('should match even if one part matches in title in the other in url', async function () {
    const firstContainer = $$(Selectors.containerElements)[1];
    const searchTerm = 'ycombinator foo';

    searchInContainer(firstContainer!, searchTerm);

    expect(firstContainer!.classList.contains(Selectors.noMatch), 'container should have a match').to.be.false;
    expect($$(Selectors.tabElementsMatch, firstContainer).length, 'container should have tabs with a match').to.equal(
      1
    );
    expect(
      $('h3', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML,
      'the title match should be highlighted'
    ).to.equal('Hacker News <em class="match-2">foo</em>');
    expect(
      $('h4', $$(Selectors.tabElementsMatch, firstContainer)[0])!.innerHTML,
      'the url match should be highlighted'
    ).to.equal('https://news.<em class="match-1">ycombinator</em>.com');
  });

  xit('should have a global match counter', async function () {});
});
