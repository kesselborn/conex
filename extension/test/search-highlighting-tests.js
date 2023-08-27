import { hilightSearchMatch } from '../search.js';
import { expect } from './helper.js';
const component = 'search-highlighting-tests';
describe(component, function () {
  it('should not change strings that do not match search string', async function () {
    const { highlightedString, match } = hilightSearchMatch('hallo', 'xx');
    expect(highlightedString).to.equal('hallo');
    expect(match).to.equal(false);
  });
  it('should highlight search string correctly', async function () {
    const { highlightedString, match } = hilightSearchMatch('hallo', 'll');
    expect(highlightedString).to.equal('ha<em class="match-1">ll</em>o');
    expect(match).to.equal(true);
  });
  it('should highlight search string correctly when it matches at the end', async function () {
    const { highlightedString, match } = hilightSearchMatch('hallo', 'lo');
    expect(highlightedString).to.equal('hal<em class="match-1">lo</em>');
    expect(match).to.equal(true);
  });
  it('should highlight search string correctly when it matches the whole string', async function () {
    const { highlightedString, match } = hilightSearchMatch('hallo', 'hallo');
    expect(highlightedString).to.equal('<em class="match-1">hallo</em>');
    expect(match).to.equal(true);
  });
  it('should highlight multiple hits with different classes', async function () {
    const { highlightedString, match } = hilightSearchMatch('hallo', 'hal lo');
    expect(highlightedString).to.equal('<em class="match-1">hal</em><em class="match-2">lo</em>');
    expect(match).to.equal(true);
  });
  it('should highlight multiple hits with different classes', async function () {
    const { highlightedString, match } = hilightSearchMatch('hallo', 'lo hal');
    expect(highlightedString).to.equal('<em class="match-2">hal</em><em class="match-1">lo</em>');
    expect(match).to.equal(true);
  });
  it('should ignore case sensivity', async function () {
    const { highlightedString, match } = hilightSearchMatch('hellOhello', 'LlohE');
    expect(highlightedString).to.equal('he<em class="match-1">llOhe</em>llo');
    expect(match).to.equal(true);
  });
  it('should not match the highlighting code (e.g. the "<em>" element)', async function () {
    const { highlightedString, match } = hilightSearchMatch('Welcome to Firefox em', 'We em');
    expect(highlightedString).to.equal('<em class="match-1">We</em>lcome to Firefox <em class="match-2">em</em>');
    expect(match).to.equal(true);
  });
});
