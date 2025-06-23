import { sanitizeHref } from './utils.js'; // Import sanitizeHref

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
 * @param {string} [options.iconName] - Name of the Adwaita icon (e.g., 'actions/document-save-symbolic'). Takes precedence over `icon`.
 * @param {string} [options.icon] - Deprecated: HTML string for an SVG icon, or a class name for an icon font. Use `iconName` instead.
 * @returns {HTMLButtonElement|HTMLAnchorElement} The created button element.
 */
export function createAdwButton(text, options = {}) {
  const opts = options || {};
  const button = document.createElement("adw-button");

  // Set ARIA attributes FIRST, as subsequent attribute settings (e.g. icon-name)
  // might trigger AdwButton's attributeChangedCallback and an early _render call.
  for (const key in opts) {
    if (key.startsWith('aria-')) {
      let attrName = key;
      // Normalize common camelCase ARIA properties to kebab-case for attributes
      if (key === 'ariaLabel') attrName = 'aria-label';
      else if (key === 'ariaLabelledby') attrName = 'aria-labelledby';
      else if (key === 'ariaDescribedby') attrName = 'aria-describedby';
      // Add more normalizations if other aria-* properties are expected in camelCase
      if (opts[key] !== null && opts[key] !== undefined) {
        button.setAttribute(attrName, opts[key]);
      }
    }
  }

  if (text) {
    button.textContent = text;
  }

  // Set other attributes
  if (opts.href) {
    button.setAttribute("href", opts.href);
  }
  // Important: Check opts.disabled for adding listener, but always set attribute if present.
  // The AdwButton component will handle its disabled state internally.
  if (opts.disabled) {
    button.setAttribute("disabled", "");
  }

  if (opts.suggested) {
    button.setAttribute("suggested", "");
  }
  if (opts.destructive) {
    button.setAttribute("destructive", "");
  }
  if (opts.flat) {
    button.setAttribute("flat", "");
  }
  if (opts.active) {
    button.setAttribute("active", "");
  }
  if (opts.isCircular) {
    button.setAttribute("circular", "");
  }

  if (opts.iconName) {
    button.setAttribute("icon-name", opts.iconName);
  } else if (opts.icon) {
    button.setAttribute("icon", opts.icon);
  }

  // Handle specific, known camelCased ARIA properties explicitly
  if (opts.ariaLabel !== undefined) {
    button.setAttribute('aria-label', opts.ariaLabel);
  }
  if (opts.ariaLabelledby !== undefined) {
    button.setAttribute('aria-labelledby', opts.ariaLabelledby);
  }
  if (opts.ariaDescribedby !== undefined) {
    button.setAttribute('aria-describedby', opts.ariaDescribedby);
  }

  // Pass through any direct aria-* attributes already in kebab-case
  for (const key in opts) {
    if (key.startsWith('aria-')) {
      // This will re-set if they were also provided as camelCase and handled above,
      // but direct kebab-case should take precedence or be the same.
      // Avoid re-setting for the specific camelCase keys already handled.
      if (key === 'aria-label' && opts.ariaLabel !== undefined) continue;
      if (key === 'aria-labelledby' && opts.ariaLabelledby !== undefined) continue;
      if (key === 'aria-describedby' && opts.ariaDescribedby !== undefined) continue;

      if (opts[key] !== null && opts[key] !== undefined) {
        button.setAttribute(key, opts[key]);
      }
    }
  }

  // Pass through 'type' attribute if provided in options

  if (opts.type) {
    button.setAttribute("type", opts.type);
  }
  if (opts.appearance) {
    button.setAttribute("appearance", opts.appearance);
  }

  // Add click listener last, after disabled state is potentially set.
  // The AdwButton component itself should manage preventing clicks when disabled.
  // This listener is for convenience if the factory user wants a quick handler
  // on the host element, though interaction should ideally be with the component's state.
  if (typeof opts.onClick === 'function') {
    button.addEventListener("click", (e) => {
        // Check the component's actual disabled state before firing
        if (button.hasAttribute('disabled')) return;
        opts.onClick(e);
    });
  }

  return button;
}

export class AdwButton extends HTMLElement {
    static get observedAttributes() {
        return ['href', 'suggested', 'destructive', 'flat', 'disabled', 'active', 'circular', 'icon-name', 'icon', 'appearance', 'type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        // Assuming Adw object will be available globally for config path
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */
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

        // Icon handling - New 'icon-name' attribute takes precedence
        const iconNameAttr = this.getAttribute('icon-name');
        const iconAttr = this.getAttribute('icon'); // Deprecated

        if (iconNameAttr && window.Adw && Adw.createIcon) {
            const isCircular = this.hasAttribute('circular');
            // Determine if button has text content by checking slotted nodes
            const hasTextContent = Array.from(this.childNodes).some(node =>
                (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') ||
                (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('slot')) // Element not in a named slot
            );

            const iconElement = Adw.createIcon(iconNameAttr, {
                alt: hasTextContent ? undefined : (this.getAttribute('aria-label') || this.textContent.trim() || (isCircular ? 'icon' : 'button icon'))
            });
            internalButton.insertBefore(iconElement, internalButton.firstChild);
        } else if (iconAttr) { // Fallback to old icon logic (deprecated)
            const iconSpan = document.createElement("span");
            iconSpan.classList.add("icon"); // Generic class for styling
            if (iconAttr.trim().startsWith("<svg")) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(iconAttr, "image/svg+xml");
                const svgElement = doc.querySelector("svg");
                if (svgElement) {
                    Array.from(svgElement.querySelectorAll('script')).forEach(script => script.remove());
                    iconSpan.appendChild(svgElement);
                } else {
                     console.warn("AdwButton WC: Invalid SVG string for (deprecated) icon attribute.", iconAttr);
                }
            } else if (iconAttr.trim() !== '') {
                iconSpan.classList.add(iconAttr);
            }
            if (iconSpan.hasChildNodes() || iconSpan.classList.length > 1) {
                 internalButton.insertBefore(iconSpan, internalButton.firstChild);
            }
        }

        // Text content / Slot for text
        const slot = document.createElement('slot');
        internalButton.appendChild(slot);

        // Accessibility: Transfer relevant ARIA attributes from host to internal button.
        // Specific label handling for icon-only buttons will be done after icon processing.
        ['aria-labelledby', 'aria-describedby', 'aria-pressed', 'aria-expanded', 'aria-haspopup'].forEach(ariaAttr => {
            if (this.hasAttribute(ariaAttr)) {
                internalButton.setAttribute(ariaAttr, this.getAttribute(ariaAttr));
            }
        });

        // Determine if button is effectively icon-only to guide aria-label setting
        const hasSlottedText = Array.from(this.childNodes).some(node =>
            (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') ||
            (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('slot'))
        );
        const hostAriaLabel = this.getAttribute('aria-label');
        const hostTitle = this.getAttribute('title'); // Title can also provide accessible name
        let isEffectivelyIconOnly = false;

        if (iconNameAttr) { // iconNameAttr already defined above
            isEffectivelyIconOnly = !hasSlottedText;
        } else if (iconAttr) { // iconAttr already defined above
            isEffectivelyIconOnly = !hasSlottedText;
        } else {
            isEffectivelyIconOnly = false; // No icon, so not icon-only
        }

        if (isEffectivelyIconOnly) {
            if (hostAriaLabel) {
                internalButton.setAttribute('aria-label', hostAriaLabel);
            } else if (hostTitle) {
                internalButton.setAttribute('aria-label', hostTitle);
            }
            // If neither, the warning below will catch it.
        } else if (hostAriaLabel) {
            // If it has text AND an aria-label, apply it.
            internalButton.setAttribute('aria-label', hostAriaLabel);
        }
        // If it has text and no hostAriaLabel, the text itself is the accessible name.

        if (isLink) {
            const safeHref = sanitizeHref(href);
            if (safeHref) {
                internalButton.href = safeHref;
            } else {
                console.warn(`AdwButton WC: Blocked potentially unsafe href: ${href}`);
                internalButton.href = "#"; // Fallback to a safe href
            }
            if (this.hasAttribute('disabled')) {
                internalButton.classList.add("disabled"); // Visual styling for disabled link
                internalButton.setAttribute("aria-disabled", "true");
                internalButton.removeAttribute("href"); // Links cannot be truly disabled by attribute alone
                internalButton.addEventListener('click', e => e.preventDefault()); // Prevent navigation
            }
        } else { // It's a <button>
            if (this.hasAttribute('disabled')) {
                internalButton.setAttribute("disabled", "");
                // aria-disabled is implicit for button[disabled], but explicit doesn't hurt.
                internalButton.setAttribute("aria-disabled", "true");
            }
            const buttonType = this.getAttribute('type');
            if (buttonType && ['submit', 'reset', 'button'].includes(buttonType)) {
                 internalButton.setAttribute('type', buttonType);
            } else {
                 internalButton.setAttribute('type', 'button');
            }
        }

        // Apply styling classes based on attributes
        if (this.hasAttribute('suggested')) internalButton.classList.add("suggested-action");
        if (this.hasAttribute('destructive')) internalButton.classList.add("destructive-action");
        if (this.hasAttribute('flat')) internalButton.classList.add("flat");
        if (this.hasAttribute('active')) internalButton.classList.add("active");
        if (this.hasAttribute('circular')) {
            internalButton.classList.add("circular");
        }

        const appearance = this.getAttribute('appearance');
        if (appearance) {
            internalButton.classList.add(appearance);
        }

        // Warning check: Re-read attributes directly in the condition for maximum freshness,
        // though the previous change to the factory order is the more critical fix.
        if (isEffectivelyIconOnly &&
            !this.getAttribute('aria-label') &&      // Direct re-read
            !this.getAttribute('aria-labelledby') && // Already direct
            !this.getAttribute('title')) {           // Direct re-read

            let iconInfo = 'unspecified icon';
            // iconNameAttr and iconAttr are already defined earlier in this function.
            if (iconNameAttr) {
                iconInfo = `icon-name: "${iconNameAttr}"`;
            } else if (iconAttr) {
                iconInfo = `icon attribute (deprecated): "${iconAttr.substring(0,30)}"`;
            }
            // The warning is about the host <adw-button> lacking an accessible name.
            console.warn(`AdwButton WC: Icon-only button created without an accessible name on the host element (aria-label, aria-labelledby, or title). ${iconInfo}`, this);
        }

        this.shadowRoot.appendChild(internalButton);
    }
}

// customElements.define('adw-button', AdwButton); // Will be done in the main aggregator
