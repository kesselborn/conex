import {$, $1, $e} from './conex-helper.js'

const containerItem = (data) => `
 <form class="container-item ${data.color}-marker" action="">
   <input type="hidden" name="container-id" value="${data.containerId}">

   <input title="expand container" type="radio" id="container-id-${data.containerId}-expand" name="action" value="expand-container">
   <label title="expand container" class="container-expander" for="container-id-${data.containerId}-expand">&#9658;</label>

   <input title="collapse container" type="radio" id="container-id-${data.containerId}-collapse" name="action" value="collapse-container">
   <label title="collapse container" class="container-collapser" for="container-id-${data.containerId}-collapse">&#9660;</label>

   <input title="change to container" type="radio" id="container-id-${data.containerId}-name" name="action" value="focus-container">
   <label title="change to container" class="container-focus" for="container-id-${data.containerId}-name">${data.containerName}</label>
   <label title="change to container" class="container-tab-count" for="container-id-${data.containerId}-name">(999 tabs)</label>

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

    this.focusFirstTab = function () {
      try {
        $1('tab-item', this).focus();
      } catch (_) {
        try {
          console.debug('empty container ... jumping to next one', this);
          this.nextElementSibling.focus();
        } catch {
          console.debug('could not find next item to focus ... seems as if I am at the end of the list', this);
        }
      }
    }

    this.focusLastTabOfPreviousContainer = function () {
      try {
        Array.from($('tab-item', this.previousElementSibling)).pop().focus();
      } catch (e) {
        try {
          console.debug('empty container ... jumping to previous one', this, e);
          this.previousElementSibling.focus();
        } catch (_) {
          console.debug('error focusing the last tab item of the previous container ... seems as if I am at the top', this);
        }
      }
    }

    this.collapseContainer = function () {
      console.debug('collapse container');
      this.classList.add('collapsed')
    }

    this.expandContainer = function () {
      this.classList.remove('collapsed')
      this.color = 'orange';
    }

    this.focusContainer = function () {
      console.debug('focus container');
    }

    this.newContainerTab = function () {
      console.debug('new container tab');
    }

    this.closeContainer = function () {
      console.debug('close container');
    }
  }

  get color() {
    return this.getAttribute('color');
  }

  set color(val) {
    console.debug('color set');
    this.setAttribute('color', val);
  }

  connectedCallback() {
    console.debug('container-item connected');
    this.ignoredKeyDownKeys = ['Tab'];
    const d = {color: this.getAttribute('color'),
              containerId: this.getAttribute('container-id'),
              containerName: this.getAttribute('container-name'),
              tabCnt: this.getAttribute('tab-cnt')};

    if(!$1('.container-item', this)) {
      const e = document.createElement("div");
      e.innerHTML = containerItem(d);
      this.prepend(e);
    }
    const form = $1('form', this);
    
    this.addEventListener("focus", e => console.debug('focused', this));
    this.addEventListener('click', e => this.focus());

    this.addEventListener("keydown", e => {
      console.debug('container-item keydown', e.target);
      if(this.ignoredKeyDownKeys.includes(e.key)) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      
      switch (e.key) {
        // keyboard shortcuts instead of hovering with the mouse
        case 'ArrowDown':  this.focusFirstTab(); return;
        case 'ArrowUp':    this.focusLastTabOfPreviousContainer(); return;
        default:           this.continueSearch(e); return; 

        // keyboard shortcuts instead of clicking the mouse
        case '+':          $1('input[value=new-tab]', this).checked = true; break;
        case 'ArrowLeft':  $1('input[value=collapse-container]', this).checked = true; break;
        case 'ArrowRight': $1('input[value=expand-container]', this).checked = true; break;
        case 'Backspace':  $1('input[value=close-container]', this).checked = true; break;
        case 'Enter':      $1('input[value=focus-container]', this).checked = true; break;
      }
      $1('form', this).dispatchEvent((new Event('change')));
    });

    const that = this;
    form.addEventListener("change", e => {
      switch($1('input[name=action]:checked', that).value) {
        case 'close-container': this.closeContainer(); break; 
        case 'collapse-container': this.collapseContainer(); break;
        case 'expand-container': this.expandContainer(); break; 
        case 'focus-container': this.focusContainer(); break; 
        case 'new-tab': this.newContainerTab(); break; 
        default: console.error('unknown action: ', $1('input[name=action]:checked'));  break;
      }
    });
  }


  continueSearch(e) {
    console.debug('continue search placeholder for:', e);
  }

  disconnectedCallback() {
    console.debug('container-item disconnnected');
  }

  adoptedCallback() {
    console.debug('container-item adopted');
  }

  static get observedAttributes() {
    return ['color'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug(`attribute ${name} changed: ${oldValue} -> ${newValue}`);
  }
};
window.customElements.define('container-item', ContainerItem);

// <container-item tabindex='1' color="blue" container-id="1" container-name="banking" tab-cnt="42">
export const createContainerComponent = function(tabIndex, containerId, containerName, color) {
  return $e('container-item', {tabindex: tabIndex,
                         container_id: containerId,
                         container_name: containerName,
                         color: color});
}
  
console.debug('conex-container-component.js successfully loaded');
