// adwaita-web/js/components/dialog.js

if (!window.Adw) {
  window.Adw = {};
}

class AdwDialogElement extends HTMLElement {
  constructor() {
    super();
    this._boundOnBackdropClick = this._onBackdropClick.bind(this);
    this._boundOnKeydown = this._onKeydown.bind(this);

    // Initial structure (will be populated more dynamically or via slots)
    this.attachShadow({ mode: 'open' }); // Using Shadow DOM for encapsulation

    const style = document.createElement('style');
    // Basic styling - actual Adwaita styles will come from global adwaita-skin.css
    // We need to ensure global styles can penetrate or are explicitly adopted.
    // For now, let's assume global CSS handles .adw-dialog, .adw-dialog-backdrop etc.
    // For web components, it's better to adopt external stylesheets or define self-contained styles.
    // This is a simplified approach for now.
    style.textContent = `
      :host {
        display: none; /* Hidden by default */
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: var(--z-index-dialog, 1050);
        align-items: center;
        justify-content: center;
      }
      :host([open]) {
        display: flex;
      }
      .adw-dialog-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--dialog-backdrop-color, rgba(0,0,0,0.4));
        opacity: 0;
        transition: opacity var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease);
      }
      :host([open]) .adw-dialog-backdrop {
        opacity: 1;
      }
      .adw-dialog-container {
        /* Styles for .adw-dialog class from global CSS are expected here */
        /* This container is what users see as the dialog box */
        position: relative; /* For z-index stacking if needed within the host */
        z-index: 1; /* Above backdrop within the host */
        opacity: 0;
        transform: scale(0.95);
        transition: opacity var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease),
                    transform var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease);
      }
      :host([open]) .adw-dialog-container {
        opacity: 1;
        transform: scale(1);
      }
      /* Applying Adwaita styles directly inside shadow DOM can be tricky.
         Ideally, adwaita-skin.css would define styles for adw-dialog and its parts,
         and we would construct the light DOM to match, or adopt the stylesheet.
         For simplicity here, we'll assume the global CSS applies if we build the
         dialog structure in light DOM and don't use shadow DOM, OR
         we must explicitly link/adopt the main adwaita-skin.css into the shadow DOM.
         Let's switch to Light DOM for dialogs as they are modal and often need global CSS.
      */
    `;
    // Shadow DOM approach is complex for modals due to stacking and global styles.
    // Reverting to Light DOM for dialog component for easier styling with global CSS.
    // this.shadowRoot.appendChild(style);
    // this._backdrop = document.createElement('div');
    // this._backdrop.classList.add('adw-dialog-backdrop');
    // this.shadowRoot.appendChild(this._backdrop);

    // this._dialogContainer = document.createElement('div');
    // this._dialogContainer.classList.add('adw-dialog'); // Use global class
    // this.shadowRoot.appendChild(this._dialogContainer);

    // Using Light DOM for easier styling with existing global adwaita-skin.css
    this.classList.add('adw-dialog'); // The host itself is the .adw-dialog
    this._backdrop = null; // Backdrop will be separate, managed by open/close
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
    // Ensure basic structure if not already there (e.g. from declarative use)
    // This is simplified; complex slotting would require more robust handling.
    if (!this.querySelector('.adw-dialog__header')) {
        const header = document.createElement('header');
        header.classList.add('adw-header-bar', 'adw-dialog__header');
        const titleEl = document.createElement('h2');
        titleEl.classList.add('adw-header-bar__title');
        titleEl.id = 'dialog-title-' + (this.id || Math.random().toString(36).substring(2,7));
        this.setAttribute('aria-labelledby', titleEl.id);
        header.appendChild(titleEl);
        this.prepend(header); // Prepend to allow content to follow
    }
    if (this.title) {
        this._updateTitle(this.title);
    }
     // Default to hidden if not explicitly open
    if (!this.hasAttribute('open')) {
        this.setAttribute('hidden', '');
    }
  }

  _updateTitle(newTitle) {
    let titleEl = this.querySelector('.adw-dialog__header .adw-header-bar__title');
    if (titleEl) {
      titleEl.textContent = newTitle || '';
    }
  }

  _createBackdrop() {
    if (!AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement = document.createElement('div');
        AdwDialogElement._backdropElement.classList.add('adw-dialog-backdrop');
        AdwDialogElement._backdropElement.style.display = 'none'; // Start hidden
        AdwDialogElement._backdropElement.style.position = 'fixed';
        AdwDialogElement._backdropElement.style.top = '0';
        AdwDialogElement._backdropElement.style.left = '0';
        AdwDialogElement._backdropElement.style.width = '100%';
        AdwDialogElement._backdropElement.style.height = '100%';
        AdwDialogElement._backdropElement.style.backgroundColor = 'var(--dialog-backdrop-color, rgba(0,0,0,0.4))';
        AdwDialogElement._backdropElement.style.zIndex = 'calc(var(--z-index-dialog, 1050) - 1)'; // Below dialog
        AdwDialogElement._backdropElement.style.opacity = '0';
        AdwDialogElement._backdropElement.style.transition = 'opacity var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease)';
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
    this.style.display = 'flex'; // From CSS :host([open])

    const backdrop = this._createBackdrop();
    backdrop.style.display = 'block';
    setTimeout(() => { // Allow display change to take effect before transition
        backdrop.style.opacity = '1';
        this.style.opacity = '1'; // Assuming .adw-dialog also has opacity transition
        this.style.transform = 'scale(1)'; // Assuming .adw-dialog also has transform transition
    }, 10);


    backdrop.addEventListener('click', this._boundOnBackdropClick);
    document.addEventListener('keydown', this._boundOnKeydown);

    // Focus management
    const firstFocusable = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
    this.dispatchEvent(new CustomEvent('open'));
  }

  _doClose() {
    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.style.opacity = '0';
    }
    this.style.opacity = '0';
    this.style.transform = 'scale(0.95)';

    setTimeout(() => {
        this.setAttribute('hidden', '');
        this.style.display = 'none';
        if (AdwDialogElement._backdropElement) {
            AdwDialogElement._backdropElement.style.display = 'none';
        }
    }, 150); // Match animation duration

    if (AdwDialogElement._backdropElement) {
        AdwDialogElement._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
    }
    document.removeEventListener('keydown', this._boundOnKeydown);
    this.dispatchEvent(new CustomEvent('close'));
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
    if (options.title) dialog.title = options.title;
    if (options.closeOnBackdropClick === false) dialog.setAttribute('close-on-backdrop-click', 'false');

    if (options.content) {
        const contentDiv = document.createElement('div');
        contentDiv.slot = 'content'; // Assuming dialog.scss styles slots
        if (typeof options.content === 'string') {
            contentDiv.innerHTML = options.content; // Or textContent if plain text
        } else if (options.content instanceof Node) {
            contentDiv.appendChild(options.content);
        }
        dialog.appendChild(contentDiv);
    }
    if (options.buttons && Array.isArray(options.buttons)) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.slot = 'buttons'; // Assuming dialog.scss styles slots
        options.buttons.forEach(button => buttonsDiv.appendChild(button));
        dialog.appendChild(buttonsDiv);
    }
    if (typeof options.onClose === 'function') {
        dialog.addEventListener('close', options.onClose);
    }
    // The dialog is created but not opened. Caller should call .open()
    return dialog;
};
// For convenience, matching docs
window.createAdwDialog = Adw.Dialog.factory;
I've created the file `adwaita-web/js/components/dialog.js` and implemented a basic `AdwDialogElement` web component.

Key features of this initial implementation:
*   It's registered as `<adw-dialog>`.
*   It uses Light DOM for easier styling with the global `adwaita-skin.css`. The host element itself gets the `adw-dialog` class.
*   It manages a shared backdrop element (`AdwDialogElement._backdropElement`) for all dialog instances.
*   Implements `open()` and `close()` methods, which toggle an `open` attribute and manage visibility with basic opacity/scale transitions.
*   Handles `title` attribute to update a title element within a standard header structure (created if not present).
*   Supports `close-on-backdrop-click` attribute and ESC key for closing.
*   Provides a basic `Adw.Dialog.factory` (aliased to `createAdwDialog`) for imperative creation, though it's simplified and assumes the global CSS will style slotted content correctly.

**Next Steps within this plan item:**
1.  Create a main `adwaita-web/js/components.js` file that imports and ensures `dialog.js` (and potentially other future components) is executed.
2.  Ensure this main `components.js` (or `dialog.js` directly if preferred for now) is loaded in `app-demo/templates/base.html`.

Let's create `adwaita-web/js/components.js` to load `dialog.js`.
