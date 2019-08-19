import {$, placeholderImage} from "./conex-helper.js";

let idleState = "locked";
window.browser.idle.setDetectionInterval(15);
window.browser.idle.queryState(15).then(newState => { idleState = newState; });
window.browser.idle.onStateChanged.addListener(newState => { idleState = newState; });

let missingThumbnails = null;

// https://dentrassi.de/2019/06/16/rust-on-the-esp-and-how-to-get-started/
const thumbnailLoader = setInterval(() => {
    if(idleState === "idle") {
        if (!missingThumbnails) {
            missingThumbnails = Array.from($(`img[class="thumbnail-image"][src="${placeholderImage}"]`, window.document));
        }

        if(missingThumbnails.length === 0) {
            console.info("tried all thumbnails");
            clearInterval(thumbnailLoader);
            return;
        }

        const tabItem = missingThumbnails.shift().parentElement.parentElement.parentElement;
        if(tabItem.url !== "about:blank") console.debug(`${window.component}: getting thubmnail for ${tabItem.url}`);
        tabItem.forceThumbnail().catch(e => console.error(`error forcing thumbnail: ${e}`));
    }
}, 2000);

