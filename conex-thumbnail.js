import {$e} from "./conex-helper.js";

const resizeImage = async(screenshot, width, height) => {
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");

    // sometimes, the image element is not fully created yet
    await new Promise((resolve, reject) => {
        const maxTries = 50;
        const delay = 50;
        let cnt = 0;
        const timer = setInterval(() => {
            cnt += 1;
            if(cnt > maxTries) {
                reject(new Error("something wrong here: screenshot image never got valid geometry ... giving up"));
            }
            if(screenshot.width !== 0 && screenshot.height !== 0) {
                clearInterval(timer);
                resolve();
            }
        }, delay);
    });

    if(screenshot.width / width > screenshot.height / height) {
        canvas.width = width;
        canvas.height = screenshot.height * width / screenshot.width;
    } else {
        canvas.height = height;
        canvas.width = screenshot.width * height / screenshot.height;
    }

    context.drawImage(screenshot, 0, 0, canvas.width, canvas.height);

    const thumbnail = new Image();
    thumbnail.src = canvas.toDataURL("image/jpeg");
    return thumbnail;
};

const createThumbnail = async(tabId) => {
  let thumbnailElement = null;
  try {
    console.debug(`creating thumbnail for tab #${tabId}`);
    let start = Date.now();
    const screenshot = await browser.tabs.captureTab(tabId, {
      format: "jpeg",
      quality: 20
    });
    let end = Date.now();
    console.log(`screenshot took ${end - start}ms`);

    start = Date.now();
    thumbnailElement = await resizeImage($e("img", {
      src: screenshot,
      style: "border:solid red 1px;"
    }), 300, 200);
    end = Date.now();
    console.log(`resize took ${end - start}ms`);
  } catch (e) {
    console.error(`error creating thumbnail for tab #${tabId}: `, e);
    return null;
  }

  return thumbnailElement.src;
};

const thumbnailsWip = new Map();
export const getThumbnail = (tabId, tabUrl) => {
  const key = `${tabId}-${tabUrl}`;
  let thumbnailPromise = thumbnailsWip.get(key);
  if (!thumbnailPromise) {
    thumbnailPromise = createThumbnail(tabId);
    thumbnailsWip.set(key, thumbnailPromise);

    // if there is no thumbnail after 10 seconds, delete it from this list
    // ... tab could be closed before thumbnail was done for example
    const deleteOnTimeout = setTimeout(() => {
      console.info(`thumbnail for tab ${key} was never created`);
      thumbnailsWip.delete(key);
    }, 10000);

    thumbnailPromise.then(() => {
      clearTimeout(deleteOnTimeout);

      // keep this promise for another 10 seconds
      setTimeout(() => thumbnailsWip.delete(key), 10000);
    });
  }

  return thumbnailPromise;
};
