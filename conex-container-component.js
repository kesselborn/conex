import {$, $1, $e} from "./conex-helper.js";
import {createTabComponent} from "./conex-tab-component.js";

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
  constructor() {
    super();

    this.visible = () => window.getComputedStyle(this) !== "none";

    this.focusFirstTab = () => {
      for (const tabItem of $("tab-item", this)) {
        if (tabItem.visible()) {
          tabItem.focus();
          return;
        }
      }
      try {
        console.debug("empty container or all tabs are hidden ... jumping to next container", this);
        this.nextElementSibling.focus();
      } catch (_) {
        console.debug("could not find next item to focus ... seems as if I am at the end of the list", this);
      }
    };

    this.focusLastTabOfPreviousContainer = () => {
      for (const tabItem of Array.from($("tab-item", this.previousElementSibling)).reverse()) {
        if (tabItem.visible()) {
          tabItem.focus();
          return;
        }
      }
      try {
        console.debug("empty container or all tabs are hidden ... jumping to previous container", this);
        this.previousElementSibling.focus();
      } catch (e) {
        console.debug("error focusing the last tab item of the previous container ... seems as if I am at the top", e, this);
      }
    };

    this.collapseContainer = () => {
      if (this.classList.contains("collapsed")) {
        this.previousElementSibling.focus();
      } else {
        this.classList.add("collapsed");
      }
    };

    this.expandContainer = () => {
      if (this.classList.contains("collapsed")) {
        this.classList.remove("collapsed");
      } else {
        this.nextElementSibling.focus();
      }
    };

    this.focusContainer = () => {
      console.debug("focus container");
    };

    this.newContainerTab = () => {
      console.debug("new container tab");
    };

    this.updateTabCnt = () => {
      // there can be race-conditions here, so let's skip one step
      // in the event loop and count tab-items after that
      setTimeout(() => {
        this.tabCnt = $("tab-item", this).length;
        this.setAttribute("tab-cnt", this.tabCnt);
        $1(".container-tab-count", this).innerText = `(${this.tabCnt} tabs)`;
        this.blur();
      }, 0);
    };

    this.closeContainer = () => {
      console.debug("close container");
      this.updateTabCnt();
    };

    this.onTabCreated = (tab) => {
      if (tab.cookieStoreId !== this.containerId) return;
      this.appendChild(createTabComponent(tab.id, tab.title, tab.url, this.color, tab.favIconUrl));
      this.updateTabCnt();
    };

    this.sortTabs = async(t) => {
      if (t.cookieStoreId !== this.containerId) return;
      const tabs = await window.browser.tabs.query({cookieStoreId: this.containerId});
      console.log("sorted tab");

      for (const tab of tabs.sort((a, b) => a.index < b.index)) {
        console.log(`setting ${tab.id} to ${tab.index}`);
        $1(`tab-item[tab-id="${tab.id}"]`, this).setOrder(tab.index);
      }
    };


  }

  connectedCallback() {
    console.debug("container-item connected");
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

    this.addEventListener("focus", () => console.debug("focused", this));
    this.addEventListener("click", () => this.focus());

    this.addEventListener("keydown", e => {
      console.debug("container-item keydown", e.target);
      e.stopPropagation();
      e.preventDefault();

      switch (e.key) {
        // keyboard shortcuts instead of hovering with the mouse
        case "ArrowDown": this.focusFirstTab(); return;
        case "ArrowUp": this.focusLastTabOfPreviousContainer(); return;
        case "Tab": if (e.shiftKey) this.focusLastTabOfPreviousContainer(); else this.focusFirstTab(); return;
        default: this.continueSearch(e); return;

        // keyboard shortcuts instead of clicking the mouse
        case "+": $1("input[value=new-tab]", this).checked = true; break;
        case "ArrowLeft": $1("input[value=collapse-container]", this).checked = true; break;
        case "ArrowRight": $1("input[value=expand-container]", this).checked = true; break;
        case "Backspace": $1("input[value=close-container]", this).checked = true; break;
        case "Enter": $1("input[value=focus-container]", this).checked = true; break;
      }
      $1("form", this).dispatchEvent(new Event("change"));
    });

    const that = this;
    form.addEventListener("change", () => {
      switch ($1("input[name=action]:checked", that).value) {
        case "close-container": this.closeContainer(); break;
        case "collapse-container": this.collapseContainer(); break;
        case "expand-container": this.expandContainer(); break;
        case "focus-container": this.focusContainer(); break;
        case "new-tab": this.newContainerTab(); break;
        default: console.error("unknown action: ", $1("input[name=action]:checked")); break;
      }
      form.reset();
    });

    browser.tabs.onCreated.addListener(this.onTabCreated);
    browser.tabs.onCreated.addListener(this.sortTabs);
    this.updateTabCnt();
  }


  continueSearch(e) {
    console.debug("continue search placeholder for:", e);
  }

  disconnectedCallback() {
    console.debug("container-item disconnnected");
  }

  adoptedCallback() {
    console.debug("container-item adopted");
  }

  static get observedAttributes() {
    return ["color"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug(`attribute ${name} changed: ${oldValue} -> ${newValue}`);
  }
}
window.customElements.define("container-item", ContainerItem);

// <container-item tabindex='1' color="blue" container-id="1" container-name="banking" tab-cnt="42">
export const createContainerComponent = (containerId, containerName, color) => $e("container-item", {
  color,
  container_id: containerId,
  container_name: containerName,
  tabindex: 0
});

console.debug("conex-container-component.js successfully loaded");
