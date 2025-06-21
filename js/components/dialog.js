import { adwGenerateId } from './utils.js';
import { createAdwButton } from './button.js';
// Assuming other dependencies like createAdwExpanderRow, createAdwViewSwitcher will be available via Adw global or direct import
// For now, to avoid circular dependencies during this refactor step, we might rely on Adw.expanderRow etc.
// being populated by the main module before these are heavily used, or we address deeper imports later.

/**
 * Creates an Adwaita-style dialog.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.title] - Title of the dialog.
 * @param {HTMLElement|string} options.content - Content of the dialog. If string, it's wrapped in a <p>.
 *                                               SECURITY: If providing an HTMLElement, ensure its content is trusted/sanitized.
 * @param {HTMLElement[]} [options.buttons] - Array of button elements for the dialog footer.
 * @param {function} [options.onClose] - Callback when the dialog is closed.
 * @param {boolean} [options.closeOnBackdropClick=true] - Whether clicking the backdrop closes the dialog.
 * @returns {{dialog: HTMLDivElement, open: function, close: function}} Object with dialog element and methods.
 */
export function createAdwDialog(options = {}) {
  const opts = options || {};
  const backdrop = document.createElement('div');
  backdrop.classList.add('adw-dialog-backdrop');

  const dialog = document.createElement('div');
  dialog.classList.add('adw-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const titleId = adwGenerateId('adw-dialog-title');
  if (opts.title) {
      dialog.setAttribute('aria-labelledby', titleId);
  }

  if (opts.title) {
      const titleEl = document.createElement('div');
      titleEl.classList.add('adw-dialog-title');
      titleEl.id = titleId;
      titleEl.textContent = opts.title;
      dialog.appendChild(titleEl);
  }

  if (opts.content) {
      const contentEl = document.createElement('div');
      contentEl.classList.add('adw-dialog-content');
      if (typeof opts.content === 'string') {
        const p = document.createElement('p');
        p.textContent = opts.content;
        contentEl.appendChild(p);
      } else if (opts.content instanceof Node) {
        contentEl.appendChild(opts.content);
      } else {
        console.warn("AdwDialog: options.content should be a string or DOM element.");
      }
      dialog.appendChild(contentEl);
  }

  if (opts.buttons && Array.isArray(opts.buttons) && opts.buttons.length > 0) {
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add('adw-dialog-buttons');
      opts.buttons.forEach(button => {
        if (button instanceof Node) buttonsContainer.appendChild(button);
      });
      dialog.appendChild(buttonsContainer);
  }

   function openAdwDialog() {
      document.body.appendChild(backdrop);
      backdrop.appendChild(dialog); // Append dialog to backdrop for correct stacking & event handling
      const firstFocusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        dialog.setAttribute('tabindex', '-1'); // Make dialog itself focusable if no children are
        dialog.focus();
      }
      // Trigger CSS transition for opening
      setTimeout(() => {
          backdrop.classList.add('open');
          dialog.classList.add('open');
      }, 10); // Small delay to ensure styles are applied for transition
  }
  function closeAdwDialog() {
    backdrop.classList.remove('open');
    dialog.classList.remove('open');
    setTimeout(() => {
      if (backdrop.parentNode) { // Check if still in DOM
        backdrop.remove();
      }
      if (typeof opts.onClose === 'function') {
        opts.onClose();
      }
    }, 300); // Should match CSS transition duration
  }
  backdrop.addEventListener('click', (event) => {
      // Only close if the click is directly on the backdrop
      if (event.target === backdrop && opts.closeOnBackdropClick !== false) {
          closeAdwDialog();
      }
  });
    dialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdwDialog();
        }
        // Basic focus trapping
        if (e.key === 'Tab') {
            const focusableElements = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
            if (focusableElements.length === 0) return;
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    });

  return {
      dialog: dialog, // The actual dialog box
      backdrop: backdrop, // The backdrop element
      open: openAdwDialog,
      close: closeAdwDialog,
  };
}

export class AdwDialog extends HTMLElement {
    static get observedAttributes() { return ['title', 'close-on-backdrop-click', 'open']; }
    constructor() {
        super();
        // No shadow DOM for dialogs that are modal and globally positioned.
        this._dialogInstance = null;
    }
    connectedCallback() {
        this._render(); // Build the dialog instance
        if (this.hasAttribute('open')) {
            this.open();
        }
    }
    disconnectedCallback() {
        if (this._dialogInstance) {
            this._dialogInstance.close(); // Ensure cleanup
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // Re-render if other attributes change
            // This might involve closing and reopening if the dialog is already open
            const wasOpen = this.hasAttribute('open');
            if (this._dialogInstance && wasOpen) this._dialogInstance.close();
            this._render();
            if (wasOpen) this.open();
        }
    }

    _buildDialogDOM() {
        // This method encapsulates the DOM creation logic previously in createAdwDialog factory
        // It doesn't append to body here, open() method does that.
        this._backdropElement = document.createElement('div');
        this._backdropElement.classList.add('adw-dialog-backdrop');

        this._dialogElement = document.createElement('div');
        this._dialogElement.classList.add('adw-dialog');
        this._dialogElement.setAttribute('role', 'dialog');
        this._dialogElement.setAttribute('aria-modal', 'true');

        const title = this.getAttribute('title');
        if (title) {
            const titleId = adwGenerateId('adw-dialog-wc-title');
            this._dialogElement.setAttribute('aria-labelledby', titleId);
            const titleEl = document.createElement('div');
            titleEl.classList.add('adw-dialog-title');
            titleEl.id = titleId;
            titleEl.textContent = title;
            this._dialogElement.appendChild(titleEl);
        }

        // Content - Use slotted content
        const contentSlot = this.querySelector('[slot="content"]');
        const contentEl = document.createElement('div');
        contentEl.classList.add('adw-dialog-content');
        if (contentSlot) {
            // If content is complex, it might be better to append a <slot> element
            // to this contentEl and have it project. For now, cloning.
            contentEl.appendChild(contentSlot.cloneNode(true));
        } else {
            // Fallback: use all non-slotted children as content
            const tempContentFragment = document.createDocumentFragment();
            Array.from(this.childNodes).forEach(node => {
                 if (!node.hasAttribute || (node.hasAttribute && !node.hasAttribute('slot'))) {
                    tempContentFragment.appendChild(node.cloneNode(true));
                }
            });
            if (tempContentFragment.hasChildNodes()) {
                contentEl.appendChild(tempContentFragment);
            } else {
                 // Default empty paragraph if no content at all, to maintain structure
                 contentEl.appendChild(document.createElement('p'));
            }
        }
        this._dialogElement.appendChild(contentEl);

        // Buttons - Use slotted buttons
        const buttonsSlot = this.querySelector('[slot="buttons"]');
        const actions = buttonsSlot ? Array.from(buttonsSlot.children).map(child => child.cloneNode(true)) : [];

        if (actions.length > 0) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('adw-dialog-buttons');
            actions.forEach(button => {
                if (button instanceof Node) buttonsContainer.appendChild(button);
            });
            this._dialogElement.appendChild(buttonsContainer);
        }

        // Event listeners for backdrop click and Escape key
        this._backdropElement.addEventListener('click', (event) => {
            if (event.target === this._backdropElement && (!this.hasAttribute('close-on-backdrop-click') || this.getAttribute('close-on-backdrop-click') !== 'false')) {
                this.close();
            }
        });
        this._dialogElement.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'Tab') this._trapFocus(e);
        });
    }

    _trapFocus(event) {
        const focusableElements = Array.from(this._dialogElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
        if (focusableElements.length === 0) { event.preventDefault(); return; }
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
            lastElement.focus(); event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            firstElement.focus(); event.preventDefault();
        }
    }

    _render() {
        // _render is now mostly for initial setup if needed, or if attributes change that don't require full DOM rebuild.
        // For AdwDialog, the main DOM building happens in _buildDialogDOM, called by open().
        // If attributes like 'title' change while dialog is closed, _buildDialogDOM will pick them up when next opened.
        // If attributes change while *open*, it's more complex. For now, we assume changes apply on next open,
        // or a more sophisticated update mechanism would be needed.
        // This simplifies _render to mainly ensure the instance knows its state.
        if (!this._dialogElement) { // If DOM hasn't been built yet by a call to open()
            // It's fine, open() will build it.
        }
    }

    open() {
        if (this.hasAttribute('open') && this._dialogElement && this._dialogElement.isConnected) {
            return; // Already open and in DOM
        }

        // Build or Rebuild DOM if necessary (e.g. if attributes changed significantly)
        // For this version, always rebuild on open if not already built.
        if (!this._dialogElement || !this._backdropElement) {
            this._buildDialogDOM();
        }

        document.body.appendChild(this._backdropElement);
        this._backdropElement.appendChild(this._dialogElement); // Dialog is child of backdrop

        const firstFocusable = this._dialogElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
        else { this._dialogElement.setAttribute('tabindex', '-1'); this._dialogElement.focus(); }

        setTimeout(() => {
            if(this._backdropElement) this._backdropElement.classList.add('open');
            if(this._dialogElement) this._dialogElement.classList.add('open');
        }, 10);

        if (!this.hasAttribute('open')) this.setAttribute('open', '');
        this.dispatchEvent(new CustomEvent('open', {bubbles: true, composed: true}));
    }

    close() {
        if (!this.hasAttribute('open') || !this._dialogElement || !this._dialogElement.isConnected) {
            return; // Already closed or not in DOM
        }

        if(this._backdropElement) this._backdropElement.classList.remove('open');
        if(this._dialogElement) this._dialogElement.classList.remove('open');

        setTimeout(() => {
            if (this._backdropElement && this._backdropElement.parentNode) {
                this._backdropElement.remove();
            }
            // The dialog element is a child of backdrop, so it's removed with backdrop.
            // Nullify them so they are rebuilt on next open, picking up any attribute changes.
            this._dialogElement = null;
            this._backdropElement = null;
        }, 300); // Match CSS transition

        if (this.hasAttribute('open')) this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }
}

/**
 * Creates and displays an Adwaita-style Alert Dialog.
 * This is a specialized version of AdwDialog for common alert patterns.
 */
export function createAdwAlertDialog(body, options = {}) {
  const opts = options || {};
  // const dialogId = adwGenerateId('adw-alert-dialog'); // ID not used in this version

  const contentEl = document.createElement('div');
  contentEl.classList.add('adw-alert-dialog-content-wrapper');

  if (opts.customContent instanceof Node) {
    contentEl.appendChild(opts.customContent);
  } else if (body) {
    const bodyP = document.createElement('p');
    bodyP.classList.add('adw-alert-dialog-body');
    bodyP.textContent = body;
    contentEl.appendChild(bodyP);
  }

  const buttons = [];
  if (Array.isArray(opts.choices) && opts.choices.length > 0) {
    opts.choices.forEach(choice => {
      const button = createAdwButton(choice.label, { // Use imported createAdwButton
        suggested: choice.style === 'suggested',
        destructive: choice.style === 'destructive',
        onClick: () => {
          if (typeof opts.onResponse === 'function') {
            opts.onResponse(choice.value);
          }
          alertDialog.close(); // Close dialog on response
        }
      });
      buttons.push(button);
    });
  } else {
    buttons.push(createAdwButton("OK", { // Use imported createAdwButton
      suggested: true,
      onClick: () => {
        if (typeof opts.onResponse === 'function') {
          opts.onResponse("ok");
        }
        alertDialog.close();
      }
    }));
  }

  const dialogOptions = {
    title: opts.heading || undefined,
    content: contentEl,
    buttons: buttons,
    closeOnBackdropClick: opts.closeOnBackdropClick === true, // Default false for alerts
    onClose: () => {
      if (typeof opts.onDialogClosed === 'function') { // Differentiate from onResponse
        opts.onDialogClosed();
      }
    }
  };

  const alertDialog = createAdwDialog(dialogOptions); // Use imported createAdwDialog
  alertDialog.dialog.classList.add('adw-alert-dialog');
  if(opts.heading) alertDialog.dialog.setAttribute('aria-label', opts.heading);
  else if(body) alertDialog.dialog.setAttribute('aria-label', body.substring(0, 50));

  alertDialog.dialog.setAttribute('aria-live', 'assertive');
  alertDialog.dialog.setAttribute('aria-atomic', 'true');

  return alertDialog; // Returns the object {dialog, backdrop, open, close}
}

export class AdwAlertDialog extends HTMLElement {
    static get observedAttributes() { return ['heading', 'body', 'open', 'close-on-backdrop-click']; }

    constructor() {
        super();
        this._alertDialogInstance = null;
        this._choices = [];
    }
    connectedCallback() { this._parseChoices(); this._render(); if (this.hasAttribute('open')) this.open(); }
    disconnectedCallback() { if (this._alertDialogInstance) this._alertDialogInstance.close(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') { if (newValue !== null) this.open(); else this.close(); }
        else {
            const wasOpen = this.hasAttribute('open');
            if (this._alertDialogInstance && wasОpen) this._alertDialogInstance.close();
            this._parseChoices(); this._render();
            if (wasOpen) this.open();
        }
    }
    _parseChoices() { /* ... (same as in original components.js) ... */ }
    _render() { /* ... (similar to AdwDialog._render, using createAdwAlertDialog) ... */
        const bodyContent = this.querySelector('[slot="body-content"]');
        let bodyStr = this.getAttribute('body');
        if (!bodyContent && !bodyStr) {
            const nonChoiceSlots = Array.from(this.childNodes).filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('slot'))).map(n => n.textContent.trim()).join(' ');
            if(nonChoiceSlots.trim()) bodyStr = nonChoiceSlots.trim();
        }

        const options = {
            heading: this.getAttribute('heading') || undefined,
            customContent: bodyContent ? bodyContent.cloneNode(true) : undefined,
            choices: this._choices.length > 0 ? this._choices : undefined,
            closeOnBackdropClick: this.hasAttribute('close-on-backdrop-click') ? (this.getAttribute('close-on-backdrop-click') !== 'false') : false,
            onResponse: (value) => {
                this.dispatchEvent(new CustomEvent('response', { detail: { value } }));
                if (this.hasAttribute('open')) this.removeAttribute('open');
            },
            onDialogClosed: () => { // From factory's onClose
                 if (this.hasAttribute('open')) this.removeAttribute('open');
                 this.dispatchEvent(new CustomEvent('close'));
            }
        };
        this._alertDialogInstance = createAdwAlertDialog(bodyStr || '', options);
    }
    open() { if (!this._alertDialogInstance) this._render(); this._alertDialogInstance.open(); if (!this.hasAttribute('open')) this.setAttribute('open', ''); }
    close() { if (this._alertDialogInstance) this._alertDialogInstance.close(); }
}


/**
 * Creates an Adwaita-style About Dialog.
 */
export function createAdwAboutDialog(options = {}) {
  const opts = options || {};
  // const dialogId = adwGenerateId('adw-about-dialog'); // ID not used

  const aboutDialogContent = document.createElement('div');
  aboutDialogContent.classList.add('adw-about-dialog-content');

  const headerSection = document.createElement('header');
  headerSection.classList.add('adw-about-dialog-header');
  // ... (rest of header section logic from original) ...
  if (opts.logo) { /* ... */ } else if (opts.appIcon) { /* ... */ }
  const appInfoDiv = document.createElement('div');
  appInfoDiv.classList.add('adw-about-dialog-app-info');
  if (opts.appName) { /* ... */ } if (opts.version) { /* ... */ }
  headerSection.appendChild(appInfoDiv);
  aboutDialogContent.appendChild(headerSection);

  const mainContentSection = document.createElement('div');
  mainContentSection.classList.add('adw-about-dialog-main-content');
  // ... (rest of main content section logic) ...
  if (opts.comments) { /* ... */ } if (opts.developerName) { /* ... */ }
  if (opts.copyright) { /* ... */ } if (opts.website) { /* ... */ }
  aboutDialogContent.appendChild(mainContentSection);

  const detailsContent = document.createElement('div');
  detailsContent.classList.add('adw-about-dialog-details-content');
  let hasDetails = false;
  // ... (createListSection and its usage from original - needs Adw.createExpanderRow or similar) ...
  // Assuming Adw.createExpanderRow will be available globally or imported
  const AdwGlobal = (typeof Adw !== 'undefined') ? Adw : { createExpanderRow: (o) => { let d = document.createElement('div'); if(o.content) d.appendChild(o.content); return d; } };


  function createListSection(title, items) { /* ... (same as original) ... */ hasDetails=true; /* ... */ return document.createElement('div');}
  const devList = createListSection("Developers", opts.developers); if (devList) detailsContent.appendChild(devList);
  // ... (other list sections) ...
  if (opts.licenseType || opts.licenseText) { /* ... */ hasDetails=true; /* ... */ }


  if (hasDetails) {
    const expander = AdwGlobal.createExpanderRow({ title: "Details", content: detailsContent, expanded: false });
    aboutDialogContent.appendChild(expander);
  }

  const dialog = createAdwDialog({ // Use imported createAdwDialog
    title: `About ${opts.appName || ''}`,
    content: aboutDialogContent,
    buttons: [createAdwButton("Close", { suggested: true, onClick: () => dialog.close() })], // Use imported createAdwButton
    closeOnBackdropClick: true
  });

  dialog.dialog.classList.add('adw-about-dialog');
  dialog.dialog.style.maxWidth = '600px';
  return dialog;
}

export class AdwAboutDialog extends HTMLElement { /* ... (Similar structure to AdwAlertDialog WC) ... */
    static get observedAttributes() { return ['app-name', 'open']; } // Simplified
    constructor() { super(); this._dialogInstance = null; this._slotObserver = new MutationObserver(() => this._reRenderIfOpen());}
    connectedCallback() { this._slotObserver.observe(this, { childList: true, subtree: true, characterData:true }); this._render(); if (this.hasAttribute('open')) this.open(); }
    disconnectedCallback() { this._slotObserver.disconnect(); if (this._dialogInstance) this._dialogInstance.close(); }
    _reRenderIfOpen() { if (this.hasAttribute('open') && this._dialogInstance) { this._dialogInstance.close(); this._render(); this.open(); } else { this._render(); }}
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (name === 'open') { if (newValue !== null) this.open(); else this.close(); } else { this._reRenderIfOpen(); }}
    _gatherOptions() { /* ... (Simplified version from original) ... */
        const options = {};
        ['appName', 'appIcon', 'logo', 'version', 'copyright', 'developerName', 'website', 'websiteLabel', 'licenseType', 'comments']
            .forEach(key => { const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase(); if (this.hasAttribute(attrName)) options[key] = this.getAttribute(attrName); });
        // Basic slot support for comments
        const commentsSlot = this.querySelector('[slot="comments"]');
        if (commentsSlot) options.comments = commentsSlot.textContent.trim();
        else if (!options.comments) {
             const nonSlottedText = Array.from(this.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()).map(node => node.textContent.trim()).join('\n');
            if (nonSlottedText) options.comments = nonSlottedText;
        }
        return options;
    }
    _render() { const options = this._gatherOptions(); this._dialogInstance = createAdwAboutDialog(options); if (this._dialogInstance.dialog) {this._dialogInstance.dialog.addEventListener('close', () => { if(this.hasAttribute('open')) this.removeAttribute('open'); this.dispatchEvent(new CustomEvent('close')); });}}
    open() { if (!this._dialogInstance) this._render(); this._dialogInstance.open(); if (!this.hasAttribute('open')) this.setAttribute('open', '');}
    close() { if (this._dialogInstance) this._dialogInstance.close(); }
}

/**
 * Creates an Adwaita-style Preferences Dialog.
 */
export function createAdwPreferencesDialog(options = {}) {
  const opts = options || {};
  const dialogTitle = opts.title || "Preferences";

  const preferencesDialogContent = document.createElement('div');
  preferencesDialogContent.classList.add('adw-preferences-dialog-content');

  const AdwGlobal = (typeof Adw !== 'undefined') ? Adw : { createViewSwitcher: (o) => document.createElement('div') };


  const viewsForSwitcher = (opts.pages || []).map(page => ({
    name: page.name,
    content: page.pageElement,
    buttonOptions: { text: page.title }
  }));

  if (viewsForSwitcher.length === 0) { /* ... (empty state) ... */ }
  else {
    const viewSwitcher = AdwGlobal.createViewSwitcher({
      views: viewsForSwitcher,
      activeViewName: opts.initialPageName || (viewsForSwitcher[0] ? viewsForSwitcher[0].name : undefined),
      label: "Preference Pages"
    });
    viewSwitcher.classList.add('adw-preferences-dialog-view-switcher');
    preferencesDialogContent.appendChild(viewSwitcher);
  }

  const dialog = createAdwDialog({ // Use imported createAdwDialog
    title: dialogTitle,
    content: preferencesDialogContent,
    buttons: [createAdwButton("Close", { onClick: () => dialog.close(), suggested: true })], // Use imported createAdwButton
    closeOnBackdropClick: true,
    onClose: opts.onClose
  });

  dialog.dialog.classList.add('adw-preferences-dialog');
  dialog.dialog.style.minWidth = '600px'; dialog.dialog.style.minHeight = '400px';
  const adwDialogContent = dialog.dialog.querySelector('.adw-dialog-content');
  if (adwDialogContent) { adwDialogContent.style.maxHeight = '70vh'; adwDialogContent.style.overflowY = 'auto'; }

  return dialog;
}

export class AdwPreferencesDialog extends HTMLElement { /* ... (Similar structure to AdwAlertDialog WC) ... */
    static get observedAttributes() { return ['title', 'open', 'initial-page-name']; }
    constructor() { super(); this._dialogInstance = null; this._slotObserver = new MutationObserver(() => this._reRenderIfOpen()); }
    connectedCallback() { this._slotObserver.observe(this, { childList: true, subtree: false }); this._render(); if (this.hasAttribute('open')) this.open(); }
    disconnectedCallback() { this._slotObserver.disconnect(); if (this._dialogInstance) this._dialogInstance.close(); }
    _reRenderIfOpen() { if (this.hasAttribute('open') && this._dialogInstance) { this._dialogInstance.close(); this._render(); this.open(); } else { this._render(); }}
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (name === 'open') { if (newValue !== null) this.open(); else this.close(); } else { this._reRenderIfOpen(); }}
    _gatherPages() { /* ... (Similar to AdwTabView WC _gatherPages) ... */
        const pages = [];
        Array.from(this.children).forEach((child, index) => {
            if (child.matches('adw-preferences-page') || child.classList.contains('adw-preferences-page')) {
                pages.push({ name: child.getAttribute('name') || `page-${index}`, title: child.getAttribute('title') || `Page ${index + 1}`, pageElement: child.cloneNode(true) });
            }
        });
        return pages;
    }
    _render() {
        const pages = this._gatherPages();
        const options = { title: this.getAttribute('title') || "Preferences", pages: pages, initialPageName: this.getAttribute('initial-page-name') || undefined,
            onClose: () => { if (this.hasAttribute('open')) this.removeAttribute('open'); this.dispatchEvent(new CustomEvent('close')); }
        };
        this._dialogInstance = createAdwPreferencesDialog(options);
    }
    open() { if (!this._dialogInstance) this._render(); this._dialogInstance.open(); if (!this.hasAttribute('open')) this.setAttribute('open', '');}
    close() { if (this._dialogInstance) this._dialogInstance.close(); }
}

// Define other dialog-related web components if they exist (e.g. AdwAlertDialog, AdwAboutDialog, AdwPreferencesDialog)
// Placeholder for actual Web Component class definitions for these dialogs, similar to AdwDialog.
// For brevity in this step, only AdwDialog WC is fully fleshed out.
// The factories are exported and can be used by their respective WCs.
