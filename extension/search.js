import { $, $$ } from './helper.js';
import { Selectors } from './selectors.js';
import { debug } from './logger.js';
const component = 'search';
export function hilightSearchMatch(originalString, searchTerm) {
    const searchTokens = searchTerm.split(' ').filter((token) => token !== '');
    // we initialize the searchResults with one token (the complete searchTerm), that (up to now) has not matched any searchToken
    let resultTokens = [{ isMatch: false, tokenValue: originalString, matchNo: 0 }];
    debug(component, `>>>>> doing a highlight search on '${originalString}' for search string '${searchTerm}'`);
    let searchTokenCnt = 0;
    for (const searchToken of searchTokens) {
        searchTokenCnt++;
        debug(component, `    search token: '${searchToken}'`);
        let searchTokenMatched = false;
        let resultTokensWithCurrentSearchToken = [];
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
            });
            resultTokensWithCurrentSearchToken.push({
                isMatch: true,
                tokenValue: tokenValue.slice(indexOfMatch, indexOfSearchMatchEnd),
                matchNo: searchTokenCnt,
            });
            resultTokensWithCurrentSearchToken.push({
                isMatch: false,
                tokenValue: tokenValue.length >= indexOfSearchMatchEnd ? tokenValue.slice(indexOfSearchMatchEnd) : '',
            });
            searchTokenMatched = true;
        }
        resultTokens = resultTokensWithCurrentSearchToken;
        if (searchTokenMatched) {
            debug(component, '      ... a token matched ... current results:', resultTokens);
        }
        else {
            debug(component, '      XXXX aborting search ... current results:', resultTokens);
            // make sure, that the searchToken does not match the original string ... if we have the originalString
            // 'Welcome' and the search tokens 'We', 'lc' and 'Welcome' it would return that the string does not match
            // as we already split up the original term in the search results 'We', 'lc' and 'ome'
            if (!originalString.includes(searchToken)) {
                return { highlightedString: originalString, match: false };
            }
        }
    }
    return {
        highlightedString: resultTokens.reduce((result, { isMatch, tokenValue, matchNo }) => (result += isMatch ? `<em class="match-${matchNo}">${tokenValue}</em>` : tokenValue), ''),
        match: true,
    };
}
export function searchInContainer(containerElement, searchString) {
    if (searchString === '') {
        containerElement.classList.add(Selectors.collapsedContainer);
        for (const element of Array.from($$(Selectors.noMatch))) {
            element.classList.remove(Selectors.noMatch);
        }
        return;
    }
    else {
        containerElement.classList.remove(Selectors.collapsedContainer);
    }
    const containerTabs = $$('li', containerElement);
    let containerHasMatch = false;
    for (const tabElement of Array.from(containerTabs)) {
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
            debug(component, `     **** we have a match, title: '${title.innerHTML}, url: '${url.innerHTML}'`);
            tabElement.classList.remove(Selectors.noMatch);
            containerHasMatch = true;
        }
        else {
            tabElement.classList.add(Selectors.noMatch);
        }
    }
    const containerTitle = $('h2', containerElement);
    const { highlightedString, match } = hilightSearchMatch(containerTitle.innerText, searchString);
    containerTitle.innerHTML = `<span>${highlightedString}</span>`;
    if (match) {
        containerHasMatch = true;
    }
    if (containerHasMatch) {
        containerElement.classList.remove(Selectors.noMatch);
    }
    else {
        containerElement.classList.add(Selectors.noMatch);
    }
}
