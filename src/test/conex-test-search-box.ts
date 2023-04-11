// value not deleted when navigating away
// value selected when returning to search box
// select first tab on enter
// esc === clear

import {clear, expect, fakeContainers} from './conex-test-helper.js';
import {renderTabs} from '../conex-containers.js';
import {$, $$} from '../conex-helper.js';
import {searchInContainer} from '../conex-search.js';
import {Tabs} from 'webextension-polyfill';
import {renderMainPage} from '../conex-main-page.js';
import {Selectors} from '../conex-selectors.js';
import Tab = Tabs.Tab;

describe('search box', function () {
    afterEach(clear);

    beforeEach(async () => {
        await renderMainPage(fakeContainers);
        const firstFakeContainer = fakeContainers[0];
        const lastFakeContainer = fakeContainers[fakeContainers.length - 1];

        for (const container of [firstFakeContainer, lastFakeContainer]) {
            // @ts-ignore
            const fakeTabs = Array.from([
                {
                    cookieStoreId: container!.cookieStoreId,
                    id: `tab-0-${container!.cookieStoreId}`,
                    title: 'Hacker News foo',
                    url: 'https://news.ycombinator.com',
                },
                {
                    cookieStoreId: container!.cookieStoreId,
                    id: `tab-1-${container!.cookieStoreId}`,
                    title: 'Reddit foo',
                    url: 'https://reddit.com',
                },
                {
                    cookieStoreId: container!.cookieStoreId,
                    id: `tab-2-${container!.cookieStoreId}`,
                    title: 'Firefox',
                    url: 'https://firefox.com',
                },
            ]) as Array<Tab>;

            await renderTabs(new Promise((resolve) => resolve(fakeTabs)));
        }
    });

    it('simple search should work', async function () {
        const firstContainer = $$('ol > li')[1]!;
        const searchTerm = 'reDdI';

        searchInContainer(firstContainer, searchTerm);

        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        expect($('h3', $('li:not(.no-match)', firstContainer)!)!.innerHTML).to.equal('<em>Reddi</em>t foo');
        expect($('h4', $('li:not(.no-match)', firstContainer)!)!.innerHTML).to.equal('https://<em>reddi</em>t.com');
    });

    it('multiple search terms should should be combined with AND', async function () {
        const firstContainer = $$('ol > li')[1]!;
        const searchTerm = 'reDdI foo';

        searchInContainer(firstContainer, searchTerm);

        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        expect($('h3', $$('li:not(.no-match)', firstContainer)[1])!.innerHTML).to.equal('<em>Reddi</em>t');
        expect($('h4', $$('li:not(.no-match)', firstContainer)[1])!.innerHTML).to.equal('https://<em>reddi</em>t.com');
    });

    it('multiple search terms: a blank after a word should not match everything', async function () {
        const firstContainer = $$('ol > li')[1]!;
        const searchTerm = 'reDdI ';

        searchInContainer(firstContainer, searchTerm);

        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        expect($('h3', $$('li:not(.no-match)', firstContainer)[1])!.innerHTML).to.equal('<em>Reddi</em>t foo');
        expect($('h4', $$('li:not(.no-match)', firstContainer)[1])!.innerHTML).to.equal('https://<em>reddi</em>t.com');
    });

    it('containers with no matches should be hidden', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'xxxxxx';

        searchInContainer(firstContainer!, searchTerm);

        expect(firstContainer!.classList.contains(Selectors.noMatch)).to.be.true;
    });

    it('do not hide container if name of the container matches search', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'fake';

        searchInContainer(firstContainer!, searchTerm);

        expect(firstContainer!.classList.contains(Selectors.noMatch)).to.be.false;
        expect($('h2', firstContainer)!.innerHTML).to.equal('<span><em>fake</em> container-0 foo</span>');
    });
});
