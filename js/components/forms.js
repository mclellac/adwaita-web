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
    static formAssociated = true; // Crucial for form participation
    static get observedAttributes() { return ['placeholder', 'value', 'disabled', 'name', 'required', 'type']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.internals_ = this.attachInternals(); // Needed for setFormValue

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._inputElement = null;
        this._initialValue = this.getAttribute('value') || ''; // Store initial value for form reset
    }

    connectedCallback() {
        if (!this._inputElement) {
            this._render();
        }
        // Set initial form value if one is present from attributes
        this.internals_.setFormValue(this.value, this.value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (!this._inputElement) {
            this._render(); // Ensures _inputElement exists
        }

        switch (name) {
            case 'value':
                if (this._inputElement.value !== newValue) {
                    this._inputElement.value = newValue === null ? '' : newValue;
                }
                // Always update form value when 'value' attribute changes
                this.internals_.setFormValue(this.value, this.value);
                break;
            case 'disabled':
                this._inputElement.disabled = this.hasAttribute('disabled');
                break;
            case 'placeholder':
                this._inputElement.placeholder = newValue || '';
                break;
            case 'name':
                // The 'name' attribute on the custom element itself is used by the form.
                // The internal input's name is not strictly necessary for ElementInternals.
                if (newValue === null) this._inputElement.removeAttribute('name'); // Optional: keep internal name in sync
                else this._inputElement.name = newValue; // Optional: keep internal name in sync
                break;
            case 'required':
                this._inputElement.required = newValue !== null;
                break;
            case 'type':
                this._inputElement.type = newValue || 'text';
                break;
        }
    }

    _render() {
        if (!this._inputElement) {
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            this._inputElement = document.createElement("input");
            this._inputElement.classList.add("adw-entry");
            this.shadowRoot.appendChild(this._inputElement);

            this._inputElement.addEventListener('input', (e) => {
                const val = e.target.value;
                if (this.getAttribute('value') !== val) {
                    // Temporarily disable internal setFormValue for this specific attribute change
                    // to avoid potential loops if setAttribute itself triggers another input event somehow.
                    // More robustly, manage value updates carefully.
                    this.setAttribute('value', val);
                } else {
                    // If attribute is already same (e.g. user types, then programmatic set to same value via attribute)
                    // still ensure form value is updated if internal state was different.
                    this.internals_.setFormValue(val, val);
                }
                this.dispatchEvent(new CustomEvent('input', { detail: { value: val }, bubbles: true, composed: true }));
            });

            this._inputElement.addEventListener('change', (e) => {
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }

        this._inputElement.placeholder = this.getAttribute('placeholder') || '';
        const valueAttr = this.getAttribute('value');
        // Use _initialValue for the very first render if value attribute not set, then valueAttr
        const initialRenderValue = (valueAttr === null && oldValue === null) ? this._initialValue : (valueAttr === null ? '' : valueAttr);

        if (this._inputElement.value !== initialRenderValue) {
            this._inputElement.value = initialRenderValue;
        }
        this._inputElement.disabled = this.hasAttribute('disabled');
        // The 'name' of the internal input isn't strictly needed for ElementInternals to work,
        // as the form uses the name of the custom element itself.
        // However, keeping it can be useful for direct DOM inspection or non-ElementInternals fallbacks.
        if (this.hasAttribute('name')) this._inputElement.name = this.getAttribute('name'); else this._inputElement.removeAttribute('name');
        this._inputElement.required = this.hasAttribute('required');
        this._inputElement.type = this.getAttribute('type') || 'text';

        // Set initial form value after rendering the input and applying attributes
        this.internals_.setFormValue(this._inputElement.value, this._inputElement.value);
    }

    // Form Lifecycle Callbacks
    formAssociatedCallback(form) {
        // console.log('AdwEntry associated with form:', form);
    }

    formDisabledCallback(disabled) {
        if (this._inputElement) {
            this._inputElement.disabled = disabled;
        }
    }

    formResetCallback() {
        this.value = this._initialValue; // Reset to initial value
        this.internals_.setFormValue(this.value, this.value);
    }

    formStateRestoreCallback(state, mode) {
        this.value = state;
        this.internals_.setFormValue(this.value, this.value);
    }

    // Properties
    get value() {
        return this._inputElement ? this._inputElement.value : (this.getAttribute('value') || '');
    }

    set value(val) {
        const strVal = (val === null || val === undefined) ? '' : String(val);
        const oldValueAttr = this.getAttribute('value');
        if (oldValueAttr !== strVal) {
            this.setAttribute('value', strVal); // This will trigger attributeChangedCallback
        } else if (this._inputElement && this._inputElement.value !== strVal) {
            // If attribute is same, but internal input is different (e.g., programmatic direct set)
            this._inputElement.value = strVal;
            this.internals_.setFormValue(strVal, strVal); // Ensure form value is also updated
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
    }

    get name() { return this.getAttribute('name'); }
    set name(val) { this.setAttribute('name', val); }


    // Validity (delegating to internal input for now)
    get validity() { return this._inputElement ? this._inputElement.validity : Object.create(ValidityState.prototype); }
    get validationMessage() { return this._inputElement ? this._inputElement.validationMessage : ""; }
    get willValidate() { return this._inputElement ? this._inputElement.willValidate : false; }
    checkValidity() { return this._inputElement ? this._inputElement.checkValidity() : true; }
    reportValidity() { return this._inputElement ? this._inputElement.reportValidity() : true; }


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

  const entry = createAdwEntry({
    value: currentValue.toString(),
    disabled: opts.disabled,
  });
  entry.classList.add('adw-spin-button-entry');
  entry.style.maxWidth = '80px';
  entry.setAttribute('role', 'spinbutton');
  entry.setAttribute('aria-valuenow', currentValue);
  if (typeof opts.min === 'number') entry.setAttribute('aria-valuemin', min);
  if (typeof opts.max === 'number') entry.setAttribute('aria-valuemax', max);

  entry.addEventListener('input', (event) => {
      // Defer validation to change event for better UX during typing
  });
   entry.addEventListener('change', (event) => {
      let numValue = parseFloat(event.target.value);
      if (isNaN(numValue)) numValue = currentValue;
      numValue = Math.max(min, Math.min(max, numValue));
      // TODO: Implement step alignment if necessary
      currentValue = numValue;
      event.target.value = currentValue; // Update input field with clamped/stepped value
      updateButtonsState(currentValue);
      entry.setAttribute('aria-valuenow', currentValue);
      if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(currentValue);
      }
    });


  const btnContainer = document.createElement('div');
  btnContainer.classList.add('adw-spin-button-buttons');

  const downButton = createAdwButton('', {
    // icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 6h8L8 11z"/></svg>',
    iconName: 'ui/pan-down-symbolic',
    disabled: opts.disabled || currentValue <= min,
    flat: true,
    isCircular: false, // Ensure it's not circular to allow default padding to be small
    cssClass: 'adw-spin-button-control', // Add a class for specific styling if needed
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
    // icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 10h8L8 5z"/></svg>',
    iconName: 'ui/pan-up-symbolic',
    disabled: opts.disabled || currentValue >= max,
    flat: true,
    isCircular: false, // Ensure it's not circular
    cssClass: 'adw-spin-button-control',
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
    downButton.disabled = !!opts.disabled || val <= min; // Ensure opts.disabled takes precedence
    upButton.disabled = !!opts.disabled || val >= max;
    entry.disabled = !!opts.disabled;
    spinButtonWrapper.classList.toggle('disabled', !!opts.disabled);
  }

  updateButtonsState(currentValue);

  btnContainer.appendChild(upButton);
  btnContainer.appendChild(downButton);
  spinButtonWrapper.appendChild(entry);
  spinButtonWrapper.appendChild(btnContainer);

  entry.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if(!upButton.disabled) upButton.click(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if(!downButton.disabled) downButton.click(); }
  });

  spinButtonWrapper.setValue = (newValue) => {
    let numValue = parseFloat(newValue);
    if (isNaN(numValue)) return; // Or handle error
    numValue = Math.max(min, Math.min(max, numValue));
    // TODO: Step alignment
    currentValue = numValue;
    entry.value = currentValue;
    updateButtonsState(currentValue);
    entry.setAttribute('aria-valuenow', currentValue);
    if (typeof opts.onValueChanged === 'function') { // Fire callback on programmatic change too
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

        this._spinButtonElement = null;
        this._entryElement = null;
        this._upButton = null;
        this._downButton = null;
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (this._spinButtonElement) { // Check if rendered
                 this._updateInternalElementStates();
            } else {
                this._render(); // If not rendered, a full render is needed
            }
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        this._spinButtonElement = document.createElement('div');
        this._spinButtonElement.classList.add('adw-spin-button');

        this._entryElement = new AdwEntry();
        this._entryElement.classList.add('adw-spin-button-entry');
        this._entryElement.style.maxWidth = '80px';
        this._entryElement.setAttribute('role', 'spinbutton');

        this._entryElement.addEventListener('change', (e) => {
            let numValue = parseFloat(this._entryElement.value);
            if (isNaN(numValue)) numValue = this.min;
            numValue = Math.max(this.min, Math.min(this.max, numValue));
            // TODO: Step alignment
            this.value = numValue; // This will trigger attributeChangedCallback and update everything
        });
        this._entryElement.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); if (!this._upButton.disabled) this._upButton.click(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); if (!this._downButton.disabled) this._downButton.click(); }
        });

        const btnContainer = document.createElement('div');
        btnContainer.classList.add('adw-spin-button-buttons');

        this._downButton = createAdwButton('', {
            iconName: 'ui/pan-down-symbolic',
            flat: true,
            isCircular: false,
            cssClass: 'adw-spin-button-control'
        });
        this._downButton.classList.add('adw-spin-button-down');
        this._downButton.setAttribute('aria-label', 'Decrement');
        this._downButton.addEventListener('click', () => { if(!this.disabled) this.value -= this.step; });

        this._upButton = createAdwButton('', {
            iconName: 'ui/pan-up-symbolic',
            flat: true,
            isCircular: false,
            cssClass: 'adw-spin-button-control'
        });
        this._upButton.classList.add('adw-spin-button-up');
        this._upButton.setAttribute('aria-label', 'Increment');
        this._upButton.addEventListener('click', () => { if(!this.disabled) this.value += this.step; });

        btnContainer.appendChild(this._upButton);
        btnContainer.appendChild(this._downButton);
        this._spinButtonElement.appendChild(this._entryElement);
        this._spinButtonElement.appendChild(btnContainer);
        this.shadowRoot.appendChild(this._spinButtonElement);

        this._updateInternalElementStates();
    }

    _updateInternalElementStates() {
        if (!this._spinButtonElement || !this._entryElement || !this._upButton || !this._downButton) return;

        const value = this.value;
        const min = this.min;
        const max = this.max;
        const disabled = this.disabled;

        if (this._entryElement.value !== String(value)) this._entryElement.value = value;
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
        // const step = this.step; // Step alignment logic could be added here

        let clampedVal = numVal;
        if (isNaN(clampedVal)) clampedVal = min; // Default to min if NaN
        clampedVal = Math.max(min, Math.min(max, clampedVal));

        // Optional: Align to nearest step. Example:
        // if (step > 0) clampedVal = min + Math.round((clampedVal - min) / step) * step;
        // clampedVal = Math.max(min, Math.min(max, clampedVal)); // Re-clamp after stepping

        const oldValue = this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : null; // Get pre-set attribute value
        if (oldValue !== clampedVal || !this.hasAttribute('value')) {
            this.setAttribute('value', clampedVal);
            // attributeChangedCallback will call _updateInternalElementStates
            this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: clampedVal } }));
        } else { // If value is the same, still ensure internal elements are consistent
            this._updateInternalElementStates();
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
        // attributeChangedCallback will call _updateInternalElementStates
    }

    get min() { return this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0; }
    set min(val) { this.setAttribute('min', parseFloat(val)); /* _updateInternalElementStates via attrChange */ }

    get max() { return this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100; }
    set max(val) { this.setAttribute('max', parseFloat(val)); /* _updateInternalElementStates via attrChange */ }

    get step() { return this.hasAttribute('step') ? parseFloat(this.getAttribute('step')) : 1; }
    set step(val) { this.setAttribute('step', parseFloat(val)); /* No direct visual update needed from step alone */ }
}

// No customElements.define here, will be done in main aggregator.
