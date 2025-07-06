// adwaita-web/js/components/dialog.js
console.log('AdwDialogElement: script loading.');

if (!window.Adw) {
  window.Adw = {};
  console.log('AdwDialogElement: Adw global namespace created.');
}

class AdwDialogElement extends HTMLElement {
  constructor() {
    super();
    console.log(`AdwDialogElement: constructor called for ID: ${this.id || 'N/A'}`);
    this._boundOnBackdropClick = this._onBackdropClick.bind(this);
    this._boundOnKeydown = this._onKeydown.bind(this);

    // Note: The original component was trying to use Shadow DOM then switched to Light DOM.
    // The style block for Shadow DOM is removed here as it was commented out.
    // For Light DOM, global CSS is expected to style `.adw-dialog`.
    this.classList.add('adw-dialog'); // The host itself is the .adw-dialog
    console.log(`AdwDialogElement: ${this.id || 'N/A'} added .adw-dialog class.`);
    // this._backdrop is managed by the static _backdropElement property.
  }

  static get observedAttributes() {
    console.log('AdwDialogElement: observedAttributes getter called.');
    return ['open', 'title', 'close-on-backdrop-click'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} attributeChangedCallback - Name: ${name}, Old: ${oldValue}, New: ${newValue}`);
    if (name === 'open') {
      if (this.hasAttribute('open')) {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} 'open' attribute added, calling _doOpen.`);
        this._doOpen();
      } else {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} 'open' attribute removed, calling _doClose.`);
        this._doClose();
      }
    } else if (name === 'title') {
      this._updateTitle(newValue);
    }
  }

  connectedCallback() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} connectedCallback.`);
    // Ensure basic header structure if not already present declaratively
    if (!this.querySelector('.adw-dialog__header')) {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} creating default header.`);
        const header = document.createElement('header');
        // Use classes consistent with adwaita-skin.css for a dialog header
        header.classList.add('adw-header-bar', 'adw-dialog__header');

        const titleEl = document.createElement('h2');
        titleEl.classList.add('adw-header-bar__title');
        // Ensure titleEl has an ID for aria-labelledby
        titleEl.id = `dialog-title-${this.id || Math.random().toString(36).substring(2, 9)}`;
        this.setAttribute('aria-labelledby', titleEl.id);

        header.appendChild(titleEl);

        // Check for a close button, add if not present by default
        // Adwaita dialogs typically have a close button in the header.
        // Users can override this by providing their own header slot.
        if (!header.querySelector('.adw-dialog-close-button')) {
            const closeButton = document.createElement('button');
            closeButton.classList.add('adw-button', 'circular', 'flat', 'adw-dialog-close-button');
            closeButton.setAttribute('aria-label', 'Close dialog');
            closeButton.innerHTML = '<span class="adw-icon icon-actions-close-symbolic"></span>'; // Make sure this icon class exists
            closeButton.addEventListener('click', () => this.close());
            header.appendChild(closeButton);
        }

        this.prepend(header);
    } else {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} found existing .adw-dialog__header.`);
    }

    if (this.title) {
        this._updateTitle(this.title);
    }

    // Default to hidden if not explicitly open.
    // The CSS :host(:not([open])) { display: none; } should handle initial state.
    // However, explicitly setting 'hidden' attribute can be a good fallback.
    if (!this.hasAttribute('open')) {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} initially not open, setting hidden attribute.`);
        this.setAttribute('hidden', ''); // Controls visibility if CSS isn't perfectly applied yet
        this.style.display = 'none'; // Ensure it's not displayed before CSS kicks in
    } else {
      // If 'open' is already present on connection (e.g. declarative), ensure _doOpen is called.
      // attributeChangedCallback might not fire for initial attributes in some browsers/orders.
      console.log(`AdwDialogElement: ${this.id || 'N/A'} connected with 'open' attribute. Ensuring it opens.`);
      this._doOpen();
    }
  }

  disconnectedCallback() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} disconnectedCallback.`);
    // Clean up global event listeners if the dialog is removed from DOM while open
    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
    }
    document.removeEventListener('keydown', this._boundOnKeydown);
  }

  _updateTitle(newTitle) {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} _updateTitle with: ${newTitle}`);
    // Only try to update DOM if connected.
    // The actual title value is stored by setAttribute, and connectedCallback will call _updateTitle again.
    if (this.isConnected) {
      let titleEl = this.querySelector('.adw-dialog__header .adw-header-bar__title');
      if (titleEl) {
        titleEl.textContent = newTitle || '';
        console.log(`AdwDialogElement: ${this.id || 'N/A'} title updated to: ${titleEl.textContent}`);
      } else {
        // This warning can still occur if a user provides a custom header without .adw-header-bar__title,
        // or if connectedCallback hasn't fully completed its setup of the default header yet (less likely).
        console.log(`AdwDialogElement: ${this.id || 'N/A'} title element (.adw-dialog__header .adw-header-bar__title) not found during _updateTitle. If this is pre-connection or using a custom header, this might be expected. Title will be applied by connectedCallback if default header is used.`);
      }
    } else {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} _updateTitle called but element not connected. Title attribute is set ('${newTitle}'). DOM update will be handled by connectedCallback.`);
    }
  }

  _createBackdrop() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} _createBackdrop called.`);
    if (!AdwDialogElement._backdropElement) {
        console.log('AdwDialogElement: Creating shared backdrop element.');
        AdwDialogElement._backdropElement = document.createElement('div');
        AdwDialogElement._backdropElement.classList.add('adw-dialog-backdrop');
        // Styles are better handled by CSS, but for robustness:
        Object.assign(AdwDialogElement._backdropElement.style, {
            display: 'none',
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'var(--dialog-backdrop-color, rgba(0,0,0,0.4))',
            zIndex: 'calc(var(--z-index-dialog, 1050) - 1)',
            opacity: '0',
            transition: 'opacity var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease)'
        });
        document.body.appendChild(AdwDialogElement._backdropElement);
    }
    return AdwDialogElement._backdropElement;
  }

  _onBackdropClick(event) {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} _onBackdropClick. close-on-backdrop-click="${this.getAttribute('close-on-backdrop-click')}"`);
    if (this.getAttribute('close-on-backdrop-click') !== 'false') {
      this.close();
    }
  }

  _onKeydown(event) {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} _onKeydown, key: ${event.key}`);
    if (event.key === 'Escape') {
      this.close();
    }
  }

  _doOpen() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} _doOpen executing.`);
    this.removeAttribute('hidden');
    // CSS :host([open]) { display: flex; } should handle this.
    // Forcing style for robustness in case CSS is slow or not applied.
    this.style.display = 'flex';
    this.style.opacity = '0'; // Start transparent for transition
    this.style.transform = 'scale(0.95)'; // Start small for transition


    const backdrop = this._createBackdrop();
    backdrop.style.display = 'block'; // Show backdrop first

    // Use requestAnimationFrame for smoother transitions after display change
    requestAnimationFrame(() => {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} RAF for open transition.`);
        backdrop.style.opacity = '1';
        this.style.opacity = '1';
        this.style.transform = 'scale(1)';
    });

    backdrop.addEventListener('click', this._boundOnBackdropClick);
    document.addEventListener('keydown', this._boundOnKeydown);

    // Focus management
    // Try to focus the dialog itself first, then a focusable element.
    this.setAttribute('tabindex', '-1'); // Make the dialog itself focusable
    this.focus();

    const firstFocusable = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      console.log(`AdwDialogElement: ${this.id || 'N/A'} focusing first focusable element:`, firstFocusable);
      firstFocusable.focus();
    } else {
      console.log(`AdwDialogElement: ${this.id || 'N/A'} no specific focusable element found, dialog itself has focus.`);
    }
    this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
    console.log(`AdwDialogElement: ${this.id || 'N/A'} 'open' event dispatched.`);
  }

  _doClose() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} _doClose executing.`);
    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.style.opacity = '0';
    }
    this.style.opacity = '0';
    this.style.transform = 'scale(0.95)';

    // Wait for animation to finish before hiding
    setTimeout(() => {
        console.log(`AdwDialogElement: ${this.id || 'N/A'} timeout for close, setting display:none and hidden attribute.`);
        this.setAttribute('hidden', '');
        this.style.display = 'none';
        if (AdwDialogElement._backdropElement) {
            // Check if other dialogs are open before hiding backdrop
            const anyOtherDialogOpen = document.querySelector('adw-dialog[open]');
            if (!anyOtherDialogOpen) {
                console.log('AdwDialogElement: No other dialogs open, hiding backdrop.');
                AdwDialogElement._backdropElement.style.display = 'none';
            } else {
                console.log('AdwDialogElement: Other dialogs still open, not hiding backdrop.');
            }
        }
    }, 150); // Should match animation duration from CSS (var(--animation-duration-short))

    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
    }
    document.removeEventListener('keydown', this._boundOnKeydown);
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    console.log(`AdwDialogElement: ${this.id || 'N/A'} 'close' event dispatched.`);
  }

  open() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} open() method called. Setting 'open' attribute.`);
    this.setAttribute('open', '');
  }

  close() {
    console.log(`AdwDialogElement: ${this.id || 'N/A'} close() method called. Removing 'open' attribute.`);
    this.removeAttribute('open');
  }

  get title() {
    return this.getAttribute('title');
  }
  set title(value) {
    this.setAttribute('title', value);
  }
}
AdwDialogElement._backdropElement = null; // Static property for shared backdrop

// Define the custom element
customElements.define('adw-dialog', AdwDialogElement);
console.log('AdwDialogElement defined and registered.');

// Make it available via Adw namespace for imperative creation if needed
Adw.Dialog = Adw.Dialog || {};
Adw.Dialog.factory = (options = {}) => {
    console.log('Adw.Dialog.factory called with options:', options);
    const dialog = document.createElement('adw-dialog');
    if (options.id) dialog.id = options.id;
    if (options.title) dialog.title = options.title;
    if (options.closeOnBackdropClick === false) dialog.setAttribute('close-on-backdrop-click', 'false');

    if (options.content) {
        const contentSlot = document.createElement('div');
        contentSlot.slot = 'content';
        if (typeof options.content === 'string') {
            contentSlot.innerHTML = options.content;
        } else if (options.content instanceof Node) {
            contentSlot.appendChild(options.content);
        }
        dialog.appendChild(contentSlot);
    }
    if (options.buttons && Array.isArray(options.buttons)) {
        const buttonsSlot = document.createElement('div');
        buttonsSlot.slot = 'buttons';
        // Adwaita dialogs usually have specific layout for buttons, e.g., .adw-dialog__actions-buttons-container
        // For now, just adding them to the slot. Styling needs to be handled by user or global CSS.
        buttonsSlot.classList.add('adw-dialog__actions-buttons-container');
        options.buttons.forEach(button => buttonsSlot.appendChild(button));
        dialog.appendChild(buttonsSlot);
    }
    if (typeof options.onClose === 'function') {
        dialog.addEventListener('close', options.onClose);
    }
    console.log('Adw.Dialog.factory: created dialog instance:', dialog);
    return dialog;
};
// For convenience, matching docs
window.createAdwDialog = Adw.Dialog.factory;
console.log('AdwDialogElement: Adw.Dialog.factory and window.createAdwDialog assigned.');
