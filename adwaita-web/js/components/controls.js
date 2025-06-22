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
        // For factory usage, setting textContent is often more direct if not using slots from the caller.
        // However, the WC is designed with slots in mind.
        // If actionText is the primary way from factory, we can set its textContent.
        // Let's assume factory users might provide simple text for actionText.
        // The WC's render logic gives precedence to slots. If action-text is set AND no slots are used, it should pick it up.
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
    if (opts.dropdownAriaLabel) {
        splitButton.setAttribute('dropdown-aria-label', opts.dropdownAriaLabel);
    }
    if (opts.actionIconName) {
        splitButton.setAttribute('action-icon-name', opts.actionIconName);
    }

    // Event listeners
    if (typeof opts.onActionClick === 'function') {
        splitButton.addEventListener('action-click', opts.onActionClick);
    }
    if (typeof opts.onDropdownClick === 'function') {
        splitButton.addEventListener('dropdown-click', opts.onDropdownClick);
    }

    // If opts.children are provided, they would be slotted.
    // Example: if options included a child for the 'action-label' slot.
    // opts.children?.forEach(child => splitButton.appendChild(child));
    // For now, assuming simple text via actionText or content set by caller after creation.

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
            // Clear everything except the style link
            const styleLink = this.shadowRoot.querySelector('link[rel="stylesheet"]');
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== styleLink) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }

            this._wrapper = document.createElement('div');
            this._wrapper.classList.add('adw-split-button');

            this._actionButton = document.createElement('adw-button');
            this._actionButton.classList.add('adw-split-button-action');
            // Use a slot for the action button's text content primarily
            const actionSlot = document.createElement('slot');
            actionSlot.name = 'action-label'; // Named slot for explicit label
            const defaultSlot = document.createElement('slot'); // Default slot for simple text node or other elements
            this._actionButton.appendChild(actionSlot);
            this._actionButton.appendChild(defaultSlot);


            this._dropdownButton = document.createElement('adw-button');
            this._dropdownButton.classList.add('adw-split-button-dropdown');
            this._dropdownButton.setAttribute('icon-name', 'ui/pan-down-symbolic');
            this._dropdownButton.setAttribute('aria-haspopup', 'true');

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

        // Update attributes and classes
        const actionText = this.getAttribute('action-text'); // Can be used as fallback or direct set if no slot used
        const actionHref = this.getAttribute('action-href');
        const isSuggested = this.hasAttribute('suggested');
        const isDisabled = this.hasAttribute('disabled');
        const dropdownAriaLabel = this.getAttribute('dropdown-aria-label') || 'More options';
        const actionIconName = this.getAttribute('action-icon-name');

        this._wrapper.classList.toggle('suggested-action', isSuggested);
        this._wrapper.classList.toggle('disabled', isDisabled); // Main wrapper class for overall state

        // Configure Action Button
        if (actionText && !this.querySelector('[slot="action-label"]') && !this.textContent.trim()) {
             // If no slotted content for label and no default slot text, use action-text attribute.
             // This is tricky with slots. Preferring slots.
             // For simplicity, let's assume slotted content takes precedence.
             // If action-text is meant to be the primary way, then slotting might be secondary.
             // AdwButton itself handles its textContent or slot.
             // We might need to decide if AdwSplitButton's action-text directly sets textContent of internal adw-button
             // or if it's just an alternative to using slots.
             // Let's set textContent if attribute is present and no slot="action-label" exists.
             const defaultSlottedContent = Array.from(this.childNodes).filter(node => !node.slot || node.slot === "");
             const actionLabelSlottedContent = this.querySelector('[slot="action-label"]');

             if (!actionLabelSlottedContent && defaultSlottedContent.every(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() === '')) {
                 this._actionButton.textContent = actionText; // Fallback to attribute if slot is empty
             } else if (!actionLabelSlottedContent && !defaultSlottedContent.length) {
                 this._actionButton.textContent = actionText; // Fallback if no slots at all
             }
        } else if (!actionText && this._actionButton.textContent) {
            // Clear if attribute removed and text was from attribute
            // This logic is getting complex due to interaction of attribute and slot.
            // A simpler model for WC: attributes for config, slot for content.
            // Let's primarily rely on slots for text, `action-text` as a potential override/initial value.
        }


        if (actionHref) this._actionButton.setAttribute('href', actionHref); else this._actionButton.removeAttribute('href');
        if (actionIconName) this._actionButton.setAttribute('icon-name', actionIconName); else this._actionButton.removeAttribute('icon-name');
        this._actionButton.toggleAttribute('suggested', isSuggested);
        this._actionButton.toggleAttribute('disabled', isDisabled);


        // Configure Dropdown Button
        this._dropdownButton.setAttribute('aria-label', dropdownAriaLabel);
        this._dropdownButton.toggleAttribute('disabled', isDisabled);
        // Dropdown button should not typically be 'suggested' itself, the wrapper handles it.
    }
}

/** Creates an Adwaita-style Toggle Button using the AdwToggleButton Web Component. */
export function createAdwToggleButton(text, options = {}) {
    const opts = { active: false, ...options };
    const toggleButtonWC = document.createElement('adw-toggle-button');

    if (text) {
        // AdwToggleButton uses a slot for text, or 'label' attribute as fallback.
        // For factory, setting label attribute is more straightforward.
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
    if (opts.icon) { // AdwToggleButton maps 'icon' to 'icon-name' for its internal adw-button
        toggleButtonWC.setAttribute('icon', opts.icon);
    }
    if (opts.iconName) { // Prefer iconName if provided
        toggleButtonWC.setAttribute('icon-name', opts.iconName);
    }

    // Flat is default true for AdwToggleButton's internal button.
    // Only set if explicitly false.
    if (opts.flat === false) {
        toggleButtonWC.setAttribute('flat', 'false');
    }
    // Other boolean attributes for styling
    if (opts.suggested) toggleButtonWC.setAttribute('suggested', '');
    if (opts.destructive) toggleButtonWC.setAttribute('destructive', '');
    if (opts.isCircular) toggleButtonWC.setAttribute('circular', ''); // Map from opts.isCircular

    if (typeof opts.onToggled === 'function') {
        toggleButtonWC.addEventListener('toggled', (e) => {
            // The event detail should be { isActive, value }
            opts.onToggled(e.detail.isActive, e.detail.value);
        });
    }

    // The old factory had setActive and isActive methods.
    // The WC equivalent is setting the 'active' attribute/property.
    // Consumers of the factory who used these methods would need to adapt.
    // For now, the factory returns the WC instance directly.

    return toggleButtonWC;
}

export class AdwToggleButton extends HTMLElement {
    static get observedAttributes() { return ['label', 'active', 'disabled', 'value', 'icon', 'flat', 'suggested', 'destructive', 'circular']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._internalButtonElement = null; }
    connectedCallback() {
        this._internalButtonElement = null;
        this._render();
        // Set initial aria-pressed based on active state
        this.setAttribute('aria-pressed', String(this.active));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // The 'active' attribute change directly triggers the 'active' setter,
            // which calls _updateInternalButtonActiveState and dispatches 'toggled'.
            // So, we don't need a specific 'active' case here to call this.active = ...
            // For other attributes, a re-render or specific update is needed.
            if (name === 'disabled') {
                this.disabled = this.hasAttribute('disabled'); // Sync property and internal button
            } else if (name === 'active') {
                // This will be handled by the active setter if changed programmatically,
                // or if attribute is changed directly, the setter should reflect it.
                // We need to ensure aria-pressed on host is updated.
                this.setAttribute('aria-pressed', String(this.hasAttribute('active')));
                this._updateInternalButtonActiveState(); // Ensure internal button also reflects
            } else {
                this._render(); // Re-render for label, icon, style attributes etc.
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
            this._internalButtonElement.classList.add('adw-toggle-button'); // For specific toggle styling if any

            // Slot for label/content
            const defaultSlot = document.createElement('slot');
            this._internalButtonElement.appendChild(defaultSlot);

            this._internalButtonElement.addEventListener('click', (event) => {
                if (this.disabled) {
                    event.stopImmediatePropagation(); // Prevent further action
                    return;
                }
                // Dispatch a pre-toggle event. Could be made cancellable.
                this.dispatchEvent(new CustomEvent('toggle-intent', { // Renamed from 'adw-toggle-button-clicked' for clarity
                    detail: { value: this.value, currentState: this.active },
                    bubbles: true, composed: true, cancelable: true
                }));

                // Toggle logic: if not part of a group that manages its state (e.g. adw-toggle-group)
                // AdwToggleGroup listens to 'toggle-intent' or similar and calls preventDefault if it handles it.
                // For now, assume direct toggle if not prevented by a parent.
                // The old logic: if (!this.closest('adw-toggle-group'))
                // This check is better done by the group itself by cancelling the event.
                // Here, we just toggle if the event was not cancelled.
                if (!event.defaultPrevented) {
                     this.active = !this.active; // This will trigger the setter
                }
            });
            this.shadowRoot.appendChild(this._internalButtonElement);
        }

        // Update internal adw-button attributes from adw-toggle-button attributes
        const labelText = this.getAttribute('label'); // Fallback if no slot used
        const iconName = this.getAttribute('icon-name') || this.getAttribute('icon'); // Prefer icon-name

        if (labelText && !this.textContent.trim() && !this.querySelector('slot')) {
            // If label attribute is present and no slotted content, set it on internal button
             this._internalButtonElement.textContent = labelText;
        } else if (!labelText && this.textContent.trim()) {
            // If no label attribute but host has text content, it will be slotted.
            // If both, slot wins. If neither, button is textless (e.g. icon only)
        }


        if (iconName) this._internalButtonElement.setAttribute('icon-name', iconName);
        else this._internalButtonElement.removeAttribute('icon-name');

        // Default to flat, unless flat="false"
        if (this.getAttribute('flat') === 'false') this._internalButtonElement.removeAttribute('flat');
        else this._internalButtonElement.setAttribute('flat', '');

        ['suggested', 'destructive', 'circular'].forEach(attr => {
            if (this.hasAttribute(attr)) this._internalButtonElement.setAttribute(attr, this.getAttribute(attr) || '');
            else this._internalButtonElement.removeAttribute(attr);
        });

        this._internalButtonElement.toggleAttribute('disabled', this.disabled);
        this._updateInternalButtonActiveState(); // Sync active state too
        // Value attribute is directly on the host, not the internal button's dataset.
    }

    _updateInternalButtonActiveState() {
        if (this._internalButtonElement) {
            const isActive = this.active;
            this._internalButtonElement.classList.toggle('active', isActive); // Visual cue via class
            this._internalButtonElement.toggleAttribute('active', isActive); // For adw-button's own state if it uses it
            // aria-pressed should be on the host AdwToggleButton, not the internal adw-button.
            // The host's attributeChangedCallback for 'active' handles setting aria-pressed on the host.
        }
    }

    get active() { return this.hasAttribute('active'); }
    set active(value) {
        const isActive = Boolean(value);
        const currentValue = this.hasAttribute('active');
        if (currentValue === isActive) return;

        if (isActive) this.setAttribute('active', '');
        else this.removeAttribute('active');
        // attributeChangedCallback for 'active' will handle:
        // - setting aria-pressed on host
        // - calling _updateInternalButtonActiveState
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
            this._internalButtonElement.disabled = isDisabled; // adw-button should have a disabled setter or handle attribute
            this._internalButtonElement.toggleAttribute('disabled', isDisabled); // Ensure attribute for styling/WC behavior
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
