import { $, ContexturalIdentitiesColorCodes } from '../conex-helper.js';
export const fakeContainers = [
    { cookieStoreId: 'container0', color: 'orange', name: 'fake container-0 foo', colorCode: ContexturalIdentitiesColorCodes.orange, icon: 'circle', iconUrl: '' },
    { cookieStoreId: 'container1', color: 'blue', name: 'fake container-1 bar', colorCode: ContexturalIdentitiesColorCodes.blue, icon: 'circle', iconUrl: '' },
    { cookieStoreId: 'container2', color: 'red', name: 'fake container-2 baz', colorCode: ContexturalIdentitiesColorCodes.red, icon: 'circle', iconUrl: '' },
    { cookieStoreId: 'container3', color: 'turquoise', name: 'fake container-3 foobar', colorCode: ContexturalIdentitiesColorCodes.turquoise, icon: 'circle', iconUrl: '' },
    { cookieStoreId: 'container4', color: 'yellow', name: 'fake container-4 foobaz', colorCode: ContexturalIdentitiesColorCodes.yellow, icon: 'circle', iconUrl: '' },
];
// @ts-ignore
chai.config.includeStack = true;
// @ts-ignore
export const expect = chai.expect;
export function typeKey(key, element) {
    const keyDownEvent = new KeyboardEvent('keydown', key);
    const keyUpEvent = new KeyboardEvent('keyup', key);
    element.dispatchEvent(keyDownEvent);
    element.dispatchEvent(keyUpEvent);
}
export async function clear() {
    if (window.location.search === '') {
        const form = $('form');
        if (form) {
            form.remove();
        }
    }
}
export function timeoutResolver(ms) {
    return new Promise((resolve) => {
        setTimeout(function () {
            resolve(true);
        }, ms);
    });
}
