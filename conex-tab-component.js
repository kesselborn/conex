import {$1, $e} from "./conex-helper.js";

const tabItem = (data) => `
  <form class="tab-item ${data.color}-marker" action="">
    <input type="hidden" name="tab-id" value="${data.tabId}"/>
    <input title="show tab${data.tooltipText}" type="radio" id="tabid-${data.tabId}-title" name="action" value="focus-tab"/>
    <label title="show tab${data.tooltipText}" class="tab-thumbnail" for="tabid-${data.tabId}-title">
      <img class="thumbnail-image" src="${data.thumbnail}" alt="thumbnail" width="200"/>
    </label>
    <label title="show tab${data.tooltipText}" class="tab-favicon" for="tabid-${data.tabId}-title">
      <img class="favicon-image" alt="favicon" src="${data.favicon}" />
    </label>
    <label title="show tab${data.tooltipText}" class="tab-content" for="tabid-${data.tabId}-title">
        <div class="tab-title">${data.title}</div>
        <div class="tab-url">${data.url}</div>
    </label>
    <input title="close tab${data.tooltipText}" type="radio" id="tabid-${data.tabId}-close-tab" name="action" value="close-tab"/>
    <label title="close tab${data.tooltipText}" class="tab-close" for="tabid-${data.tabId}-close-tab">&#9587;</label>
    <input type="submit"/>
  </form>
`;

class TabItem extends HTMLElement {
  constructor() {
    super();

    this.focusTab = function() {
      console.debug("show tab");
    };

    this.continueSearch = function(e) {
      console.debug("continue search placeholder for:", e);
    };

    this.closeTab = function() {
      console.debug("close tab");
    };

    this.visible = function() {
      return window.getComputedStyle(this).display !== "none";
    };

    this.focusNextTabOrContainer = function() {
      let elem = null;

      do {
        elem = (elem || this).nextElementSibling;
        if (elem === null) {
          if(this.parentElement.nextElementSibling) { this.parentElement.nextElementSibling.focus(); }
          return;
        }
      } while(!elem.visible());

      elem.focus();
    };

    this.focusPreviousTabOrContainer = function() {
      let elem = null;

      do {
        elem = (elem || this).previousElementSibling;
        if (elem.nodeName !== "TAB-ITEM") {
          this.parentElement.focus();
          return;
        }
      } while (!elem.visible());

      elem.focus();
    };
  }

  connectedCallback() {
    const d = {
      color: this.getAttribute("color"),
      favicon: this.getAttribute("favicon"),
      tabId: this.getAttribute("tab-id"),
      thumbnail: this.getAttribute("thumbnail"),
      title: this.getAttribute("tab-title"),
      url: this.getAttribute("url")
    };

    // eslint-disable-next-line no-magic-numbers
    d.tooltipText = ["\n\n", d.title.substr(0, 120), d.title.length > 120 ? "..." : "", "\n", d.url.length > 500 ? `${d.url.substr(0, 100)}...` : d.url].join("");

    this.innerHTML = tabItem(d);
    const form = $1("form", this);

    this.addEventListener("keydown", e => {
      console.debug("tab-item keydown", e);
      e.stopPropagation();
      e.preventDefault();

      switch (e.key) {
        // keyboard shortcuts instead of clicking the mouse
        case "ArrowUp": this.focusPreviousTabOrContainer(); return;
        case "ArrowDown": this.focusNextTabOrContainer(); return;
        case "Tab": if(e.shiftKey) this.focusPreviousTabOrContainer(); else this.focusNextTabOrContainer(); return;
        case "ArrowLeft": this.parentElement.focus(); return;
        case "ArrowRight": this.parentElement.nextElementSibling.focus(); return;
        default: this.continueSearch(e); return;

        // keyboard shortcuts instead of hovering with the mouse
        case "Enter": $1("input[value=focus-tab]", this).checked = true; break;
        case "Backspace": $1("input[value=close-tab]", this).checked = true; break;
      }
      form.dispatchEvent(new Event("change"));
    });

    form.addEventListener("change", e => {
      e.stopPropagation();
      e.preventDefault();
      switch($1("input[name=action]:checked", this).value) {
        case "focus-tab": this.focusTab(); break;
        case "close-tab": this.closeTab(); break;
        default: console.error("unknown action: ", $1("input[name=action]:checked", this)); break;
      }
    });

//    this.addEventListener("dragstart", function(event) {
//      event.dataTransfer.setData("text", this.id);
//    });
//
//    this.addEventListener("dragenter", function(event) {
//      console.debug("dragenter", this);
//      event.preventDefault();
//    });
//    this.addEventListener("dragover", function(event) {
//      event.preventDefault();
//    });
//    this.addEventListener("drop", function(event) {
//      event.preventDefault();
//    });
//    this.addEventListener("dragleave", function(event) {
//      if(event.target == form) {
//        this.classList.remove("dragging");
//      }
//      console.info("dragleave", event.target);
//    });
  }


  disconnectedCallback() {
    console.debug("tab-item disconnnected");
  }

  adoptedCallback() {
    console.debug("tab-item adopted");
  }
}

window.customElements.define("tab-item", TabItem);

// <tab-item color="blue-marker" tab-id="42" thumbnail="./thumbnail.jpg" favicon="./favicon.ico" tab-title="0 this is a wonderful title" url="heise.de/artikel/golang"></tab-item>
export const createTabComponent = function(tabId, tabTitle, url, color, thumbnail, faviconIn) {
  let favicon = faviconIn;
  if(!favicon || favicon.startsWith("chrome://")) {
    favicon = "./favicon-placeholder.png";
  }
  return $e("tab-item", {
    color,
    draggable: true,
    favicon,
    tab_id: tabId,
    tab_title: tabTitle || "...",
    tabindex: 0,
    thumbnail,
    url
  });
};

console.debug("conex-tab-component.js successfully loaded");
