import { renderContainers, fillContainer } from "./conex-containers.js";
document.addEventListener("DOMContentLoaded", async () => {
    console.log('hello from conex-browser-action.js');
    const bg = browser.extension.getBackgroundPage();
    console.log(bg);
    console.log(bg.foo);
    console.info(bg.foo());
    console.info(bg.bar());
    console.info(bg.foo());

    const containers = await browser.contextualIdentities.query({});
    renderContainers(containers);

    for (const container of containers) {
        const tabs = browser.tabs.query({ cookieStoreId: container.cookieStoreId });
        fillContainer(tabs);
    }
});
