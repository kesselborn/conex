import { $, $$, $e, _ } from '../conex-helper.js';
import { ContainerRenderOptions, defaultContainer, renderContainers, renderTabs } from '../conex-containers.js';
import { tabId2HtmlId } from '../conex-tab-element.js';
import { clear, expect, fakeContainers, renderMainPageStub } from './conex-test-helper.js';
import { Selectors } from '../conex-selectors.js';
import { renderMainPage } from '../conex-main-page.js';
describe('render containers', function () {
  afterEach(clear);
  const { color, cookieStoreId } = fakeContainers[0];
  it('should set class "empty" on empty containers', async function () {
    await renderMainPage(fakeContainers);
    const containerElements = $$('ol li');
    const tabs = [
      {
        cookieStoreId: cookieStoreId,
        id: color,
        title: `${color} tab`,
        url: `http://example.com/${color}`,
      },
      {
        cookieStoreId: cookieStoreId,
        id: `${color}-2`,
        title: `${color} tab 2`,
        url: `http://example.com/${color}`,
      },
    ];
    // @ts-ignore
    await renderTabs(Promise.resolve(tabs));
    expect(containerElements[1].classList.contains(Selectors.emptyContainerClass)).to.be.false;
    expect(containerElements[2].classList.contains(Selectors.emptyContainerClass)).to.be.true;
  });
  it('should set correct container color on containers', async function () {
    await renderMainPage(fakeContainers);
    const containerElements = $$('ol li');
    // @ts-ignore
    const tabs = Array.from([
      {
        cookieStoreId: cookieStoreId,
        id: color,
        title: `${color} tab`,
        url: `http://example.com/${color}`,
      },
    ]);
    await renderTabs(Promise.resolve(tabs));
    // containerElements[1] == fakeContainers[0] due to default container
    expect(containerElements[1].classList.contains(`container-color-${color}`)).to.be.true;
  });
  it('should render history and bookmarks containers if respective options are passed', async function () {
    const options = new ContainerRenderOptions();
    options.history = true;
    options.bookmarks = true;
    await renderMainPage(fakeContainers, options);
    const containerElements = $$('ol li');
    // containers + default container + bookmarks + history
    expect(containerElements.length).to.equal(fakeContainers.length + 3);
  });
  it('should respect container order option', async function () {
    const options = new ContainerRenderOptions();
    options.order = Array.from(['container4', 'container1']);
    await renderMainPage(fakeContainers, options);
    const containerElements = $$('ol li');
    const order = [
      'container4',
      'container1',
      defaultContainer.cookieStoreId,
      'container0',
      'container2',
      'container3',
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
    const searchField = $e('input', { id: Selectors.searchId, placeholder: _('searchBoxPlaceholder'), type: 'text' });
    const form = $e('form', {}, [searchField]);
    window.document.body.appendChild(form);
    renderMainPageStub();
    await renderContainers(fakeContainers);
    for (const container of fakeContainers) {
      const tabs = Array.from([
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
      ]);
      await renderTabs(Promise.resolve(tabs));
      expect($(`#${tabId2HtmlId(tabCnt - 2)} > input`).getAttribute('name')).to.equal(Selectors.openTabName);
      expect($(`#${tabId2HtmlId(tabCnt - 1)} > input`).getAttribute('name')).to.equal(Selectors.openTabName);
    }
    expect($$('form ul>li').length).to.equal(tabCnt);
  });
});
