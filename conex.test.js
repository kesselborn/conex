import sum from './sum.js';
import { $, $$ } from "./conex-helper.js";
import { renderContainers, defaultContainer, fillContainer } from "./conex-containers.js";

console.log('hallo');
const expect = chai.expect;

mocha.setup('bdd')

const fakeContainers = [
  { cookieStoreId: 'fake-cookieStoreId-1', color: "blue", name: 'fake name 1' },
  { cookieStoreId: 'fake-cookieStoreId-2', color: "red", name: 'fake name 2' },
  { cookieStoreId: 'fake-cookieStoreId-3', color: "tourqouise", name: 'fake name 3' },
  { cookieStoreId: 'fake-cookieStoreId-4', color: "yello", name: 'fake name 4' },
  { cookieStoreId: 'fake-cookieStoreId-5', color: "orange", name: 'fake name 5' },
];

describe('rendering containers', function () {
  afterEach(async function () {
    const form = $('form');
    if (form) {
      form.remove();
    }
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
    await renderContainers(fakeContainers, { order: ['fake-cookieStoreId-5', 'fake-cookieStoreId-2'] });
    const containerElements = $$('ol li');
    const order = ['fake-cookieStoreId-5', 'fake-cookieStoreId-2', defaultContainer.cookieStoreId, 'fake-cookieStoreId-1', 'fake-cookieStoreId-3', 'fake-cookieStoreId-4'];

    for (let i = 0; i < containerElements.length; i++) {
      const input = $('input', containerElements[i]);
      expect(input.value).to.equal(order[i]);
    }
  });
});

function typeKey(key, element) {

  const keyDownEvent = new KeyboardEvent('keydown', { 'key': key });
  const keyUpEvent = new KeyboardEvent('keyup', { 'key': key });

  element.dispatchEvent(keyDownEvent);
  element.dispatchEvent(keyUpEvent);
}

describe('rendering containers', function () {
  afterEach(async function () {
    const form = $('form');
    if (form) {
      form.remove();
    }
  });

  after(async function () {
    await renderContainers(fakeContainers);
    for (const container of fakeContainers) {
      const tabs = [
        { cookieStoreId: container.cookieStoreId, id: container.color, title: `${container.color} tab`, url: `http://example.com/${container.color}` },
        { cookieStoreId: container.cookieStoreId, id: `${container.color}-2`, title: `${container.color} tab 2`, url: `http://example.com/${container.color}` },
      ];
      fillContainer(Promise.resolve(tabs));
    }
  });

  it('should react on down and up arrow keys correctly', async function () {
    await renderContainers(fakeContainers);
    const containerElements = $$('ol li');

    containerElements[0].focus();
    typeKey('ArrowUp', document.activeElement);
    expect(document.activeElement).to.equal(containerElements[0]);

    typeKey('ArrowDown', document.activeElement);
    expect(document.activeElement).to.equal(containerElements[1]);

    typeKey('ArrowUp', document.activeElement);
    expect(document.activeElement).to.equal(containerElements[0]);
  });

});

document.addEventListener("DOMContentLoaded", async () => {
  mocha.checkLeaks();
  mocha.run();
});