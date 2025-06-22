export class AdwBottomSheet extends HTMLElement {
    static get observedAttributes() {
        return [
            'open',
            'modal',
            'show-drag-handle',
            'reveal-bottom-bar',
            'can-open',
            'can-close',
            'full-width',
            'align'
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._open = false;
        this._modal = true;
        this._showDragHandle = true;
        this._revealBottomBar = true;
        this._canOpen = true;
        this._canClose = true;
        this._fullWidth = true;
        this._align = 'fill';
        this._previousActiveElement = null;

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath)
            ? Adw.config.cssPath
            : ''; /* Expect Adw.config.cssPath to be set */

        this._backdropElement = document.createElement('div');
        this._backdropElement.classList.add('backdrop');
        this._backdropElement.style.display = 'none';

        this._containerElement = document.createElement('div');
        this._containerElement.classList.add('container');

        this._contentSlot = document.createElement('slot'); // Default slot for main persistent content

        this._bottomBarArea = document.createElement('div');
        this._bottomBarArea.classList.add('bottom-bar-area');
        this._bottomBarSlot = document.createElement('slot');
        this._bottomBarSlot.name = 'bottom-bar';
        this._bottomBarArea.appendChild(this._bottomBarSlot);

        this._sheetArea = document.createElement('div');
        this._sheetArea.classList.add('sheet-area');
        this._dragHandleElement = document.createElement('div');
        this._dragHandleElement.classList.add('drag-handle');
        this._sheetSlot = document.createElement('slot');
        this._sheetSlot.name = 'sheet';
        this._sheetArea.append(this._dragHandleElement, this._sheetSlot);

        this._containerElement.append(this._contentSlot, this._bottomBarArea, this._sheetArea);
        this.shadowRoot.append(styleLink, this._backdropElement, this._containerElement);

        this._boundOnBackdropClick = this._onBackdropClick.bind(this);
        this._boundOnDragHandleClick = this._onDragHandleClick.bind(this);
        this._boundOnBottomBarClick = this._onBottomBarClick.bind(this);
        this._boundOnKeyDown = this._onKeyDown.bind(this);
    }

    connectedCallback() {
        // Initialize properties from attributes once
        if (this.hasAttribute('open')) this._open = true;
        if (this.hasAttribute('modal') && this.getAttribute('modal') === 'false') this._modal = false; else this._modal = true;
        if (this.hasAttribute('show-drag-handle') && this.getAttribute('show-drag-handle') === 'false') this._showDragHandle = false; else this._showDragHandle = true;
        if (this.hasAttribute('reveal-bottom-bar') && this.getAttribute('reveal-bottom-bar') === 'false') this._revealBottomBar = false; else this._revealBottomBar = true;
        if (this.hasAttribute('can-open') && this.getAttribute('can-open') === 'false') this._canOpen = false; else this._canOpen = true;
        if (this.hasAttribute('can-close') && this.getAttribute('can-close') === 'false') this._canClose = false; else this._canClose = true;
        if (this.hasAttribute('full-width') && this.getAttribute('full-width') === 'false') this._fullWidth = false; else this._fullWidth = true;
        this._align = this.getAttribute('align') || 'fill';

        this._upgradeProperty('open');
        this._upgradeProperty('modal');
        this._upgradeProperty('showDragHandle');
        this._upgradeProperty('revealBottomBar');
        this._upgradeProperty('canOpen');
        this._upgradeProperty('canClose');
        this._upgradeProperty('fullWidth');
        this._upgradeProperty('align');
        this._render();
        this._attachListeners();
    }

    disconnectedCallback() {
        this._detachListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Determine the correct boolean value from attribute presence or "false" string
        const isFalseString = newValue === 'false';
        const booleanValue = newValue !== null && !isFalseString;
        let internalPropChanged = false;

        switch (name) {
            case 'open': if (this._open !== booleanValue) { this.open = booleanValue; internalPropChanged = true;} break;
            case 'modal': if (this._modal !== booleanValue) { this.modal = booleanValue; internalPropChanged = true;} break;
            case 'show-drag-handle': if (this._showDragHandle !== booleanValue) { this.showDragHandle = booleanValue; internalPropChanged = true;} break;
            case 'reveal-bottom-bar': if (this._revealBottomBar !== booleanValue) { this.revealBottomBar = booleanValue; internalPropChanged = true;} break;
            case 'can-open': if (this._canOpen !== booleanValue) { this.canOpen = booleanValue; internalPropChanged = true;} break;
            case 'can-close': if (this._canClose !== booleanValue) { this.canClose = booleanValue; internalPropChanged = true;} break;
            case 'full-width': if (this._fullWidth !== booleanValue) { this.fullWidth = booleanValue; internalPropChanged = true;} break;
            case 'align': if (this._align !== (newValue || 'fill')) { this.align = newValue || 'fill'; internalPropChanged = true;} break;
        }
        // if (internalPropChanged) this._render(); // Setters should call render if they change the internal state.
    }

    get open() { return this._open; }
    set open(value) {
        const isOpen = Boolean(value);
        if (this._open === isOpen) return;
        if (isOpen && !this._canOpen) return;
        if (!isOpen && !this._canClose) {
            this.dispatchEvent(new CustomEvent('close-attempt', { bubbles: true, composed: true }));
            return;
        }
        this._open = isOpen;
        if (this._open) {
            this.setAttribute('open', '');
            this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
            if (this._modal) {
                this._previousActiveElement = document.activeElement;
                const firstFocusable = this._sheetArea.querySelector('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) firstFocusable.focus();
                else { this._sheetArea.setAttribute('tabindex', '-1'); this._sheetArea.focus(); }
            }
        } else {
            this.removeAttribute('open');
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
            if (this._modal && this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
                this._previousActiveElement.focus();
                this._previousActiveElement = null;
            }
            if (this._sheetArea.hasAttribute('tabindex')) this._sheetArea.removeAttribute('tabindex');
        }
        this._render();
    }

    get modal() { return this._modal; }
    set modal(value) {
        const isModal = Boolean(value);
        if (this._modal === isModal) return;
        this._modal = isModal;
        if (this._modal) this.setAttribute('modal', ''); else this.removeAttribute('modal');
        this._render();
    }

    get showDragHandle() { return this._showDragHandle; }
    set showDragHandle(value) {
        const show = Boolean(value);
        if (this._showDragHandle === show) return;
        this._showDragHandle = show;
        if (this._showDragHandle) this.setAttribute('show-drag-handle', ''); else this.removeAttribute('show-drag-handle');
        this._render();
    }

    get revealBottomBar() { return this._revealBottomBar; }
    set revealBottomBar(value) {
        const reveal = Boolean(value);
        if (this._revealBottomBar === reveal) return;
        this._revealBottomBar = reveal;
        if (this._revealBottomBar) this.setAttribute('reveal-bottom-bar', ''); else this.removeAttribute('reveal-bottom-bar');
        this._render();
    }

    get canOpen() { return this._canOpen; }
    set canOpen(value) {
        const can = Boolean(value);
        if (this._canOpen === can) return;
        this._canOpen = can;
        if (this._canOpen) this.setAttribute('can-open',''); else this.removeAttribute('can-open');
    }

    get canClose() { return this._canClose; }
    set canClose(value) {
        const can = Boolean(value);
        if (this._canClose === can) return;
        this._canClose = can;
        if (this._canClose) this.setAttribute('can-close',''); else this.removeAttribute('can-close');
    }

    get fullWidth() { return this._fullWidth; }
    set fullWidth(value) {
        const isFullWidth = Boolean(value);
        if (this._fullWidth === isFullWidth) return;
        this._fullWidth = isFullWidth;
        if (this._fullWidth) this.setAttribute('full-width', ''); else this.removeAttribute('full-width');
        this._render();
    }

    get align() { return this._align; }
    set align(value) {
        const newAlign = value || 'fill';
        if (this._align === newAlign) return;
        this._align = newAlign;
        this.setAttribute('align', this._align);
        this._render();
    }

    _upgradeProperty(prop) {
        if (this.hasOwnProperty(prop)) {
            let value = this[prop];
            delete this[prop];
            this[prop] = value;
        }
    }

    _attachListeners() {
        this._backdropElement.addEventListener('click', this._boundOnBackdropClick);
        this._dragHandleElement.addEventListener('click', this._boundOnDragHandleClick);
        this._bottomBarArea.addEventListener('click', this._boundOnBottomBarClick);
        // Keydown listener on document to catch Escape globally when modal and open
        document.addEventListener('keydown', this._boundOnKeyDown);
    }

    _detachListeners() {
        this._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
        this._dragHandleElement.removeEventListener('click', this._boundOnDragHandleClick);
        this._bottomBarArea.removeEventListener('click', this._boundOnBottomBarClick);
        document.removeEventListener('keydown', this._boundOnKeyDown);
    }

    _onKeyDown(event) {
        if (event.key === 'Escape' && this._open && this._modal && this._canClose) {
            this.open = false; // Use setter to trigger render and event
        }
    }

    _onBackdropClick() {
        if (this._open && this._modal && this._canClose) {
            this.open = false; // Use setter
        }
    }

    _onDragHandleClick() {
        if (this._open && !this._canClose) {
            this.dispatchEvent(new CustomEvent('close-attempt', { bubbles: true, composed: true }));
            return;
        }
        if (!this._open && !this._canOpen) return;
        this.open = !this._open; // Use setter
    }

    _onBottomBarClick(event) {
        let target = event.target;
        // Check if the click originated from an interactive element within the slot
        while(target && target !== this._bottomBarArea) {
            if (target.matches('button, a[href], input, [tabindex]:not([tabindex="-1"])') || target.hasAttribute('adw-interactive')) { // adw-interactive is a conceptual marker
                return;
            }
            target = target.parentElement;
        }
        // If click is on the bottom bar area itself (and not a slotted interactive element)
        if (!this._open && this._canOpen && this._revealBottomBar) {
            this.open = true; // Use setter
        }
    }

    _render() {
        this.classList.toggle('is-open', this._open); // Use :host selector with .is-open
        this.classList.toggle('is-modal', this._modal && this._open);

        this._backdropElement.style.display = (this._open && this._modal) ? 'block' : 'none';
        // sheetArea visibility is handled by :host(.is-open) .sheet-area in CSS
        // this._sheetArea.classList.toggle('visible', this._open); // No longer needed if CSS handles via :host
        this._dragHandleElement.style.display = this._showDragHandle ? 'flex' : 'none';
        this._bottomBarArea.style.display = (!this._open && this._revealBottomBar) ? 'flex' : 'none';

        this.classList.toggle('full-width', this._fullWidth); // For :host([full-width]) styling
        this.dataset.align = this._fullWidth ? 'fill' : this._align; // For :host([data-align="..."])
    }
}

export function createAdwBottomSheet(options = {}) {
  const opts = options || {};
  const bottomSheetWC = document.createElement('adw-bottom-sheet');

  // Set attributes based on options
  if (opts.open) bottomSheetWC.setAttribute('open', '');
  if (opts.modal === false) bottomSheetWC.setAttribute('modal', 'false');
  else if (opts.modal === true) bottomSheetWC.setAttribute('modal', ''); // Explicitly set if true

  if (opts.showDragHandle === false) bottomSheetWC.setAttribute('show-drag-handle', 'false');
  else if (opts.showDragHandle === true) bottomSheetWC.setAttribute('show-drag-handle', '');

  if (opts.revealBottomBar === false) bottomSheetWC.setAttribute('reveal-bottom-bar', 'false');
  else if (opts.revealBottomBar === true) bottomSheetWC.setAttribute('reveal-bottom-bar', '');

  if (opts.canOpen === false) bottomSheetWC.setAttribute('can-open', 'false');
  else if (opts.canOpen === true) bottomSheetWC.setAttribute('can-open', '');

  if (opts.canClose === false) bottomSheetWC.setAttribute('can-close', 'false');
  else if (opts.canClose === true) bottomSheetWC.setAttribute('can-close', '');

  if (opts.fullWidth === false) bottomSheetWC.setAttribute('full-width', 'false');
  else if (opts.fullWidth === true) bottomSheetWC.setAttribute('full-width', '');

  if (opts.align) bottomSheetWC.setAttribute('align', opts.align);

  // Slot content
  if (opts.content instanceof Node) {
    bottomSheetWC.appendChild(opts.content); // Default slot
  }
  if (opts.sheetContent instanceof Node) {
    opts.sheetContent.setAttribute('slot', 'sheet');
    bottomSheetWC.appendChild(opts.sheetContent);
  }
  if (opts.bottomBarContent instanceof Node) {
    opts.bottomBarContent.setAttribute('slot', 'bottom-bar');
    bottomSheetWC.appendChild(opts.bottomBarContent);
  }

  // Event listeners
  if (typeof opts.onOpen === 'function') {
    bottomSheetWC.addEventListener('open', opts.onOpen);
  }
  if (typeof opts.onClose === 'function') {
    bottomSheetWC.addEventListener('close', opts.onClose);
  }
   if (typeof opts.onCloseAttempt === 'function') {
    bottomSheetWC.addEventListener('close-attempt', opts.onCloseAttempt);
  }
  return bottomSheetWC;
}
