import { hilightSearchMatch } from '../conex-search.js';
import { expect } from './conex-test-helper.js';
describe('highlight search', function () {
    it('should not change strings that do not match search string', async function () {
        const { highlightedString, match } = hilightSearchMatch('hallo', 'xx');
        expect(highlightedString).to.equal('hallo');
        expect(match).to.equal(false);
    });
    it('should highlight search string correctly', async function () {
        const { highlightedString, match } = hilightSearchMatch('hallo', 'll');
        expect(highlightedString).to.equal('ha<em>ll</em>o');
        expect(match).to.equal(true);
    });
    it('should highlight search string correctly when it matches at the end', async function () {
        const { highlightedString, match } = hilightSearchMatch('hallo', 'lo');
        expect(highlightedString).to.equal('hal<em>lo</em>');
        expect(match).to.equal(true);
    });
    it('should highlight search string correctly when it matches the whole string', async function () {
        const { highlightedString, match } = hilightSearchMatch('hallo', 'hallo');
        expect(highlightedString).to.equal('<em>hallo</em>');
        expect(match).to.equal(true);
    });
    it('should highlight at least one search token', async function () {
        const { highlightedString, match } = hilightSearchMatch('hallo', 'hal lo');
        expect(highlightedString).to.equal('<em>hal</em>lo');
        expect(match).to.equal(true);
    });
    it('should highlight at least one search token 2', async function () {
        const { highlightedString, match } = hilightSearchMatch('hallo', 'lo hal');
        expect(highlightedString).to.equal('hal<em>lo</em>');
        expect(match).to.equal(true);
    });
    it('should ignore case sensivity', async function () {
        const { highlightedString, match } = hilightSearchMatch('hellOhello', 'LlohE');
        expect(highlightedString).to.equal('he<em>llOhe</em>llo');
        expect(match).to.equal(true);
    });
});
