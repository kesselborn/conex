import { $, $$ } from './helper.js';
import { Selectors } from './selectors.js';
import { debug } from './logger.js';

interface HighlightResult {
  highlightedString: string;
  remainingSearchTokens: string[];
}

const component = 'search';

interface ResultToken {
  isMatch: boolean;
  matchNo: number | undefined;
  tokenValue: string;
}

// searches all tabs of a container
export function searchInContainer(containerElement: Element, searchString: string) {
  if (searchString === '') {
    containerElement.classList.add(Selectors.collapsedContainer);
    containerElement.classList.remove(Selectors.noMatch);
    for (const element of Array.from($$('.' + Selectors.tabElementsNoMatch, containerElement))) {
      element.classList.remove(Selectors.noMatch);
    }
    return;
  } else {
    containerElement.classList.remove(Selectors.collapsedContainer);
  }

  const tabSearchTokens = [];

  // everthing that starts with a '>' scopes the search to a specific container
  // foo >bar
  // would search for foo but only in a container that matches the search term 'bar'
  // blank bevor '>' is not necessary, 'foo>bar' works as well
  const containerScopingTokens = [];
  for (const token of searchString.replace('>', ' >').split(' ')) {
    if (token.startsWith('>')) {
      if (token.slice(1) !== '') {
        containerScopingTokens.push(token.slice(1));
      }
    } else {
      if (token !== '') {
        tabSearchTokens.push(token);
      }
    }
  }

  const containerTitle = $(Selectors.containerName, containerElement)!;
  const { highlightedString, remainingSearchTokens } = hilightSearchMatch(
    containerTitle.innerText,
    containerScopingTokens
  );
  containerTitle.innerHTML = `<span>${highlightedString}</span>`;
  if (containerScopingTokens.length > 0) {
    if (remainingSearchTokens.length === 0) {
      (containerElement as HTMLElement).classList.remove(Selectors.noMatch);
    } else {
      (containerElement as HTMLElement).classList.add(Selectors.noMatch);
      return;
    }
  }

  const containerTabs = $$(Selectors.tabElements, containerElement)!;
  let containerHasTabWithMatch = false;

  for (const tabElement of Array.from(containerTabs)) {
    const title = $('h3', tabElement)!;
    const url = $('h4', tabElement)!;

    let remainingSearchTokensTitle,
      remainingSearchTokensUrl: string[] = [];
    {
      const highlightResult = hilightSearchMatch(title.innerText, tabSearchTokens);
      title.innerHTML = highlightResult.highlightedString;
      remainingSearchTokensTitle = highlightResult.remainingSearchTokens;
    }
    {
      const highlightResult = hilightSearchMatch(url.innerText, tabSearchTokens);
      url.innerHTML = highlightResult.highlightedString;
      remainingSearchTokensUrl = highlightResult.remainingSearchTokens;
    }

    let allTokensWereMatched = true;
    for (const token of remainingSearchTokensTitle) {
      if (remainingSearchTokensUrl.includes(token)) {
        allTokensWereMatched = false;
        break;
      }
    }
    if (allTokensWereMatched) {
      debug(component, `************ we have a match, title: '${title.innerHTML}, url: '${url.innerHTML}'`);
      tabElement.classList.remove(Selectors.noMatch);
      containerHasTabWithMatch = true;
    } else {
      tabElement.classList.add(Selectors.noMatch);
    }
  }

  if (containerHasTabWithMatch) {
    (containerElement as HTMLElement).classList.remove(Selectors.noMatch);
  } else {
    (containerElement as HTMLElement).classList.add(Selectors.noMatch);
  }
}

// highlights a given string
export function hilightSearchMatch(originalString: string, searchTokens: string[]): HighlightResult {
  // we initialize the searchResults with one token (the complete searchTerm), that (up to now) has not matched any searchToken
  let resultTokens = Array.from([{ isMatch: false, tokenValue: originalString, matchNo: 0 } as ResultToken]);
  debug(component, `############ doing a highlight search on '${originalString}' for search string '${searchTokens}'`);

  let searchTokenCnt = 0;
  const nonMatchedTokens: string[] = [];
  for (const searchToken of searchTokens) {
    searchTokenCnt++;
    debug(component, `    search token: '${searchToken}'`);

    let searchTokenMatched = false;
    let resultTokensWithCurrentSearchToken: ResultToken[] = [];
    for (const resultToken of resultTokens) {
      const { tokenValue } = resultToken;

      debug(component, `      searching '${searchToken}' in '${tokenValue}'`);
      const indexOfMatch = tokenValue.toLowerCase().indexOf(searchToken.toLowerCase());
      if (indexOfMatch === -1 /* no match */) {
        resultTokensWithCurrentSearchToken.push(resultToken);
        continue;
      }

      // if this token was already matched by a previous searchToken, just set the information
      // that this searchToken did match
      if (resultToken.isMatch) {
        searchTokenMatched = true;
        resultTokensWithCurrentSearchToken.push(resultToken);
        continue;
      }

      const indexOfSearchMatchEnd = indexOfMatch + searchToken.length;

      resultTokensWithCurrentSearchToken.push({
        isMatch: false,
        tokenValue: tokenValue.slice(0, indexOfMatch),
      } as ResultToken);
      resultTokensWithCurrentSearchToken.push({
        isMatch: true,
        tokenValue: tokenValue.slice(indexOfMatch, indexOfSearchMatchEnd),
        matchNo: searchTokenCnt,
      } as ResultToken);
      resultTokensWithCurrentSearchToken.push({
        isMatch: false,
        tokenValue: tokenValue.length >= indexOfSearchMatchEnd ? tokenValue.slice(indexOfSearchMatchEnd) : '',
      } as ResultToken);

      searchTokenMatched = true;
    }

    resultTokens = resultTokensWithCurrentSearchToken;
    if (searchTokenMatched) {
      debug(component, '      ++++++ a token matched ... current results:', resultTokens);
    } else {
      // make sure, that the searchToken does not match the original string ... if we have the originalString
      // 'Welcome' and the search tokens 'We', 'lc' and 'Welcome' it would return that the string does not match
      // as we already split up the original term in the search results 'We', 'lc' and 'ome'
      if (!originalString.toLowerCase().includes(searchToken)) {
        nonMatchedTokens.push(searchToken);
      } else {
        debug(component, '      ////// no match in the current token but in the overall original string', resultTokens);
      }
    }
  }

  return {
    highlightedString: resultTokens.reduce(
      (result: string, { isMatch, tokenValue, matchNo }: ResultToken) =>
        (result += isMatch ? `<em class="match-${matchNo}">${tokenValue}</em>` : tokenValue),
      ''
    ),
    remainingSearchTokens: nonMatchedTokens,
  };
}
