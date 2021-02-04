import { $ } from "../conex-helper.js";

export const fakeContainers = [
    { cookieStoreId: 'container-0', color: "orange", name: 'fake name 0' },
    { cookieStoreId: 'container-1', color: "blue", name: 'fake name 1' },
    { cookieStoreId: 'container-2', color: "red", name: 'fake name 2' },
    { cookieStoreId: 'container-3', color: "tourqouise", name: 'fake name 3' },
    { cookieStoreId: 'container-4', color: "yellow", name: 'fake name 4' },
];

export const expect = chai.expect;

export async function clear() {
    const form = $('form');
    if (form) {
        form.remove();
    }
}