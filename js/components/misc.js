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
    if (tag === "label" || tag === "span" || tag === "p") {
        label.setAttribute("tabindex", "0");
        label.setAttribute("role", "link");
        if (typeof opts.onClick === 'function') {
            label.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    opts.onClick(e);
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

export class AdwLabel extends HTMLElement { /* ... (Same as original AdwLabel WC) ... */
    static get observedAttributes() { return ['for', 'title-level', 'body', 'caption', 'link', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('for')) options.for = this.getAttribute('for');
        if (this.hasAttribute('title-level')) options.title = parseInt(this.getAttribute('title-level'), 10);
        if (this.hasAttribute('body')) options.isBody = this.getAttribute('body') !== null && this.getAttribute('body') !== 'false';
        if (this.hasAttribute('caption')) options.isCaption = this.getAttribute('caption') !== null && this.getAttribute('caption') !== 'false';
        if (this.hasAttribute('link')) options.isLink = this.getAttribute('link') !== null && this.getAttribute('link') !== 'false';
        if (this.hasAttribute('disabled')) options.isDisabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        const factory = (typeof Adw !== 'undefined' && Adw.createLabel) ? Adw.createLabel : createAdwLabel;
        const labelElement = factory(this.textContent.trim(), options);
        this.shadowRoot.appendChild(labelElement);
    }
}

/**
 * Creates an Adwaita-style avatar.
 * (Original factory function was missing, this is a placeholder structure)
 */
export function createAdwAvatar(options = {}) {
    const opts = options || {};
    const avatar = document.createElement('span');
    avatar.classList.add('adw-avatar');
    if(opts.size) avatar.style.width = avatar.style.height = `${opts.size}px`;
    if(opts.text) avatar.textContent = opts.text.substring(0,1).toUpperCase();
    if(opts.imageSrc) avatar.style.backgroundImage = `url('${opts.imageSrc}')`;
    if(opts.alt) avatar.setAttribute('aria-label', opts.alt);
    else if(opts.text) avatar.setAttribute('aria-label', opts.text);
    avatar.setAttribute('role', 'img');
    return avatar;
}
export class AdwAvatar extends HTMLElement { /* ... (Same as original AdwAvatar WC) ... */
    static get observedAttributes() { return ['size', 'image-src', 'text', 'alt']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('size')) options.size = parseInt(this.getAttribute('size'), 10);
        if (this.hasAttribute('image-src')) options.imageSrc = this.getAttribute('image-src');
        if (this.hasAttribute('text')) options.text = this.getAttribute('text');
        if (this.hasAttribute('alt')) options.alt = this.getAttribute('alt');
        const factory = (typeof Adw !== 'undefined' && Adw.createAvatar) ? Adw.createAvatar : createAdwAvatar;
        this.shadowRoot.appendChild(factory(options));
    }
}


/**
 * Creates an Adwaita-style spinner.
 * (Original factory function was missing, this is a placeholder structure)
 */
export function createAdwSpinner(options = {}) {
    const opts = options || {};
    const spinner = document.createElement('div');
    spinner.classList.add('adw-spinner');
    if(opts.size) spinner.style.width = spinner.style.height = opts.size;

    const isActive = opts.active !== false;
    if(!isActive) spinner.classList.add('hidden'); // Assuming CSS handles .hidden for display:none

    spinner.setAttribute('role', 'status'); // Indicates advisory information, content changes may be announced
    spinner.setAttribute('aria-live', 'polite'); // Announce changes when user is idle
    spinner.setAttribute('aria-busy', String(isActive));
    return spinner;
}
export class AdwSpinner extends HTMLElement {
    static get observedAttributes() { return ['size', 'active']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); this._spinnerElement = null; }
    connectedCallback() {
        if (!this.hasAttribute('active')) this.setAttribute('active', 'true'); // Default to active
        this._render();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // For 'size', a full re-render might be needed if styles depend on it beyond just width/height
            // For 'active', we can just update the ARIA attribute and class.
            if (name === 'active') {
                this._updateActivityState();
            } else { // 'size' changed
                this._render();
            }
        }
    }
    _render() {
        // This WC creates the spinner DOM itself.
        if (!this._spinnerElement) { // Create only once
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
            this._spinnerElement.style.width = ''; // Use CSS default
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
 * (Original factory function was missing, this is a placeholder structure)
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
                Array.from(svgElement.querySelectorAll('script')).forEach(script => script.remove()); // Basic sanitization
                icon.appendChild(svgElement);
            } else {
                console.warn("AdwStatusPage: Invalid SVG string provided for iconHTML.", opts.iconHTML);
            }
        } else if (typeof opts.iconHTML === 'string' && opts.iconHTML.trim() !== '') {
            icon.classList.add(...opts.iconHTML.split(' ')); // Assume class names
        }
        page.appendChild(icon);
    }
    if(opts.title) { const title = document.createElement('h1'); title.classList.add('adw-status-page-title'); title.textContent = opts.title; page.appendChild(title); }
    if(opts.description) { const desc = document.createElement('p'); desc.classList.add('adw-status-page-description'); desc.textContent = opts.description; page.appendChild(desc); }
    if(opts.actions && opts.actions.length > 0) { const actionsDiv = document.createElement('div'); actionsDiv.classList.add('adw-status-page-actions'); opts.actions.forEach(action => actionsDiv.appendChild(action)); page.appendChild(actionsDiv); }
    return page;
}
export class AdwStatusPage extends HTMLElement { /* ... (Same as original AdwStatusPage WC) ... */
    static get observedAttributes() { return ['title', 'description', 'icon']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        const actionsSlot = this.querySelector('[slot="actions"]');
        const actions = actionsSlot ? Array.from(actionsSlot.children).map(child => child.cloneNode(true)) : [];
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
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
 * (Original factory function was missing, this is a placeholder structure)
 */
export function createAdwProgressBar(options = {}) {
    const opts = options || {};
    const bar = document.createElement('div'); bar.classList.add('adw-progress-bar');
    if(opts.isIndeterminate) bar.classList.add('indeterminate');
    if(opts.disabled) bar.classList.add('disabled');
    const fill = document.createElement('div'); fill.classList.add('adw-progress-bar-fill');
    if(!opts.isIndeterminate && typeof opts.value === 'number') fill.style.width = `${Math.max(0, Math.min(100, opts.value))}%`;
    bar.appendChild(fill);
    bar.setAttribute('role', 'progressbar');
    if (typeof opts.value === 'number') bar.setAttribute('aria-valuenow', opts.value);
    return bar;
}
export class AdwProgressBar extends HTMLElement { /* ... (Same as original AdwProgressBar WC) ... */
    static get observedAttributes() { return ['value', 'indeterminate', 'disabled']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('value')) options.value = parseFloat(this.getAttribute('value'));
        if (this.hasAttribute('indeterminate')) options.isIndeterminate = this.getAttribute('indeterminate') !== null && this.getAttribute('indeterminate') !== 'false';
        if (this.hasAttribute('disabled')) options.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        const factory = (typeof Adw !== 'undefined' && Adw.createProgressBar) ? Adw.createProgressBar : createAdwProgressBar;
        this.shadowRoot.appendChild(factory(options));
    }
}

/**
 * Creates and displays an Adwaita-style toast notification.
 */
export function createAdwToast(text, options = {}) { /* ... (Same as original createAdwToast) ... */
  const opts = options || {};
  const toast = document.createElement("div");
  toast.classList.add("adw-toast");
  toast.textContent = text;
  if (opts.type && typeof opts.type === 'string') toast.classList.add(`adw-toast-${opts.type.toLowerCase()}`);
  toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "assertive"); toast.setAttribute("aria-atomic", "true");
  if (opts.button instanceof Node) toast.appendChild(opts.button);
  if (opts.timeout !== 0) { const effectiveTimeout = typeof opts.timeout === 'number' ? opts.timeout : 4000; setTimeout(() => { toast.classList.add("fade-out"); setTimeout(() => { toast.remove(); }, 200); }, effectiveTimeout); }
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add("visible"); }, 10);
  return toast;
}
export class AdwToast extends HTMLElement { /* ... (Same as original AdwToast WC) ... */
    static get observedAttributes() { return ['message', 'type', 'timeout', 'show']; }
    constructor() { super(); this._toastInstance = null; }
    connectedCallback() { if (this.hasAttribute('show')) this.show(); }
    attributeChangedCallback(name, oldValue, newValue) { if (name === 'show' && oldValue !== newValue) { if (newValue !== null) this.show(); }}
    show() {
        const message = this.getAttribute('message') || this.innerHTML.trim(); if (!message) { console.warn('AdwToast: Message empty.'); return; }
        if (this._toastInstance && this._toastInstance.isConnected) this._toastInstance.remove();
        const options = { type: this.getAttribute('type') || undefined, timeout: this.hasAttribute('timeout') ? parseInt(this.getAttribute('timeout'), 10) : 4000 };
        const buttonSlot = this.querySelector('[slot="button"]'); if (buttonSlot) options.button = buttonSlot.cloneNode(true);
        const factory = (typeof Adw !== 'undefined' && Adw.createToast) ? Adw.createToast : createAdwToast;
        this._toastInstance = factory(message, options);
        if (!this.hasAttribute('show')) this.setAttribute('show', '');
        if (this._toastInstance && this._toastInstance.parentNode) { const observer = new MutationObserver(() => { if (!this._toastInstance || !this._toastInstance.isConnected) { this.removeAttribute('show'); observer.disconnect(); }}); observer.observe(this._toastInstance.parentNode, { childList: true }); }
    }
    hide() { if (this._toastInstance && this._toastInstance.isConnected) this._toastInstance.remove(); this._toastInstance = null; this.removeAttribute('show'); }
}

/**
 * Creates and displays an Adwaita-style banner notification.
 */
export function createAdwBanner(message, options = {}) { /* ... (Same as original createAdwBanner, ensure createAdwButton is used) ... */
  const opts = options || {};
  const banner = document.createElement('div'); banner.classList.add('adw-banner'); banner.setAttribute('role', 'alert'); if (opts.id) banner.id = opts.id;
  const type = opts.type || 'info'; banner.classList.add(type);
  const messageSpan = document.createElement('span'); messageSpan.classList.add('adw-banner-message'); messageSpan.textContent = message; banner.appendChild(messageSpan);
  if (opts.dismissible !== false) {
    const closeButton = createAdwButton('', { icon: '&times;', flat: true, isCircular: true, onClick: () => { banner.classList.remove('visible'); setTimeout(() => { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 300); }});
    closeButton.classList.add('adw-banner-close-button'); closeButton.setAttribute('aria-label', 'Close banner');
    banner.appendChild(closeButton);
  }
  const container = opts.container instanceof HTMLElement ? opts.container : document.body;
  if (container.firstChild) container.insertBefore(banner, container.firstChild); else container.appendChild(banner);
  setTimeout(() => { banner.classList.add('visible'); }, 10);
  return banner;
}
export class AdwBanner extends HTMLElement { /* ... (Same as original AdwBanner WC) ... */
    static get observedAttributes() { return ['message', 'type', 'dismissible', 'show']; }
    constructor() { super(); this._bannerInstance = null; }
    connectedCallback() { if (this.hasAttribute('show')) this.show(); }
    attributeChangedCallback(name, oldValue, newValue) { if (name === 'show' && oldValue !== newValue) { if (newValue !== null) this.show(); else this.hide(); }}
    show() {
        const message = this.getAttribute('message') || this.innerHTML.trim(); if (!message) { console.warn('AdwBanner: Message empty.'); return; }
        if (this._bannerInstance && this._bannerInstance.isConnected) this._bannerInstance.remove();
        const options = { type: this.getAttribute('type') || 'info', dismissible: this.hasAttribute('dismissible') ? (this.getAttribute('dismissible') !== 'false') : true, id: this.id ? `${this.id}-instance` : undefined };
        const factory = (typeof Adw !== 'undefined' && Adw.createBanner) ? Adw.createBanner : createAdwBanner;
        this._bannerInstance = factory(message, options);
        if (!this.hasAttribute('show')) this.setAttribute('show', '');
        if (this._bannerInstance && this._bannerInstance.parentNode) { const observer = new MutationObserver(() => { if (!this._bannerInstance || !this._bannerInstance.isConnected) { this.removeAttribute('show'); observer.disconnect(); }}); observer.observe(this._bannerInstance.parentNode, { childList: true });}
    }
    hide() { if (this._bannerInstance && this._bannerInstance.isConnected) { const closeBtn = this._bannerInstance.querySelector('.adw-banner-close-button'); if (closeBtn) closeBtn.click(); else this._bannerInstance.remove(); } this._bannerInstance = null; }
}

// Placeholder for AdwPreferencesView, AdwPreferencesPage, AdwPreferencesGroup WCs if they were in original components.js
// For now, assuming they are not Web Components or are defined elsewhere.
// Add them here if they exist in the original file structure.
export class AdwPreferencesView extends HTMLElement { constructor() { super(); this.attachShadow({mode:'open'}); const styleLink = document.createElement('link'); styleLink.rel='stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; const slot = document.createElement('slot'); this.shadowRoot.append(styleLink, slot); this.classList.add('adw-preferences-view');}}
export class AdwPreferencesPage extends HTMLElement { static get observedAttributes() { return ['title']; } constructor() { super(); this.attachShadow({mode:'open'}); const styleLink = document.createElement('link'); styleLink.rel='stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-preferences-page'); this._titleEl = document.createElement('h1'); this._titleEl.classList.add('adw-preferences-page-title'); this._wrapper.append(this._titleEl, document.createElement('slot')); this.shadowRoot.append(styleLink, this._wrapper); } connectedCallback(){this._renderTitle();} attributeChangedCallback(n,ov,nv){if(n==='title'&&ov!==nv)this._renderTitle();} _renderTitle(){this._titleEl.textContent = this.getAttribute('title')||'Page';}}
export class AdwPreferencesGroup extends HTMLElement { static get observedAttributes() { return ['title']; } constructor() { super(); this.attachShadow({mode:'open'}); const styleLink = document.createElement('link'); styleLink.rel='stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-preferences-group'); this._titleEl = document.createElement('div'); this._titleEl.classList.add('adw-preferences-group-title'); this._wrapper.append(this._titleEl, document.createElement('slot')); this.shadowRoot.append(styleLink, this._wrapper); } connectedCallback(){this._renderTitle();} attributeChangedCallback(n,ov,nv){if(n==='title'&&ov!==nv)this._renderTitle();} _renderTitle(){const t=this.getAttribute('title'); this._titleEl.textContent=t||''; this._titleEl.style.display=t?'':'none';}}

// No customElements.define here
