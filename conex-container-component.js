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

export class ContainerItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.ignoredKeyDownKeys = ['Tab'];
    const d = {color: this.getAttribute('color'),
              containerId: this.getAttribute('container-id'),
              containerName: this.getAttribute('container-name'),
              tabCnt: this.getAttribute('tab-cnt')};

    const e = document.createElement("div");
    e.innerHTML = containerItem(d);
    this.prepend(e);
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
        // case 'Enter':     this.toggleExpand(); break;
        case '+':          $1('input[value=new-tab]', this).checked = true; break;
        case 'ArrowDown':  this.focusFirstTab(); return;
        case 'ArrowLeft':  $1('input[value=collapse-container]', this).checked = true; break;
        case 'ArrowRight': $1('input[value=expand-container]', this).checked = true; break;
        case 'ArrowUp':    this.focusLastTabOfPreviousContainer(); break;
        case 'Backspace':  $1('input[value=close-container]', this).checked = true; break;
        case 'Enter':      $1('input[value=focus-container]', this).checked = true; break;
        default:           this.continueSearch(e); return; 
      }
      $1('form', this).dispatchEvent((new Event('change')));
    });

    form.addEventListener("change", e => {
      switch($1('input[name=action]:checked').value) {
        case 'close-container': this.closeContainer(); break; 
        case 'collapse-container': this.collapseContainer(); break;
        case 'expand-container': this.expandContainer(); break; 
        case 'focus-container': this.focusContainer(); break; 
        case 'new-tab': this.newContainerTab(); break; 
        default: console.error('unknown action: ', $1('input[name=action]:checked'));  break;
      }
    });
    console.debug(this);
  }

  focusFirstTab() {
    try {
      $1('tab-item', this).focus();
    } catch(e) {
      console.warn('could not find tab item in container', this, ': ', e);
    }
  }

  focusLastTabOfPreviousContainer() {
    try {
      Array.from($('tab-item', this.previousElementSibling)).pop().focus();
    } catch(e) {
      console.warn('error focusing the last tab item of the previous container: ', e);
    }
  }

  collapseContainer() {
    console.debug('collapse container');
    this.classList.add('collapsed')
  }

  expandContainer() {
    console.debug('expand container');
    this.classList.remove('collapsed')
  }

  focusContainer() {
    console.debug('focus container');
  }

  newContainerTab() {
    console.debug('new container tab');
  }

  closeContainer() {
    console.debug('close container');
  }

  continueSearch(e) {
    console.debug('continue search placeholder for:', e);
  }

  disconnectedCallback() {
    console.debug('tab-item disconnnected');
  }

  adoptedCallback() {
    console.debug('tab-item adopted');
  }
};
window.customElements.define('container-item', ContainerItem);

// <container-item tabindex='1' color="blue" container-id="1" container-name="banking" tab-cnt="42">
export const createContainerComponent = function(containerId, containerName, tabIndex, color) {
  return $e('container-item', {tabindex: tabIndex,
                         container_id: containerId,
                         container_name: containerName,
                         color: color});
}
  
console.debug('conex-container-component.js successfully loaded');
