import { $ } from '../conex-helper.js';
import { clear, expect, fakeContainers } from './conex-test-helper.js';
import { Selectors } from '../conex-selectors.js';
import { renderMainPage } from '../conex-main-page.js';

describe('form actions', function () {
  afterEach(clear);

  it('should react on collapse / un-collapse actions', async function () {
    await renderMainPage(fakeContainers);

    const firstFakeContainerElement = $(`#${fakeContainers[0]!.cookieStoreId}`)!;
    const toggleCollapseCheckbox = $(`input[name=${Selectors.toggleTabsVisibilityName}]`, firstFakeContainerElement);
    const toggleCollapseLabel = $(`label[for="${toggleCollapseCheckbox!.id}"]`, firstFakeContainerElement)!;

    firstFakeContainerElement.focus();
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.false;
    toggleCollapseLabel.click();
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.true;
    toggleCollapseLabel.click();
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.false;
  });
});
