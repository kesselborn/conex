import {$, placeholderFailedImage, placeholderImage} from "./conex-helper.js";

setTimeout(() => setInterval(() => {
    const images = {};
    for(const img of Array.from($("img.thumbnail-image", window.document))) {
        if(img.src !== placeholderImage && img.src !== placeholderFailedImage) {
            const tabItem = img.parentElement.parentElement.parentElement;
            if(img.src.startsWith("data:")) images[tabItem.url] = img.src;
        }
    }
    browser.storage.local.set({thumbnails: images}).then(() => {
        console.debug("thumbnail backup written");
    }, e => { console.error("saving thumbnails backup failed", e); });
}, 120000), 60000);
