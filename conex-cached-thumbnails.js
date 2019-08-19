import {$1, $e} from "./conex-helper.js";

browser.storage.local.get("thumbnails").then(result => {
    const list = $1("ol");

    const {thumbnails} = result;
    for(const url in thumbnails) {
        if (Reflect.getOwnPropertyDescriptor(thumbnails, url)) {
            const item = $e("li", {title: url}, [
                $e("div", {content: url}),
                $e("img", {src: thumbnails[url]})
            ]);
            list.appendChild(item);
        }
    }
}, e => { console.error(`error retrieving backup: ${e}`); });
