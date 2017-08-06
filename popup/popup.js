var page = browser.extension.getBackgroundPage();

//page.getEmptyImageTags().then(src => document.body.innerHTML = src );
page.getImageTags().then(src => document.body.innerHTML = src );
