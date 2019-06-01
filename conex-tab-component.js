import {$1, $e, placeholderImage} from "./conex-helper.js";

const tabItem = (data) => `
  <form class="tab-item ${data.color}-marker" action="">
    <input type="hidden" name="tab-id" value="${data.tabId}"/>
    <input title="show tab" type="radio" id="tabid-${data.tabId}-title" name="action" value="focus-tab"/>
    <label title="show tab" class="tab-thumbnail" for="tabid-${data.tabId}-title">
      <img class="thumbnail-image" src="${data.thumbnail}" width="200"/>
    </label>
    <label title="show tab" class="tab-favicon" for="tabid-${data.tabId}-title">
      <img class="favicon-image" src="${data.favicon}" />
    </label>
    <label title="show tab" class="tab-content" for="tabid-${data.tabId}-title">
        <div class="tab-title">${data.title}</div>
        <div class="tab-url">${data.url}</div>
    </label>
    <input title="close tab" type="radio" id="tabid-${data.tabId}-close-tab" name="action" value="close-tab"/>
    <label title="close tab" class="tab-close" for="tabid-${data.tabId}-close-tab">&#9587;</label>
    <input type="submit"/>
  </form>
`;

class TabItem extends HTMLElement {
  constructor(_self) {
    const self = super(_self);

    for (const method of Array.from([
      "closeTab",
      "continueSearch",
      "focusNextTabOrContainer",
      "focusPreviousTabOrContainer",
      "focusTab",
      "onUpdated",
      "updateThumbnail",
      "visible"
    ])) {
      self[method] = self[method].bind(this);
    }

    for (const property of Array.from(["order"])) {
      const uppercasedPropertyName = property.replace(/^\w/, c => c.toUpperCase());
      const setterName = `set${uppercasedPropertyName}`;
      const getterName = `get${uppercasedPropertyName}`;

      self[setterName] = self[setterName].bind(this);
      self[getterName] = self[getterName].bind(this);
      Reflect.defineProperty(this, property, {
        get: self[getterName],
        set: self[setterName]
      });
    }
  }

  closeTab() {
    window.browser.tabs.remove(this.tabId);
  }

  continueSearch() {
    console.debug("continue search");
  }

  focusNextTabOrContainer() {
    const nextTab = $1(`tab-item[style*="order: ${this.order + 1};"]`, this.parentElement);

    if (nextTab) {
      if(nextTab.visible()) {
        nextTab.focus();
      } else {
        nextTab.focusNextTabOrContainer();
      }
      return;
    }

    if (this.parentElement.nextElementSibling) { this.parentElement.nextElementSibling.focus(); }
  }

  focusPreviousTabOrContainer() {
    if (this.order === 0) {
      this.parentElement.focus();
      return;
    }

    const prevTab = $1(`tab-item[style*="order: ${this.order - 1};"]`, this.parentElement);
    if(prevTab.visible()) {
      prevTab.focus();
    } else {
      prevTab.focusPreviousTabOrContainer();
    }
  }

  focusTab() {
    window.browser.tabs.update(this.tabId, {active: true});
    console.debug("show tab");
  }

  // eslint-disable-next-line no-unused-vars
  onUpdated(tabId, newValues, tab) {
    if (tabId !== this.tabId) return;
    // if(newValues.attention)
    // if(newValues.audible)
    if (newValues.favIconUrl) $1(".favicon-image", this).src = newValues.favIconUrl;
    // if(newValues.mutedInfo)
    // if(newValues.pinned)
    if (newValues.status === "loading") $1("img.thumbnail-image", this).src = placeholderImage;

    if (newValues.title) {
      $1(".tab-title", this).innerText = newValues.title;
      this.title = newValues.title;
      this.title = newValues.title;
    }

    if (newValues.url) {
      $1(".tab-url", this).innerText = newValues.url;
      this.url = newValues.url;
      this.setAttribute("url", newValues.url);
    }

    // this needs to be at the bottom as it depends on changes to url
    if (newValues.status === "complete" && tab.url !== "about:blank") {
      this.updateThumbnail();
    }
  }

  updateThumbnail() {
    window.getThumbnail(this.tabId, this.url).then(thumbnail => {
      console.debug(`got thumbnail for ${this.url}`);
      const img = $1("img.thumbnail-image", this);
      if (img) {
        img.src = thumbnail;
      }
    }, e => console.error(`error getting cached thumbnail: ${e}`));
  }

  visible() {
    return window.getComputedStyle(this).display !== "none";
  }

  // property methods
  setOrder(index) {
    this.style.order = index;
  }

  getOrder() {
    return parseInt(this.style.order, 10);
  }

  // predefined methods
  connectedCallback() {
    this.color = this.getAttribute("color");
    this.favicon = this.getAttribute("favicon");
    this.tabId = parseInt(this.getAttribute("tab-id"), 10);
    this.thumbnail = this.getAttribute("thumbnail");
    this.title = this.getAttribute("tab-title");
    this.url = this.getAttribute("url");

    if (!$1("form", this)) {
      this.innerHTML = tabItem({
        color: this.color,
        favicon: this.favicon,
        tabId: this.tabId,
        thumbnail: this.thumbnail,
        title: this.title,
        url: this.url
      });
    }
    const form = $1("form", this);

    // todo: central event handling
    this.addEventListener("keydown", e => {
      console.debug("tab-item keydown", e);
      e.stopPropagation();
      e.preventDefault();

      switch (e.key) {
        // keyboard shortcuts instead of clicking the mouse
        case "ArrowUp": this.focusPreviousTabOrContainer(); return;
        case "ArrowDown": this.focusNextTabOrContainer(); return;
        case "Tab": if (e.shiftKey) this.focusPreviousTabOrContainer(); else this.focusNextTabOrContainer(); return;
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
      switch ($1("input[name=action]:checked", this).value) {
        case "focus-tab": this.focusTab(); break;
        case "close-tab": this.closeTab(); break;
        default: console.error("unknown action: ", $1("input[name=action]:checked", this)); break;
      }
      form.reset();
    });

    const img = $1("img.thumbnail-image", this);
    if (img.src === placeholderImage && this.url !== "about:blank") {
      window.browser.tabs.get(this.tabId).then(tab => {
        if (!tab.discarded) {
          this.updateThumbnail();
        }

      });
    }
    // todo: central event handling ?
    browser.tabs.onUpdated.addListener(this.onUpdated);
    // todo: central event handling ?
    browser.tabs.onRemoved.addListener(tabId => {
      if (tabId === this.tabId) {
        this.parentElement.updateTabCnt();
        try {
          this.nextElementSibling.focus();
          // eslint-disable-next-line no-empty
        } catch (_) { }

        this.remove();
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
export const createTabComponent = (tabId, tabTitle, url, color, faviconIn, thumbnail) => {
  let favicon = faviconIn;
  if (!favicon || favicon.startsWith("chrome://")) {
    favicon = placeholderImage;
  }

  const tabElement = $e("tab-item", {
    color,
    draggable: true,
    favicon,
    tab_id: tabId,
    tab_title: tabTitle || "...",
    tabindex: 0,
    thumbnail: thumbnail || placeholderImage,
    url
  });

  return tabElement;
};

console.debug("conex-tab-component.js successfully loaded");
