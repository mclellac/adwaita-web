import { adwGenerateId } from './utils.js'; // For BreakpointBin if needed

/**
 * Creates an Adwaita-style box container (flexbox).
 */
export function createAdwBox(options = {}) {
  const opts = options || {};
  const box = document.createElement("div");
  box.classList.add("adw-box");

  if (opts.orientation === "vertical") {
    box.classList.add("adw-box-vertical");
  }
  if (opts.align) {
    box.classList.add(`align-${opts.align}`);
  }
  if (opts.justify) {
    box.classList.add(`justify-${opts.justify}`);
  }
  if (opts.spacing) {
    box.classList.add(`adw-box-spacing-${opts.spacing}`);
  }
  if (opts.fillChildren) {
    box.classList.add("adw-box-fill-children");
  }
  opts.children?.forEach((child) => {
    if (child instanceof Node) box.appendChild(child);
  });
  return box;
}

export class AdwBox extends HTMLElement { /* ... (Same as original AdwBox WC) ... */
    static get observedAttributes() { return ['orientation', 'spacing', 'align', 'justify', 'fill-children']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        AdwBox.observedAttributes.forEach(attr => { if (this.hasAttribute(attr)) { const value = this.getAttribute(attr); const camelCaseAttr = attr.replace(/-([a-z])/g, g => g[1].toUpperCase()); if (attr === 'fill-children') { options[camelCaseAttr] = value !== null && value !== 'false'; } else { options[camelCaseAttr] = value; }}});
        const factory = (typeof Adw !== 'undefined' && Adw.createBox) ? Adw.createBox : createAdwBox;
        const boxElement = factory(options); boxElement.appendChild(document.createElement('slot')); this.shadowRoot.appendChild(boxElement);
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

export class AdwApplicationWindow extends HTMLElement { /* ... (Same as original AdwApplicationWindow WC) ... */
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; this.shadowRoot.appendChild(styleLink); }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const windowDiv = document.createElement('div'); windowDiv.classList.add('adw-window');
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
    flapContentWrapper.classList.add('adw-flap-content-wrapper');
    if(opts.flapContent instanceof Node) flapContentWrapper.appendChild(opts.flapContent);
    flapElement.appendChild(flapContentWrapper);

    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.classList.add('adw-flap-main-content-wrapper');
    if(opts.mainContent instanceof Node) mainContentWrapper.appendChild(opts.mainContent);
    flapElement.appendChild(mainContentWrapper);

    let _isFolded = opts.isFolded;
    // Set initial ARIA states
    flapElement.setAttribute('aria-expanded', String(!_isFolded));
    flapContentWrapper.setAttribute('aria-hidden', String(_isFolded));


    flapElement.isFolded = () => _isFolded;
    flapElement.setFolded = (folded) => {
        _isFolded = !!folded;
        flapElement.classList.toggle('folded', _isFolded);
        flapElement.setAttribute('aria-expanded', String(!_isFolded));
        flapContentWrapper.setAttribute('aria-hidden', String(_isFolded));
        flapElement.dispatchEvent(new CustomEvent('fold-changed', {detail: {isFolded: _isFolded}}));
    };
    flapElement.toggleFlap = (explicitState) => { flapElement.setFolded(typeof explicitState === 'boolean' ? explicitState : !_isFolded);};

    return { element: flapElement, isFolded: flapElement.isFolded, setFolded: flapElement.setFolded, toggleFlap: flapElement.toggleFlap };
}
export class AdwFlap extends HTMLElement {
    static get observedAttributes() { return ['folded', 'flap-width', 'transition-speed']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._flapInstance = null;
        this._flapElement = null; // Direct reference to the .adw-flap div
        this._flapContentWrapper = null;
    }
    connectedCallback() {
        this._render();
        // Initial ARIA state sync after render
        this.setFolded(this.hasAttribute('folded'), false); // false to not fire event on init
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'folded') {
                this.setFolded(this.hasAttribute('folded'));
            } else {
                 this._render(); // Re-render for flap-width or transition-speed
            }
        }
    }
    _render() {
        const flapContentSlot = this.querySelector('[slot="flap"]');
        const mainContentSlot = this.querySelector('[slot="main"]');

        const flapContentElement = flapContentSlot ? flapContentSlot.cloneNode(true) : document.createElement('div');
        const mainContentElement = mainContentSlot ? mainContentSlot.cloneNode(true) : document.createElement('div');

        // If re-rendering, preserve the instance for its methods, but update its element's content/style
        const options = {
            isFolded: this.hasAttribute('folded'),
            flapContent: flapContentElement,
            mainContent: mainContentElement
        };
        if (this.hasAttribute('flap-width')) options.flapWidth = this.getAttribute('flap-width');
        if (this.hasAttribute('transition-speed')) options.transitionSpeed = this.getAttribute('transition-speed');

        // The factory createAdwFlap returns an object {element, ...methods}
        // We need to manage the element within the shadow DOM
        const factoryOutput = createAdwFlap(options);

        if (this._flapElement && this._flapElement.parentElement === this.shadowRoot) {
            this.shadowRoot.removeChild(this._flapElement);
        }
        this._flapElement = factoryOutput.element;
        this._flapContentWrapper = this._flapElement.querySelector('.adw-flap-content-wrapper');

        // Wire up instance methods to WC methods
        this._flapInstance = { // Keep a reference to methods if needed, element is primary
            isFolded: factoryOutput.isFolded,
            setFolded: factoryOutput.setFolded, // This will now update ARIA on the element from factory
            toggleFlap: factoryOutput.toggleFlap
        };

        this.shadowRoot.appendChild(this._flapElement);
    }

    toggleFlap(explicitState) {
        if (this._flapInstance) {
            this._flapInstance.toggleFlap(explicitState);
            // Factory's setFolded will dispatch event and update class/ARIA
            // Sync attribute on host
            if (this._flapInstance.isFolded()) this.setAttribute('folded', '');
            else this.removeAttribute('folded');
        }
    }
    isFolded() {
        return this.hasAttribute('folded');
    }
    setFolded(state, fireEvent = true) { // Added fireEvent param for internal control
        const shouldFold = Boolean(state);
        const currentFolded = this.hasAttribute('folded');
        if (currentFolded === shouldFold) return;

        if (shouldFold) this.setAttribute('folded', '');
        else this.removeAttribute('folded');

        if (this._flapElement) { // Update internal DOM directly
            this._flapElement.classList.toggle('folded', shouldFold);
            this._flapElement.setAttribute('aria-expanded', String(!shouldFold));
            if (this._flapContentWrapper) {
                this._flapContentWrapper.setAttribute('aria-hidden', String(shouldFold));
            }
        }
        if (fireEvent) {
            this.dispatchEvent(new CustomEvent('fold-changed', {detail: {isFolded: shouldFold}}));
        }
    }
}

/** Creates an AdwBin container. */
export function createAdwBin(options = {}) { /* ... (Same as original createAdwBin) ... */
    const opts = options || {}; const bin = document.createElement('div'); bin.classList.add('adw-bin');
    if (opts.child instanceof Node) bin.appendChild(opts.child);
    else if (opts.child) console.warn("AdwBin: options.child was provided but is not a valid DOM Node.");
    return bin;
}
export class AdwBin extends HTMLElement { /* ... (Same as original AdwBin WC) ... */
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css'; const binDiv = document.createElement('div'); binDiv.classList.add('adw-bin'); const slot = document.createElement('slot'); binDiv.appendChild(slot); this.shadowRoot.append(styleLink, binDiv); }
}

/** Creates an AdwWrapBox container. */
export function createAdwWrapBox(options = {}) { /* ... (Same as original createAdwWrapBox) ... */
    const opts = options || {}; const wrapBox = document.createElement('div'); wrapBox.classList.add('adw-wrap-box'); wrapBox.style.display = 'flex'; wrapBox.style.flexWrap = 'wrap';
    if (opts.orientation === 'vertical') wrapBox.style.flexDirection = 'column'; else wrapBox.style.flexDirection = 'row';
    let gapValue = "var(--spacing-m)"; if (typeof opts.spacing === 'number') gapValue = `${opts.spacing}px`; else if (typeof opts.spacing === 'string') gapValue = opts.spacing;
    let rowGapValue = gapValue; if (typeof opts.lineSpacing === 'number') rowGapValue = `${opts.lineSpacing}px`; else if (typeof opts.lineSpacing === 'string') rowGapValue = opts.lineSpacing;
    if (rowGapValue !== gapValue) { wrapBox.style.rowGap = rowGapValue; wrapBox.style.columnGap = gapValue; } else wrapBox.style.gap = gapValue;
    const flexAlignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }; wrapBox.style.alignItems = flexAlignMap[opts.align] || flexAlignMap.start;
    const flexJustifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }; wrapBox.style.justifyContent = flexJustifyMap[opts.justify] || flexJustifyMap.start;
    (opts.children || []).forEach(child => { if (child instanceof Node) wrapBox.appendChild(child); }); return wrapBox;
}
export class AdwWrapBox extends HTMLElement { /* ... (Same as original AdwWrapBox WC) ... */
    static get observedAttributes() { return ['orientation', 'spacing', 'line-spacing', 'align', 'justify']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css'; this._wrapBoxElement = document.createElement('div'); this._wrapBoxElement.classList.add('adw-wrap-box'); const slot = document.createElement('slot'); this._wrapBoxElement.appendChild(slot); this.shadowRoot.append(styleLink, this._wrapBoxElement); }
    connectedCallback() { this._updateStyles(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._updateStyles(); }
    _updateStyles() { const opts = {}; if (this.hasAttribute('orientation')) opts.orientation = this.getAttribute('orientation'); if (this.hasAttribute('spacing')) opts.spacing = this.getAttribute('spacing'); if (this.hasAttribute('line-spacing')) opts.lineSpacing = this.getAttribute('line-spacing'); if (this.hasAttribute('align')) opts.align = this.getAttribute('align'); if (this.hasAttribute('justify')) opts.justify = this.getAttribute('justify'); this._wrapBoxElement.style.display = 'flex'; this._wrapBoxElement.style.flexWrap = 'wrap'; if (opts.orientation === 'vertical') this._wrapBoxElement.style.flexDirection = 'column'; else this._wrapBoxElement.style.flexDirection = 'row'; let gapValue = "var(--spacing-m)"; if (opts.spacing) gapValue = isNaN(parseFloat(opts.spacing)) ? opts.spacing : `${opts.spacing}px`; let rowGapValue = gapValue; if (opts.lineSpacing) rowGapValue = isNaN(parseFloat(opts.lineSpacing)) ? opts.lineSpacing : `${opts.lineSpacing}px`; if (rowGapValue !== gapValue) { this._wrapBoxElement.style.rowGap = rowGapValue; this._wrapBoxElement.style.columnGap = gapValue; } else this._wrapBoxElement.style.gap = gapValue; const flexAlignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }; this._wrapBoxElement.style.alignItems = flexAlignMap[opts.align] || flexAlignMap.start; const flexJustifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }; this._wrapBoxElement.style.justifyContent = flexJustifyMap[opts.justify] || flexJustifyMap.start; }
}

/** Creates an AdwClamp container. */
export function createAdwClamp(options = {}) { /* ... (Same as original createAdwClamp) ... */
    const opts = options || {}; const clamp = document.createElement('div'); clamp.classList.add('adw-clamp');
    const innerWrapper = document.createElement('div'); innerWrapper.classList.add('adw-clamp-child-wrapper'); innerWrapper.style.maxWidth = opts.maximumSize || '80ch';
    clamp.style.display = 'flex'; clamp.style.justifyContent = 'center';
    if (opts.child instanceof Node) innerWrapper.appendChild(opts.child); else if (opts.child) console.warn("AdwClamp: options.child was not a valid DOM Node.");
    clamp.appendChild(innerWrapper);
    if (opts.isScrollable) { clamp.classList.add('scrollable'); clamp.style.overflowX = 'hidden'; clamp.style.overflowY = 'auto'; innerWrapper.style.width = '100%'; }
    return clamp;
}
export class AdwClamp extends HTMLElement { /* ... (Same as original AdwClamp WC) ... */
    static get observedAttributes() { return ['maximum-size', 'scrollable']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css'; this._clampElement = document.createElement('div'); this._clampElement.classList.add('adw-clamp'); this._childWrapper = document.createElement('div'); this._childWrapper.classList.add('adw-clamp-child-wrapper'); const slot = document.createElement('slot'); this._childWrapper.appendChild(slot); this._clampElement.appendChild(this._childWrapper); this.shadowRoot.append(styleLink, this._clampElement); }
    connectedCallback() { this._updateStyles(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._updateStyles(); }
    _updateStyles() { this._childWrapper.style.maxWidth = this.getAttribute('maximum-size') || '80ch'; this._clampElement.style.display = 'flex'; this._clampElement.style.justifyContent = 'center'; if (this.hasAttribute('scrollable')) { this._clampElement.classList.add('scrollable'); this._clampElement.style.overflowX = 'hidden'; this._clampElement.style.overflowY = 'auto'; this._childWrapper.style.width = '100%'; } else { this._clampElement.classList.remove('scrollable'); this._clampElement.style.overflowX = ''; this._clampElement.style.overflowY = '';}}
}

/** Creates an AdwBreakpointBin container. */
export function createAdwBreakpointBin(options = {}) { /* ... (Same as original createAdwBreakpointBin, ensure adwGenerateId is available) ... */
    const opts = options || {}; const breakpointBin = document.createElement('div'); breakpointBin.classList.add('adw-breakpoint-bin');
    let sortedChildren = []; if (Array.isArray(opts.children)) { sortedChildren = opts.children.map(c => { let minWidth = 0; if (typeof c.condition === 'number') minWidth = c.condition; else if (typeof c.condition === 'string') { const match = c.condition.match(/min-width:\s*(\d+)(px)?/i); if (match && match[1]) minWidth = parseInt(match[1], 10); else console.warn(`AdwBreakpointBin: Could not parse condition "${c.condition}" for child "${c.name}". Treating as 0.`);} return { ...c, _minWidth: minWidth }; }).sort((a, b) => a._minWidth - b._minWidth); }
    let defaultChild = null; if(opts.defaultChildName) defaultChild = sortedChildren.find(c => c.name === opts.defaultChildName)?.element; if(!defaultChild && sortedChildren.length > 0) defaultChild = sortedChildren[0].element;
    sortedChildren.forEach(childData => { if (childData.element instanceof Node) { childData.element.style.display = 'none'; breakpointBin.appendChild(childData.element); }}); if(defaultChild) defaultChild.style.display = '';
    let currentVisibleChild = defaultChild;
    breakpointBin.updateVisibility = () => { /* ... (same logic) ... */
        const containerWidth = breakpointBin.offsetWidth; let newVisibleChild = defaultChild;
        for (let i = sortedChildren.length - 1; i >= 0; i--) { const childData = sortedChildren[i]; if (containerWidth >= childData._minWidth) { newVisibleChild = childData.element; break; }}
        if (currentVisibleChild !== newVisibleChild) { if (currentVisibleChild) currentVisibleChild.style.display = 'none'; if (newVisibleChild) newVisibleChild.style.display = ''; currentVisibleChild = newVisibleChild; }
    };
    let resizeObserver = null; if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(() => { breakpointBin.updateVisibility(); }); } else console.warn("AdwBreakpointBin: ResizeObserver not supported.");
    breakpointBin.startObserving = () => { if (resizeObserver && !breakpointBin._isObserving) { resizeObserver.observe(breakpointBin); breakpointBin._isObserving = true; breakpointBin.updateVisibility(); }}; // Update on start
    breakpointBin.stopObserving = () => { if (resizeObserver && breakpointBin._isObserving) { resizeObserver.unobserve(breakpointBin); breakpointBin._isObserving = false; }};
    return breakpointBin;
}
export class AdwBreakpointBin extends HTMLElement { /* ... (Same as original AdwBreakpointBin WC, ensure createAdwBreakpointBin is local and adwGenerateId is imported/available) ... */
    static get observedAttributes() { return ['default-child-name']; }
    constructor() { super(); this._breakpointBinInstance = null; this._slotObserver = new MutationObserver(() => this._rebuildChildren()); }
    connectedCallback() { this._rebuildChildren(); if(this._breakpointBinInstance && typeof this._breakpointBinInstance.startObserving === 'function') this._breakpointBinInstance.startObserving(); } // For factory based
    disconnectedCallback() { if (this._breakpointBinInstance && typeof this._breakpointBinInstance.stopObserving === 'function') this._breakpointBinInstance.stopObserving(); this._slotObserver.disconnect(); if(this._resizeObserver) this._resizeObserver.disconnect(); } // For WC based
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (name === 'default-child-name') this._rebuildChildren(); }
    _rebuildChildren() {
        this._slotObserver.disconnect(); // Avoid loops
        const childrenData = [];
        Array.from(this.children).forEach(child => { if (child.nodeType === Node.ELEMENT_NODE) { const condition = child.dataset.condition || child.getAttribute('condition'); const name = child.dataset.name || child.getAttribute('name') || adwGenerateId('bp-child'); if(!child.dataset.name && !child.getAttribute('name')) child.setAttribute('data-name', name); if (condition) childrenData.push({ name: name, element: child, condition: isNaN(parseFloat(condition)) ? condition : parseFloat(condition) }); else console.warn("AdwBreakpointBin WC: Child element missing 'data-condition' or 'condition'.", child); }});
        this._initializeBreakpointLogic(childrenData); // WC handles its own logic now
        this._slotObserver.observe(this, { childList: true, attributes: true, subtree: false, attributeFilter: ['data-condition', 'condition', 'name', 'data-name'] });
    }
    _initializeBreakpointLogic(childrenData) { /* ... (Same as WC logic from original components.js) ... */
        this._sortedChildrenConfig = childrenData.map(c => { let minWidth = 0; if (typeof c.condition === 'number') minWidth = c.condition; else if (typeof c.condition === 'string') { const match = c.condition.match(/min-width:\s*(\d+)(px)?/i); if (match && match[1]) minWidth = parseInt(match[1], 10); } return { ...c, _minWidth: minWidth }; }).sort((a,b) => a._minWidth - b._minWidth);
        let defaultChildName = this.getAttribute('default-child-name'); this._defaultChildElement = null;
        if (defaultChildName) { const found = this._sortedChildrenConfig.find(c => c.name === defaultChildName); if (found) this._defaultChildElement = found.element; }
        if (!this._defaultChildElement && this._sortedChildrenConfig.length > 0) this._defaultChildElement = this._sortedChildrenConfig[0].element;
        this._currentVisibleElement = null;
        if (typeof ResizeObserver !== 'undefined') { if (this._resizeObserver) this._resizeObserver.disconnect(); this._resizeObserver = new ResizeObserver(() => this.updateVisibility()); this._resizeObserver.observe(this); }
        else window.addEventListener('resize', () => this.updateVisibility()); // Fallback
        this.updateVisibility();
    }
    updateVisibility() { /* ... (Same as WC logic from original components.js) ... */
        const containerWidth = this.offsetWidth; let newVisibleElement = this._defaultChildElement;
        for (let i = this._sortedChildrenConfig.length - 1; i >= 0; i--) { const childConfig = this._sortedChildrenConfig[i]; if (containerWidth >= childConfig._minWidth) { newVisibleElement = childConfig.element; break; }}
        if (this._currentVisibleElement !== newVisibleElement) { Array.from(this.children).forEach(child => { if(child.style) child.style.display = 'none'; }); if (newVisibleElement && newVisibleElement.style) newVisibleElement.style.display = ''; this._currentVisibleElement = newVisibleElement; this.dispatchEvent(new CustomEvent('child-changed', { detail: { visibleChildName: newVisibleElement ? (newVisibleElement.dataset.name || newVisibleElement.getAttribute('name')) : null }}));}
    }
}

// No customElements.define here

[end of js/components/layouts.js]
