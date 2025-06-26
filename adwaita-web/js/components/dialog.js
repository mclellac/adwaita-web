import { adwGenerateId, getAdwCommonStyleSheet } from './utils.js'; // Import getAdwCommonStyleSheet
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

  if (opts.closeOnBackdropClick === false) {
    adwDialogWC.setAttribute('close-on-backdrop-click', 'false');
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
  return adwDialogWC;
}

/**
 * @element adw-dialog
 * @description A modal dialog component that overlays the current page.
 * It leverages the native HTML `<dialog>` element for core modality and backdrop functionality.
 *
 * @attr {String} [title] - The title displayed at the top of the dialog.
 * @attr {Boolean} [open] - If present, the dialog is displayed. Can be set/removed to control visibility.
 * @attr {Boolean} [close-on-backdrop-click="true"] - If set to "false", clicking on the backdrop will not close the dialog.
 *                                                 Defaults to true (dialog closes on backdrop click).
 *
 * @slot content - Used to project the main content of the dialog. If not specified, default slotted children go here.
 * @slot buttons - Used to project buttons into the dialog's action/footer area.
 *                 If no buttons are slotted, a default "Close" button is added.
 *
 * @csspart dialog - The native `<dialog>` element within the Shadow DOM.
 * @csspart title - The title element within the dialog.
 * @csspart content - The container for the content slot.
 * @csspart buttons - The container for the buttons slot.
 *
 * @fires open - Dispatched when the dialog becomes fully open and visible.
 * @fires close - Dispatched when the dialog becomes fully closed and hidden (after the native 'close' event).
 *
 * @example
 * <adw-dialog title="My Dialog" id="myDialog">
 *   <p slot="content">This is the content of the dialog.</p>
 *   <adw-button slot="buttons" on:click="document.getElementById('myDialog').close()">Custom Close</adw-button>
 * </adw-dialog>
 * <script>
 *   document.getElementById('myDialog').open();
 * </script>
 */
export class AdwDialog extends HTMLElement {
    /** @internal */
    static get observedAttributes() { return ['title', 'close-on-backdrop-click', 'open']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._nativeDialogElement = null; // This will be the HTML <dialog> element
        this._isOpen = false; // Internal state of AdwDialog component
        this._isProcessingOpenClose = false; // Guard for open/close operations
    }

    /** @internal */
    _fallbackLoadStylesheet() {
        if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
            if (styleLink.href) {
                this.shadowRoot.appendChild(styleLink);
            } else {
                console.warn("AdwDialog: Fallback stylesheet Adw.config.cssPath is not defined.");
            }
        }
    }

    /** @internal */
    async connectedCallback() {
        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
            try {
                const commonSheet = await getAdwCommonStyleSheet();
                if (commonSheet && !this.shadowRoot.adoptedStyleSheets.includes(commonSheet)) {
                    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, commonSheet];
                } else if (!commonSheet) {
                    this._fallbackLoadStylesheet();
                }
            } catch (error) {
                this._fallbackLoadStylesheet();
            }
        } else {
            this._fallbackLoadStylesheet();
        }

        if (!this._nativeDialogElement) {
            this._buildDialogDOM(); // Ensure dialog structure is built on connect
        }

        if (this.hasAttribute('open') && !this._isOpen) {
            this.open();
        }
    }

    /** @internal */
    disconnectedCallback() {
        // If the element is removed from DOM while open, ensure the native dialog is closed.
        if (this._nativeDialogElement && this._nativeDialogElement.hasAttribute('open')) {
            this._nativeDialogElement.close(); // This will trigger its 'close' event
        }
        this._isOpen = false; // Reset state
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            const shouldBeOpen = newValue !== null;
            if (shouldBeOpen && !this._isOpen) {
                this.open();
            } else if (!shouldBeOpen && this._isOpen) {
                this.close();
            }
        } else { // title, close-on-backdrop-click
            // Rebuild DOM if attributes change that affect structure
            // This is a simple approach; more granular updates could be implemented.
            if (this.isConnected) { // Only rebuild if connected
                 const wasOpen = this._isOpen;
                 if (wasOpen) this.close(); // Close before rebuilding if it was open
                 this._buildDialogDOM();
                 if (wasOpen) this.open(); // Reopen if it was open
            }
        }
    }

    /** @internal */
    _buildDialogDOM() {
        // Clear previous shadow DOM content (excluding adopted stylesheets or fallback link)
        const nodesToRemove = [];
        for (const child of this.shadowRoot.childNodes) {
            if (child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')) {
                nodesToRemove.push(child);
            }
        }
        nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));

        this._nativeDialogElement = document.createElement('dialog');
        this._nativeDialogElement.part.add('dialog'); // For external styling

        const titleText = this.getAttribute('title');
        if (titleText) {
            const titleId = adwGenerateId('adw-dialog-title');
            this._nativeDialogElement.setAttribute('aria-labelledby', titleId);
            const titleEl = document.createElement('div');
            titleEl.classList.add('adw-dialog-title');
            titleEl.part.add('title');
            titleEl.id = titleId;
            titleEl.textContent = titleText;
            this._nativeDialogElement.appendChild(titleEl);
        }

        const contentEl = document.createElement('div');
        contentEl.classList.add('adw-dialog-content');
        contentEl.part.add('content');
        const contentSlotElement = document.createElement('slot');
        contentSlotElement.name = 'content';
        const defaultContentSlotElement = document.createElement('slot'); // For default slotted children
        contentEl.appendChild(contentSlotElement);
        contentEl.appendChild(defaultContentSlotElement);
        this._nativeDialogElement.appendChild(contentEl);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('adw-dialog-buttons');
        buttonsContainer.part.add('buttons');
        const buttonsSlotElement = document.createElement('slot');
        buttonsSlotElement.name = 'buttons';
        buttonsContainer.appendChild(buttonsSlotElement);
        this._nativeDialogElement.appendChild(buttonsContainer);

        this.shadowRoot.appendChild(this._nativeDialogElement);

        buttonsSlotElement.addEventListener('slotchange', () => {
            this._ensureDefaultButton(buttonsContainer, buttonsSlotElement);
        });
        this._ensureDefaultButton(buttonsContainer, buttonsSlotElement); // Initial check

        // Event listener for backdrop click
        this._nativeDialogElement.addEventListener('click', (event) => {
            if (event.target === this._nativeDialogElement) { // Clicked on the dialog's backdrop pseudo-element
                if (this.getAttribute('close-on-backdrop-click') !== 'false') {
                    this.close(); // Calls AdwDialog's close method
                }
            }
        });

        // Listen to the native 'close' event to sync state and dispatch custom event
        this._nativeDialogElement.addEventListener('close', () => {
            this._isOpen = false; // Update AdwDialog's internal state
            if (this.hasAttribute('open')) {
                this.removeAttribute('open'); // Sync AdwDialog's 'open' attribute
            }
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
            this._isProcessingOpenClose = false;
        });

        // Optional: Listen to 'cancel' event if specific Escape key handling is needed
        this._nativeDialogElement.addEventListener('cancel', (event) => {
            // Native dialog fires 'cancel' then 'close' on Escape.
            // If we wanted to prevent Escape closure under certain conditions:
            // if (!this.allowEscapeToClose) event.preventDefault();
            // If prevented, the 'close' event on _nativeDialogElement won't fire.
            // For AdwDialog, default behavior (Escape closes) is usually desired.
        });
    }

    /** @internal */
    _ensureDefaultButton(buttonsContainer, buttonsSlotElement) {
        const existingDefaultButton = buttonsContainer.querySelector('.adw-dialog-default-button');
        const assignedNodes = buttonsSlotElement.assignedNodes({ flatten: true });
        const hasUserProvidedButtons = assignedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.tagName.toLowerCase() === 'adw-button' || node.tagName.toLowerCase() === 'button')
        );

        if (!hasUserProvidedButtons && !existingDefaultButton) {
            const defaultButton = createAdwButton('Close', { suggested: true });
            defaultButton.classList.add('adw-dialog-default-button');
            defaultButton.addEventListener('click', () => this.close());
            buttonsContainer.appendChild(defaultButton);
        } else if (hasUserProvidedButtons && existingDefaultButton) {
            existingDefaultButton.remove();
        }
    }

    /** @internal */
    _trapFocus(event) {
        // The native <dialog> element handles basic focus trapping when opened with showModal().
        // This custom trapping logic might conflict or be redundant.
        // It should be tested if this is still needed. For now, we'll keep it,
        // but it might be removable if native trapping is sufficient.
        if (!this._nativeDialogElement || !this._nativeDialogElement.hasAttribute('open')) return;

        const focusableElements = Array.from(this._nativeDialogElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
                                     .filter(el => el.offsetParent !== null && !el.disabled && el.tabIndex !== -1);
        if (focusableElements.length === 0) { event.preventDefault(); return; }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Check if the event target (document.activeElement) is within the shadow DOM of this component
        let activeElementIsInside = false;
        let currentElement = document.activeElement;
        while(currentElement && currentElement !== document.body) {
            if (currentElement.shadowRoot === this.shadowRoot) {
                activeElementIsInside = true;
                break;
            }
            currentElement = currentElement.host || currentElement.parentNode;
        }
        // If focus is outside, this trapping logic might not be robust.
        // However, native <dialog> should keep focus inside.

        if (event.shiftKey) {
            if (document.activeElement === firstElement || this.shadowRoot.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement || this.shadowRoot.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }


    open() {
        if (this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (!this._nativeDialogElement || !this.shadowRoot.contains(this._nativeDialogElement)) {
            // Ensure DOM is built if called before connectedCallback or after attribute changes
            this._buildDialogDOM();
        }

        if (this._nativeDialogElement && typeof this._nativeDialogElement.showModal === 'function') {
            this._nativeDialogElement.showModal(); // This makes it modal and visible
            this._isOpen = true; // AdwDialog's state
            if (!this.hasAttribute('open')) {
                this.setAttribute('open', ''); // Sync AdwDialog's attribute
            }
            // Native <dialog> handles initial focus.
            // Custom focus trapping via _trapFocus might still be used for Tab key.
            // Add keydown listener for Tab when dialog is open
            this._nativeDialogElement.addEventListener('keydown', this._onDialogKeyDown);


            this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
        } else {
            console.error("AdwDialog: Native dialog element not available or showModal not supported.");
        }
        this._isProcessingOpenClose = false;
    }

    close() {
        // AdwDialog's close method primarily calls close on the native dialog.
        // The native dialog's 'close' event listener will handle updating AdwDialog's state.
        if (!this._isOpen && !this._isProcessingOpenClose && !(this._nativeDialogElement && this._nativeDialogElement.hasAttribute('open'))) {
             // If AdwDialog thinks it's closed, and native dialog also seems closed, do nothing.
             // This can prevent issues if close() is called multiple times.
            return;
        }
        // this._isProcessingOpenClose = true; // This guard might be more complex now with async native close

        if (this._nativeDialogElement && typeof this._nativeDialogElement.close === 'function') {
            if (this._nativeDialogElement.hasAttribute('open')) { // Only call if native dialog is open
                this._nativeDialogElement.close();
            } else {
                 // If native dialog is already closed, but our state is lagging, sync it.
                 if (this._isOpen) {
                    this._isOpen = false;
                    if (this.hasAttribute('open')) this.removeAttribute('open');
                    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
                }
            }
        } else {
            console.error("AdwDialog: Native dialog element not available or close not supported.");
             // Fallback state sync if native element is missing
            this._isOpen = false;
            if (this.hasAttribute('open')) this.removeAttribute('open');
        }
        // The native 'close' event handler will manage _isProcessingOpenClose = false.
        // Remove keydown listener for Tab
        if (this._nativeDialogElement) {
            this._nativeDialogElement.removeEventListener('keydown', this._onDialogKeyDown);
        }
    }

     _onDialogKeyDown = (e) => { // Bound method for adding/removing listener
        if (e.key === 'Tab') this._trapFocus(e);
        // Escape is handled by native dialog's 'cancel' event
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

/**
 * @element adw-alert-dialog
 * @description A specialized dialog for presenting alerts or simple confirmations to the user.
 * It typically includes a heading, body text, and one or more choices (buttons).
 * This component wraps an `AdwDialog` internally.
 *
 * @attr {String} [heading] - The main heading or title of the alert dialog.
 * @attr {String} [body] - The primary message or body text of the alert. This is ignored if the `body-content` slot is used.
 * @attr {Boolean} [open] - If present, the dialog is displayed. Controls visibility.
 * @attr {Boolean} [close-on-backdrop-click="false"] - If set to "true", clicking on the backdrop will close the alert dialog.
 *                                                 Defaults to "false" for alert dialogs (requires explicit action).
 *
 * @slot body-content - Used to project custom HTML content into the body of the alert.
 *                      If this slot is used, the `body` attribute is ignored.
 * @slot choice - Used to provide custom button elements as choices. Each slotted element should be a `<button>`
 *                or `<adw-button>`. It should have text content for the label.
 *                A `value` attribute on the slotted button will be used in the `response` event.
 *                A `data-style="suggested|destructive"` attribute can style the button.
 *                If no choices are slotted, a default "OK" button is provided.
 *
 * @fires response - Dispatched when a choice button is clicked. The `event.detail.value` contains the
 *                   value of the choice (or its text content if no value is set). The dialog closes after this.
 * @fires close - Dispatched when the dialog is closed (either by a choice or programmatically).
 *
 * @example
 * <adw-alert-dialog id="myAlert" heading="Confirm Action" body="Are you sure you want to proceed?">
 *   <button slot="choice" value="cancel">Cancel</button>
 *   <button slot="choice" value="confirm" data-style="suggested">Confirm</button>
 * </adw-alert-dialog>
 * <script>
 *   const alert = document.getElementById('myAlert');
 *   alert.addEventListener('response', (e) => console.log('Response:', e.detail.value));
 *   alert.open();
 * </script>
 */
export class AdwAlertDialog extends HTMLElement {
    /** @internal */
    static get observedAttributes() { return ['heading', 'body', 'open', 'close-on-backdrop-click']; }

    /**
     * Creates an instance of AdwAlertDialog.
     * @constructor
     */
    constructor() {
        super();
        this._internalDialog = null;
        // this._choices = []; // This seems unused, consider removing if confirmed.
        this._isOpen = false;
        this._isProcessingOpenClose = false;
    }

    /** @internal */
    connectedCallback() {
        if (this.hasAttribute('open') && !this._isOpen) {
            this.open();
        }
    }

    /** @internal */
    disconnectedCallback() {
        if (this._isOpen) {
            this.close();
        }
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            const shouldBeOpen = newValue !== null;
            if (shouldBeOpen && !this._isOpen) {
                this.open();
            } else if (!shouldBeOpen && this._isOpen) {
                this.close();
            }
        } else { // heading, body, close-on-backdrop-click
            if (this._isOpen) {
                const currentOpenAttr = this.hasAttribute('open');
                this.close();
                this._internalDialog = null;
                if (currentOpenAttr) {
                    this.open();
                }
            } else {
                this._internalDialog = null; // Mark for rebuild on next open
            }
        }
    }

    /**
     * @internal
     * Builds the internal `AdwDialog` instance that this `AdwAlertDialog` wraps.
     * It configures the internal dialog with content, heading, and choices based on
     * the attributes and slotted content of this component.
     */
    _buildInternalDialog() {
        // Ensure this._internalDialog is fresh if we are rebuilding.
        // The attributeChangedCallback handles nullifying it before calling open->build.
        // if (this._internalDialog) { ... } // This check might be redundant here if open() ensures it's null before build.

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
        console.log('[AdwAlertDialog._buildInternalDialog] Found choiceElements count:', choiceElements.length, choiceElements);

        if (choiceElements.length > 0) {
            choiceElements.forEach(el => {
                const button = document.createElement('adw-button');
                const buttonText = el.textContent.trim();
                const buttonValue = el.getAttribute('value') || buttonText;
                console.log('[AdwAlertDialog._buildInternalDialog] Creating choice button. Text:', buttonText, 'Value:', buttonValue);
                button.setAttribute('slot', 'buttons');
                button.textContent = buttonText;
                const style = el.dataset.style || el.getAttribute('data-style');
                if (style === 'suggested') button.setAttribute('suggested', '');
                if (style === 'destructive') button.setAttribute('destructive', '');

                button.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('response', { detail: { value: buttonValue } }));
                    this.close();
                });
                this._internalDialog.appendChild(button);
                console.log('[AdwAlertDialog._buildInternalDialog] Appended choice button to internal AdwDialog:', button);
            });
        } else {
            console.log('[AdwAlertDialog._buildInternalDialog] No choiceElements found, creating default OK button.');
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
            console.log('[AdwAlertDialog._buildInternalDialog] Appended default OK button to internal AdwDialog:', okButton);
        }

        // Forward the 'close' event from the internal dialog
        this._internalDialog.addEventListener('close', () => {
            // This event comes from the inner AdwDialog.
            // If AdwAlertDialog (this) still thinks it's open, sync its state.
            if (this._isOpen) {
                this._isOpen = false; // Update internal state FIRST
                if (this.hasAttribute('open')) {
                    this.removeAttribute('open'); // Sync attribute
                }
                this.dispatchEvent(new CustomEvent('close')); // Dispatch our own close event
            }
        });
    }

    /**
     * Opens the alert dialog.
     * If not already built, it constructs the internal `AdwDialog` first.
     * Sets the `open` attribute and manages internal state.
     */
    open() {
        if (this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (!this._internalDialog) { // Only build if it doesn't exist (or was nullified)
            this._buildInternalDialog();
        }

        if (this._internalDialog) {
            this._internalDialog.open(); // Call method on internal AdwDialog
        }

        this._isOpen = true;
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
        // AdwAlertDialog might dispatch its own 'open' event if needed,
        // but often the internal dialog's event is sufficient if it bubbles or is handled.
        // No separate 'open' event is dispatched by AdwAlertDialog itself; users can listen on the internal dialog if necessary,
        // or rely on the fact that `open()` call completion implies it's opening.
        this._isProcessingOpenClose = false;
    }

    /**
     * Closes the alert dialog.
     * Manages internal state and removes the `open` attribute.
     * A 'close' event is dispatched when the dialog is fully closed (forwarded from the internal dialog).
     */
    close() {
        if (!this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (this._internalDialog) { // Check if _internalDialog exists
            this._internalDialog.close(); // Call method on internal AdwDialog
        }

        this._isOpen = false;
        if (this.hasAttribute('open')) {
            this.removeAttribute('open');
        }
        // The event listener on _internalDialog's 'close' event handles dispatching
        // this AdwAlertDialog's 'close' event.
        this._isProcessingOpenClose = false;
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

/**
 * @element adw-about-dialog
 * @description A dialog for displaying information about an application, including its name, version,
 * copyright, developers, and license. It wraps an `AdwDialog` internally.
 *
 * @attr {String} [app-name] - The name of the application.
 * @attr {String} [app-icon] - The icon name for the application (used with `Adw.createIcon`).
 * @attr {String} [logo] - URL to an image asset for the application's logo. Takes precedence over `app-icon`.
 * @attr {String} [version] - The version number of the application.
 * @attr {String} [copyright] - Copyright statement (e.g., "© 2023 Your Name").
 * @attr {String} [developer-name] - Primary developer or organization name.
 * @attr {String} [website] - URL to the application's or developer's website.
 * @attr {String} [website-label] - Custom label for the website link (defaults to the URL).
 * @attr {String} [license-type] - Short description of the license (e.g., "GNU GPL v3.0 or later").
 *                                 Full license text can be provided via the `license-text` slot.
 * @attr {String} [comments] - A short description or comments about the application.
 *                            This is ignored if the `comments` slot is used.
 * @attr {String} [developers] - Comma-separated list of developer names. Alternatively, use the `developers-list` slot.
 * @attr {String} [documenters] - Comma-separated list of documenter names. Alternatively, use the `documenters-list` slot.
 * @attr {String} [designers] - Comma-separated list of designer names. Alternatively, use the `designers-list` slot.
 * @attr {String} [artists] - Comma-separated list of artist names. Alternatively, use the `artists-list` slot.
 * @attr {String} [translators] - Comma-separated list of translator names. Alternatively, use the `translators-list` slot.
 * @attr {Boolean} [open] - If present, the dialog is displayed.
 *
 * @slot comments - Used to project custom HTML content for the application comments. Overrides the `comments` attribute.
 * @slot license-text - Used to project pre-formatted full license text. Often used with a `<pre>` tag.
 * @slot details - Used to project completely custom content into the "Details" expander section.
 *                 Overrides default lists like developers, documenters, etc.
 * @slot developers-list - Slot for `<li>` elements listing developers. Overrides `developers` attribute.
 * @slot documenters-list - Slot for `<li>` elements listing documenters. Overrides `documenters` attribute.
 * @slot designers-list - Slot for `<li>` elements listing designers. Overrides `designers` attribute.
 * @slot artists-list - Slot for `<li>` elements listing artists. Overrides `artists` attribute.
 * @slot translators-list - Slot for `<li>` elements listing translators. Overrides `translators` attribute.
 * @slot - Default slot can be used for comments if the `comments` attribute or `comments` named slot is not used.
 *
 * @fires close - Dispatched when the dialog is closed.
 *
 * @example
 * <adw-about-dialog id="aboutApp"
 *   app-name="My Awesome App"
 *   version="1.2.3"
 *   copyright="© 2023 Cool Coders Inc."
 *   developer-name="Cool Coders Inc."
 *   website="https://example.com"
 *   license-type="MIT License"
 *   comments="This app does awesome things!"
 *   developers="Jane Doe,John Smith">
 *   <pre slot="license-text">Permission is hereby granted...</pre>
 * </adw-about-dialog>
 * <script>document.getElementById('aboutApp').open();</script>
 */
export class AdwAboutDialog extends HTMLElement {
    /** @internal */
    static get observedAttributes() { return ['app-name', 'open', /* other attributes from _gatherOptions */ 'app-icon', 'logo', 'version', 'copyright', 'developer-name', 'website', 'website-label', 'license-type', 'comments', 'developers', 'documenters', 'designers', 'artists', 'translators']; }

    /**
     * Creates an instance of AdwAboutDialog.
     * @constructor
     */
    constructor() {
        super();
        // Removed _dialogInstance, using _internalDialog
        this._slotObserver = new MutationObserver(() => this._rebuildOnSlotChange());
        this._internalDialog = null;
        this._isOpen = false;
        this._isProcessingOpenClose = false;
    }

    /** @internal */
    connectedCallback() {
        // Observe direct children for slot changes, not full subtree for performance.
        this._slotObserver.observe(this, { childList: true, attributes: true, attributeFilter: ['slot'] });
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    /** @internal */
    disconnectedCallback() {
        this._slotObserver.disconnect();
        if (this._internalDialog) this.close(); // Use this.close to manage state
    }

    /** @internal */
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

    /** @internal */
    _closeInternalDialog(dispatchHostEvent = true) {
        if (this._internalDialog && this._internalDialog.hasAttribute('open')) {
            this._internalDialog.removeAttribute('open');
        }
        // AdwDialog's own close method will handle removing from DOM etc.
        // If dispatchHostEvent is true, AdwAboutDialog's close method will handle attribute and event.
    }

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            const shouldBeOpen = newValue !== null;
            if (shouldBeOpen && !this._isOpen) {
                this.open();
            } else if (!shouldBeOpen && this._isOpen) {
                this.close();
            }
        } else { // For other attributes
            if (this._isOpen) { // If open, rebuild immediately
                const currentOpenAttr = this.hasAttribute('open');
                this.close(); // This sets _isOpen = false, removes 'open' attr
                this._internalDialog = null; // Mark for rebuild
                if (currentOpenAttr) { // If it was meant to stay open
                    this.open();
                }
            } else { // If closed, just mark for rebuild on next open
                this._internalDialog = null;
            }
        }
    }

    /**
     * @internal
     * Helper method to create a list section (e.g., for developers, documenters)
     * using either slotted `<li>` elements or a comma-separated attribute string.
     * @param {string} title - The title for this section (e.g., "Developers").
     * @param {string} itemsSlotName - The name of the slot for `<li>` items (e.g., "developers-list").
     * @param {string} itemsArrayFallbackAttr - The name of the attribute containing a comma-separated list (e.g., "developers").
     * @returns {HTMLDivElement|null} The created section element or null if no items.
     */
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

    /**
     * @internal
     * Builds the internal `AdwDialog` instance that this `AdwAboutDialog` wraps.
     * It constructs the complex layout of the about dialog, including header,
     * application info, comments, contributor lists, and license information,
     * based on attributes and slotted content.
     */
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

    /** @internal */
    _openInternalDialog() {
        if (this._internalDialog) {
             this._internalDialog.setAttribute('open', '');
        }
    }

    /**
     * Opens the About dialog.
     * Builds the dialog DOM if not already built, then shows it.
     * Sets the `open` attribute.
     */
    open() {
        if (this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (!this._internalDialog) {
            this._buildInternalDialogDOM();
        }
        if (this._internalDialog) {
            this._internalDialog.open(); // Call method on internal AdwDialog
        }

        this._isOpen = true;
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
        // AdwDialog's open event will bubble if this._internalDialog dispatches it.
        // Or, AdwAboutDialog can dispatch its own 'open' event if distinct behavior is needed.
        // For now, no separate 'open' event.
        this._isProcessingOpenClose = false;
    }

    /**
     * Closes the About dialog.
     * Removes the `open` attribute. A 'close' event is dispatched when fully closed.
     */
    close() {
        if (!this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (this._internalDialog) {
            this._internalDialog.close(); // Call method on internal AdwDialog
        }

        this._isOpen = false;
        if (this.hasAttribute('open')) {
            this.removeAttribute('open');
        }
        // The event listener on _internalDialog's 'close' event (added in _buildInternalDialogDOM)
        // should handle dispatching AdwAboutDialog's own 'close' event.
        this._isProcessingOpenClose = false;
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

/**
 * @element adw-preferences-dialog
 * @description A dialog for presenting application preferences, typically organized into navigable pages.
 * It uses an `AdwViewSwitcher` internally to manage different preference pages and wraps an `AdwDialog`.
 *
 * @attr {String} [title="Preferences"] - The title of the preferences dialog.
 * @attr {Boolean} [open] - If present, the dialog is displayed.
 * @attr {String} [initial-page-name] - The `name` attribute of the `adw-preferences-page`
 *                                     or slotted page element that should be initially visible.
 *                                     If not set, the first page is shown.
 *
 * @slot page - Used to project `adw-preferences-page` elements (or other elements acting as pages)
 *              into the dialog. Each page element should have a `name` attribute (for `initial-page-name`
 *              and view switcher navigation) and a `title` attribute (for the view switcher tab label).
 *              If `title` is missing, it defaults to "Page X". If `name` is missing, it defaults to "page-X".
 *
 * @fires close - Dispatched when the dialog is closed.
 *
 * @example
 * <adw-preferences-dialog id="prefsDialog" initial-page-name="general">
 *   <adw-preferences-page slot="page" name="general" title="General">
 *     <!-- General preference controls -->
 *     <adw-entry-row title="Username"></adw-entry-row>
 *   </adw-preferences-page>
 *   <adw-preferences-page slot="page" name="appearance" title="Appearance">
 *     <!-- Appearance preference controls -->
 *     <adw-switch title="Dark Mode"></adw-switch>
 *   </adw-preferences-page>
 * </adw-preferences-dialog>
 * <script>document.getElementById('prefsDialog').open();</script>
 */
export class AdwPreferencesDialog extends HTMLElement {
    /** @internal */
    static get observedAttributes() { return ['title', 'open', 'initial-page-name']; }

    /**
     * Creates an instance of AdwPreferencesDialog.
     * @constructor
     */
    constructor() {
        super();
        // Removed _dialogInstance
        this._slotObserver = new MutationObserver(() => this._rebuildOnSlotChange());
        this._internalDialog = null;
        this._isOpen = false;
        this._isProcessingOpenClose = false;
    }

    /** @internal */
    connectedCallback() {
        // Observe direct children for adw-preferences-page or similar
        this._slotObserver.observe(this, { childList: true, attributes: true, attributeFilter: ['slot', 'name', 'title'] });
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    /** @internal */
    disconnectedCallback() {
        this._slotObserver.disconnect();
        if (this._internalDialog) this.close();
    }

    /** @internal */
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

    /** @internal */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            const shouldBeOpen = newValue !== null;
            if (shouldBeOpen && !this._isOpen) {
                this.open();
            } else if (!shouldBeOpen && this._isOpen) {
                this.close();
            }
        } else { // title, initial-page-name
            if (this._isOpen) {
                const currentOpenAttr = this.hasAttribute('open');
                this.close();
                this._internalDialog = null; // Mark for rebuild
                if (currentOpenAttr) {
                    this.open();
                }
            } else {
                this._internalDialog = null; // Mark for rebuild on next open
            }
        }
    }

    /**
     * @internal
     * Builds the internal `AdwDialog` instance that this `AdwPreferencesDialog` wraps.
     * It constructs the layout with an `AdwViewSwitcher` to manage the slotted preference pages.
     */
    _buildInternalDialogDOM() {
        this._internalDialog = document.createElement('adw-dialog');
        this._internalDialog.classList.add('adw-preferences-dialog-base'); // For styling hook
        this._internalDialog.setAttribute('title', this.getAttribute('title') || "Preferences");
        // Preferences dialogs are usually larger
        // Apply styles directly to the <adw-dialog> host element
        this._internalDialog.style.setProperty('--adw-dialog-min-width', '600px'); // Assuming AdwDialog uses this CSS var
        this._internalDialog.style.setProperty('--adw-dialog-min-height', '400px'); // Assuming AdwDialog uses this CSS var
        // If AdwDialog doesn't use CSS variables for this, direct style might be needed,
        // or AdwDialog needs to be updated to support sizing via attributes or CSS vars.
        // Forcing style on host:
        // this._internalDialog.style.minWidth = '600px'; // This might not work as expected depending on AdwDialog's CSS
        // this._internalDialog.style.minHeight = '400px';
        // The most robust way would be for AdwDialog to have attributes for size or use parts for styling.
        // For now, using CSS variables is a common pattern. If these vars are not standard,
        // this styling might not take effect as intended without changes to AdwDialog's CSS.

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

    /**
     * Opens the Preferences dialog.
     * Builds the dialog DOM if not already built, then shows it.
     * Sets the `open` attribute.
     */
    open() {
        if (this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (!this._internalDialog) {
            this._buildInternalDialogDOM();
        }
        if (this._internalDialog) {
            this._internalDialog.open(); // Call method
        }

        this._isOpen = true;
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
        this._isProcessingOpenClose = false;
    }

    /**
     * Closes the Preferences dialog.
     * Removes the `open` attribute. A 'close' event is dispatched when fully closed.
     */
    close() {
        if (!this._isOpen || this._isProcessingOpenClose) return;
        this._isProcessingOpenClose = true;

        if (this._internalDialog) {
            this._internalDialog.close(); // Call method
        }

        this._isOpen = false;
        if (this.hasAttribute('open')) {
            this.removeAttribute('open');
        }
        // Event listener on _internalDialog's 'close' handles AdwPreferencesDialog's 'close' event.
        this._isProcessingOpenClose = false;
    }
}
// No customElements.define here as it's done in the main components.js file.
