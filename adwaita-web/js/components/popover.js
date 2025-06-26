import { getAdwCommonStyleSheet, adwMakeFocusable } from './utils.js';

const POPOVER_OFFSET = 8; // Offset from the target element
const ARROW_SIZE = 12; // Width and height of the arrow
const ARROW_OFFSET = 6; // How much the arrow is offset from the edge

export class AdwPopover extends HTMLElement {
    static get observedAttributes() {
        return ['open', 'target', 'position', 'light-dismiss', 'trap-focus'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._targetElement = null;
        this._isOpen = false;
        this._surfaceElement = null;
        this._arrowElement = null; // Optional arrow element

        // Bind methods
        this._handleLightDismiss = this._handleLightDismiss.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
    }

    async connectedCallback() {
        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
            try {
                const commonSheet = await getAdwCommonStyleSheet();
                if (commonSheet && !this.shadowRoot.adoptedStyleSheets.includes(commonSheet)) {
                    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, commonSheet];
                }
            } catch (error) {
                console.warn('AdwPopover: Could not load common stylesheet.', error);
            }
        }
        // Fallback link will be added by _render if needed

        this._render();
        this._resolveTarget();

        if (this.hasAttribute('open')) {
            this.show();
        }
    }

    disconnectedCallback() {
        if (this._isOpen) {
            this._removeGlobalListeners();
        }
        if (this._targetElement && this._targetMutationObserver) {
            this._targetMutationObserver.disconnect();
        }
        window.removeEventListener('resize', this.updatePosition);
        window.removeEventListener('scroll', this.updatePosition, true); // Capture scroll events
         // If popover is part of the main document body, remove it
        if (this.parentElement === document.body && this !== document.body) {
            document.body.removeChild(this);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue && name !== 'open') return; // 'open' needs to react even if current state matches attribute due to programmatic calls

        switch (name) {
            case 'open':
                if (this.hasAttribute('open')) {
                    if (!this._isOpen) this.show();
                } else {
                    if (this._isOpen) this.hide();
                }
                break;
            case 'target':
                this._resolveTarget();
                if (this._isOpen) this.updatePosition();
                break;
            case 'position':
                if (this._isOpen) this.updatePosition();
                break;
        }
    }

    _render() {
        // Ensure CSS is loaded (either adopted or via link)
        if (this.shadowRoot.adoptedStyleSheets.length === 0 && !this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
            if(styleLink.href) this.shadowRoot.appendChild(styleLink);
        }

        if (!this._surfaceElement) {
            this._surfaceElement = document.createElement('div');
            this._surfaceElement.classList.add('adw-popover-surface');
            this._surfaceElement.part.add('surface');

            const slot = document.createElement('slot');
            this._surfaceElement.appendChild(slot);

            this.shadowRoot.appendChild(this._surfaceElement);
        }

        if (this.getAttribute('arrow') !== 'false' && !this._arrowElement) {
            this._arrowElement = document.createElement('div');
            this._arrowElement.classList.add('adw-popover-arrow');
            this._arrowElement.part.add('arrow');
            this.shadowRoot.appendChild(this._arrowElement); // Arrow is sibling of surface for easier positioning
        } else if (this.getAttribute('arrow') === 'false' && this._arrowElement) {
            this._arrowElement.remove();
            this._arrowElement = null;
        }

        // Apply initial styles for hidden state
        this.style.display = 'none'; // Host is hidden by default
        this.style.position = 'fixed'; // Popovers are fixed to viewport
        // z-index is applied by _popover.scss via .adw-popover-surface or :host if needed
    }

    _resolveTarget() {
        const targetSelector = this.getAttribute('target');
        if (targetSelector) {
            this._targetElement = document.querySelector(targetSelector);
            if (!this._targetElement) {
                console.warn(`AdwPopover: Target element "${targetSelector}" not found.`);
            } else {
                this._targetElement.setAttribute('aria-haspopup', 'dialog'); // Or menu, listbox depending on content
                this._targetElement.setAttribute('aria-expanded', String(this._isOpen));
                this._observeTarget();
            }
        } else {
            this._targetElement = null;
        }
    }

    _observeTarget() {
        if (this._targetMutationObserver) this._targetMutationObserver.disconnect();
        if (!this._targetElement || !window.MutationObserver) return;

        // Observe attributes and style changes on the target that might affect its position/size
        this._targetMutationObserver = new MutationObserver(this.updatePosition);
        this._targetMutationObserver.observe(this._targetElement, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    show() {
        if (this._isOpen || !this._surfaceElement) return;
        if (!this._targetElement) {
            this._resolveTarget(); // Try to resolve again if not set
            if (!this._targetElement) {
                console.error('AdwPopover: Cannot show popover without a target element.');
                return;
            }
        }

        // Move to body to avoid stacking context issues, if not already there
        if (this.parentElement !== document.body) {
            document.body.appendChild(this);
        }

        this._isOpen = true;
        this.setAttribute('open', '');
        this.style.display = 'block'; // Show the host
        this._surfaceElement.hidden = false; // Ensure surface is visible

        this.updatePosition(); // Calculate and apply position
        this._setupGlobalListeners();

        if (this.getAttribute('trap-focus') !== 'false') {
            this._trapFocus();
        }

        this._targetElement?.setAttribute('aria-expanded', 'true');
        this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
    }

    hide() {
        if (!this._isOpen || !this._surfaceElement) return;

        this._isOpen = false;
        this.removeAttribute('open');
        this.style.display = 'none'; // Hide the host
        this._surfaceElement.hidden = true;

        this._removeGlobalListeners();
        this._targetElement?.setAttribute('aria-expanded', 'false');
        this._returnFocusToTarget();
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    _setupGlobalListeners() {
        if (this.getAttribute('light-dismiss') !== 'false') {
            // Use setTimeout to avoid capturing the same click that opened the popover
            setTimeout(() => {
                document.addEventListener('pointerdown', this._handleLightDismiss);
            }, 0);
        }
        document.addEventListener('keydown', this._handleKeyDown);
        window.addEventListener('resize', this.updatePosition);
        window.addEventListener('scroll', this.updatePosition, true);
    }

    _removeGlobalListeners() {
        document.removeEventListener('pointerdown', this._handleLightDismiss);
        document.removeEventListener('keydown', this._handleKeyDown);
        window.removeEventListener('resize', this.updatePosition);
        window.removeEventListener('scroll', this.updatePosition, true);
    }

    _handleLightDismiss(event) {
        if (!this._isOpen) return;
        const path = event.composedPath();
        if (!path.includes(this) && (!this._targetElement || !path.includes(this._targetElement))) {
            this.hide();
        }
    }

    _handleKeyDown(event) {
        if (!this._isOpen) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            this.hide();
        } else if (event.key === 'Tab' && this.getAttribute('trap-focus') !== 'false') {
            this._trapFocus(event);
        }
    }

    _trapFocus(event) {
        const focusableElements = adwMakeFocusable(this._surfaceElement).filter(el => el.offsetParent !== null);
        if (focusableElements.length === 0) {
            if(event) event.preventDefault(); // Prevent tabbing out if no focusable elements
            return;
        }

        if (!event) { // Initial focus setting
            focusableElements[0].focus();
            return;
        }

        // Tab key handling
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = this.shadowRoot.activeElement;

        if (event.shiftKey) { // Shift + Tab
            if (activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else { // Tab
            if (activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    _returnFocusToTarget() {
        if (this._targetElement && typeof this._targetElement.focus === 'function') {
            // Check if the target is still in the DOM and focusable
             if (document.body.contains(this._targetElement) && this._targetElement.offsetParent !== null) {
                this._targetElement.focus();
            }
        }
    }

    updatePosition() {
        if (!this._isOpen || !this._targetElement || !this._surfaceElement) return;

        const targetRect = this._targetElement.getBoundingClientRect();
        const popoverRect = this._surfaceElement.getBoundingClientRect(); // Use surface for measurement
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let preferredPosition = this.getAttribute('position') || 'bottom';
        let { top, left } = this._calculatePosition(targetRect, popoverRect, preferredPosition, viewportWidth, viewportHeight);

        // Basic viewport collision detection and flipping (simple version)
        // TODO: More sophisticated flipping logic (e.g. top-start to bottom-start)
        if (preferredPosition.startsWith('bottom')) {
            if (top + popoverRect.height > viewportHeight - POPOVER_OFFSET) { // Flip to top
                ({ top, left } = this._calculatePosition(targetRect, popoverRect, 'top', viewportWidth, viewportHeight));
                preferredPosition = 'top'; // Update current position for arrow
            }
        } else if (preferredPosition.startsWith('top')) {
            if (top < POPOVER_OFFSET) { // Flip to bottom
                ({ top, left } = this._calculatePosition(targetRect, popoverRect, 'bottom', viewportWidth, viewportHeight));
                 preferredPosition = 'bottom';
            }
        } else if (preferredPosition.startsWith('left')) {
            if (left < POPOVER_OFFSET) { // Flip to right
                 ({ top, left } = this._calculatePosition(targetRect, popoverRect, 'right', viewportWidth, viewportHeight));
                  preferredPosition = 'right';
            }
        } else if (preferredPosition.startsWith('right')) {
            if (left + popoverRect.width > viewportWidth - POPOVER_OFFSET) { // Flip to left
                 ({ top, left } = this._calculatePosition(targetRect, popoverRect, 'left', viewportWidth, viewportHeight));
                 preferredPosition = 'left';
            }
        }

        // Final clamping to viewport edges
        this.style.left = `${Math.max(POPOVER_OFFSET, Math.min(left, viewportWidth - popoverRect.width - POPOVER_OFFSET))}px`;
        this.style.top = `${Math.max(POPOVER_OFFSET, Math.min(top, viewportHeight - popoverRect.height - POPOVER_OFFSET))}px`;

        if (this._arrowElement) {
            this._updateArrowPosition(targetRect, this.getBoundingClientRect(), preferredPosition);
        }
    }

    _calculatePosition(targetRect, popoverRect, position, viewportWidth, viewportHeight) {
        let top = 0, left = 0;

        switch (position) {
            case 'top-start':
                top = targetRect.top - popoverRect.height - POPOVER_OFFSET;
                left = targetRect.left;
                break;
            case 'top':
                top = targetRect.top - popoverRect.height - POPOVER_OFFSET;
                left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
                break;
            case 'top-end':
                top = targetRect.top - popoverRect.height - POPOVER_OFFSET;
                left = targetRect.right - popoverRect.width;
                break;
            case 'bottom-start':
                top = targetRect.bottom + POPOVER_OFFSET;
                left = targetRect.left;
                break;
            case 'bottom':
            default: // Default to bottom
                top = targetRect.bottom + POPOVER_OFFSET;
                left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
                break;
            case 'bottom-end':
                top = targetRect.bottom + POPOVER_OFFSET;
                left = targetRect.right - popoverRect.width;
                break;
            case 'left-start':
                top = targetRect.top;
                left = targetRect.left - popoverRect.width - POPOVER_OFFSET;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
                left = targetRect.left - popoverRect.width - POPOVER_OFFSET;
                break;
            case 'left-end':
                top = targetRect.bottom - popoverRect.height;
                left = targetRect.left - popoverRect.width - POPOVER_OFFSET;
                break;
            case 'right-start':
                top = targetRect.top;
                left = targetRect.right + POPOVER_OFFSET;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2);
                left = targetRect.right + POPOVER_OFFSET;
                break;
            case 'right-end':
                top = targetRect.bottom - popoverRect.height;
                left = targetRect.right + POPOVER_OFFSET;
                break;
        }
        return { top, left };
    }

    _updateArrowPosition(targetRect, currentPopoverRect, position) {
        if (!this._arrowElement) return;
        this._arrowElement.style.display = 'block';
        this._arrowElement.className = 'adw-popover-arrow'; // Reset classes

        let arrowTop = 0, arrowLeft = 0;

        // Calculate arrow position relative to the popover's _surfaceElement_
        // Note: currentPopoverRect is the :host element. We need to adjust for surface's position within host.
        // For simplicity now, assume surface is at 0,0 of host after host is positioned.
        const surfaceRect = this._surfaceElement.getBoundingClientRect();


        if (position.startsWith('bottom')) { // Arrow points up
            this._arrowElement.classList.add('arrow-up');
            arrowTop = -ARROW_OFFSET; // Arrow is outside, above the surface
            // Center arrow relative to target's center, clamped to popover edges
            const targetCenterX = targetRect.left + targetRect.width / 2;
            arrowLeft = targetCenterX - surfaceRect.left - (ARROW_SIZE / 2);
        } else if (position.startsWith('top')) { // Arrow points down
            this._arrowElement.classList.add('arrow-down');
            arrowTop = surfaceRect.height - ARROW_OFFSET; // Arrow is inside, at bottom of surface
            const targetCenterX = targetRect.left + targetRect.width / 2;
            arrowLeft = targetCenterX - surfaceRect.left - (ARROW_SIZE / 2);
        } else if (position.startsWith('right')) { // Arrow points left
            this._arrowElement.classList.add('arrow-left');
            arrowLeft = -ARROW_OFFSET; // Arrow is outside, to the left of surface
            const targetCenterY = targetRect.top + targetRect.height / 2;
            arrowTop = targetCenterY - surfaceRect.top - (ARROW_SIZE / 2);
        } else if (position.startsWith('left')) { // Arrow points right
            this._arrowElement.classList.add('arrow-right');
            arrowLeft = surfaceRect.width - ARROW_OFFSET; // Arrow is inside, at right of surface
            const targetCenterY = targetRect.top + targetRect.height / 2;
            arrowTop = targetCenterY - surfaceRect.top - (ARROW_SIZE / 2);
        }

        // Clamp arrow position to be within the popover's bounds
        arrowLeft = Math.max(ARROW_OFFSET, Math.min(arrowLeft, surfaceRect.width - ARROW_SIZE - ARROW_OFFSET));
        arrowTop = Math.max(ARROW_OFFSET, Math.min(arrowTop, surfaceRect.height - ARROW_SIZE - ARROW_OFFSET));

        this._arrowElement.style.top = `${arrowTop}px`;
        this._arrowElement.style.left = `${arrowLeft}px`;
    }


    get targetElement() { return this._targetElement; }
    set targetElement(element) {
        if (element instanceof HTMLElement) {
            this._targetElement = element;
            this.removeAttribute('target'); // Remove attribute if property is set
            if (this.isConnected && this._isOpen) this.updatePosition();
             this._targetElement.setAttribute('aria-haspopup', 'dialog');
             this._targetElement.setAttribute('aria-expanded', String(this._isOpen));
             this._observeTarget();
        } else {
            this._targetElement = null;
        }
    }

    get isOpen() { return this._isOpen; }
}

export function createAdwPopover(options = {}) {
    const popover = document.createElement('adw-popover');
    if (options.target) {
        if (options.target instanceof HTMLElement) {
            popover.targetElement = options.target;
        } else if (typeof options.target === 'string') {
            popover.setAttribute('target', options.target);
        }
    }
    if (options.position) popover.setAttribute('position', options.position);
    if (options.arrow === false) popover.setAttribute('arrow', 'false');
    if (options.lightDismiss === false) popover.setAttribute('light-dismiss', 'false');
    if (options.trapFocus === false) popover.setAttribute('trap-focus', 'false');

    if (options.content) {
        if (options.content instanceof Node) {
            popover.appendChild(options.content);
        } else if (typeof options.content === 'string') {
            // Create a simple paragraph for string content for safety
            const contentP = document.createElement('p');
            contentP.textContent = options.content;
            popover.appendChild(contentP);
        }
    }
    return popover;
}
