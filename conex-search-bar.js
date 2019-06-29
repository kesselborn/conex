import {$1} from "./conex-helper.js";

const searchBar = () => `
  <form class="search" action="">
    <input title="search for tab url or title" autocomplete="off" id="search-term" type="search" name="search-term" placeholder="search for tab url or title"/>
    <input type="submit"/>
  </form>
`;

class SearchBar extends HTMLElement {
  constructor(_self) {
    const self = super(_self);

    // bind methods correctly
    for (const method of Array.from([
      "focusFirstContainer",
      "reset",
      "search"
    ])) {
      self[method] = self[method].bind(this);
    }
  }

  search() {
    console.debug("search ...");
  }

  reset() {
    console.debug("reset");
  }

   focusFirstContainer() {
    console.debug("focus first container");
   }

  // predefined methods
  connectedCallback() {
    // this.color = this.getAttribute("color");

    if (!$1("form", this)) {
      this.innerHTML = searchBar({color: this.color});
    }
    const form = $1("form", this);

    this.addEventListener("keydown", e => {
      console.debug("search bar keydown", e);
      // e.stopPropagation();
      // e.preventDefault();

      switch (e.key) {
        // keyboard shortcuts instead of clicking the mouse
        case "ArrowDown": this.focusFirstContainer(); return;
        case "Tab": if (!e.shiftKey) this.focusFirstContainer(); return;
        case "Enter": return;
        default: break;
      }
      form.dispatchEvent(new Event("change"));
    });

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
