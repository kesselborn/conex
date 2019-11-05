import {$e, placeholderFailedImage} from "./conex-helper.js";


// todo: loading thumbnail of discarded tab does not work
const resizeImage = async(screenshot, width, height) => {
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");

  // race condition prevention: sometimes, the image element is not fully created yet
  await new Promise((resolve, reject) => {
    const maxTries = 10;
    const intervalDelay = 1000;

    let cnt = 0;
    const timer = setInterval(() => {
      cnt += 1;
      if (cnt > maxTries) {
        reject(new Error("something wrong here: screenshot image never got valid geometry ... giving up"));
      }
      if (screenshot.width !== 0 && screenshot.height !== 0) {
        clearInterval(timer);
        resolve();
      }
    }, intervalDelay);
  });

  if (screenshot.width / width > screenshot.height / height) {
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

const sleep = (delay) => new Promise(resolve => {
  setTimeout(() => resolve(), delay);
});

// todo: background tabs bei heise haben falsche thumbnails
const createThumbnail = async(tabId) => {
  let thumbnailElement = null;
  let screenshot = null;
  let thumbnailCreated = false;

  const maxTries = 10;
  const intervalDelay = 2000;

  const tab = await browser.tabs.get(tabId);

  for (let i = 0; i < maxTries; i += 1) {
    try {
      const start = Date.now();
      // eslint-disable-next-line no-await-in-loop
      screenshot = await browser.tabs.captureTab(tabId, {
        format: "jpeg",
        quality: 20
      });
      const end = Date.now();

      {
        // poor man's fix when screenshot gets taken before rendering is finished
        // this only works, if the assumption is correct, that all those pages look
        // more or less the same (a big gray area)
        // if more than 90 percent of the image is equal to that pattern, try to take
        // capture again
        const screenshotWithoutEmptyScreenshotPattern = screenshot.replace(/(AooooAKKKKACiiig){50}/g, "");
        if (screenshot.length / screenshotWithoutEmptyScreenshotPattern.length > 10) {
          // eslint-disable-next-line no-await-in-loop
          await sleep(1500);
          const e = new Error("captured tag before page was rendered ... will repeat");
          e.name = "BlankScreenshot";
          throw e;
        }
      }

      console.debug(`screenshot took ${end - start}ms`);
      thumbnailCreated = true;
      break;
    } catch (e) {
      if (e.name === "BlankScreenshot") {
        if(i === maxTries - 1) {
          // eslint-disable-next-line no-await-in-loop
          console.warn(`got what I think was a blank screenshot for tab #${tab.id} / ${tab.url}`);
          thumbnailCreated = true;
        }
      } else {
        console.error(`error capturing tab #${tabId}: `, e);
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(intervalDelay);
  }
  if (!thumbnailCreated) {
    console.error(`creating tab thumbnail for tab #${tab.id} / ${tab.url} failed`);
    return placeholderFailedImage;
  }

  try {
    const start = Date.now();
    thumbnailElement = await resizeImage($e("img", {
      src: screenshot,
      style: "border:solid red 1px;"
    }), 300, 200);
    const end = Date.now();
    console.debug(`resize took ${end - start}ms`);
  } catch (e) {
    console.error(`error resizing thumbnail for tab #${tab.id} / ${tab.url}: `, e);
    return null;
  }

  return thumbnailElement.src;
};

const thumbnailsWip = new Map();
export const getThumbnail = (tabId, tabUrl) => {
  const thumbnailCacheDuration = 120000;
  const key = `${tabId}-${tabUrl}`;

  // for bootstrapping: use 'tabUrl' key if tabId-tabUrl is not available
  let thumbnailPromise = thumbnailsWip.get(key) || thumbnailsWip.get(tabUrl);
  if (thumbnailPromise) {
    console.debug(`using cached thumbnail with key ${key}`);
  } else {
    console.debug(`creating thumbnail with key ${key} (caching it for ${thumbnailCacheDuration / 1000}s)`);
    thumbnailPromise = createThumbnail(tabId);
    thumbnailsWip.set(key, thumbnailPromise);

    thumbnailPromise.then(
      // cache for 10 seconds to share between sidebar, browser action and background
      () => setTimeout(() => {
        console.debug(`deleting thumbnail cache with key ${key}`);
        thumbnailsWip.delete(key);
      }, thumbnailCacheDuration),
      e => console.error(`error creating thumbnail: ${e}`)
    );
  }

  return thumbnailPromise;
};

browser.storage.local.get("thumbnails").then(result => {
    const {thumbnails} = result;
    for(const url in thumbnails) {
      if (Reflect.getOwnPropertyDescriptor(thumbnails, url)) {
        thumbnailsWip.set(url, Promise.resolve(thumbnails[url]));
      }
    }
  });
