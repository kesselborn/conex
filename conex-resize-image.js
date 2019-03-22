
export async function resizeImage(screenshot, width, height) {
    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d');

    // sometimes, the image element is not fully created yet
    await new Promise((resolve, reject) => {
        let cnt = 0;
        const timer = setInterval(function () {
            if(++cnt > 50) {
                reject("something wrong here: screenshot image never got valid geometry ... giving up");
            }
            if(screenshot.width != 0 && screenshot.height != 0) {
                clearInterval(timer);
                resolve();
            }
        }, 50);
    });

    if(screenshot.width / width > screenshot.height / height) {
        canvas.width = width;
        canvas.height = 1 * ((screenshot.height * width) / screenshot.width);
    } else {
        canvas.height = height;
        canvas.width = 1 * ((screenshot.width * height) / screenshot.height);
    }

    context.drawImage(screenshot, 0, 0, canvas.width, canvas.height);

    let thumbnail = new Image();
    thumbnail.src = canvas.toDataURL('image/jpeg');
    return thumbnail;
}
//    const width = 600;
//    const scaleFactor = width / img.width;
//    elem.width = width;
//    elem.height = img.height * scaleFactor;
//    ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);