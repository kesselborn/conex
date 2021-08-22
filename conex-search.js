import { $, $$ } from './conex-helper.js';

export function hilightSearchMatch(string, searchStringTokensString) {
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

export function searchInContainer(containerElement, searchString) {
  const containerTabs = $$('li', containerElement);
  for (const tabElement of containerTabs) {
    const title = $('h3', tabElement);
    const url = $('h4', tabElement);

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
      tabElement.classList.remove('no-match');
    } else {
      tabElement.classList.add('no-match');
    }
  }
}
