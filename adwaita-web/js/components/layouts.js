import { adwGenerateId } from './utils.js'; // For BreakpointBin if needed

/**
 * Creates an Adwaita-style box container (flexbox) using the AdwBox Web Component.
 */
export function createAdwBox(options = {}) {
  const opts = options || {};
  const adwBoxElement = document.createElement("adw-box");

  // Add classes based on options
  const classes = ['adw-box'];
  if (opts.orientation === 'vertical') {
    classes.push('adw-box-vertical');
  } else {
    classes.push('adw-box-horizontal'); // Default
  }
  if (opts.align) {
    classes.push(`align-${opts.align}`);
  }
  if (opts.justify) {
    classes.push(`justify-${opts.justify}`);
  }
  if (opts.spacing) {
    classes.push(`adw-box-spacing-${opts.spacing}`);
  }
  if (opts.fillChildren) {
    classes.push('adw-box-fill-children');
  }
  adwBoxElement.className = classes.join(' ');

  // Append children to the AdwBox component; they will be handled by the slot
  opts.children?.forEach((child) => {
    if (child instanceof Node) {
      adwBoxElement.appendChild(child);
    }
  });

  return adwBoxElement;
}

export class AdwBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // The actual div with class="adw-box" will be created by the user in light DOM,
        // or by createAdwBox. This component just provides a slot for that.
        // Styles should be applied globally or inherited.
        // For isolation, if AdwBox *itself* needs specific host styles, add them here.
        // But for children, they are styled by the classes applied to the slotted element.

        // If a common stylesheet is used via adoptedStyleSheets, it would be done here
        // or in a base class. For now, assuming CSS is global or managed elsewhere
        // as this component itself doesn't need to dynamically change its internal structure
        // based on attributes anymore.

        // The primary purpose of this custom element is to provide a named slot
        // and potentially encapsulate future complexities if needed.
        // For a pure CSS component, this JS is minimal.
        const slot = document.createElement('slot');
        this.shadowRoot.appendChild(slot);

        // If Adw.config.cssPath is essential for all components, and not handled globally:
        // const styleLink = document.createElement('link');
        // styleLink.rel = 'stylesheet';
        // styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
        // if (styleLink.href) {
        //     this.shadowRoot.appendChild(styleLink);
        // }
    }

    // No observedAttributes, connectedCallback, attributeChangedCallback, or _render needed
    // as the component's own rendering is static and styling is via CSS classes on the slotted content.
}

/**
 * Creates an Adwaita-style window container.
 */
export function createAdwWindow(options = {}) {
  const opts = options || {};
  const windowEl = document.createElement("div");
  windowEl.classList.add("adw-window");

  if (opts.header instanceof Node) {
    windowEl.appendChild(opts.header);
  }
  const content = document.createElement("main");
  content.classList.add("adw-window-content");
  if(opts.content instanceof Node) {
    content.appendChild(opts.content);
  } else if (opts.content) {
    console.warn("AdwWindow: options.content should be a DOM element. It was: ", opts.content);
  }
  windowEl.appendChild(content);
  return windowEl;
}


/**
 * Creates an Adwaita-style Flap.
 */
export function createAdwFlap(options = {}) {
    const opts = { isFolded: false, flapWidth: '280px', transitionSpeed: '0.25s', ...options };
    const flapElement = document.createElement('div');
    flapElement.classList.add('adw-flap');
    if(opts.isFolded) flapElement.classList.add('folded');
    flapElement.style.setProperty('--adw-flap-width', opts.flapWidth);
    flapElement.style.setProperty('--adw-flap-transition-speed', opts.transitionSpeed);

    const flapContentWrapper = document.createElement('div');
    flapContentWrapper.classList.add('adw-flap-flap-content'); // Corrected class name
    if(opts.flapContent instanceof Node) flapContentWrapper.appendChild(opts.flapContent);
    flapElement.appendChild(flapContentWrapper);

    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.classList.add('adw-flap-main-content'); // Corrected class name
    if(opts.mainContent instanceof Node) mainContentWrapper.appendChild(opts.mainContent);
    flapElement.appendChild(mainContentWrapper);

    let _isFolded = opts.isFolded;
    flapElement.setAttribute('aria-expanded', String(!_isFolded));
    flapContentWrapper.setAttribute('aria-hidden', String(_isFolded));


    flapElement.isFolded = () => _isFolded;
    flapElement.setFolded = (folded, fireEvent = true) => { // Added fireEvent default
        _isFolded = !!folded;
        flapElement.classList.toggle('folded', _isFolded);
        flapElement.setAttribute('aria-expanded', String(!_isFolded));
        flapContentWrapper.setAttribute('aria-hidden', String(_isFolded));
        if (fireEvent) {
            flapElement.dispatchEvent(new CustomEvent('fold-changed', {detail: {isFolded: _isFolded}}));
        }
    };
    flapElement.toggleFlap = (explicitState) => { flapElement.setFolded(typeof explicitState === 'boolean' ? explicitState : !_isFolded);};

    return { element: flapElement, isFolded: flapElement.isFolded, setFolded: flapElement.setFolded, toggleFlap: flapElement.toggleFlap };
}
export class AdwFlap extends HTMLElement {
    static get observedAttributes() { return ['folded', 'flap-width', 'transition-speed']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
        this.shadowRoot.appendChild(styleLink);
        this._factoryInstance = null; // Will hold the {element, methods} from factory
    }
    connectedCallback() {
        this._render();
        // Initial state sync after render, do not fire event
        if (this._factoryInstance) {
            this._factoryInstance.setFolded(this.hasAttribute('folded'), false);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'folded') {
                if (this._factoryInstance) {
                    this._factoryInstance.setFolded(this.hasAttribute('folded')); // Factory method will dispatch event
                }
            } else {
                 this._render(); // Re-render for flap-width or transition-speed
                 if (this._factoryInstance) { // Re-apply folded state after re-render
                    this._factoryInstance.setFolded(this.hasAttribute('folded'), false);
                 }
            }
        }
    }
    _render() {
        // These are the actual <slot> elements that will be placed in the Shadow DOM
        // by the factory, allowing light DOM content to project into them.
        const flapContentSlotElement = document.createElement('slot');
        flapContentSlotElement.name = 'flap-content';

        const mainContentSlotElement = document.createElement('slot');
        mainContentSlotElement.name = 'main-content';

        const options = {
            isFolded: this.hasAttribute('folded'),
            flapContent: flapContentSlotElement, // Pass the <slot> element itself
            mainContent: mainContentSlotElement  // Pass the <slot> element itself
        };
        if (this.hasAttribute('flap-width')) options.flapWidth = this.getAttribute('flap-width');
        if (this.hasAttribute('transition-speed')) options.transitionSpeed = this.getAttribute('transition-speed');

        this._factoryInstance = createAdwFlap(options);

        // Clear previous element if any
        const existingFlapElement = this.shadowRoot.querySelector('.adw-flap');
        if (existingFlapElement) existingFlapElement.remove();

        this.shadowRoot.appendChild(this._factoryInstance.element);

        // Wire up the factory's event to the component's event
        this._factoryInstance.element.addEventListener('fold-changed', (e) => {
            // Sync attribute on host
            if (e.detail.isFolded) this.setAttribute('folded', '');
            else this.removeAttribute('folded');
            // Re-dispatch from the custom element
            this.dispatchEvent(new CustomEvent('fold-changed', {detail: e.detail}));
        });
    }

    toggleFlap(explicitState) {
        if (this._factoryInstance) {
            this._factoryInstance.toggleFlap(explicitState);
        }
    }
    get isFolded() { // Getter for consistency
        return this.hasAttribute('folded');
    }
    set isFolded(state) { // Setter for programmatic control
        const shouldFold = Boolean(state);
        if (this.isFolded === shouldFold) return;
        if (shouldFold) this.setAttribute('folded', '');
        else this.removeAttribute('folded');
        // attributeChangedCallback will handle the rest
    }
}

/** Creates an AdwBin container. */
export function createAdwBin(options = {}) {
    const opts = options || {};
    const adwBinElement = document.createElement('adw-bin');
    if (opts.child instanceof Node) {
        adwBinElement.appendChild(opts.child); // Child will be slotted
    } else if (opts.child) {
        console.warn("AdwBin factory: options.child was provided but is not a valid DOM Node.");
    }
    return adwBinElement;
}
export class AdwBin extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Link to the common stylesheet
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
        if (styleLink.href) {
            this.shadowRoot.appendChild(styleLink);
        }

        // The internal structure for AdwBin is a div that takes the adw-bin class,
        // and a slot for the user's content.
        const internalBinDiv = document.createElement('div');
        internalBinDiv.classList.add('adw-bin'); // This is what _bin.scss targets
        const slot = document.createElement('slot');
        internalBinDiv.appendChild(slot);
        this.shadowRoot.appendChild(internalBinDiv);
    }
}

/** Creates an AdwWrapBox container. */
export function createAdwWrapBox(options = {}) {
    const opts = options || {};
    const adwWrapBoxElement = document.createElement('adw-wrap-box');

    const classes = ['adw-wrap-box'];
    if (opts.orientation === 'vertical') {
        classes.push('wrap-box-vertical');
    } else {
        classes.push('wrap-box-horizontal'); // Default
    }

    if (opts.spacing) {
        classes.push(`wrap-box-spacing-${opts.spacing}`);
    }
    // Note: 'line-spacing' distinct from 'spacing' is not directly supported by simple classes using 'gap'.
    // If line-spacing is critical and different from item spacing, this would need custom CSS variables or more complex JS.
    // For now, 'spacing' controls the 'gap' property.
    if (opts.lineSpacing && opts.lineSpacing !== opts.spacing) {
        console.warn("AdwWrapBox factory: Distinct 'lineSpacing' from 'spacing' is not directly supported by CSS classes in this refactor. 'spacing' will be used for gap.");
    }

    if (opts.align) {
        classes.push(`wrap-align-${opts.align}`);
    }
    if (opts.justify) {
        classes.push(`wrap-justify-${opts.justify}`);
    }
    adwWrapBoxElement.className = classes.join(' ');

    (opts.children || []).forEach(child => {
        if (child instanceof Node) adwWrapBoxElement.appendChild(child);
    });
    return adwWrapBoxElement;
}
export class AdwWrapBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Optional: Link to the common stylesheet if Adw.config.cssPath is defined
        // and if AdwWrapBox needs to ensure its own ":host" styles are encapsulated
        // or if it relies on common styles not guaranteed to be global.
        // For a pure class-based component where styles target the host via global CSS,
        // this might not be strictly necessary if Adw.config.cssPath is loaded globally.
        // However, including it for consistency with other components that might need it.
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
        if (styleLink.href) {
            this.shadowRoot.appendChild(styleLink);
        }

        // The component only needs to provide a slot for its children.
        // The <adw-wrap-box> host element itself will be styled by the CSS classes
        // (e.g., <adw-wrap-box class="adw-wrap-box wrap-box-vertical ...">).
        const slot = document.createElement('slot');
        this.shadowRoot.appendChild(slot);
    }

    // No observedAttributes, connectedCallback, or attributeChangedCallback needed
    // if styling is driven by classes on the host element.
}

/** Creates an AdwClamp container. */
export function createAdwClamp(options = {}) {
    const opts = options || {};
    const adwClampElement = document.createElement('adw-clamp');

    if (opts.maximumSize) {
        adwClampElement.setAttribute('maximum-size', opts.maximumSize);
    }
    if (opts.isScrollable) {
        adwClampElement.setAttribute('scrollable', '');
    }

    if (opts.child instanceof Node) {
        adwClampElement.appendChild(opts.child); // Child will be slotted
    } else if (opts.child) {
        console.warn("AdwClamp factory: options.child was provided but is not a valid DOM Node.");
    }
    return adwClampElement;
}
export class AdwClamp extends HTMLElement {
    static get observedAttributes() { return ['maximum-size', 'scrollable']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
        if (styleLink.href) {
            this.shadowRoot.appendChild(styleLink);
        }

        this._clampElement = document.createElement('div');
        this._clampElement.classList.add('adw-clamp'); // Base class for display:flex, justify-content:center

        this._childWrapper = document.createElement('div');
        this._childWrapper.classList.add('adw-clamp-child-wrapper');
        const slot = document.createElement('slot');
        this._childWrapper.appendChild(slot);
        this._clampElement.appendChild(this._childWrapper);
        this.shadowRoot.appendChild(this._clampElement);
    }

    connectedCallback() {
        this._updateStyles();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._updateStyles();
        }
    }

    _updateStyles() {
        // Set max-width directly on the child wrapper
        this._childWrapper.style.maxWidth = this.getAttribute('maximum-size') || '80ch';

        // Toggle .scrollable class on the main clamp element based on attribute
        if (this.hasAttribute('scrollable')) {
            this._clampElement.classList.add('scrollable');
            // Potentially ensure childWrapper takes full width if clamp itself is to scroll its content
            // this._childWrapper.style.width = '100%'; // Already default in SCSS
        } else {
            this._clampElement.classList.remove('scrollable');
            // this._childWrapper.style.width = ''; // Reset if needed, but SCSS handles it
        }
    }
}

/** Creates an AdwBreakpointBin container. */
export function createAdwBreakpointBin(options = {}) {
    const opts = options || {}; const breakpointBin = document.createElement('div'); breakpointBin.classList.add('adw-breakpoint-bin');
    let sortedChildren = []; if (Array.isArray(opts.children)) { sortedChildren = opts.children.map(c => { let minWidth = 0; if (typeof c.condition === 'number') minWidth = c.condition; else if (typeof c.condition === 'string') { const match = c.condition.match(/min-width:\s*(\d+)(px)?/i); if (match && match[1]) minWidth = parseInt(match[1], 10); else console.warn(`AdwBreakpointBin: Could not parse condition "${c.condition}" for child "${c.name}". Treating as 0.`);} return { ...c, _minWidth: minWidth }; }).sort((a, b) => a._minWidth - b._minWidth); }
    let defaultChild = null; if(opts.defaultChildName) defaultChild = sortedChildren.find(c => c.name === opts.defaultChildName)?.element; if(!defaultChild && sortedChildren.length > 0) defaultChild = sortedChildren[0].element;
    sortedChildren.forEach(childData => { if (childData.element instanceof Node) { childData.element.style.display = 'none'; breakpointBin.appendChild(childData.element); }}); if(defaultChild && defaultChild.style) defaultChild.style.display = ''; // Check if defaultChild has style property
    let currentVisibleChild = defaultChild;
    breakpointBin.updateVisibility = () => {
        const containerWidth = breakpointBin.offsetWidth; let newVisibleChild = defaultChild;
        for (let i = sortedChildren.length - 1; i >= 0; i--) { const childData = sortedChildren[i]; if (containerWidth >= childData._minWidth) { newVisibleChild = childData.element; break; }}
        if (currentVisibleChild !== newVisibleChild) { if (currentVisibleChild && currentVisibleChild.style) currentVisibleChild.style.display = 'none'; if (newVisibleChild && newVisibleChild.style) newVisibleChild.style.display = ''; currentVisibleChild = newVisibleChild; }
    };
    let resizeObserver = null; if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(() => { breakpointBin.updateVisibility(); }); } else console.warn("AdwBreakpointBin: ResizeObserver not supported.");
    breakpointBin._isObserving = false; // Keep track of observation state
    breakpointBin.startObserving = () => { if (resizeObserver && !breakpointBin._isObserving) { resizeObserver.observe(breakpointBin); breakpointBin._isObserving = true; breakpointBin.updateVisibility(); }};
    breakpointBin.stopObserving = () => { if (resizeObserver && breakpointBin._isObserving) { resizeObserver.unobserve(breakpointBin); breakpointBin._isObserving = false; }};
    return breakpointBin;
}
export class AdwBreakpointBin extends HTMLElement {
    static get observedAttributes() { return ['default-child-name']; }
    constructor() { super(); this._slotObserver = new MutationObserver(() => this._rebuildChildren()); this._resizeObserver = null; this._sortedChildrenConfig = []; this._defaultChildElement = null; this._currentVisibleElement = null; }
    connectedCallback() { this.attachShadow({mode: 'open'}); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); const slot = document.createElement('slot'); this.shadowRoot.appendChild(slot); slot.addEventListener('slotchange', () => this._rebuildChildren()); this._rebuildChildren(); }
    disconnectedCallback() { if (this._resizeObserver) this._resizeObserver.disconnect(); this._slotObserver.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (name === 'default-child-name') this._rebuildChildren(); }
    _rebuildChildren() {
        this._slotObserver.disconnect();
        const childrenData = [];
        Array.from(this.children).forEach(child => { if (child.nodeType === Node.ELEMENT_NODE) { const condition = child.dataset.condition || child.getAttribute('condition'); const name = child.dataset.name || child.getAttribute('name') || adwGenerateId('bp-child'); if(!child.dataset.name && !child.getAttribute('name')) child.setAttribute('data-name', name); if (condition) childrenData.push({ name: name, element: child, condition: isNaN(parseFloat(condition)) ? condition : parseFloat(condition) }); else console.warn("AdwBreakpointBin WC: Child element missing 'data-condition' or 'condition'.", child); }});
        this._initializeBreakpointLogic(childrenData);
        this._slotObserver.observe(this, { childList: true, attributes: true, subtree: false, attributeFilter: ['data-condition', 'condition', 'name', 'data-name'] });
    }
    _initializeBreakpointLogic(childrenData) {
        this._sortedChildrenConfig = childrenData.map(c => { let minWidth = 0; if (typeof c.condition === 'number') minWidth = c.condition; else if (typeof c.condition === 'string') { const match = c.condition.match(/min-width:\s*(\d+)(px)?/i); if (match && match[1]) minWidth = parseInt(match[1], 10); } return { ...c, _minWidth: minWidth }; }).sort((a,b) => a._minWidth - b._minWidth);
        let defaultChildName = this.getAttribute('default-child-name'); this._defaultChildElement = null;
        if (defaultChildName) { const found = this._sortedChildrenConfig.find(c => c.name === defaultChildName); if (found) this._defaultChildElement = found.element; }
        if (!this._defaultChildElement && this._sortedChildrenConfig.length > 0) this._defaultChildElement = this._sortedChildrenConfig[0].element;
        this._currentVisibleElement = null;
        if (typeof ResizeObserver !== 'undefined') { if (this._resizeObserver) this._resizeObserver.disconnect(); this._resizeObserver = new ResizeObserver(() => this.updateVisibility()); this._resizeObserver.observe(this); }
        else { console.warn("AdwBreakpointBin: ResizeObserver not supported, falling back to window resize (less efficient)."); window.addEventListener('resize', () => this.updateVisibility()); }
        this.updateVisibility();
    }
    updateVisibility() {
        const containerWidth = this.offsetWidth; let newVisibleElement = this._defaultChildElement;
        for (let i = this._sortedChildrenConfig.length - 1; i >= 0; i--) { const childConfig = this._sortedChildrenConfig[i]; if (containerWidth >= childConfig._minWidth) { newVisibleElement = childConfig.element; break; }}
        if (this._currentVisibleElement !== newVisibleElement) { Array.from(this.children).forEach(child => { if(child.style) child.style.display = 'none'; }); if (newVisibleElement && newVisibleElement.style) newVisibleElement.style.display = ''; this._currentVisibleElement = newVisibleElement; this.dispatchEvent(new CustomEvent('child-changed', { detail: { visibleChildName: newVisibleElement ? (newVisibleElement.dataset.name || newVisibleElement.getAttribute('name')) : null }}));}
    }
}


/**
 * Creates an Adwaita-style ToastOverlay.
 * A widget showing toasts above its content.
 */
export function createAdwToastOverlay(options = {}) {
    const opts = options || {};
    const overlay = document.createElement('div');
    overlay.classList.add('adw-toast-overlay');

    const childContainer = document.createElement('div');
    childContainer.classList.add('adw-toast-overlay-child-container');
    if (opts.child instanceof Node) {
        childContainer.appendChild(opts.child);
    }
    overlay.appendChild(childContainer);

    const toastContainer = document.createElement('div');
    toastContainer.classList.add('adw-toast-container'); // For positioning toasts
    overlay.appendChild(toastContainer);

    overlay._toasts = []; // Array to manage active toasts

    overlay.addToast = (toastOrOptions) => {
        let toastElement;
        if (toastOrOptions instanceof HTMLElement && toastOrOptions.classList.contains('adw-toast')) {
            toastElement = toastOrOptions;
        } else if (typeof toastOrOptions === 'object' && toastOrOptions.title) {
            // Assuming createAdwToast is available in the global Adw scope or imported
            const toastFactory = (typeof Adw !== 'undefined' && Adw.createToast) ? Adw.createToast : globalThis.createAdwToast;
            if (!toastFactory) {
                console.error("AdwToastOverlay: createAdwToast function not found.");
                return;
            }
            toastElement = toastFactory(toastOrOptions.title, toastOrOptions);
        } else {
            console.error("AdwToastOverlay: Invalid argument for addToast. Provide a toast element or options object.", toastOrOptions);
            return;
        }

        toastContainer.appendChild(toastElement);
        overlay._toasts.push(toastElement);

        // Trigger enter animation
        requestAnimationFrame(() => { // Ensures element is in DOM for transition
            toastElement.classList.add('visible');
        });

        const data = toastElement._adwToastData || {};
        const timeoutDuration = (data.timeout || 4) * 1000; // Convert seconds to ms

        const dismissFn = () => {
            if (toastElement._adwToastData.dismissTimerId) {
                clearTimeout(toastElement._adwToastData.dismissTimerId);
                toastElement._adwToastData.dismissTimerId = null;
            }
            toastElement.classList.remove('visible');
            toastElement.classList.add('hiding');
            toastElement.dispatchEvent(new CustomEvent('dismissed', { bubbles: false })); // AdwToast emits this

            // Remove after animation
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.remove();
                }
                overlay._toasts = overlay._toasts.filter(t => t !== toastElement);
            }, 300); // Match hiding animation duration
        };

        toastElement.addEventListener('dismiss-requested', dismissFn);

        if (data.timeout > 0) { // 0 means indefinite
            toastElement._adwToastData.dismissTimerId = setTimeout(dismissFn, timeoutDuration);
        }

        // Handle priority - basic implementation: higher priority toasts dismiss lower ones.
        // A more complex system might involve a queue or max number of visible toasts.
        if (data.priority === ADW_TOAST_PRIORITY_HIGH) {
            overlay._toasts.forEach(t => {
                if (t !== toastElement && t._adwToastData && t._adwToastData.priority !== ADW_TOAST_PRIORITY_HIGH) {
                    // Dispatch dismiss-requested on other lower-priority toasts
                    t.dispatchEvent(new CustomEvent('dismiss-requested', { bubbles: true, composed: true }));
                }
            });
        }
         // Max 1 high priority, or N normal priority toasts.
         // For simplicity, let's ensure only a few toasts are visible at a time.
        const MAX_TOASTS = 3;
        while(toastContainer.children.length > MAX_TOASTS && overlay._toasts.length > MAX_TOASTS) {
            const oldestToast = overlay._toasts[0];
            if (oldestToast && oldestToast._adwToastData.priority !== ADW_TOAST_PRIORITY_HIGH) { // Don't auto-dismiss high prio
                 oldestToast.dispatchEvent(new CustomEvent('dismiss-requested', { bubbles: true, composed: true }));
            } else if (overlay._toasts.length > MAX_TOASTS) { // If it's a high prio one, remove the next oldest normal one
                 const oldestNormal = overlay._toasts.find(t => t._adwToastData.priority !== ADW_TOAST_PRIORITY_HIGH);
                 if(oldestNormal) oldestNormal.dispatchEvent(new CustomEvent('dismiss-requested', { bubbles: true, composed: true }));
                 else break; // Only high-priority left
            } else {
                break;
            }
        }


        return toastElement;
    };

    overlay.dismissAll = () => {
        [...overlay._toasts].forEach(toastElement => { // Iterate over a copy
            toastElement.dispatchEvent(new CustomEvent('dismiss-requested', { bubbles: true, composed: true }));
        });
    };

    return overlay;
}

export class AdwToastOverlay extends HTMLElement {
    static get observedAttributes() { return []; } // Not attribute driven for now

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */

        this._overlayElement = createAdwToastOverlay({ child: document.createElement('slot') });
        this.shadowRoot.append(styleLink, this._overlayElement);
    }

    connectedCallback() {
        // Initial render if any light DOM children exist, though child is typically set via slot
    }

    addToast(toastOrOptions) {
        if (this._overlayElement && typeof this._overlayElement.addToast === 'function') {
            return this._overlayElement.addToast(toastOrOptions);
        }
        return null;
    }

    dismissAllToasts() {
        if (this._overlayElement && typeof this._overlayElement.dismissAll === 'function') {
            this._overlayElement.dismissAll();
        }
    }

    get child() {
        const childContainer = this._overlayElement.querySelector('.adw-toast-overlay-child-container');
        return childContainer ? childContainer.firstElementChild : null;
    }

    set child(newChild) {
        const childContainer = this._overlayElement.querySelector('.adw-toast-overlay-child-container');
        if (childContainer) {
            while (childContainer.firstChild) {
                childContainer.removeChild(childContainer.firstChild);
            }
            if (newChild instanceof Node) {
                childContainer.appendChild(newChild);
            }
        }
    }
}
// No customElements.define here
