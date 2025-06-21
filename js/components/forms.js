import { adwGenerateId } from './utils.js'; // SpinButton might use it, Entry likely not.
// For createAdwButton used in SpinButton, assume it's available via global Adw or direct import later.
// For now, direct import for clarity if refactoring SpinButton fully.
import { createAdwButton } from './button.js';


/**
 * Creates an Adwaita-style text entry.
 * @param {object} [options={}] - Configuration options for the entry.
 * @param {string} [options.placeholder] - Placeholder text for the entry.
 * @param {string} [options.value] - Initial value for the entry.
 * @param {function} [options.onInput] - Callback function for the input event.
 * @param {boolean} [options.disabled=false] - If true, disables the entry.
 * @returns {HTMLInputElement} The created entry element.
 */
export function createAdwEntry(options = {}) {
  const opts = options || {};
  const entry = document.createElement("input");
  entry.type = "text";
  entry.classList.add("adw-entry");

  if (opts.placeholder) {
    entry.placeholder = opts.placeholder;
  }
  if (opts.value) {
    entry.value = opts.value;
  }
  if (typeof opts.onInput === 'function') {
    entry.addEventListener("input", opts.onInput);
  }
  if (opts.disabled) {
    entry.setAttribute("disabled", "");
    entry.setAttribute("aria-disabled", "true");
  }
  if (opts.name) { // Added from original
    entry.name = opts.name;
  }
  return entry;
}

export class AdwEntry extends HTMLElement {
    static get observedAttributes() { return ['placeholder', 'value', 'disabled', 'name', 'required', 'type']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._inputElement = null;
    }
    connectedCallback() {
        this._render();
        // No, value should be set by _render based on attribute for initial consistency.
        // if (this._inputElement) {
        //     if (this.hasAttribute('value')) this._inputElement.value = this.getAttribute('value');
        // }
        // Event listener for internal input to update the component's value property/attribute
        if(this._inputElement) {
            this._inputElement.addEventListener('input', (e) => {
                this.value = e.target.value; // Use setter to update attribute and dispatch event
            });
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // If only value changes, update internal input. Otherwise, full re-render.
            if (name === 'value' && this._inputElement && this._inputElement.value !== newValue) {
                 this._inputElement.value = newValue;
            } else if (name === 'disabled' && this._inputElement) {
                 this._inputElement.disabled = this.hasAttribute('disabled');
            }
            else {
                this._render();
            }
        }
    }
    _render() {
        const alreadyRendered = !!this._inputElement;
        if (!alreadyRendered) {
             while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            this._inputElement = document.createElement("input");
            this._inputElement.classList.add("adw-entry");
            this.shadowRoot.appendChild(this._inputElement);
        }

        this._inputElement.placeholder = this.getAttribute('placeholder') || '';
        this._inputElement.value = this.getAttribute('value') || '';
        this._inputElement.disabled = this.hasAttribute('disabled');
        if (this.hasAttribute('name')) this._inputElement.name = this.getAttribute('name'); else this._inputElement.removeAttribute('name');
        if (this.hasAttribute('required')) this._inputElement.required = true; else this._inputElement.required = false;
        this._inputElement.type = this.hasAttribute('type') ? this.getAttribute('type') : 'text';
    }
    get value() { return this._inputElement ? this._inputElement.value : (this.getAttribute('value') || ''); }
    set value(val) {
        const oldValue = this.value;
        if (this._inputElement) this._inputElement.value = val;
        this.setAttribute('value', val);
        if (oldValue !== val) { // Dispatch change event if value actually changed
            this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }
    }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
        if (this._inputElement) this._inputElement.disabled = isDisabled;
    }
    focus(options) { if(this._inputElement) this._inputElement.focus(options); }
    blur() { if(this._inputElement) this._inputElement.blur(); }
}

/**
 * Creates an Adwaita-style SpinButton control.
 */
export function createAdwSpinButton(options = {}) {
  const opts = options || {};
  const spinButtonWrapper = document.createElement('div');
  spinButtonWrapper.classList.add('adw-spin-button');
  if (opts.disabled) {
    spinButtonWrapper.classList.add('disabled');
  }

  let currentValue = typeof opts.value === 'number' ? opts.value : 0;
  const min = typeof opts.min === 'number' ? opts.min : 0;
  const max = typeof opts.max === 'number' ? opts.max : 100;
  const step = typeof opts.step === 'number' ? opts.step : 1;

  currentValue = Math.max(min, Math.min(max, currentValue)); // Clamp initial value

  const entry = createAdwEntry({ // Use direct call
    value: currentValue.toString(),
    disabled: opts.disabled,
  });
  entry.classList.add('adw-spin-button-entry');
  entry.style.maxWidth = '80px'; // Consider making this configurable or CSS-driven
  entry.setAttribute('role', 'spinbutton');
  entry.setAttribute('aria-valuenow', currentValue);
  if (typeof opts.min === 'number') entry.setAttribute('aria-valuemin', min);
  if (typeof opts.max === 'number') entry.setAttribute('aria-valuemax', max);

  entry.addEventListener('input', (event) => {
      let numValue = parseFloat(event.target.value);
      // Basic validation: if not a number, or out of pure text input, what to do?
      // For now, let it be, focus on button interaction for value change.
      // A more robust solution might parse and clamp here too.
  });
   entry.addEventListener('change', (event) => { // When focus lost or Enter pressed
      let numValue = parseFloat(event.target.value);
      if (isNaN(numValue)) numValue = currentValue; // Revert if invalid
      numValue = Math.max(min, Math.min(max, numValue));
      currentValue = numValue;
      event.target.value = currentValue;
      updateButtonsState(currentValue);
      entry.setAttribute('aria-valuenow', currentValue);
      if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(currentValue);
      }
    });


  const btnContainer = document.createElement('div');
  btnContainer.classList.add('adw-spin-button-buttons');

  const downButton = createAdwButton('', {
    icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 6h8L8 11z"/></svg>',
    disabled: opts.disabled || currentValue <= min,
    flat: true,
    onClick: () => {
        let numValue = parseFloat(entry.value) - step;
        numValue = Math.max(min, numValue);
        currentValue = numValue;
        entry.value = currentValue;
        updateButtonsState(currentValue);
        entry.setAttribute('aria-valuenow', currentValue);
        if (typeof opts.onValueChanged === 'function') opts.onValueChanged(currentValue);
        entry.focus();
    }
  });
  downButton.classList.add('adw-spin-button-down');
  downButton.setAttribute('aria-label', 'Decrement');

  const upButton = createAdwButton('', {
    icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 10h8L8 5z"/></svg>',
    disabled: opts.disabled || currentValue >= max,
    flat: true,
    onClick: () => {
        let numValue = parseFloat(entry.value) + step;
        numValue = Math.min(max, numValue);
        currentValue = numValue;
        entry.value = currentValue;
        updateButtonsState(currentValue);
        entry.setAttribute('aria-valuenow', currentValue);
        if (typeof opts.onValueChanged === 'function') opts.onValueChanged(currentValue);
        entry.focus();
    }
  });
  upButton.classList.add('adw-spin-button-up');
  upButton.setAttribute('aria-label', 'Increment');

  function updateButtonsState(val) {
    downButton.disabled = opts.disabled || val <= min;
    upButton.disabled = opts.disabled || val >= max;
    entry.disabled = opts.disabled; // Ensure entry disabled state also updates
    spinButtonWrapper.classList.toggle('disabled', !!opts.disabled);
  }

  updateButtonsState(currentValue); // Initial state

  btnContainer.appendChild(upButton);
  btnContainer.appendChild(downButton);
  spinButtonWrapper.appendChild(entry);
  spinButtonWrapper.appendChild(btnContainer);

  entry.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if(!upButton.disabled) upButton.click(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if(!downButton.disabled) downButton.click(); }
  });

  // Expose a method to set value programmatically for the factory-created instance
  spinButtonWrapper.setValue = (newValue) => {
    let numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;
    numValue = Math.max(min, Math.min(max, numValue));
    currentValue = numValue;
    entry.value = currentValue;
    updateButtonsState(currentValue);
    entry.setAttribute('aria-valuenow', currentValue);
    if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(currentValue);
    }
  };
   spinButtonWrapper.getValue = () => currentValue;


  return spinButtonWrapper;
}

export class AdwSpinButton extends HTMLElement {
    static get observedAttributes() { return ['value', 'min', 'max', 'step', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);

        this._spinButtonElement = null; // Wrapper div
        this._entryElement = null;      // Internal AdwEntry or input
        this._upButton = null;
        this._downButton = null;
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // If only value or disabled changes, update internal elements. Otherwise, full re-render.
            if ((name === 'value' || name === 'disabled' || name === 'min' || name === 'max') && this._spinButtonElement) {
                 this._updateInternalElementStates();
            } else {
                this._render();
            }
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        this._spinButtonElement = document.createElement('div');
        this._spinButtonElement.classList.add('adw-spin-button');

        this._entryElement = new AdwEntry(); // Using AdwEntry WC
        this._entryElement.classList.add('adw-spin-button-entry');
        this._entryElement.style.maxWidth = '80px'; // TODO: Make CSS based
        this._entryElement.setAttribute('role', 'spinbutton');

        this._entryElement.addEventListener('change', (e) => { // Listen to 'change' not 'input' for final value
            let numValue = parseFloat(this._entryElement.value);
            if (isNaN(numValue)) numValue = this.min; // Revert or clamp
            numValue = Math.max(this.min, Math.min(this.max, numValue));
            this.value = numValue; // Use setter to update attribute and dispatch event
        });
        this._entryElement.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); if (!this._upButton.disabled) this._upButton.click(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); if (!this._downButton.disabled) this._downButton.click(); }
        });

        const btnContainer = document.createElement('div');
        btnContainer.classList.add('adw-spin-button-buttons');

        this._downButton = createAdwButton('', { icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 6h8L8 11z"/></svg>', flat: true });
        this._downButton.classList.add('adw-spin-button-down');
        this._downButton.setAttribute('aria-label', 'Decrement');
        this._downButton.addEventListener('click', () => { this.value -= this.step; });

        this._upButton = createAdwButton('', { icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 10h8L8 5z"/></svg>', flat: true });
        this._upButton.classList.add('adw-spin-button-up');
        this._upButton.setAttribute('aria-label', 'Increment');
        this._upButton.addEventListener('click', () => { this.value += this.step; });

        btnContainer.appendChild(this._upButton);
        btnContainer.appendChild(this._downButton);
        this._spinButtonElement.appendChild(this._entryElement);
        this._spinButtonElement.appendChild(btnContainer);
        this.shadowRoot.appendChild(this._spinButtonElement);

        this._updateInternalElementStates(); // Apply initial attributes
    }

    _updateInternalElementStates() {
        if (!this._spinButtonElement || !this._entryElement || !this._upButton || !this._downButton) return;

        const value = this.value; // Use getter
        const min = this.min;
        const max = this.max;
        const disabled = this.disabled;

        this._entryElement.value = value;
        this._entryElement.setAttribute('aria-valuenow', value);
        this._entryElement.setAttribute('aria-valuemin', min);
        this._entryElement.setAttribute('aria-valuemax', max);
        this._entryElement.disabled = disabled;

        this._upButton.disabled = disabled || value >= max;
        this._downButton.disabled = disabled || value <= min;
        this._spinButtonElement.classList.toggle('disabled', disabled);
    }

    get value() { return this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : 0; }
    set value(val) {
        const numVal = parseFloat(val);
        const min = this.min;
        const max = this.max;
        const step = this.step; // Not directly used in clamping here, but good to have
        let clampedVal = Math.max(min, Math.min(max, numVal));

        // Ensure value aligns with step if needed (more complex, often handled by native input type=number)
        // For now, just clamp to min/max

        const oldValue = this.value;
        this.setAttribute('value', clampedVal);
        if (this._entryElement && this._entryElement.value !== String(clampedVal)) { // Avoid infinite loop if entry fires change
            this._entryElement.value = clampedVal;
        }
        this._updateInternalElementStates(); // Update buttons etc.
        if (oldValue !== clampedVal) {
            this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: clampedVal } }));
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
        this._updateInternalElementStates();
    }

    get min() { return this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0; }
    set min(val) { this.setAttribute('min', parseFloat(val)); this._render(); }

    get max() { return this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100; }
    set max(val) { this.setAttribute('max', parseFloat(val)); this._render(); }

    get step() { return this.hasAttribute('step') ? parseFloat(this.getAttribute('step')) : 1; }
    set step(val) { this.setAttribute('step', parseFloat(val)); }
}

// No customElements.define here, will be done in main aggregator.
