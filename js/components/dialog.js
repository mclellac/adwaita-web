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
 * @returns {AdwDialog} The created AdwDialog Web Component instance.
 */
export function createAdwDialog(options = {}) {
  const opts = options || {};
  const adwDialogWC = document.createElement('adw-dialog');

  if (opts.title) {
    adwDialogWC.setAttribute('title', opts.title);
  }

  if (opts.closeOnBackdropClick === false) { // Note: attribute presence means true in WC, so only set if false.
    adwDialogWC.setAttribute('close-on-backdrop-click', 'false');
  } else {
      // Default is true, so no need to set attribute if true or undefined.
      // However, AdwDialog WC's current listener checks:
      // (!this.hasAttribute('close-on-backdrop-click') || this.getAttribute('close-on-backdrop-click') !== 'false')
      // This means if the attribute is missing, it defaults to true. So this is fine.
  }

  if (opts.content) {
    let contentNode;
    if (typeof opts.content === 'string') {
      contentNode = document.createElement('p');
      contentNode.textContent = opts.content;
    } else if (opts.content instanceof Node) {
      contentNode = opts.content;
    } else {
      console.warn("AdwDialog factory: options.content should be a string or DOM element.");
      contentNode = document.createElement('p'); // Empty fallback
    }
    contentNode.setAttribute('slot', 'content'); // Assign to content slot
    adwDialogWC.appendChild(contentNode);
  }

  if (opts.buttons && Array.isArray(opts.buttons) && opts.buttons.length > 0) {
    opts.buttons.forEach(button => {
      if (button instanceof Node) {
        button.setAttribute('slot', 'buttons'); // Assign to buttons slot
        adwDialogWC.appendChild(button);
      }
    });
  }

  if (typeof opts.onClose === 'function') {
    adwDialogWC.addEventListener('close', opts.onClose);
  }

  // The factory used to return an object with open/close methods.
  // Now it returns the WC instance. The caller will use adwDialogWC.open() or adwDialogWC.close()
  // or set the 'open' attribute.
  return adwDialogWC;
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

        // Content - Use a slot to project content
        const contentEl = document.createElement('div');
        contentEl.classList.add('adw-dialog-content');
        const contentSlotElement = document.createElement('slot');
        contentSlotElement.name = 'content';
        // Default content if no slot="content" is provided by the user
        const defaultContentSlotElement = document.createElement('slot');
        // Any children of <adw-dialog> not assigned to "title" or "buttons" will go here.
        contentEl.appendChild(contentSlotElement);
        contentEl.appendChild(defaultContentSlotElement);
        this._dialogElement.appendChild(contentEl);

        // Buttons - Use a slot to project buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('adw-dialog-buttons');
        const buttonsSlotElement = document.createElement('slot');
        buttonsSlotElement.name = 'buttons';
        buttonsContainer.appendChild(buttonsSlotElement);
        this._dialogElement.appendChild(buttonsContainer);

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
        }, 160); // Match CSS transition (0.15s = 150ms, add a little buffer)

        if (this.hasAttribute('open')) this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }
}

/**
 * Creates and displays an Adwaita-style Alert Dialog.
 * This is a specialized version of AdwDialog for common alert patterns.
 * @returns {AdwAlertDialog} The created AdwAlertDialog Web Component instance.
 */
export function createAdwAlertDialog(body, options = {}) {
  const opts = options || {};
  const alertDialogWC = document.createElement('adw-alert-dialog');

  if (opts.heading) {
    alertDialogWC.setAttribute('heading', opts.heading);
  }

  // Body content can be set as an attribute for simple text,
  // or complex content via customContent option.
  if (opts.customContent instanceof Node) {
    const customContentWrapper = document.createElement('div');
    customContentWrapper.setAttribute('slot', 'body-content');
    customContentWrapper.appendChild(opts.customContent);
    alertDialogWC.appendChild(customContentWrapper);
  } else if (body) { // body is the first argument to the factory
    alertDialogWC.setAttribute('body', body);
  }

  if (opts.closeOnBackdropClick === true) { // AdwAlertDialog WC defaults to false for this
      alertDialogWC.setAttribute('close-on-backdrop-click', 'true');
  } else if (opts.closeOnBackdropClick === false) {
      alertDialogWC.setAttribute('close-on-backdrop-click', 'false');
  }
  // If undefined, AdwAlertDialog WC's internal default (false for backdrop click) will apply.


  if (Array.isArray(opts.choices) && opts.choices.length > 0) {
    opts.choices.forEach(choice => {
      // AdwAlertDialog WC expects <button slot="choice"> or similar.
      // We create a simple button element here for the slot.
      // AdwAlertDialog WC will internally convert this to an adw-button.
      const choiceButton = document.createElement('button'); // Or could be adw-button directly
      choiceButton.setAttribute('slot', 'choice');
      choiceButton.textContent = choice.label;
      if (choice.value !== undefined) {
        choiceButton.setAttribute('value', choice.value);
      }
      if (choice.style) { // 'suggested' or 'destructive'
        choiceButton.setAttribute('data-style', choice.style);
      }
      alertDialogWC.appendChild(choiceButton);
    });
  }
  // If no choices, AdwAlertDialog WC provides a default OK button.

  if (typeof opts.onResponse === 'function') {
    alertDialogWC.addEventListener('response', (e) => opts.onResponse(e.detail.value));
  }
  if (typeof opts.onDialogClosed === 'function') {
    alertDialogWC.addEventListener('close', opts.onDialogClosed);
  }

  // The factory used to return an object with open/close.
  // Now returns the WC, caller uses its open()/close() methods or 'open' attribute.
  return alertDialogWC;
}

export class AdwAlertDialog extends HTMLElement {
    static get observedAttributes() { return ['heading', 'body', 'open', 'close-on-backdrop-click']; }

    constructor() {
        super();
        this._alertDialogInstance = null;
        this._choices = [];
    }
    connectedCallback() { this._parseChoices(); this._render(); if (this.hasAttribute('open')) this.open(); }
    disconnectedCallback() { if (this._internalDialog) this.close(); } // Use this.close() which handles _internalDialog
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // For other attributes, if the dialog is open, close and reopen to reflect changes.
            // A more sophisticated approach might update the live dialog.
            if (this.hasAttribute('open')) {
                this.close(); // This will nullify _internalDialog
                this.open(); // This will rebuild and open
            }
        }
    }

    _buildInternalDialog() {
        if (this._internalDialog) { // Clean up previous instance if any
             if (this._internalDialog.hasAttribute('open')) this._internalDialog.close();
             this._internalDialog = null;
        }

        this._internalDialog = document.createElement('adw-dialog');
        this._internalDialog.classList.add('adw-alert-dialog-base'); // For specific styling hook if needed

        // Set title on internal dialog
        const heading = this.getAttribute('heading');
        if (heading) {
            this._internalDialog.setAttribute('title', heading);
        } else {
             // Attempt to provide a generic accessible name if no heading
             const bodyForLabel = (this.getAttribute('body') || '').substring(0,50) || 'Alert Dialog';
             this._internalDialog.setAttribute('aria-label', bodyForLabel);
        }


        // Configure close-on-backdrop-click for internal dialog
        if (this.hasAttribute('close-on-backdrop-click') && this.getAttribute('close-on-backdrop-click') === 'false') {
            this._internalDialog.setAttribute('close-on-backdrop-click', 'false');
        } else {
            // Default for alerts is often false, but AdwDialog defaults to true.
            // Let's make AdwAlertDialog default to not closing on backdrop, unless specified.
            // So if 'close-on-backdrop-click' is NOT 'true', then set it to 'false' on internal.
            if (this.getAttribute('close-on-backdrop-click') !== 'true') {
                 this._internalDialog.setAttribute('close-on-backdrop-click', 'false');
            }
        }
        this._internalDialog.setAttribute('aria-live', 'assertive');
        this._internalDialog.setAttribute('aria-atomic', 'true');


        // Dialog Content
        const dialogContentWrapper = document.createElement('div');
        dialogContentWrapper.setAttribute('slot', 'content');
        dialogContentWrapper.classList.add('adw-alert-dialog-content-wrapper');

        const bodySlotContent = this.querySelector('[slot="body-content"]');
        const bodyAttr = this.getAttribute('body');

        if (bodySlotContent) {
            dialogContentWrapper.appendChild(bodySlotContent.cloneNode(true));
        } else if (bodyAttr) {
            const bodyP = document.createElement('p');
            bodyP.classList.add('adw-alert-dialog-body');
            bodyP.textContent = bodyAttr;
            dialogContentWrapper.appendChild(bodyP);
        } else {
            // Check for default slotted content (not in 'choice' or 'body-content' slot)
            const defaultSlottedContent = Array.from(this.childNodes).filter(node => !node.slot);
            if (defaultSlottedContent.length > 0) {
                defaultSlottedContent.forEach(node => dialogContentWrapper.appendChild(node.cloneNode(true)));
            } else {
                 dialogContentWrapper.appendChild(document.createElement('p')); // Empty placeholder
            }
        }
        this._internalDialog.appendChild(dialogContentWrapper);

        // Dialog Buttons (Choices)
        const choiceElements = Array.from(this.querySelectorAll('[slot="choice"]'));
        if (choiceElements.length > 0) {
            choiceElements.forEach(el => {
                const button = document.createElement('adw-button');
                button.setAttribute('slot', 'buttons');
                button.textContent = el.textContent.trim();
                const value = el.getAttribute('value') || el.textContent.trim();
                const style = el.dataset.style || el.getAttribute('data-style');
                if (style === 'suggested') button.setAttribute('suggested', '');
                if (style === 'destructive') button.setAttribute('destructive', '');

                button.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('response', { detail: { value } }));
                    this.close();
                });
                this._internalDialog.appendChild(button);
            });
        } else {
            // Default "OK" button if no choices provided
            const okButton = document.createElement('adw-button');
            okButton.setAttribute('slot', 'buttons');
            okButton.textContent = 'OK';
            okButton.setAttribute('suggested', '');
            okButton.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('response', { detail: { value: 'ok' } }));
                this.close();
            });
            this._internalDialog.appendChild(okButton);
        }

        // Forward the 'close' event from the internal dialog
        this._internalDialog.addEventListener('close', () => {
            if (this.hasAttribute('open')) { // Ensure we don't remove if already removed by this.close()
                this.removeAttribute('open'); // Sync attribute
            }
            this.dispatchEvent(new CustomEvent('close')); // Bubble up our own close event
        });
    }

    open() {
        if (!this._internalDialog || !this._internalDialog.isConnected) {
            this._buildInternalDialog();
        }
        // Append the internal dialog to the body if it's not already there (AdwDialog handles its own body append)
        // This is tricky. AdwDialog itself appends its _dialogElement to body.
        // AdwAlertDialog should just call open() on its _internalDialog.
        if (this._internalDialog) {
            this._internalDialog.setAttribute('open', ''); // Triggers AdwDialog's open logic
        }
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
    }

    close() {
        if (this._internalDialog && this._internalDialog.hasAttribute('open')) {
            this._internalDialog.removeAttribute('open'); // Triggers AdwDialog's close logic
        }
        // The internal dialog's 'close' event handler will remove our 'open' attribute.
        // No need to explicitly remove it here again if event forwarding is correct.
        // However, ensure cleanup if internal dialog was never fully opened or attached.
        if (this.hasAttribute('open') && (!this._internalDialog || !this._internalDialog.isConnected)) {
            this.removeAttribute('open');
        }
        // _internalDialog will be cleared on next open or if attribute changed
    }
}


/**
 * Creates an Adwaita-style About Dialog using the AdwAboutDialog Web Component.
 * @param {object} options - Configuration options.
 * @returns {AdwAboutDialog} The created AdwAboutDialog Web Component instance.
 */
export function createAdwAboutDialog(options = {}) {
  const opts = options || {};
  const aboutDialogWC = document.createElement('adw-about-dialog');

  // Map options to attributes
  const attributeMap = {
    appName: 'app-name', appIcon: 'app-icon', logo: 'logo', version: 'version',
    copyright: 'copyright', developerName: 'developer-name', website: 'website',
    websiteLabel: 'website-label', licenseType: 'license-type', comments: 'comments'
  };
  for (const key in attributeMap) {
    if (opts[key] !== undefined) {
      aboutDialogWC.setAttribute(attributeMap[key], opts[key]);
    }
  }

  // Handle array attributes (e.g., developers, documenters)
  const arrayAttributes = ['developers', 'documenters', 'designers', 'artists', 'translators'];
  arrayAttributes.forEach(key => {
    if (Array.isArray(opts[key]) && opts[key].length > 0) {
      aboutDialogWC.setAttribute(key, opts[key].join(','));
      // Alternatively, create slotted <ul><li>...</li></ul> for these if the WC is designed to parse them.
      // The current AdwAboutDialog WC's _createListSectionWC supports comma-separated attributes.
    }
  });

  // Handle complex slotted content
  if (opts.comments && typeof opts.comments !== 'string') { // If comments is an HTML structure
    const commentsWrapper = document.createElement('div');
    commentsWrapper.setAttribute('slot', 'comments');
    if(opts.comments instanceof Node) commentsWrapper.appendChild(opts.comments);
    else if(typeof opts.comments === 'string') commentsWrapper.innerHTML = opts.comments; // Risky if not trusted
    aboutDialogWC.appendChild(commentsWrapper);
    aboutDialogWC.removeAttribute('comments'); // Remove attribute if slot is used
  }


  if (opts.licenseText) {
    const licenseWrapper = document.createElement('pre'); // Assuming license text is preformatted
    licenseWrapper.setAttribute('slot', 'license-text');
    licenseWrapper.textContent = opts.licenseText;
    aboutDialogWC.appendChild(licenseWrapper);
  }

  if (opts.customDetailsContent instanceof Node) {
    const detailsWrapper = document.createElement('div'); // Wrapper for the custom details
    detailsWrapper.setAttribute('slot', 'details');
    detailsWrapper.appendChild(opts.customDetailsContent);
    aboutDialogWC.appendChild(detailsWrapper);
  }

  // Note: The old factory returned an object with open/close methods.
  // The new factory returns the WC instance. Callers use its open()/close() or 'open' attribute.
  // Callbacks like onClose (if any were planned for AboutDialog) would be event listeners on the WC.
  // AdwAboutDialog itself handles its close mechanism.

  return aboutDialogWC;
}

export class AdwAboutDialog extends HTMLElement {
    static get observedAttributes() { return ['app-name', 'open', /* other attributes from _gatherOptions */ 'app-icon', 'logo', 'version', 'copyright', 'developer-name', 'website', 'website-label', 'license-type', 'comments', 'developers', 'documenters', 'designers', 'artists', 'translators']; }
    constructor() {
        super();
        this._dialogInstance = null;
        this._slotObserver = new MutationObserver(() => this._rebuildOnSlotChange()); // More targeted rebuild
        this._internalDialog = null; // Will hold the <adw-dialog> instance
    }

    connectedCallback() {
        // Observe direct children for slot changes, not full subtree for performance.
        this._slotObserver.observe(this, { childList: true, attributes: true, attributeFilter: ['slot'] });
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
        if (this._internalDialog) this.close(); // Use this.close to manage state
    }

    _rebuildOnSlotChange() {
        // If open, close, rebuild, and reopen.
        // This is a simple strategy; more complex would be live-updating the dialog content.
        if (this.hasAttribute('open')) {
            this._closeInternalDialog(); // Close without necessarily removing 'open' attribute yet
            this._buildInternalDialogDOM(); // Rebuild content
            this._openInternalDialog(); // Reopen internal dialog
        } else {
            // If closed, nullify to force rebuild on next open.
            this._internalDialog = null;
        }
    }

    _closeInternalDialog(dispatchHostEvent = true) {
        if (this._internalDialog && this._internalDialog.hasAttribute('open')) {
            this._internalDialog.removeAttribute('open');
        }
        // AdwDialog's own close method will handle removing from DOM etc.
        // If dispatchHostEvent is true, AdwAboutDialog's close method will handle attribute and event.
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // For other attributes, if the dialog is open, trigger a rebuild.
            if (this.hasAttribute('open')) {
                 this._rebuildOnSlotChange(); // Rebuilds if open
            } else {
                this._internalDialog = null; // Mark for rebuild on next open
            }
        }
    }

    _createListSectionWC(title, itemsSlotName, itemsArrayFallbackAttr) {
        const items = [];
        const slottedItems = this.querySelectorAll(`[slot="${itemsSlotName}"] > li`);
        if (slottedItems.length > 0) {
            slottedItems.forEach(li => items.push(li.textContent.trim()));
        } else if (this.hasAttribute(itemsArrayFallbackAttr)) {
            const attrItems = this.getAttribute(itemsArrayFallbackAttr).split(',').map(s => s.trim()).filter(s => s);
            items.push(...attrItems);
        }

        if (items.length === 0) return null;

        // Using basic HTML for structure; could be replaced by specific list WCs if available
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('adw-about-dialog-list-section');
        const titleEl = document.createElement('h4');
        titleEl.textContent = title;
        sectionDiv.appendChild(titleEl);
        const ul = document.createElement('ul');
        items.forEach(itemText => {
            const li = document.createElement('li');
            li.textContent = itemText;
            ul.appendChild(li);
        });
        sectionDiv.appendChild(ul);
        return sectionDiv;
    }


    _buildInternalDialogDOM() {
        this._internalDialog = document.createElement('adw-dialog');
        this._internalDialog.classList.add('adw-about-dialog-base'); // For styling hook
        this._internalDialog.setAttribute('title', `About ${this.getAttribute('app-name') || ''}`);
        this._internalDialog.style.maxWidth = '600px'; // As per factory

        const aboutDialogContent = document.createElement('div');
        aboutDialogContent.setAttribute('slot', 'content');
        aboutDialogContent.classList.add('adw-about-dialog-content');

        // Header Section
        const headerSection = document.createElement('header');
        headerSection.classList.add('adw-about-dialog-header');
        const logoSrc = this.getAttribute('logo');
        const appIconName = this.getAttribute('app-icon'); // Assumes this is an icon name for adw-icon

        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc;
            logoImg.alt = `${this.getAttribute('app-name') || 'Application'} Logo`;
            logoImg.classList.add('adw-about-dialog-logo');
            headerSection.appendChild(logoImg);
        } else if (appIconName && typeof Adw !== 'undefined' && Adw.createIcon) {
            const iconEl = Adw.createIcon(appIconName); // Create adw-icon WC or span
            iconEl.classList.add('adw-about-dialog-app-icon');
            headerSection.appendChild(iconEl);
        }

        const appInfoDiv = document.createElement('div');
        appInfoDiv.classList.add('adw-about-dialog-app-info');
        if (this.hasAttribute('app-name')) {
            const appNameEl = document.createElement('h1');
            appNameEl.textContent = this.getAttribute('app-name');
            appInfoDiv.appendChild(appNameEl);
        }
        if (this.hasAttribute('version')) {
            const versionEl = document.createElement('p');
            versionEl.classList.add('adw-about-dialog-version');
            versionEl.textContent = `Version ${this.getAttribute('version')}`;
            appInfoDiv.appendChild(versionEl);
        }
        headerSection.appendChild(appInfoDiv);
        aboutDialogContent.appendChild(headerSection);

        // Main Content Section
        const mainContentSection = document.createElement('div');
        mainContentSection.classList.add('adw-about-dialog-main-content');

        const commentsSlot = this.querySelector('[slot="comments"]');
        const commentsAttr = this.getAttribute('comments');
        if (commentsSlot) {
            mainContentSection.appendChild(commentsSlot.cloneNode(true)); // Allow HTML in comments via slot
        } else if (commentsAttr) {
            const commentsEl = document.createElement('p');
            commentsEl.classList.add('adw-about-dialog-comments');
            commentsEl.textContent = commentsAttr;
            mainContentSection.appendChild(commentsEl);
        } else {
            // Fallback to default slot content for comments if no attribute and no named slot
            const defaultSlotClone = document.createElement('slot'); // projects default slot content
            const defaultSlotWrapper = document.createElement('div');
            defaultSlotWrapper.appendChild(defaultSlotClone)
            mainContentSection.appendChild(defaultSlotWrapper);
        }


        if (this.hasAttribute('developer-name')) {
            const devNameEl = document.createElement('p');
            devNameEl.innerHTML = `Developed by: <strong>${this.getAttribute('developer-name')}</strong>`;
            mainContentSection.appendChild(devNameEl);
        }
        if (this.hasAttribute('copyright')) {
            const copyrightEl = document.createElement('p');
            copyrightEl.classList.add('adw-about-dialog-copyright');
            copyrightEl.textContent = this.getAttribute('copyright');
            mainContentSection.appendChild(copyrightEl);
        }
        if (this.hasAttribute('website')) {
            const websiteLink = document.createElement('a');
            websiteLink.href = this.getAttribute('website');
            websiteLink.textContent = this.getAttribute('website-label') || this.getAttribute('website');
            websiteLink.target = "_blank";
            websiteLink.rel = "noopener noreferrer";
            const websiteP = document.createElement('p');
            websiteP.appendChild(websiteLink);
            mainContentSection.appendChild(websiteP);
        }
        aboutDialogContent.appendChild(mainContentSection);

        // Details Section (Expander Row)
        const detailsContent = document.createElement('div'); // This will go into expander
        detailsContent.classList.add('adw-about-dialog-details-content');
        let hasDetails = false;

        const customDetailsSlot = this.querySelector('[slot="details"]');
        if (customDetailsSlot) {
            detailsContent.appendChild(customDetailsSlot.cloneNode(true));
            hasDetails = true;
        } else {
            const devList = this._createListSectionWC("Developers", "developers-list", "developers"); if (devList) { detailsContent.appendChild(devList); hasDetails = true; }
            const docList = this._createListSectionWC("Documenters", "documenters-list", "documenters"); if (docList) { detailsContent.appendChild(docList); hasDetails = true; }
            const designerList = this._createListSectionWC("Designers", "designers-list", "designers"); if (designerList) { detailsContent.appendChild(designerList); hasDetails = true; }
            const artistList = this._createListSectionWC("Artists", "artists-list", "artists"); if (artistList) { detailsContent.appendChild(artistList); hasDetails = true; }
            const translatorList = this._createListSectionWC("Translators", "translators-list", "translators"); if (translatorList) { detailsContent.appendChild(translatorList); hasDetails = true; }
        }

        const licenseTextSlot = this.querySelector('[slot="license-text"]');
        const licenseTypeAttr = this.getAttribute('license-type');
        if (licenseTextSlot || licenseTypeAttr) {
            const licenseSection = document.createElement('div');
            licenseSection.classList.add('adw-about-dialog-license-section');
            if (licenseTypeAttr) {
                const licenseTypeHeader = document.createElement('h4');
                licenseTypeHeader.textContent = "License";
                licenseSection.appendChild(licenseTypeHeader);
                const licenseP = document.createElement('p');
                licenseP.textContent = licenseTypeAttr;
                licenseSection.appendChild(licenseP);
            }
            if (licenseTextSlot) {
                const licenseTextEl = document.createElement('pre');
                licenseTextEl.classList.add('adw-about-dialog-license-text');
                licenseTextEl.appendChild(licenseTextSlot.cloneNode(true)); // Allow pre-formatted via slot
                licenseSection.appendChild(licenseTextEl);
            }
            detailsContent.appendChild(licenseSection);
            hasDetails = true;
        }

        if (hasDetails) {
            // Assuming adw-expander-row WC is available and works by having content as direct children
            const expander = document.createElement('adw-expander-row');
            expander.setAttribute('title', "Details");
            // The detailsContent itself becomes the child that the expander row will manage
            expander.appendChild(detailsContent);
            aboutDialogContent.appendChild(expander);
        }

        this._internalDialog.appendChild(aboutDialogContent);

        // Close Button
        const closeButton = document.createElement('adw-button');
        closeButton.setAttribute('slot', 'buttons');
        closeButton.textContent = "Close";
        closeButton.setAttribute('suggested', '');
        closeButton.addEventListener('click', () => this.close());
        this._internalDialog.appendChild(closeButton);

        // Forward close event from internal dialog
        this._internalDialog.addEventListener('close', () => {
            if (this.hasAttribute('open')) { this.removeAttribute('open');}
            this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
        });
    }

    _openInternalDialog() {
        if (this._internalDialog) {
             this._internalDialog.setAttribute('open', '');
        }
    }

    open() {
        if (!this._internalDialog) { // Build if not already built (e.g. first open, or after attribute change)
            this._buildInternalDialogDOM();
        }
        this._openInternalDialog();
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
        // AdwDialog's open method dispatches its own 'open' event. No need to dispatch again here.
    }

    close(dispatchHostEvt = true) { // Added param for internal control
        this._closeInternalDialog();
        if (this.hasAttribute('open')) {
            this.removeAttribute('open');
        }
        // The internal dialog's 'close' event listener already dispatches our host 'close' event.
        // So, only dispatch if specifically asked and not already handled by the forwarded event.
        // This logic might need refinement if event forwarding causes double events.
        // For now, assuming the forwarded event is the primary one.
    }
}

/**
 * Creates an Adwaita-style Preferences Dialog using the AdwPreferencesDialog Web Component.
 * @param {object} options - Configuration options.
 * @returns {AdwPreferencesDialog} The created AdwPreferencesDialog Web Component instance.
 */
export function createAdwPreferencesDialog(options = {}) {
  const opts = options || {};
  const preferencesDialogWC = document.createElement('adw-preferences-dialog');

  if (opts.title) {
    preferencesDialogWC.setAttribute('title', opts.title);
  }
  if (opts.initialPageName) {
    preferencesDialogWC.setAttribute('initial-page-name', opts.initialPageName);
  }

  const pages = opts.pages || [];
  pages.forEach((pageData, index) => {
    if (pageData.pageElement instanceof Node) {
      // The AdwPreferencesDialog WC expects children that are preference pages.
      // These children should have 'name' and 'title' attributes for the view switcher.
      // The factory ensures these attributes are present on the pageElement before appending.
      const pageElement = pageData.pageElement;
      if (!pageElement.getAttribute('name') && pageData.name) {
          pageElement.setAttribute('name', pageData.name);
      } else if (!pageElement.getAttribute('name')) {
          pageElement.setAttribute('name', `page-${index}`); // Fallback name
      }

      if (!pageElement.getAttribute('title') && pageData.title) {
          pageElement.setAttribute('title', pageData.title);
      } else if (!pageElement.getAttribute('title')) {
          pageElement.setAttribute('title', `Page ${index + 1}`); // Fallback title
      }

      // Ensure it's identifiable as a page for the AdwPreferencesDialog's slotting/parsing logic
      if (!pageElement.matches('adw-preferences-page') && !pageElement.getAttribute('slot')) {
          pageElement.setAttribute('slot', 'page');
      }

      preferencesDialogWC.appendChild(pageElement);
    } else {
      console.warn(`AdwPreferencesDialog factory: pageElement for "${pageData.name || `page ${index}`}" is not a valid Node.`);
    }
  });

  if (typeof opts.onClose === 'function') {
    preferencesDialogWC.addEventListener('close', opts.onClose);
  }

  return preferencesDialogWC;
}

export class AdwPreferencesDialog extends HTMLElement {
    static get observedAttributes() { return ['title', 'open', 'initial-page-name']; }

    constructor() {
        super();
        this._dialogInstance = null;
        this._slotObserver = new MutationObserver(() => this._rebuildOnSlotChange());
        this._internalDialog = null; // Will hold the <adw-dialog> instance
    }

    connectedCallback() {
        // Observe direct children for adw-preferences-page or similar
        this._slotObserver.observe(this, { childList: true, attributes: true, attributeFilter: ['slot', 'name', 'title'] });
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
        if (this._internalDialog) this.close();
    }

    _rebuildOnSlotChange() {
        if (this.hasAttribute('open')) {
            if (this._internalDialog && this._internalDialog.hasAttribute('open')) {
                this._internalDialog.removeAttribute('open');
            }
            this._buildInternalDialogDOM(); // Rebuild content
            if (this._internalDialog) this._internalDialog.setAttribute('open', '');
        } else {
            this._internalDialog = null; // Mark for rebuild on next open
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // For title or initial-page-name changes
             if (this.hasAttribute('open')) {
                 this._rebuildOnSlotChange();
             } else {
                this._internalDialog = null; // Mark for rebuild
             }
        }
    }

    _buildInternalDialogDOM() {
        this._internalDialog = document.createElement('adw-dialog');
        this._internalDialog.classList.add('adw-preferences-dialog-base'); // For styling hook
        this._internalDialog.setAttribute('title', this.getAttribute('title') || "Preferences");
        // Preferences dialogs are usually larger
        this._internalDialog.dialogElementForTesting.style.minWidth = '600px'; // Accessing underlying element for style for now
        this._internalDialog.dialogElementForTesting.style.minHeight = '400px';

        const preferencesDialogContentWrapper = document.createElement('div');
        preferencesDialogContentWrapper.setAttribute('slot', 'content');
        preferencesDialogContentWrapper.classList.add('adw-preferences-dialog-content-wrapper');

        // Create or get adw-view-switcher
        // For now, assume adw-view-switcher is a WC that accepts view children with view-name and view-title
        const viewSwitcher = document.createElement('adw-view-switcher');
        viewSwitcher.setAttribute('label', "Preference Pages"); // Accessibility
        viewSwitcher.classList.add('adw-preferences-dialog-view-switcher');

        const pageElements = Array.from(this.children).filter(child =>
            child.matches('adw-preferences-page') || child.hasAttribute('slot') && child.getAttribute('slot') === 'page'
        );

        if (pageElements.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.textContent = "No preference pages are available.";
            emptyState.style.textAlign = 'center';
            emptyState.style.padding = 'var(--spacing-l)';
            preferencesDialogContentWrapper.appendChild(emptyState);
        } else {
            pageElements.forEach((pageElement, index) => {
                // The pageElement itself is the view content.
                // It needs view-name and view-title for the AdwViewSwitcher tabs.
                // We assume the user provides these on their <adw-preferences-page> elements.
                // If AdwViewSwitcher needs children to be direct, we clone.
                // If it can reference, we can just append. Let's assume it takes the live elements.
                // The AdwViewSwitcher should handle displaying the correct page.
                const clonedPage = pageElement.cloneNode(true); // Clone to avoid issues if original is moved/reused elsewhere

                // Ensure view-name and view-title are set for the view switcher
                if (!clonedPage.getAttribute('view-name')) {
                    clonedPage.setAttribute('view-name', clonedPage.getAttribute('name') || `page-${index}`);
                }
                if (!clonedPage.getAttribute('view-title')) {
                     clonedPage.setAttribute('view-title', clonedPage.getAttribute('title') || `Page ${index + 1}`);
                }
                viewSwitcher.appendChild(clonedPage);
            });

            const initialPageName = this.getAttribute('initial-page-name');
            if (initialPageName) {
                viewSwitcher.setAttribute('active-view', initialPageName);
            } else if (pageElements.length > 0) {
                // Default to first page if initial-page-name is not set
                const firstPageName = pageElements[0].getAttribute('view-name') || pageElements[0].getAttribute('name') || `page-0`;
                viewSwitcher.setAttribute('active-view', firstPageName);
            }
            preferencesDialogContentWrapper.appendChild(viewSwitcher);
        }

        this._internalDialog.appendChild(preferencesDialogContentWrapper);

        // Close Button
        const closeButton = document.createElement('adw-button');
        closeButton.setAttribute('slot', 'buttons');
        closeButton.textContent = "Close";
        closeButton.setAttribute('suggested', '');
        closeButton.addEventListener('click', () => this.close());
        this._internalDialog.appendChild(closeButton);

        // Forward close event
        this._internalDialog.addEventListener('close', () => {
            if (this.hasAttribute('open')) { this.removeAttribute('open'); }
            this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
        });
    }

    // Getter for testing, to access the internal dialog element created by AdwDialog WC
    get dialogElementForTesting() {
        return this._internalDialog ? this._internalDialog._dialogElement : null;
    }


    open() {
        if (!this._internalDialog) {
            this._buildInternalDialogDOM();
        }
        if (this._internalDialog) this._internalDialog.setAttribute('open', '');
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
    }

    close() {
        if (this._internalDialog && this._internalDialog.hasAttribute('open')) {
            this._internalDialog.removeAttribute('open');
        }
        if (this.hasAttribute('open')) {
            this.removeAttribute('open');
        }
        // Internal dialog's close event listener handles dispatching our 'close' event.
    }
}
// No customElements.define here as it's done in the main components.js file.
