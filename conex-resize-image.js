export const resizeImage = async function(screenshot, width, height) {
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
