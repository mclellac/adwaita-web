import { sanitizeHref, getAdwCommonStyleSheet } from './utils.js'; // Import sanitizeHref and getAdwCommonStyleSheet

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

// Stylesheet loading is now handled by getAdwCommonStyleSheet from utils.js

/**
 * @element adw-button
 * @description An Adwaita-styled button component that can act as a standard button or a link.
 * It supports various styles like suggested/destructive actions, flat, and circular for icon buttons.
 *
 * @attr {String} [href] - If provided, the button renders as an `<a>` tag, using this value for its `href`.
 *                         Sanitized to prevent unsafe protocols.
 * @attr {Boolean} [suggested] - If present, applies the 'suggested-action' styling (e.g., for primary actions).
 * @attr {Boolean} [destructive] - If present, applies the 'destructive-action' styling (e.g., for delete actions).
 * @attr {Boolean} [flat] - If present, applies a flat style with no background or border unless hovered/active.
 * @attr {Boolean} [disabled] - If present, disables the button, preventing clicks and changing appearance.
 * @attr {Boolean} [active] - If present, forces an 'active' or 'pressed' visual state. Useful for toggle buttons.
 * @attr {Boolean} [circular] - If present, styles the button as a circle, typically for icon-only buttons.
 * @attr {String} [icon-name] - The name of an Adwaita icon to display (e.g., 'document-save-symbolic').
 *                              This is the preferred way to add icons.
 * @attr {String} [icon] - Deprecated. Used to specify an icon, either as an SVG string or an icon font class.
 *                         Use `icon-name` instead.
 * @attr {String} [appearance] - Allows for additional appearance classes to be added to the internal button for custom styling.
 * @attr {String} [type] - For non-link buttons, specifies the button type (e.g., 'submit', 'reset', 'button'). Defaults to 'button'.
 *
 * @slot - The default slot is used for the button's text content.
 *
 * @csspart button - The internal `<button>` or `<a>` element. (Note: This part is not explicitly defined yet, but would be a good addition)
 *
 * @fires click - Standard click event. For `type="submit"`, it also attempts to submit the closest form.
 *
 * @example
 * <!-- Standard Button -->
 * <adw-button>Click Me</adw-button>
 *
 * <!-- Suggested Action Button with Icon -->
 * <adw-button suggested icon-name="object-select-symbolic">Save</adw-button>
 *
 * <!-- Destructive Link Button -->
 * <adw-button destructive href="/delete-item">Delete</adw-button>
 *
 * <!-- Circular Icon-Only Button -->
 * <adw-button circular icon-name="go-previous-symbolic" aria-label="Go Back"></adw-button>
 */
export class AdwButton extends HTMLElement {
    /**
     * @internal
     */
    static get observedAttributes() {
        return ['href', 'suggested', 'destructive', 'flat', 'disabled', 'active', 'circular', 'icon-name', 'icon', 'appearance', 'type'];
    }

    /**
     * Creates an instance of AdwButton.
     * @constructor
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Styles will be applied in connectedCallback after sheet is loaded
    }

    /**
     * @internal
     * Lifecycle callback invoked when the element is added to the DOM.
     * Handles stylesheet adoption and initial rendering.
     */
    async connectedCallback() {
        // Check if CSSStyleSheet is supported and adoptedStyleSheets is available
        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
            try {
                const commonSheet = await getAdwCommonStyleSheet(); // From utils.js
                if (commonSheet && !this.shadowRoot.adoptedStyleSheets.includes(commonSheet)) {
                    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, commonSheet];
                } else if (!commonSheet) {
                    // If commonSheet failed to load (e.g. cssPath not defined, network error)
                    console.warn("AdwButton: Common stylesheet not available, attempting fallback.");
                    this._fallbackLoadStylesheet();
                }
            } catch (error) {
                // Catch errors from getAdwCommonStyleSheet promise rejection
                console.error("AdwButton: Error adopting common stylesheet, attempting fallback.", error);
                this._fallbackLoadStylesheet();
            }
        } else {
            // Fallback for browsers that don't support adoptedStyleSheets
            this._fallbackLoadStylesheet();
        }

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

    _fallbackLoadStylesheet() {
        // Fallback for browsers that don't support adoptedStyleSheets,
        // or if the adopted stylesheet failed to load.
        if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
            if (styleLink.href) {
                this.shadowRoot.appendChild(styleLink);
            } else {
                console.warn("AdwButton: Fallback stylesheet Adw.config.cssPath is not defined.");
            }
        }
    }

    _render() {
        // Clear previous content (excluding adopted stylesheets or the fallback link)
        const nodesToRemove = [];
        for (const child of this.shadowRoot.childNodes) {
            if (child.nodeName !== 'STYLE' && !(child.nodeName === 'LINK' && child.getAttribute('rel') === 'stylesheet')) {
                nodesToRemove.push(child);
            }
        }
        nodesToRemove.forEach(node => this.shadowRoot.removeChild(node));


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

        // Warning check: Use queueMicrotask to delay the check slightly,
        // allowing parent components to fully set attributes during their own rendering.
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(() => {
                // Re-fetch attributes within the microtask as their values might have settled.
                const currentHostAriaLabel = this.getAttribute('aria-label');
                const currentHostAriaLabelledBy = this.getAttribute('aria-labelledby');
                const currentHostTitle = this.getAttribute('title');
                const currentIconNameAttr = this.getAttribute('icon-name'); // Re-check icon presence
                const currentIconAttr = this.getAttribute('icon'); // Re-check deprecated icon

                // Re-determine if icon-only based on current state
                const currentHasSlottedText = Array.from(this.childNodes).some(node =>
                    (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') ||
                    (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('slot'))
                );
                let currentIsEffectivelyIconOnly = false;
                if (currentIconNameAttr || currentIconAttr) {
                    currentIsEffectivelyIconOnly = !currentHasSlottedText;
                }

                if (currentIsEffectivelyIconOnly &&
                    !currentHostAriaLabel &&
                    !currentHostAriaLabelledBy &&
                    !currentHostTitle) {

                    let iconInfo = 'unspecified icon';
                    if (currentIconNameAttr) {
                        iconInfo = `icon-name: "${currentIconNameAttr}"`;
                    } else if (currentIconAttr) {
                        iconInfo = `icon attribute (deprecated): "${currentIconAttr.substring(0,30)}"`;
                    }
                    console.warn(`AdwButton WC (deferred check): Icon-only button created without an accessible name on the host element (aria-label, aria-labelledby, or title). ${iconInfo}`, this);
                }
            });
        } else {
            // Fallback for environments without queueMicrotask (e.g., older browsers, though unlikely for modern dev)
            // Or, simply perform the check immediately if queueMicrotask is not critical.
            // For this case, we'll keep the immediate check as a fallback.
            if (isEffectivelyIconOnly &&
                !hostAriaLabel && // Use already fetched values for immediate check
                !this.getAttribute('aria-labelledby') &&
                !hostTitle) {
                let iconInfo = 'unspecified icon';
                if (iconNameAttr) iconInfo = `icon-name: "${iconNameAttr}"`;
                else if (iconAttr) iconInfo = `icon attribute (deprecated): "${iconAttr.substring(0,30)}"`;
                console.warn(`AdwButton WC (immediate check): Icon-only button created without an accessible name on the host element (aria-label, aria-labelledby, or title). ${iconInfo}`, this);
            }
        }

        this.shadowRoot.appendChild(internalButton);
    }
}

// customElements.define('adw-button', AdwButton); // Will be done in the main aggregator
