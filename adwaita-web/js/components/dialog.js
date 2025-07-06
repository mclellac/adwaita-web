// adwaita-web/js/components/dialog.js

if (!window.Adw) {
  window.Adw = {};
}

class AdwDialogElement extends HTMLElement {
  constructor() {
    super();
    this._boundOnBackdropClick = this._onBackdropClick.bind(this);
    this._boundOnKeydown = this._onKeydown.bind(this);
    this.classList.add('adw-dialog'); // The host itself is the .adw-dialog
    // this._backdrop is managed by the static _backdropElement property.
  }

  static get observedAttributes() {
    return ['open', 'title', 'close-on-backdrop-click'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      if (this.hasAttribute('open')) {
        this._doOpen();
      } else {
        this._doClose();
      }
    } else if (name === 'title') {
      this._updateTitle(newValue);
    }
  }

  connectedCallback() {
    // Ensure basic header structure if not already present declaratively
    if (!this.querySelector('.adw-dialog__header')) {
        const header = document.createElement('header');
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
    }

    if (this.title) {
        this._updateTitle(this.title);
    }

    // Ensure initial state is hidden if not 'open'
    if (!this.hasAttribute('open')) {
        this.setAttribute('hidden', '');
        this.style.display = 'none';
    } else {
      // If 'open' is already present on connection, ensure _doOpen is called.
      this._doOpen();
    }
  }

  disconnectedCallback() {
    // Clean up global event listeners if the dialog is removed from DOM while open
    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
    }
    document.removeEventListener('keydown', this._boundOnKeydown);
  }

  _updateTitle(newTitle) {
    if (this.isConnected) {
      let titleEl = this.querySelector('.adw-dialog__header .adw-header-bar__title');
      if (titleEl) {
        titleEl.textContent = newTitle || '';
      }
    }
  }

  _createBackdrop() {
    if (!AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement = document.createElement('div');
        AdwDialogElement._backdropElement.classList.add('adw-dialog-backdrop');
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
    if (this.getAttribute('close-on-backdrop-click') !== 'false') {
      this.close();
    }
  }

  _onKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  _doOpen() {
    this.removeAttribute('hidden');
    this.style.display = 'flex'; // Ensures element is ready for CSS transition based on [open]

    const backdrop = this._createBackdrop();
    backdrop.style.display = 'block'; // Show backdrop

    // Use requestAnimationFrame to ensure 'display: flex' is applied before backdrop animation starts
    // and before focus is managed. The dialog's own opacity/transform animations are handled by CSS via [open].
    requestAnimationFrame(() => {
        backdrop.style.opacity = '1'; // Animate backdrop opacity via JS
    });

    backdrop.addEventListener('click', this._boundOnBackdropClick);
    document.addEventListener('keydown', this._boundOnKeydown);

    // Focus management
    // Try to focus the dialog itself first, then a focusable element.
    this.setAttribute('tabindex', '-1'); // Make the dialog itself focusable
    this.focus();

    const firstFocusable = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
    this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
  }

  _doClose() {
    if (AdwDialogElement._backdropElement) {
         AdwDialogElement._backdropElement.style.opacity = '0'; // Animate backdrop opacity via JS
    }
    // Dialog's own opacity/transform animations are handled by CSS via :not([open]) selector.
    // The 'open' attribute is removed by close(), triggering CSS transitions.

    // Wait for CSS animation to finish before setting display:none and hidden attribute.
    // The timeout should match the CSS transition duration.
    setTimeout(() => {
        // Only set display:none if the dialog is still closed (i.e., 'open' attribute is still absent).
        if (!this.hasAttribute('open')) {
            this.setAttribute('hidden', '');
            this.style.display = 'none';
        }
        if (AdwDialogElement._backdropElement) {
            const anyOtherDialogOpen = document.querySelector('adw-dialog[open]');
            if (!anyOtherDialogOpen) {
                AdwDialogElement._backdropElement.style.display = 'none';
            }
        }
    }, 150); // Should match animation duration from CSS (var(--animation-duration-short))

    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
    }
    document.removeEventListener('keydown', this._boundOnKeydown);
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
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

// Make it available via Adw namespace for imperative creation if needed
Adw.Dialog = Adw.Dialog || {};
Adw.Dialog.factory = (options = {}) => {
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
    return dialog;
};
// For convenience, matching docs
window.createAdwDialog = Adw.Dialog.factory;
