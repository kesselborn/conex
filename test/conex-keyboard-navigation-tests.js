import { $, $$ } from "../conex-helper.js";
import { renderContainers } from "../conex-containers.js";
import { fakeContainers, expect, clear } from "./conex-test-helper.js"

function typeKey(key, element) {

    const keyDownEvent = new KeyboardEvent('keydown', { 'key': key });
    const keyUpEvent = new KeyboardEvent('keyup', { 'key': key });

    element.dispatchEvent(keyDownEvent);
    element.dispatchEvent(keyUpEvent);
}

describe('keyboard navigation', function () {
    afterEach(clear);

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