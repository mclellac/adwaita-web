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
        tempContent.innerHTML = opts.content; // This line is the security concern if opts.content is untrusted.
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

    // Ensure type is password, overriding if necessary. Adw.createEntry defaults to 'text'.
    entryOptions.type = 'password';
    if (opts.entryOptions && opts.entryOptions.hasOwnProperty('type') && opts.entryOptions.type !== 'password') {
        console.warn("createAdwPasswordEntryRow: entryOptions.type was specified but will be overridden to 'password'.");
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
    // Explicitly set type to password as createAdwEntry might default to text or other types.
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
                visibilityButton.setIcon(ADW_ICON_VISIBILITY_HIDE); // Assumes setIcon method exists or is polyfilled
                visibilityButton.setAttribute("aria-label", "Hide password");
            } else {
                passwordEntry.type = "password";
                visibilityButton.setIcon(ADW_ICON_VISIBILITY_SHOW);
                visibilityButton.setAttribute("aria-label", "Show password");
            }
        }
    });
    // Polyfill setIcon for the button if it's a basic button from createAdwButton
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
    // Adjust AdwRow internal structure for better layout if needed
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
  createAdwBanner: createAdwBanner,
  createDialog: createAdwDialog,
  createProgressBar: createAdwProgressBar,
  createCheckbox: createAdwCheckbox,
  createRadioButton: createAdwRadioButton,
  createListBox: createAdwListBox,
  toggleTheme: toggleTheme,
  getAccentColors: getAccentColors,
  setAccentColor: setAccentColor,
  DEFAULT_ACCENT_COLOR: DEFAULT_ACCENT_COLOR,
  createActionRow: createAdwActionRow,
  createEntryRow: createAdwEntryRow,
  createAdwPasswordEntryRow: createAdwPasswordEntryRow, // Corrected assignment
  createExpanderRow: createAdwExpanderRow,
  createComboRow: createAdwComboRow,
  createAvatar: createAdwAvatar,
  createViewSwitcher: createAdwViewSwitcher,
  createFlap: createAdwFlap,
  createSpinner: createAdwSpinner,
  createStatusPage: createAdwStatusPage,
  createSplitButton: createAdwSplitButton
};

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
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        AdwButton.observedAttributes.forEach(attr => {
            if (this.hasAttribute(attr)) {
                const value = this.getAttribute(attr);
                if (['suggested', 'destructive', 'flat', 'disabled', 'active', 'circular'].includes(attr)) {
                    options[attr] = value !== null && value !== 'false';
                } else {
                    options[attr] = value;
                }
            }
        });

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

    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this._render();
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
        const options = {};
        AdwBox.observedAttributes.forEach(attr => {
            if (this.hasAttribute(attr)) {
                const value = this.getAttribute(attr);
                options[attr.replace(/-([a-z])/g, g => g[1].toUpperCase())] = (attr === 'fill-children') ? (value !== null && value !== 'false') : value;
            }
        });
        const boxElement = Adw.createBox(options);
        boxElement.appendChild(document.createElement('slot'));
        this.shadowRoot.appendChild(boxElement);
    }
}
customElements.define('adw-box', AdwBox);

class AdwEntry extends HTMLElement {
    static get observedAttributes() { return ['placeholder', 'value', 'disabled', 'name', 'required', 'type']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._inputElement = null;
    }
    connectedCallback() {
        this._render();
        if (this._inputElement) {
            if (this.hasAttribute('value')) this._inputElement.value = this.getAttribute('value');
            this._inputElement.addEventListener('input', () => { /* Value property getter reflects live value */ });
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'value' && this._inputElement && this._inputElement.value !== newValue) this._inputElement.value = newValue;
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        AdwEntry.observedAttributes.forEach(attr => {
            if (this.hasAttribute(attr)) {
                const val = this.getAttribute(attr);
                options[attr] = (attr === 'disabled' || attr === 'required') ? (val !== null && val !== 'false') : val;
            }
        });
        this._inputElement = Adw.createEntry(options);
        if (this.hasAttribute('name')) this._inputElement.name = this.getAttribute('name');
        if (this.hasAttribute('required') && (this.getAttribute('required') !== null && this.getAttribute('required') !== 'false')) this._inputElement.setAttribute('required', ''); else this._inputElement.removeAttribute('required');
        if (this.hasAttribute('type')) this._inputElement.type = this.getAttribute('type');
        this.shadowRoot.appendChild(this._inputElement);
    }
    get value() { return this._inputElement ? this._inputElement.value : this.getAttribute('value'); }
    set value(val) {
        if (this._inputElement) this._inputElement.value = val;
        this.setAttribute('value', val);
    }
}
customElements.define('adw-entry', AdwEntry);

class AdwLabel extends HTMLElement {
    static get observedAttributes() { return ['for', 'title-level', 'body', 'caption', 'link', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('for')) options.for = this.getAttribute('for');
        if (this.hasAttribute('title-level')) options.title = parseInt(this.getAttribute('title-level'), 10);
        if (this.hasAttribute('body')) options.isBody = this.getAttribute('body') !== null && this.getAttribute('body') !== 'false';
        if (this.hasAttribute('caption')) options.isCaption = this.getAttribute('caption') !== null && this.getAttribute('caption') !== 'false';
        if (this.hasAttribute('link')) options.isLink = this.getAttribute('link') !== null && this.getAttribute('link') !== 'false';
        if (this.hasAttribute('disabled')) options.isDisabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        const labelElement = Adw.createLabel(this.textContent.trim(), options);
        this.shadowRoot.appendChild(labelElement);
    }
}
customElements.define('adw-label', AdwLabel);

class AdwEntryRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'required', 'name', 'value', 'placeholder', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalEntry = null;
    }
    connectedCallback() {
        this._render();
        if (this._internalEntry && this.hasAttribute('value')) this._internalEntry.value = this.getAttribute('value');
        if (this._internalEntry) this._internalEntry.addEventListener('input', () => {});
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'value' && this._internalEntry && this._internalEntry.value !== newValue) this._internalEntry.value = newValue;
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { title: this.getAttribute('title') || '', entryOptions: {} };
        if (this.hasAttribute('subtitle')) options.subtitle = this.getAttribute('subtitle');
        ['required', 'name', 'value', 'placeholder', 'disabled'].forEach(attr => {
            if (this.hasAttribute(attr)) {
                options.entryOptions[attr] = (attr === 'required' || attr === 'disabled') ? (this.getAttribute(attr) !== null && this.getAttribute(attr) !== 'false') : this.getAttribute(attr);
            }
        });
        const entryRowElement = Adw.createEntryRow(options);
        this.shadowRoot.appendChild(entryRowElement);
        this._internalEntry = entryRowElement.querySelector('input.adw-entry, .adw-entry-row-entry input');
    }
    get value() { return this._internalEntry ? this._internalEntry.value : this.getAttribute('value'); }
    set value(val) {
        if (this._internalEntry) this._internalEntry.value = val;
        this.setAttribute('value', val);
    }
}
customElements.define('adw-entry-row', AdwEntryRow);

class AdwPasswordEntryRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'required', 'name', 'value', 'placeholder', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalEntry = null;
    }
    connectedCallback() {
        this._render();
        if (this._internalEntry && this.hasAttribute('value')) this._internalEntry.value = this.getAttribute('value');
        if (this._internalEntry) this._internalEntry.addEventListener('input', () => {});
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'value' && this._internalEntry && this._internalEntry.value !== newValue) this._internalEntry.value = newValue;
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { title: this.getAttribute('title') || '', entryOptions: {} };
        if (this.hasAttribute('subtitle')) options.subtitle = this.getAttribute('subtitle');
        ['required', 'name', 'value', 'placeholder', 'disabled'].forEach(attr => {
            if (this.hasAttribute(attr)) {
                options.entryOptions[attr] = (attr === 'required' || attr === 'disabled') ? (this.getAttribute(attr) !== null && this.getAttribute(attr) !== 'false') : this.getAttribute(attr);
            }
        });
        const passwordEntryRowElement = Adw.createPasswordEntryRow(options);
        this.shadowRoot.appendChild(passwordEntryRowElement);
        this._internalEntry = passwordEntryRowElement.querySelector('input[type="password"], input[type="text"]');
    }
    get value() { return this._internalEntry ? this._internalEntry.value : this.getAttribute('value'); }
    set value(val) {
        if (this._internalEntry) this._internalEntry.value = val;
        this.setAttribute('value', val);
    }
}
customElements.define('adw-password-entry-row', AdwPasswordEntryRow);

class AdwActionRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'icon', 'show-chevron']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._onClick = null;
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    set onClick(handler) {
        this._onClick = (typeof handler === 'function') ? handler : null;
        this._render();
    }
    get onClick() { return this._onClick; }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { title: this.getAttribute('title') || '' };
        if (this.hasAttribute('subtitle')) options.subtitle = this.getAttribute('subtitle');
        if (this.hasAttribute('icon')) options.iconHTML = this.getAttribute('icon');
        if (this.hasAttribute('show-chevron')) options.showChevron = this.getAttribute('show-chevron') !== null && this.getAttribute('show-chevron') !== 'false';
        if (this._onClick) options.onClick = (event) => { if (this._onClick) this._onClick(event); };
        const actionRowElement = Adw.createActionRow(options);
        this.shadowRoot.appendChild(actionRowElement);
    }
}
customElements.define('adw-action-row', AdwActionRow);

class AdwSwitch extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalSwitch = null; this._inputElement = null;
    }
    connectedCallback() {
        this._render();
        if (this._inputElement) {
            this.checked = this.hasAttribute('checked');
            this._inputElement.addEventListener('change', () => {
                this.checked = this._inputElement.checked;
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'checked') this.checked = this.hasAttribute('checked');
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { label: this.getAttribute('label') || '', checked: this.hasAttribute('checked'), disabled: this.hasAttribute('disabled') };
        this._internalSwitch = Adw.createSwitch(options);
        this.shadowRoot.appendChild(this._internalSwitch);
        this._inputElement = this._internalSwitch.querySelector('input[type="checkbox"]');
        if (this._inputElement && this.hasOwnProperty('_checked')) this._inputElement.checked = this._checked;
    }
    get checked() { return this._inputElement ? this._inputElement.checked : (this._checked || false); }
    set checked(value) {
        const isChecked = Boolean(value); this._checked = isChecked;
        if (this._inputElement) this._inputElement.checked = isChecked;
        if (isChecked) this.setAttribute('checked', ''); else this.removeAttribute('checked');
    }
}
customElements.define('adw-switch', AdwSwitch);

class AdwCheckbox extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label', 'name']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalCheckbox = null; this._inputElement = null;
    }
    connectedCallback() {
        this._render();
        if (this._inputElement) {
            this.checked = this.hasAttribute('checked');
            this._inputElement.addEventListener('change', () => {
                this.checked = this._inputElement.checked;
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'checked') this.checked = this.hasAttribute('checked');
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { label: this.getAttribute('label') || '', checked: this.hasAttribute('checked'), disabled: this.hasAttribute('disabled'), name: this.getAttribute('name') || undefined };
        this._internalCheckbox = Adw.createCheckbox(options);
        this.shadowRoot.appendChild(this._internalCheckbox);
        this._inputElement = this._internalCheckbox.querySelector('input[type="checkbox"]');
        if (this._inputElement && this.hasOwnProperty('_checked')) this._inputElement.checked = this._checked;
        if (this._inputElement && options.name && !this._inputElement.name) this._inputElement.name = options.name;
    }
    get checked() { return this._inputElement ? this._inputElement.checked : (this._checked || false); }
    set checked(value) {
        const isChecked = Boolean(value); this._checked = isChecked;
        if (this._inputElement) this._inputElement.checked = isChecked;
        if (isChecked) this.setAttribute('checked', ''); else this.removeAttribute('checked');
    }
}
customElements.define('adw-checkbox', AdwCheckbox);

class AdwRadioButton extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label', 'name', 'value']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._internalRadio = null; this._inputElement = null;
    }
    connectedCallback() {
        this._render();
        if (this._inputElement) {
            this.checked = this.hasAttribute('checked');
            this._inputElement.addEventListener('change', () => {
                this.checked = this._inputElement.checked;
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'checked') this.checked = this.hasAttribute('checked');
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { label: this.getAttribute('label') || '', checked: this.hasAttribute('checked'), disabled: this.hasAttribute('disabled'), name: this.getAttribute('name') || '', value: this.getAttribute('value') || '' };
        if (!options.name) console.warn("AdwRadioButton: 'name' attribute is essential.");
        this._internalRadio = Adw.createRadioButton(options);
        this.shadowRoot.appendChild(this._internalRadio);
        this._inputElement = this._internalRadio.querySelector('input[type="radio"]');
        if (this._inputElement && this.hasOwnProperty('_checked')) this._inputElement.checked = this._checked;
        if (this._inputElement && options.name && this._inputElement.name !== options.name) this._inputElement.name = options.name;
        if (this._inputElement && options.value && this._inputElement.value !== options.value) this._inputElement.value = options.value;
    }
    get checked() { return this._inputElement ? this._inputElement.checked : (this._checked || false); }
    set checked(value) {
        const isChecked = Boolean(value); this._checked = isChecked;
        if (this._inputElement) this._inputElement.checked = isChecked;
        if (isChecked) this.setAttribute('checked', ''); else this.removeAttribute('checked');
    }
}
customElements.define('adw-radio-button', AdwRadioButton);

class AdwListBox extends HTMLElement {
    static get observedAttributes() { return ['flat', 'selectable']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('flat')) options.isFlat = this.getAttribute('flat') !== null && this.getAttribute('flat') !== 'false';
        if (this.hasAttribute('selectable')) options.selectable = this.getAttribute('selectable') !== null && this.getAttribute('selectable') !== 'false';
        const listBoxElement = Adw.createListBox(options);
        listBoxElement.appendChild(document.createElement('slot'));
        this.shadowRoot.appendChild(listBoxElement);
    }
}
customElements.define('adw-list-box', AdwListBox);

class AdwRow extends HTMLElement {
    static get observedAttributes() { return ['activated', 'interactive']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._onClick = null;
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    set onClick(handler) {
        this._onClick = (typeof handler === 'function') ? handler : null;
        this._render();
    }
    get onClick() { return this._onClick; }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('activated')) options.activated = this.getAttribute('activated') !== null && this.getAttribute('activated') !== 'false';
        if (this.hasAttribute('interactive')) options.interactive = this.getAttribute('interactive') !== null && this.getAttribute('interactive') !== 'false';
        if (this._onClick) {
            options.onClick = this._onClick; options.interactive = true;
        } else if (options.interactive) {
            options.onClick = (event) => {
                if (event.target === this) return;
                this.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
            };
        }
        const rowElement = Adw.createRow(options);
        rowElement.appendChild(document.createElement('slot'));
        this.shadowRoot.appendChild(rowElement);
    }
}
customElements.define('adw-row', AdwRow);

class AdwWindowTitle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const h1 = document.createElement('h1'); h1.classList.add('adw-header-bar-title');
        h1.appendChild(document.createElement('slot')); this.shadowRoot.appendChild(h1);
    }
}
customElements.define('adw-window-title', AdwWindowTitle);

class AdwHeaderBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const header = document.createElement('header'); header.classList.add('adw-header-bar');
        const startBox = document.createElement('div'); startBox.classList.add('adw-header-bar-start');
        const startSlot = document.createElement('slot'); startSlot.name = 'start'; startBox.appendChild(startSlot);
        const centerBox = document.createElement('div'); centerBox.classList.add('adw-header-bar-center-box');
        const titleSlot = document.createElement('slot'); titleSlot.name = 'title';
        const subtitleSlot = document.createElement('slot'); subtitleSlot.name = 'subtitle';
        centerBox.append(titleSlot, subtitleSlot);
        const endBox = document.createElement('div'); endBox.classList.add('adw-header-bar-end');
        const endSlot = document.createElement('slot'); endSlot.name = 'end'; endBox.appendChild(endSlot);
        header.append(startBox, centerBox, endBox); this.shadowRoot.appendChild(header);
    }
}
customElements.define('adw-header-bar', AdwHeaderBar);

class AdwApplicationWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const windowDiv = document.createElement('div'); windowDiv.classList.add('adw-window');
        const headerSlot = document.createElement('slot'); headerSlot.name = 'header';
        const mainContent = document.createElement('main'); mainContent.classList.add('adw-window-content');
        mainContent.appendChild(document.createElement('slot'));
        windowDiv.append(headerSlot, mainContent); this.shadowRoot.appendChild(windowDiv);
    }
}
customElements.define('adw-application-window', AdwApplicationWindow);

class AdwAvatar extends HTMLElement {
    static get observedAttributes() { return ['size', 'image-src', 'text', 'alt']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('size')) options.size = parseInt(this.getAttribute('size'), 10);
        if (this.hasAttribute('image-src')) options.imageSrc = this.getAttribute('image-src');
        if (this.hasAttribute('text')) options.text = this.getAttribute('text');
        if (this.hasAttribute('alt')) options.alt = this.getAttribute('alt');
        this.shadowRoot.appendChild(Adw.createAvatar(options));
    }
}
customElements.define('adw-avatar', AdwAvatar);

class AdwFlap extends HTMLElement {
    static get observedAttributes() { return ['folded', 'flap-width', 'transition-speed']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._flapInstance = null;
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'folded' && this._flapInstance) this._flapInstance.setFolded(this.hasAttribute('folded'));
        }
    }
    _render() {
        const flapContent = this.querySelector('[slot="flap"]');
        const mainContent = this.querySelector('[slot="main"]');
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {
            isFolded: this.hasAttribute('folded'),
            flapContent: flapContent ? flapContent.cloneNode(true) : document.createElement('div'),
            mainContent: mainContent ? mainContent.cloneNode(true) : document.createElement('div')
        };
        if (this.hasAttribute('flap-width')) options.flapWidth = this.getAttribute('flap-width');
        if (this.hasAttribute('transition-speed')) options.transitionSpeed = this.getAttribute('transition-speed');
        this._flapInstance = Adw.createFlap(options);
        this.shadowRoot.appendChild(this._flapInstance.element);
    }
    toggleFlap(explicitState) {
        if (this._flapInstance) {
            this._flapInstance.toggleFlap(explicitState);
            if (this._flapInstance.isFolded()) this.setAttribute('folded', ''); else this.removeAttribute('folded');
        }
    }
    isFolded() { return this._flapInstance ? this._flapInstance.isFolded() : this.hasAttribute('folded'); }
    setFolded(state) {
        if (this._flapInstance) this._flapInstance.setFolded(state);
        if (state) this.setAttribute('folded', ''); else this.removeAttribute('folded');
    }
}
customElements.define('adw-flap', AdwFlap);

class AdwViewSwitcher extends HTMLElement {
    static get observedAttributes() { return ['label', 'active-view']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._viewSwitcherInstance = null; this._observer = null;
    }
    connectedCallback() {
        this._render();
        this._observer = new MutationObserver(() => this._render());
        this._observer.observe(this, { childList: true, subtree: false });
    }
    disconnectedCallback() { if (this._observer) this._observer.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active-view' && this._viewSwitcherInstance) this._viewSwitcherInstance.setActiveView(newValue);
            else this._render();
        }
    }
    _parseViews() {
        return Array.from(this.children).map(child => {
            if (child.hasAttribute('view-name')) {
                return { name: child.getAttribute('view-name'), content: child.cloneNode(true), id: child.id || undefined };
            }
            console.warn("AdwViewSwitcher: Child element missing 'view-name'", child); return null;
        }).filter(v => v);
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const views = this._parseViews();
        const options = {
            views: views, label: this.getAttribute('label') || undefined,
            activeViewName: this.getAttribute('active-view') || (views.length > 0 ? views[0].name : undefined),
            onViewChanged: (viewName, buttonId, panelId) => {
                this.setAttribute('active-view', viewName);
                this.dispatchEvent(new CustomEvent('view-changed', { detail: { viewName, buttonId, panelId }, bubbles: true, composed: true }));
            }
        };
        this._viewSwitcherInstance = Adw.createViewSwitcher(options);
        this.shadowRoot.appendChild(this._viewSwitcherInstance);
    }
    setActiveView(viewName) {
        if (this._viewSwitcherInstance) this._viewSwitcherInstance.setActiveView(viewName);
        else this.setAttribute('active-view', viewName);
    }
}
customElements.define('adw-view-switcher', AdwViewSwitcher);

class AdwProgressBar extends HTMLElement {
    static get observedAttributes() { return ['value', 'indeterminate', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('value')) options.value = parseFloat(this.getAttribute('value'));
        if (this.hasAttribute('indeterminate')) options.isIndeterminate = this.getAttribute('indeterminate') !== null && this.getAttribute('indeterminate') !== 'false';
        if (this.hasAttribute('disabled')) options.disabled = this.getAttribute('disabled') !== null && this.getAttribute('disabled') !== 'false';
        this.shadowRoot.appendChild(Adw.createProgressBar(options));
    }
}
customElements.define('adw-progress-bar', AdwProgressBar);

class AdwSpinner extends HTMLElement {
    static get observedAttributes() { return ['size', 'active']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._spinnerElement = null;
    }
    connectedCallback() {
        if (!this.hasAttribute('active')) this.setAttribute('active', 'true');
        this._render();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active') this._updateActivityState(); else this._render();
        }
    }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {};
        if (this.hasAttribute('size')) options.size = this.getAttribute('size');
        this._spinnerElement = Adw.createSpinner(options);
        this.shadowRoot.appendChild(this._spinnerElement);
        this._updateActivityState();
    }
    _updateActivityState() {
        if (this._spinnerElement) {
            const isActive = this.getAttribute('active') !== null && this.getAttribute('active') !== 'false';
            this._spinnerElement.classList.toggle('hidden', !isActive);
        }
    }
}
customElements.define('adw-spinner', AdwSpinner);

class AdwSplitButton extends HTMLElement {
    static get observedAttributes() { return ['action-text', 'action-href', 'suggested', 'disabled', 'dropdown-aria-label']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = {
            onActionClick: (e) => this.dispatchEvent(new CustomEvent('action-click', {bubbles: true, composed: true, detail: {originalEvent: e}})),
            onDropdownClick: (e) => this.dispatchEvent(new CustomEvent('dropdown-click', {bubbles: true, composed: true, detail: {originalEvent: e}}))
        };
        ['action-text', 'action-href', 'dropdown-aria-label'].forEach(attr => {
            if (this.hasAttribute(attr)) options[attr.replace(/-([a-z])/g, g => g[1].toUpperCase())] = this.getAttribute(attr);
        });
        ['suggested', 'disabled'].forEach(attr => {
            if (this.hasAttribute(attr)) options[attr] = this.getAttribute(attr) !== null && this.getAttribute(attr) !== 'false';
        });
        this.shadowRoot.appendChild(Adw.createSplitButton(options));
    }
}
customElements.define('adw-split-button', AdwSplitButton);

class AdwStatusPage extends HTMLElement {
    static get observedAttributes() { return ['title', 'description', 'icon']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() {
        this._render();
        const slot = this.shadowRoot.querySelector('slot[name="actions"]'); // This slot is not created by current _render
        // For a slot-based approach, Adw.createStatusPage would need to be slot-aware or actions handled differently.
        // The current implementation passes cloned actions to the factory.
        // If a slot in shadow DOM for actions is desired, _render needs to change.
    }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        const actionsSlot = this.querySelector('[slot="actions"]');
        const actions = actionsSlot ? Array.from(actionsSlot.children).map(child => child.cloneNode(true)) : [];
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { actions: actions };
        if (this.hasAttribute('title')) options.title = this.getAttribute('title');
        if (this.hasAttribute('description')) options.description = this.getAttribute('description');
        if (this.hasAttribute('icon')) options.iconHTML = this.getAttribute('icon');
        this.shadowRoot.appendChild(Adw.createStatusPage(options));
    }
}
customElements.define('adw-status-page', AdwStatusPage);

class AdwExpanderRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'expanded']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        const contentSlot = this.querySelector('[slot="content"]');
        const contentClone = contentSlot ? contentSlot.cloneNode(true) : document.createElement('div');
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { title: this.getAttribute('title') || '', content: contentClone };
        if (this.hasAttribute('subtitle')) options.subtitle = this.getAttribute('subtitle');
        if (this.hasAttribute('expanded')) options.expanded = this.getAttribute('expanded') !== null && this.getAttribute('expanded') !== 'false';
        this.shadowRoot.appendChild(Adw.createExpanderRow(options));
    }
}
customElements.define('adw-expander-row', AdwExpanderRow);

class AdwDialog extends HTMLElement {
    static get observedAttributes() { return ['title', 'close-on-backdrop-click', 'open']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Shadow DOM might not be strictly needed if dialog is always in body
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink); // Style link for completeness, though dialog is modal in body
        this._dialogInstance = null;
    }
    connectedCallback() {
        this._render();
        if (this.hasAttribute('open')) this.open();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') { if (newValue !== null) this.open(); else this.close(); }
        else this._render();
    }
    _render() {
        const contentSlot = this.querySelector('[slot="content"]');
        const buttonsSlot = this.querySelector('[slot="buttons"]');
        const contentClone = contentSlot ? contentSlot.cloneNode(true) : document.createElement('div');
        const buttonElements = buttonsSlot ? Array.from(buttonsSlot.children).map(child => child.cloneNode(true)) : [];

        // No need to clear shadowRoot if it's not hosting the dialog itself.
        // If it were, this._dialogInstance.dialog would be appended to shadowRoot.

        const options = {
            title: this.getAttribute('title') || undefined,
            closeOnBackdropClick: this.hasAttribute('close-on-backdrop-click') ? (this.getAttribute('close-on-backdrop-click') !== 'false') : true,
            content: contentClone, buttons: buttonElements,
            onClose: () => {
                this.removeAttribute('open');
                this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
            }
        };
        this._dialogInstance = Adw.createDialog(options);
        // Dialog is controlled, not appended to shadow DOM here.
    }
    open() {
        if (!this._dialogInstance) this._render(); // Ensure instance exists
        this._dialogInstance.open();
        if (!this.hasAttribute('open')) this.setAttribute('open', '');
    }
    close() {
        if (this._dialogInstance) this._dialogInstance.close();
        // onClose callback handles removing 'open' attribute.
    }
}
customElements.define('adw-dialog', AdwDialog);

class AdwBanner extends HTMLElement {
    static get observedAttributes() { return ['message', 'type', 'dismissible', 'show']; }
    constructor() { super(); this._bannerInstance = null; } // No Shadow DOM for controller
    connectedCallback() { if (this.hasAttribute('show')) this.show(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'show' && oldValue !== newValue) { if (newValue !== null) this.show(); else this.hide(); }
    }
    show() {
        const message = this.getAttribute('message') || this.innerHTML.trim();
        if (!message) { console.warn('AdwBanner: Message empty.'); return; }
        if (this._bannerInstance && this._bannerInstance.isConnected) this._bannerInstance.remove();
        const options = {
            type: this.getAttribute('type') || 'info',
            dismissible: this.hasAttribute('dismissible') ? (this.getAttribute('dismissible') !== 'false') : true,
            id: this.id ? `${this.id}-instance` : undefined
        };
        this._bannerInstance = Adw.createAdwBanner(message, options);
        if (!this.hasAttribute('show')) this.setAttribute('show', '');
        if (this._bannerInstance && this._bannerInstance.parentNode) { // Observe for removal
            const observer = new MutationObserver(() => {
                if (!this._bannerInstance || !this._bannerInstance.isConnected) {
                    this.removeAttribute('show'); observer.disconnect();
                }
            });
            observer.observe(this._bannerInstance.parentNode, { childList: true });
        }
    }
    hide() {
        if (this._bannerInstance && this._bannerInstance.isConnected) {
            const closeBtn = this._bannerInstance.querySelector('.adw-banner-close-button');
            if (closeBtn) closeBtn.click(); else this._bannerInstance.remove();
        }
        this._bannerInstance = null;
    }
}
customElements.define('adw-banner', AdwBanner);

class AdwToast extends HTMLElement {
    static get observedAttributes() { return ['message', 'type', 'timeout', 'show']; }
    constructor() { super(); this._toastInstance = null; } // No Shadow DOM for controller
    connectedCallback() { if (this.hasAttribute('show')) this.show(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'show' && oldValue !== newValue) { if (newValue !== null) this.show(); }
    }
    show() {
        const message = this.getAttribute('message') || this.innerHTML.trim();
        if (!message) { console.warn('AdwToast: Message empty.'); return; }
        if (this._toastInstance && this._toastInstance.isConnected) this._toastInstance.remove();
        const options = {
            type: this.getAttribute('type') || undefined,
            timeout: this.hasAttribute('timeout') ? parseInt(this.getAttribute('timeout'), 10) : 4000
        };
        const buttonSlot = this.querySelector('[slot="button"]');
        if (buttonSlot) options.button = buttonSlot.cloneNode(true);
        this._toastInstance = Adw.createAdwToast(message, options);
        if (!this.hasAttribute('show')) this.setAttribute('show', '');
        if (this._toastInstance && this._toastInstance.parentNode) { // Observe for removal
            const observer = new MutationObserver(() => {
                if (!this._toastInstance || !this._toastInstance.isConnected) {
                    this.removeAttribute('show'); observer.disconnect();
                }
            });
            observer.observe(this._toastInstance.parentNode, { childList: true });
        }
    }
    hide() { // Optional programmatic hide
        if (this._toastInstance && this._toastInstance.isConnected) this._toastInstance.remove();
        this._toastInstance = null; this.removeAttribute('show');
    }
}
customElements.define('adw-toast', AdwToast);

class AdwPreferencesView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        const wrapper = document.createElement('div');
        wrapper.classList.add('adw-preferences-view');
        wrapper.appendChild(document.createElement('slot'));
        this.shadowRoot.append(styleLink, wrapper);
    }
}
customElements.define('adw-preferences-view', AdwPreferencesView);

class AdwPreferencesPage extends HTMLElement {
    static get observedAttributes() { return ['title']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-preferences-page');
        this._titleElement = document.createElement('h1'); this._titleElement.classList.add('adw-preferences-page-title');
        this._wrapper.append(this._titleElement, document.createElement('slot'));
        this.shadowRoot.append(styleLink, this._wrapper);
    }
    connectedCallback() { this._renderTitle(); }
    attributeChangedCallback(name, oldValue, newValue) { if (name === 'title' && oldValue !== newValue) this._renderTitle(); }
    _renderTitle() { this._titleElement.textContent = this.getAttribute('title') || 'Page'; }
}
customElements.define('adw-preferences-page', AdwPreferencesPage);

class AdwPreferencesGroup extends HTMLElement {
    static get observedAttributes() { return ['title']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-preferences-group');
        this._titleElement = document.createElement('div'); this._titleElement.classList.add('adw-preferences-group-title');
        this._wrapper.append(this._titleElement, document.createElement('slot'));
        this.shadowRoot.append(styleLink, this._wrapper);
    }
    connectedCallback() { this._renderTitle(); }
    attributeChangedCallback(name, oldValue, newValue) { if (name === 'title' && oldValue !== newValue) this._renderTitle(); }
    _renderTitle() {
        const title = this.getAttribute('title');
        this._titleElement.textContent = title || '';
        this._titleElement.style.display = title ? '' : 'none';
    }
}
customElements.define('adw-preferences-group', AdwPreferencesGroup);

class AdwSwitchRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'active', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-row', 'adw-switch-row');
        this._textContent = document.createElement('div'); this._textContent.classList.add('adw-action-row-text-content');
        this._titleElement = document.createElement('span'); this._titleElement.classList.add('adw-action-row-title');
        this._subtitleElement = document.createElement('span'); this._subtitleElement.classList.add('adw-action-row-subtitle');
        this._switchElement = new AdwSwitch(); // Use AdwSwitch component
        this._textContent.append(this._titleElement, this._subtitleElement);
        this._wrapper.append(this._textContent, this._switchElement);
        this.shadowRoot.append(styleLink, this._wrapper);
        this._switchElement.addEventListener('change', () => { this.active = this._switchElement.checked; });
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
            if (name === 'active') this.active = this.hasAttribute('active');
            else if (name === 'disabled') this.disabled = this.hasAttribute('disabled');
        }
    }
    _render() {
        this._titleElement.textContent = this.getAttribute('title') || '';
        const subtitle = this.getAttribute('subtitle');
        this._subtitleElement.textContent = subtitle || '';
        this._subtitleElement.style.display = subtitle ? '' : 'none';
        this.active = this.hasAttribute('active');
        this.disabled = this.hasAttribute('disabled');
    }
    get active() { return this._switchElement.checked; }
    set active(value) {
        const isActive = Boolean(value);
        if (this._switchElement.checked !== isActive) this._switchElement.checked = isActive;
        if (isActive) this.setAttribute('active', ''); else this.removeAttribute('active');
    }
    get disabled() { return this._switchElement.disabled; } // AdwSwitch needs a .disabled property
    set disabled(value) {
        const isDisabled = Boolean(value);
        // Assuming AdwSwitch component has a 'disabled' property that reflects to its internal input
        if (this._switchElement.disabled !== isDisabled) this._switchElement.disabled = isDisabled;
        if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled');
        this._wrapper.classList.toggle('disabled', isDisabled);
    }
}
customElements.define('adw-switch-row', AdwSwitchRow);

class AdwComboRow extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'value', 'disabled']; }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-row', 'adw-combo-row');
        this._textContent = document.createElement('div'); this._textContent.classList.add('adw-combo-row-text-content');
        this._titleElement = document.createElement('span'); this._titleElement.classList.add('adw-combo-row-title');
        this._subtitleElement = document.createElement('span'); this._subtitleElement.classList.add('adw-combo-row-subtitle');
        this._selectElement = document.createElement('select'); this._selectElement.classList.add('adw-combo-row-select');
        this._textContent.append(this._titleElement, this._subtitleElement);
        this._wrapper.append(this._textContent, this._selectElement);
        this.shadowRoot.append(styleLink, this._wrapper);
        this._selectElement.addEventListener('change', () => {
            this.value = this._selectElement.value;
            this.dispatchEvent(new CustomEvent('change', {bubbles: true, composed: true, detail: {value: this.value}}));
        });
        this._options = [];
    }
    connectedCallback() { this._render(); }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'value' && this._selectElement && this._selectElement.value !== newValue) this._selectElement.value = newValue;
            this._render();
        }
    }
    _render() {
        this._titleElement.textContent = this.getAttribute('title') || '';
        const subtitle = this.getAttribute('subtitle');
        this._subtitleElement.textContent = subtitle || '';
        this._subtitleElement.style.display = subtitle ? '' : 'none';
        this.disabled = this.hasAttribute('disabled'); // Use setter
        if (this._options.length > 0 && this.hasAttribute('value')) {
            const valueAttr = this.getAttribute('value');
            if (this._selectElement.value !== valueAttr) this._selectElement.value = valueAttr;
        }
    }
    get value() { return this._selectElement.value; }
    set value(val) {
        const strVal = String(val);
        if (this._selectElement.value !== strVal) this._selectElement.value = strVal;
        if (val !== null && val !== undefined) this.setAttribute('value', strVal); else this.removeAttribute('value');
    }
    get selectOptions() { return this._options; }
    set selectOptions(optionsArray) {
        this._options = Array.isArray(optionsArray) ? optionsArray : [];
        this._selectElement.innerHTML = '';
        this._options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value; optionEl.textContent = opt.label;
            this._selectElement.appendChild(optionEl);
        });
        const currentValue = this.getAttribute('value');
        if (currentValue !== null) this.value = currentValue; // Use setter
        else if (this._selectElement.options.length > 0) this.value = this._selectElement.options[0].value; // Default to first
    }
    get disabled() { return this._selectElement.disabled; }
    set disabled(value) {
        const isDisabled = Boolean(value);
        this._selectElement.disabled = isDisabled;
        this._wrapper.classList.toggle('disabled', isDisabled);
        if (isDisabled) this.setAttribute('disabled', ''); else this.removeAttribute('disabled');
    }
}
customElements.define('adw-combo-row', AdwComboRow);

console.log('[Debug] components.js execution ended');
