// adwaita-web/js/components/aboutdialog.js
(function() {
  'use strict';
  if (!window.Adw) { window.Adw = {}; }
  if (!window.Adw.DialogManager) {
    console.error("Adw.DialogManager is not loaded. AdwAboutDialogElement may not function correctly.");
  }

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      /* Global Adwaita styles for dialogs are expected to style the :host for positioning,
         display, transitions, z-index, base background, border-radius, shadow.
         This internal style block handles the unique layout and appearance *within* the about dialog. */
      :host {
        /* Default Adwaita variables should be available here */
        color: var(--dialog-fg-color, inherit);
      }
      .adw-header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-s) var(--spacing-m); /* Adjusted for potentially smaller header */
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
      }
      .adw-header-bar__title {
        font-size: var(--title-4-font-size); /* Smaller title for about dialog header */
        font-weight: bold;
        margin: 0; /* Remove default h2 margin */
      }
      /* Close button styling relies on global .adw-button, .circular, .flat, .adw-icon, .icon-window-close-symbolic */
      /* Ensure these classes are effective or provide minimal overrides if needed for shadow DOM context */
      .adw-dialog-close-button {
        /* Example if more specific styling needed and global doesn't fully apply in shadow */
        /* padding: var(--spacing-xxs); */
      }

      /* Ensure .adw-icon and specific icon classes apply within Shadow DOM */
      .adw-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--icon-size-base, 16px);
        height: var(--icon-size-base, 16px);
        background-color: currentColor;
        -webkit-mask-size: contain;
        mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-position: center;
        mask-position: center;
        vertical-align: middle;
      }
      .icon-window-close-symbolic {
        /* Rely on global CSS to define this or use a CSS custom property if path needs to be dynamic */
        /* Forcing it here if component needs to be self-contained with its icon path */
        -webkit-mask-image: var(--icon-window-close-symbolic-url);
        mask-image: var(--icon-window-close-symbolic-url);
      }

      .adw-dialog__content {
         padding: 0; /* Remove padding if content-wrapper handles it */
         line-height: 1.6;
         flex-grow: 1;
         overflow-y: auto;
         display: flex; /* Ensure content-wrapper can center if needed */
         flex-direction: column; /* Stack content wrapper */
      }
      .content-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--spacing-xl); /* Generous padding for the actual content body */
        gap: var(--spacing-s);
        width: 100%;
        box-sizing: border-box;
      }
      .logo {
        max-width: 64px; /* Slightly smaller than example for compactness */
        height: 64px;
        object-fit: contain;
        margin-bottom: var(--spacing-m);
      }
      .app-name {
        font-size: var(--title-1-font-size);
        font-weight: bold;
        margin: 0;
      }
      .version {
        color: var(--secondary-fg-color);
        font-size: var(--font-size-base);
        margin-top: var(--spacing-xxs);
      }
      .comments {
        font-size: var(--font-size-base);
        margin-top: var(--spacing-m);
        white-space: pre-wrap; /* Allow line breaks from attribute */
        max-width: 100%;
      }
      .copyright {
        font-size: var(--font-size-small);
        color: var(--secondary-fg-color);
        margin-top: var(--spacing-l);
      }
      .links {
        display: flex;
        gap: var(--spacing-s);
        margin-top: var(--spacing-m);
        flex-wrap: wrap;
        justify-content: center;
      }
      /* .adw-button.pill styling is expected from global stylesheet */
    </style>
    <header class="adw-header-bar" part="header">
      <h2 class="adw-header-bar__title" data-ref="title" part="title-text"></h2>
      <button type="button" class="adw-button circular flat adw-dialog-close-button" aria-label="Close" data-ref="closeBtn" part="close-button">
        <span class="adw-icon icon-window-close-symbolic" aria-hidden="true"></span>
      </button>
    </header>
    <div class="adw-dialog__content" part="content-area">
      <div class="content-wrapper" part="content-wrapper">
        <img class="logo" alt="" data-ref="logo" hidden part="logo">
        <h1 class="app-name" data-ref="appName" part="app-name-heading"></h1>
        <p class="version" data-ref="version" hidden part="version-text"></p>
        <p class="comments" data-ref="comments" hidden part="comments-text"></p>
        <div class="links" data-ref="links" part="links-container"></div>
        <p class="copyright" data-ref="copyright" hidden part="copyright-text"></p>
      </div>
    </div>
  `;

  class AdwAboutDialogElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      this._refs = {};
      this.shadowRoot.querySelectorAll('[data-ref]').forEach(el => {
        this._refs[el.dataset.ref] = el;
      });

      this._boundOnKeydown = this._onKeydown.bind(this);
      this._previouslyFocusedElement = null; // To store focus before dialog opens
    }

    static get observedAttributes() {
      return ['open', 'app-name', 'version', 'copyright', 'logo', 'comments', 'website', 'website-label'];
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'dialog');
      if (!this.hasAttribute('aria-modal')) this.setAttribute('aria-modal', 'true');

      this._refs.closeBtn.addEventListener('click', () => this.close());
      this._updateContent();

      // Ensure host has .adw-dialog for global styles if DialogManager doesn't add it
      if (!this.classList.contains('adw-dialog')) {
          this.classList.add('adw-dialog');
      }
      // Specific class for about dialog host styling from global CSS
      if (!this.classList.contains('adw-about-dialog')) {
          this.classList.add('adw-about-dialog');
      }
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this._boundOnKeydown);
        if (this.hasAttribute('open') && window.Adw && window.Adw.DialogManager) {
            window.Adw.DialogManager.unregister(this);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue && name !== 'open') return;

      if (name === 'open') {
        // Defer open/close actions to allow other attributes to be processed first if set simultaneously
        Promise.resolve().then(() => {
            if (this.hasAttribute('open')) {
                this._doOpen();
            } else {
                this._doClose();
            }
        });
      } else {
        if (this.isConnected) { // Only update content if connected
            this._updateContent();
        }
      }
    }

    _updateContent() {
      if (!this.shadowRoot || !this._refs.title) return;

      const appName = this.getAttribute('app-name') || 'Application';

      const titleId = this._refs.title.id || ('adw-about-dialog-title-' + (this.id || Math.random().toString(36).substring(2,9)));
      this._refs.title.id = titleId;
      this.setAttribute('aria-labelledby', titleId);

      this._refs.title.textContent = `About ${appName}`;
      this._refs.appName.textContent = appName;

      this._updateElement(this._refs.logo, this.getAttribute('logo'), el => { el.src = this.getAttribute('logo'); el.alt = `${appName} Logo`; });
      this._updateElement(this._refs.version, this.getAttribute('version'), el => { el.textContent = `Version ${this.getAttribute('version')}`; });
      this._updateElement(this._refs.comments, this.getAttribute('comments'), el => { el.textContent = this.getAttribute('comments'); });
      this._updateElement(this._refs.copyright, this.getAttribute('copyright'), el => { el.textContent = this.getAttribute('copyright'); });

      const websiteUrl = this.getAttribute('website');
      const websiteLabel = this.getAttribute('website-label') || 'Website';
      this._refs.links.innerHTML = '';
      if (websiteUrl) {
        const link = document.createElement('a');
        link.href = websiteUrl;
        link.textContent = websiteLabel;
        link.className = 'adw-button pill';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        this._refs.links.appendChild(link);
      }
    }

    _updateElement(el, value, updateFn) {
      if (el) {
        if (value) {
          updateFn(el);
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      }
    }

    _doOpen() {
      if (!this.isConnected) return;

      this._previouslyFocusedElement = document.activeElement;
      if (window.Adw && window.Adw.DialogManager) {
        window.Adw.DialogManager.register(this); // Manager handles backdrop & initial focus
      } else {
        console.warn("AdwAboutDialog: DialogManager not found.");
      }
      document.addEventListener('keydown', this._boundOnKeydown); // For Escape key
      this.dispatchEvent(new CustomEvent('open', {bubbles: true, composed: true}));
    }

    _doClose() {
      if (window.Adw && window.Adw.DialogManager) {
        window.Adw.DialogManager.unregister(this); // Manager handles backdrop
      }
      document.removeEventListener('keydown', this._boundOnKeydown);

      if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
        this._previouslyFocusedElement.focus();
      }
      this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    _onKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
      }
      // Note: A full focus trap is not implemented here; DialogManager provides initial focus.
      // For full accessibility, a more robust focus trap (cycling Tab key) would be needed,
      // ideally managed by DialogManager or as a shared utility.
    }

    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }
  }

  customElements.define('adw-about-dialog', AdwAboutDialogElement);
})();
