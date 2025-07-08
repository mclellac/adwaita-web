// adwaita-web/js/components/dialog.js

if (!window.Adw) {
  window.Adw = {};
}

class AdwDialogElement extends HTMLElement {
  constructor() {
    super();
    // this._boundOnBackdropClick = this._onBackdropClick.bind(this); // Removed, DialogManager handles backdrop clicks
    this._boundOnKeydown = this._onKeydown.bind(this); // For Escape key
    this._boundHandleFocusTrap = this._handleFocusTrap.bind(this); // For focus trapping
    this.classList.add('adw-dialog'); // The host itself is the .adw-dialog

    this._focusableElements = [];
    this._previouslyFocusedElement = null;
    // Backdrop is now managed by Adw.DialogManager
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
            closeButton.type = 'button'; // CRITICAL: Prevent form submission
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
    // CSS :not([open]) { display: none; } handles this.
    // setAttribute('hidden') is good for semantics and as a fallback.
    if (!this.hasAttribute('open')) {
        this.setAttribute('hidden', '');
        // this.style.display = 'none'; // Let CSS handle this
    } else {
      // If 'open' is already present on connection, ensure _doOpen is called.
      this._doOpen();
    }
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._boundOnKeydown); // Escape key
    this.removeEventListener('keydown', this._boundHandleFocusTrap); // Focus trap

    // If dialog is open when disconnected, ensure it's unregistered from DialogManager
    if (this.hasAttribute('open')) {
        if (window.Adw && window.Adw.DialogManager) {
            window.Adw.DialogManager.unregister(this);
        }
    }
  }

  _updateTitle(newTitle) {
    if (this.isConnected) {
      let titleEl = this.querySelector('.adw-dialog__header .adw-header-bar__title');
      if (titleEl) {
        titleEl.textContent = newTitle || '';
      }
    }
  }

  // _createBackdrop and _onBackdropClick are removed; DialogManager handles backdrop.

  _onKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  _doOpen() {
    this.removeAttribute('hidden');
    // CSS handles display via [open] attribute

    this._previouslyFocusedElement = document.activeElement; // Store focus before DialogManager changes it.
    if (window.Adw && window.Adw.DialogManager) {
        window.Adw.DialogManager.register(this);
    } else {
        console.warn("AdwDialog: DialogManager not found. Backdrop and initial focus might not work.");
        // Fallback: manually make it visible if no manager (though backdrop won't appear)
        // this.style.display = 'flex'; // Or use a class
    }

    document.addEventListener('keydown', this._boundOnKeydown); // For Escape key

    // Focus management (focus trap part) - DialogManager handles initial focus.
    // This._previouslyFocusedElement is already set above.
    this._focusableElements = Array.from(
        this.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    );

    if (this._focusableElements.length > 0) {
        this._focusableElements[0].focus();
    } else {
        this.setAttribute('tabindex', '-1'); // Make dialog itself focusable if no interactive elements
        this.focus();
    }
    this.addEventListener('keydown', this._boundHandleFocusTrap); // Add focus trap listener

    this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
  }

  _handleFocusTrap(event) {
    if (event.key !== 'Tab' || !this._focusableElements.length) {
        return;
    }

    const firstFocusableElement = this._focusableElements[0];
    const lastFocusableElement = this._focusableElements[this._focusableElements.length - 1];

    if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            event.preventDefault();
        }
    } else { // Tab
        if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            event.preventDefault();
        }
    }
  }

  _doClose() {
    if (window.Adw && window.Adw.DialogManager) {
        window.Adw.DialogManager.unregister(this);
    }
    // CSS :not([open]) handles opacity/transform transitions and display:none.

    this.removeEventListener('keydown', this._boundHandleFocusTrap); // Remove focus trap listener

    // Use transitionend to set 'hidden' attribute after animation for semantics.
    const onTransitionEnd = (event) => {
        if (event.target === this && event.propertyName === 'opacity' && !this.hasAttribute('open')) {
            this.setAttribute('hidden', '');
            this.removeEventListener('transitionend', onTransitionEnd);
            // DialogManager handles backdrop visibility, no need to check here.
        }
    };
    this.addEventListener('transitionend', onTransitionEnd);

    document.removeEventListener('keydown', this._boundOnKeydown); // For Escape Key

    // Restore focus to the element that had focus before the dialog opened
    if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
        this._previouslyFocusedElement.focus();
    }
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
// AdwDialogElement._backdropElement = null; // Removed, DialogManager handles backdrop

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
