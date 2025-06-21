console.log('[Debug] components.js execution started');
function adwGenerateId(prefix = 'adw-id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

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
  const opts = options || {};
  const isLink = !!opts.href;
  const button = document.createElement(isLink ? "a" : "button");
  button.classList.add("adw-button");
  if (text) {
    button.textContent = text;
  }

  if (isLink) {
    button.href = opts.href;
    if (opts.disabled) {
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
  if (opts.name) {
    entry.name = opts.name;
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
  slider.setAttribute("aria-hidden", "true");

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
    if (tag === "label" || tag === "span" || tag === "p") {
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

  if (opts.type && typeof opts.type === 'string') {
    toast.classList.add(`adw-toast-${opts.type.toLowerCase()}`);
  }

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
  }, 10); // Small delay to ensure CSS transition applies for fade-in
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
  banner.setAttribute('role', 'alert');
  if (opts.id) {
    banner.id = opts.id;
  }

  const type = opts.type || 'info';
  banner.classList.add(type);

  const messageSpan = document.createElement('span');
  messageSpan.classList.add('adw-banner-message');
  messageSpan.textContent = message;
  banner.appendChild(messageSpan);

  if (opts.dismissible !== false) { // Default to true, so only explicitly false disables it
    const closeButton = document.createElement('button');
    closeButton.classList.add('adw-banner-close-button');
    // Ensure SCSS styles this appropriately or allows for an SVG icon.
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close banner');
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
  if (container.firstChild) {
    container.insertBefore(banner, container.firstChild);
  } else {
    container.appendChild(banner);
  }

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
      if (backdrop.parentNode) {
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
    const clampedValue = Math.max(0, Math.min(100, opts.value));
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
  if (opts.name) {
    input.name = opts.name;
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
    return document.createElement("div");
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
  // Name is already set for radio button in its factory: input.name = opts.name;
  // Value needs to be set.
  if (opts.value) {
    input.value = opts.value;
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
  }
  opts.children?.forEach((child) => {
    if (child instanceof Node) listBox.appendChild(child);
  });
  return listBox;
}

// Note: This function is renamed to _originalToggleTheme and wrapped later
function _originalToggleTheme() {
  const body = document.body;
  body.classList.toggle("light-theme");
  const isLight = body.classList.contains("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

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

    const isLightTheme = document.body.classList.contains('light-theme');
    // Always target documentElement's style for theme-wide variables
    const styleTarget = document.documentElement.style;

    // Suffixes for background/foreground properties
    const themeSuffixBgFg = isLightTheme ? '-light' : '-dark';

    // Construct variable names for background and foreground colors
    const accentBgVar = `var(--accent-${colorName}${themeSuffixBgFg}-bg)`;
    const accentFgVar = `var(--accent-${colorName}${themeSuffixBgFg}-fg)`;

    // Suffix for standalone accent color property (used for text, icons on neutral backgrounds)
    // SCSS variables are --accent-{color}-standalone (light) and --accent-{color}-dark-standalone (dark)
    const standaloneColorVar = isLightTheme ?
        `var(--accent-${colorName}-standalone)` :
        `var(--accent-${colorName}-dark-standalone)`;

    styleTarget.setProperty('--accent-bg-color', accentBgVar);
    styleTarget.setProperty('--accent-fg-color', accentFgVar);
    styleTarget.setProperty('--accent-color', standaloneColorVar);

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
    _originalToggleTheme();
    loadSavedAccentColor();
    document.dispatchEvent(new CustomEvent('adwThemeChanged', {
        detail: { isLight: document.body.classList.contains('light-theme') }
    }));
}


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
  } else {
    body.classList.remove("light-theme");
  }
  loadSavedAccentColor();
}

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
  bar.setAttribute("role", "tablist");
  if (opts.label) {
    bar.setAttribute("aria-label", opts.label);
  }

  const contentContainer = document.createElement("div");
  contentContainer.classList.add("adw-view-switcher-content");

  const views = Array.isArray(opts.views) ? opts.views : [];
  if (views.length === 0) {
    console.warn("AdwViewSwitcher: No views provided.");
  }

  const buttons = [];

  views.forEach((view, index) => {
    if (!view || typeof view.name !== 'string' || !view.content) {
        console.warn("AdwViewSwitcher: Invalid view object at index", index, view);
        return;
    }

    const viewId = view.id || adwGenerateId('adw-view-panel');
    const buttonId = adwGenerateId('adw-view-tab');

    const viewContentElement = view.content instanceof Node ? view.content : document.createElement('div');
    if (!(view.content instanceof Node) && typeof view.content === 'string') {
        // SECURITY: Caller is responsible for sanitizing HTML strings.
        viewContentElement.innerHTML = view.content;
    }
    viewContentElement.id = viewId;
    viewContentElement.setAttribute("role", "tabpanel");
    viewContentElement.setAttribute("aria-labelledby", buttonId);
    viewContentElement.classList.add("adw-view-panel");
    viewContentElement.setAttribute("tabindex", "0");
    contentContainer.appendChild(viewContentElement);

    const button = Adw.createButton(view.name, {
      // Let setActiveView handle class changes and ARIA attributes
      onClick: () => switcherElement.setActiveView(view.name, true),
      ...(view.buttonOptions || {})
    });
    button.id = buttonId;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", viewId);
    button.setAttribute("aria-selected", "false");
    button.dataset.viewName = view.name;
    bar.appendChild(button);
    buttons.push(button);

    const isActive = (opts.activeViewName && view.name === opts.activeViewName) || (!opts.activeViewName && index === 0);
    if (isActive) {
      button.classList.add("active");
      button.setAttribute("aria-selected", "true");
      viewContentElement.classList.add("active-view");
    } else {
      viewContentElement.setAttribute("hidden", "");
    }
  });

  switcherElement.appendChild(bar);
  switcherElement.appendChild(contentContainer);

  switcherElement.setActiveView = (viewName, focusButton = false) => {
    let newActiveButton = null;

    buttons.forEach(btn => {
        const isButtonForView = btn.dataset.viewName === viewName;
        btn.classList.toggle("active", isButtonForView);
        btn.setAttribute("aria-selected", isButtonForView ? "true" : "false");
        if (isButtonForView) {
            newActiveButton = btn;
        }
    });

    Array.from(contentContainer.children).forEach(panel => {
        const isPanelForView = panel.id === newActiveButton?.getAttribute("aria-controls");
        panel.classList.toggle("active-view", isPanelForView);
        if (isPanelForView) {
            panel.removeAttribute("hidden");
        } else {
            panel.setAttribute("hidden", "");
        }
    });

    if (newActiveButton && focusButton) {
        newActiveButton.focus();
    }

    if (newActiveButton && typeof opts.onViewChanged === 'function') {
        opts.onViewChanged(viewName, newActiveButton.id, newActiveButton.getAttribute("aria-controls"));
    }
  };

  bar.addEventListener("keydown", (event) => {
    const currentIndex = buttons.findIndex(btn => btn === document.activeElement || btn.contains(document.activeElement));

    // If focus is not within a tab button and key is not a navigation key, do nothing.
    // This allows Tab key to move focus out of the tablist.
    if (currentIndex === -1 && !(event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End")) {
      return;
    }

    let newIndex = currentIndex;
    let shouldPreventDefault = false;

    if (event.key === "ArrowRight") {
        newIndex = (currentIndex + 1) % buttons.length;
        shouldPreventDefault = true;
    } else if (event.key === "ArrowLeft") {
        newIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        shouldPreventDefault = true;
    } else if (event.key === "Home") {
        newIndex = 0;
        shouldPreventDefault = true;
    } else if (event.key === "End") {
        newIndex = buttons.length - 1;
        shouldPreventDefault = true;
    }

    if (shouldPreventDefault) {
        event.preventDefault();
        buttons[newIndex].focus();
    }
  });

  return switcherElement;
}

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

  let currentIsFolded = !!opts.isFolded;
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

    const titleLabel = Adw.createLabel(opts.title || "", { htmlTag: "span" });
    titleLabel.classList.add("adw-action-row-title");
    textContentDiv.appendChild(titleLabel);

    if (opts.subtitle && typeof opts.subtitle === 'string') {
        const subtitleLabel = Adw.createLabel(opts.subtitle, { htmlTag: "span" });
        subtitleLabel.classList.add("adw-action-row-subtitle");
        textContentDiv.appendChild(subtitleLabel);
    }
    rowChildren.push(textContentDiv);

    const showChevron = opts.showChevron !== false;
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
    if (opts.labelForEntry !== false) {
        entryId = entryOptions.id || `adw-entry-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        if (!entryOptions.id) {
            entryOptions.id = entryId;
        }
    }

    const titleLabel = Adw.createLabel(opts.title || "", {
        htmlTag: "label",
        for: entryId
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
        } else {
            clickableRow.classList.remove("expanded");
            contentDiv.classList.remove("expanded");
        }
    }

    if (isExpanded) {
        clickableRow.classList.add("expanded");
        contentDiv.classList.add("expanded");
    }

    wrapper.appendChild(clickableRow);
    wrapper.appendChild(contentDiv);

    return wrapper;
}

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

// SVG Icons for Password Visibility Toggle
const ADW_ICON_VISIBILITY_SHOW = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 1em; height: 1em; display: inline-block; vertical-align: middle;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const ADW_ICON_VISIBILITY_HIDE = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 1em; height: 1em; display: inline-block; vertical-align: middle;"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

/**
 * Creates an Adwaita-style Split Button.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.actionText="Action"] - Text for the main action part.
 * @param {string} [options.actionHref] - URL for the main action part (makes it an <a> tag).
 * @param {function} [options.onActionClick] - Click handler for the main action part (if not a link).
 * @param {function} [options.onDropdownClick] - Click handler for the dropdown part.
 * @param {boolean} [options.suggested=false] - If true, applies 'suggested-action' style.
 * @param {boolean} [options.disabled=false] - If true, disables the button.
 * @param {string} [options.id] - Optional ID for the main wrapper.
 * @param {string} [options.dropdownAriaLabel="More options"] - ARIA label for the dropdown button.
 * @returns {HTMLDivElement} The created split button element.
 */
function createAdwSplitButton(options = {}) {
  const opts = options || {};
  const splitButton = document.createElement("div");
  splitButton.classList.add("adw-split-button");
  if (opts.id) {
    splitButton.id = opts.id;
  }

  if (opts.suggested) {
    splitButton.classList.add("suggested-action");
  }
  if (opts.disabled) {
    splitButton.setAttribute("disabled", "");
    splitButton.setAttribute("aria-disabled", "true");
  }

  const isActionLink = !!opts.actionHref;
  const actionPart = document.createElement(isActionLink ? "a" : "button");
  actionPart.classList.add("adw-split-button-action");
  actionPart.textContent = opts.actionText || "Action";

  if (isActionLink) {
    actionPart.href = opts.actionHref;
    if (opts.disabled) {
        actionPart.classList.add("disabled");
        actionPart.setAttribute("aria-disabled", "true");
        actionPart.style.pointerEvents = "none";
    }
  } else {
    if (typeof opts.onActionClick === 'function' && !opts.disabled) {
      actionPart.addEventListener("click", opts.onActionClick);
    }
    if (opts.disabled) {
      actionPart.setAttribute("disabled", "");
    }
  }

  const dropdownPart = document.createElement("button");
  dropdownPart.classList.add("adw-split-button-dropdown");
  dropdownPart.setAttribute("aria-haspopup", "true");
  dropdownPart.setAttribute("aria-label", opts.dropdownAriaLabel || "More options");

  const arrow = document.createElement("span");
  arrow.classList.add("adw-split-button-arrow");
  dropdownPart.appendChild(arrow);

  if (typeof opts.onDropdownClick === 'function' && !opts.disabled) {
    dropdownPart.addEventListener("click", opts.onDropdownClick);
  }
  if (opts.disabled) {
    dropdownPart.setAttribute("disabled", "");
  }

  splitButton.appendChild(actionPart);
  splitButton.appendChild(dropdownPart);

  return splitButton;
}

/**
 * Creates an Adwaita-style Status Page.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.title] - The main title for the status page.
 * @param {string} [options.description] - The descriptive text.
 * @param {string} [options.iconHTML] - HTML string for an icon (e.g., SVG).
 *                                      SECURITY: Ensure trusted/sanitized if user-supplied.
 * @param {HTMLElement[]} [options.actions] - Array of action elements (e.g., buttons).
 * @returns {HTMLDivElement} The created status page element.
 */
function createAdwStatusPage(options = {}) {
  const opts = options || {};
  const statusPage = document.createElement("div");
  statusPage.classList.add("adw-status-page");

  if (opts.iconHTML) {
    const iconDiv = document.createElement("div");
    iconDiv.classList.add("adw-status-page-icon");
    // SECURITY: User of the framework is responsible for sanitizing HTML.
    iconDiv.innerHTML = opts.iconHTML;
    statusPage.appendChild(iconDiv);
  }

  if (opts.title) {
    const titleDiv = document.createElement("div");
    titleDiv.classList.add("adw-status-page-title");
    titleDiv.textContent = opts.title;
    statusPage.appendChild(titleDiv);
  }

  if (opts.description) {
    const descriptionDiv = document.createElement("div");
    descriptionDiv.classList.add("adw-status-page-description");
    descriptionDiv.textContent = opts.description;
    statusPage.appendChild(descriptionDiv);
  }

  if (opts.actions && Array.isArray(opts.actions) && opts.actions.length > 0) {
    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("adw-status-page-actions");
    opts.actions.forEach(action => {
      if (action instanceof Node) actionsDiv.appendChild(action);
    });
    statusPage.appendChild(actionsDiv);
  }
  return statusPage;
}

/**
 * Creates an Adwaita-style spinner.
 * @param {object} [options={}] - Configuration options for the spinner.
 * @param {'small'|'large'} [options.size] - Optional size for the spinner. Default is medium.
 * @param {string} [options.id] - Optional ID for the spinner element.
 * @returns {HTMLDivElement} The created spinner element.
 */
function createAdwSpinner(options = {}) {
  const opts = options || {};
  const spinner = document.createElement("div");
  spinner.classList.add("adw-spinner");
  spinner.setAttribute("role", "status");

  if (opts.size === 'small') {
    spinner.classList.add("small");
  } else if (opts.size === 'large') {
    spinner.classList.add("large");
  }

  if (opts.id) {
    spinner.id = opts.id;
  }
  return spinner;
}

/**
 * Creates an Adwaita-style Entry Row specifically for passwords.
 * Includes a label, a password input, and a visibility toggle button.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.title - The title label for the entry row.
 * @param {object} [options.entryOptions={}] - Options object to pass to `Adw.createEntry` for the password input.
 *                                             Ensure `type` is not set here, as it will be managed.
 * @param {boolean} [options.labelForEntry=true] - If true, associates the title label with the entry using `for` attribute.
 * @returns {HTMLDivElement} The created PasswordEntryRow element (which is an AdwRow).
 */
function createAdwPasswordEntryRow(options = {}) {
    console.log('[Debug] createAdwPasswordEntryRow factory function was called with options:', options);
    const opts = options || {};
    const entryOptions = { ...(opts.entryOptions || {}) };

    entryOptions.type = 'password';
    if (opts.entryOptions && opts.entryOptions.hasOwnProperty('type')) {
        delete entryOptions.type;
    }

    let entryId;
    if (opts.labelForEntry !== false) {
        entryId = entryOptions.id || `adw-password-entry-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        if (!entryOptions.id) {
            entryOptions.id = entryId;
        }
    }

    const titleLabel = Adw.createLabel(opts.title || "Password", {
        htmlTag: "label",
        for: entryId
    });
    titleLabel.classList.add("adw-entry-row-title");


    const passwordEntry = Adw.createEntry(entryOptions);
    // Override type for password entry, Adw.createEntry defaults to text
    passwordEntry.type = 'password';
    passwordEntry.classList.add("adw-entry-row-entry");

    let passwordVisible = false;
    const visibilityButton = Adw.createButton("", {
        icon: ADW_ICON_VISIBILITY_SHOW,
        isCircular: true,
        flat: true,
        ariaLabel: "Show password",
        onClick: () => {
            passwordVisible = !passwordVisible;
            if (passwordVisible) {
                passwordEntry.type = "text";
                visibilityButton.setIcon(ADW_ICON_VISIBILITY_HIDE);
                visibilityButton.setAttribute("aria-label", "Hide password");
            } else {
                passwordEntry.type = "password";
                visibilityButton.setIcon(ADW_ICON_VISIBILITY_SHOW);
                visibilityButton.setAttribute("aria-label", "Show password");
            }
        }
    });
    if (!visibilityButton.setIcon) {
        visibilityButton.setIcon = function(iconHTML) {
            const iconSpan = this.querySelector('.icon');
            if (iconSpan) {
                iconSpan.innerHTML = iconHTML;
            } else {
                 const newIconSpan = document.createElement("span");
                 newIconSpan.classList.add("icon");
                 newIconSpan.innerHTML = iconHTML;
                 this.insertBefore(newIconSpan, this.firstChild);
            }
        };
    }


    const row = Adw.createRow({
        children: [titleLabel, passwordEntry, visibilityButton]
    });
    row.classList.add("adw-password-entry-row");
    // Adjust AdwRow internal structure if it uses specific child classes for layout
    // For example, making passwordEntry take up more space:
    passwordEntry.style.flexGrow = "1";
    titleLabel.style.flexShrink = "0";
    visibilityButton.style.flexShrink = "0";

    return row;
}

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
  createAdwBanner: createAdwBanner, // Ensure this is present
  createDialog: createAdwDialog,
  createProgressBar: createAdwProgressBar,
  createCheckbox: createAdwCheckbox,
  createRadioButton: createAdwRadioButton,
  createListBox: createAdwListBox,
  toggleTheme: toggleTheme,
  getAccentColors: getAccentColors,
  setAccentColor: setAccentColor,
  DEFAULT_ACCENT_COLOR: DEFAULT_ACCENT_COLOR,
  // Functions from the second assignment (or both)
  createActionRow: createAdwActionRow,
  createEntryRow: createAdwEntryRow,
  createAdwPasswordEntryRow: createAdwPasswordEntryRow,
  createExpanderRow: createAdwExpanderRow,
  createComboRow: createAdwComboRow,
  createAvatar: createAdwAvatar,
  createViewSwitcher: createAdwViewSwitcher,
  createFlap: createAdwFlap,
  createSpinner: createAdwSpinner,
  createStatusPage: createAdwStatusPage,
  createSplitButton: createAdwSplitButton
};

// Ensure loadSavedTheme is called, which now also handles accent color loading.
window.addEventListener("DOMContentLoaded", loadSavedTheme);

class AdwButton extends HTMLElement {
    static get observedAttributes() {
        return ['href', 'suggested', 'destructive', 'flat', 'disabled', 'active', 'circular', 'icon', 'appearance', 'type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
        if (this.getAttribute('type') === 'submit') {
            const internalButton = this.shadowRoot.querySelector('button, a');
            if (internalButton) {
                internalButton.addEventListener('click', (e) => {
                    // Check if the button itself is already submitting (e.g. type="submit" in shadow DOM)
                    // This check might be too simple if Adw.createButton creates a button with type="submit"
                    if (internalButton.type !== 'submit') {
                        e.preventDefault(); // Prevent default if it's not a shadow DOM submit button
                    }
                    const form = this.closest('form');
                    if (form) {
                        // More robust way to submit: requestSubmit if available, fallback to temporary button
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
        // Clear previous content
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        AdwButton.observedAttributes.forEach(attr => {
            if (this.hasAttribute(attr)) {
                const value = this.getAttribute(attr);
                // Convert to boolean if attribute is boolean-like
                if (['suggested', 'destructive', 'flat', 'disabled', 'active', 'circular'].includes(attr)) {
                    options[attr] = value !== null && value !== 'false';
                } else {
                    options[attr] = value;
                }
            }
        });

        // Special handling for isCircular for createAdwButton compatibility
        if (options.circular) {
            options.isCircular = options.circular;
            delete options.circular;
        }


        const buttonElement = Adw.createButton(this.textContent.trim(), options);
        this.shadowRoot.appendChild(buttonElement);
    }
}
customElements.define('adw-button', AdwButton);

class AdwBox extends HTMLElement {
    static get observedAttributes() {
        return ['orientation', 'align', 'justify', 'spacing', 'fill-children'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        // Clear previous content
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        AdwBox.observedAttributes.forEach(attr => {
            if (this.hasAttribute(attr)) {
                const value = this.getAttribute(attr);
                if (attr === 'fill-children') { // boolean attribute
                     options.fillChildren = value !== null && value !== 'false';
                } else {
                    options[attr] = value;
                }
            }
        });

        const boxElement = Adw.createBox(options);

        const slotElement = document.createElement('slot');
        boxElement.appendChild(slotElement);

        this.shadowRoot.appendChild(boxElement);
    }
}
customElements.define('adw-box', AdwBox);

// AdwEntry Component
class AdwEntry extends HTMLElement {
    static get observedAttributes() {
        return ['placeholder', 'value', 'disabled', 'name', 'required', 'type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._inputElement = null; // To store reference to the internal input
    }

    connectedCallback() {
        this._render();
        // Reflect initial value and setup listener for internal changes
        if (this._inputElement) {
            if (this.hasAttribute('value')) {
                 this._inputElement.value = this.getAttribute('value');
            }
            this._inputElement.addEventListener('input', () => {
                // No need to setAttribute here, as it might cause infinite loops
                // The 'value' property getter will reflect the live value
                // If external value changes are needed, specific event can be dispatched
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
             // Ensure internal input's value is updated if 'value' attribute changes
            if (name === 'value' && this._inputElement && this._inputElement.value !== newValue) {
                this._inputElement.value = newValue;
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        AdwEntry.observedAttributes.forEach(attr => {
            if (this.hasAttribute(attr)) {
                const val = this.getAttribute(attr);
                if (attr === 'disabled' || attr === 'required') {
                    options[attr] = val !== null && val !== 'false';
                } else {
                    options[attr] = val;
                }
            }
        });

        this._inputElement = Adw.createEntry(options);

        // Set attributes not directly handled by createEntry or needing override
        if (this.hasAttribute('name')) {
            this._inputElement.name = this.getAttribute('name');
        }
        if (this.hasAttribute('required')) {
            if (this.getAttribute('required') !== null && this.getAttribute('required') !== 'false') {
                 this._inputElement.setAttribute('required', '');
            } else {
                this._inputElement.removeAttribute('required');
            }
        }
        if (this.hasAttribute('type')) {
            this._inputElement.type = this.getAttribute('type');
        }


        this.shadowRoot.appendChild(this._inputElement);
    }

    get value() {
        return this._inputElement ? this._inputElement.value : this.getAttribute('value');
    }

    set value(val) {
        if (this._inputElement) {
            this._inputElement.value = val;
        }
        // Reflect change to attribute if desired, though can cause loops if not handled carefully
        // For now, setting property directly on internal input is primary
        this.setAttribute('value', val);
    }
}
customElements.define('adw-entry', AdwEntry);

// AdwLabel Component
class AdwLabel extends HTMLElement {
    static get observedAttributes() {
        // Note: 'title' global HTML attribute vs. 'title-level' for styling.
        // 'title-level' will be used for the custom attribute.
        return ['for', 'title-level', 'body', 'caption', 'link', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        if (this.hasAttribute('for')) {
            options.for = this.getAttribute('for');
        }
        if (this.hasAttribute('title-level')) {
            // The factory expects 'title' as the option key for heading level
            options.title = parseInt(this.getAttribute('title-level'), 10);
        }
        if (this.hasAttribute('body')) {
            options.isBody = this.getAttribute('body') !== null && this.getAttribute('body') !== 'false';
        }
        if (this.hasAttribute('caption')) {
            options.isCaption = this.getAttribute('caption') !== null && this.getAttribute('caption') !== 'false';
        }
        if (this.hasAttribute('link')) {
            options.isLink = this.getAttribute('link') !== null && this.getAttribute('link') !== 'false';
        }
        if (this.hasAttribute('disabled')) {
            options.isDisabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        }

        // Determine tag, default to 'label' but allow 'span' if not 'for' to avoid confusion.
        // The factory `createAdwLabel` handles `htmlTag` option.
        if (!this.hasAttribute('for') && !options.isLink) {
             // If it's not acting as a traditional label for an input, and not a link,
             // 'span' or 'p' might be more semantically appropriate than a <label> tag.
             // The factory defaults to 'label', so we might not need to set htmlTag explicitly unless a different default is desired.
             // For now, let's rely on the factory's default logic for htmlTag based on 'for' attribute.
        }


        const labelElement = Adw.createLabel(this.textContent.trim(), options);
        this.shadowRoot.appendChild(labelElement);
    }
}
customElements.define('adw-label', AdwLabel);

// AdwEntryRow Component
class AdwEntryRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'required', 'name', 'value', 'placeholder', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalEntry = null;
    }

    connectedCallback() {
        this._render();
        if (this._internalEntry && this.hasAttribute('value')) {
            this._internalEntry.value = this.getAttribute('value');
        }
         // Listen for input events on the internal entry to update the component's value property
        if (this._internalEntry) {
            this._internalEntry.addEventListener('input', () => {
                // This ensures the 'value' getter returns the live value.
                // No setAttribute here to avoid potential loops if attributeChangedCallback also sets value.
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            // If the 'value' attribute is changed externally, update the internal entry
            if (name === 'value' && this._internalEntry && this._internalEntry.value !== newValue) {
                this._internalEntry.value = newValue;
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            title: this.getAttribute('title') || '',
            entryOptions: {}
        };

        if (this.hasAttribute('subtitle')) {
            options.subtitle = this.getAttribute('subtitle');
        }
        if (this.hasAttribute('required')) {
            options.entryOptions.required = this.getAttribute('required') !== null && this.getAttribute('required') !== 'false';
        }
        if (this.hasAttribute('name')) {
            options.entryOptions.name = this.getAttribute('name');
        }
        if (this.hasAttribute('value')) {
            options.entryOptions.value = this.getAttribute('value');
        }
        if (this.hasAttribute('placeholder')) {
            options.entryOptions.placeholder = this.getAttribute('placeholder');
        }
        if (this.hasAttribute('disabled')) {
            options.entryOptions.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        }

        const entryRowElement = Adw.createEntryRow(options);
        this.shadowRoot.appendChild(entryRowElement);

        // Store a reference to the input within the created row
        this._internalEntry = entryRowElement.querySelector('.adw-entry-row-entry input, input.adw-entry');
         if (!this._internalEntry) { // Fallback selector if the class name is just adw-entry
            this._internalEntry = entryRowElement.querySelector('input.adw-entry');
        }
    }

    get value() {
        return this._internalEntry ? this._internalEntry.value : this.getAttribute('value');
    }

    set value(val) {
        if (this._internalEntry) {
            this._internalEntry.value = val;
        }
        this.setAttribute('value', val);
    }
}
customElements.define('adw-entry-row', AdwEntryRow);

// AdwPasswordEntryRow Component
class AdwPasswordEntryRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'required', 'name', 'value', 'placeholder', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalEntry = null;
    }

    connectedCallback() {
        this._render();
        if (this._internalEntry && this.hasAttribute('value')) {
            this._internalEntry.value = this.getAttribute('value');
        }
        if (this._internalEntry) {
            this._internalEntry.addEventListener('input', () => {
                // Value getter reflects live value
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'value' && this._internalEntry && this._internalEntry.value !== newValue) {
                this._internalEntry.value = newValue;
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            title: this.getAttribute('title') || '',
            entryOptions: {}
        };

        if (this.hasAttribute('subtitle')) {
            options.subtitle = this.getAttribute('subtitle');
        }
        // Attributes for the entryOptions part of Adw.createPasswordEntryRow
        if (this.hasAttribute('required')) {
            options.entryOptions.required = this.getAttribute('required') !== null && this.getAttribute('required') !== 'false';
        }
        if (this.hasAttribute('name')) {
            options.entryOptions.name = this.getAttribute('name');
        }
        if (this.hasAttribute('value')) {
            options.entryOptions.value = this.getAttribute('value');
        }
        if (this.hasAttribute('placeholder')) {
            options.entryOptions.placeholder = this.getAttribute('placeholder');
        }
        if (this.hasAttribute('disabled')) {
            options.entryOptions.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        }

        const passwordEntryRowElement = Adw.createPasswordEntryRow(options);
        this.shadowRoot.appendChild(passwordEntryRowElement);

        // Store a reference to the input within the created row
        // The Adw.createPasswordEntryRow factory nests the input
        this._internalEntry = passwordEntryRowElement.querySelector('input[type="password"], input[type="text"]');
    }

    get value() {
        return this._internalEntry ? this._internalEntry.value : this.getAttribute('value');
    }

    set value(val) {
        if (this._internalEntry) {
            this._internalEntry.value = val;
        }
        this.setAttribute('value', val);
    }
}
customElements.define('adw-password-entry-row', AdwPasswordEntryRow);

// AdwActionRow Component
class AdwActionRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'icon', 'show-chevron'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._onClick = null; // To store click listener attached to the host
    }

    connectedCallback() {
        this._render();
        // The factory Adw.createActionRow handles its own click based on options.onClick.
        // If we want to allow <adw-action-row onclick="..."> or .addEventListener('click', ...)
        // on the host element, we need to proxy that to the internal clickable element or re-render.
        // For now, we'll rely on the factory's onClick option passed during _render.
        // If a click listener is directly attached to <adw-action-row>, it will work due to event bubbling
        // from the shadow DOM element if it's not stopped.
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    // Allow programmatic click listening
    set onClick(handler) {
        if (typeof handler === 'function') {
            this._onClick = handler;
        } else {
            this._onClick = null;
        }
        this._render(); // Re-render to pass the new onClick to the factory
    }

    get onClick() {
        return this._onClick;
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            title: this.getAttribute('title') || ''
        };

        if (this.hasAttribute('subtitle')) {
            options.subtitle = this.getAttribute('subtitle');
        }
        if (this.hasAttribute('icon')) {
            // Assuming 'icon' attribute contains SVG HTML or a class name
            options.iconHTML = this.getAttribute('icon');
        }
        if (this.hasAttribute('show-chevron')) {
            options.showChevron = this.getAttribute('show-chevron') !== null && this.getAttribute('show-chevron') !== 'false';
        }

        if (this._onClick) {
            options.onClick = (event) => {
                 // If the event originates from within the shadow DOM, it's already handled.
                 // This ensures the host's own click listener is called.
                if (this._onClick) {
                    this._onClick(event);
                }
            };
        }


        const actionRowElement = Adw.createActionRow(options);
        this.shadowRoot.appendChild(actionRowElement);
    }
}
customElements.define('adw-action-row', AdwActionRow);

// AdwSwitch Component
class AdwSwitch extends HTMLElement {
    static get observedAttributes() {
        return ['checked', 'disabled', 'label'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalSwitch = null;
    }

    connectedCallback() {
        this._render();
        if (this._internalSwitch) {
            // Reflect initial checked state from attribute to property
            this.checked = this.hasAttribute('checked');

            // Listen to change on internal input to update property and dispatch event
            const inputElement = this._internalSwitch.querySelector('input[type="checkbox"]');
            if (inputElement) {
                inputElement.addEventListener('change', (e) => {
                    this.checked = inputElement.checked; // Update property
                    // The event from the internal checkbox will bubble out of shadow DOM if not stopped.
                    // We can re-dispatch a custom event for consistency, or rely on bubbling.
                    // For now, let's dispatch a new 'change' event from the host.
                    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'checked') {
                this.checked = this.hasAttribute('checked');
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            label: this.getAttribute('label') || '',
            checked: this.hasAttribute('checked'),
            disabled: this.hasAttribute('disabled'),
            // Pass existing onChanged if any (e.g. from programmatic setter, though not standard for this component)
            onChanged: (event) => {
                 // This internal onChanged is for the factory.
                 // The component's own change event is handled in connectedCallback by listening to the input.
            }
        };

        this._internalSwitch = Adw.createSwitch(options);
        this.shadowRoot.appendChild(this._internalSwitch);

        // Ensure the internal input reflects the current 'checked' property if it was set before rendering
        const inputElement = this._internalSwitch.querySelector('input[type="checkbox"]');
        if (inputElement && this.hasOwnProperty('_checked')) { // Check if _checked has been explicitly set
             inputElement.checked = this._checked;
        }
    }

    get checked() {
        const inputElement = this._internalSwitch ? this._internalSwitch.querySelector('input[type="checkbox"]') : null;
        return inputElement ? inputElement.checked : (this._checked || false);
    }

    set checked(value) {
        const isChecked = Boolean(value);
        this._checked = isChecked; // Store internal state
        const inputElement = this._internalSwitch ? this._internalSwitch.querySelector('input[type="checkbox"]') : null;
        if (inputElement) {
            inputElement.checked = isChecked;
        }
        if (isChecked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
    }
}
customElements.define('adw-switch', AdwSwitch);

// AdwCheckbox Component
class AdwCheckbox extends HTMLElement {
    static get observedAttributes() {
        return ['checked', 'disabled', 'label', 'name'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalCheckbox = null; // Reference to the HTMLLabelElement wrapper
        this._inputElement = null; // Reference to the HTMLInputElement
    }

    connectedCallback() {
        this._render();
        if (this._inputElement) {
            this.checked = this.hasAttribute('checked'); // Set initial state

            this._inputElement.addEventListener('change', () => {
                this.checked = this._inputElement.checked; // Update property
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render(); // Re-render on attribute change
            if (name === 'checked') { // Ensure property reflects attribute change
                this.checked = this.hasAttribute('checked');
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            label: this.getAttribute('label') || '',
            checked: this.hasAttribute('checked'),
            disabled: this.hasAttribute('disabled'),
            name: this.getAttribute('name') || undefined, // Pass name to factory
            onChanged: () => {
                // Factory's onChanged. Component's change event handled in connectedCallback.
            }
        };

        this._internalCheckbox = Adw.createCheckbox(options);
        this.shadowRoot.appendChild(this._internalCheckbox);
        this._inputElement = this._internalCheckbox.querySelector('input[type="checkbox"]');

        // Ensure internal input reflects current 'checked' property if set before render
        if (this._inputElement && this.hasOwnProperty('_checked')) {
            this._inputElement.checked = this._checked;
        }
        // The factory Adw.createCheckbox should ideally handle setting the name on the input.
        // If not, we might need to set it manually here:
        if (this._inputElement && options.name && !this._inputElement.name) {
             this._inputElement.name = options.name;
        }
    }

    get checked() {
        return this._inputElement ? this._inputElement.checked : (this._checked || false);
    }

    set checked(value) {
        const isChecked = Boolean(value);
        this._checked = isChecked;
        if (this._inputElement) {
            this._inputElement.checked = isChecked;
        }
        if (isChecked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
    }
}
customElements.define('adw-checkbox', AdwCheckbox);

// AdwRadioButton Component
class AdwRadioButton extends HTMLElement {
    static get observedAttributes() {
        return ['checked', 'disabled', 'label', 'name', 'value'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalRadio = null; // Reference to the HTMLLabelElement wrapper
        this._inputElement = null; // Reference to the HTMLInputElement
    }

    connectedCallback() {
        this._render();
        if (this._inputElement) {
            // Initial state from attribute
            this.checked = this.hasAttribute('checked');

            this._inputElement.addEventListener('change', () => {
                // When a radio button is checked, its 'checked' property becomes true.
                // Other radio buttons in the same group automatically become unchecked by the browser.
                // We need to reflect this new 'checked' state in our property and attribute.
                this.checked = this._inputElement.checked;
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'checked') {
                this.checked = this.hasAttribute('checked');
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            label: this.getAttribute('label') || '',
            checked: this.hasAttribute('checked'),
            disabled: this.hasAttribute('disabled'),
            name: this.getAttribute('name') || '', // Name is crucial for radio group
            value: this.getAttribute('value') || '', // Value is also crucial
            onChanged: () => {
                // Factory's onChanged. Component's change event handled in connectedCallback.
            }
        };

        if (!options.name) {
            console.warn("AdwRadioButton: 'name' attribute is essential for radio button grouping and functionality.");
        }

        this._internalRadio = Adw.createRadioButton(options);
        this.shadowRoot.appendChild(this._internalRadio);
        this._inputElement = this._internalRadio.querySelector('input[type="radio"]');

        if (this._inputElement && this.hasOwnProperty('_checked')) {
             this._inputElement.checked = this._checked;
        }
        // Factories Adw.createRadioButton should handle setting name and value.
        // Add manual setting if factory doesn't.
        if (this._inputElement && options.name && this._inputElement.name !== options.name) {
             this._inputElement.name = options.name;
        }
        if (this._inputElement && options.value && this._inputElement.value !== options.value) {
             this._inputElement.value = options.value;
        }
    }

    get checked() {
        return this._inputElement ? this._inputElement.checked : (this._checked || false);
    }

    set checked(value) {
        const isChecked = Boolean(value);
        this._checked = isChecked; // Internal state
        if (this._inputElement) {
            this._inputElement.checked = isChecked;
        }
        if (isChecked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
        // Note: Setting 'checked' on one radio button programmatically doesn't
        // automatically uncheck others in the same group via JavaScript alone
        // if they are not part of the same document or shadow root initially.
        // The browser handles this for user interactions.
        // For programmatic changes across a group, one might need a coordinating manager
        // if radio buttons are in different shadow DOMs, but not an issue here as factory creates them together.
    }
}
customElements.define('adw-radio-button', AdwRadioButton);

// AdwListBox Component
class AdwListBox extends HTMLElement {
    static get observedAttributes() {
        return ['flat', 'selectable'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        if (this.hasAttribute('flat')) {
            // Factory expects isFlat
            options.isFlat = this.getAttribute('flat') !== null && this.getAttribute('flat') !== 'false';
        }
        if (this.hasAttribute('selectable')) {
            options.selectable = this.getAttribute('selectable') !== null && this.getAttribute('selectable') !== 'false';
        }

        const listBoxElement = Adw.createListBox(options);

        // Add slot for AdwRow or other elements
        const slotElement = document.createElement('slot');
        listBoxElement.appendChild(slotElement);

        this.shadowRoot.appendChild(listBoxElement);
    }
}
customElements.define('adw-list-box', AdwListBox);

// AdwRow Component
class AdwRow extends HTMLElement {
    static get observedAttributes() {
        return ['activated', 'interactive'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._onClick = null; // For programmatic click listener
    }

    connectedCallback() {
        this._render();
        // Event bubbling will make host click listeners work if the internal row is clicked.
        // If Adw.createRow itself attaches a listener that stops propagation, this might need adjustment.
        // For now, relying on factory's onClick option and event bubbling.
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    // Allow programmatic click listening
    set onClick(handler) {
        if (typeof handler === 'function') {
            this._onClick = handler;
        } else {
            this._onClick = null;
        }
        this._render(); // Re-render to pass the new onClick to the factory
    }

    get onClick() {
        return this._onClick;
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        if (this.hasAttribute('activated')) {
            options.activated = this.getAttribute('activated') !== null && this.getAttribute('activated') !== 'false';
        }
        if (this.hasAttribute('interactive')) {
            options.interactive = this.getAttribute('interactive') !== null && this.getAttribute('interactive') !== 'false';
        }

        // If an onClick property has been set on the element, use it
        if (this._onClick) {
            options.onClick = this._onClick;
            // Ensure interactive is true if onClick is set, as factory might depend on it
            options.interactive = true;
        } else if (options.interactive) {
            // If interactive attribute is set but no programmatic _onClick,
            // set up a default onClick handler that simply re-dispatches the event from the host.
            // This ensures that if someone adds an event listener to <adw-row>, it will fire.
            options.onClick = (event) => {
                // Prevent re-triggering if the event is already from the host or already handled
                if (event.target === this) return;

                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    composed: true // Allow event to cross shadow DOM boundary
                });
                this.dispatchEvent(clickEvent);
            };
        }


        // The Adw.createRow factory does not take children directly for slotting.
        // It's designed to have its children passed in the options if they are known at creation time.
        // For a general <adw-row><child/></adw-row> custom element, we must provide a slot.
        const rowElement = Adw.createRow(options);

        const slotElement = document.createElement('slot');
        rowElement.appendChild(slotElement); // The factory's output should be the container for the slot.

        this.shadowRoot.appendChild(rowElement);
    }
}
customElements.define('adw-row', AdwRow);

// AdwWindowTitle Component
class AdwWindowTitle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        const h1 = document.createElement('h1');
        h1.classList.add('adw-header-bar-title');
        const slot = document.createElement('slot');
        h1.appendChild(slot);
        this.shadowRoot.appendChild(h1);
    }
}
customElements.define('adw-window-title', AdwWindowTitle);

// AdwHeaderBar Component
class AdwHeaderBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const header = document.createElement('header');
        header.classList.add('adw-header-bar');

        const startBox = document.createElement('div');
        startBox.classList.add('adw-header-bar-start');
        const startSlot = document.createElement('slot');
        startSlot.name = 'start';
        startBox.appendChild(startSlot);

        const centerBox = document.createElement('div');
        centerBox.classList.add('adw-header-bar-center-box');
        const titleSlot = document.createElement('slot');
        titleSlot.name = 'title';
        const subtitleSlot = document.createElement('slot');
        subtitleSlot.name = 'subtitle';
        centerBox.appendChild(titleSlot);
        centerBox.appendChild(subtitleSlot);

        const endBox = document.createElement('div');
        endBox.classList.add('adw-header-bar-end');
        const endSlot = document.createElement('slot');
        endSlot.name = 'end';
        endBox.appendChild(endSlot);

        header.appendChild(startBox);
        header.appendChild(centerBox);
        header.appendChild(endBox);
        this.shadowRoot.appendChild(header);
    }
}
customElements.define('adw-header-bar', AdwHeaderBar);

// AdwApplicationWindow Component
class AdwApplicationWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const windowDiv = document.createElement('div');
        windowDiv.classList.add('adw-window');

        const headerSlot = document.createElement('slot');
        headerSlot.name = 'header';
        windowDiv.appendChild(headerSlot);

        const mainContent = document.createElement('main');
        mainContent.classList.add('adw-window-content');
        const defaultSlot = document.createElement('slot');
        mainContent.appendChild(defaultSlot);
        windowDiv.appendChild(mainContent);

        this.shadowRoot.appendChild(windowDiv);
    }
}
customElements.define('adw-application-window', AdwApplicationWindow);

// AdwAvatar Component
class AdwAvatar extends HTMLElement {
    static get observedAttributes() {
        return ['size', 'image-src', 'text', 'alt'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        if (this.hasAttribute('size')) {
            options.size = parseInt(this.getAttribute('size'), 10);
        }
        if (this.hasAttribute('image-src')) {
            options.imageSrc = this.getAttribute('image-src');
        }
        if (this.hasAttribute('text')) {
            options.text = this.getAttribute('text');
        }
        if (this.hasAttribute('alt')) {
            options.alt = this.getAttribute('alt');
        }
        // `customFallback` option is not handled via attributes for simplicity here.

        const avatarElement = Adw.createAvatar(options);
        this.shadowRoot.appendChild(avatarElement);
    }
}
customElements.define('adw-avatar', AdwAvatar);

// AdwFlap Component
class AdwFlap extends HTMLElement {
    static get observedAttributes() {
        return ['folded', 'flap-width', 'transition-speed'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._flapInstance = null; // To store the object returned by the factory
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            // For 'folded' attribute, also call the instance method if available
            if (name === 'folded' && this._flapInstance) {
                this._flapInstance.setFolded(this.hasAttribute('folded'));
            }
        }
    }

    _render() {
        // For AdwFlap, the factory manages its own content.
        // We need to extract slotted content *before* clearing the shadow DOM if we re-render.
        // However, the factory pattern for AdwFlap takes content as arguments,
        // so we should ideally only call the factory once in connectedCallback
        // and manage updates via methods.
        // For simplicity in this pass, if _render is called again, it will recreate.

        const flapContent = this.querySelector('[slot="flap"]');
        const mainContent = this.querySelector('[slot="main"]');

        // Clear previous content if any (except the style link)
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            isFolded: this.hasAttribute('folded'),
            flapContent: flapContent ? flapContent.cloneNode(true) : document.createElement('div'), // Pass clones or placeholders
            mainContent: mainContent ? mainContent.cloneNode(true) : document.createElement('div')
        };

        if (this.hasAttribute('flap-width')) {
            options.flapWidth = this.getAttribute('flap-width');
        }
        if (this.hasAttribute('transition-speed')) {
            options.transitionSpeed = this.getAttribute('transition-speed');
        }

        this._flapInstance = Adw.createFlap(options);
        this.shadowRoot.appendChild(this._flapInstance.element);

        // If content was passed as clones, the original slotted elements are still in light DOM.
        // To make them appear in the shadow DOM's slots (if the factory used slots, which it doesn't directly),
        // we would need a different approach.
        // Since createAdwFlap directly appends content, we ensure the slots are empty in shadow DOM
        // and the factory manages the content passed to it.
        // The provided solution expects light DOM slots to be projected into the factory's structure.
        // The current Adw.createFlap directly appends flapContent and mainContent.
        // For custom element usage with slots, Adw.createFlap would ideally create placeholders (e.g. divs)
        // and the custom element would put <slot name="flap"> and <slot name="main"> into those placeholders.
        //
        // Revised approach for _render, assuming Adw.createFlap is slot-UNaware:
        // The custom element itself will create the structure for slots,
        // and the factory's output will be placed *inside* the main content area.
        // This contradicts the instruction "Calls Adw.createFlap(options)" and then "factory-generated element is appended".
        // Let's stick to the instructions: Adw.createFlap is called, and its element is appended.
        // This means the light DOM slot content needs to be *moved* into the structure generated by Adw.createFlap.
        // This is usually done by passing the actual DOM elements to the factory.
        // The factory Adw.createFlap already appends these elements.

        // The Adw.createFlap factory takes the flapContent and mainContent *elements* themselves.
        // So, if the user uses <div slot="flap">, we should pass that specific div.
        // The factory then appends them. This means they are moved from light DOM.
        // This is a bit tricky if _render is called multiple times.
        // A more robust way is for the factory to expect content for slots and the custom element to provide them.
        // For now, the factory Adw.createFlap takes direct elements.

        // If the factory appends the passed elements, we must ensure not to pass them again if _render is recalled.
        // This implies that the factory should be called ideally once.
        // Or, the custom element should handle the slot projection itself.

        // Re-evaluating: The AdwFlap component will pass the *actual slotted elements* to the factory.
        // The factory then incorporates them. This means they are moved from light DOM to shadow DOM.
        // This is fine for initial render. Attribute changes will re-run _render.
        // If slotted content changes, MutationObserver would be needed for AdwFlap to react.
        // For now, only attribute changes trigger _render.
    }

    // Expose methods
    toggleFlap(explicitState) {
        if (this._flapInstance) {
            this._flapInstance.toggleFlap(explicitState);
            // Reflect folded state back to attribute
            if (this._flapInstance.isFolded()) {
                this.setAttribute('folded', '');
            } else {
                this.removeAttribute('folded');
            }
        }
    }

    isFolded() {
        return this._flapInstance ? this._flapInstance.isFolded() : this.hasAttribute('folded');
    }

    setFolded(state) {
        if (this._flapInstance) {
            this._flapInstance.setFolded(state);
             if (state) {
                this.setAttribute('folded', '');
            } else {
                this.removeAttribute('folded');
            }
        } else if (state) {
            this.setAttribute('folded', '');
        } else {
            this.removeAttribute('folded');
        }
    }
}
customElements.define('adw-flap', AdwFlap);

// AdwViewSwitcher Component
class AdwViewSwitcher extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'active-view']; // 'active-view' to programmatically set active view by name
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._viewSwitcherInstance = null;
        this._observer = null;
    }

    connectedCallback() {
        this._render();
        // Observe changes in light DOM children to re-render if views are added/removed
        this._observer = new MutationObserver(() => {
            // Potentially debounce or check if relevant nodes changed
            this._render();
        });
        this._observer.observe(this, { childList: true, subtree: false }); // Only direct children
    }

    disconnectedCallback() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active-view' && this._viewSwitcherInstance) {
                this._viewSwitcherInstance.setActiveView(newValue);
            } else {
                // Re-render for other attribute changes like 'label'
                this._render();
            }
        }
    }

    _parseViews() {
        const views = [];
        // Iterate over direct children of the <adw-view-switcher> element
        Array.from(this.children).forEach(child => {
            if (child.hasAttribute('view-name')) {
                // We need to pass the content of the view.
                // The factory expects content to be an HTMLElement or an HTML string.
                // We pass a clone of the child element itself as the content.
                // The factory will then append this clone to its panel.
                // This moves the responsibility of how to display to the factory,
                // which already creates panels.
                // The child element itself IS the content.
                views.push({
                    name: child.getAttribute('view-name'),
                    content: child.cloneNode(true), // Pass a clone to the factory
                    id: child.id || undefined // Pass ID if present
                });
            } else {
                console.warn("AdwViewSwitcher: Child element is missing 'view-name' attribute and will be ignored.", child);
            }
        });
        return views;
    }

    _render() {
        // Clear previous content (except style link)
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const views = this._parseViews();
        const options = {
            views: views,
            label: this.getAttribute('label') || undefined,
            activeViewName: this.getAttribute('active-view') || (views.length > 0 ? views[0].name : undefined),
            onViewChanged: (viewName, buttonId, panelId) => {
                this.setAttribute('active-view', viewName); // Reflect active view change
                this.dispatchEvent(new CustomEvent('view-changed', {
                    detail: { viewName, buttonId, panelId },
                    bubbles: true,
                    composed: true
                }));
            }
        };

        this._viewSwitcherInstance = Adw.createViewSwitcher(options);
        this.shadowRoot.appendChild(this._viewSwitcherInstance);
    }

    // Method to programmatically set the active view
    setActiveView(viewName) {
        if (this._viewSwitcherInstance) {
            this._viewSwitcherInstance.setActiveView(viewName);
        } else {
             // If called before instance is ready, set attribute to be picked up by _render
            this.setAttribute('active-view', viewName);
        }
    }
}
customElements.define('adw-view-switcher', AdwViewSwitcher);

// AdwProgressBar Component
class AdwProgressBar extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'indeterminate', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        if (this.hasAttribute('value')) {
            options.value = parseFloat(this.getAttribute('value'));
        }
        if (this.hasAttribute('indeterminate')) {
            options.isIndeterminate = this.getAttribute('indeterminate') !== null && this.getAttribute('indeterminate') !== 'false';
        }
        if (this.hasAttribute('disabled')) {
            options.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        }

        const progressBarElement = Adw.createProgressBar(options);
        this.shadowRoot.appendChild(progressBarElement);
    }
}
customElements.define('adw-progress-bar', AdwProgressBar);

// AdwSpinner Component
class AdwSpinner extends HTMLElement {
    static get observedAttributes() {
        return ['size', 'active'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._spinnerElement = null;
    }

    connectedCallback() {
        if (!this.hasAttribute('active')) { // Default to active if attribute not present
            this.setAttribute('active', 'true');
        }
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active') {
                this._updateActivityState();
            } else {
                this._render();
            }
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        if (this.hasAttribute('size')) {
            options.size = this.getAttribute('size');
        }

        this._spinnerElement = Adw.createSpinner(options);
        this.shadowRoot.appendChild(this._spinnerElement);
        this._updateActivityState();
    }

    _updateActivityState() {
        if (this._spinnerElement) {
            const isActive = this.getAttribute('active') !== null && this.getAttribute('active') !== 'false';
            if (isActive) {
                this._spinnerElement.classList.remove('hidden'); // Assuming 'hidden' class controls display
            } else {
                this._spinnerElement.classList.add('hidden');
            }
        }
    }
}
customElements.define('adw-spinner', AdwSpinner);

// AdwSplitButton Component
class AdwSplitButton extends HTMLElement {
    static get observedAttributes() {
        return ['action-text', 'action-href', 'suggested', 'disabled', 'dropdown-aria-label'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            onActionClick: (event) => {
                this.dispatchEvent(new CustomEvent('action-click', { bubbles: true, composed: true, detail: { originalEvent: event } }));
            },
            onDropdownClick: (event) => {
                this.dispatchEvent(new CustomEvent('dropdown-click', { bubbles: true, composed: true, detail: { originalEvent: event } }));
            }
        };

        if (this.hasAttribute('action-text')) {
            options.actionText = this.getAttribute('action-text');
        }
        if (this.hasAttribute('action-href')) {
            options.actionHref = this.getAttribute('action-href');
        }
        if (this.hasAttribute('suggested')) {
            options.suggested = this.getAttribute('suggested') !== null && this.getAttribute('suggested') !== 'false';
        }
        if (this.hasAttribute('disabled')) {
            options.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        }
        if (this.hasAttribute('dropdown-aria-label')) {
            options.dropdownAriaLabel = this.getAttribute('dropdown-aria-label');
        }

        const splitButtonElement = Adw.createSplitButton(options);
        this.shadowRoot.appendChild(splitButtonElement);
    }
}
customElements.define('adw-split-button', AdwSplitButton);

// AdwStatusPage Component
class AdwStatusPage extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'description', 'icon'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
        // Observe slot changes for actions
        const slot = this.shadowRoot.querySelector('slot[name="actions"]');
        if (slot) {
            slot.addEventListener('slotchange', () => this._render());
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        // Collect slotted actions before clearing shadow DOM
        const actionsSlot = this.querySelector('[slot="actions"]');
        const actions = actionsSlot ? Array.from(actionsSlot.children).map(child => child.cloneNode(true)) : [];


        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            actions: actions // Pass cloned actions to the factory
        };
        if (this.hasAttribute('title')) {
            options.title = this.getAttribute('title');
        }
        if (this.hasAttribute('description')) {
            options.description = this.getAttribute('description');
        }
        if (this.hasAttribute('icon')) {
            options.iconHTML = this.getAttribute('icon'); // Map 'icon' to 'iconHTML'
        }

        const statusPageElement = Adw.createStatusPage(options);

        // If the factory doesn't already provide a slot for actions,
        // and we want to use light DOM for actions, we might need to adjust.
        // The current Adw.createStatusPage factory takes an array of elements for actions.
        // So, we find the actions slot in the factory-generated element and append our slotted items,
        // or ensure the factory handles them.
        // For this implementation, we pass the action elements (clones) directly to the factory.

        // The factory Adw.createStatusPage directly appends the action elements.
        // If the factory needs to be more flexible with slots, its internal structure would need adjustment.
        // Given current factory, passing cloned `actions` is the direct way.
        // The custom element itself will not have a <slot name="actions"> in its Shadow DOM
        // because the factory consumes the action elements.

        this.shadowRoot.appendChild(statusPageElement);

        // If we wanted to use a slot in THIS component's shadow DOM instead of passing clones:
        // (This would require Adw.createStatusPage to be modified or not used for the actions part)
        // const actionsDiv = statusPageElement.querySelector('.adw-status-page-actions');
        // if (actionsDiv) {
        //     const actionsSlotElement = document.createElement('slot');
        //     actionsSlotElement.name = 'actions';
        //     actionsDiv.innerHTML = ''; // Clear what factory might have put
        //     actionsDiv.appendChild(actionsSlotElement);
        // }
    }
}
customElements.define('adw-status-page', AdwStatusPage);

// AdwExpanderRow Component
class AdwExpanderRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'expanded'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }

    connectedCallback() {
        this._render();
         // Listen for slot changes to re-render if content changes
        const slot = this.shadowRoot.querySelector('slot[name="content"]');
        if (slot) { // This slot is not actually in shadow DOM with current _render
            // The factory consumes the content. A true slot-based approach would be different.
            // For now, if light DOM content changes, this won't auto-update unless an attribute changes too.
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        const contentSlot = this.querySelector('[slot="content"]');
        // Clone content for the factory, if it exists
        const contentClone = contentSlot ? contentSlot.cloneNode(true) : document.createElement('div');

        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            title: this.getAttribute('title') || '',
            content: contentClone // Pass the cloned content to the factory
        };

        if (this.hasAttribute('subtitle')) {
            options.subtitle = this.getAttribute('subtitle');
        }
        if (this.hasAttribute('expanded')) {
            options.expanded = this.getAttribute('expanded') !== null && this.getAttribute('expanded') !== 'false';
        }

        const expanderRowElement = Adw.createExpanderRow(options);
        this.shadowRoot.appendChild(expanderRowElement);

        // The factory Adw.createExpanderRow directly appends the 'content' element.
        // So, no <slot name="content"> is rendered in this component's shadow DOM.
        // The light DOM element provided via <div slot="content">...</div> is effectively moved (via clone)
        // into the structure created by the factory.
    }
}
customElements.define('adw-expander-row', AdwExpanderRow);

// AdwComboRow Component
class AdwComboRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'selected-value', 'disabled', 'select-options'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalSelect = null;
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            // If selected-value changes, update internal select if it exists
            if (name === 'selected-value' && this._internalSelect && this._internalSelect.value !== newValue) {
                this._internalSelect.value = newValue;
            }
        }
    }

    _parseSelectOptions() {
        const attr = this.getAttribute('select-options');
        if (!attr) return [];
        try {
            const parsed = JSON.parse(attr);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            console.warn('AdwComboRow: "select-options" attribute is not a valid JSON array.', parsed);
            return [];
        } catch (e) {
            console.error('AdwComboRow: Error parsing "select-options" attribute:', e);
            return [];
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            title: this.getAttribute('title') || '',
            selectOptions: this._parseSelectOptions(),
            onChanged: (value, event) => {
                this.setAttribute('selected-value', value); // Reflect change to attribute
                this.dispatchEvent(new CustomEvent('change', {
                    detail: { value: value, originalEvent: event },
                    bubbles: true,
                    composed: true
                }));
            }
        };

        if (this.hasAttribute('subtitle')) {
            options.subtitle = this.getAttribute('subtitle');
        }
        if (this.hasAttribute('selected-value')) {
            options.selectedValue = this.getAttribute('selected-value');
        }
        if (this.hasAttribute('disabled')) {
            options.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        }

        const comboRowElement = Adw.createComboRow(options);
        this.shadowRoot.appendChild(comboRowElement);
        this._internalSelect = comboRowElement.querySelector('select');
    }

    get value() {
        return this._internalSelect ? this._internalSelect.value : this.getAttribute('selected-value');
    }

    set value(val) {
        if (this._internalSelect) {
            this._internalSelect.value = val;
        }
        this.setAttribute('selected-value', val);
        // Dispatch change event if value is set programmatically
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: val },
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('adw-combo-row', AdwComboRow);

// AdwDialog Component
class AdwDialog extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'close-on-backdrop-click', 'open'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._dialogInstance = null; // To store { dialog, open, close } from factory
    }

    connectedCallback() {
        this._render(); // Initial render
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // Re-render if other attributes like title change
            // This might be disruptive if the dialog is open, consider implications
            this._render();
        }
    }

    _render() {
        // Content and buttons are passed to the factory.
        // If _render is called multiple times (e.g. title changes),
        // we need to ensure we're not duplicating or losing state of slotted content.
        // Cloning slotted content is a common strategy here.

        const contentSlot = this.querySelector('[slot="content"]');
        const buttonsSlot = this.querySelector('[slot="buttons"]');

        const contentClone = contentSlot ? contentSlot.cloneNode(true) : document.createElement('div');
        const buttonElements = buttonsSlot ? Array.from(buttonsSlot.children).map(child => child.cloneNode(true)) : [];

        // Clear previous shadow DOM content except style
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            title: this.getAttribute('title') || undefined,
            closeOnBackdropClick: this.hasAttribute('close-on-backdrop-click') ? (this.getAttribute('close-on-backdrop-click') !== 'false') : true,
            content: contentClone,
            buttons: buttonElements,
            onClose: () => {
                this.removeAttribute('open'); // Reflect state to attribute
                this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
            }
        };

        this._dialogInstance = Adw.createDialog(options);
        // The factory returns an object with the dialog element and open/close methods.
        // The dialog element itself (this._dialogInstance.dialog) is designed to be appended to the body by its open() method.
        // So, we don't append it to this component's shadow DOM directly.
        // This custom element acts as a controller.
        // If the dialog was meant to be encapsulated, the factory would need to return just the element.
        // For now, this component doesn't render anything into its own shadow other than style.
        // Or, if we want it in shadow DOM, the factory's open/close needs to target this shadow DOM.
        // The current Adw.createDialog appends to document.body.
        // So, this AdwDialog custom element will not have the dialog in its shadow.
        // This means the <slot> elements are effectively not used for rendering *within this component's shadow DOM*.
        // They are used to *provide content* to the factory.
    }

    open() {
        if (this._dialogInstance) {
            this._dialogInstance.open();
            if (!this.hasAttribute('open')) {
                this.setAttribute('open', '');
            }
        } else {
            // If called before _render (e.g. attribute set early), set attribute to ensure it opens after render.
            this.setAttribute('open', '');
        }
    }

    close() {
        if (this._dialogInstance) {
            this._dialogInstance.close();
            // The onClose callback in options should handle removing the attribute.
        }
    }
}
customElements.define('adw-dialog', AdwDialog);

// AdwBanner Component
class AdwBanner extends HTMLElement {
    static get observedAttributes() {
        return ['message', 'type', 'dismissible', 'show'];
    }

    constructor() {
        super();
        // No shadow DOM needed as this is a controller element.
        // The factory appends the banner to the document body or a specified container.
        this._bannerInstance = null; // To keep track of the created banner element if needed
    }

    connectedCallback() {
        if (this.hasAttribute('show')) {
            this.show();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'show' && oldValue !== newValue) {
            if (newValue !== null) this.show();
            else this.hide(); // Or rely on internal dismiss
        }
        // Other attribute changes might require re-showing the banner if it's complex
        // For now, only 'show' attribute directly controls visibility after initial creation.
    }

    show() {
        const message = this.getAttribute('message') || '';
        if (!message && !this.innerHTML.trim()) { // Use innerHTML as fallback for message
            console.warn('AdwBanner: Message is empty. Banner not shown.');
            return;
        }

        const finalMessage = message || this.innerHTML.trim();

        // Remove existing banner if any, to prevent duplicates from this controller
        if (this._bannerInstance && this._bannerInstance.parentElement) {
            this._bannerInstance.remove();
        }

        const options = {
            type: this.getAttribute('type') || 'info',
            dismissible: this.hasAttribute('dismissible') ? (this.getAttribute('dismissible') !== 'false') : true,
            // container: this.parentElement, // Default is document.body, could make this configurable
            id: this.id ? `${this.id}-instance` : undefined // Optional ID for the instance
        };

        this._bannerInstance = Adw.createAdwBanner(finalMessage, options);

        // Reflect that the banner is being shown, if not already set
        if (!this.hasAttribute('show')) {
            this.setAttribute('show', '');
        }

        // Listen for removal of the banner to update 'show' attribute
        // This requires the factory to provide a way to hook into dismissal,
        // or use MutationObserver on bannerInstance's parent.
        // Adw.createAdwBanner's close button has its own removal logic.
        // We can add a custom event or check if the banner is still in DOM.
        if (this._bannerInstance && options.dismissible) {
            const observer = new MutationObserver(() => {
                if (!this._bannerInstance || !this._bannerInstance.isConnected) {
                    this.removeAttribute('show');
                    observer.disconnect();
                }
            });
            // Observe the parent of the banner instance, typically document.body
            if (this._bannerInstance.parentNode) {
                 observer.observe(this._bannerInstance.parentNode, { childList: true });
            }
        } else if (!options.dismissible && this._bannerInstance) {
            // For non-dismissible banners shown by this controller,
            // they'd persist until hide() is called or element is removed.
        }


    }

    hide() {
        if (this._bannerInstance && this._bannerInstance.parentElement) {
            // Adw.createAdwBanner's close button has animation before removal.
            // We should trigger that if possible, or just remove directly.
            const closeButton = this._bannerInstance.querySelector('.adw-banner-close-button');
            if (closeButton) {
                closeButton.click(); // Simulate click to trigger dismissal logic
            } else {
                this._bannerInstance.remove(); // Fallback direct removal
            }
        }
        this._bannerInstance = null;
        // Attribute is removed by onClose logic or directly if hide is called
        // this.removeAttribute('show');
    }
}
customElements.define('adw-banner', AdwBanner);

// AdwToast Component
class AdwToast extends HTMLElement {
    static get observedAttributes() {
        return ['message', 'type', 'timeout', 'show'];
    }

    constructor() {
        super();
        // No shadow DOM for this controller element.
        this._toastInstance = null;
    }

    connectedCallback() {
        if (this.hasAttribute('show')) {
            this.show();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'show' && oldValue !== newValue) {
            if (newValue !== null) this.show();
            // Hiding is typically handled by timeout or user action on the toast itself.
            // A direct hide() method could be added if needed to programmatically remove.
        }
    }

    show() {
        const message = this.getAttribute('message') || '';
         if (!message && !this.innerHTML.trim()) { // Use innerHTML as fallback for message
            console.warn('AdwToast: Message is empty. Toast not shown.');
            return;
        }
        const finalMessage = message || this.innerHTML.trim();

        // Prevent duplicate toasts from the same controller instance if show() is called multiple times
        if (this._toastInstance && this._toastInstance.isConnected) {
            this._toastInstance.remove();
        }

        const options = {
            type: this.getAttribute('type') || undefined,
            timeout: this.hasAttribute('timeout') ? parseInt(this.getAttribute('timeout'), 10) : 4000
        };

        const buttonSlot = this.querySelector('[slot="button"]');
        if (buttonSlot) {
            options.button = buttonSlot.cloneNode(true); // Pass a clone of the button
        }

        this._toastInstance = Adw.createAdwToast(finalMessage, options);

        if (!this.hasAttribute('show')) {
            this.setAttribute('show', '');
        }

        // Toasts are transient; they remove themselves.
        // We can listen for removal to update the 'show' attribute.
        const observer = new MutationObserver(() => {
            if (!this._toastInstance || !this._toastInstance.isConnected) {
                this.removeAttribute('show');
                observer.disconnect();
            }
        });
         // Observe the parent of the toast instance, typically document.body
        if (this._toastInstance.parentNode) {
            observer.observe(this._toastInstance.parentNode, { childList: true });
        } else {
            // If not appended yet (e.g. factory defers it), this might be too early.
            // Adw.createAdwToast appends to body immediately.
        }
    }

    // Optional: hide method if programmatic removal is needed
    hide() {
        if (this._toastInstance && this._toastInstance.isConnected) {
            this._toastInstance.remove(); // Or trigger its fade-out animation if it has one
        }
        this._toastInstance = null;
        this.removeAttribute('show');
    }
}
customElements.define('adw-toast', AdwToast);

// AdwPreferencesView Component
class AdwPreferencesView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css'; // Adjust path as needed

        const wrapper = document.createElement('div');
        wrapper.classList.add('adw-preferences-view');

        const slot = document.createElement('slot');
        wrapper.appendChild(slot);

        this.shadowRoot.append(styleLink, wrapper);
    }
}
customElements.define('adw-preferences-view', AdwPreferencesView);

// AdwPreferencesPage Component
class AdwPreferencesPage extends HTMLElement {
    static get observedAttributes() {
        return ['title'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';

        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('adw-preferences-page');

        this._titleElement = document.createElement('h1'); // Or h2, depending on HIG for page title
        this._titleElement.classList.add('adw-preferences-page-title');

        const slot = document.createElement('slot');

        this._wrapper.append(this._titleElement, slot);
        this.shadowRoot.append(styleLink, this._wrapper);
    }

    connectedCallback() {
        this._renderTitle();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title' && oldValue !== newValue) {
            this._renderTitle();
        }
    }

    _renderTitle() {
        this._titleElement.textContent = this.getAttribute('title') || 'Page';
    }
}
customElements.define('adw-preferences-page', AdwPreferencesPage);

// AdwPreferencesGroup Component
class AdwPreferencesGroup extends HTMLElement {
    static get observedAttributes() {
        return ['title'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';

        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('adw-preferences-group');

        this._titleElement = document.createElement('div'); // Using div for styling flexibility, could be h2/h3
        this._titleElement.classList.add('adw-preferences-group-title');

        const slot = document.createElement('slot');

        this._wrapper.append(this._titleElement, slot);
        this.shadowRoot.append(styleLink, this._wrapper);
    }

    connectedCallback() {
        this._renderTitle();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title' && oldValue !== newValue) {
            this._renderTitle();
        }
    }

    _renderTitle() {
        const title = this.getAttribute('title');
        if (title) {
            this._titleElement.textContent = title;
            this._titleElement.style.display = '';
        } else {
            this._titleElement.textContent = '';
            this._titleElement.style.display = 'none';
        }
    }
}
customElements.define('adw-preferences-group', AdwPreferencesGroup);


// AdwSwitchRow Component
class AdwSwitchRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'active', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';

        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('adw-row', 'adw-switch-row'); // Mimics AdwRow structure

        this._textContent = document.createElement('div');
        this._textContent.classList.add('adw-action-row-text-content'); // Borrow class for layout

        this._titleElement = document.createElement('span');
        this._titleElement.classList.add('adw-action-row-title'); // Borrow class for layout

        this._subtitleElement = document.createElement('span');
        this._subtitleElement.classList.add('adw-action-row-subtitle'); // Borrow class for layout

        this._switchElement = new AdwSwitch(); // Using the AdwSwitch web component

        this._textContent.append(this._titleElement, this._subtitleElement);
        this._wrapper.append(this._textContent, this._switchElement);
        this.shadowRoot.append(styleLink, this._wrapper);

        this._switchElement.addEventListener('change', (e) => {
            // Reflect internal switch's checked state to 'active' attribute and property
            this.active = this._switchElement.checked;
            // Re-dispatch the change event from the host element
            this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        });
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        this._titleElement.textContent = this.getAttribute('title') || '';
        const subtitle = this.getAttribute('subtitle');
        if (subtitle) {
            this._subtitleElement.textContent = subtitle;
            this._subtitleElement.style.display = '';
        } else {
            this._subtitleElement.textContent = '';
            this._subtitleElement.style.display = 'none';
        }

        const isActive = this.hasAttribute('active');
        if (this._switchElement.checked !== isActive) {
            this._switchElement.checked = isActive;
        }

        const isDisabled = this.hasAttribute('disabled');
        if (this._switchElement.disabled !== isDisabled) {
            this._switchElement.disabled = isDisabled;
        }
        this._wrapper.classList.toggle('disabled', isDisabled);
    }

    get active() {
        return this._switchElement.checked;
    }

    set active(value) {
        const isActive = Boolean(value);
        if (this._switchElement.checked !== isActive) {
            this._switchElement.checked = isActive;
        }
        if (isActive) {
            this.setAttribute('active', '');
        } else {
            this.removeAttribute('active');
        }
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        const isDisabled = Boolean(value);
        if (isDisabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
}
customElements.define('adw-switch-row', AdwSwitchRow);


// AdwComboRow Component
class AdwComboRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'value', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/static/css/adwaita-web.css';

        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('adw-row', 'adw-combo-row');

        this._textContent = document.createElement('div');
        this._textContent.classList.add('adw-combo-row-text-content'); // Similar to action row for layout

        this._titleElement = document.createElement('span');
        this._titleElement.classList.add('adw-combo-row-title');

        this._subtitleElement = document.createElement('span');
        this._subtitleElement.classList.add('adw-combo-row-subtitle');

        this._selectElement = document.createElement('select');
        this._selectElement.classList.add('adw-combo-row-select');

        this._textContent.append(this._titleElement, this._subtitleElement);
        this._wrapper.append(this._textContent, this._selectElement);
        this.shadowRoot.append(styleLink, this._wrapper);

        this._selectElement.addEventListener('change', (e) => {
            this.value = this._selectElement.value; // Update property and attribute
            this.dispatchEvent(new CustomEvent('change', {
                bubbles: true,
                composed: true,
                detail: { value: this._selectElement.value }
            }));
        });

        this._options = [];
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        this._titleElement.textContent = this.getAttribute('title') || '';
        const subtitle = this.getAttribute('subtitle');
        if (subtitle) {
            this._subtitleElement.textContent = subtitle;
            this._subtitleElement.style.display = '';
        } else {
            this._subtitleElement.textContent = '';
            this._subtitleElement.style.display = 'none';
        }

        this._selectElement.disabled = this.hasAttribute('disabled');
        this._wrapper.classList.toggle('disabled', this.hasAttribute('disabled'));

        // Value might be set before options are populated, so re-apply if select has options
        if (this._selectElement.options.length > 0) {
             const valueAttr = this.getAttribute('value');
             if (this._selectElement.value !== valueAttr) {
                this._selectElement.value = valueAttr;
             }
        }
    }

    get value() {
        return this._selectElement.value;
    }

    set value(val) {
        if (this._selectElement.value !== val) {
            this._selectElement.value = val;
        }
        // Reflect to attribute, using 'selected-value' as used in settings.js logic
        if (val) {
            this.setAttribute('value', val);
        } else {
            this.removeAttribute('value');
        }
    }

    get selectOptions() {
        return this._options;
    }

    set selectOptions(optionsArray) {
        if (!Array.isArray(optionsArray)) {
            this._options = [];
            console.error('AdwComboRow: selectOptions must be an array.');
        } else {
            this._options = optionsArray;
        }

        this._selectElement.innerHTML = ''; // Clear existing options
        this._options.forEach(opt => {
            const optionElement = document.createElement('option');
            if (typeof opt === 'object' && opt !== null && opt.hasOwnProperty('value') && opt.hasOwnProperty('label')) {
                optionElement.value = opt.value;
                optionElement.textContent = opt.label;
            } else {
                // Fallback if items are just strings, though spec is {value, label}
                optionElement.value = opt;
                optionElement.textContent = opt;
            }
            this._selectElement.appendChild(optionElement);
        });

        // After populating, try to set the current value attribute if it exists
        const currentValue = this.getAttribute('value');
        if (currentValue !== null) {
            this.value = currentValue;
        } else if (this._selectElement.options.length > 0) {
             // If no value is set, default to the first option's value
            this.value = this._selectElement.options[0].value;
        }
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        const isDisabled = Boolean(value);
        if (isDisabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
        this._render(); // Re-render to apply disabled state
    }
}
customElements.define('adw-combo-row', AdwComboRow);
