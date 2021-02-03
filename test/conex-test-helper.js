import { $ } from "../conex-helper.js";

export const fakeContainers = [
    { cookieStoreId: 'fake-cookieStoreId-1', color: "blue", name: 'fake name 1' },
    { cookieStoreId: 'fake-cookieStoreId-2', color: "red", name: 'fake name 2' },
    { cookieStoreId: 'fake-cookieStoreId-3', color: "tourqouise", name: 'fake name 3' },
    { cookieStoreId: 'fake-cookieStoreId-4', color: "yello", name: 'fake name 4' },
    { cookieStoreId: 'fake-cookieStoreId-5', color: "orange", name: 'fake name 5' },
];

export const expect = chai.expect;

export async function clear() {
    const form = $('form');
    if (form) {
        form.remove();
    }
}