import { $ } from '../helper.js';
import { clear, expect, fakeContainers } from './helper.js';
import { ClassSelectors, InputNameSelectors } from '../constants.js';
import { renderMainPage } from '../main-page.js';

const component = 'form-actions-tests';

describe(component, function () {
  afterEach(clear);

  it('should react on collapse / un-collapse actions', async function () {
    await renderMainPage(fakeContainers);

    const firstFakeContainerElement = $(`#${fakeContainers[0]!.cookieStoreId}`)!;
    const toggleCollapseCheckbox = $(
      `input[name=${InputNameSelectors.toggleTabsVisibilityName}]`,
      firstFakeContainerElement
    );
    const toggleCollapseLabel = $(`label[for="${toggleCollapseCheckbox!.id}"]`, firstFakeContainerElement)!;

    firstFakeContainerElement.focus();
    expect(
      firstFakeContainerElement.classList.contains(ClassSelectors.collapsedContainer),
      'container should contain collapsed class as a default'
    ).to.be.true;
    toggleCollapseLabel.click();
    expect(
      firstFakeContainerElement.classList.contains(ClassSelectors.collapsedContainer),
      'container should not contain collapsed class after click'
    ).to.be.false;
    toggleCollapseLabel.click();
    expect(
      firstFakeContainerElement.classList.contains(ClassSelectors.collapsedContainer),
      'container should contain collapsed class after two click'
    ).to.be.true;
  });
});
