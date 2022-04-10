import { $, $$ } from './conex-helper.js';
import { Selectors } from './conex-selectors.js';

interface HighlightResult {
  highlightedString: string;
  match: boolean;
}

export function hilightSearchMatch(string: string, searchStringTokensString: string): HighlightResult {
  const searchStringTokens = searchStringTokensString.split(' ');
  for (const searchString of searchStringTokens) {
    const indexOfMatch = string.toLowerCase().indexOf(searchString.toLowerCase());
    if (indexOfMatch === -1) {
      continue;
    }

    const indexOfSearchMatchEnd = indexOfMatch + searchString.length;

    const highlightedStringTokens = [
      string.slice(0, indexOfMatch),
      '<em>',
      string.slice(indexOfMatch, indexOfSearchMatchEnd),
      '</em>',
      string.length >= indexOfSearchMatchEnd ? string.slice(indexOfSearchMatchEnd) : '',
    ];

    return {
      highlightedString: highlightedStringTokens.join(''),
      match: true,
    };
  }
  return { highlightedString: string, match: false };
}

export function searchInContainer(containerElement: Element, searchString: string) {
  if(searchString === '') {
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
