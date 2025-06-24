import { adwGenerateId, getAdwCommonStyleSheet } from './utils.js'; // Import getAdwCommonStyleSheet
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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._onClick = null; console.log('AdwRow constructor', this.id || this.className); }
    connectedCallback() { console.log('AdwRow connected', this.id || this.className); this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { console.log('AdwRow attrChanged', name, this.id || this.className); if (oldValue !== newValue) this._render(); }
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

    const prefix = document.createElement('div');
    prefix.classList.add('adw-action-row-prefix');
    let iconAddedToPrefix = false;

    if (opts.iconName && window.Adw && Adw.createIcon) {
        const iconElement = Adw.createIcon(opts.iconName);
        prefix.appendChild(iconElement);
        iconAddedToPrefix = true;
    } else if (opts.iconHTML) { // Fallback to iconHTML
        const iconSpan = document.createElement('span');
        // iconSpan.classList.add('icon'); // AdwIcon already has adw-icon class
        if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim().startsWith("<svg")) {
            _appendSVGStringToElement(opts.iconHTML, iconSpan);
        } else if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim() !== '') {
            iconSpan.classList.add(...opts.iconHTML.split(' '));
        }
        if (iconSpan.hasChildNodes() || iconSpan.classList.length > 0) { // Check if any class or child was added
             prefix.appendChild(iconSpan);
             iconAddedToPrefix = true;
        }
    }
    if(iconAddedToPrefix) {
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

/**
 * @element adw-action-row
 * @description A row typically used in lists, displaying a title, an optional subtitle,
 * an optional icon prefix, and an optional suffix widget (like a chevron or switch).
 * It can be made activatable to behave like a button.
 *
 * @attr {String} [title] - The main title text of the row.
 * @attr {String} [subtitle] - Subtitle text displayed below the title.
 * @attr {String} [icon-name] - Name of an Adwaita icon for the prefix (e.g., 'go-next-symbolic').
 * @attr {String} [icon] - Deprecated. HTML string for an SVG icon or class name for icon font (prefix). Use `icon-name`.
 * @attr {Boolean} [show-chevron] - If present, a chevron icon is displayed in the suffix area, typically indicating navigation.
 * @attr {Boolean} [activatable] - If present, makes the entire row interactive like a button (clickable, focusable).
 *
 * @slot title-override - Allows replacing the title text with custom HTML content.
 * @slot suffix-widget - Allows projecting a custom widget (e.g., `adw-switch`, `adw-button`) into the suffix area.
 *                       This is displayed after the chevron if `show-chevron` is also present.
 *
 * @csspart row - The main row container element within the Shadow DOM.
 * @csspart prefix - The container for the prefix icon.
 * @csspart content - The container for the title and subtitle.
 * @csspart title - The title text element (an `adw-label` internally).
 * @csspart subtitle - The subtitle text element (an `adw-label` internally).
 * @csspart suffix - The container for suffix elements (chevron, slotted widget).
 *
 * @fires click - Dispatched when the row is clicked, if `activatable` or an `onClick` handler is set.
 *
 * @example
 * <adw-action-row title="Wi-Fi Settings" subtitle="Connected to MyNetwork" icon-name="network-wireless-symbolic" show-chevron activatable></adw-action-row>
 *
 * <adw-action-row title="Enable Feature">
 *   <adw-switch slot="suffix-widget" checked></adw-switch>
 * </adw-action-row>
 */
export class AdwActionRow extends HTMLElement {
    /** @internal */
    static get observedAttributes() { return ['title', 'subtitle', 'icon-name', 'icon', 'show-chevron', 'activatable']; }

    /**
     * Creates an instance of AdwActionRow.
     * @constructor
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Stylesheet will be adopted in connectedCallback
        this._onClick = null;
        // console.log('AdwActionRow constructor', this.title);
    }

    /** @internal */
    _fallbackLoadStylesheet() {
        if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
            if (styleLink.href) {
                this.shadowRoot.appendChild(styleLink);
            } else {
                console.warn("AdwActionRow: Fallback stylesheet Adw.config.cssPath is not defined.");
            }
        }
    }

    /** @internal */
    async connectedCallback() {
        // console.log('AdwActionRow connected', this.title);
        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
            try {
                const commonSheet = await getAdwCommonStyleSheet();
                if (commonSheet && !this.shadowRoot.adoptedStyleSheets.includes(commonSheet)) {
                    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, commonSheet];
                } else if (!commonSheet) {
                    this._fallbackLoadStylesheet();
                }
            } catch (error) {
                this._fallbackLoadStylesheet();
            }
        } else {
            this._fallbackLoadStylesheet();
        }
        this._render();
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        // console.log('AdwActionRow attrChanged', name, this.title);
        if (oldValue !== newValue) this._render();
    }

    /**
     * Sets a JavaScript click event handler for the row.
     * Setting this property will automatically make the row activatable.
     * @param {Function|null} handler - The function to call on click, or null to remove.
     */
    set onClick(handler) { this._onClick = (typeof handler === 'function') ? handler : null; this._render(); }
    /**
     * Gets the JavaScript click event handler for the row.
     * @returns {Function|null}
     */
    get onClick() { return this._onClick; }

    /** @internal */
    _render() {
        const nodesToRemove = [];
        for (const child of this.shadowRoot.childNodes) {
            if (child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')) {
                nodesToRemove.push(child);
            }
        }
        nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));

        const row = document.createElement("div");
        row.classList.add("adw-action-row");
        row.part.add('row'); // Expose main row div
        const titleText = this.getAttribute('title') || '';
        const subtitleText = this.getAttribute('subtitle');
        const iconName = this.getAttribute('icon-name');
        const iconHTML = this.getAttribute('icon'); // Fallback
        const showChevron = this.hasAttribute('show-chevron');
        const isActivatable = this.hasAttribute('activatable') || this._onClick;

        if (isActivatable) {
            row.classList.add("activatable"); row.setAttribute("tabindex", "0"); row.setAttribute("role", "button");
            const clickHandler = this._onClick || ((event) => { this.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true })); });
            row.addEventListener('click', clickHandler);
            row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') clickHandler(e); });
        }

        const prefix = document.createElement('div');
        prefix.classList.add('adw-action-row-prefix');
        prefix.part.add('prefix');
        let iconAddedToPrefix = false;

        if (iconName) {
            const iconElement = document.createElement('adw-icon');
            iconElement.setAttribute('icon-name', iconName);
            prefix.appendChild(iconElement);
            iconAddedToPrefix = true;
            // Simplified: Removed complex fallback for iconHTML when iconName is present.
            // Assume adw-icon will handle its rendering or remain an unknown element until defined.
        } else if (iconHTML) { // Only iconHTML is provided (deprecated path)
            const iconSpan = document.createElement('span');
            if (iconHTML.trim().startsWith("<svg")) {
                _appendSVGStringToElement(iconHTML, iconSpan);
            } else if (iconHTML.trim() !== '') {
                iconSpan.classList.add(...iconHTML.split(' '));
            }
            if (iconSpan.hasChildNodes() || iconSpan.classList.length > 0) {
                prefix.appendChild(iconSpan);
                iconAddedToPrefix = true;
            }
        }
        if (iconAddedToPrefix) {
            row.appendChild(prefix);
        } else {
            // Ensure prefix div isn't added if empty, to prevent taking up space due to gap.
            // Or, ensure CSS handles empty prefix gracefully (e.g. display:none or no padding/margin).
            // For now, let's not append it if empty.
        }

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('adw-action-row-content');
        contentDiv.part.add('content');

        // Title handling
        const titleLabel = document.createElement('span'); // createAdwLabel is a factory, use direct element for WC consistency
        titleLabel.classList.add('adw-action-row-title');
        titleLabel.part.add('title');
        const titleSlot = document.createElement('slot');
        titleSlot.name = 'title-override';
        // If title-override slot is empty, set textContent from title attribute
        titleSlot.addEventListener('slotchange', () => {
            const assignedNodes = titleSlot.assignedNodes({ flatten: true });
            if (assignedNodes.length === 0) {
                titleLabel.textContent = this.getAttribute('title') || '';
            } else {
                titleLabel.textContent = ''; // Clear attribute-based title if slot is used
            }
        });
        titleLabel.appendChild(titleSlot);
        // Initial population for title
        // Check if slot is initially populated (might be tricky before first slotchange)
        // For simplicity, set textContent initially and let slotchange override if needed.
        // A more robust way is to check after connectedCallback + first render cycle.
        if (!this.querySelector('[slot="title-override"]')) {
             titleLabel.textContent = titleText;
        }

        contentDiv.appendChild(titleLabel);

        // Subtitle handling
        if (subtitleText) {
            const subtitleLabel = document.createElement('span'); // createAdwLabel is a factory
            subtitleLabel.classList.add('adw-action-row-subtitle');
            subtitleLabel.part.add('subtitle');
            subtitleLabel.textContent = subtitleText;
            contentDiv.appendChild(subtitleLabel);
            row.classList.add('has-subtitle');
        } else {
            row.classList.remove('has-subtitle');
        }
        row.appendChild(contentDiv);

        // Suffix handling
        const suffixContainer = document.createElement('div');
        suffixContainer.classList.add('adw-action-row-suffix');
        suffixContainer.part.add('suffix');

        let suffixHasContent = false;
        if (showChevron) {
            _appendChevron(suffixContainer);
            suffixHasContent = true;
        }
        const suffixSlot = document.createElement('slot');
        suffixSlot.name = 'suffix-widget';
        suffixContainer.appendChild(suffixSlot);

        // Check if suffix-widget slot has assigned nodes
        // This check needs to happen after the element is in the DOM and slots are assigned.
        // We can do an initial check for querySelector, and rely on slotchange if needed.
        if (this.querySelector('[slot="suffix-widget"]')) {
            suffixHasContent = true;
        }
        // TODO: Add a slotchange listener for suffix-widget to dynamically add/remove suffixContainer
        // if its content changes between empty/non-empty, or simply always append it and let CSS hide if empty.
        // For now, append if it has initial content.

        if (suffixHasContent) {
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
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        this.shadowRoot.appendChild(styleLink);

        this._rowDiv = null;
        this._textContentDiv = null;
        this._titleLabel = null;
        this._subtitleLabel = null;
        this._internalEntry = null;
        console.log('AdwEntryRow constructor', this.title);
    }

    connectedCallback() {
        console.log('AdwEntryRow connected', this.title);
        if (!this._internalEntry) { // Ensures initial render if not already done
            this._render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log('AdwEntryRow attrChanged', name, this.title);
        if (oldValue === newValue) return;

        if (!this._internalEntry) { // If called before connectedCallback or _render has run
            this._render(); // This will create _internalEntry and apply initial attributes
            return; // _render will handle applying the current attribute values
        }

        // If _internalEntry exists, update it or the row's elements directly
        switch (name) {
            case 'value':
                // Ensure the internal AdwEntry's 'value' attribute is updated,
                // which will then trigger AdwEntry's own logic to call setFormValue.
                if (this._internalEntry.getAttribute('value') !== newValue) {
                    if (newValue === null) {
                        this._internalEntry.removeAttribute('value');
                    } else {
                        this._internalEntry.setAttribute('value', newValue);
                    }
                }
                break;
            case 'placeholder':
                this._internalEntry.setAttribute('placeholder', newValue || '');
                break;
            case 'disabled':
                this._internalEntry.disabled = newValue !== null;
                if (this._rowDiv) this._rowDiv.classList.toggle('disabled', newValue !== null);
                break;
            case 'name':
                if (newValue === null) this._internalEntry.removeAttribute('name');
                else this._internalEntry.setAttribute('name', newValue);
                break;
            case 'required':
                if (newValue !== null) this._internalEntry.setAttribute('required', '');
                else this._internalEntry.removeAttribute('required');
                break;
            case 'type':
                this._internalEntry.setAttribute('type', newValue || 'text');
                break;
            case 'title':
                if (this._titleLabel) this._titleLabel.textContent = newValue || '';
                break;
            case 'subtitle':
                if (this._subtitleLabel) {
                    if (newValue) {
                        this._subtitleLabel.textContent = newValue;
                        this._subtitleLabel.style.display = '';
                    } else {
                        this._subtitleLabel.textContent = '';
                        this._subtitleLabel.style.display = 'none';
                    }
                }
                break;
            default:
                // For any other attribute change not handled, a full _render might be needed
                // if it affects structure. For now, assume handled or doesn't require DOM rebuild.
                // this._render(); // Fallback if necessary
                break;
        }
    }

    _render() {
        if (!this._rowDiv) { // Only build DOM structure once
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }

            this._rowDiv = document.createElement("div");
            this._rowDiv.classList.add("adw-row", "adw-entry-row");

            this._textContentDiv = document.createElement("div");
            this._textContentDiv.classList.add("adw-entry-row-text-content");

            // Use createAdwLabel for consistency if it has specific styling/logic not in basic <label>
            this._titleLabel = document.createElement("label"); // Simpler: createAdwLabel(this.getAttribute('title') || '', { htmlTag: "label" });
            this._titleLabel.classList.add("adw-entry-row-title");
            this._textContentDiv.appendChild(this._titleLabel);

            this._subtitleLabel = document.createElement("span"); // Simpler: createAdwLabel(this.getAttribute('subtitle') || '', { htmlTag: "span" });
            this._subtitleLabel.classList.add("adw-entry-row-subtitle");
            this._textContentDiv.appendChild(this._subtitleLabel);

            this._rowDiv.appendChild(this._textContentDiv);

            this._internalEntry = new AdwEntry();
            this._internalEntry.classList.add("adw-entry-row-entry");
            // Apply the row-input variant style
            if (this._internalEntry.shadowRoot && this._internalEntry.shadowRoot.querySelector('.adw-entry')) {
              // If AdwEntry is a web component and its internal input is what needs styling directly
              // This depends on AdwEntry's internal structure.
              // For now, assume AdwEntry itself can take the .row-input class or its styles apply to its host.
            }
            // Add .row-input to the AdwEntry host element itself if its styles are scoped to :host or .adw-entry
            this._internalEntry.classList.add("row-input");


            this._internalEntry.addEventListener('input', (e) => {
                const currentAttrValue = this.getAttribute('value');
                const newEntryValue = this._internalEntry.value;
                if (currentAttrValue !== newEntryValue) {
                    this.setAttribute('value', newEntryValue); // Triggers attributeChangedCallback for 'value'
                }
                this.dispatchEvent(new CustomEvent('input', { detail: { value: newEntryValue, originalEvent: e }, bubbles: true, composed: true }));
            });
            this._internalEntry.addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('change', { detail: { value: this._internalEntry.value, originalEvent: e }, bubbles: true, composed: true }));
            });
            this._rowDiv.appendChild(this._internalEntry);
            this.shadowRoot.appendChild(this._rowDiv);
        }

        // Apply/re-apply all relevant attributes to the created elements
        const entryId = this.id ? `${this.id}-entry` : (this._internalEntry.id || adwGenerateId('adw-entry-row-input'));
        this._internalEntry.id = entryId;
        this._titleLabel.setAttribute('for', entryId);
        this._titleLabel.textContent = this.getAttribute('title') || '';

        const subtitleText = this.getAttribute('subtitle');
        if (subtitleText) {
            this._subtitleLabel.textContent = subtitleText;
            this._subtitleLabel.style.display = '';
        } else {
            this._subtitleLabel.textContent = '';
            this._subtitleLabel.style.display = 'none';
        }

        const currentValue = this.getAttribute('value');
        if (this._internalEntry.value !== currentValue) {
             this._internalEntry.value = currentValue === null ? '' : currentValue;
        }
        const placeholderValue = this.getAttribute('placeholder');
        if (this._internalEntry.getAttribute('placeholder') !== placeholderValue) {
            if (placeholderValue === null) this._internalEntry.removeAttribute('placeholder');
            else this._internalEntry.setAttribute('placeholder', placeholderValue);
        }

        this._internalEntry.disabled = this.hasAttribute('disabled');
        this._rowDiv.classList.toggle('disabled', this.hasAttribute('disabled'));

        const nameValue = this.getAttribute('name');
        if (this._internalEntry.getAttribute('name') !== nameValue) {
            if (nameValue === null) this._internalEntry.removeAttribute('name');
            else this._internalEntry.setAttribute('name', nameValue);
        }

        const requiredValue = this.hasAttribute('required');
        if (this._internalEntry.hasAttribute('required') !== requiredValue) {
            if (requiredValue) this._internalEntry.setAttribute('required', '');
            else this._internalEntry.removeAttribute('required');
        }

        const typeValue = this.getAttribute('type') || 'text';
        if (this._internalEntry.getAttribute('type') !== typeValue) {
            this._internalEntry.setAttribute('type', typeValue);
        }
    }

    get value() {
        // Prefer the attribute as source of truth if _internalEntry not ready, but usually _internalEntry is more current.
        return this._internalEntry ? this._internalEntry.value : (this.getAttribute('value') || '');
    }
    set value(val) {
        const strVal = (val === null || val === undefined) ? '' : String(val);
        // Setting attribute will trigger attributeChangedCallback which updates _internalEntry.value
        if (this.getAttribute('value') !== strVal) {
            this.setAttribute('value', strVal);
        } else if (this._internalEntry && this._internalEntry.value !== strVal) {
            // If attribute is already same, but internal field differs (e.g. programmatic value set)
            this._internalEntry.value = strVal;
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
        // attributeChangedCallback will update _internalEntry.disabled and row class
    }
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
            ariaLabel: 'Show password', // Added aria-label
            onClick: () => {
                const isPassword = entry.type === 'password'; entry.type = isPassword ? 'text' : 'password';
                // Also update aria-label when icon changes
                visibilityToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
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
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        this.shadowRoot.appendChild(styleLink);

        this._rowDiv = null;
        this._textContentDiv = null;
        this._titleLabel = null;
        this._subtitleLabel = null;
        this._inputArea = null;
        this._internalEntry = null;
        this._visibilityToggle = null;
    }

    connectedCallback() {
        if (!this._internalEntry) {
            this._render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (!this._internalEntry) {
            this._render();
            return;
        }

        switch (name) {
            case 'value':
                if (this._internalEntry.value !== newValue) {
                    this._internalEntry.value = newValue === null ? '' : newValue;
                }
                break;
            case 'placeholder':
                this._internalEntry.setAttribute('placeholder', newValue || '');
                break;
            case 'disabled':
                const isDisabled = newValue !== null;
                this._internalEntry.disabled = isDisabled;
                if (this._visibilityToggle) this._visibilityToggle.disabled = isDisabled;
                if (this._rowDiv) this._rowDiv.classList.toggle('disabled', isDisabled);
                break;
            case 'name':
                if (newValue === null) this._internalEntry.removeAttribute('name');
                else this._internalEntry.setAttribute('name', newValue);
                break;
            case 'required':
                if (newValue !== null) this._internalEntry.setAttribute('required', '');
                else this._internalEntry.removeAttribute('required');
                break;
            case 'title':
                if (this._titleLabel) this._titleLabel.textContent = newValue || '';
                break;
            case 'subtitle':
                if (this._subtitleLabel) {
                    if (newValue) {
                        this._subtitleLabel.textContent = newValue;
                        this._subtitleLabel.style.display = '';
                    } else {
                        this._subtitleLabel.textContent = '';
                        this._subtitleLabel.style.display = 'none';
                    }
                }
                break;
            default:
                // this._render(); // Fallback if necessary
                break;
        }
    }

    _render() {
        if (!this._rowDiv) { // Only build DOM structure once
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }

            this._rowDiv = document.createElement("div");
            this._rowDiv.classList.add("adw-row", "adw-password-entry-row");

            this._textContentDiv = document.createElement("div");
            this._textContentDiv.classList.add("adw-entry-row-text-content");

            this._titleLabel = document.createElement("label");
            this._titleLabel.classList.add("adw-entry-row-title");
            this._textContentDiv.appendChild(this._titleLabel);

            this._subtitleLabel = document.createElement("span");
            this._subtitleLabel.classList.add("adw-entry-row-subtitle");
            this._textContentDiv.appendChild(this._subtitleLabel);

            this._rowDiv.appendChild(this._textContentDiv);

            this._inputArea = document.createElement('div');
            this._inputArea.classList.add('adw-password-entry-input-area');

            this._internalEntry = new AdwEntry();
            this._internalEntry.setAttribute('type', 'password'); // Default type
            this._internalEntry.classList.add("adw-entry-row-entry");
            this._internalEntry.classList.add("row-input"); // Apply the row-input variant style

            this._internalEntry.addEventListener('input', (e) => {
                const currentAttrValue = this.getAttribute('value');
                const newEntryValue = this._internalEntry.value;
                if (currentAttrValue !== newEntryValue) {
                    this.setAttribute('value', newEntryValue);
                }
                this.dispatchEvent(new CustomEvent('input', { detail: { value: newEntryValue, originalEvent: e }, bubbles: true, composed: true }));
            });
            this._internalEntry.addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('change', { detail: { value: this._internalEntry.value, originalEvent: e }, bubbles: true, composed: true }));
            });
            this._inputArea.appendChild(this._internalEntry);

            const initialAriaLabel = "Show password"; // Initial state is password hidden
            this._visibilityToggle = createAdwButton('', {
                icon: EYE_ICON_SVG,
                flat: true,
                isCircular: true,
                ariaLabel: initialAriaLabel // Add initial aria-label
            });
            this._visibilityToggle.classList.add('adw-password-entry-row-toggle');
            this._visibilityToggle.addEventListener('click', () => {
                const isPassword = this._internalEntry.type === 'password';
                this._internalEntry.type = isPassword ? 'text' : 'password';

                // Update ARIA label
                this._visibilityToggle.setAttribute('aria-label', isPassword ? "Hide password" : "Show password");

                const iconSpan = this._visibilityToggle.querySelector('.icon'); // AdwButton creates a span.icon
                if (iconSpan) {
                    iconSpan.innerHTML = ''; // Clear existing SVG
                    _appendSVGStringToElement(isPassword ? EYE_SLASHED_ICON_SVG : EYE_ICON_SVG, iconSpan);
                }
            });
            this._inputArea.appendChild(this._visibilityToggle);
            this._rowDiv.appendChild(this._inputArea);
            this.shadowRoot.appendChild(this._rowDiv);
        }

        // Apply/re-apply all relevant attributes
        const entryId = this.id ? `${this.id}-entry` : (this._internalEntry.id || adwGenerateId('adw-password-entry-input'));
        this._internalEntry.id = entryId;
        this._titleLabel.setAttribute('for', entryId);
        this._titleLabel.textContent = this.getAttribute('title') || '';

        const subtitleText = this.getAttribute('subtitle');
        if (subtitleText) {
            this._subtitleLabel.textContent = subtitleText;
            this._subtitleLabel.style.display = '';
        } else {
            this._subtitleLabel.textContent = '';
            this._subtitleLabel.style.display = 'none';
        }

        const currentValue = this.getAttribute('value');
        if (this._internalEntry.value !== currentValue) {
            this._internalEntry.value = currentValue === null ? '' : currentValue;
        }

        const placeholderValue = this.getAttribute('placeholder');
        if (this._internalEntry.getAttribute('placeholder') !== placeholderValue) {
            if (placeholderValue === null) this._internalEntry.removeAttribute('placeholder');
            else this._internalEntry.setAttribute('placeholder', placeholderValue);
        }

        const isDisabled = this.hasAttribute('disabled');
        this._internalEntry.disabled = isDisabled;
        this._visibilityToggle.disabled = isDisabled;
        this._rowDiv.classList.toggle('disabled', isDisabled);

        const nameValue = this.getAttribute('name');
        if (this._internalEntry.getAttribute('name') !== nameValue) {
             if (nameValue === null) this._internalEntry.removeAttribute('name');
            else this._internalEntry.setAttribute('name', nameValue);
        }

        const requiredValue = this.hasAttribute('required');
        if (this._internalEntry.hasAttribute('required') !== requiredValue) {
            if (requiredValue) this._internalEntry.setAttribute('required', '');
            else this._internalEntry.removeAttribute('required');
        }
        // Type is fixed to 'password' or 'text' by the toggle, not by attribute for AdwPasswordEntryRow
    }

    get value() { return this._internalEntry ? this._internalEntry.value : (this.getAttribute('value') || ''); }
    set value(val) {
        const strVal = (val === null || val === undefined) ? '' : String(val);
        if (this.getAttribute('value') !== strVal) {
            this.setAttribute('value', strVal);
        } else if (this._internalEntry && this._internalEntry.value !== strVal) {
            this._internalEntry.value = strVal;
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        const isDisabled = Boolean(val);
        if (isDisabled) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
    }
}

/**
 * Creates an Adwaita-style ExpanderRow.
 */
export function createAdwExpanderRow(options = {}) {
    const opts = options || {};
    const expanderRow = document.createElement("div");
    expanderRow.classList.add("adw-expander-row");
    if(opts.expanded) expanderRow.classList.add("expanded");
    expanderRow.setAttribute('aria-expanded', opts.expanded ? 'true' : 'false');

    const contentAreaId = adwGenerateId('expander-content');

    let chevronIcon;
    if (window.Adw && Adw.createIcon) {
        chevronIcon = Adw.createIcon('ui/pan-down-symbolic', { cssClass: 'adw-expander-row-chevron' });
    } else {
        chevronIcon = document.createElement('span'); // Fallback
        chevronIcon.classList.add('adw-expander-row-chevron');
        chevronIcon.textContent = '>'; // Simple fallback
    }

    const actionRowOptions = {
        title: opts.title,
        subtitle: opts.subtitle,
        // The AdwActionRow itself will handle click if activatable.
        // We make the entire header clickable.
    };
    const headerActionRow = createAdwActionRow(actionRowOptions);
    headerActionRow.classList.add('adw-expander-row-header');
    headerActionRow.setAttribute('role', 'button'); // Make the header itself a button
    headerActionRow.setAttribute('tabindex', '0');
    headerActionRow.setAttribute('aria-controls', contentAreaId);

    if(opts.expanded) headerActionRow.classList.add("expanded");

    // Add chevron to the suffix slot of the action row
    const suffixSlotElement = document.createElement('div');
    suffixSlotElement.setAttribute('slot','suffix-widget');
    suffixSlotElement.appendChild(chevronIcon);
    headerActionRow.appendChild(suffixSlotElement);

    const contentArea = document.createElement("div");
    contentArea.classList.add("adw-expander-row-content-area");
    contentArea.id = contentAreaId;
    if (opts.content instanceof Node) {
        contentArea.appendChild(opts.content);
    }
    contentArea.style.display = opts.expanded ? "block" : "none";

    expanderRow.appendChild(headerActionRow);
    expanderRow.appendChild(contentArea);

    // Click listener for the header to toggle expansion
    const toggleFunction = () => {
        const isCurrentlyExpanded = expanderRow.classList.toggle("expanded");
        headerActionRow.classList.toggle("expanded", isCurrentlyExpanded); // Sync header class
        chevronIcon.classList.toggle("expanded", isCurrentlyExpanded); // For CSS rotation based on icon's class
        expanderRow.setAttribute('aria-expanded', isCurrentlyExpanded ? 'true' : 'false');
        contentArea.style.display = isCurrentlyExpanded ? "block" : "none";
        if (typeof opts.onToggled === "function") {
            opts.onToggled(isCurrentlyExpanded);
        }
    };

    headerActionRow.addEventListener("click", toggleFunction);
    headerActionRow.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFunction();
        }
    });

    return expanderRow;
}
export class AdwExpanderRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'expanded']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        this.shadowRoot.appendChild(styleLink);
        this._headerActionRow = null;
        this._contentArea = null;
        this._chevronIcon = null;
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'expanded') {
            this.expanded = this.hasAttribute('expanded'); // Calls setter
        } else {
            this._render(); // Re-render for title/subtitle changes
        }
    }
    _render() {
        // Clear previous content except for the style link
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const expanderRowWrapper = document.createElement("div");
        expanderRowWrapper.classList.add("adw-expander-row");

        this._headerActionRow = new AdwActionRow(); // Use the AdwActionRow web component
        this._headerActionRow.classList.add('adw-expander-row-header');
        this._headerActionRow.setAttribute('title', this.getAttribute('title') || '');
        if (this.hasAttribute('subtitle')) {
            this._headerActionRow.setAttribute('subtitle', this.getAttribute('subtitle'));
        }
        // Make the header itself activatable for click events
        this._headerActionRow.setAttribute('activatable', '');
        this._headerActionRow.setAttribute('role', 'button'); // Explicit role

        // Always try to create the custom element first.
        // If Adw.Icon (the class) is available and 'adw-icon' is defined, this will work.
        // If 'adw-icon' is not yet defined, it will create an HTMLUnknownElement,
        // which will upgrade when 'adw-icon' is defined.
        this._chevronIcon = document.createElement('adw-icon');
        this._chevronIcon.setAttribute('icon-name', 'ui/pan-down-symbolic');
        this._chevronIcon.classList.add('adw-expander-row-chevron');

        // Fallback if customElements are not supported or if Adw.Icon class itself isn't even on Adw object
        // This check is more for older environments or incomplete Adw setup.
        if (!(window.Adw && Adw.Icon) && !(this._chevronIcon instanceof HTMLElement && this._chevronIcon.constructor !== HTMLElement)) {
             // If not a proper custom element instance (e.g. HTMLUnknownElement because not defined yet, or Adw.Icon missing)
             // and we want an immediate visual fallback rather than waiting for upgrade:
            console.warn('AdwExpanderRow: adw-icon custom element not fully available or Adw.Icon not defined. Using fallback span for chevron.');
            this._chevronIcon = document.createElement('span');
            this._chevronIcon.classList.add('adw-expander-row-chevron');
            this._chevronIcon.textContent = '>'; // Basic fallback
        }
        this._chevronIcon.setAttribute('slot', 'suffix-widget');
        this._headerActionRow.appendChild(this._chevronIcon);

        this._headerActionRow.addEventListener('click', () => this.toggle());

        const contentId = this.id ? `${this.id}-content` : adwGenerateId('adw-expander-content');
        this._headerActionRow.setAttribute('aria-controls', contentId);

        this._contentArea = document.createElement("div");
        this._contentArea.classList.add("adw-expander-row-content-area");
        this._contentArea.id = contentId;
        const contentSlot = document.createElement('slot');
        // Default slot for content, no name needed unless multiple slots for content
        this._contentArea.appendChild(contentSlot);

        expanderRowWrapper.appendChild(this._headerActionRow);
        expanderRowWrapper.appendChild(this._contentArea);
        this.shadowRoot.appendChild(expanderRowWrapper);

        // Set initial expanded state based on attribute
        this.expanded = this.hasAttribute('expanded');
    }
    get expanded() { return this.hasAttribute('expanded'); }
    set expanded(isExpanded) {
        const shouldExpand = Boolean(isExpanded);
        const currentlyExpanded = this.hasAttribute('expanded');

        if (currentlyExpanded === shouldExpand) return;

        if (shouldExpand) {
            this.setAttribute('expanded', '');
        } else {
            this.removeAttribute('expanded');
        }

        const mainWrapper = this.shadowRoot.querySelector('.adw-expander-row');
        if (mainWrapper) mainWrapper.classList.toggle("expanded", shouldExpand);

        if (this._headerActionRow) {
            this._headerActionRow.classList.toggle("expanded", shouldExpand);
            this._headerActionRow.setAttribute('aria-expanded', shouldExpand.toString());
        }
        if (this._chevronIcon) { // Also toggle class on chevron for direct styling if needed
            this._chevronIcon.classList.toggle("expanded", shouldExpand);
        }
        if (this._contentArea) {
            this._contentArea.style.display = shouldExpand ? "block" : "none";
            // Optionally manage aria-hidden for content as well
            // this._contentArea.setAttribute('aria-hidden', String(!shouldExpand));
        }

        this.dispatchEvent(new CustomEvent('toggled', { detail: { expanded: shouldExpand }, bubbles: true, composed: true }));
    }
    toggle() { this.expanded = !this.expanded; } // This will call the setter
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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-row', 'adw-combo-row'); this._textContent = document.createElement('div'); this._textContent.classList.add('adw-combo-row-text-content'); this._titleElement = document.createElement('span'); this._titleElement.classList.add('adw-combo-row-title'); this._subtitleElement = document.createElement('span'); this._subtitleElement.classList.add('adw-combo-row-subtitle'); this._selectElement = document.createElement('select'); this._selectElement.classList.add('adw-combo-row-select'); this._textContent.append(this._titleElement, this._subtitleElement); this._wrapper.append(this._textContent, this._selectElement); this.shadowRoot.append(styleLink, this._wrapper); this._selectElement.addEventListener('change', () => { this.value = this._selectElement.value; this.dispatchEvent(new CustomEvent('change', {bubbles: true, composed: true, detail: {value: this.value}})); }); this._options = []; this._optionElementsSlot = document.createElement('slot'); this._optionElementsSlot.name="options"; this._selectElement.appendChild(this._optionElementsSlot); this._optionElementsSlot.addEventListener('slotchange', () => this._handleOptionSlotChange()); }
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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._internalSpinButton = null; }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) { this.shadowRoot.removeChild(this.shadowRoot.lastChild); }
        const row = document.createElement("div"); row.classList.add("adw-row", "adw-spin-row");
        const textContentDiv = document.createElement("div"); textContentDiv.classList.add("adw-spin-row-text-content");
        const titleText = this.getAttribute('title') || ''; const titleLabel = createAdwLabel(titleText, { htmlTag: "span" }); titleLabel.classList.add("adw-spin-row-title"); textContentDiv.appendChild(titleLabel);
        const subtitleText = this.getAttribute('subtitle'); if (subtitleText) { const subtitleLabel = createAdwLabel(subtitleText, { htmlTag: "span" }); subtitleLabel.classList.add("adw-spin-row-subtitle"); textContentDiv.appendChild(subtitleLabel); }
        row.appendChild(textContentDiv);
        this._internalSpinButton = new AdwSpinButton();
        this._internalSpinButton.classList.add("adw-spin-row-spin-button", "row-input"); // Add .row-input
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
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._slotObserver = new MutationObserver(() => this._render());}
    connectedCallback() { this._slotObserver.observe(this, { childList: true, subtree: false }); this._render(); }
    disconnectedCallback() { this._slotObserver.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        // Ensure stylesheet is there
        let styleLink = this.shadowRoot.querySelector('link[rel="stylesheet"]');
        if (!styleLink) {
            styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
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
