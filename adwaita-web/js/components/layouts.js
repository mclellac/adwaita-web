import { adwGenerateId } from './utils.js'; // For BreakpointBin if needed

/**
 * Creates an Adwaita-style box container (flexbox) using the AdwBox Web Component.
 */
export function createAdwBox(options = {}) {
  const opts = options || {};
  const adwBoxElement = document.createElement("adw-box");

  if (opts.orientation) {
    adwBoxElement.setAttribute("orientation", opts.orientation);
  }
  if (opts.align) {
    adwBoxElement.setAttribute("align", opts.align);
  }
  if (opts.justify) {
    adwBoxElement.setAttribute("justify", opts.justify);
  }
  if (opts.spacing) {
    adwBoxElement.setAttribute("spacing", opts.spacing);
  }
  if (opts.fillChildren) { // options.fillChildren should be boolean
    adwBoxElement.setAttribute("fill-children", ""); // Presence of attribute means true
  }

  // Append children to the AdwBox component; they will be handled by the slot
  opts.children?.forEach((child) => {
    if (child instanceof Node) {
      adwBoxElement.appendChild(child);
    }
  });

  return adwBoxElement;
}

export class AdwBox extends HTMLElement {
    static get observedAttributes() { return ['orientation', 'spacing', 'align', 'justify', 'fill-children']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        let boxElement = this.shadowRoot.querySelector('.adw-box');
        if (!boxElement) {
            // Initial setup: create the box div and slot, append them.
            // Keep the style link as the first child if it exists.
            const styleLink = this.shadowRoot.querySelector('link[rel="stylesheet"]');
            while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== styleLink) {
                this.shadowRoot.removeChild(this.shadowRoot.lastChild);
            }
            boxElement = document.createElement('div');
            boxElement.classList.add('adw-box');
            boxElement.appendChild(document.createElement('slot'));
            this.shadowRoot.appendChild(boxElement);
        }

        // Reset classes related to attributes to avoid accumulation
        boxElement.className = 'adw-box'; // Start with the base class

        // Apply classes based on attributes
        const orientation = this.getAttribute('orientation');
        if (orientation === 'vertical') {
            boxElement.classList.add('adw-box-vertical');
        } else {
            boxElement.classList.add('adw-box-horizontal'); // Default
        }

        const align = this.getAttribute('align');
        if (align) {
            boxElement.classList.add(`align-${align}`);
        }

        const justify = this.getAttribute('justify');
        if (justify) {
            boxElement.classList.add(`justify-${justify}`);
        }

        const spacing = this.getAttribute('spacing');
        if (spacing) {
            boxElement.classList.add(`adw-box-spacing-${spacing}`);
        }

        if (this.hasAttribute('fill-children') && this.getAttribute('fill-children') !== 'false') {
            boxElement.classList.add('adw-box-fill-children');
        }
    }
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

export class AdwApplicationWindow extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const windowDiv = document.createElement('div'); windowDiv.classList.add('adw-window'); // This is the main container for AdwApplicationWindow
        // It should probably have a more specific class if it's distinct from a generic adw-window from the factory
        // For now, sticking to 'adw-window' as per original.

        const headerSlot = document.createElement('slot'); headerSlot.name = 'header';
        const mainContent = document.createElement('main'); mainContent.classList.add('adw-window-content');
        mainContent.appendChild(document.createElement('slot')); // Default slot for main content
        windowDiv.append(headerSlot, mainContent); this.shadowRoot.appendChild(windowDiv);
    }
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
    const opts = options || {}; const bin = document.createElement('div'); bin.classList.add('adw-bin');
    if (opts.child instanceof Node) bin.appendChild(opts.child);
    else if (opts.child) console.warn("AdwBin: options.child was provided but is not a valid DOM Node.");
    return bin;
}
export class AdwBin extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ const binDiv = document.createElement('div'); binDiv.classList.add('adw-bin'); const slot = document.createElement('slot'); binDiv.appendChild(slot); this.shadowRoot.append(styleLink, binDiv); }
}

/** Creates an AdwWrapBox container. */
export function createAdwWrapBox(options = {}) {
    const opts = options || {}; const wrapBox = document.createElement('div'); wrapBox.classList.add('adw-wrap-box'); wrapBox.style.display = 'flex'; wrapBox.style.flexWrap = 'wrap';
    if (opts.orientation === 'vertical') wrapBox.style.flexDirection = 'column'; else wrapBox.style.flexDirection = 'row';
    let gapValue = "var(--spacing-m)"; if (typeof opts.spacing === 'number') gapValue = `${opts.spacing}px`; else if (typeof opts.spacing === 'string') gapValue = opts.spacing;
    let rowGapValue = gapValue; if (typeof opts.lineSpacing === 'number') rowGapValue = `${opts.lineSpacing}px`; else if (typeof opts.lineSpacing === 'string') rowGapValue = opts.lineSpacing;
    if (rowGapValue !== gapValue) { wrapBox.style.rowGap = rowGapValue; wrapBox.style.columnGap = gapValue; } else wrapBox.style.gap = gapValue;
    const flexAlignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' }; wrapBox.style.alignItems = flexAlignMap[opts.align] || flexAlignMap.start;
    const flexJustifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }; wrapBox.style.justifyContent = flexJustifyMap[opts.justify] || flexJustifyMap.start;
    (opts.children || []).forEach(child => { if (child instanceof Node) wrapBox.appendChild(child); }); return wrapBox;
}
export class AdwWrapBox extends HTMLElement {
    static get observedAttributes() { return ['orientation', 'spacing', 'line-spacing', 'align', 'justify']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this._wrapBoxElement = document.createElement('div'); this._wrapBoxElement.classList.add('adw-wrap-box'); const slot = document.createElement('slot'); this._wrapBoxElement.appendChild(slot); this.shadowRoot.append(styleLink, this._wrapBoxElement); }
    connectedCallback() { this._updateStyles(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._updateStyles(); }
    _updateStyles() { const opts = {}; if (this.hasAttribute('orientation')) opts.orientation = this.getAttribute('orientation'); if (this.hasAttribute('spacing')) opts.spacing = this.getAttribute('spacing'); if (this.hasAttribute('line-spacing')) opts.lineSpacing = this.getAttribute('line-spacing'); if (this.hasAttribute('align')) opts.align = this.getAttribute('align'); if (this.hasAttribute('justify')) opts.justify = this.getAttribute('justify'); this._wrapBoxElement.style.display = 'flex'; this._wrapBoxElement.style.flexWrap = 'wrap'; if (opts.orientation === 'vertical') this._wrapBoxElement.style.flexDirection = 'column'; else this._wrapBoxElement.style.flexDirection = 'row'; let gapValue = "var(--spacing-m)"; if (opts.spacing) gapValue = isNaN(parseFloat(opts.spacing)) ? opts.spacing : `${parseFloat(opts.spacing)}px`; let rowGapValue = gapValue; if (opts.lineSpacing) rowGapValue = isNaN(parseFloat(opts.lineSpacing)) ? opts.lineSpacing : `${parseFloat(opts.lineSpacing)}px`; if (rowGapValue !== gapValue) { this._wrapBoxElement.style.rowGap = rowGapValue; this._wrapBoxElement.style.columnGap = gapValue; } else { this._wrapBoxElement.style.gap = gapValue; delete this._wrapBoxElement.style.rowGap; delete this._wrapBoxElement.style.columnGap;} const flexAlignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' }; this._wrapBoxElement.style.alignItems = flexAlignMap[opts.align] || flexAlignMap.start; const flexJustifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }; this._wrapBoxElement.style.justifyContent = flexJustifyMap[opts.justify] || flexJustifyMap.start; }
}

/** Creates an AdwClamp container. */
export function createAdwClamp(options = {}) {
    const opts = options || {}; const clamp = document.createElement('div'); clamp.classList.add('adw-clamp');
    const innerWrapper = document.createElement('div'); innerWrapper.classList.add('adw-clamp-child-wrapper'); innerWrapper.style.maxWidth = opts.maximumSize || '80ch';
    clamp.style.display = 'flex'; clamp.style.justifyContent = 'center';
    if (opts.child instanceof Node) innerWrapper.appendChild(opts.child); else if (opts.child) console.warn("AdwClamp: options.child was not a valid DOM Node.");
    clamp.appendChild(innerWrapper);
    if (opts.isScrollable) { clamp.classList.add('scrollable'); clamp.style.overflowX = 'hidden'; clamp.style.overflowY = 'auto'; innerWrapper.style.width = '100%'; }
    return clamp;
}
export class AdwClamp extends HTMLElement {
    static get observedAttributes() { return ['maximum-size', 'scrollable']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this._clampElement = document.createElement('div'); this._clampElement.classList.add('adw-clamp'); this._childWrapper = document.createElement('div'); this._childWrapper.classList.add('adw-clamp-child-wrapper'); const slot = document.createElement('slot'); this._childWrapper.appendChild(slot); this._clampElement.appendChild(this._childWrapper); this.shadowRoot.append(styleLink, this._clampElement); }
    connectedCallback() { this._updateStyles(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._updateStyles(); }
    _updateStyles() { this._childWrapper.style.maxWidth = this.getAttribute('maximum-size') || '80ch'; this._clampElement.style.display = 'flex'; this._clampElement.style.justifyContent = 'center'; if (this.hasAttribute('scrollable')) { this._clampElement.classList.add('scrollable'); this._clampElement.style.overflowX = 'hidden'; this._clampElement.style.overflowY = 'auto'; this._childWrapper.style.width = '100%'; } else { this._clampElement.classList.remove('scrollable'); this._clampElement.style.overflowX = ''; this._clampElement.style.overflowY = ''; this._childWrapper.style.width = '';}}
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
