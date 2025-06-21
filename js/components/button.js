// import { adwGenerateId } from './utils.js'; // Not directly used here, but good practice if other utils were needed

/**
 * Creates an Adwaita-style button.
 * @param {string} text - The text content of the button. Can be empty if using an icon.
 * @param {object} [options={}] - Configuration options for the button.
 * @param {string} [options.href] - If provided, creates an anchor (<a>) tag styled as a button.
 *                                  SECURITY: Ensure this URL is from a trusted source or properly validated
 *                                  to prevent XSS via `javascript:` URLs.
 * @param {function} [options.onClick] - Callback function for the button's click event. Not called if disabled.
 * @param {boolean} [options.suggested=false] - If true, applies the 'suggested-action' class.
 * @param {boolean} [options.destructive=false] - If true, applies the 'destructive-action' class.
 * @param {boolean} [options.flat=false] - If true, applies the 'flat' class.
 * @param {boolean} [options.disabled=false] - If true, disables the button.
 * @param {boolean} [options.active=false] - If true, applies the 'active' class.
 * @param {boolean} [options.isCircular=false] - If true, applies the 'circular' class (for icon-only buttons).
 * @param {string} [options.icon] - HTML string for an SVG icon, or a class name for an icon font.
 *                                  SECURITY: If providing an HTML string for an icon, ensure it's from a trusted source or sanitized.
 * @returns {HTMLButtonElement|HTMLAnchorElement} The created button element.
 */
export function createAdwButton(text, options = {}) {
  const opts = options || {};
  const isLink = !!opts.href;
  const button = document.createElement(isLink ? "a" : "button");
  button.classList.add("adw-button");
  if (text) {
    button.textContent = text;
  }

  if (isLink) {
    const safeHref = utils.sanitizeHref(opts.href); // Use utility for sanitization
    if (safeHref) {
        button.href = safeHref;
    } else {
        console.warn(`AdwButton: Blocked potentially unsafe href: ${opts.href}`);
        button.href = "#"; // Fallback to a safe href
    }
    if (opts.disabled) {
        button.classList.add("disabled"); // Custom styling for disabled links
        button.setAttribute("aria-disabled", "true");
        button.removeAttribute("href"); // Also remove href for disabled links
    }
  } else {
    if (opts.disabled) {
      button.setAttribute("disabled", "");
      button.setAttribute("aria-disabled", "true");
    }
  }

  if (opts.onClick && !opts.disabled) {
    button.addEventListener("click", opts.onClick);
  }
  if (opts.suggested) {
    button.classList.add("suggested-action");
  }
  if (opts.destructive) {
    button.classList.add("destructive-action");
  }
  if (opts.flat) {
    button.classList.add("flat");
  }
  if (opts.active) {
    button.classList.add("active");
  }
  if (opts.isCircular) {
    button.classList.add("circular");
  }
  if (opts.icon) {
    const iconSpan = document.createElement("span");
    iconSpan.classList.add("icon");
    if (typeof opts.icon === 'string' && opts.icon.trim().startsWith("<svg")) {
        // Use DOMParser for safer SVG string parsing
        const parser = new DOMParser();
        const doc = parser.parseFromString(opts.icon, "image/svg+xml");
        const svgElement = doc.querySelector("svg");
        if (svgElement) {
            // Check for parsing errors or script injection if stricter handling is needed
            // For now, assuming valid, non-malicious SVG from trusted sources.
            iconSpan.appendChild(svgElement);
        } else {
            console.warn("AdwButton: Invalid SVG string provided for icon.", opts.icon);
            // Fallback or error display could go here
        }
    } else if (typeof opts.icon === 'string' && opts.icon.trim() !== '') { // Also check for non-empty string
        iconSpan.classList.add(opts.icon); // Assume it's a class name
    }
    // Only insert iconSpan if it has content (either an SVG or classes)
    if (iconSpan.hasChildNodes() || iconSpan.classList.length > 1) { // length > 1 because it always has 'icon'
        button.insertBefore(iconSpan, button.firstChild);
    }
  }
  return button;
}

export class AdwButton extends HTMLElement {
    static get observedAttributes() {
        return ['href', 'suggested', 'destructive', 'flat', 'disabled', 'active', 'circular', 'icon', 'appearance', 'type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        // Assuming Adw object will be available globally for config path
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
        if (this.getAttribute('type') === 'submit') {
            const internalButton = this.shadowRoot.querySelector('button, a');
            if (internalButton) {
                internalButton.addEventListener('click', (e) => {
                    if (internalButton.type !== 'submit') {
                        e.preventDefault();
                    }
                    const form = this.closest('form');
                    if (form) {
                        if (typeof form.requestSubmit === 'function') {
                            form.requestSubmit();
                        } else {
                            const tempSubmit = document.createElement('button');
                            tempSubmit.type = 'submit';
                            tempSubmit.style.display = 'none';
                            form.appendChild(tempSubmit);
                            tempSubmit.click();
                            form.removeChild(tempSubmit);
                        }
                    }
                });
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        // Clear previous content except for the style link
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const href = this.getAttribute('href');
        const isLink = !!href;

        const internalButton = document.createElement(isLink ? "a" : "button");
        internalButton.classList.add("adw-button");

        ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-pressed', 'aria-expanded', 'aria-haspopup'].forEach(ariaAttr => {
            if (this.hasAttribute(ariaAttr)) {
                internalButton.setAttribute(ariaAttr, this.getAttribute(ariaAttr));
            }
        });

        // Icon handling
        const iconAttr = this.getAttribute('icon');
        if (iconAttr) {
            const iconSpan = document.createElement("span");
            iconSpan.classList.add("icon");
            if (iconAttr.trim().startsWith("<svg")) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(iconAttr, "image/svg+xml");
                const svgElement = doc.querySelector("svg");
                if (svgElement) {
                    // Basic check: remove <script> elements from parsed SVG
                    Array.from(svgElement.querySelectorAll('script')).forEach(script => script.remove());
                    iconSpan.appendChild(svgElement);
                } else {
                     console.warn("AdwButton WC: Invalid SVG string provided for icon attribute.", iconAttr);
                }
            } else if (iconAttr.trim() !== '') {
                iconSpan.classList.add(iconAttr); // Assume it's a class name
            }
            if (iconSpan.hasChildNodes() || iconSpan.classList.length > 1) {
                 internalButton.appendChild(iconSpan); // Append icon first
            }
        }

        // Text content / Slot for text
        const slot = document.createElement('slot');
        internalButton.appendChild(slot);


        if (isLink) {
            const safeHref = utils.sanitizeHref(href);
            if (safeHref) {
                internalButton.href = safeHref;
            } else {
                console.warn(`AdwButton WC: Blocked potentially unsafe href: ${href}`);
                internalButton.href = "#";
            }
            if (this.hasAttribute('disabled')) {
                internalButton.classList.add("disabled");
                internalButton.setAttribute("aria-disabled", "true");
                internalButton.removeAttribute("href");
            }
        } else { // It's a <button>
            if (this.hasAttribute('disabled')) {
                internalButton.setAttribute("disabled", "");
                internalButton.setAttribute("aria-disabled", "true");
            }
            // Handle button type (submit, reset, button)
            const buttonType = this.getAttribute('type');
            if (buttonType && ['submit', 'reset', 'button'].includes(buttonType)) {
                 internalButton.setAttribute('type', buttonType);
            } else {
                 internalButton.setAttribute('type', 'button'); // Default for <button>
            }
        }

        // Apply styling classes based on attributes
        if (this.hasAttribute('suggested')) internalButton.classList.add("suggested-action");
        if (this.hasAttribute('destructive')) internalButton.classList.add("destructive-action");
        if (this.hasAttribute('flat')) internalButton.classList.add("flat");
        if (this.hasAttribute('active')) internalButton.classList.add("active");
        if (this.hasAttribute('circular')) {
            internalButton.classList.add("circular");
            // If circular, and icon is present, and slot is empty (no text), remove slot for better centering.
            // This check requires knowing if the default slot has assigned nodes.
            // For simplicity, we assume if 'circular' and 'icon' are present, text is usually omitted by user.
        }

        const appearance = this.getAttribute('appearance');
        if (appearance) {
            internalButton.classList.add(appearance);
        }

        if (internalButton.classList.contains('circular') && !internalButton.getAttribute('aria-label') && !internalButton.getAttribute('aria-labelledby') && !this.getAttribute('title')) {
            const iconContent = iconAttr || 'unspecified icon';
            console.warn(`AdwButton WC: Circular (icon-only) button created without an accessible name (aria-label, aria-labelledby, or title). Icon: "${iconContent.substring(0,30)}"`, this);
        }

        this.shadowRoot.appendChild(internalButton);
    }
}

// customElements.define('adw-button', AdwButton); // Will be done in the main aggregator
