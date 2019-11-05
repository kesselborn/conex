import {$, $1, $e} from "./conex-helper.js";
import {createTabItem} from "./conex-tab-item.js";

const containerItem = (data) => `
 <form class="container-item ${data.color}-marker" action="">
   <input type="hidden" name="container-id" value="${data.containerId}">

   <input title="expand container" type="radio" id="container-id-${data.containerId}-expand" name="action" value="expand-container">
   <label title="expand container" class="container-expander" for="container-id-${data.containerId}-expand">&#9658;</label>

   <input title="collapse container" type="radio" id="container-id-${data.containerId}-collapse" name="action" value="collapse-container">
   <label title="collapse container" class="container-collapser" for="container-id-${data.containerId}-collapse">&#9660;</label>

   <input title="change to container" type="radio" id="container-id-${data.containerId}-name" name="action" value="focus-container">
   <label title="change to container" class="container-focus" for="container-id-${data.containerId}-name">${data.containerName}</label>
   <label title="change to container" class="container-tab-count" for="container-id-${data.containerId}-name">(1000 tabs)</label>

   <input title="new tab in container" type="radio" id="container-id-${data.containerId}-new-tab" name="action" value="new-tab">
   <label title="new tab in container" class="container-new-tab" for="container-id-${data.containerId}-new-tab">&#65291;</label>

   <input title="new tab in container" type="radio" id="container-id-${data.containerId}-close-container" name="action" value="close-container">
   <label title="new tab in container" class="container-close-container" for="container-id-${data.containerId}-close-container">&#9587;</label>


   <input type="submit">
 </form>
`;

class ContainerItem extends HTMLElement {
  constructor(_self) {
    const self = super(_self);

    for(const method of Array.from([
      "activateFirstContainerTab",
      "closeContainer",
      "collapseContainerItem",
      "continueSearch",
      "createNewTab",
      "expandContainerItem",
      "getLastTabItem",
      "hasSearchMatches",
      "isCollapsed",
      "handleArrowDown",
      "handleArrowUp",
      "handleKeyDown",
      "hideOnNoMatch",
      "focusNextVisibleContainer",
      "onTabCreated",
      "sortTabItems",
      "updateTabCnt",
      "visible"
    ])) {
      self[method] = self[method].bind(this);
    }
  }

  closeContainer() {
    console.debug("close container");
    this.updateTabCnt();
  }

  isCollapsed() {
    return this.classList.contains("collapsed") && !this.classList.contains("match");
  }

  // tODO: collapse containers with 0 tabs on search
  collapseContainerItem() {
    if (this.isCollapsed()) {
      // for keyboard navigation: pressing '<-' collapses the container, second time jumps to previous container
      if(this.previousElementSibling) this.previousElementSibling.focus();
    } else if (this.classList.contains("match")) {
      this.classList.add("search-collapsed");
    } else {
      this.classList.add("collapsed");
    }
  }

  continueSearch(e) {
    console.debug("continue search placeholder for:", e);
  }

  expandContainerItem() {
    if (this.classList.contains("search-collapsed")) {
      this.classList.remove("search-collapsed");
      return;
    }
    if (this.classList.contains("collapsed")) {
      this.classList.remove("collapsed");
    } else {
      // for keyboard navigation: pressing '->' expands the container, second time jumps to next container
      // eslint-disable-next-line no-lonely-if
      if(this.nextElementSibling) this.nextElementSibling.focus();
    }
  }

  activateFirstContainerTab() {
    const firstTab = $1("tab-item[style*='order: 0']", this);
    if(firstTab) {
      firstTab.activateTab();
    } else {
      this.createNewTab();
    }
  }

  // handles key events for container items ... return false if event was handled
  // return true if it still needs to be handled
  handleKeyDown(e) {
    switch (e.key) {
      // keyboard shortcuts instead of hovering with the mouse
      case "ArrowDown": this.handleArrowDown(); return false;
      case "ArrowUp": return !this.handleArrowUp();
      case "Tab": if (e.shiftKey) return !this.handleArrowUp(); return !this.handleArrowDown();
      default: return true;

      // keyboard shortcuts instead of clicking the mouse
      case "+": $1("input[value=new-tab]", this).checked = true; break;
      case "ArrowLeft": $1("input[value=collapse-container]", this).checked = true; break;
      case "ArrowRight": $1("input[value=expand-container]", this).checked = true; break;
      case "Backspace": $1("input[value=close-container]", this).checked = true; break;
      case "Enter": $1("input[value=focus-container]", this).checked = true; break;
    }
    $1("form", this).dispatchEvent(new Event("change"));
    return false;
  }

  hasSearchMatches() {
    return this.classList.contains("match");
  }

  focusNextVisibleContainer() {
    try {
      console.debug("empty container or all tabs are hidden ... jumping to next container", this);

      // if we are in search mode, jump to the next container that
      // has search matches
      if (this.hasSearchMatches()) {
        let cur = this.nextElementSibling;
        while (!cur.hasSearchMatches()) {
          cur = cur.nextElementSibling;
        }
        cur.focus();
      } else {
        this.nextElementSibling.focus();
      }
      return true;
    } catch (_) {
      console.debug("could not find next item to focus ... seems as if I am at the end of the list", this);
      return false;
    }
  }

  handleArrowDown() {
    const firstTab = $1("tab-item[style*='order: 0']", this);
    if (!this.isCollapsed() && firstTab) {
      firstTab.focus();
      return true;
    }

    return this.focusNextVisibleContainer();
  }

  handleArrowUp() {
    if(this.previousElementSibling) {
      const lastTabOfPreviousContainer = this.previousElementSibling.getLastTabItem();
      if(!this.previousElementSibling.isCollapsed() && lastTabOfPreviousContainer) {
        lastTabOfPreviousContainer.focus();
        return true;
      }
      if(this.classList.contains("match")) {
        let cur = this.previousElementSibling;
        while(!cur.classList.contains("match")) {
          cur = cur.previousElementSibling;
        }
        cur.focus();
      } else {
        this.previousElementSibling.focus();
      }
      return true;
    }

    return false;
  }

  hideOnNoMatch() {
    if($("tab-item.match", this).length === 0 && $("tab-item.no-match", this).length === 0) {
      this.classList.remove("match", "no-match", "search-collapsed");
    } else if($("tab-item.match", this).length === 0) {
      this.classList.remove("match");
      this.classList.add("no-match");
    } else {
      this.classList.remove("no-match");
      this.classList.add("match");
    }
    this.sortTabItems(this.containerId);
  }

  getLastTabItem() {
    return $1(`tab-item[style*="order: ${this.tabCnt - 1};"]`, this);
  }

  createNewTab() {
    browser.tabs.create({
      active: true,
      cookieStoreId: this.containerId
    }).catch(e => `error creating new tab for container ${this.containerId}: ${e}`);

    if(this.body.tabCreatedCallback) {
      this.body.tabCreatedCallback();
    }
  }

  async onTabCreated(tab) {
    if (tab.cookieStoreId !== this.containerId) return;
    this.appendChild(await createTabItem(tab.id, tab.title, tab.url, this.color, tab.favIconUrl));
    this.updateTabCnt();
  }

  // todo: implement more sorting strategies
  // todo: make sorting accessible in ui
  async sortTabItems(cookieStoreId) {
    const tabs = await window.browser.tabs.query({cookieStoreId});
    let sortedTabs = null;
    switch (window.settings.order) {
      case "lru":
        sortedTabs = tabs.sort((a, b) => a.lastAccessed < b.lastAccessed);
        break;
      case "index":
      default: sortedTabs = tabs.sort((a, b) => a.index < b.index);
    }

    let cnt = 0;
    for (let i = 0; i < sortedTabs.length; i += 1) {
      try {
        const tabItem = $1(`tab-item[tab-id="${sortedTabs[i].id}"]`, this);
        if(this.classList.contains("match")) {
          if(tabItem.classList.contains("match")) {
            tabItem.order = cnt;
            cnt += 1;
          } else {
            tabItem.order = -1;
          }
        } else {
          tabItem.order = i;
        }
      } catch (e) {
        console.warn(`error sorting tabs in ${cookieStoreId}: index: ${i}, tab #${sortedTabs[i].id} / ${sortedTabs[i].url}: ${e}`);
      }
    }
  }

  updateTabCnt() {
    // there can be race-conditions here, so let's skip one step
    // in the event loop and count tab-items after that
    setTimeout(() => {
      this.tabCnt = $("tab-item", this).length;
      this.setAttribute("tab-cnt", this.tabCnt);
      $1(".container-tab-count", this).innerText = `(${this.tabCnt} tabs)`;
      this.blur();
    }, 0);
  }

  visible() {
    return window.getComputedStyle(this) !== "none";
  }

  // predefined methods
  connectedCallback() {
    console.debug("container-item connected");
    this.body = this.parentElement.parentElement.parentElement;
    this.color = this.getAttribute("color");
    this.containerId = this.getAttribute("container-id");
    this.containerName = this.getAttribute("container-name");
    this.tabCnt = this.getAttribute("tab-cnt");

    if (!$1(".container-item", this)) {
      const e = document.createElement("div");
      e.innerHTML = containerItem({
        color: this.color,
        containerId: this.containerId,
        containerName: this.containerName,
        tabCnt: this.tabCnt
      });
      this.prepend(e);
    }
    const form = $1("form", this);

    this.addEventListener("click", () => this.focus());

    const that = this;
    form.addEventListener("change", () => {
      switch ($1("input[name=action]:checked", that).value) {
        case "close-container": this.closeContainer(); break;
        case "collapse-container": this.collapseContainerItem(); break;
        case "expand-container": this.expandContainerItem(); break;
        case "focus-container": this.activateFirstContainerTab(); break;
        case "new-tab": this.createNewTab(); break;
        default: console.error("unknown action: ", $1("input[name=action]:checked")); break;
      }
      form.reset();
    });

    this.updateTabCnt();
  }

  disconnectedCallback() {
    console.debug("container-item disconnnected");
  }

  // adoptedCallback() {
  //  console.debug("container-item adopted");
  // }

  static get observedAttributes() {
    return ["color"];
  }
}
window.customElements.define("container-item", ContainerItem);

// <container-item tabindex='1' color="blue" container-id="1" container-name="banking" tab-cnt="42">
export const createContainerItem = (containerId, containerName, color) => $e("container-item", {
  class: "collapsed",
  color,
  container_id: containerId,
  container_name: containerName,
  tabindex: 0
});

console.debug("conex-container-item.js successfully loaded");
