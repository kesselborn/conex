import {$1} from "./conex-helper.js";

const searchBar = () => `
  <form tabindex="-1" class="search" action="">
    <input tabindex="-1" autofocus title="search for tab url or title" autocomplete="off" id="search-term" type="search" name="search-term" placeholder="search for tab url or title"/>
    <input tabindex="-1" type="submit"/>
  </form>
`;

class SearchBar extends HTMLElement {
  constructor(_self) {
    const self = super(_self);

    // bind methods correctly
    for (const method of Array.from([
      "handleArrowDown",
      "handleKeyDown",
      "search"
    ])) {
      self[method] = self[method].bind(this);
    }
  }

  // handles key events for the search bar ... return false if event was handled
  // return true if it still needs to be handled
  handleKeyDown(e) {
    switch (e.key) {
      // keyboard shortcuts instead of clicking the mouse
      case "ArrowDown": this.handleArrowDown(); break;
      case "Tab": if (!e.shiftKey) this.handleArrowDown(); break;
      case "Enter": break;

      default: {
        $1("form", this).dispatchEvent(new Event("change"));
        if(e.originalEvent) {
          this.fireEvent(e.originalEvent.eventType);
        }
      }
    }
    return false;
  }

  handleArrowDown() {
    // we must use 'this.body' here, as 'document' is the document from
    // background html
    $1("container-item", this.body).focus();
  }

  search() {
    console.debug("search ...");
  }

  reset() {
    console.debug("reset");
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

    form.addEventListener("change", e => {
      e.stopPropagation();
      e.preventDefault();
      console.debug("search submitted");
      // switch ($1("input[name=action]:checked", this).value) {
      //   case "focus-tab": this.activateTab(); break;
      //   case "close-tab": this.closeTab(); break;
      //   default: console.error("unknown action: ", $1("input[name=action]:checked", this)); break;
      // }
    });
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
