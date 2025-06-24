import { adwGenerateId, getAdwCommonStyleSheet as getAdwCommonStyleSheetFromUtils } from './utils.js';
import { createAdwButton } from './button.js'; // Used by SpinButton factory

/**
 * Creates an Adwaita-style text entry.
 * @param {object} [options={}] - Configuration options for the entry.
 * @param {string} [options.placeholder] - Placeholder text for the entry.
 * @param {string} [options.value] - Initial value for the entry.
 * @param {function} [options.onInput] - Callback function for the input event.
 * @param {boolean} [options.disabled=false] - If true, disables the entry.
 * @param {string} [options.name] - The name attribute for the entry.
 * @param {string} [options.type] - The type attribute for the entry (e.g., "text", "password").
 * @param {boolean} [options.required] - If the entry is required.
 * @returns {AdwEntry} The created <adw-entry> custom element.
 */
export function createAdwEntry(options = {}) {
  const opts = options || {};
  const entry = document.createElement("adw-entry");

  if (opts.placeholder) entry.setAttribute('placeholder', opts.placeholder);
  if (opts.value) entry.setAttribute('value', opts.value);
  if (opts.disabled) entry.setAttribute("disabled", "");
  if (opts.name) entry.setAttribute('name', opts.name);
  if (opts.type) entry.setAttribute('type', opts.type);
  if (opts.required) entry.setAttribute('required', '');

  // For custom elements, users typically add event listeners directly.
  if (typeof opts.onInput === 'function') {
    entry.addEventListener("input", opts.onInput);
  }
  return entry;
}

/**
 * @element adw-entry
 * @description An Adwaita-styled single-line text input field.
 * This component is form-associated, meaning it can participate in HTML forms.
 *
 * @attr {String} [placeholder] - Placeholder text for the entry.
 * @attr {String} [value=""] - The current value of the entry.
 * @attr {Boolean} [disabled=false] - If present, disables the entry.
 * @attr {String} [name] - The name of the entry, used for form submission. This attribute is crucial.
 * @attr {Boolean} [required=false] - If present, marks the entry as required.
 * @attr {String} [type="text"] - The type of the input field (e.g., "text", "password", "email").
 *
 * @fires input - Fired when the value changes. `event.detail.value` contains the new value.
 * @fires change - Fired when the value is committed (e.g., on blur after change).
 *
 * @csspart entry - The internal `<input>` element.
 */
export class AdwEntry extends HTMLElement {
    static formAssociated = true;
    /** @internal */
    static get observedAttributes() { return ['placeholder', 'value', 'disabled', 'name', 'required', 'type']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._internals = this.attachInternals();
        this._inputElement = null;
        this._initialValue = this.getAttribute('value') || '';
    }

    /** @internal */
    _fallbackLoadStylesheet() {
        if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
            if (styleLink.href) this.shadowRoot.appendChild(styleLink);
            else console.warn("AdwEntry: Fallback CSS path not defined.");
        }
    }

    /** @internal */
    async connectedCallback() {
        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype &&
            typeof Adw !== 'undefined' && typeof Adw.getCommonStyleSheet === 'function') {
            try {
                const commonSheet = await Adw.getCommonStyleSheet();
                if (commonSheet && !this.shadowRoot.adoptedStyleSheets.includes(commonSheet)) {
                    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, commonSheet];
                } else if (!commonSheet) this._fallbackLoadStylesheet();
            } catch (error) { this._fallbackLoadStylesheet(); }
        } else { this._fallbackLoadStylesheet(); }

        if (!this._inputElement) this._render();
        this._internals.setFormValue(this.value);
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (!this._inputElement && name !== 'value') this._render();

        const hasNewAttr = newValue !== null;
        switch (name) {
            case 'value':
                const val = hasNewAttr ? newValue : '';
                if (this._inputElement && this._inputElement.value !== val) this._inputElement.value = val;
                this._internals.setFormValue(val);
                break;
            case 'disabled':
                if (this._inputElement) this._inputElement.disabled = hasNewAttr;
                break;
            case 'placeholder':
                if (this._inputElement) this._inputElement.placeholder = newValue || '';
                break;
            case 'name': // Name of the host is used by forms; internal input name is for convenience/fallback
                if (this._inputElement) {
                    if (hasNewAttr) this._inputElement.name = newValue;
                    else this._inputElement.removeAttribute('name');
                }
                break;
            case 'required':
                if (this._inputElement) this._inputElement.required = hasNewAttr;
                break;
            case 'type':
                if (this._inputElement) this._inputElement.type = newValue || 'text';
                break;
        }
    }

    /** @internal */
    _render() {
        if (!this._inputElement) {
            const nodesToRemove = Array.from(this.shadowRoot.childNodes).filter(
                child => child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')
            );
            nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));

            this._inputElement = document.createElement("input");
            this._inputElement.classList.add("adw-entry");
            this._inputElement.part.add('entry');
            this.shadowRoot.appendChild(this._inputElement);

            this._inputElement.addEventListener('input', (e) => {
                const currentValue = e.target.value;
                this._internals.setFormValue(currentValue);
                if (this.getAttribute('value') !== currentValue) {
                     this.setAttribute('value', currentValue); // Reflect to attribute
                }
                this.dispatchEvent(new CustomEvent('input', { detail: { value: currentValue }, bubbles: true, composed: true }));
            });
            this._inputElement.addEventListener('change', (e) => {
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }
        // Apply attributes post-creation or on re-render if structure changes
        this._inputElement.placeholder = this.getAttribute('placeholder') || '';
        this._inputElement.value = this.getAttribute('value') !== null ? this.getAttribute('value') : this._initialValue;
        this._inputElement.disabled = this.hasAttribute('disabled');
        const nameAttr = this.getAttribute('name');
        if (nameAttr) this._inputElement.name = nameAttr; else this._inputElement.removeAttribute('name');
        this._inputElement.required = this.hasAttribute('required');
        this._inputElement.type = this.getAttribute('type') || 'text';
        this._internals.setFormValue(this._inputElement.value); // Ensure form value is set after render
    }

    // Form Associated Lifecycle Callbacks
    /** @internal */
    formAssociatedCallback(form) { /* console.log('AdwEntry associated with form:', this.name); */ }
    /** @internal */
    formDisabledCallback(disabled) {
        if (this._inputElement) this._inputElement.disabled = disabled;
        if (disabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled');
    }
    /** @internal */
    formResetCallback() { this.value = this._initialValue; }
    /** @internal */
    formStateRestoreCallback(state) { this.value = state; }

    // Public Properties
    get value() { return this._inputElement ? this._inputElement.value : this._initialValue; }
    set value(val) { this.setAttribute('value', (val === null || val === undefined) ? '' : String(val)); }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) { if (Boolean(val)) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }

    get name() { return this.getAttribute('name'); }
    set name(val) { if (val) this.setAttribute('name', val); else this.removeAttribute('name'); }

    get type() { return this.getAttribute('type') || 'text'; }
    set type(val) { this.setAttribute('type', val || 'text'); }

    get required() { return this.hasAttribute('required'); }
    set required(val) { if (Boolean(val)) this.setAttribute('required', ''); else this.removeAttribute('required'); }

    get placeholder() { return this.getAttribute('placeholder'); }
    set placeholder(val) { if (val) this.setAttribute('placeholder', val); else this.removeAttribute('placeholder'); }

    // Validity delegation
    /** @internal */ get validity() { return this._internals.validity; }
    /** @internal */ get validationMessage() { return this._internals.validationMessage; }
    /** @internal */ get willValidate() { return this._internals.willValidate; }
    /** @internal */ checkValidity() { return this._internals.checkValidity(); }
    /** @internal */ reportValidity() { return this._internals.reportValidity(); }

    focus(options) { if(this._inputElement) this._inputElement.focus(options); }
    blur() { if(this._inputElement) this._inputElement.blur(); }
}


// AdwSpinButton and other form components would follow below...
// For this operation, we are only replacing AdwEntry.
// The rest of the file (AdwSpinButton, etc.) should remain as it was.


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

  const entry = createAdwEntry({ // Uses the AdwEntry factory
    value: currentValue.toString(),
    disabled: opts.disabled,
    type: 'number' // Suggest type number for spin button's entry part
  });
  entry.classList.add('adw-spin-button-entry');
  entry.style.maxWidth = '80px'; // This might be better in SCSS
  entry.setAttribute('role', 'spinbutton');
  entry.setAttribute('aria-valuenow', currentValue);
  if (typeof opts.min === 'number') entry.setAttribute('aria-valuemin', min);
  if (typeof opts.max === 'number') entry.setAttribute('aria-valuemax', max);

  entry.addEventListener('input', (event) => {
      // AdwEntry now handles its own value propagation.
      // The change event is more appropriate for validation/final value processing.
  });
   entry.addEventListener('change', (event) => {
      let numValue = parseFloat(entry.value); // AdwEntry's value property
      if (isNaN(numValue)) numValue = currentValue;
      numValue = Math.max(min, Math.min(max, numValue));
      // TODO: Implement step alignment if necessary
      currentValue = numValue;
      entry.value = currentValue.toString(); // Update AdwEntry's value
      updateButtonsState(currentValue);
      entry.setAttribute('aria-valuenow', currentValue); // Update ARIA attribute on AdwEntry
      if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(currentValue);
      }
    });


  const btnContainer = document.createElement('div');
  btnContainer.classList.add('adw-spin-button-buttons');

  const downButton = createAdwButton('', {
    iconName: 'ui/pan-down-symbolic',
    disabled: opts.disabled || currentValue <= min,
    flat: true,
    isCircular: false,
    ariaLabel: 'Decrement',
  });
  downButton.classList.add('adw-spin-button-down');
  downButton.classList.add('adw-spin-button-control');


  const upButton = createAdwButton('', {
    iconName: 'ui/pan-up-symbolic',
    disabled: opts.disabled || currentValue >= max,
    flat: true,
    isCircular: false,
    ariaLabel: 'Increment',
  });
  upButton.classList.add('adw-spin-button-up');
  upButton.classList.add('adw-spin-button-control');


  downButton.addEventListener('click', () => {
    let numValue = parseFloat(entry.value) - step;
    numValue = Math.max(min, numValue);
    currentValue = numValue;
    entry.value = currentValue.toString();
    updateButtonsState(currentValue);
    entry.setAttribute('aria-valuenow', currentValue);
    if (typeof opts.onValueChanged === 'function') opts.onValueChanged(currentValue);
    entry.focus();
  });

  upButton.addEventListener('click', () => {
    let numValue = parseFloat(entry.value) + step;
    numValue = Math.min(max, numValue);
    currentValue = numValue;
    entry.value = currentValue.toString();
    updateButtonsState(currentValue);
    entry.setAttribute('aria-valuenow', currentValue);
    if (typeof opts.onValueChanged === 'function') opts.onValueChanged(currentValue);
    entry.focus();
  });


  function updateButtonsState(val) {
    downButton.disabled = !!opts.disabled || val <= min;
    upButton.disabled = !!opts.disabled || val >= max;
    entry.disabled = !!opts.disabled; // AdwEntry's disabled property/attribute
    spinButtonWrapper.classList.toggle('disabled', !!opts.disabled);
  }

  updateButtonsState(currentValue);

  btnContainer.appendChild(upButton);
  btnContainer.appendChild(downButton);
  spinButtonWrapper.appendChild(entry); // entry is an <adw-entry>
  spinButtonWrapper.appendChild(btnContainer);

  entry.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if(!upButton.disabled) upButton.click(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if(!downButton.disabled) downButton.click(); }
  });

  spinButtonWrapper.setValue = (newValue) => {
    let numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;
    numValue = Math.max(min, Math.min(max, numValue));
    currentValue = numValue;
    entry.value = currentValue.toString();
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
        this._spinButtonElement = null;
        this._entryElement = null;
        this._upButton = null;
        this._downButton = null;
    }

    /** @internal */
    async _ensureStylesheets() {
        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype &&
            typeof Adw !== 'undefined' && typeof Adw.getCommonStyleSheet === 'function') {
            try {
                const commonSheet = await Adw.getCommonStyleSheet();
                if (commonSheet && !this.shadowRoot.adoptedStyleSheets.includes(commonSheet)) {
                    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, commonSheet];
                } else if (!commonSheet && !this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
                    this._fallbackLoadStylesheet();
                }
            } catch (error) {
                if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) this._fallbackLoadStylesheet();
            }
        } else if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
             this._fallbackLoadStylesheet();
        }
    }

    /** @internal */
    _fallbackLoadStylesheet() {
        if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
            if (styleLink.href) this.shadowRoot.appendChild(styleLink);
        }
    }

    async connectedCallback() {
        await this._ensureStylesheets();
        if (!this._spinButtonElement) {
            this._render();
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (!this._spinButtonElement) {
            // If _render hasn't run, it will pick up attributes.
            // However, ensure it runs if connected.
            if (this.isConnected) this._render();
        } else {
             this._updateInternalElementStates();
        }
    }

    _render() {
        const nodesToRemove = Array.from(this.shadowRoot.childNodes).filter(
            child => child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')
        );
        nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));

        this._spinButtonElement = document.createElement('div');
        this._spinButtonElement.classList.add('adw-spin-button');
        this._spinButtonElement.part.add('spin-button-wrapper');

        this._entryElement = new AdwEntry();
        this._entryElement.classList.add('adw-spin-button-entry');
        this._entryElement.setAttribute('role', 'spinbutton');
        this._entryElement.part.add('entry');
        // AdwEntry will handle its own type, placeholder etc. based on its attributes.
        // We primarily set its value and listen to its changes.

        this._entryElement.addEventListener('change', (e) => {
            let numValue = parseFloat(this._entryElement.value);
            if (isNaN(numValue)) numValue = this.min;
            numValue = Math.max(this.min, Math.min(this.max, numValue));
            this.value = numValue;
        });
        this._entryElement.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); if (!this._upButton.disabled) this._handleIncrement(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); if (!this._downButton.disabled) this._handleDecrement(); }
        });

        const btnContainer = document.createElement('div');
        btnContainer.classList.add('adw-spin-button-buttons');
        btnContainer.part.add('buttons-container');

        this._downButton = new AdwButton();
        this._downButton.setAttribute('icon-name', 'ui/pan-down-symbolic');
        this._downButton.setAttribute('flat', '');
        this._downButton.setAttribute('aria-label', 'Decrement');
        this._downButton.classList.add('adw-spin-button-down', 'adw-spin-button-control');
        this._downButton.part.add('down-button');
        this._downButton.addEventListener('click', () => { if(!this.disabled) this._handleDecrement(); });

        this._upButton = new AdwButton();
        this._upButton.setAttribute('icon-name', 'ui/pan-up-symbolic');
        this._upButton.setAttribute('flat', '');
        this._upButton.setAttribute('aria-label', 'Increment');
        this._upButton.classList.add('adw-spin-button-up', 'adw-spin-button-control');
        this._upButton.part.add('up-button');
        this._upButton.addEventListener('click', () => { if(!this.disabled) this._handleIncrement(); });

        btnContainer.appendChild(this._upButton);
        btnContainer.appendChild(this._downButton);
        this._spinButtonElement.appendChild(this._entryElement);
        this._spinButtonElement.appendChild(btnContainer);
        this.shadowRoot.appendChild(this._spinButtonElement);

        this._updateInternalElementStates();
    }

    _handleIncrement() {
        this.value += this.step; // Use setter for AdwSpinButton
        this._entryElement.focus();
    }
    _handleDecrement() {
        this.value -= this.step; // Use setter for AdwSpinButton
        this._entryElement.focus();
    }

    _updateInternalElementStates() {
        if (!this._spinButtonElement || !this._entryElement || !this._upButton || !this._downButton) return;

        const value = this.value;
        const min = this.min;
        const max = this.max;
        const disabled = this.disabled;

        this._entryElement.value = String(value); // Use AdwEntry's value setter
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
        let numVal = parseFloat(val);
        if (isNaN(numVal)) numVal = this.min;

        const min = this.min;
        const max = this.max;
        const step = this.step;

        numVal = Math.max(min, Math.min(max, numVal));
        if (step > 0) {
            numVal = min + Math.round((numVal - min) / step) * step;
            numVal = Math.max(min, Math.min(max, numVal));
        }

        const oldValue = this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : null;
        if (oldValue !== numVal || !this.hasAttribute('value')) {
            this.setAttribute('value', numVal);
            this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: numVal }, bubbles: true, composed:true }));
        } else if (this._entryElement && this._entryElement.value !== String(numVal)) {
             if(this.isConnected) this._updateInternalElementStates();
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled');
    }

    get min() { return this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0; }
    set min(val) { this.setAttribute('min', String(parseFloat(val))); }

    get max() { return this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100; }
    set max(val) { this.setAttribute('max', String(parseFloat(val))); }

    get step() { return this.hasAttribute('step') ? parseFloat(this.getAttribute('step')) : 1; }
    set step(val) { this.setAttribute('step', String(parseFloat(val))); }
}
// No customElements.define here, will be done in main aggregator.
