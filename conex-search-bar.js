import {$, $1, debounce} from "./conex-helper.js";


const searchBar = () => `
  <form tabindex="-1" class="search" action="">
    <input tabindex="-1" autofocus title="search for tab url or title" autocomplete="off" id="search-term" type="search" name="search-term" placeholder="search for tab url or title"/>
    <input tabindex="-1" title="reset" type="reset" value="X"/>
    <input tabindex="-1" type="submit"/>
  </form>
`;

class SearchBar extends HTMLElement {
  constructor(_self) {
    const self = super(_self);

    // bind methods correctly
    for (const method of Array.from([
      "activateFirstMatch",
      "handleArrowDown",
      "handleKeyDown",
      "reset",
      "search"
    ])) {
      self[method] = self[method].bind(this);
    }
  }

  activateFirstMatch() {
    const firstMatch = $1("tab-item.match", this.body);
    if(firstMatch) {
      firstMatch.activateTab();
    }
  }

  // handles key events for the search bar ... return false if event was handled
  // return true if it still needs to be handled
  handleKeyDown(e) {
    switch (e.key) {
      // keyboard shortcuts instead of clicking the mouse
      case "ArrowDown": this.handleArrowDown(); break;
      case "Tab": if (!e.shiftKey) this.handleArrowDown(); break;
      case "Enter": this.activateFirstMatch(); break;
      default: {
        $1("form", this).dispatchEvent(new Event("change"));
        return true;
      }
    }
    return false;
  }

  handleArrowDown() {
    // we must use 'this.body' here, as 'document' is the document from
    // background html
    ($1("container-item.match", this.body) || $1("container-item", this.body)).focus();
  }

  // tODO: pressing escape or clicking the 'x' does not properly reset the search form
  reset() {
    $1("form", this).reset();
    $1("form", this).dispatchEvent(new Event("change"));
  }

  search() {
    const searches = [];
    const searchTerms = $1("#search-term", this).value.trim();
    for(const tabItem of $("tab-item", this.body)) {
      searches.push(tabItem.matchSearch(searchTerms === "" ? null : searchTerms.split(" ")));
    }

    Promise.all(searches).then(() => {
      for(const container of $("container-item", this.body)) {
        container.hideOnNoMatch();
      }
    });
  }

  // predefined methods
  connectedCallback() {
    this.body = this.parentElement.parentElement;

    if (!$1("form", this)) {
      this.innerHTML = searchBar({color: this.color});
    }
    const form = $1("form", this);

    $1("#search-term", form).handleKeyDown = this.handleKeyDown;
    $1("#search-term", form).handleKeyDown.bind(this);

    form.addEventListener("change", debounce(this.search, 200, false));
  }

  disconnectedCallback() {
    console.debug("search bar disconnnected");
  }

  adoptedCallback() {
    console.debug("search bar connected");
  }
}

window.customElements.define("search-bar", SearchBar);

console.debug("search-bar.js successfully loaded");
