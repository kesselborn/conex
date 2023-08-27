import { $, $$ } from './helper.js';
import { Selectors } from './selectors.js';
import { debug } from './logger.js';

interface HighlightResult {
  highlightedString: string;
  match: boolean;
}

const component = 'search';

interface Token {
  isMatch: boolean;
  matchNo: number | undefined;
  token: string;
}

export function hilightSearchMatch(string: string, searchStringTokensString: string): HighlightResult {
  const searchStringTokens = searchStringTokensString.split(' ');
  let searchResults = [{ isMatch: false, token: string, matchNo: 0 } as Token];
  debug(component, `>>>>> doing a highlight search on '${string}' for search string '${searchStringTokensString}'`);
  for (let tokenIndex = 0; tokenIndex < searchStringTokens.length; tokenIndex++) {
    const searchString = searchStringTokens[tokenIndex]!;
    debug(component, `    search string: '${searchString}'`);
    if (searchString === '') {
      continue;
    }

    let matchFound = false;
    let xxx: Token[] = [];
    for (let resultIndex = 0; resultIndex < searchResults.length; resultIndex++) {
      const { token, isMatch } = searchResults[resultIndex]!;
      debug(component, `      searching '${searchString}' in '${token}'`);
      const indexOfMatch = token.toLowerCase().indexOf(searchString.toLowerCase());
      if (indexOfMatch === -1) {
        xxx.push(searchResults[resultIndex]!);
        continue;
      } else {
        // if this token was already matched by a previous searchToken, just set the information
        // that this token matched
        if (isMatch) {
          matchFound = true;
          xxx.push(searchResults[resultIndex]!);
          continue;
        }
      }

      const indexOfSearchMatchEnd = indexOfMatch + searchString.length;

      xxx.push({ isMatch: false, token: token.slice(0, indexOfMatch) } as Token);
      xxx.push({
        isMatch: true,
        token: token.slice(indexOfMatch, indexOfSearchMatchEnd),
        matchNo: tokenIndex + 1,
      } as Token);
      xxx.push({
        isMatch: false,
        token: token.length >= indexOfSearchMatchEnd ? token.slice(indexOfSearchMatchEnd) : '',
      } as Token);

      matchFound = true;
    }
    searchResults = xxx;
    if (!matchFound) {
      debug(component, '      XXXX aborting search ... current results:', searchResults);
      return { highlightedString: string, match: false };
    } else {
      debug(component, '      ... a token matched ... current results:', searchResults);
    }
  }

  let resultString = '';
  for (const yyy of searchResults) {
    const { token, isMatch, matchNo } = yyy;
    if (token === '') {
      continue;
    }
    if (isMatch) {
      resultString += `<em class="match-${matchNo}">${token}</em>`;
    } else {
      resultString += token;
    }
  }

  return { highlightedString: resultString, match: true };
}

export function searchInContainer(containerElement: Element, searchString: string) {
  if (searchString === '') {
    containerElement.classList.add(Selectors.collapsedContainer);
    for (const element of Array.from($$(Selectors.noMatch))) {
      element.classList.remove(Selectors.noMatch);
    }
    return;
  } else {
    containerElement.classList.remove(Selectors.collapsedContainer);
  }

  const containerTabs = $$('li', containerElement)!;
  let containerHasMatch = false;
  for (const tabElement of Array.from(containerTabs)) {
    const title = $('h3', tabElement)!;
    const url = $('h4', tabElement)!;

    let containedMatch = false;
    {
      const { highlightedString, match } = hilightSearchMatch(title.innerText, searchString);
      title.innerHTML = highlightedString;
      if (match) {
        containedMatch = true;
      }
    }
    {
      const { highlightedString, match } = hilightSearchMatch(url.innerText, searchString);
      url.innerHTML = highlightedString;
      if (match) {
        containedMatch = true;
      }
    }

    if (containedMatch) {
      debug(component, `     **** we have a match, title: '${title.innerHTML}, url: '${url.innerHTML}'`);
      tabElement.classList.remove(Selectors.noMatch);
      containerHasMatch = true;
    } else {
      tabElement.classList.add(Selectors.noMatch);
    }
  }

  const containerTitle = $('h2', containerElement)!;
  const { highlightedString, match } = hilightSearchMatch(containerTitle.innerText, searchString);
  containerTitle.innerHTML = `<span>${highlightedString}</span>`;
  if (match) {
    containerHasMatch = true;
  }

  if (containerHasMatch) {
    (containerElement as HTMLElement).classList.remove(Selectors.noMatch);
  } else {
    (containerElement as HTMLElement).classList.add(Selectors.noMatch);
  }
}
