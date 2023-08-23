import { $, $$ } from './helper.js';
import { Selectors } from './selectors.js';
import { debug } from './logger.js';

interface HighlightResult {
  highlightedString: string;
  match: boolean;
}

const component = 'search';

export function hilightSearchMatch(string: string, searchStringTokensString: string): HighlightResult {
  const searchStringTokens = searchStringTokensString.split(' ');
  let highlightedString = string;
  let match = false;
  for (let tokenIndex = 0; tokenIndex < searchStringTokens.length; tokenIndex++) {
    const searchString = searchStringTokens[tokenIndex]!;
    debug(component, `search string: '${searchString}'`);
    if (searchString === '') {
      continue;
    }

    const indexOfMatch = highlightedString.toLowerCase().indexOf(searchString.toLowerCase());
    if (indexOfMatch === -1) {
      return { highlightedString: string, match: false };
    }

    const indexOfSearchMatchEnd = indexOfMatch + searchString.length;

    highlightedString = [
      highlightedString.slice(0, indexOfMatch),
      `<em class="match-${tokenIndex + 1}">`,
      highlightedString.slice(indexOfMatch, indexOfSearchMatchEnd),
      '</em>',
      highlightedString.length >= indexOfSearchMatchEnd ? highlightedString.slice(indexOfSearchMatchEnd) : '',
    ].join('');

    match = true;
  }

  return { highlightedString: highlightedString, match: match };
}

export function searchInContainer(containerElement: Element, searchString: string) {
  if (searchString === '') {
    containerElement.classList.add(Selectors.collapsedContainer);
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
