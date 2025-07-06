// adwaita-web/js/utils/dialog-manager.js
// This manager handles the backdrop and focus for all dialogs.
const DialogManager = {
  _backdropElement: null,
  _openDialogs: [], // Stack of open dialogs

  _createBackdrop() {
    if (this._backdropElement && document.body.contains(this._backdropElement)) return;
    this._backdropElement = document.createElement('div');
    this._backdropElement.className = 'adw-dialog-backdrop'; // Ensure CSS targets this
    // Style is managed by SCSS: _dialog.scss
    document.body.appendChild(this._backdropElement);

    // Prevent clicks on backdrop from propagating if needed, though dialogs themselves
    // might handle closing on backdrop click.
    this._backdropElement.addEventListener('click', (event) => {
        // If the click is directly on the backdrop (not a dialog bubble up)
        // and there's an open dialog, consider closing the topmost dialog
        // if it's configured to close on backdrop click.
        if (event.target === this._backdropElement && this._openDialogs.length > 0) {
            const topDialog = this._openDialogs[this._openDialogs.length - 1];
            // Assuming dialogs have a standard way to check this, e.g., getAttribute
            if (topDialog.getAttribute('close-on-backdrop-click') !== 'false' && typeof topDialog.close === 'function') {
                topDialog.close();
            }
        }
    });
  },

  register(dialog) {
    this._createBackdrop(); // Ensure backdrop exists

    // Add dialog to stack if not already present
    if (!this._openDialogs.includes(dialog)) {
        this._openDialogs.push(dialog);
    }

    this.updateBackdropVisibility(); // Show backdrop if needed
    this._focus(dialog); // Set initial focus
  },

  unregister(dialog) {
    this._openDialogs = this._openDialogs.filter(d => d !== dialog);
    this.updateBackdropVisibility(); // Hide backdrop if no dialogs are open

    // Return focus to the element that opened the dialog
    // This should be handled by the dialog component itself using the stored _previouslyFocusedElement
    // as DialogManager doesn't know which element opened which dialog.
    // The dialog's _doClose method should restore its _previouslyFocusedElement.
    // DialogManager._focus(dialog) in register() already helps dialog store this.
  },

  updateBackdropVisibility() {
    if (!this._backdropElement) return;
    if (this._openDialogs.length > 0) {
      // Ensure backdrop is styled to be visible (e.g., add 'visible' or 'open' class)
      // SCSS for .adw-dialog-backdrop.visible should handle opacity transition
      this._backdropElement.classList.add('visible'); // Or 'open' depending on SCSS
    } else {
      this._backdropElement.classList.remove('visible'); // Or 'open'
    }
  },

  _focus(dialog) {
    // Store the currently focused element before changing focus
    // This is now the responsibility of the dialog component itself before calling register.
    // dialog._previouslyFocusedElement = document.activeElement;
    // DialogManager can set initial focus within the dialog.

    // Query within the dialog (Light DOM or Shadow DOM)
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let firstFocusable;

    if (dialog.shadowRoot) {
        firstFocusable = dialog.shadowRoot.querySelector(focusableSelector);
        // Also check for slotted elements if the dialog uses slots for focusable content
        if (!firstFocusable) {
            const slot = dialog.shadowRoot.querySelector('slot');
            if (slot) {
                const assignedElements = slot.assignedElements({flatten: true});
                for (let el of assignedElements) {
                    if (el.matches(focusableSelector)) {
                        firstFocusable = el;
                        break;
                    }
                    firstFocusable = el.querySelector(focusableSelector);
                    if (firstFocusable) break;
                }
            }
        }
    } else {
        firstFocusable = dialog.querySelector(focusableSelector);
    }

    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      // As a fallback, make the dialog itself focusable if no inner elements are found
      if (!dialog.hasAttribute('tabindex')) {
        dialog.setAttribute('tabindex', '-1');
      }
      dialog.focus();
    }
  },

  // A more comprehensive focus trap could be added here if needed by all dialogs
  // handleFocusTrap(event, dialog) { ... }
};

// Ensure Adw namespace exists
window.Adw = window.Adw || {};
window.Adw.DialogManager = DialogManager;

// Export if using modules elsewhere, though this pattern uses a global Adw.DialogManager
// export default DialogManager;
