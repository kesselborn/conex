import { hilightSearchMatch } from '../search.js';
import { expect } from './helper.js';

const component = 'search-highlighting-tests';

describe(component, function () {
  it('should not change strings that do not match search string', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hallo', 'xx'.split(' '));

    expect(highlightedString).to.equal('hallo');
    expect(remainingSearchTokens.length).to.not.equal(0);
  });

  it('should highlight search string correctly', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hallo', 'll'.split(' '));

    expect(highlightedString).to.equal('ha<em class="match-1">ll</em>o');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should highlight search string correctly when it matches at the end', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hallo', 'lo'.split(' '));

    expect(highlightedString).to.equal('hal<em class="match-1">lo</em>');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should highlight search string correctly when it matches the whole string', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hallo', 'hallo'.split(' '));

    expect(highlightedString).to.equal('<em class="match-1">hallo</em>');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should highlight multiple hits with different classes', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hallo', 'hal lo'.split(' '));

    expect(highlightedString).to.equal('<em class="match-1">hal</em><em class="match-2">lo</em>');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should highlight multiple hits with different classes', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hallo', 'lo hal'.split(' '));

    expect(highlightedString).to.equal('<em class="match-2">hal</em><em class="match-1">lo</em>');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should ignore case sensivity', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch('hellOhello', 'LlohE'.split(' '));

    expect(highlightedString).to.equal('he<em class="match-1">llOhe</em>llo');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should not match the highlighting code (e.g. the "<em>" element)', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch(
      'Welcome to Firefox em',
      'We em'.split(' ')
    );

    expect(highlightedString).to.equal('<em class="match-1">We</em>lcome to Firefox <em class="match-2">em</em>');
    expect(remainingSearchTokens.length).to.equal(0);
  });

  it('should not match super-string if substrings were already matched', async function () {
    const { highlightedString, remainingSearchTokens } = hilightSearchMatch(
      'Welcome to Firefox em',
      'We em welcome'.split(' ')
    );

    expect(highlightedString).to.equal('<em class="match-1">We</em>lcome to Firefox <em class="match-2">em</em>');
    expect(remainingSearchTokens.length).to.equal(0);
  });
});
