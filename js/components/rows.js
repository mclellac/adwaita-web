import { adwGenerateId } from './utils.js';
import { createAdwButton, AdwButton } from './button.js';
import { createAdwLabel, AdwLabel } from './misc.js';
import { createAdwEntry, AdwEntry } from './forms.js';
import { createAdwSpinButton, AdwSpinButton } from './forms.js';

/**
 * Creates an Adwaita-style row, typically for lists or form-like structures.
 */
export function createAdwRow(options = {}) {
  const opts = options || {};
  const row = document.createElement("div");
  row.classList.add("adw-row");

  opts.children?.forEach((child) => {
    if (child instanceof Node) row.appendChild(child);
  });
  if (opts.activated) {
    row.classList.add("activated");
  }
  if (opts.interactive) {
    row.classList.add("interactive");
  }
  if (opts.interactive && typeof opts.onClick === 'function') {
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");
    row.addEventListener("click", opts.onClick);
    row.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            opts.onClick(e);
        }
    });
  }
  return row;
}

export class AdwRow extends HTMLElement {
    static get observedAttributes() { return ['activated', 'interactive']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._onClick = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    set onClick(handler) { this._onClick = (typeof handler === 'function') ? handler : null; this._render(); }
    get onClick() { return this._onClick; }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("adw-row");
        if (this.hasAttribute('activated')) rowDiv.classList.add("activated");
        const isInteractiveFromAttr = this.hasAttribute('interactive');
        const hasProgrammaticClick = typeof this._onClick === 'function';
        if (isInteractiveFromAttr || hasProgrammaticClick) {
            rowDiv.classList.add("interactive");
            rowDiv.setAttribute("tabindex", "0");
            rowDiv.setAttribute("role", "listitem");
            const clickHandler = hasProgrammaticClick ? this._onClick : (event) => {
                this.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
            };
            rowDiv.addEventListener("click", clickHandler);
            rowDiv.addEventListener("keydown", (e) => { if (e.key === 'Enter' || e.key === ' ') { clickHandler(e); e.preventDefault(); }});
        }
        const slot = document.createElement('slot'); rowDiv.appendChild(slot);
        this.shadowRoot.appendChild(rowDiv);
    }
}

const CHEVRON_SVG_STRING = '<svg viewBox="0 0 16 16" fill="currentColor" style="width:0.8em;height:0.8em;"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/></svg>';

function _appendSVGStringToElement(svgString, parentElement) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (svgElement) {
        // Basic script sanitization
        Array.from(svgElement.querySelectorAll('script')).forEach(s => s.remove());
        parentElement.appendChild(svgElement);
    }
}

function _appendChevron(parentElement) {
    const chevron = document.createElement('span');
    chevron.classList.add('adw-action-row-chevron');
    _appendSVGStringToElement(CHEVRON_SVG_STRING, chevron);
    parentElement.appendChild(chevron);
}

/**
 * Creates an Adwaita ActionRow.
 */
export function createAdwActionRow(options = {}) {
    const opts = options || {};
    const row = document.createElement("div");
    row.classList.add("adw-action-row");
    if(opts.onClick) row.classList.add("activatable");

    if(opts.iconHTML) {
        const prefix = document.createElement('div');
        prefix.classList.add('adw-action-row-prefix');
        const iconSpan = document.createElement('span');
        if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim().startsWith("<svg")) {
            _appendSVGStringToElement(opts.iconHTML, iconSpan);
        } else if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim() !== '') {
            iconSpan.classList.add(...opts.iconHTML.split(' '));
        }
        if (iconSpan.hasChildNodes() || iconSpan.classList.length > 1) prefix.appendChild(iconSpan); // Changed from >0 to >1 for classList
        row.appendChild(prefix);
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('adw-action-row-content');
    const titleLabel = createAdwLabel(opts.title || '', {htmlTag: 'span'});
    titleLabel.classList.add('adw-action-row-title');
    contentDiv.appendChild(titleLabel);

    if(opts.subtitle) {
        const subtitleLabel = createAdwLabel(opts.subtitle, {htmlTag: 'span'});
        subtitleLabel.classList.add('adw-action-row-subtitle');
        contentDiv.appendChild(subtitleLabel);
    }
    row.appendChild(contentDiv);

    if(opts.showChevron) {
        const suffix = document.createElement('div');
        suffix.classList.add('adw-action-row-suffix');
        _appendChevron(suffix);
        row.appendChild(suffix);
    }
    if(typeof opts.onClick === 'function'){
        row.addEventListener('click', opts.onClick);
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'button');
         row.addEventListener("keydown", (e) => { if (e.key === 'Enter' || e.key === ' ') opts.onClick(e); });
    }
    return row;
}
export class AdwActionRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'icon', 'show-chevron', 'activatable']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._onClick = null;}
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    set onClick(handler) { this._onClick = (typeof handler === 'function') ? handler : null; this._render(); }
    get onClick() { return this._onClick; }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        const row = document.createElement("div"); row.classList.add("adw-action-row");
        const titleText = this.getAttribute('title') || ''; const subtitleText = this.getAttribute('subtitle');
        const iconHTML = this.getAttribute('icon'); const showChevron = this.hasAttribute('show-chevron');
        const isActivatable = this.hasAttribute('activatable') || this._onClick;

        if (isActivatable) {
            row.classList.add("activatable"); row.setAttribute("tabindex", "0"); row.setAttribute("role", "button");
            const clickHandler = this._onClick || ((event) => { this.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true })); });
            row.addEventListener('click', clickHandler);
            row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') clickHandler(e); });
        }
        if (iconHTML) {
            const prefix = document.createElement('div'); prefix.classList.add('adw-action-row-prefix');
            const iconSpan = document.createElement('span');
            if (iconHTML.trim().startsWith("<svg")) {
                _appendSVGStringToElement(iconHTML, iconSpan);
            } else if (iconHTML.trim() !== '') iconSpan.classList.add(...iconHTML.split(' '));
            if (iconSpan.hasChildNodes() || iconSpan.classList.length > 1) prefix.appendChild(iconSpan);
            row.appendChild(prefix);
        }
        const contentDiv = document.createElement('div'); contentDiv.classList.add('adw-action-row-content');
        const titleLabel = createAdwLabel(titleText, {htmlTag: 'span'}); titleLabel.classList.add('adw-action-row-title');
        const titleSlot = document.createElement('slot'); titleSlot.name = 'title-override'; titleLabel.appendChild(titleSlot);
        contentDiv.appendChild(titleLabel);
        if (subtitleText) { const subtitleLabel = createAdwLabel(subtitleText, {htmlTag: 'span'}); subtitleLabel.classList.add('adw-action-row-subtitle'); contentDiv.appendChild(subtitleLabel); }
        row.appendChild(contentDiv);

        const suffixContainer = document.createElement('div'); suffixContainer.classList.add('adw-action-row-suffix');
        if (showChevron) { _appendChevron(suffixContainer); }
        const suffixSlot = document.createElement('slot'); suffixSlot.name = 'suffix-widget';
        suffixContainer.appendChild(suffixSlot);
        if (showChevron || this.querySelector('[slot="suffix-widget"]')) { // Only add if chevron or actual slotted content
            row.appendChild(suffixContainer);
        }
        this.shadowRoot.appendChild(row);
    }
}

/**
 * Creates an Adwaita-style EntryRow.
 */
export function createAdwEntryRow(options = {}) {
    const opts = options || {};
    const row = createAdwRow({ interactive: false });
    row.classList.add("adw-entry-row");
    const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-entry-row-text-content");
    const titleLabel = createAdwLabel(opts.title || "", { htmlTag: "label" }); titleLabel.classList.add("adw-entry-row-title");
    textContentDiv.appendChild(titleLabel);
    if (opts.subtitle) { const subtitleLabel = createAdwLabel(opts.subtitle, { htmlTag: "span" }); subtitleLabel.classList.add("adw-entry-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
    row.appendChild(textContentDiv);
    const entryOptions = { ...(opts.entryOptions || {}) }; const entryId = adwGenerateId('entry-row-input');
    titleLabel.setAttribute('for', entryId); entryOptions.id = entryId;
    const entryElement = createAdwEntry(entryOptions); entryElement.classList.add("adw-entry-row-entry");
    row.appendChild(entryElement); return row;
}
export class AdwEntryRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'required', 'name', 'value', 'placeholder', 'disabled', 'type']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._internalEntry = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) { this.shadowRoot.removeChild(this.shadowRoot.lastChild); }
        const row = document.createElement("div"); row.classList.add("adw-row", "adw-entry-row");
        const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-entry-row-text-content");
        const entryId = this.id ? `${this.id}-entry` : adwGenerateId('adw-entry-row-input');
        const titleText = this.getAttribute('title') || '';
        const titleLabel = createAdwLabel(titleText, { htmlTag: "label" }); titleLabel.classList.add("adw-entry-row-title"); titleLabel.setAttribute('for', entryId);
        textContentDiv.appendChild(titleLabel);
        const subtitleText = this.getAttribute('subtitle');
        if (subtitleText) { const subtitleLabel = createAdwLabel(subtitleText, { htmlTag: "span" }); subtitleLabel.classList.add("adw-entry-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
        row.appendChild(textContentDiv);
        this._internalEntry = new AdwEntry(); this._internalEntry.id = entryId;
        if (this.hasAttribute('placeholder')) this._internalEntry.setAttribute('placeholder', this.getAttribute('placeholder'));
        if (this.hasAttribute('value')) this._internalEntry.value = this.getAttribute('value');
        if (this.hasAttribute('disabled')) this._internalEntry.disabled = true;
        if (this.hasAttribute('name')) this._internalEntry.setAttribute('name', this.getAttribute('name'));
        if (this.hasAttribute('required')) this._internalEntry.setAttribute('required', '');
        if (this.hasAttribute('type')) this._internalEntry.setAttribute('type', this.getAttribute('type'));
        this._internalEntry.classList.add("adw-entry-row-entry");
        this._internalEntry.addEventListener('input', (e) => { this.value = this._internalEntry.value; this.dispatchEvent(new CustomEvent('input', { detail: { value: this._internalEntry.value, originalEvent: e } })); });
        this._internalEntry.addEventListener('change', (e) => { this.dispatchEvent(new CustomEvent('change', { detail: { value: this._internalEntry.value, originalEvent: e } })); });
        row.appendChild(this._internalEntry); this.shadowRoot.appendChild(row);
    }
    get value() { return this._internalEntry ? this._internalEntry.value : this.getAttribute('value'); }
    set value(val) { this.setAttribute('value', val); if (this._internalEntry) this._internalEntry.value = val; }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) { const isDisabled = Boolean(val); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); if (this._internalEntry) this._internalEntry.disabled = isDisabled; }
}

const EYE_ICON_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 00-6 6c0 1.6.6 3.1 1.6 4.2L2 13.8a.8.8 0 001.1 1.1L4.2 13.4A6 6 0 008 14a6 6 0 006-6 6 6 0 00-6-6zm0 10a4 4 0 110-8 4 4 0 010 8zm0-1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>';
const EYE_SLASHED_ICON_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7zm0 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM5.5 8a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"/><path d="M2.5 9.5l11-7-1.1 1.1-11 7z"/></svg>'; // Placeholder

/**
 * Creates an Adwaita-style PasswordEntryRow.
 */
export function createAdwPasswordEntryRow(options = {}) {
    const opts = options || {};
    const row = createAdwEntryRow({
        title: opts.title, subtitle: opts.subtitle,
        entryOptions: { ...opts.entryOptions, type: 'password', placeholder: opts.entryOptions?.placeholder || 'Enter password' }
    });
    row.classList.remove("adw-entry-row"); row.classList.add("adw-password-entry-row");
    const entry = row.querySelector('.adw-entry-row-entry'); // Query for the input element
    if (entry) {
        const visibilityToggle = createAdwButton('', {
            icon: EYE_ICON_SVG, flat: true, isCircular: true,
            onClick: () => {
                const isPassword = entry.type === 'password'; entry.type = isPassword ? 'text' : 'password';
                const iconSpan = visibilityToggle.querySelector('.icon');
                if(iconSpan) { // createAdwButton creates a span.icon for SVG
                    while(iconSpan.firstChild) iconSpan.removeChild(iconSpan.firstChild);
                    _appendSVGStringToElement(isPassword ? EYE_SLASHED_ICON_SVG : EYE_ICON_SVG, iconSpan);
                }
            }
        });
        visibilityToggle.classList.add('adw-password-entry-row-toggle');
        if(entry.parentElement && entry.parentElement.classList.contains('adw-entry-row-entry')) { // If entry is wrapped
            entry.parentElement.parentElement.appendChild(visibilityToggle);
        } else if(entry.parentElement) { // Default, assume entry is direct child of a container in row
             entry.parentElement.appendChild(visibilityToggle); // This might need adjustment based on final row structure
        }
    }
    return row;
}
export class AdwPasswordEntryRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'required', 'name', 'value', 'placeholder', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._internalEntry = null; this._visibilityToggle = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) { this.shadowRoot.removeChild(this.shadowRoot.lastChild); }
        const row = document.createElement("div"); row.classList.add("adw-row", "adw-password-entry-row");
        const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-entry-row-text-content");
        const entryId = this.id ? `${this.id}-entry` : adwGenerateId('adw-password-entry-input');
        const titleText = this.getAttribute('title') || '';
        const titleLabel = createAdwLabel(titleText, { htmlTag: "label" }); titleLabel.classList.add("adw-entry-row-title"); titleLabel.setAttribute('for', entryId);
        textContentDiv.appendChild(titleLabel);
        const subtitleText = this.getAttribute('subtitle');
        if (subtitleText) { const subtitleLabel = createAdwLabel(subtitleText, { htmlTag: "span" }); subtitleLabel.classList.add("adw-entry-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
        row.appendChild(textContentDiv);
        const inputArea = document.createElement('div'); inputArea.classList.add('adw-password-entry-input-area');
        this._internalEntry = new AdwEntry(); this._internalEntry.id = entryId; this._internalEntry.setAttribute('type', 'password');
        if (this.hasAttribute('placeholder')) this._internalEntry.setAttribute('placeholder', this.getAttribute('placeholder'));
        if (this.hasAttribute('value')) this._internalEntry.value = this.getAttribute('value');
        if (this.hasAttribute('name')) this._internalEntry.setAttribute('name', this.getAttribute('name'));
        if (this.hasAttribute('required')) this._internalEntry.setAttribute('required', '');
        this._internalEntry.classList.add("adw-entry-row-entry");
        this._internalEntry.addEventListener('input', (e) => { this.value = this._internalEntry.value; this.dispatchEvent(new CustomEvent('input', { detail: { value: this._internalEntry.value, originalEvent: e } })); });
        this._internalEntry.addEventListener('change', (e) => { this.dispatchEvent(new CustomEvent('change', { detail: { value: this._internalEntry.value, originalEvent: e } })); });
        inputArea.appendChild(this._internalEntry);

        this._visibilityToggle = createAdwButton('', { icon: EYE_ICON_SVG, flat: true, isCircular: true });
        this._visibilityToggle.classList.add('adw-password-entry-row-toggle');
        this._visibilityToggle.addEventListener('click', () => {
            const isPassword = this._internalEntry.type === 'password';
            this._internalEntry.type = isPassword ? 'text' : 'password';
            const iconSpan = this._visibilityToggle.querySelector('.icon');
            if(iconSpan) {
                while(iconSpan.firstChild) iconSpan.removeChild(iconSpan.firstChild);
                _appendSVGStringToElement(isPassword ? EYE_SLASHED_ICON_SVG : EYE_ICON_SVG, iconSpan);
            }
        });
        inputArea.appendChild(this._visibilityToggle);
        row.appendChild(inputArea); this.shadowRoot.appendChild(row);
        this.disabled = this.hasAttribute('disabled');
    }
    get value() { return this._internalEntry ? this._internalEntry.value : this.getAttribute('value'); }
    set value(val) { this.setAttribute('value', val); if (this._internalEntry) this._internalEntry.value = val; }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) { const isDisabled = Boolean(val); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); if (this._internalEntry) this._internalEntry.disabled = isDisabled; if (this._visibilityToggle) this._visibilityToggle.disabled = isDisabled; }
}

/**
 * Creates an Adwaita-style ExpanderRow.
 */
export function createAdwExpanderRow(options = {}) {
    const opts = options || {};
    const expanderRow = document.createElement("div");
    expanderRow.classList.add("adw-expander-row");
    if(opts.expanded) expanderRow.classList.add("expanded");

    const actionRowOptions = {
        title: opts.title,
        subtitle: opts.subtitle,
        onClick: () => {
            const isExpanded = expanderRow.classList.toggle("expanded");
            contentArea.style.display = isExpanded ? "block" : "none";
            const header = expanderRow.querySelector('.adw-expander-row-header');
            if(header) header.classList.toggle('expanded', isExpanded);

            if (typeof opts.onToggled === "function") {
                opts.onToggled(isExpanded);
            }
        }
    };
    const headerActionRow = createAdwActionRow(actionRowOptions);
    headerActionRow.classList.add('adw-expander-row-header');
    if(opts.expanded) headerActionRow.classList.add("expanded");


    const arrow = document.createElement('span');
    arrow.classList.add('adw-expander-row-arrow');

    const suffixSlotElement = document.createElement('div');
    suffixSlotElement.setAttribute('slot','suffix-widget');
    suffixSlotElement.appendChild(arrow);
    headerActionRow.appendChild(suffixSlotElement);


    const contentArea = document.createElement("div");
    contentArea.classList.add("adw-expander-row-content-area");
    if (opts.content instanceof Node) {
        contentArea.appendChild(opts.content);
    }
    contentArea.style.display = opts.expanded ? "block" : "none";

    expanderRow.appendChild(headerActionRow);
    expanderRow.appendChild(contentArea);
    return expanderRow;
}
export class AdwExpanderRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'expanded']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        const expanderRow = document.createElement("div");
        expanderRow.classList.add("adw-expander-row");

        this._headerActionRow = new AdwActionRow();
        this._headerActionRow.classList.add('adw-expander-row-header');
        this._headerActionRow.setAttribute('title', this.getAttribute('title') || '');
        if (this.hasAttribute('subtitle')) {
            this._headerActionRow.setAttribute('subtitle', this.getAttribute('subtitle'));
        }

        this._arrow = document.createElement('span');
        this._arrow.classList.add('adw-expander-row-arrow');
        this._arrow.setAttribute('slot', 'suffix-widget');
        this._headerActionRow.appendChild(this._arrow);

        this._headerActionRow.addEventListener('click', () => this.toggle());
        this._headerActionRow.setAttribute('aria-expanded', this.hasAttribute('expanded').toString());

        const contentId = adwGenerateId('adw-expander-content');
        this._headerActionRow.setAttribute('aria-controls', contentId);

        this._contentArea = document.createElement("div");
        this._contentArea.classList.add("adw-expander-row-content-area");
        this._contentArea.id = contentId;
        const contentSlot = document.createElement('slot');
        contentSlot.name = 'content';
        this._contentArea.appendChild(contentSlot);

        expanderRow.appendChild(this._headerActionRow);
        expanderRow.appendChild(this._contentArea);
        this.shadowRoot.appendChild(expanderRow);

        this.expanded = this.hasAttribute('expanded');
    }
    get expanded() { return this.hasAttribute('expanded'); }
    set expanded(isExpanded) {
        const shouldExpand = Boolean(isExpanded);
        if (this.expanded === shouldExpand) return;
        if (shouldExpand) this.setAttribute('expanded', '');
        else this.removeAttribute('expanded');
        if (this._headerActionRow) this._headerActionRow.classList.toggle("expanded", shouldExpand);
        if (this.shadowRoot.querySelector('.adw-expander-row')) this.shadowRoot.querySelector('.adw-expander-row').classList.toggle("expanded", shouldExpand); // For main class
        if (this._contentArea) this._contentArea.style.display = shouldExpand ? "block" : "none";
        this.dispatchEvent(new CustomEvent('toggled', { detail: { expanded: shouldExpand } }));
    }
    toggle() { this.expanded = !this.expanded; }
}


/**
 * Creates an Adwaita-style ComboRow (Entry with Dropdown).
 */
export function createAdwComboRow(options = {}) {
    const opts = options || {};
    const row = createAdwRow({ interactive: false });
    row.classList.add("adw-combo-row");
    const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-combo-row-text-content");
    const titleLabel = createAdwLabel(opts.title || "", { htmlTag: "label" }); titleLabel.classList.add("adw-combo-row-title");
    textContentDiv.appendChild(titleLabel);
    if (opts.subtitle) { const subtitleLabel = createAdwLabel(opts.subtitle, { htmlTag: "span" }); subtitleLabel.classList.add("adw-combo-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
    row.appendChild(textContentDiv);
    const selectId = adwGenerateId('combo-row-select'); titleLabel.setAttribute('for', selectId);
    const selectElement = document.createElement("select"); selectElement.classList.add("adw-combo-row-select");
    selectElement.id = selectId; if (opts.disabled) selectElement.disabled = true;
    (opts.options || []).forEach(opt => { const optionEl = document.createElement("option"); optionEl.value = opt.value; optionEl.textContent = opt.label; if (opt.value === opts.value) optionEl.selected = true; selectElement.appendChild(optionEl); });
    if (typeof opts.onValueChanged === 'function') selectElement.addEventListener('change', (event) => opts.onValueChanged(event.target.value));
    row.appendChild(selectElement); return row;
}
export class AdwComboRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'value', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-row', 'adw-combo-row'); this._textContent = document.createElement('div'); this._textContent.classList.add('adw-combo-row-text-content'); this._titleElement = document.createElement('span'); this._titleElement.classList.add('adw-combo-row-title'); this._subtitleElement = document.createElement('span'); this._subtitleElement.classList.add('adw-combo-row-subtitle'); this._selectElement = document.createElement('select'); this._selectElement.classList.add('adw-combo-row-select'); this._textContent.append(this._titleElement, this._subtitleElement); this._wrapper.append(this._textContent, this._selectElement); this.shadowRoot.append(styleLink, this._wrapper); this._selectElement.addEventListener('change', () => { this.value = this._selectElement.value; this.dispatchEvent(new CustomEvent('change', {bubbles: true, composed: true, detail: {value: this.value}})); }); this._options = []; this._optionElementsSlot = document.createElement('slot'); this._optionElementsSlot.name="options"; this._selectElement.appendChild(this._optionElementsSlot); this._optionElementsSlot.addEventListener('slotchange', () => this._handleOptionSlotChange()); }
    connectedCallback() { this._render(); this._handleOptionSlotChange(); /* Initial population from slot */ }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) { if (name === 'value' && this._selectElement && this._selectElement.value !== newValue) {this._selectElement.value = newValue;} this._render(); }}
    _handleOptionSlotChange() { const assignedNodes = this._optionElementsSlot.assignedNodes(); this._options = []; while (this._selectElement.firstChild && this._selectElement.firstChild !== this._optionElementsSlot) this._selectElement.removeChild(this._selectElement.firstChild); /* Clear previous before adding slotted or property based, but keep slot */ assignedNodes.forEach(node => { if(node.tagName === 'OPTION') { this._options.push({label: node.textContent, value: node.value, selected: node.selected}); /* Don't append, let slot project */ }}); if (assignedNodes.length > 0) { if(this.hasAttribute('value')) this._selectElement.value = this.getAttribute('value'); else if (this._selectElement.options.length > 0) this.value = this._selectElement.options[0].value; } else { this._populateOptionsFromProperty(); } }
    _populateOptionsFromProperty() { while (this._selectElement.firstChild && this._selectElement.firstChild !== this._optionElementsSlot) this._selectElement.removeChild(this._selectElement.firstChild); (this._options || []).forEach(opt => { const optionEl = document.createElement('option'); optionEl.value = opt.value; optionEl.textContent = opt.label; this._selectElement.insertBefore(optionEl, this._optionElementsSlot); }); if(this.hasAttribute('value')) this._selectElement.value = this.getAttribute('value'); else if (this._selectElement.options.length > 0) this.value = this._selectElement.options[0].value; }
    _render() {
        this._titleElement.textContent = this.getAttribute('title') || '';
        const subtitle = this.getAttribute('subtitle'); this._subtitleElement.textContent = subtitle || ''; this._subtitleElement.style.display = subtitle ? '' : 'none';
        const isDisabled = this.hasAttribute('disabled'); this._wrapper.classList.toggle('disabled', isDisabled); this._selectElement.disabled = isDisabled;
        const valueAttr = this.getAttribute('value'); if (valueAttr !== null && this._selectElement.value !== valueAttr) this._selectElement.value = valueAttr;
    }
    get value() { return this._selectElement.value; }
    set value(val) { const strVal = String(val); if (val !== null && val !== undefined) this.setAttribute('value', strVal); else this.removeAttribute('value'); if (this._selectElement.value !== strVal) this._selectElement.value = strVal; }
    get selectOptions() { return this._options; }
    set selectOptions(optionsArray) { this._options = Array.isArray(optionsArray) ? optionsArray : []; this._populateOptionsFromProperty(); if (this.getAttribute('value') === null && this._selectElement.options.length > 0) this.value = this._selectElement.options[0].value; }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { const isDisabled = Boolean(value); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); this._render(); }
}

/**
 * Creates an Adwaita-style Spin Row.
 */
export function createAdwSpinRow(options = {}) {
    const opts = options || {}; const rowChildren = [];
    const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-spin-row-text-content");
    const titleLabel = createAdwLabel(opts.title || "", { htmlTag: "span" }); titleLabel.classList.add("adw-spin-row-title"); textContentDiv.appendChild(titleLabel);
    if (opts.subtitle && typeof opts.subtitle === 'string') { const subtitleLabel = createAdwLabel(opts.subtitle, { htmlTag: "span" }); subtitleLabel.classList.add("adw-spin-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
    rowChildren.push(textContentDiv);
    const spinButtonOptions = { ...(opts.spinButtonOptions || {}) }; if (typeof opts.onValueChanged === 'function' && !spinButtonOptions.onValueChanged) spinButtonOptions.onValueChanged = opts.onValueChanged;
    const spinButtonElement = createAdwSpinButton(spinButtonOptions); spinButtonElement.classList.add("adw-spin-row-spin-button"); rowChildren.push(spinButtonElement);
    const spinRow = createAdwRow({ children: rowChildren }); spinRow.classList.add("adw-spin-row"); return spinRow;
}
export class AdwSpinRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'value', 'min', 'max', 'step', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._internalSpinButton = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) { this.shadowRoot.removeChild(this.shadowRoot.lastChild); }
        const row = document.createElement("div"); row.classList.add("adw-row", "adw-spin-row");
        const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-spin-row-text-content");
        const titleText = this.getAttribute('title') || ''; const titleLabel = createAdwLabel(titleText, { htmlTag: "span" }); titleLabel.classList.add("adw-spin-row-title"); textContentDiv.appendChild(titleLabel);
        const subtitleText = this.getAttribute('subtitle'); if (subtitleText) { const subtitleLabel = createAdwLabel(subtitleText, { htmlTag: "span" }); subtitleLabel.classList.add("adw-spin-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
        row.appendChild(textContentDiv);
        this._internalSpinButton = new AdwSpinButton(); this._internalSpinButton.classList.add("adw-spin-row-spin-button");
        if (this.hasAttribute('value')) this._internalSpinButton.value = parseFloat(this.getAttribute('value'));
        if (this.hasAttribute('min')) this._internalSpinButton.setAttribute('min', this.getAttribute('min'));
        if (this.hasAttribute('max')) this._internalSpinButton.setAttribute('max', this.getAttribute('max'));
        if (this.hasAttribute('step')) this._internalSpinButton.setAttribute('step', this.getAttribute('step'));
        if (this.hasAttribute('disabled')) this._internalSpinButton.disabled = true;
        this._internalSpinButton.addEventListener('value-changed', (e) => { const newValue = e.detail.value; if (this.getAttribute('value') !== String(newValue)) this.setAttribute('value', newValue); this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: newValue } })); });
        row.appendChild(this._internalSpinButton); this.shadowRoot.appendChild(row);
    }
    get value() { return this._internalSpinButton ? this._internalSpinButton.value : (this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : 0); }
    set value(val) { const numVal = parseFloat(val); this.setAttribute('value', numVal); if (this._internalSpinButton) this._internalSpinButton.value = numVal; }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) { const isDisabled = Boolean(val); if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); if (this._internalSpinButton) this._internalSpinButton.disabled = isDisabled; }
}

/**
 * Creates an Adwaita-style Button Row.
 */
export function createAdwButtonRow(options = {}) {
    const opts = options || {};
    const buttonElements = (opts.buttons || []).map(btnOrOpts => { if (btnOrOpts instanceof Node) return btnOrOpts; return createAdwButton(btnOrOpts.label || '', btnOrOpts); });
    const row = createAdwRow({}); row.classList.add("adw-button-row");
    const buttonContainer = document.createElement('div'); buttonContainer.classList.add('adw-button-row-container');
    buttonElements.forEach(btnEl => buttonContainer.appendChild(btnEl)); row.appendChild(buttonContainer);
    if (opts.centered) { row.classList.add("centered"); buttonContainer.style.justifyContent = 'center'; } else { buttonContainer.style.justifyContent = 'flex-end'; }
    return row;
}
export class AdwButtonRow extends HTMLElement {
    static get observedAttributes() { return ['centered']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._slotObserver = new MutationObserver(() => this._render());}
    connectedCallback() { this._slotObserver.observe(this, { childList: true, subtree: false }); this._render(); }
    disconnectedCallback() { this._slotObserver.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        // Ensure stylesheet is there
        let styleLink = this.shadowRoot.querySelector('link[rel="stylesheet"]');
        if (!styleLink) {
            styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
            // Prepend to ensure it's first, or append if preferred, but be consistent.
            // Constructor already appends it, so this is more of a safeguard if shadowRoot was cleared externally.
            if (!this.shadowRoot.contains(styleLink)) { // Avoid re-appending if querySelector missed it but it's there
                 this.shadowRoot.prepend(styleLink);
            }
        }

        // Clear everything else but the stylesheet
        Array.from(this.shadowRoot.childNodes).forEach(child => {
            if (child !== styleLink && child.nodeName !== 'STYLE') { // Also preserve <style> if any
                this.shadowRoot.removeChild(child);
            }
        });

        const rowDiv = document.createElement('div');
        const containerDiv = document.createElement('div');
        const slot = document.createElement('slot'); // Default slot for buttons

        rowDiv.classList.add('adw-row', 'adw-button-row');
        containerDiv.classList.add('adw-button-row-container');
        // Intentionally re-set these lines to ensure no hidden characters
        containerDiv.appendChild(slot); // Former error line
        rowDiv.appendChild(containerDiv);
        this.shadowRoot.appendChild(rowDiv); // Append the new content structure

        const isCentered = this.hasAttribute('centered');
        rowDiv.classList.toggle('centered', isCentered);
        containerDiv.style.justifyContent = isCentered ? 'center' : 'flex-end';
    }
}

[end of js/components/rows.js]
