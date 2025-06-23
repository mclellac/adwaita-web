import { adwGenerateId } from './utils.js';
import { createAdwButton } from './button.js';

/**
 * Creates an Adwaita-style switch.
 */
export function createAdwSwitch(options = {}) {
  const opts = options || {};
  const wrapper = document.createElement("label");
  wrapper.classList.add("adw-switch");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("role", "switch");
  if(typeof opts.onChanged === 'function') {
    input.addEventListener("change", opts.onChanged);
  }

  const slider = document.createElement("span");
  slider.classList.add("adw-switch-slider");
  slider.setAttribute("aria-hidden", "true");

  wrapper.appendChild(input);
  wrapper.appendChild(slider);

  if (opts.checked) input.checked = true;
  if (opts.disabled) { input.disabled = true; wrapper.classList.add("disabled"); wrapper.setAttribute("aria-disabled", "true"); }
  if (opts.label) { const labelSpan = document.createElement("span"); labelSpan.classList.add("adw-switch-label"); labelSpan.textContent = opts.label; wrapper.appendChild(labelSpan); }
  return wrapper;
}

export class AdwSwitch extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._inputElement = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const wrapper = document.createElement("label"); wrapper.classList.add("adw-switch");
        this._inputElement = document.createElement("input"); this._inputElement.type = "checkbox"; this._inputElement.setAttribute("role", "switch");
        this._inputElement.addEventListener("change", (e) => { this.checked = this._inputElement.checked; this.dispatchEvent(new Event('change', { bubbles: true, composed: true, detail: {checked: this.checked} })); });
        const slider = document.createElement("span"); slider.classList.add("adw-switch-slider"); slider.setAttribute("aria-hidden", "true");
        wrapper.appendChild(this._inputElement); wrapper.appendChild(slider);
        const labelText = this.getAttribute('label'); if (labelText) { const labelSpan = document.createElement("span"); labelSpan.classList.add("adw-switch-label"); labelSpan.textContent = labelText; wrapper.appendChild(labelSpan); }
        this.checked = this.hasAttribute('checked');
        this.disabled = this.hasAttribute('disabled');
        this.shadowRoot.appendChild(wrapper);
    }
    get checked() { return this.hasAttribute('checked'); }
    set checked(value) { const isChecked = Boolean(value); if (this._inputElement) this._inputElement.checked = isChecked; if (isChecked) this.setAttribute('checked', ''); else this.removeAttribute('checked'); }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { const isDisabled = Boolean(value); if (this._inputElement) this._inputElement.disabled = isDisabled; const wrapper = this.shadowRoot.querySelector('.adw-switch'); if(wrapper) wrapper.classList.toggle('disabled', isDisabled); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
}

/**
 * Creates an Adwaita-style checkbox.
 */
export function createAdwCheckbox(options = {}) {
    const opts = options || {};
    const wrapper = document.createElement('label'); wrapper.classList.add('adw-checkbox'); if(opts.disabled) wrapper.classList.add('disabled');
    const input = document.createElement('input'); input.type = 'checkbox';
    if(opts.checked) input.checked = true; if(opts.disabled) input.disabled = true; if(opts.name) input.name = opts.name; if(opts.value) input.value = opts.value;
    if(typeof opts.onChanged === 'function') input.addEventListener('change', opts.onChanged);
    const checkmark = document.createElement('span'); checkmark.classList.add('adw-checkbox-checkmark'); checkmark.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(input); wrapper.appendChild(checkmark);
    if(opts.label){ const labelSpan = document.createElement('span'); labelSpan.classList.add('adw-checkbox-label'); labelSpan.textContent = opts.label; wrapper.appendChild(labelSpan); }
    return wrapper;
}
export class AdwCheckbox extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label', 'name', 'value']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._inputElement = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const wrapper = document.createElement('label'); wrapper.classList.add('adw-checkbox');
        this._inputElement = document.createElement('input'); this._inputElement.type = 'checkbox';
        this._inputElement.addEventListener('change', (e) => { this.checked = this._inputElement.checked; this.dispatchEvent(new Event('change', { bubbles: true, composed: true, detail: { checked: this.checked } })); });
        const checkmark = document.createElement('span'); checkmark.classList.add('adw-checkbox-checkmark'); checkmark.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(this._inputElement); wrapper.appendChild(checkmark);
        const labelText = this.getAttribute('label'); if (labelText) { const labelSpan = document.createElement('span'); labelSpan.classList.add('adw-checkbox-label'); labelSpan.textContent = labelText; wrapper.appendChild(labelSpan); }
        this.checked = this.hasAttribute('checked'); this.disabled = this.hasAttribute('disabled');
        if (this.hasAttribute('name')) this._inputElement.name = this.getAttribute('name');
        if (this.hasAttribute('value')) this._inputElement.value = this.getAttribute('value');
        this.shadowRoot.appendChild(wrapper);
    }
    get checked() { return this.hasAttribute('checked'); }
    set checked(value) { const isChecked = Boolean(value); if (this._inputElement) this._inputElement.checked = isChecked; if (isChecked) this.setAttribute('checked', ''); else this.removeAttribute('checked'); }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { const isDisabled = Boolean(value); if (this._inputElement) this._inputElement.disabled = isDisabled; const wrapper = this.shadowRoot.querySelector('.adw-checkbox'); if(wrapper) wrapper.classList.toggle('disabled', isDisabled); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
}

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

export class AdwSpinButton extends HTMLElement {
    static get observedAttributes() { return ['value', 'min', 'max', 'step', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
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

        this._entryElement = new AdwEntry(); // Assuming AdwEntry is defined and imported
        this._entryElement.classList.add('adw-spin-button-entry');
        this._entryElement.style.maxWidth = '80px'; // Example style
        this._entryElement.setAttribute('role', 'spinbutton');

        this._entryElement.addEventListener('change', (e) => {
            let numValue = parseFloat(this._entryElement.value);
            if (isNaN(numValue)) numValue = this.min; // Use current min if NaN
            numValue = Math.max(this.min, Math.min(this.max, numValue));
            // TODO: Step alignment logic if desired
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
            // cssClass is not a standard option for createAdwButton factory
            // ariaLabel will be passed to createAdwButton
        });
        this._downButton.setAttribute('aria-label', 'Decrement'); // Explicitly set after creation
        this._downButton.classList.add('adw-spin-button-down');
        this._downButton.addEventListener('click', () => { if(!this.disabled) this.value -= this.step; });

        this._upButton = createAdwButton('', {
            iconName: 'ui/pan-up-symbolic',
            flat: true,
            isCircular: false,
            // cssClass is not a standard option for createAdwButton factory
            // ariaLabel will be passed to createAdwButton
        });
        this._upButton.setAttribute('aria-label', 'Increment'); // Explicitly set after creation
        this._upButton.classList.add('adw-spin-button-up');
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

        let clampedVal = numVal;
        if (isNaN(clampedVal)) clampedVal = min;
        clampedVal = Math.max(min, Math.min(max, clampedVal));

        const oldValue = this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : null;
        if (oldValue !== clampedVal || !this.hasAttribute('value')) {
            this.setAttribute('value', clampedVal);
            this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: clampedVal } }));
        } else {
            this._updateInternalElementStates();
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
    }

    get min() { return this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0; }
    set min(val) { this.setAttribute('min', parseFloat(val)); }

    get max() { return this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100; }
    set max(val) { this.setAttribute('max', parseFloat(val)); }

    get step() { return this.hasAttribute('step') ? parseFloat(this.getAttribute('step')) : 1; }
    set step(val) { this.setAttribute('step', parseFloat(val)); }
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
