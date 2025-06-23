import { adwGenerateId } from './utils.js';
import { createAdwButton } from './button.js'; // For StatusPage actions, Banner close

/**
 * Creates an Adwaita-style label.
 */
export function createAdwLabel(text, options = {}) {
  const opts = options || {};
  const tag = opts.htmlTag || "label";
  const label = document.createElement(tag);
  label.classList.add("adw-label");
  label.textContent = text;

  if (tag === "label" && opts.for) {
    label.setAttribute("for", opts.for);
  } else if (tag !== "label" && opts.for) {
     console.warn("AdwLabel: 'for' attribute is only applicable to <label> elements.");
  }

  if (opts.title && opts.title >= 1 && opts.title <= 4) {
    label.classList.add(`title-${opts.title}`);
  }
  if (opts.isBody) {
    label.classList.add("body");
  }
  if (opts.isCaption) {
    label.classList.add("caption");
  }
  if (opts.isLink) {
    label.classList.add("link");
    if (tag === "label" || tag === "span" || tag === "p") { // Make non-interactive elements focusable if they act as links
        label.setAttribute("tabindex", "0");
        label.setAttribute("role", "link");
        if (typeof opts.onClick === 'function') {
            label.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    opts.onClick(e);
                    e.preventDefault(); // Prevent default space scroll
                }
            });
        }
    }
    if (typeof opts.onClick === 'function') {
        label.addEventListener("click", opts.onClick);
    }
  }
  if (opts.isDisabled) {
    label.classList.add("disabled");
    label.setAttribute("aria-disabled", "true");
  }
  return label;
}

export class AdwLabel extends HTMLElement {
    static get observedAttributes() { return ['for', 'title-level', 'body', 'caption', 'link', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        // Clear previous label element if it exists, keep the stylesheet
        const existingLabel = this.shadowRoot.querySelector('.adw-label');
        if (existingLabel) {
            existingLabel.remove();
        }

        const options = {};
        if (this.hasAttribute('for')) options.for = this.getAttribute('for');
        if (this.hasAttribute('title-level')) options.title = parseInt(this.getAttribute('title-level'), 10);
        if (this.hasAttribute('body')) options.isBody = this.getAttribute('body') !== null && this.getAttribute('body') !== 'false';
        if (this.hasAttribute('caption')) options.isCaption = this.getAttribute('caption') !== null && this.getAttribute('caption') !== 'false';
        if (this.hasAttribute('link')) options.isLink = this.getAttribute('link') !== null && this.getAttribute('link') !== 'false';
        if (this.hasAttribute('disabled')) options.isDisabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';

        // Use textContent from the light DOM as the label's text
        const text = this.textContent.trim();

        const factory = (typeof Adw !== 'undefined' && Adw.createLabel) ? Adw.createLabel : createAdwLabel;
        const labelElement = factory(text, options);
        this.shadowRoot.appendChild(labelElement);
    }
}

/**
 * Creates an Adwaita-style avatar.
 */
export function createAdwAvatar(options = {}) {
    const opts = options || {};
    const avatar = document.createElement('span');
    avatar.classList.add('adw-avatar');
    if(opts.size) avatar.style.width = avatar.style.height = `${opts.size}px`;
    if(opts.text && !opts.imageSrc) { // Show text only if no image
        avatar.textContent = opts.text.substring(0,2).toUpperCase(); // Show 1 or 2 letters
    }
    if(opts.imageSrc) {
        avatar.style.backgroundImage = `url('${opts.imageSrc}')`;
        avatar.classList.add('image'); // Add class for image styling (e.g. background-size)
    }
    if(opts.alt) avatar.setAttribute('aria-label', opts.alt);
    else if(opts.text) avatar.setAttribute('aria-label', opts.text);
    avatar.setAttribute('role', 'img');
    return avatar;
}
export class AdwAvatar extends HTMLElement {
    static get observedAttributes() { return ['size', 'image-src', 'text', 'alt']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        const existingAvatar = this.shadowRoot.querySelector('.adw-avatar');
        if (existingAvatar) existingAvatar.remove();

        const options = {};
        if (this.hasAttribute('size')) options.size = parseInt(this.getAttribute('size'), 10);
        if (this.hasAttribute('image-src')) options.imageSrc = this.getAttribute('image-src');
        if (this.hasAttribute('text')) options.text = this.getAttribute('text');
        if (this.hasAttribute('alt')) options.alt = this.getAttribute('alt');
        else options.alt = this.getAttribute('text') || 'Avatar'; // Default alt

        const factory = (typeof Adw !== 'undefined' && Adw.createAvatar) ? Adw.createAvatar : createAdwAvatar;
        this.shadowRoot.appendChild(factory(options));
    }
}


/**
 * Creates an Adwaita-style spinner.
 */
export function createAdwSpinner(options = {}) {
    const opts = options || {};
    const spinner = document.createElement('div');
    spinner.classList.add('adw-spinner');
    if(opts.size) spinner.style.width = spinner.style.height = opts.size;

    const isActive = opts.active !== false;
    if(!isActive) spinner.classList.add('hidden');

    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-live', 'polite');
    spinner.setAttribute('aria-busy', String(isActive));
    return spinner;
}
export class AdwSpinner extends HTMLElement {
    static get observedAttributes() { return ['size', 'active']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._spinnerElement = null; }
    connectedCallback() {
        // Default to active if not specified
        if (!this.hasAttribute('active')) {
            this.setAttribute('active', 'true'); // This will trigger attributeChangedCallback -> _render
        } else {
            this._render(); // If active is already set, render normally
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (!this._spinnerElement) { // If called before _render (e.g. initial attributes)
                this._render();
            } else if (name === 'active') {
                this._updateActivityState();
            } else { // 'size' changed
                this._render(); // Re-render for size change
            }
        }
    }
    _render() {
        if (!this._spinnerElement) {
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
                 this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            this._spinnerElement = document.createElement('div');
            this._spinnerElement.classList.add('adw-spinner');
            this._spinnerElement.setAttribute('role', 'status');
            this._spinnerElement.setAttribute('aria-live', 'polite');
            this.shadowRoot.appendChild(this._spinnerElement);
        }

        if (this.hasAttribute('size')) {
            const size = this.getAttribute('size');
            this._spinnerElement.style.width = size;
            this._spinnerElement.style.height = size;
        } else {
            this._spinnerElement.style.width = '';
            this._spinnerElement.style.height = '';
        }
        this._updateActivityState();
    }
    _updateActivityState() {
        if (this._spinnerElement) {
            const isActive = this.hasAttribute('active') && this.getAttribute('active') !== 'false';
            this._spinnerElement.classList.toggle('hidden', !isActive);
            this._spinnerElement.setAttribute('aria-busy', String(isActive));
        }
    }
}

/**
 * Creates an Adwaita-style StatusPage.
 */
export function createAdwStatusPage(options = {}) {
    const opts = options || {};
    const page = document.createElement('div'); page.classList.add('adw-status-page');
    if(opts.iconHTML) {
        const icon = document.createElement('div');
        icon.classList.add('adw-status-page-icon');
        if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim().startsWith("<svg")) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(opts.iconHTML, "image/svg+xml");
            const svgElement = doc.querySelector("svg");
            if (svgElement) {
                Array.from(svgElement.querySelectorAll('script')).forEach(script => script.remove());
                icon.appendChild(svgElement);
            } else {
                console.warn("AdwStatusPage: Invalid SVG string provided for iconHTML.", opts.iconHTML);
            }
        } else if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim() !== '') {
            icon.classList.add(...opts.iconHTML.split(' '));
        }
        page.appendChild(icon);
    }
    if(opts.title) { const title = document.createElement('h1'); title.classList.add('adw-status-page-title'); title.textContent = opts.title; page.appendChild(title); }
    if(opts.description) { const desc = document.createElement('p'); desc.classList.add('adw-status-page-description'); desc.textContent = opts.description; page.appendChild(desc); }
    if(opts.actions && Array.isArray(opts.actions) && opts.actions.length > 0) { const actionsDiv = document.createElement('div'); actionsDiv.classList.add('adw-status-page-actions'); opts.actions.forEach(action => { if(action instanceof Node) actionsDiv.appendChild(action); }); page.appendChild(actionsDiv); }
    return page;
}
export class AdwStatusPage extends HTMLElement {
    static get observedAttributes() { return ['title', 'description', 'icon']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        const existingPage = this.shadowRoot.querySelector('.adw-status-page');
        if(existingPage) existingPage.remove();

        const actionsSlot = this.querySelector('[slot="actions"]');
        const actions = actionsSlot ? Array.from(actionsSlot.children).map(child => child.cloneNode(true)) : [];

        const options = { actions: actions };
        if (this.hasAttribute('title')) options.title = this.getAttribute('title');
        if (this.hasAttribute('description')) options.description = this.getAttribute('description');
        if (this.hasAttribute('icon')) options.iconHTML = this.getAttribute('icon');

        const factory = (typeof Adw !== 'undefined' && Adw.createStatusPage) ? Adw.createStatusPage : createAdwStatusPage;
        this.shadowRoot.appendChild(factory(options));
    }
}

/**
 * Creates an Adwaita-style ProgressBar.
 */
export function createAdwProgressBar(options = {}) {
    const opts = options || {};
    const bar = document.createElement('div'); bar.classList.add('adw-progress-bar');
    if(opts.isIndeterminate) bar.classList.add('indeterminate');
    if(opts.disabled) bar.classList.add('disabled'); // Added disabled state
    const fill = document.createElement('div'); fill.classList.add('adw-progress-bar-fill');
    if(!opts.isIndeterminate && typeof opts.value === 'number') fill.style.width = `${Math.max(0, Math.min(100, opts.value))}%`;
    bar.appendChild(fill);
    bar.setAttribute('role', 'progressbar');
    if (typeof opts.value === 'number' && !opts.isIndeterminate) {
        bar.setAttribute('aria-valuenow', opts.value);
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
    }
    return bar;
}
export class AdwProgressBar extends HTMLElement {
    static get observedAttributes() { return ['value', 'indeterminate', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        const existingBar = this.shadowRoot.querySelector('.adw-progress-bar');
        if(existingBar) existingBar.remove();

        const options = {};
        if (this.hasAttribute('value')) options.value = parseFloat(this.getAttribute('value'));
        options.isIndeterminate = this.hasAttribute('indeterminate') && this.getAttribute('indeterminate') !== 'false';
        options.disabled = this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';

        const factory = (typeof Adw !== 'undefined' && Adw.createProgressBar) ? Adw.createProgressBar : createAdwProgressBar;
        this.shadowRoot.appendChild(factory(options));
    }
}

const ADW_TOAST_PRIORITY_NORMAL = 0;
const ADW_TOAST_PRIORITY_HIGH = 1;

/**
 * Creates an Adwaita-style toast element.
 * This function creates the DOM structure for a toast but does not manage its display lifecycle (timeouts, dismissal).
 * That responsibility lies with a toast manager or overlay.
 */
export function createAdwToast(title, options = {}) {
    const opts = options || {};
    const toastElement = document.createElement("div");
    toastElement.classList.add("adw-toast");
    toastElement.setAttribute("role", "status");
    toastElement.setAttribute("aria-live", opts.priority === ADW_TOAST_PRIORITY_HIGH ? "assertive" : "polite");
    toastElement.setAttribute("aria-atomic", "true");

    // Store data on the element for the overlay to use
    toastElement._adwToastData = {
        timeout: typeof opts.timeout === 'number' ? opts.timeout : (opts.buttonLabel ? 0 : 4), // seconds, 0 for indefinite (e.g., if button)
        priority: opts.priority || ADW_TOAST_PRIORITY_NORMAL,
        actionName: opts.actionName,
        actionTarget: opts.actionTarget,
        buttonLabel: opts.buttonLabel,
        title: title, // Keep original title for potential updates
        dismissTimerId: null // Will be managed by ToastOverlay
    };

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('adw-toast-content-wrapper');

    if (opts.customTitle instanceof Node) {
        contentWrapper.appendChild(opts.customTitle);
    } else {
        const titleSpan = document.createElement('span');
        titleSpan.classList.add('adw-toast-title');
        if (opts.useMarkup) {
            titleSpan.innerHTML = title; // Assumes sanitized
        } else {
            titleSpan.textContent = title;
        }
        contentWrapper.appendChild(titleSpan);
    }
    toastElement.appendChild(contentWrapper);

    if (opts.buttonLabel) {
        const actionButton = createAdwButton(opts.buttonLabel, {
            flat: true, // Toasts often use flat buttons
            onClick: (event) => {
                toastElement.dispatchEvent(new CustomEvent('button-clicked', {
                    bubbles: true,
                    composed: true,
                    detail: { actionName: opts.actionName, actionTarget: opts.actionTarget, originalEvent: event }
                }));
            }
        });
        actionButton.classList.add('adw-toast-action-button');
        toastElement.appendChild(actionButton);
    }

    // Always add a close button per Libadwaita spec for AdwToast
    const closeButton = createAdwButton('', {
        icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>',
        flat: true,
        isCircular: true,
        ariaLabel: 'Dismiss toast', // TODO: Localize this
        onClick: () => {
            // This event signals intent; the overlay will handle actual removal and 'dismissed' event.
            toastElement.dispatchEvent(new CustomEvent('dismiss-requested', { bubbles: true, composed: true }));
        }
    });
    closeButton.classList.add('adw-toast-close-button');
    toastElement.appendChild(closeButton);

    toastElement.updateTitle = (newTitle, useMarkup = false) => {
        toastElement._adwToastData.title = newTitle;
        const titleHolder = toastElement.querySelector('.adw-toast-title');
        if (titleHolder) {
            if (useMarkup) titleHolder.innerHTML = newTitle;
            else titleHolder.textContent = newTitle;
        } else if (opts.customTitle && opts.customTitle.textContent !== undefined) {
            opts.customTitle.textContent = newTitle;
        }
    };

    return toastElement;
}

export class AdwToast extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'use-markup', 'button-label', 'action-name', 'action-target', 'timeout', 'priority', 'custom-title-selector'];
    }

    constructor() {
        super();
        // This component itself does not render a shadow DOM. It's a data provider.
    }

    getToastOptions() {
        const options = {};
        options.title = this.getAttribute('title') || this.textContent.trim() || '';
        if (this.hasAttribute('use-markup')) options.useMarkup = true;
        if (this.hasAttribute('button-label')) options.buttonLabel = this.getAttribute('button-label');
        if (this.hasAttribute('action-name')) options.actionName = this.getAttribute('action-name');
        if (this.hasAttribute('action-target')) {
            try { options.actionTarget = JSON.parse(this.getAttribute('action-target')); }
            catch (e) { options.actionTarget = this.getAttribute('action-target'); }
        }
        if (this.hasAttribute('timeout')) {
            const timeoutVal = parseInt(this.getAttribute('timeout'), 10);
            if (!isNaN(timeoutVal)) options.timeout = timeoutVal;
        }
        if (this.hasAttribute('priority')) {
            options.priority = this.getAttribute('priority').toLowerCase() === 'high' ? ADW_TOAST_PRIORITY_HIGH : ADW_TOAST_PRIORITY_NORMAL;
        }

        const customTitleSelector = this.getAttribute('custom-title-selector');
        if (customTitleSelector) {
            const customTitleElement = document.querySelector(customTitleSelector);
            if (customTitleElement) options.customTitle = customTitleElement.cloneNode(true);
        } else {
            const slot = this.querySelector('[slot="custom-title"]');
            if (slot) { // Check if there's any element in the slot
                const firstSlottedElement = Array.from(slot.children).find(child => child.nodeType === Node.ELEMENT_NODE);
                if (firstSlottedElement) options.customTitle = firstSlottedElement.cloneNode(true);
            }
        }
        return options;
    }
}

/**
 * Creates an Adwaita-style Banner.
 * A bar with contextual information. Banners are hidden by default.
 */
export function createAdwBanner(title, options = {}) {
    const opts = options || {};
    const banner = document.createElement('div');
    banner.classList.add('adw-banner');
    banner.setAttribute('role', 'status'); // Or 'alert' if it's for important dynamic changes
    if (opts.id) banner.id = opts.id;

    const contentWrapper = document.createElement('div'); // Wrapper for title and button
    contentWrapper.classList.add('adw-banner-content-wrapper');

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('adw-banner-title');
    if (opts.useMarkup) {
        titleSpan.innerHTML = title; // Assumes sanitized HTML if markup is used
    } else {
        titleSpan.textContent = title;
    }
    contentWrapper.appendChild(titleSpan); // Add title to wrapper

    if (opts.buttonLabel) {
        const buttonOptions = {
            // label: opts.buttonLabel, // Label is passed directly to createAdwButton
            onClick: (event) => {
                // Dispatch a custom event from the banner itself
                banner.dispatchEvent(new CustomEvent('button-clicked', { bubbles: true, composed: true, detail: { originalEvent: event } }));
            }
        };
        if (opts.buttonStyle === 'suggested') {
            buttonOptions.suggested = true;
        } else if (opts.buttonStyle === 'destructive') {
            buttonOptions.destructive = true;
        }
        // buttonOptions.flat = true; // Banners typically have non-flat action buttons

        const button = createAdwButton(opts.buttonLabel, buttonOptions);
        button.classList.add('adw-banner-button');
        contentWrapper.appendChild(button); // Add action button to wrapper
    }
    banner.appendChild(contentWrapper); // Add content wrapper to banner

    if (opts.dismissible) {
        const dismissButton = createAdwButton('', {
            iconName: 'ui/window-close-symbolic', // Corrected icon name
            flat: true,
            isCircular: true,
            ariaLabel: 'Dismiss banner', // Explicitly provide an aria-label
            onClick: () => {
                banner.remove();
                // Optionally, dispatch a 'dismissed' event
                banner.dispatchEvent(new CustomEvent('dismissed', { bubbles: true, composed: true }));
            }
        });
        dismissButton.classList.add('adw-banner-dismiss-button');
        banner.appendChild(dismissButton);
    }

    // Set type class for styling (e.g., adw-banner-warning)
    if (opts.type) {
        banner.classList.add(`adw-banner-${opts.type}`);
    }

    // Revealed state handling (hidden by default via CSS)
    if (opts.revealed) {
        banner.classList.add('visible');
    }

    // The banner is usually placed by the parent component into the layout.
    // This factory won't auto-append it to document.body.
    return banner;
}

export class AdwBanner extends HTMLElement {
    static get observedAttributes() { return ['title', 'use-markup', 'button-label', 'button-style', 'revealed', 'type', 'dismissible']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        this.shadowRoot.appendChild(styleLink);
        this._bannerElement = null; // To hold the div.adw-banner
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this._render();
    }

    _render() {
        const title = this.getAttribute('title') || '';
        const useMarkup = this.hasAttribute('use-markup');
        const buttonLabel = this.getAttribute('button-label');
        const buttonStyle = this.getAttribute('button-style'); // e.g., "suggested"
        const revealed = this.hasAttribute('revealed');
        const type = this.getAttribute('type');
        const dismissible = this.hasAttribute('dismissible');

        // Clear previous banner element if exists
        if (this._bannerElement) {
            this._bannerElement.remove();
        }

        const factory = (typeof Adw !== 'undefined' && Adw.createBanner) ? Adw.createBanner : createAdwBanner;
        this._bannerElement = factory(title, {
            useMarkup,
            buttonLabel,
            buttonStyle,
            revealed, // Pass revealed state to factory for initial class
            type,
            dismissible
        });

        // Listen to button-clicked from the created banner and re-dispatch from the web component host
        if (buttonLabel) {
            this._bannerElement.addEventListener('button-clicked', (e) => {
                this.dispatchEvent(new CustomEvent('button-clicked', {
                    bubbles: e.bubbles,
                    composed: e.composed,
                    detail: e.detail
                }));
            });
        }
        this.shadowRoot.appendChild(this._bannerElement);

        // CSS transitions handle the animation based on .visible class
        // The 'revealed' attribute directly controls the .visible class in the factory/render.
    }

    // Public properties/methods if needed, e.g., to programmatically reveal/hide
    get revealed() {
        return this.hasAttribute('revealed');
    }

    set revealed(value) {
        if (Boolean(value)) {
            this.setAttribute('revealed', '');
        } else {
            this.removeAttribute('revealed');
        }
        // _render will be called by attributeChangedCallback
    }
}


export class AdwPreferencesView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode:'open'});
        const styleLink = document.createElement('link');
        styleLink.rel='stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        const slot = document.createElement('slot'); // This will project AdwPreferencesPage children
        this.shadowRoot.append(styleLink, slot);
        // AdwPreferencesView itself is a simple container.
    }
}

export class AdwPreferencesPage extends HTMLElement {
    static get observedAttributes() { return ['title', 'description', 'description-centered', 'icon-name', 'name']; }
    constructor() {
        super();
        this.attachShadow({mode:'open'});
        const styleLink = document.createElement('link'); styleLink.rel='stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */

        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('adw-preferences-page');

        this._bannerSlot = document.createElement('slot');
        this._bannerSlot.name = 'banner';

        this._descriptionEl = document.createElement('p');
        this._descriptionEl.classList.add('adw-preferences-page-description');
        this._descriptionEl.style.display = 'none';

        this._pageTitleEl = document.createElement('h1');
        this._pageTitleEl.classList.add('adw-preferences-page-actual-title');
        this._pageTitleEl.style.display = 'none';

        this._contentSlot = document.createElement('slot');

        this._wrapper.append(this._bannerSlot, this._descriptionEl, this._pageTitleEl, this._contentSlot);
        this.shadowRoot.append(styleLink, this._wrapper);
    }
    connectedCallback(){ this._renderAttributes(); }
    attributeChangedCallback(n,ov,nv){ if(ov!==nv) this._renderAttributes(); }

    _renderAttributes(){
        const title = this.getAttribute('title') || '';
        this._pageTitleEl.textContent = title;

        const description = this.getAttribute('description');
        if (description) {
            this._descriptionEl.textContent = description;
            this._descriptionEl.style.display = '';
            this._descriptionEl.classList.toggle('centered', this.hasAttribute('description-centered'));
        } else {
            this._descriptionEl.style.display = 'none';
        }
    }
}

export class AdwPreferencesGroup extends HTMLElement {
    static get observedAttributes() { return ['title', 'description', 'separate-rows']; }
    constructor() {
        super();
        this.attachShadow({mode:'open'});
        const styleLink = document.createElement('link'); styleLink.rel='stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */

        this._wrapper = document.createElement('section');
        this._wrapper.classList.add('adw-preferences-group');

        this._header = document.createElement('header');
        this._header.classList.add('adw-preferences-group-header');

        this._titleDescContainer = document.createElement('div');
        this._titleDescContainer.classList.add('adw-preferences-group-title-description-container');

        this._titleEl = document.createElement('h2');
        this._titleEl.classList.add('adw-preferences-group-title');

        this._descriptionEl = document.createElement('p');
        this._descriptionEl.classList.add('adw-preferences-group-description');

        this._titleDescContainer.append(this._titleEl, this._descriptionEl);

        this._headerSuffixSlot = document.createElement('slot');
        this._headerSuffixSlot.name = 'header-suffix';

        this._header.append(this._titleDescContainer, this._headerSuffixSlot);

        this._rowsContainer = document.createElement('div');
        this._rowsContainer.classList.add('adw-preferences-group-rows');
        this._rowsSlot = document.createElement('slot');
        this._rowsContainer.appendChild(this._rowsSlot);

        this._wrapper.append(this._header, this._rowsContainer);
        this.shadowRoot.append(styleLink, this._wrapper);
    }
    connectedCallback(){ this._renderAttributes(); }
    attributeChangedCallback(n,ov,nv){ if(ov!==nv) this._renderAttributes(); }

    _renderAttributes(){
        const title = this.getAttribute('title');
        this._titleEl.textContent = title || '';
        this._titleEl.style.display = title ? '' : 'none';

        const description = this.getAttribute('description');
        if (description) {
            this._descriptionEl.textContent = description;
            this._descriptionEl.style.display = '';
        } else {
            this._descriptionEl.style.display = 'none';
        }

        const hasSuffixSlotContent = this.querySelector('[slot="header-suffix"]');
        this._header.style.display = (title || description || hasSuffixSlotContent) ? '' : 'none';

        this._rowsContainer.classList.toggle('separate-rows', this.hasAttribute('separate-rows'));
    }
}

// No customElements.define here

// --- AdwIcon ---
const svgIconCache = new Map();
// Base path for icons. Configurable via Adw.config.iconBasePath.
// Defaults to a path relative to where the main components.js might be (e.g., build/js/ -> ../data/icons/).
// This allows it to work for index.html if Adw.config.iconBasePath is not set.
// NOTE FOR `app-demo` USAGE: The `app-demo` application relies on icons from `adwaita-web/data/icons/symbolic/`
// being copied into its own `app-demo/static/data/icons/symbolic/` directory.
// Ensure the `build-adwaita-web.sh` script (or a similar process) is run to copy these assets,
// otherwise icons requested by `icon-name` will result in 404 errors in `app-demo`.
function getIconBasePath() {
    if (typeof Adw !== 'undefined' && Adw.config && Adw.config.iconBasePath) {
        return Adw.config.iconBasePath.endsWith('/') ? Adw.config.iconBasePath : Adw.config.iconBasePath + '/';
    }
    // Default for when components.js is in build/js/ and icons in build/data/icons/
    // Or if running from adwaita-web/js/ and icons in adwaita-web/data/icons/
    // This might need adjustment based on actual script location vs icon location.
    // A common pattern is assets (like icons) being one level up from JS, then into a data/icons dir.
    // For the root index.html, if components.js is at 'build/js/components.js',
    // then '../data/icons/symbolic/' would resolve to 'build/data/icons/symbolic/' from the HTML page's perspective.
    // However, fetch is relative to the *document's URL* if the path doesn't start with '/'.
    // If iconBasePath is not absolute, it should be relative to the HTML file.
    // Let's default to a path that would work if index.html sets it.
    // If not set, it will likely fail for complex setups, pushing users to configure it.
    return 'build/data/icons/symbolic/'; // Default for root index.html if not configured
}

/**
 * Creates an Adwaita-style icon element by fetching and embedding an SVG.
 *
 * @param {string} iconName - The name of the icon (e.g., 'actions/document-new-symbolic').
 *                            The .svg extension is appended automatically.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.alt] - Alt text for accessibility. If provided, role="img" is added.
 *                                 If not, aria-hidden="true" is added.
 * @param {string} [options.cssClass] - Additional CSS class(es) for the icon container.
 * @param {string} [options.id] - Specific ID for the icon container.
 * @returns {HTMLSpanElement} The created <span> element containing the SVG icon.
 */
export function createAdwIcon(iconName, options = {}) {
    const { alt, cssClass, id } = options;

    const iconContainer = document.createElement('span');
    iconContainer.classList.add('adw-icon');
    if (cssClass) {
        iconContainer.classList.add(...(Array.isArray(cssClass) ? cssClass : cssClass.split(' ')));
    }
    if (id) {
        iconContainer.id = id;
    }

    if (alt) {
        iconContainer.setAttribute('role', 'img');
        iconContainer.setAttribute('aria-label', alt);
    } else {
        iconContainer.setAttribute('aria-hidden', 'true');
    }

    const basePath = getIconBasePath();
    const iconPath = `${basePath}${iconName}.svg`;

    if (svgIconCache.has(iconPath)) {
        const cachedSvg = svgIconCache.get(iconPath);
        if (cachedSvg === 'error') { // Handle previously failed fetches
            iconContainer.textContent = '⚠️';
            iconContainer.setAttribute('aria-label', `Error loading icon: ${iconName}`);
            iconContainer.classList.add('adw-icon-error');
        } else {
            iconContainer.innerHTML = cachedSvg;
            const svgElement = iconContainer.querySelector('svg');
            if (svgElement) {
                svgElement.setAttribute('fill', 'currentColor');
            }
        }
    } else {
        fetch(iconPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load icon: ${iconName} (status: ${response.status})`);
                }
                return response.text();
            })
            .then(svgText => {
                // Sanitize SVG text slightly - remove script tags for basic safety
                // A more robust sanitizer would be needed for untrusted SVGs, but these are internal.
                const sanitizedSvgText = svgText.replace(/<script.*?<\/script>/gs, '');
                svgIconCache.set(iconPath, sanitizedSvgText);
                iconContainer.innerHTML = sanitizedSvgText;

                // Ensure SVG inherits color - might need to set fill="currentColor" on the SVG root
                // or ensure paths don't have their own fill.
                const svgElement = iconContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.setAttribute('fill', 'currentColor');
                }
            })
            .catch(error => {
                console.error(`AdwIcon: Fetching ${iconPath} - ${error.message}`);
                svgIconCache.set(iconPath, 'error'); // Cache failure to avoid retrying constantly
                iconContainer.textContent = '⚠️'; // Fallback character
                iconContainer.setAttribute('aria-label', `Error loading icon: ${iconName}`);
                iconContainer.classList.add('adw-icon-error');
            });
    }
    return iconContainer;
}

export class AdwIcon extends HTMLElement {
    static get observedAttributes() { return ['icon-name', 'alt', 'css-class']; }

    constructor() {
        super();
        this._iconContainer = null;
        // No Shadow DOM for simple icon wrapper, to allow easier CSS targeting if needed by context.
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this._render();
    }

    _render() {
        const iconName = this.getAttribute('icon-name');
        if (!iconName) {
            if (this._iconContainer) this._iconContainer.remove();
            this._iconContainer = null;
            return;
        }

        const options = {
            alt: this.getAttribute('alt') || undefined,
            cssClass: this.getAttribute('css-class') || undefined
        };

        // If called multiple times (e.g. attribute change), reuse or replace existing container
        if (!this._iconContainer || this._iconContainer.parentElement !== this) {
            if (this._iconContainer) this._iconContainer.remove(); // remove if detached
            this._iconContainer = createAdwIcon(iconName, options);
            this.appendChild(this._iconContainer);
        } else {
            // Update existing icon container
            this._iconContainer.className = 'adw-icon'; // Reset classes
            if (options.cssClass) {
                 this._iconContainer.classList.add(...(Array.isArray(options.cssClass) ? options.cssClass : options.cssClass.split(' ')));
            }
            if (options.alt) {
                this._iconContainer.setAttribute('role', 'img');
                this._iconContainer.setAttribute('aria-label', options.alt);
            } else {
                this._iconContainer.setAttribute('aria-hidden', 'true');
                this._iconContainer.removeAttribute('aria-label');
            }
            // Re-fetch/re-render SVG content (createAdwIcon handles cache)
            const newContent = createAdwIcon(iconName, options);
            this._iconContainer.innerHTML = newContent.innerHTML; // Replace content
             if (newContent.classList.contains('adw-icon-error')) {
                this._iconContainer.classList.add('adw-icon-error');
            } else {
                this._iconContainer.classList.remove('adw-icon-error');
            }
        }
    }
}