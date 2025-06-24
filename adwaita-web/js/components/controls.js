import { adwGenerateId, getAdwCommonStyleSheet as getAdwCommonStyleSheetFromUtils } from './utils.js'; // Added getAdwCommonStyleSheet
import { createAdwButton } from './button.js'; // Used by AdwSpinButton, AdwToggleButton

/**
 * Creates an Adwaita-style switch.
 * @param {object} [options={}] - Configuration options.
 * @returns {AdwSwitch} The created <adw-switch> custom element.
 */
export function createAdwSwitch(options = {}) {
  const opts = options || {};
  const adwSwitch = document.createElement("adw-switch");

  if (opts.checked) adwSwitch.setAttribute('checked', '');
  if (opts.disabled) adwSwitch.setAttribute('disabled', '');
  if (opts.label) adwSwitch.setAttribute('label', opts.label);

  // For custom elements, users typically add event listeners directly.
  if (typeof opts.onChanged === 'function') {
    adwSwitch.addEventListener("change", opts.onChanged);
  }
  return adwSwitch;
}

/**
 * @element adw-switch
 * @description An Adwaita-styled switch control, typically used for boolean settings.
 *
 * @attr {Boolean} [checked=false] - If present, the switch is in the 'on' state.
 * @attr {Boolean} [disabled=false] - If present, disables the switch.
 * @attr {String} [label] - Optional text label displayed next to the switch.
 * @attr {String} [name] - The name of the switch, used for form submission if it were form-associated.
 * @attr {String} [value="on"] - The value submitted with the form if the switch is checked and form-associated.
 *
 * @fires change - Dispatched when the switch's checked state changes. `event.detail.checked` contains the new state.
 *
 * @csspart switch - The main `<label>` wrapper element.
 * @csspart input - The internal `<input type="checkbox" role="switch">` element.
 * @csspart slider - The visual slider part of the switch.
 * @csspart label - The text label `<span>` element if a label is provided.
 */
export class AdwSwitch extends HTMLElement {
    // Not form-associated by default, but could be made so if needed for direct form data.
    // For now, it's a presentational control often used with AdwActionRow which might handle form logic.
    /** @internal */
    static get observedAttributes() { return ['checked', 'disabled', 'label', 'name', 'value']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._inputElement = null;
        this._labelElement = null;
        this._wrapper = null;
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
            else console.warn("AdwSwitch: Fallback CSS path not defined.");
        }
    }

    /** @internal */
    async connectedCallback() {
        await this._ensureStylesheets();
        if (!this._wrapper) this._render();
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (!this._wrapper) { // If called before _render (e.g. attributes set on creation)
            if(this.isConnected) this._render(); // Render if connected
            return;
        }

        switch(name) {
            case 'checked':
                if (this._inputElement) this._inputElement.checked = this.hasAttribute('checked');
                break;
            case 'disabled':
                const isDisabled = this.hasAttribute('disabled');
                if (this._inputElement) this._inputElement.disabled = isDisabled;
                if (this._wrapper) this._wrapper.classList.toggle('disabled', isDisabled);
                if (this._wrapper) this._wrapper.setAttribute('aria-disabled', isDisabled.toString());
                break;
            case 'label':
                if (this._labelElement) this._labelElement.textContent = newValue || '';
                else if (newValue && this._wrapper) { // Label added dynamically
                    this._labelElement = document.createElement("span");
                    this._labelElement.classList.add("adw-switch-label");
                    this._labelElement.part.add('label');
                    this._labelElement.textContent = newValue;
                    this._wrapper.appendChild(this._labelElement);
                } else if (!newValue && this._labelElement) { // Label removed
                    this._labelElement.remove();
                    this._labelElement = null;
                }
                break;
            case 'name':
                if (this._inputElement) {
                    if (newValue !== null) this._inputElement.name = newValue;
                    else this._inputElement.removeAttribute('name');
                }
                break;
            case 'value':
                if (this._inputElement) {
                    if (newValue !== null) this._inputElement.value = newValue;
                    else this._inputElement.value = 'on'; // Default checkbox value
                }
                break;
        }
    }

    /** @internal */
    _render() {
        if (this._wrapper) { // Clear previous content if any, preserving stylesheets
            const nodesToRemove = Array.from(this.shadowRoot.childNodes).filter(
                child => child !== this._wrapper && child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')
            );
            nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));
            if(this._wrapper.parentNode) this._wrapper.remove(); // remove old wrapper if it exists
        }

        this._wrapper = document.createElement("label");
        this._wrapper.classList.add("adw-switch");
        this._wrapper.part.add('switch');

        this._inputElement = document.createElement("input");
        this._inputElement.type = "checkbox";
        this._inputElement.setAttribute("role", "switch");
        this._inputElement.part.add('input');
        this._inputElement.addEventListener("change", (e) => {
            this.checked = this._inputElement.checked; // This will use the setter
            this.dispatchEvent(new CustomEvent('change', { // CustomEvent for detail
                bubbles: true,
                composed: true,
                detail: { checked: this.checked }
            }));
        });

        const slider = document.createElement("span");
        slider.classList.add("adw-switch-slider");
        slider.setAttribute("aria-hidden", "true");
        slider.part.add('slider');

        this._wrapper.appendChild(this._inputElement);
        this._wrapper.appendChild(slider);

        const labelText = this.getAttribute('label');
        if (labelText) {
            this._labelElement = document.createElement("span");
            this._labelElement.classList.add("adw-switch-label");
            this._labelElement.part.add('label');
            this._labelElement.textContent = labelText;
            this._wrapper.appendChild(this._labelElement);
        } else {
            this._labelElement = null;
        }

        // Apply initial attributes
        this._inputElement.checked = this.hasAttribute('checked');
        const isDisabled = this.hasAttribute('disabled');
        this._inputElement.disabled = isDisabled;
        this._wrapper.classList.toggle('disabled', isDisabled);
        this._wrapper.setAttribute('aria-disabled', isDisabled.toString());

        const nameAttr = this.getAttribute('name');
        if (nameAttr) this._inputElement.name = nameAttr;
        this._inputElement.value = this.getAttribute('value') || 'on';

        this.shadowRoot.appendChild(this._wrapper);
    }

    get checked() { return this.hasAttribute('checked'); }
    set checked(value) {
        const isChecked = Boolean(value);
        if (isChecked) this.setAttribute('checked', '');
        else this.removeAttribute('checked');
        // attributeChangedCallback will sync _inputElement.checked
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) {
        const isDisabled = Boolean(value);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
    }

    get name() { return this.getAttribute('name'); }
    set name(val) { if (val) this.setAttribute('name', val); else this.removeAttribute('name');}

    get value() { return this.getAttribute('value') || 'on'; }
    set value(val) { this.setAttribute('value', val || 'on'); }

    get label() { return this.getAttribute('label'); }
    set label(val) { if(val) this.setAttribute('label', val); else this.removeAttribute('label');}

    focus(options) { if(this._inputElement) this._inputElement.focus(options); }
    blur() { if(this._inputElement) this._inputElement.blur(); }
}


/**
 * Creates an Adwaita-style checkbox.
 * @param {object} [options={}] - Configuration options.
 * @returns {AdwCheckbox} The created <adw-checkbox> custom element.
 */
export function createAdwCheckbox(options = {}) {
    const opts = options || {};
    const checkbox = document.createElement('adw-checkbox');
    if(opts.checked) checkbox.setAttribute('checked', '');
    if(opts.disabled) checkbox.setAttribute('disabled', '');
    if(opts.name) checkbox.setAttribute('name', opts.name);
    if(opts.value) checkbox.setAttribute('value', opts.value);
    if(opts.label) checkbox.setAttribute('label', opts.label);
    if(typeof opts.onChanged === 'function') checkbox.addEventListener('change', opts.onChanged);
    return checkbox;
}

/**
 * @element adw-checkbox
 * @description An Adwaita-styled checkbox control.
 * This component is form-associated.
 *
 * @attr {Boolean} [checked=false] - If present, the checkbox is checked.
 * @attr {Boolean} [disabled=false] - If present, disables the checkbox.
 * @attr {String} [label] - Text label displayed next to the checkbox.
 * @attr {String} [name] - The name of the checkbox, used for form submission.
 * @attr {String} [value="on"] - The value submitted with the form if the checkbox is checked. Defaults to "on".
 *
 * @fires change - Dispatched when the checkbox's checked state changes. `event.detail.checked` contains the new state.
 *
 * @csspart checkbox-wrapper - The main `<label>` wrapper element.
 * @csspart input - The internal `<input type="checkbox">` element.
 * @csspart indicator - The visual checkmark indicator `<span>`.
 * @csspart label - The text label `<span>` element.
 */
export class AdwCheckbox extends HTMLElement {
    static formAssociated = true;
    /** @internal */
    static get observedAttributes() { return ['checked', 'disabled', 'label', 'name', 'value']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._internals = this.attachInternals();
        this._inputElement = null;
        this._labelElement = null;
        this._wrapper = null;
        this._initialChecked = this.hasAttribute('checked');
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
            else console.warn("AdwCheckbox: Fallback CSS path not defined.");
        }
    }

    /** @internal */
    async connectedCallback() {
        await this._ensureStylesheets();
        if (!this._wrapper) this._render();
        this._updateFormValue();
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (!this._wrapper && this.isConnected) this._render(); // Render if needed and connected

        const hasNewAttr = newValue !== null;
        switch(name) {
            case 'checked':
                if (this._inputElement) this._inputElement.checked = hasNewAttr;
                this._updateFormValue();
                break;
            case 'disabled':
                const isDisabled = hasNewAttr;
                if (this._inputElement) this._inputElement.disabled = isDisabled;
                if (this._wrapper) this._wrapper.classList.toggle('disabled', isDisabled);
                break;
            case 'label':
                if (this._labelElement) this._labelElement.textContent = newValue || '';
                else if (newValue && this._wrapper) { // Label added dynamically
                    this._labelElement = document.createElement("span");
                    this._labelElement.classList.add("adw-checkbox-label");
                    this._labelElement.part.add('label');
                    this._labelElement.textContent = newValue;
                    this._wrapper.appendChild(this._labelElement);
                } else if (!newValue && this._labelElement) { // Label removed
                    this._labelElement.remove();
                    this._labelElement = null;
                }
                break;
            case 'name':
                if (this._inputElement) {
                    if (hasNewAttr) this._inputElement.name = newValue;
                    else this._inputElement.removeAttribute('name');
                }
                break;
            case 'value':
                if (this._inputElement) {
                     this._inputElement.value = newValue === null ? 'on' : newValue;
                }
                this._updateFormValue(); // Value change might affect submission
                break;
        }
    }

    /** @internal */
    _updateFormValue() {
        if (this.checked) {
            this._internals.setFormValue(this.value);
        } else {
            this._internals.setFormValue(null); // Unchecked checkboxes typically don't submit a value
        }
    }

    /** @internal */
    _render() {
        if (this._wrapper) {
             const nodesToRemove = Array.from(this.shadowRoot.childNodes).filter(
                child => child !== this._wrapper && child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')
            );
            nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));
            if(this._wrapper.parentNode) this._wrapper.remove();
        }

        this._wrapper = document.createElement('label');
        this._wrapper.classList.add('adw-checkbox');
        this._wrapper.part.add('checkbox-wrapper');

        this._inputElement = document.createElement('input');
        this._inputElement.type = 'checkbox';
        this._inputElement.part.add('input');
        this._inputElement.addEventListener('change', (e) => {
            this.checked = this._inputElement.checked; // Uses setter
            this.dispatchEvent(new CustomEvent('change', { detail: { checked: this.checked }, bubbles: true, composed: true }));
        });

        const indicator = document.createElement('span');
        indicator.classList.add('adw-checkbox-indicator');
        indicator.setAttribute('aria-hidden', 'true');
        indicator.part.add('indicator');

        this._wrapper.appendChild(this._inputElement);
        this._wrapper.appendChild(indicator);

        const labelText = this.getAttribute('label');
        if (labelText) {
            this._labelElement = document.createElement('span');
            this._labelElement.classList.add('adw-checkbox-label');
            this._labelElement.part.add('label');
            this._labelElement.textContent = labelText;
            this._wrapper.appendChild(this._labelElement);
        } else {
            this._labelElement = null;
        }

        this._inputElement.checked = this.hasAttribute('checked');
        const isDisabled = this.hasAttribute('disabled');
        this._inputElement.disabled = isDisabled;
        this._wrapper.classList.toggle('disabled', isDisabled);

        const nameAttr = this.getAttribute('name');
        if (nameAttr) this._inputElement.name = nameAttr;
        this._inputElement.value = this.getAttribute('value') || 'on';

        this.shadowRoot.appendChild(this._wrapper);
        this._updateFormValue(); // Set initial form value
    }

    // Form Associated Lifecycle Callbacks
    /** @internal */
    formAssociatedCallback(form) { /* console.log(`AdwCheckbox named '${this.name}' associated with form:`, form); */ }
    /** @internal */
    formDisabledCallback(disabled) {
        this.disabled = disabled; // Use setter
    }
    /** @internal */
    formResetCallback() {
        this.checked = this._initialChecked; // Use setter
    }
    /** @internal */
    formStateRestoreCallback(state /*, mode */) {
        // For checkbox, state is typically its value if checked, or null.
        this.checked = state !== null;
        if (state !== null && this.value !== state && !this.hasAttribute('value')) {
            // If browser restores a value different from default 'on' and no value attr is set,
            // it implies the value attribute might have been implicitly part of the state.
            // This is less common for simple checkboxes unless value changes.
            // For safety, one might set this.value = state here if this.value is 'on'.
        }
    }

    get checked() { return this.hasAttribute('checked'); }
    set checked(value) {
        const isChecked = Boolean(value);
        if (isChecked) this.setAttribute('checked', '');
        else this.removeAttribute('checked');
        // attributeChangedCallback will call _updateFormValue and sync _inputElement
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) {
        if (Boolean(value)) this.setAttribute('disabled', ''); else this.removeAttribute('disabled');
    }

    get name() { return this.getAttribute('name'); }
    set name(val) { if(val) this.setAttribute('name', val); else this.removeAttribute('name'); }

    get value() { return this.getAttribute('value') || 'on'; }
    set value(val) { this.setAttribute('value', val || 'on'); }

    get label() { return this.getAttribute('label'); }
    set label(val) { if(val) this.setAttribute('label', val); else this.removeAttribute('label');}

    focus(options) { if(this._inputElement) this._inputElement.focus(options); }
    blur() { if(this._inputElement) this._inputElement.blur(); }
}

// ... rest of the file (AdwRadioButton, AdwSplitButton, AdwToggleButton, AdwToggleGroup) ...
// ... AdwSpinButton (already partially updated to use AdwEntry custom element in its factory) ...
// We need to ensure AdwSpinButton itself is also updated if it's intended to be form-associated,
// or if its factory/internal structure needs further alignment with AdwEntry changes.
// For this step, focus is on AdwCheckbox.

/**
 * Creates an Adwaita-style radio button.
 */
export function createAdwRadioButton(options = {}) {
    const opts = options || {};
    const wrapper = document.createElement('label'); wrapper.classList.add('adw-radio-button'); if(opts.disabled) wrapper.classList.add('disabled');
    const input = document.createElement('input'); input.type = 'radio';
    if(!opts.name) console.warn("Radio button created without a 'name' attribute."); input.name = opts.name || adwGenerateId('adw-radio-group');
    input.value = opts.value || opts.label || 'on'; if(opts.checked) input.checked = true; if(opts.disabled) input.disabled = true;
    if(typeof opts.onChanged === 'function') input.addEventListener('change', opts.onChanged);
    const checkmark = document.createElement('span'); checkmark.classList.add('adw-radio-button-checkmark'); checkmark.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(input); wrapper.appendChild(checkmark);
    if(opts.label){ const labelSpan = document.createElement('span'); labelSpan.classList.add('adw-radio-button-label'); labelSpan.textContent = opts.label; wrapper.appendChild(labelSpan); }
    return wrapper;
}
export class AdwRadioButton extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label', 'name', 'value']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._inputElement = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const wrapper = document.createElement('label'); wrapper.classList.add('adw-radio-button');
        this._inputElement = document.createElement('input'); this._inputElement.type = 'radio';
        this._inputElement.name = this.getAttribute('name') || adwGenerateId('adw-radio-group');
        this._inputElement.value = this.getAttribute('value') || this.getAttribute('label') || 'on';
        this._inputElement.addEventListener('change', (e) => { this.checked = this._inputElement.checked; this.dispatchEvent(new Event('change', { bubbles: true, composed: true, detail: {checked: this.checked, value: this.value} })); });
        const checkmark = document.createElement('span'); checkmark.classList.add('adw-radio-button-checkmark'); checkmark.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(this._inputElement); wrapper.appendChild(checkmark);
        const labelText = this.getAttribute('label'); if (labelText) { const labelSpan = document.createElement('span'); labelSpan.classList.add('adw-radio-button-label'); labelSpan.textContent = labelText; wrapper.appendChild(labelSpan); }
        this.checked = this.hasAttribute('checked'); this.disabled = this.hasAttribute('disabled');
        this.shadowRoot.appendChild(wrapper);
    }
    get checked() { return this.hasAttribute('checked'); }
    set checked(value) { const isChecked = Boolean(value); if (this._inputElement) this._inputElement.checked = isChecked; if (isChecked) this.setAttribute('checked', ''); else this.removeAttribute('checked');}
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { const isDisabled = Boolean(value); if (this._inputElement) this._inputElement.disabled = isDisabled; const wrapper = this.shadowRoot.querySelector('.adw-radio-button'); if(wrapper) wrapper.classList.toggle('disabled', isDisabled); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
    get value() { return this.hasAttribute('value') ? this.getAttribute('value') : (this._inputElement ? this._inputElement.value : 'on');}
    set value(val) { if (this._inputElement) this._inputElement.value = val; this.setAttribute('value', val); }
}

/**
 * Creates an Adwaita-style SplitButton using the AdwSplitButton Web Component.
 */
export function createAdwSplitButton(options = {}) {
    const opts = options || {};
    const splitButton = document.createElement('adw-split-button');

    if (opts.actionText) {
        splitButton.setAttribute('action-text', opts.actionText);
    }
    if (opts.actionHref) {
        splitButton.setAttribute('action-href', opts.actionHref);
    }
    if (opts.suggested) {
        splitButton.setAttribute('suggested', '');
    }
    if (opts.disabled) {
        splitButton.setAttribute('disabled', '');
    }
    if (opts.dropdownAriaLabel) { // Pass this through
        splitButton.setAttribute('dropdown-aria-label', opts.dropdownAriaLabel);
    }
    if (opts.actionIconName) {
        splitButton.setAttribute('action-icon-name', opts.actionIconName);
    }

    if (typeof opts.onActionClick === 'function') {
        splitButton.addEventListener('action-click', opts.onActionClick);
    }
    if (typeof opts.onDropdownClick === 'function') {
        splitButton.addEventListener('dropdown-click', opts.onDropdownClick);
    }
    return splitButton;
}

export class AdwSplitButton extends HTMLElement {
    static get observedAttributes() { return ['action-text', 'action-href', 'suggested', 'disabled', 'dropdown-aria-label', 'action-icon-name']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() {
        this._actionButton = null;
        this._dropdownButton = null;
        this._wrapper = null;
        this._render();
    }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }

    _render() {
        const isInitialRender = !this._wrapper;

        if (isInitialRender) {
            const styleLink = this.shadowRoot.querySelector('link[rel="stylesheet"]');
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== styleLink) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }

            this._wrapper = document.createElement('div');
            this._wrapper.classList.add('adw-split-button');

            this._actionButton = document.createElement('adw-button');
            this._actionButton.classList.add('adw-split-button-action');
            const actionSlot = document.createElement('slot');
            actionSlot.name = 'action-label';
            const defaultSlot = document.createElement('slot');
            this._actionButton.appendChild(actionSlot);
            this._actionButton.appendChild(defaultSlot);

            this._dropdownButton = document.createElement('adw-button');
            this._dropdownButton.classList.add('adw-split-button-dropdown');
            this._dropdownButton.setAttribute('icon-name', 'ui/pan-down-symbolic');
            this._dropdownButton.setAttribute('aria-haspopup', 'true');
            // MODIFIED: Set initial aria-label for dropdown button
            const initialDropdownAriaLabel = this.getAttribute('dropdown-aria-label') || 'More options';
            this._dropdownButton.setAttribute('aria-label', initialDropdownAriaLabel);


            this._actionButton.addEventListener('click', (e) => {
                if (this.hasAttribute('disabled')) { e.stopImmediatePropagation(); return; }
                this.dispatchEvent(new CustomEvent('action-click', { bubbles: true, composed: true, detail: { originalEvent: e } }));
            });
            this._dropdownButton.addEventListener('click', (e) => {
                if (this.hasAttribute('disabled')) { e.stopImmediatePropagation(); return; }
                this.dispatchEvent(new CustomEvent('dropdown-click', { bubbles: true, composed: true, detail: { originalEvent: e } }));
            });

            this._wrapper.appendChild(this._actionButton);
            this._wrapper.appendChild(this._dropdownButton);
            this.shadowRoot.appendChild(this._wrapper);
        }

        const actionText = this.getAttribute('action-text');
        const actionHref = this.getAttribute('action-href');
        const isSuggested = this.hasAttribute('suggested');
        const isDisabled = this.hasAttribute('disabled');
        const dropdownAriaLabel = this.getAttribute('dropdown-aria-label') || 'More options';
        const actionIconName = this.getAttribute('action-icon-name');

        this._wrapper.classList.toggle('suggested-action', isSuggested);
        this._wrapper.classList.toggle('disabled', isDisabled);

        const defaultSlottedContent = Array.from(this.childNodes).filter(node => !node.slot || node.slot === "");
        const actionLabelSlottedContent = this.querySelector('[slot="action-label"]');

        if (actionText && !actionLabelSlottedContent && defaultSlottedContent.every(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() === '')) {
            this._actionButton.textContent = actionText;
        } else if (!actionLabelSlottedContent && !defaultSlottedContent.length && actionText) {
            this._actionButton.textContent = actionText;
        } else if (!actionText && !actionLabelSlottedContent && !defaultSlottedContent.length) {
            this._actionButton.textContent = '';
        }


        if (actionHref) this._actionButton.setAttribute('href', actionHref); else this._actionButton.removeAttribute('href');
        if (actionIconName) this._actionButton.setAttribute('icon-name', actionIconName); else this._actionButton.removeAttribute('icon-name');
        this._actionButton.toggleAttribute('suggested', isSuggested);
        this._actionButton.toggleAttribute('disabled', isDisabled);

        // Ensure dropdown button's aria-label is up-to-date
        this._dropdownButton.setAttribute('aria-label', dropdownAriaLabel);
        this._dropdownButton.toggleAttribute('disabled', isDisabled);
    }
}

/** Creates an Adwaita-style Toggle Button using the AdwToggleButton Web Component. */
export function createAdwToggleButton(text, options = {}) {
    const opts = { active: false, ...options };
    const toggleButtonWC = document.createElement('adw-toggle-button');

    if (text) {
        toggleButtonWC.setAttribute('label', text);
    }
    if (opts.value !== undefined) {
        toggleButtonWC.setAttribute('value', opts.value);
    }
    if (opts.active) {
        toggleButtonWC.setAttribute('active', '');
    }
    if (opts.disabled) {
        toggleButtonWC.setAttribute('disabled', '');
    }
    if (opts.icon) {
        toggleButtonWC.setAttribute('icon', opts.icon);
    }
    if (opts.iconName) {
        toggleButtonWC.setAttribute('icon-name', opts.iconName);
    }
    if (opts.ariaLabel) {
        toggleButtonWC.setAttribute('aria-label', opts.ariaLabel);
    }

    if (opts.flat === false) {
        toggleButtonWC.setAttribute('flat', 'false');
    }
    if (opts.suggested) toggleButtonWC.setAttribute('suggested', '');
    if (opts.destructive) toggleButtonWC.setAttribute('destructive', '');
    if (opts.isCircular) toggleButtonWC.setAttribute('circular', '');

    if (typeof opts.onToggled === 'function') {
        toggleButtonWC.addEventListener('toggled', (e) => {
            opts.onToggled(e.detail.isActive, e.detail.value);
        });
    }
    return toggleButtonWC;
}

export class AdwToggleButton extends HTMLElement {
    static get observedAttributes() { return ['label', 'active', 'disabled', 'value', 'icon', 'icon-name', 'flat', 'suggested', 'destructive', 'circular', 'aria-label']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._internalButtonElement = null; }
    connectedCallback() {
        this._internalButtonElement = null;
        this._render();
        this.setAttribute('aria-pressed', String(this.active));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'disabled') {
                this.disabled = this.hasAttribute('disabled');
            } else if (name === 'active') {
                this.setAttribute('aria-pressed', String(this.hasAttribute('active')));
                this._updateInternalButtonActiveState();
            } else {
                this._render();
            }
        }
    }

    _render() {
        const isInitialRender = !this._internalButtonElement;

        if (isInitialRender) {
            const styleLink = this.shadowRoot.querySelector('link[rel="stylesheet"]');
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== styleLink) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            this._internalButtonElement = document.createElement('adw-button');
            this._internalButtonElement.classList.add('adw-toggle-button');

            const defaultSlot = document.createElement('slot');
            this._internalButtonElement.appendChild(defaultSlot);

            this._internalButtonElement.addEventListener('click', (event) => {
                if (this.disabled) {
                    event.stopImmediatePropagation();
                    return;
                }
                this.dispatchEvent(new CustomEvent('toggle-intent', {
                    detail: { value: this.value, currentState: this.active },
                    bubbles: true, composed: true, cancelable: true
                }));
                if (!event.defaultPrevented) {
                     this.active = !this.active;
                }
            });
            this.shadowRoot.appendChild(this._internalButtonElement);
        }

        const labelText = this.getAttribute('label');
        const iconName = this.getAttribute('icon-name') || this.getAttribute('icon');
        const hostAriaLabel = this.getAttribute('aria-label');

        if (labelText && !this.textContent.trim() && !this.querySelector('slot')) {
             this._internalButtonElement.textContent = labelText;
        } else if (!labelText && !this.textContent.trim() && !this.querySelector('slot') && iconName && hostAriaLabel) {
            // AdwButton's own logic should handle this if hostAriaLabel is set on it
        } else if (!labelText && !iconName && !this.textContent.trim() && !this.querySelector('slot')) {
            // Truly empty
        }

        if (hostAriaLabel) {
            this._internalButtonElement.setAttribute('aria-label', hostAriaLabel);
        }


        if (iconName) this._internalButtonElement.setAttribute('icon-name', iconName);
        else this._internalButtonElement.removeAttribute('icon-name');

        if (this.getAttribute('flat') === 'false') this._internalButtonElement.removeAttribute('flat');
        else this._internalButtonElement.setAttribute('flat', '');

        ['suggested', 'destructive', 'circular'].forEach(attr => {
            if (this.hasAttribute(attr)) this._internalButtonElement.setAttribute(attr, this.getAttribute(attr) || '');
            else this._internalButtonElement.removeAttribute(attr);
        });

        this._internalButtonElement.toggleAttribute('disabled', this.disabled);
        this._updateInternalButtonActiveState();
    }

    _updateInternalButtonActiveState() {
        if (this._internalButtonElement) {
            const isActive = this.active;
            this._internalButtonElement.classList.toggle('active', isActive);
            this._internalButtonElement.toggleAttribute('active', isActive);
        }
    }

    get active() { return this.hasAttribute('active'); }
    set active(value) {
        const isActive = Boolean(value);
        const currentValue = this.hasAttribute('active');
        if (currentValue === isActive) return;

        if (isActive) this.setAttribute('active', '');
        else this.removeAttribute('active');
        this.dispatchEvent(new CustomEvent('toggled', { detail: { isActive, value: this.value } , bubbles: true, composed: true}));
    }

    get value() {
        return this.hasAttribute('value') ? this.getAttribute('value') : (this.getAttribute('label') || this.textContent.trim());
    }
    set value(val) {
        if (val === null || val === undefined) {
            this.removeAttribute('value');
        } else {
            this.setAttribute('value', String(val));
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) {
        const isDisabled = Boolean(value);
        const currentlyDisabled = this.hasAttribute('disabled');
        if (currentlyDisabled === isDisabled) return;

        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');

        if (this._internalButtonElement) {
            this._internalButtonElement.disabled = isDisabled;
            this._internalButtonElement.toggleAttribute('disabled', isDisabled);
        }
    }
}


/** Creates an AdwToggleGroup. */
export function createAdwToggleGroup(options = {}) {
    const opts = { linked: false, ...options }; const group = document.createElement('div'); group.classList.add('adw-toggle-group'); if (opts.linked) group.classList.add('linked'); group.setAttribute('role', 'radiogroup');
    let buttons = []; let currentActiveButton = null;
    function _setActiveState(buttonToActivate, shouldFireExternalCallback = true) { if (currentActiveButton === buttonToActivate && buttonToActivate.isActive()) return; if (currentActiveButton && currentActiveButton !== buttonToActivate) currentActiveButton.setActive(false, false); currentActiveButton = buttonToActivate; if (currentActiveButton) { if(!currentActiveButton.isActive()) currentActiveButton.setActive(true, false); } if (shouldFireExternalCallback && typeof opts.onActiveChanged === 'function') opts.onActiveChanged(currentActiveButton ? currentActiveButton.dataset.value : null); if(shouldFireExternalCallback) group.dispatchEvent(new CustomEvent('active-changed', { detail: { value: currentActiveButton ? currentActiveButton.dataset.value : null }, bubbles: true, composed: true })); }
    (opts.buttons || []).forEach(btnOptOrEl => { let button; let btnValue; if (btnOptOrEl instanceof HTMLElement && btnOptOrEl.classList.contains('adw-toggle-button')) { button = btnOptOrEl; btnValue = button.dataset.value || button.textContent.trim(); if(!button.dataset.value) button.dataset.value = btnValue; } else if (typeof btnOptOrEl === 'object') { btnValue = btnOptOrEl.value || btnOptOrEl.label || ''; button = createAdwToggleButton(btnOptOrEl.label || '', { ...btnOptOrEl, value: btnValue }); } else return; button.setAttribute('role', 'radio'); button.addEventListener('adw-toggle-button-clicked', (e) => { if(button.disabled) return; _setActiveState(button); }); buttons.push(button); group.appendChild(button); if (opts.activeValue && btnValue === opts.activeValue) { if(currentActiveButton && currentActiveButton !== button) currentActiveButton.setActive(false, false); currentActiveButton = button; } else if (button.isActive() && !currentActiveButton) { currentActiveButton = button; } else if (button.isActive() && currentActiveButton && currentActiveButton !== button) { button.setActive(false, false); }});
    if(currentActiveButton){ buttons.forEach(btn => { if(btn !== currentActiveButton && btn.isActive()) btn.setActive(false, false); else if (btn === currentActiveButton && !btn.isActive()) btn.setActive(true, false); }); } else if (opts.activeValue) { console.warn(`AdwToggleGroup: activeValue "${opts.activeValue}" did not match any button value.`); }
    group.getValue = () => currentActiveButton ? currentActiveButton.dataset.value : null;
    group.setValue = (valueToActivate) => { const buttonToActivate = buttons.find(btn => btn.dataset.value === valueToActivate); if (buttonToActivate) _setActiveState(buttonToActivate); else console.warn(`AdwToggleGroup: Value "${valueToActivate}" not found.`); };
    return group;
}
export class AdwToggleGroup extends HTMLElement {
    static get observedAttributes() { return ['linked', 'active-value']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        this.shadowRoot.appendChild(styleLink);

        this._groupElement = document.createElement('div');
        this._groupElement.classList.add('adw-toggle-group');
        this._groupElement.setAttribute('role', 'radiogroup');

        this._slotElement = document.createElement('slot');
        this._groupElement.appendChild(this._slotElement);
        this.shadowRoot.appendChild(this._groupElement);

        this._slotObserver = new MutationObserver(() => this._updateButtonStatesAndListeners());
        this._boundButtonClickHandler = this._handleSlottedButtonClick.bind(this);
    }
    connectedCallback() {
        this._slotElement.addEventListener('slotchange', () => this._updateButtonStatesAndListeners());
        this._updateStyling();
        this._updateButtonStatesAndListeners(); // Initial setup
    }
    disconnectedCallback() {
        this._slotObserver.disconnect();
        this._getSlottedButtons().forEach(button => {
            button.removeEventListener('adw-toggle-button-clicked', this._boundButtonClickHandler);
        });
    }

    _updateStyling() {
        if (this._groupElement) {
            this._groupElement.classList.toggle('linked', this.hasAttribute('linked'));
        }
    }

    _getSlottedButtons() {
        return (this._slotElement ? this._slotElement.assignedNodes({ flatten: true }) : Array.from(this.children))
            .filter(node => node.nodeType === Node.ELEMENT_NODE && node.matches('adw-toggle-button'));
    }

    _updateButtonStatesAndListeners() {
        const buttons = this._getSlottedButtons();
        const activeValue = this.getAttribute('active-value');
        let newActiveButtonFound = false;

        buttons.forEach(button => {
            button.setAttribute('role', 'radio');
            button.removeEventListener('adw-toggle-button-clicked', this._boundButtonClickHandler);
            button.addEventListener('adw-toggle-button-clicked', this._boundButtonClickHandler);

            const buttonValue = button.value;
            const shouldBeActive = (buttonValue === activeValue);

            if (button.active !== shouldBeActive) {
                button.active = shouldBeActive;
            }
            if (shouldBeActive) {
                newActiveButtonFound = true;
            }
        });

        if (activeValue && !newActiveButtonFound) {
            this.removeAttribute('active-value');
        }
    }

    _handleSlottedButtonClick(event) {
        const clickedButton = event.target;
        if (clickedButton.disabled || !clickedButton.matches('adw-toggle-button')) return;
        this.value = clickedButton.value;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active-value') {
                this._updateButtonStatesAndListeners();
                this.dispatchEvent(new CustomEvent('active-changed', { detail: { value: newValue }, bubbles: true, composed: true }));
            } else if (name === 'linked') {
                this._updateStyling();
            }
        }
    }

    get value() { return this.getAttribute('active-value'); }
    set value(newValue) {
        const oldValue = this.getAttribute('active-value');
        if (newValue === null || newValue === undefined) {
            this.removeAttribute('active-value');
        } else {
            this.setAttribute('active-value', newValue);
        }
        if (oldValue === newValue && newValue !== null) {
             this._updateButtonStatesAndListeners();
        }
    }
}

// No customElements.define here
