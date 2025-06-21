import { adwGenerateId } from './utils.js';
import { createAdwButton } from './button.js'; // For SplitButton

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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._inputElement = null; }
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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._inputElement = null; }
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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._inputElement = null; }
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
 * Creates an Adwaita-style SplitButton.
 */
export function createAdwSplitButton(options = {}) {
    const opts = options || {}; const wrapper = document.createElement('div'); wrapper.classList.add('adw-split-button'); if(opts.suggested) wrapper.classList.add('suggested-action'); if(opts.disabled) wrapper.classList.add('disabled');
    const actionButton = createAdwButton(opts.actionText || '', { href: opts.actionHref, onClick: opts.onActionClick, suggested: opts.suggested, disabled: opts.disabled }); actionButton.classList.add('adw-split-button-action');
    const dropdownButton = createAdwButton('', { icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 6h8L8 11z"/></svg>', onClick: opts.onDropdownClick, disabled: opts.disabled }); dropdownButton.classList.add('adw-split-button-dropdown'); dropdownButton.setAttribute('aria-label', opts.dropdownAriaLabel || 'More options'); dropdownButton.setAttribute('aria-haspopup', 'true');
    wrapper.appendChild(actionButton); wrapper.appendChild(dropdownButton); return wrapper;
}
export class AdwSplitButton extends HTMLElement {
    static get observedAttributes() { return ['action-text', 'action-href', 'suggested', 'disabled', 'dropdown-aria-label']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) { this.shadowRoot.removeChild(this.shadowRoot.lastChild); }
        const wrapper = document.createElement('div'); wrapper.classList.add('adw-split-button');
        const actionText = this.getAttribute('action-text') || this.textContent.trim(); const actionHref = this.getAttribute('action-href');
        const isSuggested = this.hasAttribute('suggested'); const isDisabled = this.hasAttribute('disabled');
        const dropdownAriaLabel = this.getAttribute('dropdown-aria-label') || 'More options';
        if (isSuggested) wrapper.classList.add('suggested-action'); if (isDisabled) wrapper.classList.add('disabled');
        const actionButton = createAdwButton(actionText, { href: actionHref, suggested: isSuggested, disabled: isDisabled, onClick: (e) => this.dispatchEvent(new CustomEvent('action-click', {bubbles: true, composed: true, detail: {originalEvent: e}})) }); actionButton.classList.add('adw-split-button-action');
        const dropdownButton = createAdwButton('', { icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 6h8L8 11z"/></svg>', disabled: isDisabled, onClick: (e) => this.dispatchEvent(new CustomEvent('dropdown-click', {bubbles: true, composed: true, detail: {originalEvent: e}})) }); dropdownButton.classList.add('adw-split-button-dropdown'); dropdownButton.setAttribute('aria-label', dropdownAriaLabel); dropdownButton.setAttribute('aria-haspopup', 'true');
        wrapper.appendChild(actionButton); wrapper.appendChild(dropdownButton); this.shadowRoot.appendChild(wrapper);
    }
}

/** Creates an Adwaita-style Toggle Button. */
export function createAdwToggleButton(text, options = {}) {
    const opts = { active: false, ...options }; let isActive = opts.active;
    const buttonOptions = { ...opts }; delete buttonOptions.onToggled; delete buttonOptions.value;
    if (typeof buttonOptions.flat === 'undefined') buttonOptions.flat = true;

    const toggleButton = createAdwButton(text, { ...buttonOptions, active: isActive });
    toggleButton.classList.add('adw-toggle-button');
    toggleButton.setAttribute('aria-pressed', String(isActive));
    if(opts.value) toggleButton.dataset.value = opts.value;

    const originalClickListener = toggleButton.onclick;
    toggleButton.onclick = (event) => {
        if (toggleButton.disabled) return;
        if (typeof originalClickListener === 'function') { originalClickListener(event); if(event.defaultPrevented) return; }
        toggleButton.dispatchEvent(new CustomEvent('adw-toggle-button-clicked', {
            detail: { value: opts.value, currentState: isActive },
            bubbles: true, composed: true
        }));
    };
    toggleButton.setActive = (state, fireCallback = true) => {
        const newState = Boolean(state);
        if (isActive === newState) return;
        isActive = newState;
        toggleButton.classList.toggle('active', isActive);
        toggleButton.setAttribute('aria-pressed', String(isActive));
        if (fireCallback && typeof opts.onToggled === 'function') {
            opts.onToggled(isActive, opts.value);
        }
        if (fireCallback) {
             toggleButton.dispatchEvent(new CustomEvent('toggled', { detail: { isActive, value: opts.value } , bubbles: true, composed: true}));
        }
    };
    toggleButton.isActive = () => isActive;
    return toggleButton;
}

export class AdwToggleButton extends HTMLElement {
    static get observedAttributes() { return ['label', 'active', 'disabled', 'value', 'icon', 'flat', 'suggested', 'destructive', 'circular']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._internalButtonElement = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active') {
                this.active = this.hasAttribute('active');
            } else if (name === 'disabled') {
                 this.disabled = this.hasAttribute('disabled');
            } else {
                 this._render();
            }
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        const labelText = this.getAttribute('label') || this.textContent.trim();
        const initialActive = this.hasAttribute('active');
        const valueAttr = this.getAttribute('value') || labelText;

        this._internalButtonElement = createAdwButton(labelText, {
            icon: this.getAttribute('icon') || undefined,
            flat: !this.hasAttribute('flat') || this.getAttribute('flat') !== 'false',
            suggested: this.hasAttribute('suggested'),
            destructive: this.hasAttribute('destructive'),
            isCircular: this.hasAttribute('circular'),
            disabled: this.hasAttribute('disabled'),
            active: initialActive
        });
        this._internalButtonElement.classList.add('adw-toggle-button');
        this._internalButtonElement.classList.toggle('active', initialActive);
        this._internalButtonElement.setAttribute('aria-pressed', String(initialActive));
        this._internalButtonElement.dataset.value = valueAttr;

        this._internalButtonElement.onclick = null;
        this._internalButtonElement.addEventListener('click', (event) => {
            if (this.disabled) return;
            this.dispatchEvent(new CustomEvent('adw-toggle-button-clicked', {
                detail: { value: this.value, currentState: this.active },
                bubbles: true, composed: true
            }));
            if (!this.closest('adw-toggle-group')) {
                 this.active = !this.active;
            }
        });
        this.shadowRoot.appendChild(this._internalButtonElement);
    }
    get active() { return this.hasAttribute('active'); }
    set active(value) {
        const isActive = Boolean(value); const currentValue = this.hasAttribute('active');
        if (currentValue === isActive) return;
        if (isActive) this.setAttribute('active', ''); else this.removeAttribute('active');
        if (this._internalButtonElement) { this._internalButtonElement.classList.toggle('active', isActive); this._internalButtonElement.setAttribute('aria-pressed', String(isActive));}
        this.dispatchEvent(new CustomEvent('toggled', { detail: { isActive, value: this.value } , bubbles: true, composed: true}));
    }
    get value() { return this.getAttribute('value') || (this._internalButtonElement ? this._internalButtonElement.dataset.value : this.textContent.trim());}
    set value(val) { this.setAttribute('value', val); if(this._internalButtonElement) this._internalButtonElement.dataset.value = val; }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { const isDisabled = Boolean(value); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); if (this._internalButtonElement) this._internalButtonElement.disabled = isDisabled; }
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
        const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
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
        this._slotObserver.disconnect(); // Should be observing light DOM children, not slot itself for this logic
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
        // Query assigned nodes of the slot, or direct children if slot is not yet fully initialized
        return (this._slotElement ? this._slotElement.assignedNodes({ flatten: true }) : Array.from(this.children))
            .filter(node => node.nodeType === Node.ELEMENT_NODE && node.matches('adw-toggle-button'));
    }

    _updateButtonStatesAndListeners() {
        const buttons = this._getSlottedButtons();
        const activeValue = this.getAttribute('active-value');
        let newActiveButtonFound = false;

        buttons.forEach(button => {
            // Ensure each button is a radio role within this group
            button.setAttribute('role', 'radio');

            // Remove old listener before adding new one to prevent duplicates
            button.removeEventListener('adw-toggle-button-clicked', this._boundButtonClickHandler);
            button.addEventListener('adw-toggle-button-clicked', this._boundButtonClickHandler);

            const buttonValue = button.value; // Use AdwToggleButton's value property
            const shouldBeActive = (buttonValue === activeValue);

            if (button.active !== shouldBeActive) {
                button.active = shouldBeActive; // Use AdwToggleButton's active setter
            }
            if (shouldBeActive) {
                newActiveButtonFound = true;
            }
        });

        // If activeValue was set but no button matched, clear it
        if (activeValue && !newActiveButtonFound) {
            this.removeAttribute('active-value'); // This will trigger attributeChangedCallback -> _render -> _updateButtonStates
        }
    }

    _handleSlottedButtonClick(event) {
        const clickedButton = event.target; // The AdwToggleButton itself
        if (clickedButton.disabled || !clickedButton.matches('adw-toggle-button')) return;

        this.value = clickedButton.value; // Use setter, it will update attribute & call _updateButtonStates
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active-value') {
                this._updateButtonStatesAndListeners(); // Ensure correct button is active
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
        // attributeChangedCallback handles the rest if value actually changed
        if (oldValue === newValue && newValue !== null) { // Force update if value set to same but internal state might be off
             this._updateButtonStatesAndListeners();
        }
    }
}

// No customElements.define here
