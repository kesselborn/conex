import { $, $$ } from "../conex-helper.js";
import { renderContainers, fillContainer } from "../conex-containers.js";
import { fakeContainers, expect, clear } from "./conex-test-helper.js"

function typeKey(key, element) {

    const keyDownEvent = new KeyboardEvent('keydown', { 'key': key });
    const keyUpEvent = new KeyboardEvent('keyup', { 'key': key });

    element.dispatchEvent(keyDownEvent);
    element.dispatchEvent(keyUpEvent);
}

describe('keyboard navigation', function () {
    afterEach(clear);

    it('should react on down and up arrow keys for empty container elements correctly', async function () {
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

    it('should react on down and up arrow keys for container elements with tabs correctly', async function () {
        await renderContainers(fakeContainers);

        for (let i = 0; i < fakeContainers.length; i++) {
            const container = fakeContainers[i];
            const fakeTabs = [
                { cookieStoreId: container.cookieStoreId, id: `tab-${container.cookieStoreId}-${container.color}`, title: `${container.color} tab`, url: `http://example.com/${container.color}` },
                { cookieStoreId: container.cookieStoreId, id: `tab-${container.cookieStoreId}-${container.color}-2`, title: `${container.color} tab 2`, url: `http://example.com/${container.color}` },
            ];

            switch (i) {
                // first container contains two tabs
                case 0: // containerElements[1]
                    await fillContainer(Promise.resolve(fakeTabs));
                    break;
                // second tab contains a tab that should be hidden (class == no-match)
                case 1: // containerElements[2]
                    await fillContainer(Promise.resolve(fakeTabs));
                    $(`#${fakeTabs[0].id}`).classList.add('no-match');
                    break;
                // third container only contains hidden tabs and is hidden as well (happens on search)
                case 2: // containerElements[3]
                    await fillContainer(Promise.resolve(fakeTabs));
                    $(`#${container.cookieStoreId}`).classList.add('no-match');
                    $(`#${fakeTabs[0].id}`).classList.add('no-match');
                    $(`#${fakeTabs[1].id}`).classList.add('no-match');
                    break;
                case 3: // containerElements[4]
                    await fillContainer(Promise.resolve(fakeTabs));
                    $(`#${container.cookieStoreId}`).classList.add('collapsed');
                    break;
                case 4: // containerElements[5]
                    await fillContainer(Promise.resolve(fakeTabs));
                    $(`#${fakeTabs[1].id}`).classList.add('no-match');
                    break;
                case 5: // containerElements[6]
                    $(`#${container.cookieStoreId}`).classList.add('no-match');
                    break;
            }
        }

        // the layout:
        // 
        // .
        // ├── containerElements[0] - firefox -default container
        // ├── containerElements[1] === fakeContainers[0]
        // │   ├── tab 1 === nth - child(1)
        // │   └── tab 2 === nth - child(2)
        // ├── containerElements[2] === fakeContainers[1]
        // │   ├── tab 1 === nth - child(1) ==> HIDDEN (class: no-match)
        // │   └── tab 2 === nth - child(2)
        // ├── containerElements[3] === fakeContainers[2] ==> HIDDEN (class: no-match)
        // │   ├── tab 1 === nth - child(1) ==> HIDDEN (class: no-match)
        // │   └── tab 2 === nth - child(2) ==> HIDDEN (class: no-match)
        // ├── containerElements[4] === fakeContainers[3] ==> COLLAPSED
        // │   ├── tab 1 === nth - child(1)
        // │   └── tab 2 === nth - child(2)
        // ├── containerElements[5] === fakeContainers[4]
        // │   ├── tab 1 === nth - child(1)
        // │   └── tab 2 === nth - child(2) ==> HIDDEN (class: no-match)
        // └── containerElements[6] === fakeContainers[5] ==> HIDDEN (class: no-match)


        // this includes the firefox default container on positions 0 that does not have tabs
        const containerElements = $$('ol>li', document.form);
        containerElements[0].focus(); // default coantiner

        // one arrow down: we should now be on the first fakeContainers container as the default container is empty
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal(containerElements[1]);

        // one arrow down:  we should now be on the first tab within the first container
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal($('ul>li:nth-child(1)', containerElements[1]));

        // one arrow down:  we should now be on the second tab within the first container
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal($('ul>li:nth-child(2)', containerElements[1]));

        // one arrow down:  we should now be on the second container element
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal(containerElements[2]);

        // one arrow down:  we should now be on the _second_ tab (as the first one has class 'no-match') of the second container element
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal($('ul>li:nth-child(2)', containerElements[2]));

        // one arrow down:  we should now be on the fourth container element as the third container element is hidden with 'no-match' class
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal(containerElements[4]);

        // one arrow down:  we should now be on the fifth container element as the fourth container is collapsed
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal(containerElements[5]);

        // one arrow down:  we should now be on the first tab of the fifth container element
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal($('ul>li:nth-child(1)', containerElements[5]));

        // one arrow down:  we should still be on the first tab of the fifth container element
        // as the second container of the fifth container is hidden and that next (and last) container
        // is hidden as well
        typeKey('ArrowDown', document.activeElement);
        expect(document.activeElement).to.equal($('ul>li:nth-child(1)', containerElements[5]));
    });

});