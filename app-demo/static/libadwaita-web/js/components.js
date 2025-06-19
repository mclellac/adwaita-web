// js/components.js

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
function createAdwButton(text, options = {}) {
  const opts = options || {}; // Ensure options is an object
  const isLink = !!opts.href;
  const button = document.createElement(isLink ? "a" : "button");
  button.classList.add("adw-button");
  if (text) { // Only set textContent if text is provided
    button.textContent = text;
  }

  if (isLink) {
    button.href = opts.href;
    if (opts.disabled) { // Links don't have a disabled attribute
        button.classList.add("disabled"); // Custom styling for disabled links
        button.setAttribute("aria-disabled", "true");
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
    // SECURITY: User of the framework is responsible for sanitizing HTML if options.icon can be user-supplied.
    // For this framework, we assume options.icon is trusted if it's HTML.
    if (typeof opts.icon === 'string' && opts.icon.trim().startsWith("<svg")) {
        iconSpan.innerHTML = opts.icon; // Potentially unsafe if opts.icon is untrusted HTML
    } else if (typeof opts.icon === 'string') {
        iconSpan.classList.add(opts.icon);
    }
    button.insertBefore(iconSpan, button.firstChild);
  }
  return button;
}


/**
 * Creates an Adwaita-style text entry.
 * @param {object} [options={}] - Configuration options for the entry.
 * @param {string} [options.placeholder] - Placeholder text for the entry.
 * @param {string} [options.value] - Initial value for the entry.
 * @param {function} [options.onInput] - Callback function for the input event.
 * @param {boolean} [options.disabled=false] - If true, disables the entry.
 * @returns {HTMLInputElement} The created entry element.
 */
function createAdwEntry(options = {}) {
  const opts = options || {};
  const entry = document.createElement("input");
  entry.type = "text";
  entry.classList.add("adw-entry");

  if (opts.placeholder) {
    entry.placeholder = opts.placeholder;
  }
  if (opts.value) {
    entry.value = opts.value;
  }
  if (typeof opts.onInput === 'function') {
    entry.addEventListener("input", opts.onInput);
  }
  if (opts.disabled) {
    entry.setAttribute("disabled", "");
    entry.setAttribute("aria-disabled", "true");
  }
  return entry;
}

/**
 * Creates an Adwaita-style switch.
 * @param {object} [options={}] - Configuration options for the switch.
 * @param {boolean} [options.checked=false] - Initial checked state of the switch.
 * @param {function} [options.onChanged] - Callback function when the switch state changes.
 * @param {boolean} [options.disabled=false] - If true, disables the switch.
 * @param {string} [options.label] - Optional label text to display next to the switch.
 * @returns {HTMLLabelElement} The created switch component (label wrapper).
 */
function createAdwSwitch(options = {}) {
  const opts = options || {};
  const wrapper = document.createElement("label");
  wrapper.classList.add("adw-switch");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("role", "switch");
  if(typeof opts.onChanged === 'function') {
    input.addEventListener("change", opts.onChanged);
  }

  const slider = document.createElement("span");
  slider.classList.add("adw-switch-slider");
  slider.setAttribute("aria-hidden", "true"); // Decorative element

  wrapper.appendChild(input);
  wrapper.appendChild(slider);

  if (opts.checked) {
    input.checked = true;
  }
  if (opts.disabled) {
    input.setAttribute("disabled", "");
    wrapper.setAttribute("aria-disabled", "true");
    wrapper.classList.add("disabled");
  }
  if (opts.label) {
    const labelSpan = document.createElement("span");
    labelSpan.classList.add("adw-switch-label");
    labelSpan.textContent = opts.label;
    wrapper.appendChild(labelSpan);
  }
  return wrapper;
}

/**
 * Creates an Adwaita-style label.
 * @param {string} text - The text content of the label.
 * @param {object} [options={}] - Configuration options for the label.
 * @param {string} [options.htmlTag="label"] - The HTML tag to use (e.g., "label", "span", "p", "h1").
 * @param {string} [options.for] - The ID of the element this label is for (only if htmlTag is "label").
 * @param {number} [options.title] - Heading level (1-4), applies 'title-N' class.
 * @param {boolean} [options.isBody=false] - If true, applies 'body' class.
 * @param {boolean} [options.isCaption=false] - If true, applies 'caption' class.
 * @param {boolean} [options.isLink=false] - If true, styles the label like a link and makes it interactive if onClick is provided.
 * @param {function} [options.onClick] - Click handler, especially useful with `isLink`.
 * @param {boolean} [options.isDisabled=false] - If true, applies 'disabled' class and aria-disabled.
 * @returns {HTMLElement} The created label element.
 */
function createAdwLabel(text, options = {}) {
  const opts = options || {};
  const tag = opts.htmlTag || "label";
  const label = document.createElement(tag);
  label.classList.add("adw-label");
  label.textContent = text;

  if (tag === "label" && opts.for) {
    label.setAttribute("for", opts.for);
  } else if (tag !== "label" && opts.for) {
     console.warn("AdwLabel: 'for' attribute is only applicable to <label> elements.");
  }

  if (opts.title && opts.title >= 1 && opts.title <= 4) {
    label.classList.add(`title-${opts.title}`);
  }
  if (opts.isBody) {
    label.classList.add("body");
  }
  if (opts.isCaption) {
    label.classList.add("caption");
  }
  if (opts.isLink) {
    label.classList.add("link");
    if (tag === "label" || tag === "span" || tag === "p") { // Non-interactive elements by default
        label.setAttribute("tabindex", "0");
        label.setAttribute("role", "link");
        if (typeof opts.onClick === 'function') {
            label.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    opts.onClick(e);
                }
            });
        }
    }
    if (typeof opts.onClick === 'function') {
        label.addEventListener("click", opts.onClick);
    }
  }
  if (opts.isDisabled) {
    label.classList.add("disabled");
    label.setAttribute("aria-disabled", "true");
  }
  return label;
}

/**
 * Creates an Adwaita-style header bar.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.title] - Main title text for the header bar.
 * @param {string} [options.subtitle] - Subtitle text.
 * @param {HTMLElement[]} [options.start] - Array of elements to place at the start (left).
 * @param {HTMLElement[]} [options.end] - Array of elements to place at the end (right).
 * @returns {HTMLElement} The created header bar element.
 */
function createAdwHeaderBar(options = {}) {
  const opts = options || {};
  const headerBar = document.createElement("header");
  headerBar.classList.add("adw-header-bar");

  const startBox = document.createElement("div");
  startBox.classList.add("adw-header-bar-start");
  opts.start?.forEach((el) => {
    if (el instanceof Node) startBox.appendChild(el);
  });

  const centerBox = document.createElement("div");
  centerBox.classList.add("adw-header-bar-center-box");

  if (opts.title) {
    const title = document.createElement("h1");
    title.classList.add("adw-header-bar-title");
    title.textContent = opts.title;
    centerBox.appendChild(title);
  }
  if (opts.subtitle) {
    const subtitle = document.createElement("h2");
    subtitle.classList.add("adw-header-bar-subtitle");
    subtitle.textContent = opts.subtitle;
    centerBox.appendChild(subtitle);
  }

  const endBox = document.createElement("div");
  endBox.classList.add("adw-header-bar-end");
  opts.end?.forEach((el) => {
    if (el instanceof Node) endBox.appendChild(el);
  });

  headerBar.appendChild(startBox);
  headerBar.appendChild(centerBox);
  headerBar.appendChild(endBox);

  return headerBar;
}

/**
 * Creates an Adwaita-style window container.
 * @param {object} [options={}] - Configuration options.
 * @param {HTMLElement} [options.header] - An AdwHeaderBar element.
 * @param {HTMLElement} options.content - The main content element for the window.
 *                                        SECURITY: Ensure this content is trusted or sanitized if it's user-generated HTML.
 * @returns {HTMLDivElement} The created window element.
 */
function createAdwWindow(options = {}) {
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
    // Potentially append as text or sanitized HTML if that's a desired fallback
  }
  windowEl.appendChild(content);
  return windowEl;
}

/**
 * Creates an Adwaita-style box container (flexbox).
 * @param {object} [options={}] - Configuration options.
 * @param {"horizontal"|"vertical"} [options.orientation="horizontal"] - Flex direction.
 * @param {"start"|"center"|"end"|"stretch"} [options.align] - align-items value.
 * @param {"start"|"center"|"end"|"between"|"around"|"evenly"} [options.justify] - justify-content value.
 * @param {"xs"|"s"|"m"|"l"|"xl"} [options.spacing] - Gap spacing between children.
 * @param {boolean} [options.fillChildren=false] - If true, children will grow to fill space.
 * @param {HTMLElement[]} [options.children] - Array of child elements.
 *                                             SECURITY: Ensure children are trusted or sanitized if user-generated.
 * @returns {HTMLDivElement} The created box element.
 */
function createAdwBox(options = {}) {
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

/**
 * Creates an Adwaita-style row, typically for lists or form-like structures.
 * @param {object} [options={}] - Configuration options.
 * @param {HTMLElement[]} [options.children] - Array of child elements for the row.
 *                                             SECURITY: Ensure children are trusted or sanitized.
 * @param {boolean} [options.activated=false] - If true, applies 'activated' class.
 * @param {boolean} [options.interactive=false] - If true, applies 'interactive' class (for hover effects).
 * @param {function} [options.onClick] - Click handler, makes the row focusable and keyboard-activatable if interactive.
 * @returns {HTMLDivElement} The created row element.
 */
function createAdwRow(options = {}) {
  const opts = options || {};
  const row = document.createElement("div");
  row.classList.add("adw-row");

  opts.children?.forEach((child) => {
    if (child instanceof Node) row.appendChild(child);
  });
  if (opts.activated) {
    row.classList.add("activated");
  }
  if (opts.interactive) {
    row.classList.add("interactive");
  }
  if (opts.interactive && typeof opts.onClick === 'function') {
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");
    row.addEventListener("click", opts.onClick);
    row.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            opts.onClick(e);
        }
    });
  }
  return row;
}

/**
 * Creates and displays an Adwaita-style toast notification.
 * @param {string} text - The message to display in the toast.
 * @param {object} [options={}] - Configuration options.
 * @param {HTMLElement} [options.button] - An optional button element to include in the toast.
 * @param {number} [options.timeout=4000] - Duration in ms before the toast fades out. Set to 0 for persistent.
 * @returns {HTMLDivElement} The created toast element.
 */
function createAdwToast(text, options = {}) {
  const opts = options || {};
  const toast = document.createElement("div");
  toast.classList.add("adw-toast");
  toast.textContent = text;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  if (opts.button instanceof Node) {
    toast.appendChild(opts.button);
  }
  if (opts.timeout !== 0) {
    const effectiveTimeout = typeof opts.timeout === 'number' ? opts.timeout : 4000;
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => {
        toast.remove();
      }, 200);
    }, effectiveTimeout);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("visible");
  }, 10); // Small delay to ensure CSS transition applies
  return toast;
}

/**
 * Creates and displays an Adwaita-style banner notification.
 * Banners are typically used for more persistent information than toasts.
 * @param {string} message - The message to display in the banner.
 * @param {object} [options={}] - Configuration options for the banner.
 * @param {'info'|'success'|'warning'|'error'} [options.type='info'] - Type of banner, affects styling.
 * @param {boolean} [options.dismissible=true] - If true, adds a close button to the banner.
 * @param {HTMLElement} [options.container=document.body] - Element to prepend the banner to.
 * @param {string} [options.id] - Optional ID for the banner element.
 * @returns {HTMLDivElement} The created banner element.
 */
function createAdwBanner(message, options = {}) {
  const opts = options || {};
  const banner = document.createElement('div');
  banner.classList.add('adw-banner');
  banner.setAttribute('role', 'alert'); // Use 'alert' for important messages, could be 'status' for less critical ones.
  if (opts.id) {
    banner.id = opts.id;
  }

  const type = opts.type || 'info'; // Default to 'info'
  banner.classList.add(type); // e.g., 'info', 'success', 'warning', 'error'

  const messageSpan = document.createElement('span');
  messageSpan.classList.add('adw-banner-message');
  messageSpan.textContent = message;
  banner.appendChild(messageSpan);

  if (opts.dismissible !== false) { // Default to true, so only explicitly false disables it
    const closeButton = document.createElement('button');
    closeButton.classList.add('adw-banner-close-button');
    // Using a multiplication sign (×) for the close icon, common practice.
    // Ensure SCSS styles this appropriately or allows for an SVG icon.
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close banner'); // Accessibility: label for screen readers
    closeButton.onclick = () => {
      banner.classList.remove('visible'); // Trigger fade-out animation
      // Wait for animation to complete before removing the element
      setTimeout(() => {
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner);
        }
      }, 300); // This duration should match the CSS transition time for opacity/transform
    };
    banner.appendChild(closeButton);
  }

  const container = opts.container instanceof HTMLElement ? opts.container : document.body;
  // Prepend the banner to the container
  if (container.firstChild) {
    container.insertBefore(banner, container.firstChild);
  } else {
    container.appendChild(banner);
  }

  // Trigger fade-in animation
  // A small delay ensures the element is in the DOM and CSS transitions can apply.
  setTimeout(() => {
    banner.classList.add('visible');
  }, 10);

  return banner;
}

/**
 * Creates an Adwaita-style dialog.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.title] - Title of the dialog.
 * @param {HTMLElement|string} options.content - Content of the dialog. If string, it's wrapped in a <p>.
 *                                               SECURITY: If providing an HTMLElement, ensure its content is trusted/sanitized.
 * @param {HTMLElement[]} [options.buttons] - Array of button elements for the dialog footer.
 * @param {function} [options.onClose] - Callback when the dialog is closed.
 * @param {boolean} [options.closeOnBackdropClick=true] - Whether clicking the backdrop closes the dialog.
 * @returns {{dialog: HTMLDivElement, open: function, close: function}} Object with dialog element and methods.
 */
function createAdwDialog(options = {}) {
  const opts = options || {};
  const backdrop = document.createElement('div');
  backdrop.classList.add('adw-dialog-backdrop');

  const dialog = document.createElement('div');
  dialog.classList.add('adw-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const titleId = `adw-dialog-title-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
  if (opts.title) {
      dialog.setAttribute('aria-labelledby', titleId);
  }

  if (opts.title) {
      const titleEl = document.createElement('div');
      titleEl.classList.add('adw-dialog-title');
      titleEl.id = titleId;
      titleEl.textContent = opts.title;
      dialog.appendChild(titleEl);
  }

  if (opts.content) {
      const contentEl = document.createElement('div');
      contentEl.classList.add('adw-dialog-content');
      if (typeof opts.content === 'string') {
        const p = document.createElement('p');
        p.textContent = opts.content;
        contentEl.appendChild(p);
      } else if (opts.content instanceof Node) {
        contentEl.appendChild(opts.content);
      } else {
        console.warn("AdwDialog: options.content should be a string or DOM element.");
      }
      dialog.appendChild(contentEl);
  }

  if (opts.buttons && Array.isArray(opts.buttons) && opts.buttons.length > 0) {
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add('adw-dialog-buttons');
      opts.buttons.forEach(button => {
        if (button instanceof Node) buttonsContainer.appendChild(button);
      });
      dialog.appendChild(buttonsContainer);
  }

   function openAdwDialog() {
      document.body.appendChild(backdrop);
      backdrop.appendChild(dialog);
      const firstFocusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        dialog.setAttribute('tabindex', '-1');
        dialog.focus();
      }
      setTimeout(() => {
          backdrop.classList.add('open');
          dialog.classList.add('open');
      }, 10);
  }
  function closeAdwDialog() {
    backdrop.classList.remove('open');
    dialog.classList.remove('open');
    setTimeout(() => {
      if (backdrop.parentNode) { // Check if still in DOM
        backdrop.remove();
      }
      if (typeof opts.onClose === 'function') {
        opts.onClose();
      }
    }, 300);
  }
  backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop && opts.closeOnBackdropClick !== false) {
          closeAdwDialog();
      }
  });
    dialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdwDialog();
        }
        if (e.key === 'Tab') {
            const focusableElements = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
            if (focusableElements.length === 0) return;
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    });

  return {
      dialog: dialog,
      open: openAdwDialog,
      close: closeAdwDialog,
  };
}

/**
 * Creates an Adwaita-style progress bar.
 * @param {object} [options={}] - Configuration options.
 * @param {number} [options.value] - Progress value (0-100).
 * @param {boolean} [options.isIndeterminate=false] - If true, shows an indeterminate progress animation.
 * @param {boolean} [options.disabled=false] - If true, disables the progress bar (visually).
 * @returns {HTMLDivElement} The created progress bar element.
 */
function createAdwProgressBar(options = {}) {
  const opts = options || {};
  const progressBar = document.createElement("div");
  progressBar.classList.add("adw-progress-bar");
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", "100");

  const progressBarValue = document.createElement("div");
  progressBarValue.classList.add("adw-progress-bar-value");
  progressBar.appendChild(progressBarValue);

  if (typeof opts.value === 'number' && !opts.isIndeterminate) {
    const clampedValue = Math.max(0, Math.min(100, opts.value)); // Clamp value
    progressBarValue.style.width = `${clampedValue}%`;
    progressBar.setAttribute("aria-valuenow", clampedValue);
  }
  if (opts.isIndeterminate) {
    progressBar.classList.add("indeterminate");
    progressBar.removeAttribute("aria-valuenow");
  }
  if (opts.disabled) {
    progressBar.setAttribute("disabled", "");
    progressBar.setAttribute("aria-disabled", "true");
  }
  return progressBar;
}

/**
 * Creates an Adwaita-style checkbox with a label.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.label=""] - Text label for the checkbox.
 * @param {boolean} [options.checked=false] - Initial checked state.
 * @param {function} [options.onChanged] - Callback for state change.
 * @param {boolean} [options.disabled=false] - If true, disables the checkbox.
 * @returns {HTMLLabelElement} The created checkbox component (label wrapper).
 */
function createAdwCheckbox(options = {}) {
  const opts = options || {};
  const wrapper = document.createElement("label");
  wrapper.classList.add("adw-checkbox");

  const input = document.createElement("input");
  input.type = "checkbox";
  if(typeof opts.onChanged === 'function') {
    input.addEventListener("change", opts.onChanged);
  }

  const indicator = document.createElement("span");
  indicator.classList.add("adw-checkbox-indicator");
  indicator.setAttribute("aria-hidden", "true");

  const labelSpan = document.createElement("span");
  labelSpan.classList.add("adw-checkbox-label");
  labelSpan.textContent = opts.label || "";

  wrapper.appendChild(input);
  wrapper.appendChild(indicator);
  wrapper.appendChild(labelSpan);

  if (opts.checked) {
    input.checked = true;
  }
  if (opts.disabled) {
    input.setAttribute("disabled", "");
    wrapper.setAttribute("aria-disabled", "true");
    wrapper.classList.add("disabled");
  }
  return wrapper;
}

/**
 * Creates an Adwaita-style radio button with a label.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.name - Name attribute, essential for grouping radio buttons.
 * @param {string} [options.label=""] - Text label for the radio button.
 * @param {boolean} [options.checked=false] - Initial checked state.
 * @param {function} [options.onChanged] - Callback for state change.
 * @param {boolean} [options.disabled=false] - If true, disables the radio button.
 * @returns {HTMLLabelElement} The created radio button component (label wrapper).
 */
function createAdwRadioButton(options = {}) {
  const opts = options || {};
  if (!opts.name) {
    console.error("AdwRadioButton: 'name' option is required.");
    return document.createElement("div"); // Return empty div or throw error
  }
  const wrapper = document.createElement("label");
  wrapper.classList.add("adw-radio");

  const input = document.createElement("input");
  input.type = "radio";
  input.name = opts.name;
  if(typeof opts.onChanged === 'function') {
    input.addEventListener("change", opts.onChanged);
  }

  const indicator = document.createElement("span");
  indicator.classList.add("adw-radio-indicator");
  indicator.setAttribute("aria-hidden", "true");

  const labelSpan = document.createElement("span");
  labelSpan.classList.add("adw-radio-label");
  labelSpan.textContent = opts.label || "";

  wrapper.appendChild(input);
  wrapper.appendChild(indicator);
  wrapper.appendChild(labelSpan);

  if (opts.checked) {
    input.checked = true;
  }
  if (opts.disabled) {
    input.setAttribute("disabled", "");
    wrapper.setAttribute("aria-disabled", "true");
    wrapper.classList.add("disabled");
  }
  return wrapper;
}

/**
 * Creates an Adwaita-style list box.
 * @param {object} [options={}] - Configuration options.
 * @param {HTMLElement[]} [options.children] - Child elements (typically AdwRow).
 *                                             SECURITY: Ensure children are trusted or sanitized.
 * @param {boolean} [options.isFlat=false] - If true, applies 'flat' class for borderless style.
 * @param {boolean} [options.selectable=false] - If true, sets ARIA role to 'listbox'.
 * @returns {HTMLDivElement} The created list box element.
 */
function createAdwListBox(options = {}) {
  const opts = options || {};
  const listBox = document.createElement("div");
  listBox.classList.add("adw-list-box");

  if (opts.isFlat) {
    listBox.classList.add("flat");
  }
  if (opts.selectable) {
    listBox.setAttribute("role", "listbox");
    // Consider adding aria-multiselectable if opts.multiselect is true
  }
  opts.children?.forEach((child) => {
    if (child instanceof Node) listBox.appendChild(child);
  });
  return listBox;
}

// --- Theme Toggle Function  ---
// Note: This function is renamed to _originalToggleTheme and wrapped later
function _originalToggleTheme() {
  const body = document.body;
  body.classList.toggle("light-theme");
  const isLight = body.classList.contains("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

// --- Accent Color Management ---
const AVAILABLE_ACCENT_COLORS = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'pink', 'slate'];
const DEFAULT_ACCENT_COLOR = 'blue';

/**
 * Returns the list of available accent color names.
 * @returns {string[]}
 */
function getAccentColors() {
    return [...AVAILABLE_ACCENT_COLORS];
}

/**
 * Sets the accent color for the application.
 * Updates CSS variables on the root element and saves the choice to localStorage.
 * @param {string} colorName - The name of the accent color (e.g., 'blue', 'green').
 */
function setAccentColor(colorName) {
    if (!AVAILABLE_ACCENT_COLORS.includes(colorName)) {
        console.warn(`Adw: Accent color "${colorName}" is not available. Defaulting to ${DEFAULT_ACCENT_COLOR}.`);
        colorName = DEFAULT_ACCENT_COLOR;
    }

    const rootStyle = document.documentElement.style;
    const isLightTheme = document.body.classList.contains('light-theme');
    const themeSuffix = isLightTheme ? '-light' : '-dark';

    rootStyle.setProperty('--accent-bg-color', `var(--accent-${colorName}${themeSuffix}-bg)`);
    rootStyle.setProperty('--accent-fg-color', `var(--accent-${colorName}${themeSuffix}-fg)`);

    const standaloneSuffix = isLightTheme ? '' : '-dark';
    rootStyle.setProperty('--accent-color', `var(--accent-${colorName}${standaloneSuffix}-standalone, var(--accent-${colorName}-standalone))`);

    localStorage.setItem('accentColor', colorName);
}

/**
 * Loads the saved accent color from localStorage or defaults.
 * This should be called after the main theme (light/dark) is established.
 */
function loadSavedAccentColor() {
    let accentColorName = localStorage.getItem('accentColor');
    if (!accentColorName || !AVAILABLE_ACCENT_COLORS.includes(accentColorName)) {
        accentColorName = DEFAULT_ACCENT_COLOR;
    }
    setAccentColor(accentColorName);
}

/** Toggles the theme between light and dark AND updates accent colors. */
function toggleTheme() {
    _originalToggleTheme(); // Call original theme toggle logic
    loadSavedAccentColor(); // Re-apply accent color based on the new theme
}
// End Accent Color Management


// --- Load Saved Theme ---
/** Loads the saved theme from localStorage or detects system preference. Also loads accent color. */
function loadSavedTheme() {
  const body = document.body;
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    body.classList.add("light-theme");
  } else if (savedTheme === "dark") {
    body.classList.remove("light-theme");
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    body.classList.add("light-theme");
    // localStorage.setItem("theme", "light"); // Optionally save detected preference
  } else {
    body.classList.remove("light-theme");
  }
  loadSavedAccentColor(); // Load accent color after theme class is set
}

// AdwViewSwitcher
/**
 * Creates an Adwaita-style ViewSwitcher.
 * @param {object} [options={}] - Configuration options.
 * @param {Array<{name: string, content: HTMLElement|string}>} [options.views=[]] - Array of view objects.
 *        Each object: { name: "View Name", content: HTMLElement or HTML string for the view's content }
 *        SECURITY: If content is an HTML string, ensure it's trusted/sanitized by the caller.
 * @param {string} [options.activeViewName] - The name of the initially active view. Defaults to the first view.
 * @param {function} [options.onViewChanged] - Callback function when the active view changes, receives view name.
 * @returns {HTMLDivElement & {setActiveView: function(string): void}} The ViewSwitcher element with a method to set view.
 */
function createAdwViewSwitcher(options = {}) {
  const opts = options || {};
  const switcherElement = document.createElement("div");
  switcherElement.classList.add("adw-view-switcher");

  const bar = document.createElement("div");
  bar.classList.add("adw-view-switcher-bar");

  const contentContainer = document.createElement("div");
  contentContainer.classList.add("adw-view-switcher-content");

  const views = Array.isArray(opts.views) ? opts.views : [];
  if (views.length === 0) {
    console.warn("AdwViewSwitcher: No views provided.");
  }
  let currentActiveButton = null;
  let currentActiveViewElement = null;

  views.forEach((view, index) => {
    if (!view || typeof view.name !== 'string' || !view.content) {
        console.warn("AdwViewSwitcher: Invalid view object at index", index, view);
        return; // Skip invalid view object
    }

    const viewContentElement = view.content instanceof Node ? view.content : document.createElement('div');
    if (!(view.content instanceof Node)) {
        // SECURITY: Caller is responsible for sanitizing HTML strings passed as view.content
        viewContentElement.innerHTML = view.content;
    }
    viewContentElement.dataset.viewName = view.name;
    contentContainer.appendChild(viewContentElement);

    const button = Adw.createButton(view.name, {
      onClick: () => {
        if (currentActiveButton) {
          currentActiveButton.classList.remove("active");
        }
        if (currentActiveViewElement) {
          currentActiveViewElement.classList.remove("active-view");
        }

        button.classList.add("active");
        viewContentElement.classList.add("active-view");

        currentActiveButton = button;
        currentActiveViewElement = viewContentElement;

        if (typeof opts.onViewChanged === 'function') {
          opts.onViewChanged(view.name);
        }
      },
    });
    button.dataset.viewName = view.name;
    bar.appendChild(button);

    if ((opts.activeViewName && view.name === opts.activeViewName) || (!opts.activeViewName && index === 0)) {
      button.classList.add("active");
      viewContentElement.classList.add("active-view");
      currentActiveButton = button;
      currentActiveViewElement = viewContentElement;
    }
  });

  switcherElement.appendChild(bar);
  switcherElement.appendChild(contentContainer);

  switcherElement.setActiveView = (viewName) => {
    const buttonToActivate = Array.from(bar.children).find(btn => btn.dataset.viewName === viewName);
    if (buttonToActivate && typeof buttonToActivate.click === 'function') {
      buttonToActivate.click();
    } else {
        console.warn(`AdwViewSwitcher: View with name "${viewName}" not found or button not clickable.`);
    }
  };

  return switcherElement;
}
// Note: createAdwViewSwitcher was already being exported via window.Adw.createViewSwitcher = createAdwViewSwitcher;
// No, it was added separately. Let's ensure it's in the main Adw object.

// AdwFlap
/**
 * Creates an Adwaita-style Flap component.
 * @param {object} [options={}] - Configuration options.
 * @param {HTMLElement} [options.flapContent] - The content for the flap area.
 *                                              SECURITY: Ensure this content is trusted/sanitized.
 * @param {HTMLElement} [options.mainContent] - The content for the main area.
 *                                              SECURITY: Ensure this content is trusted/sanitized.
 * @param {boolean} [options.isFolded=false] - Initial folded state.
 * @param {string} [options.flapWidth] - Custom width for the flap (e.g., "250px"). Sets CSS variable.
 * @param {string} [options.transitionSpeed] - Custom transition speed (e.g., "0.3s"). Sets CSS variable.
 * @returns {{element: HTMLDivElement, toggleFlap: function(boolean?): void, isFolded: function(): boolean, setFolded: function(boolean): void}}
 */
function createAdwFlap(options = {}) {
  const opts = options || {};
  const flapElement = document.createElement("div");
  flapElement.classList.add("adw-flap");

  const flapContentElement = document.createElement("div");
  flapContentElement.classList.add("adw-flap-flap-content");
  if (opts.flapContent instanceof Node) {
    flapContentElement.appendChild(opts.flapContent);
  } else if (opts.flapContent) {
    console.warn("AdwFlap: options.flapContent should be a DOM element.");
  }

  const mainContentElement = document.createElement("div");
  mainContentElement.classList.add("adw-flap-main-content");
  if (opts.mainContent instanceof Node) {
    mainContentElement.appendChild(opts.mainContent);
  } else if (opts.mainContent) {
     console.warn("AdwFlap: options.mainContent should be a DOM element.");
  }

  flapElement.appendChild(flapContentElement);
  flapElement.appendChild(mainContentElement);

  let currentIsFolded = !!opts.isFolded; // Ensure boolean
  if (currentIsFolded) {
    flapElement.classList.add("folded");
  }

  function setFoldState(newState) {
    currentIsFolded = newState;
    if (currentIsFolded) {
      flapElement.classList.add("folded");
    } else {
      flapElement.classList.remove("folded");
    }
    const event = new CustomEvent('foldchanged', { detail: { folded: currentIsFolded } });
    flapElement.dispatchEvent(event);
  }

  function toggleFlap(explicitState) {
    if (typeof explicitState === 'boolean') {
        setFoldState(explicitState);
    } else {
        setFoldState(!currentIsFolded);
    }
  }

  if (opts.flapWidth) {
    flapElement.style.setProperty('--adw-flap-width', opts.flapWidth);
  }
  if (opts.transitionSpeed) {
    flapElement.style.setProperty('--adw-flap-transition-speed', opts.transitionSpeed);
  }

  return {
    element: flapElement,
    toggleFlap: toggleFlap,
    isFolded: () => currentIsFolded,
    setFolded: setFoldState
  };
}
// Note: createAdwFlap was already being exported via window.Adw.createFlap = createAdwFlap;

// AdwAvatar
/**
 * Creates an Adwaita-style Avatar.
 * @param {object} [options={}] - Configuration options for the avatar.
 * @param {number} [options.size=48] - Diameter of the avatar in pixels.
 * @param {string} [options.imageSrc] - URL for an image.
 * @param {string} [options.text] - Fallback text (e.g., initials), used if imageSrc is missing or fails to load.
 * @param {HTMLElement} [options.customFallback] - Custom DOM element for fallback if image fails and text is not desired.
 * @param {string} [options.alt] - Alt text for the image. Defaults to `options.text` or "User avatar" if not provided.
 * @returns {HTMLSpanElement} The created avatar element.
 */
function createAdwAvatar(options = {}) {
  const opts = options || {};
  const avatarElement = document.createElement("span");
  avatarElement.classList.add("adw-avatar");

  const size = typeof opts.size === 'number' && opts.size > 0 ? opts.size : 48;
  avatarElement.style.width = `${size}px`;
  avatarElement.style.height = `${size}px`;

  function showFallback() {
    while (avatarElement.firstChild) {
        avatarElement.removeChild(avatarElement.firstChild);
    }

    if (opts.customFallback instanceof Node) {
      avatarElement.appendChild(opts.customFallback);
    } else if (opts.text && typeof opts.text === 'string' && opts.text.trim() !== "") {
      const textSpan = document.createElement("span");
      textSpan.classList.add("adw-avatar-text");

      let initials = "";
      const words = opts.text.trim().split(/\s+/);
      if (words.length >= 2) {
        initials = (words[0][0] || "") + (words[1][0] || "");
      } else if (words.length === 1 && words[0].length > 0) {
        initials = words[0].substring(0, 2);
      } else {
        initials = opts.text.substring(0,2);
      }
      initials = initials.toUpperCase();

      textSpan.textContent = initials;

      const fontSize = Math.max(8, Math.floor(size / 2.5));
      textSpan.style.fontSize = `${fontSize}px`;

      avatarElement.appendChild(textSpan);
    }
  }

  if (opts.imageSrc && typeof opts.imageSrc === 'string') {
    const img = document.createElement("img");
    img.src = opts.imageSrc;
    img.alt = opts.alt || opts.text || "User avatar";

    img.onload = () => {
      while (avatarElement.firstChild) {
          avatarElement.removeChild(avatarElement.firstChild);
      }
      avatarElement.appendChild(img);
    };
    img.onerror = () => {
      console.warn(`AdwAvatar: Image failed to load from ${opts.imageSrc}. Using fallback.`);
      showFallback();
    };
  } else {
    showFallback();
  }

  return avatarElement;
}
// Note: createAdwAvatar was already being exported via window.Adw.createAvatar = createAdwAvatar;

/**
 * Creates an Adwaita-style Action Row.
 * Typically used within a ListBox for navigation or actions.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.title - The main title text for the row.
 * @param {string} [options.subtitle] - Optional subtitle text displayed below the title.
 * @param {string} [options.iconHTML] - Optional HTML string for an SVG icon.
 *                                      SECURITY: Ensure this HTML is trusted/sanitized by the caller.
 * @param {function} [options.onClick] - Optional click handler. If provided, row becomes interactive.
 * @param {boolean} [options.showChevron=true] - If true and onClick is present, shows a chevron icon.
 * @returns {HTMLDivElement} The created ActionRow element (which is an AdwRow).
 */
function createAdwActionRow(options = {}) {
    const opts = options || {};
    const rowChildren = [];

    if (opts.iconHTML && typeof opts.iconHTML === 'string') {
        const iconSpan = document.createElement("span");
        iconSpan.classList.add("adw-action-row-icon");
        // SECURITY: User of the framework is responsible for sanitizing HTML if opts.iconHTML can be user-supplied.
        iconSpan.innerHTML = opts.iconHTML;
        rowChildren.push(iconSpan);
    }

    const textContentDiv = document.createElement("div");
    textContentDiv.classList.add("adw-action-row-text-content");

    const titleLabel = Adw.createLabel(opts.title || "", { htmlTag: "span" }); // Use span for title
    titleLabel.classList.add("adw-action-row-title");
    textContentDiv.appendChild(titleLabel);

    if (opts.subtitle && typeof opts.subtitle === 'string') {
        const subtitleLabel = Adw.createLabel(opts.subtitle, { htmlTag: "span" }); // Use span for subtitle
        subtitleLabel.classList.add("adw-action-row-subtitle");
        textContentDiv.appendChild(subtitleLabel);
    }
    rowChildren.push(textContentDiv);

    const showChevron = opts.showChevron !== false; // Default to true if onClick is present
    if (typeof opts.onClick === 'function' && showChevron) {
        const chevronSpan = document.createElement("span");
        chevronSpan.classList.add("adw-action-row-chevron");
        // Chevron content is typically handled by CSS ::after pseudo-element in SCSS
        rowChildren.push(chevronSpan);
    }

    const rowOptions = {
        children: rowChildren,
        interactive: typeof opts.onClick === 'function',
        onClick: opts.onClick // Pass onClick to AdwRow for interactive styling and ARIA
    };

    const actionRow = Adw.createRow(rowOptions);
    actionRow.classList.add("adw-action-row");
    // AdwRow's interactive option already handles tabindex and role="button"

    return actionRow;
}
// Note: createAdwActionRow was already being exported via window.Adw.createActionRow = createAdwActionRow;

/**
 * Creates an Adwaita-style Entry Row.
 * Displays a title label alongside an AdwEntry.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.title - The title label for the entry.
 * @param {object} [options.entryOptions={}] - Options object to pass to `Adw.createEntry`.
 * @param {boolean} [options.labelForEntry=true] - If true, associates the title label with the entry using `for` attribute.
 * @returns {HTMLDivElement} The created EntryRow element (which is an AdwRow).
 */
function createAdwEntryRow(options = {}) {
    const opts = options || {};
    const rowChildren = [];
    const entryOptions = opts.entryOptions || {};

    let entryId;
    if (opts.labelForEntry !== false) { // Default to true
        entryId = entryOptions.id || `adw-entry-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        if (!entryOptions.id) {
            entryOptions.id = entryId; // Ensure entry gets the ID
        }
    }

    const titleLabel = Adw.createLabel(opts.title || "", {
        htmlTag: "label", // Ensure it's a label if labelForEntry is true
        for: entryId // Will be undefined if labelForEntry is false or entryId not set
    });
    titleLabel.classList.add("adw-entry-row-title");
    rowChildren.push(titleLabel);

    const entryElement = Adw.createEntry(entryOptions);
    entryElement.classList.add("adw-entry-row-entry");
    rowChildren.push(entryElement);

    const entryRow = Adw.createRow({ children: rowChildren });
    entryRow.classList.add("adw-entry-row");

    return entryRow;
}
// Note: createAdwEntryRow was already being exported via window.Adw.createEntryRow = createAdwEntryRow;

/**
 * Creates an Adwaita-style Expander Row.
 * A row that can be clicked to expand/collapse and show more content.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.title - The main title text for the row.
 * @param {string} [options.subtitle] - Optional subtitle text.
 * @param {boolean} [options.expanded=false] - Initial expanded state.
 * @param {HTMLElement} options.content - The DOM element to show/hide.
 *                                        SECURITY: Ensure this content is trusted/sanitized by the caller.
 * @returns {HTMLDivElement} The created ExpanderRow wrapper element.
 */
function createAdwExpanderRow(options = {}) {
    const opts = options || {};
    const wrapper = document.createElement("div");
    wrapper.classList.add("adw-expander-row-wrapper");

    const rowChildren = [];

    const textContentDiv = document.createElement("div");
    textContentDiv.classList.add("adw-expander-row-text-content");

    const titleLabel = Adw.createLabel(opts.title || "", { htmlTag: "span" });
    titleLabel.classList.add("adw-expander-row-title");
    textContentDiv.appendChild(titleLabel);

    if (opts.subtitle && typeof opts.subtitle === 'string') {
        const subtitleLabel = Adw.createLabel(opts.subtitle, { htmlTag: "span" });
        subtitleLabel.classList.add("adw-expander-row-subtitle");
        textContentDiv.appendChild(subtitleLabel);
    }
    rowChildren.push(textContentDiv);

    const expanderIcon = document.createElement("span");
    expanderIcon.classList.add("adw-expander-row-icon");
    expanderIcon.setAttribute("aria-hidden", "true");
    rowChildren.push(expanderIcon);

    const contentId = `adw-expander-content-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;

    const clickableRow = Adw.createRow({
        children: rowChildren,
        interactive: true,
        onClick: () => toggleExpansion()
    });
    clickableRow.classList.add("adw-expander-row");
    clickableRow.setAttribute("aria-expanded", opts.expanded ? "true" : "false");
    clickableRow.setAttribute("aria-controls", contentId);

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("adw-expander-row-content");
    contentDiv.id = contentId;
    if (opts.content instanceof Node) {
        contentDiv.appendChild(opts.content);
    } else if (opts.content) {
        // SECURITY: User responsible for sanitizing HTML string if passed
        console.warn("AdwExpanderRow: content should be an HTMLElement. String content might be insecure if not sanitized.");
        const tempContent = document.createElement('div');
        tempContent.innerHTML = opts.content;
        contentDiv.appendChild(tempContent);
    }

    let isExpanded = !!opts.expanded;

    function toggleExpansion() {
        isExpanded = !isExpanded;
        clickableRow.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        if (isExpanded) {
            clickableRow.classList.add("expanded");
            contentDiv.classList.add("expanded");
            // For max-height animation, set it to scrollHeight after a brief delay to allow rendering
            // requestAnimationFrame(() => {
            //    requestAnimationFrame(() => { // Double RAF for some rendering engines
            //      contentDiv.style.maxHeight = contentDiv.scrollHeight + "px";
            //    });
            // });
        } else {
            clickableRow.classList.remove("expanded");
            contentDiv.classList.remove("expanded");
            // contentDiv.style.maxHeight = "0"; // If using max-height animation
        }
    }

    if (isExpanded) {
        clickableRow.classList.add("expanded");
        contentDiv.classList.add("expanded");
        // For initial state if using max-height animation, this is tricky without JS layout calculation
        // For simplicity with pure CSS transition on max-height, it might jump open initially.
        // Or, set a very large max-height in CSS for .expanded.
    }

    wrapper.appendChild(clickableRow);
    wrapper.appendChild(contentDiv);

    return wrapper;
}
// Note: createAdwExpanderRow was already being exported via window.Adw.createExpanderRow = createAdwExpanderRow;

/**
 * Creates an Adwaita-style Combo Row.
 * Displays a title label alongside an HTML <select> element.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.title - The title label for the combo row.
 * @param {string} [options.subtitle] - Optional subtitle text.
 * @param {Array<string|{label: string, value: string}>} [options.selectOptions=[]] -
 *        Array of options for the select element. Can be strings or objects {label, value}.
 * @param {string} [options.selectedValue] - The initially selected value.
 * @param {function} [options.onChanged] - Callback function when the select value changes.
 * @param {boolean} [options.disabled=false] - If true, disables the select element.
 * @returns {HTMLDivElement} The created ComboRow element (which is an AdwRow).
 */
function createAdwComboRow(options = {}) {
    const opts = options || {};
    const rowChildren = [];

    const textContentDiv = document.createElement("div");
    textContentDiv.classList.add("adw-combo-row-text-content");

    const titleLabel = Adw.createLabel(opts.title || "", { htmlTag: "span" });
    titleLabel.classList.add("adw-combo-row-title");
    textContentDiv.appendChild(titleLabel);

    if (opts.subtitle && typeof opts.subtitle === 'string') {
        const subtitleLabel = Adw.createLabel(opts.subtitle, { htmlTag: "span" });
        subtitleLabel.classList.add("adw-combo-row-subtitle");
        textContentDiv.appendChild(subtitleLabel);
    }
    rowChildren.push(textContentDiv);

    const selectElement = document.createElement("select");
    selectElement.classList.add("adw-combo-row-select");

    if (Array.isArray(opts.selectOptions)) {
        opts.selectOptions.forEach(opt => {
            const optionElement = document.createElement("option");
            if (typeof opt === 'string') {
                optionElement.value = opt;
                optionElement.textContent = opt;
            } else if (typeof opt === 'object' && opt !== null && opt.hasOwnProperty('value') && opt.hasOwnProperty('label')) {
                optionElement.value = opt.value;
                optionElement.textContent = opt.label;
            }
            if (opts.selectedValue === optionElement.value) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
    }

    if (typeof opts.onChanged === 'function') {
        selectElement.addEventListener("change", (event) => {
            opts.onChanged(event.target.value, event);
        });
    }

    if (opts.disabled) {
        selectElement.setAttribute("disabled", "");
        selectElement.setAttribute("aria-disabled", "true");
    }

    rowChildren.push(selectElement);

    const comboRow = Adw.createRow({ children: rowChildren });
    comboRow.classList.add("adw-combo-row");
    // Typically, the row itself isn't interactive like an ActionRow, interaction is with the <select>
    // So, no 'interactive' class or onClick on the row itself by default.

    return comboRow;
}
// Note: createAdwComboRow was already being exported via window.Adw.createComboRow = createAdwComboRow;


// Export the functions.
window.Adw = {
  createButton: createAdwButton,
  createEntry: createAdwEntry,
  createSwitch: createAdwSwitch,
  createLabel: createAdwLabel,
  createHeaderBar: createAdwHeaderBar,
  createWindow: createAdwWindow,
  createBox: createAdwBox,
  createRow: createAdwRow,
  createToast: createAdwToast,
  createAdwBanner: createAdwBanner, // Added new banner function
  createDialog: createAdwDialog,
  createProgressBar: createAdwProgressBar,
  createCheckbox: createAdwCheckbox,
  createRadioButton: createAdwRadioButton,
  createListBox: createAdwListBox,
  toggleTheme: toggleTheme, // This is now the wrapped version
  getAccentColors: getAccentColors,
  setAccentColor: setAccentColor,

  // New Row Types & Avatar
  createActionRow: createAdwActionRow,
  createEntryRow: createAdwEntryRow,
  createExpanderRow: createAdwExpanderRow,
  createComboRow: createAdwComboRow,
  createAvatar: createAdwAvatar,
  createViewSwitcher: createAdwViewSwitcher, // Ensure these are also included
  createFlap: createAdwFlap
};

// Ensure loadSavedTheme is called, which now also handles accent color loading.
window.addEventListener("DOMContentLoaded", loadSavedTheme);
