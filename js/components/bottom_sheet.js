class AdwBottomSheet extends HTMLElement {
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
            // Potentially 'sheet-height' and 'bottom-bar-height' if we manage these via CSS vars from attributes
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Initial state
        this._open = false;
        this._modal = true;
        this._showDragHandle = true;
        this._revealBottomBar = true;
        this._canOpen = true;
        this._canClose = true;
        this._fullWidth = true;
        this._align = 'fill'; // 'fill', 'start', 'center', 'end'

        // Create the style link
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        // Assuming Adw object will be available globally for config path
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath)
            ? Adw.config.cssPath
            : '/static/css/adwaita-web.css'; // Fallback

        // Core structural elements
        this._backdropElement = document.createElement('div');
        this._backdropElement.classList.add('backdrop');
        this._backdropElement.style.display = 'none'; // Initially hidden

        this._containerElement = document.createElement('div');
        this._containerElement.classList.add('container');

        this._contentSlot = document.createElement('slot'); // Default slot for main content

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

        // Assemble shadow DOM
        this._containerElement.append(this._contentSlot, this._bottomBarArea, this._sheetArea);
        this.shadowRoot.append(styleLink, this._backdropElement, this._containerElement);

        this._boundOnBackdropClick = this._onBackdropClick.bind(this);
        this._boundOnDragHandleClick = this._onDragHandleClick.bind(this);
        this._boundOnBottomBarClick = this._onBottomBarClick.bind(this);
        this._boundOnKeyDown = this._onKeyDown.bind(this);
        this._previousActiveElement = null;
    }

    connectedCallback() {
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
        const hasPropertyChanged = this[`_${name.replace(/-/g, '')}`] !== newValue; // Check against internal prop
        if (hasPropertyChanged || oldValue !== newValue) { // Ensure render if attribute changes even if internal prop was same (e.g. initial attr set)
            switch (name) {
                case 'open':
                    this.open = newValue !== null;
                    break;
                case 'modal':
                    this.modal = newValue !== null;
                    break;
                case 'show-drag-handle':
                    this.showDragHandle = newValue !== null;
                    break;
                case 'reveal-bottom-bar':
                    this.revealBottomBar = newValue !== null;
                    break;
                case 'can-open':
                    this.canOpen = newValue !== null;
                    break;
                case 'can-close':
                    this.canClose = newValue !== null;
                    break;
                case 'full-width':
                    this.fullWidth = newValue !== null;
                    break;
                case 'align':
                    this.align = newValue || 'fill';
                    break;
            }
        }
    }

    // Property definitions with reflection to attributes
    get open() { return this._open; }
    set open(value) {
        const isOpen = Boolean(value);
        if (this._open === isOpen) return;

        if (isOpen && !this.canOpen) {
            // Potentially dispatch 'open-attempt' if needed, or just ignore
            return;
        }
        if (!isOpen && !this.canClose) {
            this.dispatchEvent(new CustomEvent('close-attempt', { bubbles: true, composed: true }));
            return;
        }

        this._open = isOpen;
        if (this._open) {
            this.setAttribute('open', '');
            this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
            // Focus management
            if (this.modal) {
                this._previousActiveElement = document.activeElement;
                // Find first focusable element in the sheet and focus it
                const firstFocusable = this._sheetArea.querySelector(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (firstFocusable) {
                    firstFocusable.focus();
                } else {
                    // Fallback focus to the sheet area itself if no focusable content
                    this._sheetArea.setAttribute('tabindex', '-1');
                    this._sheetArea.focus();
                }
            }
        } else {
            this.removeAttribute('open');
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
            // Focus management
            if (this.modal && this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
                this._previousActiveElement.focus();
                this._previousActiveElement = null;
            }
            if (this._sheetArea.hasAttribute('tabindex')) {
                this._sheetArea.removeAttribute('tabindex');
            }
        }
        this._render();
    }

    get modal() { return this._modal; }
    set modal(value) {
        const isModal = Boolean(value);
        if (this._modal === isModal) return;
        this._modal = isModal;
        if (this._modal) this.setAttribute('modal', '');
        else this.removeAttribute('modal');
        this._render();
    }

    get showDragHandle() { return this._showDragHandle; }
    set showDragHandle(value) {
        const show = Boolean(value);
        if (this._showDragHandle === show) return;
        this._showDragHandle = show;
        if (this._showDragHandle) this.setAttribute('show-drag-handle', '');
        else this.removeAttribute('show-drag-handle');
        this._render();
    }

    get revealBottomBar() { return this._revealBottomBar; }
    set revealBottomBar(value) {
        const reveal = Boolean(value);
        if (this._revealBottomBar === reveal) return;
        this._revealBottomBar = reveal;
        if (this._revealBottomBar) this.setAttribute('reveal-bottom-bar', '');
        else this.removeAttribute('reveal-bottom-bar');
        this._render();
    }

    get canOpen() { return this._canOpen; }
    set canOpen(value) { this._canOpen = Boolean(value); /* Attribute reflection handled by attributeChangedCallback or direct set */ }

    get canClose() { return this._canClose; }
    set canClose(value) { this._canClose = Boolean(value); }

    get fullWidth() { return this._fullWidth; }
    set fullWidth(value) {
        const isFullWidth = Boolean(value);
        if (this._fullWidth === isFullWidth) return;
        this._fullWidth = isFullWidth;
        if (this._fullWidth) this.setAttribute('full-width', '');
        else this.removeAttribute('full-width');
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

    // Upgrade properties that may have been set before definition
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
        document.addEventListener('keydown', this._boundOnKeyDown);
    }

    _detachListeners() {
        this._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
        this._dragHandleElement.removeEventListener('click', this._boundOnDragHandleClick);
        this._bottomBarArea.removeEventListener('click', this._boundOnBottomBarClick);
        document.removeEventListener('keydown', this._boundOnKeyDown);
    }

    _onKeyDown(event) {
        if (event.key === 'Escape' && this.open && this.modal && this.canClose) {
            this.open = false;
        }
    }

    _onBackdropClick() {
        if (this.open && this.modal && this.canClose) {
            this.open = false;
        }
    }

    _onDragHandleClick() {
        if (this.open && !this.canClose) {
            this.dispatchEvent(new CustomEvent('close-attempt', { bubbles: true, composed: true }));
            return;
        }
        if (!this.open && !this.canOpen) return;

        this.open = !this.open;
    }

    _onBottomBarClick(event) {
        // Only open if click is on bottom bar itself or its direct non-interactive children,
        // and not on an interactive element within the bottom-bar slot.
        let target = event.target;
        while(target && target !== this._bottomBarArea) {
            if (target.matches('button, a[href], input, [tabindex]:not([tabindex="-1"])')) {
                return; // Click was on an interactive element within the slot
            }
            target = target.parentElement;
        }

        if (!this.open && this.canOpen && this.revealBottomBar) {
            this.open = true;
        }
    }

    _render() {
        this.shadowRoot.host.classList.toggle('is-open', this.open);
        this.shadowRoot.host.classList.toggle('is-modal', this.modal && this.open);

        this._backdropElement.style.display = (this.open && this.modal) ? 'block' : 'none';
        this._sheetArea.classList.toggle('visible', this.open);
        this._dragHandleElement.style.display = this.showDragHandle ? 'flex' : 'none';
        this._bottomBarArea.style.display = (!this.open && this.revealBottomBar) ? 'block' : 'none';

        this._containerElement.classList.toggle('full-width', this.fullWidth);
        this._containerElement.dataset.align = this.fullWidth ? 'fill' : this.align;

        // Adjust main content padding if bottom bar is revealed and sheet is closed
        // This is a basic way; a more robust way might use CSS variables or resize observers.
        if (!this.open && this.revealBottomBar && this._bottomBarArea.children.length > 0) {
            // This requires knowing the height of the bottom bar.
            // For now, we assume CSS will handle this with padding-bottom on main content area
            // or by adjusting the main content slot's container.
            // Example: this.style.setProperty('--adw-bottom-sheet-content-padding-bottom', `${this._bottomBarArea.offsetHeight}px`);
            // For simplicity in this step, rely on external CSS or a fixed padding assumption.
        } else {
            // this.style.removeProperty('--adw-bottom-sheet-content-padding-bottom');
        }
    }
}

// customElements.define('adw-bottom-sheet', AdwBottomSheet); // To be done in components.js

// Add export to the class definition
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
            // Potentially 'sheet-height' and 'bottom-bar-height' if we manage these via CSS vars from attributes
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Initial state
        this._open = false;
        this._modal = true;
        this._showDragHandle = true;
        this._revealBottomBar = true;
        this._canOpen = true;
        this._canClose = true;
        this._fullWidth = true;
        this._align = 'fill'; // 'fill', 'start', 'center', 'end'

        // Create the style link
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        // Assuming Adw object will be available globally for config path
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath)
            ? Adw.config.cssPath
            : '/static/css/adwaita-web.css'; // Fallback

        // Core structural elements
        this._backdropElement = document.createElement('div');
        this._backdropElement.classList.add('backdrop');
        this._backdropElement.style.display = 'none'; // Initially hidden

        this._containerElement = document.createElement('div');
        this._containerElement.classList.add('container');

        this._contentSlot = document.createElement('slot'); // Default slot for main content

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

        // Assemble shadow DOM
        this._containerElement.append(this._contentSlot, this._bottomBarArea, this._sheetArea);
        this.shadowRoot.append(styleLink, this._backdropElement, this._containerElement);

        this._boundOnBackdropClick = this._onBackdropClick.bind(this);
        this._boundOnDragHandleClick = this._onDragHandleClick.bind(this);
        this._boundOnBottomBarClick = this._onBottomBarClick.bind(this);
        this._boundOnKeyDown = this._onKeyDown.bind(this);
        this._previousActiveElement = null;
    }

    connectedCallback() {
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
        const hasPropertyChanged = this[`_${name.replace(/-/g, '')}`] !== newValue; // Check against internal prop
        if (hasPropertyChanged || oldValue !== newValue) { // Ensure render if attribute changes even if internal prop was same (e.g. initial attr set)
            switch (name) {
                case 'open':
                    this.open = newValue !== null;
                    break;
                case 'modal':
                    this.modal = newValue !== null;
                    break;
                case 'show-drag-handle':
                    this.showDragHandle = newValue !== null;
                    break;
                case 'reveal-bottom-bar':
                    this.revealBottomBar = newValue !== null;
                    break;
                case 'can-open':
                    this.canOpen = newValue !== null;
                    break;
                case 'can-close':
                    this.canClose = newValue !== null;
                    break;
                case 'full-width':
                    this.fullWidth = newValue !== null;
                    break;
                case 'align':
                    this.align = newValue || 'fill';
                    break;
            }
        }
    }

    // Property definitions with reflection to attributes
    get open() { return this._open; }
    set open(value) {
        const isOpen = Boolean(value);
        if (this._open === isOpen) return;

        if (isOpen && !this.canOpen) {
            // Potentially dispatch 'open-attempt' if needed, or just ignore
            return;
        }
        if (!isOpen && !this.canClose) {
            this.dispatchEvent(new CustomEvent('close-attempt', { bubbles: true, composed: true }));
            return;
        }

        this._open = isOpen;
        if (this._open) {
            this.setAttribute('open', '');
            this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
            // Focus management
            if (this.modal) {
                this._previousActiveElement = document.activeElement;
                // Find first focusable element in the sheet and focus it
                const firstFocusable = this._sheetArea.querySelector(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (firstFocusable) {
                    firstFocusable.focus();
                } else {
                    // Fallback focus to the sheet area itself if no focusable content
                    this._sheetArea.setAttribute('tabindex', '-1');
                    this._sheetArea.focus();
                }
            }
        } else {
            this.removeAttribute('open');
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
            // Focus management
            if (this.modal && this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
                this._previousActiveElement.focus();
                this._previousActiveElement = null;
            }
            if (this._sheetArea.hasAttribute('tabindex')) {
                this._sheetArea.removeAttribute('tabindex');
            }
        }
        this._render();
    }

    get modal() { return this._modal; }
    set modal(value) {
        const isModal = Boolean(value);
        if (this._modal === isModal) return;
        this._modal = isModal;
        if (this._modal) this.setAttribute('modal', '');
        else this.removeAttribute('modal');
        this._render();
    }

    get showDragHandle() { return this._showDragHandle; }
    set showDragHandle(value) {
        const show = Boolean(value);
        if (this._showDragHandle === show) return;
        this._showDragHandle = show;
        if (this._showDragHandle) this.setAttribute('show-drag-handle', '');
        else this.removeAttribute('show-drag-handle');
        this._render();
    }

    get revealBottomBar() { return this._revealBottomBar; }
    set revealBottomBar(value) {
        const reveal = Boolean(value);
        if (this._revealBottomBar === reveal) return;
        this._revealBottomBar = reveal;
        if (this._revealBottomBar) this.setAttribute('reveal-bottom-bar', '');
        else this.removeAttribute('reveal-bottom-bar');
        this._render();
    }

    get canOpen() { return this._canOpen; }
    set canOpen(value) { this._canOpen = Boolean(value); /* Attribute reflection handled by attributeChangedCallback or direct set */ }

    get canClose() { return this._canClose; }
    set canClose(value) { this._canClose = Boolean(value); }

    get fullWidth() { return this._fullWidth; }
    set fullWidth(value) {
        const isFullWidth = Boolean(value);
        if (this._fullWidth === isFullWidth) return;
        this._fullWidth = isFullWidth;
        if (this._fullWidth) this.setAttribute('full-width', '');
        else this.removeAttribute('full-width');
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

    // Upgrade properties that may have been set before definition
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
        document.addEventListener('keydown', this._boundOnKeyDown);
    }

    _detachListeners() {
        this._backdropElement.removeEventListener('click', this._boundOnBackdropClick);
        this._dragHandleElement.removeEventListener('click', this._boundOnDragHandleClick);
        this._bottomBarArea.removeEventListener('click', this._boundOnBottomBarClick);
        document.removeEventListener('keydown', this._boundOnKeyDown);
    }

    _onKeyDown(event) {
        if (event.key === 'Escape' && this.open && this.modal && this.canClose) {
            this.open = false;
        }
    }

    _onBackdropClick() {
        if (this.open && this.modal && this.canClose) {
            this.open = false;
        }
    }

    _onDragHandleClick() {
        if (this.open && !this.canClose) {
            this.dispatchEvent(new CustomEvent('close-attempt', { bubbles: true, composed: true }));
            return;
        }
        if (!this.open && !this.canOpen) return;

        this.open = !this.open;
    }

    _onBottomBarClick(event) {
        // Only open if click is on bottom bar itself or its direct non-interactive children,
        // and not on an interactive element within the bottom-bar slot.
        let target = event.target;
        while(target && target !== this._bottomBarArea) {
            if (target.matches('button, a[href], input, [tabindex]:not([tabindex="-1"])')) {
                return; // Click was on an interactive element within the slot
            }
            target = target.parentElement;
        }

        if (!this.open && this.canOpen && this.revealBottomBar) {
            this.open = true;
        }
    }

    _render() {
        this.shadowRoot.host.classList.toggle('is-open', this.open);
        this.shadowRoot.host.classList.toggle('is-modal', this.modal && this.open);

        this._backdropElement.style.display = (this.open && this.modal) ? 'block' : 'none';
        this._sheetArea.classList.toggle('visible', this.open);
        this._dragHandleElement.style.display = this.showDragHandle ? 'flex' : 'none';
        this._bottomBarArea.style.display = (!this.open && this.revealBottomBar) ? 'block' : 'none';

        this._containerElement.classList.toggle('full-width', this.fullWidth);
        this._containerElement.dataset.align = this.fullWidth ? 'fill' : this.align;

        // Adjust main content padding if bottom bar is revealed and sheet is closed
        // This is a basic way; a more robust way might use CSS variables or resize observers.
        if (!this.open && this.revealBottomBar && this._bottomBarArea.children.length > 0) {
            // This requires knowing the height of the bottom bar.
            // For now, we assume CSS will handle this with padding-bottom on main content area
            // or by adjusting the main content slot's container.
            // Example: this.style.setProperty('--adw-bottom-sheet-content-padding-bottom', `${this._bottomBarArea.offsetHeight}px`);
            // For simplicity in this step, rely on external CSS or a fixed padding assumption.
        } else {
            // this.style.removeProperty('--adw-bottom-sheet-content-padding-bottom');
        }
    }
}

export function createAdwBottomSheet(options = {}) {
  const opts = options || {};
  const bottomSheetWC = document.createElement('adw-bottom-sheet');

  // Map options to attributes
  if (opts.open) bottomSheetWC.setAttribute('open', '');
  if (opts.modal === false) bottomSheetWC.setAttribute('modal', 'false');
  else if (opts.modal === true) bottomSheetWC.setAttribute('modal', '');

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

  // Slotting content
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
