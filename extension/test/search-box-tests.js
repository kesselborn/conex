// value not deleted when navigating away
// value selected when returning to search box
// select first tab on enter
// esc === clear
import { clear, expect, fakeContainers } from './helper.js';
import { renderTabs } from '../containers.js';
import { $, $$ } from '../helper.js';
import { searchInContainer } from '../search.js';
import { renderMainPage } from '../main-page.js';
import { Selectors } from '../selectors.js';
import { search } from '../keyboard-input-handler.js';
const component = 'search-box-tests';
describe(component, function () {
    afterEach(async () => await clear());
    beforeEach(async () => {
        await renderMainPage(fakeContainers);
        const firstFakeContainer = fakeContainers[0];
        const lastFakeContainer = fakeContainers[fakeContainers.length - 1];
        for (const container of [firstFakeContainer, lastFakeContainer]) {
            // @ts-ignore
            const fakeTabs = Array.from([
                {
                    cookieStoreId: container.cookieStoreId,
                    id: `tab-0-${container.cookieStoreId}`,
                    title: 'Hacker News foo',
                    url: 'https://news.ycombinator.com',
                },
                {
                    cookieStoreId: container.cookieStoreId,
                    id: `tab-1-${container.cookieStoreId}`,
                    title: 'Reddit foo',
                    url: 'https://reddit.com',
                },
                {
                    cookieStoreId: container.cookieStoreId,
                    id: `tab-2-${container.cookieStoreId}`,
                    title: 'Firefox',
                    url: 'https://firefox.com',
                },
            ]);
            await renderTabs(new Promise((resolve) => resolve(fakeTabs)));
        }
    });
    it('resets container when search string is empty again', async function () {
        search('z');
        search('');
        expect($$('ol > li.no-match', $('ol')).length).to.equal(0);
        expect($$('em[class*="match-"]').length).to.equal(0);
    });
    it('empty search string should reset the search', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = '';
        searchInContainer(firstContainer, searchTerm);
        expect($$('.no-match', firstContainer).length).to.equal(0);
        expect($$('ol li.no-match', $('ol')).length).to.equal(0);
    });
    it('simple search should work', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'reDdI';
        searchInContainer(firstContainer, searchTerm);
        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        expect($('h3', $('li:not(.no-match)', firstContainer)).innerHTML).to.equal('<em class="match-1">Reddi</em>t foo');
        expect($('h4', $('li:not(.no-match)', firstContainer)).innerHTML).to.equal('https://<em class="match-1">reddi</em>t.com');
    });
    it('multiple search terms should should be combined with AND on title', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'reDdI foo';
        searchInContainer(firstContainer, searchTerm);
        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        expect($('h3', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('<em class="match-1">Reddi</em>t <em class="match-2">foo</em>');
        // url does not have a highlight as only the first token is matched
        expect($('h4', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('https://reddit.com');
    });
    it('multiple search terms should should be combined with AND on url', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'reDdI com';
        searchInContainer(firstContainer, searchTerm);
        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        // title does not have a highlight as only the first token is matched
        expect($('h3', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('Reddit foo');
        expect($('h4', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('https://<em class="match-1">reddi</em>t.<em class="match-2">com</em>');
    });
    it('multiple search terms: a blank after a word should not match everything', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'reDdI ';
        searchInContainer(firstContainer, searchTerm);
        expect($$('li:not(.no-match)', firstContainer).length).to.equal(1);
        expect($('h3', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('<em class="match-1">Reddi</em>t foo');
        expect($('h4', $$('li:not(.no-match)', firstContainer)[0]).innerHTML).to.equal('https://<em class="match-1">reddi</em>t.com');
    });
    it('containers with no matches should be hidden', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'xxxxxx';
        searchInContainer(firstContainer, searchTerm);
        expect(firstContainer.classList.contains(Selectors.noMatch)).to.be.true;
    });
    it('do not hide container if name of the container matches search', async function () {
        const firstContainer = $$('ol > li')[1];
        const searchTerm = 'fake';
        searchInContainer(firstContainer, searchTerm);
        expect(firstContainer.classList.contains(Selectors.noMatch)).to.be.false;
        expect($('h2', firstContainer).innerHTML).to.equal('<span><em class="match-1">fake</em> container-0 foo</span>');
    });
});
