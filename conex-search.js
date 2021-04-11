export function hilightSearchMatch(string, searchStringTokensString) {
  const searchStringTokens = searchStringTokensString.split(' ');
  for (const searchString of searchStringTokens) {
    const indexOfMatch = string.indexOf(searchString);
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
