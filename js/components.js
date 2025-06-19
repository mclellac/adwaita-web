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
  createDialog: createAdwDialog,
  createProgressBar: createAdwProgressBar,
  createCheckbox: createAdwCheckbox,
  createRadioButton: createAdwRadioButton,
  createListBox: createAdwListBox,
  toggleTheme: toggleTheme, // This is now the wrapped version
  getAccentColors: getAccentColors,
  setAccentColor: setAccentColor,
  // loadSavedAccentColor, // Not typically exposed, called by loadSavedTheme/toggleTheme
  // loadSavedTheme, // Not typically exposed, called on DOMContentLoaded
};

// AdwViewSwitcher
function createAdwViewSwitcher(options = {}) {
  const switcherElement = document.createElement("div");
  switcherElement.classList.add("adw-view-switcher");

  const bar = document.createElement("div");
  bar.classList.add("adw-view-switcher-bar");

  const contentContainer = document.createElement("div");
  contentContainer.classList.add("adw-view-switcher-content");

  const views = options.views || [];
  let currentActiveButton = null;
  let currentActiveViewElement = null;

  views.forEach((view, index) => {
    // Create content element for the view
    const viewContentElement = view.content instanceof Node ? view.content : document.createElement('div');
    if (!(view.content instanceof Node)) { // If raw content, set it (e.g. string)
        viewContentElement.innerHTML = view.content;
    }
    viewContentElement.dataset.viewName = view.name; // Store name for identification
    contentContainer.appendChild(viewContentElement);

    // Create button for the view
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

        if (options.onViewChanged) {
          options.onViewChanged(view.name);
        }
      },
      // Use flat buttons for a more typical view switcher look, if desired
      // flat: true
    });
    button.dataset.viewName = view.name; // Store name for identification
    bar.appendChild(button);

    // Set initial active view
    if ((options.activeViewName && view.name === options.activeViewName) || (!options.activeViewName && index === 0)) {
      button.classList.add("active");
      viewContentElement.classList.add("active-view");
      currentActiveButton = button;
      currentActiveViewElement = viewContentElement;
    }
  });

  switcherElement.appendChild(bar);
  switcherElement.appendChild(contentContainer);

  // Method to programmatically switch view
  switcherElement.setActiveView = (viewName) => {
    const buttonToActivate = Array.from(bar.children).find(btn => btn.dataset.viewName === viewName);
    if (buttonToActivate) {
      buttonToActivate.click(); // Simulate click to trigger the view change logic
    }
  };

  return switcherElement;
}


window.Adw.createViewSwitcher = createAdwViewSwitcher; // Add to exports

// AdwFlap
function createAdwFlap(options = {}) {
  const flapElement = document.createElement("div");
  flapElement.classList.add("adw-flap");

  const flapContentElement = document.createElement("div");
  flapContentElement.classList.add("adw-flap-flap-content");
  if (options.flapContent) {
    flapContentElement.appendChild(options.flapContent);
  }

  const mainContentElement = document.createElement("div");
  mainContentElement.classList.add("adw-flap-main-content");
  if (options.mainContent) {
    mainContentElement.appendChild(options.mainContent);
  }

  flapElement.appendChild(flapContentElement);
  flapElement.appendChild(mainContentElement);

  let isFolded = options.isFolded || false;
  if (isFolded) {
    flapElement.classList.add("folded");
  }

  function toggleFlap(explicitState) {
    if (typeof explicitState === 'boolean') {
        isFolded = explicitState;
    } else {
        isFolded = !isFolded;
    }

    if (isFolded) {
      flapElement.classList.add("folded");
    } else {
      flapElement.classList.remove("folded");
    }
    // Dispatch an event when the fold state changes
    const event = new CustomEvent('foldchanged', { detail: { folded: isFolded } });
    flapElement.dispatchEvent(event);
  }

  // Optional: Add a CSS variable for flap width if provided in options
  if (options.flapWidth) {
    flapElement.style.setProperty('--adw-flap-width', options.flapWidth);
  }
   if (options.transitionSpeed) {
    flapElement.style.setProperty('--adw-flap-transition-speed', options.transitionSpeed);
  }


  // Return the main element and the toggle function
  return {
    element: flapElement,
    toggleFlap: toggleFlap,
    isFolded: () => isFolded, // Method to get current state
    setFolded: (state) => toggleFlap(state) // Method to set state
  };
}

window.Adw.createFlap = createAdwFlap; // Add to exports

// Ensure loadSavedTheme is called, which now also handles accent color loading.
window.addEventListener("DOMContentLoaded", loadSavedTheme);
