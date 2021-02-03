import { renderContainers, fillContainer } from "../conex-containers.js";
import { fakeContainers } from "./conex-test-helper.js"

describe('finally: render somthing to play around with', function () {
    it("renders", async function () {

        await renderContainers(fakeContainers);
        for (const container of fakeContainers) {
            const tabs = [
                { cookieStoreId: container.cookieStoreId, id: container.color, title: `${container.color} tab`, url: `http://example.com/${container.color}` },
                { cookieStoreId: container.cookieStoreId, id: `${container.color}-2`, title: `${container.color} tab 2`, url: `http://example.com/${container.color}` },
            ];
            await fillContainer(Promise.resolve(tabs));
        }

    })
});


document.addEventListener("DOMContentLoaded", async () => {
    mocha.checkLeaks();
    mocha.run();
});

