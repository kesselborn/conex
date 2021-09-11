import { $ } from '../conex-helper.js';
import { renderContainers } from '../conex-containers.js';
import { fakeContainers, expect, clear } from './conex-test-helper.js';

describe('form actions', function () {
  afterEach(clear);

  it('should react on collapse / un-collapse actions', async function () {
    await renderContainers(fakeContainers);

    const firstFakeContainerElement = $(`#${fakeContainers[0]!.cookieStoreId}`)!;
    const toggleCollapseCheckbox = $('input[name="toggle-tabs-visibility"]', firstFakeContainerElement);
    const toggleCollapseLabel = $(`label[for="${toggleCollapseCheckbox!.id}"]`, firstFakeContainerElement)!;

    firstFakeContainerElement.focus();
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.false;
    toggleCollapseLabel.click();
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.true;
    toggleCollapseLabel.click();
    expect(firstFakeContainerElement.classList.contains('collapsed')).to.be.false;
  });
});
