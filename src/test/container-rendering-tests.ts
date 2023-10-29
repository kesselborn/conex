import { $, $$, _ } from '../helper.js';
import { ContainerRenderOptions, defaultContainer, renderTabs } from '../containers.js';
import { clear, expect, fakeContainers } from './helper.js';
import { Ids, Selectors } from '../constants.js';
import { Tabs } from 'webextension-polyfill';
import { renderMainPage } from '../main-page.js';
import { getBookmarksAsTabs } from '../bookmarks.js';
import Tab = Tabs.Tab;

const component = 'container-rendering-tests';
describe(component, function () {
  afterEach(clear);

  const { color, cookieStoreId: fakeContainer0CookieStoreId } = fakeContainers[0]!;

  it('should set the tab count correctly', async function () {
    await renderMainPage(fakeContainers, {
      bookmarks: true,
      history: true,
      order: ['container0', 'container1', Ids.historyCookieStoreId, Ids.bookmarksCookieStoreId],
    });
    const containerElements = $$(Selectors.containerElements);

    const tabs = [
      {
        cookieStoreId: fakeContainer0CookieStoreId,
        id: color,
        title: `${color} tab`,
        url: `http://example.com/${color}`,
      },
      {
        cookieStoreId: fakeContainer0CookieStoreId,
        id: `${color}-2`,
        title: `${color} tab 2`,
        url: `http://example.com/${color}`,
      },
      {
        cookieStoreId: fakeContainer0CookieStoreId,
        id: `${color}-2`,
        title: `${color} tab 3`,
        url: `http://example.com/${color}`,
      },
    ];

    // @ts-ignore
    await renderTabs(tabs);

    expect(
      $('h2 span:nth-child(2)', containerElements[0])!.innerText,
      'filled container count should be correct'
    ).to.equal('(3 tabs)');
    expect(
      $('h2 span:nth-child(2)', containerElements[1])!.innerText,
      'empty container count should be correct'
    ).to.equal('(0 tabs)');
    expect(
      $('h2 span:nth-child(2)', containerElements[2])!.innerText,
      'history count should just read "many"'
    ).to.equal(`(many ${_('history-label')})`);
    expect($('h2 span:nth-child(2)', containerElements[3])!.innerText, 'bookmark count should be correct').to.equal(
      `(${(await getBookmarksAsTabs()).length} ${_('bookmarks')})`
    );
  });

  it('should set class "empty" on empty containers', async function () {
    await renderMainPage(fakeContainers);
    const containerElements = $$(Selectors.containerElements);

    const tabs = [
      {
        cookieStoreId: fakeContainer0CookieStoreId,
        id: color,
        title: `${color} tab`,
        url: `http://example.com/${color}`,
      },
      {
        cookieStoreId: fakeContainer0CookieStoreId,
        id: `${color}-2`,
        title: `${color} tab 2`,
        url: `http://example.com/${color}`,
      },
    ];

    // @ts-ignore
    await renderTabs(tabs);

    expect(containerElements[1]!.classList.contains(Selectors.emptyContainerClass)).to.be.false;
    expect(containerElements[2]!.classList.contains(Selectors.emptyContainerClass)).to.be.true;
  });

  it('should set correct container color on containers', async function () {
    await renderMainPage(fakeContainers);
    const containerElements = $$(Selectors.containerElements);

    // @ts-ignore
    const tabs = Array.from([
      {
        cookieStoreId: fakeContainer0CookieStoreId,
        id: color,
        title: `${color} tab`,
        url: `http://example.com/${color}`,
      },
    ]) as Array<Tab>;

    await renderTabs(tabs);
    // containerElements[1] == fakeContainers[0] due to default container
    expect(containerElements[1]!.classList.contains(`container-color-${color}`)).to.be.true;
  });

  it('should render history and bookmarks containers if respective options are passed', async function () {
    const options = new ContainerRenderOptions();
    options.history = true;
    options.bookmarks = true;
    await renderMainPage(fakeContainers, options);
    const containerElements = $$(Selectors.containerElements);

    // containers + default container + bookmarks + history
    expect(containerElements.length).to.equal(fakeContainers.length + 3);
  });

  it('should respect container order option', async function () {
    const options = new ContainerRenderOptions();
    options.order = Array.from(['container4', 'container1']);

    await renderMainPage(fakeContainers, options);
    const containerElements = $$(Selectors.containerElements);
    const order = [
      'container4',
      'container1',
      defaultContainer.cookieStoreId,
      'container0',
      'container2',
      'container3',
    ];

    for (let i = 0; i < containerElements.length; i++) {
      const input = $('input', containerElements[i])! as HTMLInputElement;
      expect(input.value).to.equal(order[i]);
    }
  });
});
