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
 * Creates an AdwBottomSheet element.
 * @param {object} [options={}] Configuration options.
 * @param {HTMLElement} options.content The content to display within the bottom sheet.
 * @param {boolean} [options.isOpen=false] Initial open state.
 * @param {function} [options.onOpen] Callback when sheet opens.
 * @param {function} [options.onClose] Callback when sheet closes.
 * @param {boolean} [options.closeOnBackdropClick=true] If true, clicking backdrop closes the sheet.
 * @returns {{ sheet: HTMLDivElement, backdrop: HTMLDivElement, open: function, close: function }}
 */
function createAdwBottomSheet(options = {}) {
    const opts = options || {};
    if (!opts.content) {
        console.error("AdwBottomSheet: options.content is required.");
        // Return a dummy object or throw error
        return { sheet: document.createElement('div'), backdrop: document.createElement('div'), open: ()=>{}, close: ()=>{} };
    }

    const backdrop = document.createElement('div');
    backdrop.classList.add('adw-bottom-sheet-backdrop');

    const sheet = document.createElement('div');
    sheet.classList.add('adw-bottom-sheet');
    sheet.setAttribute('role', 'dialog'); // Or 'complementary' depending on usage
    sheet.setAttribute('aria-modal', 'true'); // If it behaves like a modal

    sheet.appendChild(opts.content);

    let currentIsOpen = false;

    function openSheet() {
        if (currentIsOpen) return;
        document.body.appendChild(backdrop);
        document.body.appendChild(sheet);
        document.body.style.overflow = 'hidden'; // Prevent body scroll when sheet is open

        // Trigger animations
        setTimeout(() => {
            backdrop.classList.add('visible');
            sheet.classList.add('visible');
        }, 10); // Small delay for CSS transitions

        currentIsOpen = true;
        if (typeof opts.onOpen === 'function') {
            opts.onOpen();
        }
    }

    function closeSheet() {
        if (!currentIsOpen) return;
        backdrop.classList.remove('visible');
        sheet.classList.remove('visible');

        setTimeout(() => {
            if (backdrop.parentNode) backdrop.remove();
            if (sheet.parentNode) sheet.remove();
            document.body.style.overflow = ''; // Restore body scroll
        }, 300); // Match CSS transition time

        currentIsOpen = false;
        if (typeof opts.onClose === 'function') {
            opts.onClose();
        }
    }

    if (opts.closeOnBackdropClick !== false) {
        backdrop.addEventListener('click', closeSheet);
    }

    // Add Escape key listener to the sheet itself, or globally when open
    // For simplicity, adding to sheet. It needs to be focusable or have focusable content.
    sheet.setAttribute('tabindex', '-1'); // Make sheet focusable for key events
    sheet.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentIsOpen) {
            closeSheet();
        }
    });


    if (opts.isOpen) {
        openSheet();
    }

    return {
        sheet,
        backdrop,
        open: openSheet,
        close: closeSheet,
        get isOpen() { return currentIsOpen; }
    };
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
 * Creates and displays an Adwaita-style Alert Dialog.
 * This is a specialized version of AdwDialog for common alert patterns.
 * @param {string} body - The main message/body of the alert.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.heading] - Optional heading for the alert.
 * @param {Array<{label: string, value: string, style?: 'default'|'suggested'|'destructive'}>} [options.choices=[]] -
 *        Array of choice objects to create buttons. E.g., {label: "OK", value: "ok", style: "suggested"}.
 * @param {function(string)} [options.onResponse] - Callback function when a choice button is clicked, receives the 'value'.
 * @param {boolean} [options.closeOnBackdropClick=false] - Whether clicking backdrop closes (usually false for alerts).
 * @param {HTMLElement} [options.customContent] - Optional custom HTML element to use as content instead of the body string.
 * @returns {{dialog: HTMLDivElement, open: function, close: function}} Object with dialog element and methods.
 */
function createAdwAlertDialog(body, options = {}) {
  const opts = options || {};
  const dialogId = adwGenerateId('adw-alert-dialog');

  const contentEl = document.createElement('div');
  contentEl.classList.add('adw-alert-dialog-content-wrapper');

  if (opts.customContent instanceof Node) {
    contentEl.appendChild(opts.customContent);
  } else if (body) {
    const bodyP = document.createElement('p');
    bodyP.classList.add('adw-alert-dialog-body');
    bodyP.textContent = body;
    contentEl.appendChild(bodyP);
  }

  const buttons = [];
  if (Array.isArray(opts.choices) && opts.choices.length > 0) {
    opts.choices.forEach(choice => {
      const button = createAdwButton(choice.label, {
        suggested: choice.style === 'suggested',
        destructive: choice.style === 'destructive',
        onClick: () => {
          if (typeof opts.onResponse === 'function') {
            opts.onResponse(choice.value);
          }
          // Automatically close the dialog when a choice is made
          alertDialog.close();
        }
      });
      buttons.push(button);
    });
  } else {
    // Default "OK" button if no choices provided
    buttons.push(createAdwButton("OK", {
      suggested: true,
      onClick: () => {
        if (typeof opts.onResponse === 'function') {
          opts.onResponse("ok"); // Default response value
        }
        alertDialog.close();
      }
    }));
  }

  const dialogOptions = {
    title: opts.heading || undefined, // AdwDialog handles title
    content: contentEl,
    buttons: buttons,
    closeOnBackdropClick: opts.closeOnBackdropClick === true, // Default to false for alerts
    onClose: () => {
      // Any specific onClose logic for alert dialog itself, if needed in future
    }
  };

  const alertDialog = createAdwDialog(dialogOptions);
  alertDialog.dialog.classList.add('adw-alert-dialog'); // Add specific class for styling
  if(opts.heading) alertDialog.dialog.setAttribute('aria-label', opts.heading);
  else if(body) alertDialog.dialog.setAttribute('aria-label', body.substring(0, 50));


  // Ensure the dialog is announced by screen readers
  alertDialog.dialog.setAttribute('aria-live', 'assertive');
  alertDialog.dialog.setAttribute('aria-atomic', 'true');


  return alertDialog;
}

/**
 * Creates an Adwaita-style About Dialog.
 * @param {object} options - Configuration options for the about dialog.
 * @param {string} [options.appName] - The name of the application.
 * @param {string} [options.appIcon] - URL or class for the application icon.
 * @param {string} [options.logo] - URL for a larger logo image.
 * @param {string} [options.version] - Application version.
 * @param {string} [options.copyright] - Copyright information.
 * @param {string|string[]} [options.developerName] - Main developer(s).
 * @param {string} [options.website] - Application website URL.
 * @param {string} [options.websiteLabel] - Label for the website link.
 * @param {string} [options.licenseType] - SPDX license identifier (e.g., "MIT", "GPL-3.0-or-later").
 * @param {string} [options.licenseText] - Custom license text (can be long).
 * @param {string} [options.comments] - General comments about the application.
 * @param {string[]} [options.developers] - List of developers.
 * @param {string[]} [options.designers] - List of designers.
 * @param {string[]} [options.documenters] - List of documenters.
 * @param {string} [options.translatorCredits] - Translator credits.
 * @param {string[]} [options.artists] - List of artists.
 * @param {Array<string|{title: string, names: string[]}>} [options.acknowledgements] - Acknowledgements.
 * @returns {{dialog: HTMLDivElement, open: function, close: function}} Object with dialog element and methods.
 */
function createAdwAboutDialog(options = {}) {
  const opts = options || {};
  const dialogId = adwGenerateId('adw-about-dialog');

  const aboutDialogContent = document.createElement('div');
  aboutDialogContent.classList.add('adw-about-dialog-content');

  // Header section: Icon, App Name, Version
  const headerSection = document.createElement('header');
  headerSection.classList.add('adw-about-dialog-header');

  if (opts.logo) {
    const logoImg = document.createElement('img');
    logoImg.src = opts.logo;
    logoImg.alt = `${opts.appName || 'Application'} Logo`;
    logoImg.classList.add('adw-about-dialog-logo');
    headerSection.appendChild(logoImg);
  } else if (opts.appIcon) {
    // Simple icon if no full logo
    if (opts.appIcon.includes('.') || opts.appIcon.startsWith('data:')) { // Basic check for URL
        const iconImg = document.createElement('img');
        iconImg.src = opts.appIcon;
        iconImg.alt = `${opts.appName || 'Application'} Icon`;
        iconImg.classList.add('adw-about-dialog-app-icon-img');
        headerSection.appendChild(iconImg);
    } else { // Assume it's a class name
        const iconSpan = document.createElement('span');
        iconSpan.className = `adw-about-dialog-app-icon ${opts.appIcon}`;
        headerSection.appendChild(iconSpan);
    }
  }


  const appInfoDiv = document.createElement('div');
  appInfoDiv.classList.add('adw-about-dialog-app-info');
  if (opts.appName) {
    const appNameEl = document.createElement('h1');
    appNameEl.classList.add('adw-about-dialog-app-name');
    appNameEl.textContent = opts.appName;
    appInfoDiv.appendChild(appNameEl);
  }
  if (opts.version) {
    const versionEl = document.createElement('p');
    versionEl.classList.add('adw-about-dialog-version');
    versionEl.textContent = `Version ${opts.version}`;
    appInfoDiv.appendChild(versionEl);
  }
  headerSection.appendChild(appInfoDiv);
  aboutDialogContent.appendChild(headerSection);


  // Main content: comments, copyright, website etc.
  const mainContentSection = document.createElement('div');
  mainContentSection.classList.add('adw-about-dialog-main-content');

  if (opts.comments) {
    const commentsEl = document.createElement('p');
    commentsEl.classList.add('adw-about-dialog-comments');
    commentsEl.textContent = opts.comments;
    mainContentSection.appendChild(commentsEl);
  }

  if (opts.developerName) {
    const devEl = document.createElement('p');
    devEl.classList.add('adw-about-dialog-developer');
    const names = Array.isArray(opts.developerName) ? opts.developerName.join(', ') : opts.developerName;
    devEl.innerHTML = `Developed by: <strong>${names}</strong>`;
    mainContentSection.appendChild(devEl);
  }

  if (opts.copyright) {
    const copyrightEl = document.createElement('p');
    copyrightEl.classList.add('adw-about-dialog-copyright');
    copyrightEl.textContent = opts.copyright;
    mainContentSection.appendChild(copyrightEl);
  }

  if (opts.website) {
    const websiteEl = document.createElement('p');
    websiteEl.classList.add('adw-about-dialog-website');
    const websiteLink = document.createElement('a');
    websiteLink.href = opts.website;
    websiteLink.target = '_blank';
    websiteLink.rel = 'noopener noreferrer';
    websiteLink.textContent = opts.websiteLabel || opts.website;
    websiteEl.appendChild(websiteLink);
    mainContentSection.appendChild(websiteEl);
  }
  aboutDialogContent.appendChild(mainContentSection);

  // Credits & License Section (often in an expander or separate view in native Adwaita)
  // For web, we can use an AdwExpanderRow or just list them.
  // Let's create an expander for "Details" which can contain license and credits.

  const detailsContent = document.createElement('div');
  detailsContent.classList.add('adw-about-dialog-details-content');
  let hasDetails = false;

  function createListSection(title, items) {
    if (items && items.length > 0) {
      hasDetails = true;
      const sectionEl = document.createElement('div');
      sectionEl.classList.add('adw-about-dialog-credits-section');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      sectionEl.appendChild(titleEl);
      const listEl = document.createElement('ul');
      items.forEach(item => {
        const listItem = document.createElement('li');
        if (typeof item === 'object' && item.title && Array.isArray(item.names)) { // For acknowledgements
            listItem.innerHTML = `<strong>${item.title}:</strong> ${item.names.join(', ')}`;
        } else {
            listItem.textContent = item;
        }
        listEl.appendChild(listItem);
      });
      sectionEl.appendChild(listEl);
      return sectionEl;
    }
    return null;
  }

  const devList = createListSection("Developers", opts.developers);
  if (devList) detailsContent.appendChild(devList);

  const designerList = createListSection("Designers", opts.designers);
  if (designerList) detailsContent.appendChild(designerList);

  const docList = createListSection("Documenters", opts.documenters);
  if (docList) detailsContent.appendChild(docList);

  const artistList = createListSection("Artists", opts.artists);
  if (artistList) detailsContent.appendChild(artistList);

  if (opts.translatorCredits) {
    hasDetails = true;
    const translatorEl = document.createElement('div');
    translatorEl.classList.add('adw-about-dialog-credits-section');
    const titleEl = document.createElement('h3');
    titleEl.textContent = "Translators";
    translatorEl.appendChild(titleEl);
    const pEl = document.createElement('p');
    pEl.textContent = opts.translatorCredits;
    translatorEl.appendChild(pEl);
    detailsContent.appendChild(translatorEl);
  }

  const ackList = createListSection("Acknowledgements", opts.acknowledgements);
  if (ackList) detailsContent.appendChild(ackList);


  if (opts.licenseType || opts.licenseText) {
    hasDetails = true;
    const licenseSection = document.createElement('div');
    licenseSection.classList.add('adw-about-dialog-license-section');
    const licenseTitle = document.createElement('h3');
    licenseTitle.textContent = "License";
    licenseSection.appendChild(licenseTitle);

    if (opts.licenseType) {
        const licenseTypeP = document.createElement('p');
        // Simple link for common licenses - could be expanded
        const spdxUrl = `https://spdx.org/licenses/${opts.licenseType}.html`;
        licenseTypeP.innerHTML = `This program is distributed under the terms of the <a href="${spdxUrl}" target="_blank" rel="noopener noreferrer">${opts.licenseType}</a>.`;
        licenseSection.appendChild(licenseTypeP);
    }
    if (opts.licenseText) {
        const licenseTextEl = document.createElement('pre');
        licenseTextEl.classList.add('adw-about-dialog-license-text');
        licenseTextEl.textContent = opts.licenseText;
        licenseSection.appendChild(licenseTextEl);
    }
    detailsContent.appendChild(licenseSection);
  }

  if (hasDetails) {
    const expander = createAdwExpanderRow({
        title: "Details",
        content: detailsContent,
        expanded: false // Start collapsed
    });
    aboutDialogContent.appendChild(expander);
  }

  const dialog = createAdwDialog({
    title: `About ${opts.appName || ''}`,
    content: aboutDialogContent,
    buttons: [createAdwButton("Close", { suggested: true, onClick: () => dialog.close() })],
    closeOnBackdropClick: true
  });

  dialog.dialog.classList.add('adw-about-dialog');
  dialog.dialog.style.maxWidth = '600px'; // About dialogs can be a bit wider

  return dialog;
}

/**
 * Creates an Adwaita-style Preferences Dialog.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.title="Preferences"] - Title for the dialog window.
 * @param {Array<{name: string, title: string, pageElement: HTMLElement}>} [options.pages=[]] -
 *        Array of page objects. Each object: { name: "internalName", title: "Display Title", pageElement: HTMLElement }.
 *        The pageElement should be an AdwPreferencesPage or similarly structured element.
 * @param {function} [options.onClose] - Callback when the dialog is closed.
 * @param {string} [options.initialPageName] - Optional name of the page to show initially. Defaults to the first page.
 * @returns {{dialog: HTMLDivElement, open: function, close: function}} Object with dialog element and methods.
 */
function createAdwPreferencesDialog(options = {}) {
  const opts = options || {};
  const dialogTitle = opts.title || "Preferences";

  const preferencesDialogContent = document.createElement('div');
  preferencesDialogContent.classList.add('adw-preferences-dialog-content');

  const viewsForSwitcher = (opts.pages || []).map(page => ({
    name: page.name,
    // title: page.title, // The button text for ViewSwitcher is page.title
    content: page.pageElement, // This is the AdwPreferencesPage element
    buttonOptions: { text: page.title } // Pass title as button text
  }));

  if (viewsForSwitcher.length === 0) {
    console.warn("AdwPreferencesDialog: No pages provided.");
    const emptyState = Adw.createStatusPage({ title: "No Preferences", description: "There are no preference pages configured."});
    preferencesDialogContent.appendChild(emptyState);
  } else {
    const viewSwitcher = createAdwViewSwitcher({
      views: viewsForSwitcher,
      activeViewName: opts.initialPageName || (viewsForSwitcher[0] ? viewsForSwitcher[0].name : undefined),
      label: "Preference Pages" // ARIA label for the view switcher bar
    });
    // Preferences dialogs often have the view switcher bar with a different style, or integrated.
    // For now, use default view switcher. Could add a class for specific styling.
    viewSwitcher.classList.add('adw-preferences-dialog-view-switcher');
    preferencesDialogContent.appendChild(viewSwitcher);
  }

  const dialog = createAdwDialog({
    title: dialogTitle,
    content: preferencesDialogContent,
    // Preferences dialogs usually don't have explicit global action buttons like "OK", "Cancel"
    // Actions are within the pages, or it's just closed.
    // A close button is often part of the dialog's title bar (handled by AdwDialog default structure if applicable)
    // or implicitly by pressing Escape.
    buttons: [Adw.createButton("Close", { onClick: () => dialog.close(), suggested: true })], // Added a close button for now
    closeOnBackdropClick: true, // Standard for preferences
    onClose: opts.onClose
  });

  dialog.dialog.classList.add('adw-preferences-dialog');
  // Preferences dialogs are often larger
  dialog.dialog.style.minWidth = '600px';
  dialog.dialog.style.minHeight = '400px';
  // Ensure content area can scroll if pages are tall
  const adwDialogContent = dialog.dialog.querySelector('.adw-dialog-content');
  if (adwDialogContent) {
      adwDialogContent.style.maxHeight = '70vh';
      adwDialogContent.style.overflowY = 'auto';
  }


  return dialog;
}

/**
 * Creates an Adwaita-style SpinButton control.
 * @param {object} [options={}] - Configuration options.
 * @param {number} [options.value=0] - Initial value.
 * @param {number} [options.min=0] - Minimum value.
 * @param {number} [options.max=100] - Maximum value.
 * @param {number} [options.step=1] - Step increment/decrement.
 * @param {function(number)} [options.onValueChanged] - Callback when the value changes.
 * @param {boolean} [options.disabled=false] - If true, disables the control.
 * @returns {HTMLDivElement} The created spin button element.
 */
function createAdwSpinButton(options = {}) {
  const opts = options || {};
  const spinButtonWrapper = document.createElement('div');
  spinButtonWrapper.classList.add('adw-spin-button');
  if (opts.disabled) {
    spinButtonWrapper.classList.add('disabled');
  }

  const currentValue = typeof opts.value === 'number' ? opts.value : 0;
  const min = typeof opts.min === 'number' ? opts.min : 0;
  const max = typeof opts.max === 'number' ? opts.max : 100;
  const step = typeof opts.step === 'number' ? opts.step : 1;

  const entry = createAdwEntry({
    value: currentValue.toString(),
    disabled: opts.disabled,
    // Consider making the input type="number" and handling its native spinners
    // or using inputmode="numeric" for better mobile experience.
    // For now, a text input with manual validation.
    onInput: (event) => {
      let numValue = parseFloat(event.target.value);
      if (isNaN(numValue)) numValue = min; // Or keep old value / show error
      numValue = Math.max(min, Math.min(max, numValue));
      event.target.value = numValue; // Correct input if invalid
      if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(numValue);
      }
    }
  });
  entry.classList.add('adw-spin-button-entry');
  // Restrict width of entry in a spin button
  entry.style.maxWidth = '80px'; // Adjust as needed
  entry.setAttribute('aria-live', 'assertive');
  entry.setAttribute('aria-valuenow', currentValue);
  if (typeof opts.min === 'number') entry.setAttribute('aria-valuemin', min);
  if (typeof opts.max === 'number') entry.setAttribute('aria-valuemax', max);


  const btnContainer = document.createElement('div');
  btnContainer.classList.add('adw-spin-button-buttons');

  const downButton = createAdwButton('', { // Icon handled by SCSS
    icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 6h8L8 11z"/></svg>', // Simple down caret
    disabled: opts.disabled || currentValue <= min,
    flat: true,
    onClick: () => {
      let numValue = parseFloat(entry.value) - step;
      numValue = Math.max(min, numValue);
      entry.value = numValue;
      updateButtonsState(numValue);
      entry.setAttribute('aria-valuenow', numValue);
      if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(numValue);
      }
      entry.focus();
    }
  });
  downButton.classList.add('adw-spin-button-down');
  downButton.setAttribute('aria-label', 'Decrement');

  const upButton = createAdwButton('', { // Icon handled by SCSS
    icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path d="M4 10h8L8 5z"/></svg>', // Simple up caret
    disabled: opts.disabled || currentValue >= max,
    flat: true,
    onClick: () => {
      let numValue = parseFloat(entry.value) + step;
      numValue = Math.min(max, numValue);
      entry.value = numValue;
      updateButtonsState(numValue);
      entry.setAttribute('aria-valuenow', numValue);
      if (typeof opts.onValueChanged === 'function') {
        opts.onValueChanged(numValue);
      }
      entry.focus();
    }
  });
  upButton.classList.add('adw-spin-button-up');
  upButton.setAttribute('aria-label', 'Increment');

  function updateButtonsState(currentVal) {
    downButton.disabled = opts.disabled || currentVal <= min;
    upButton.disabled = opts.disabled || currentVal >= max;
  }

  updateButtonsState(currentValue);


  btnContainer.appendChild(upButton);
  btnContainer.appendChild(downButton);

  spinButtonWrapper.appendChild(entry);
  spinButtonWrapper.appendChild(btnContainer);

  // Allow keyboard up/down arrows on the entry
  entry.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if(!upButton.disabled) upButton.click();
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if(!downButton.disabled) downButton.click();
    }
  });


  return spinButtonWrapper;
}

/**
 * Creates an Adwaita-style Spin Row.
 * Displays a title, subtitle (optional), and an AdwSpinButton.
 * @param {object} [options={}] - Configuration options.
 * @param {string} options.title - The title label for the row.
 * @param {string} [options.subtitle] - Optional subtitle text.
 * @param {object} [options.spinButtonOptions={}] - Options object to pass to `Adw.createSpinButton`.
 * @param {function(number)} [options.onValueChanged] - Callback when the spin button's value changes.
 * @returns {HTMLDivElement} The created SpinRow element (which is an AdwRow).
 */
function createAdwSpinRow(options = {}) {
  const opts = options || {};
  const rowChildren = [];

  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("adw-spin-row-text-content"); // Use a specific class or generic action-row class

  const titleLabel = Adw.createLabel(opts.title || "", { htmlTag: "span" });
  titleLabel.classList.add("adw-spin-row-title"); // Or generic action-row title class
  textContentDiv.appendChild(titleLabel);

  if (opts.subtitle && typeof opts.subtitle === 'string') {
    const subtitleLabel = Adw.createLabel(opts.subtitle, { htmlTag: "span" });
    subtitleLabel.classList.add("adw-spin-row-subtitle"); // Or generic action-row subtitle
    textContentDiv.appendChild(subtitleLabel);
  }
  rowChildren.push(textContentDiv);

  const spinButtonOptions = { ...(opts.spinButtonOptions || {}) };
  if (typeof opts.onValueChanged === 'function' && !spinButtonOptions.onValueChanged) {
    spinButtonOptions.onValueChanged = opts.onValueChanged;
  }


  const spinButtonElement = createAdwSpinButton(spinButtonOptions);
  spinButtonElement.classList.add("adw-spin-row-spin-button");
  rowChildren.push(spinButtonElement);

  const spinRow = Adw.createRow({ children: rowChildren });
  spinRow.classList.add("adw-spin-row");
  // Spin rows are not typically interactive themselves; interaction is with the spinbutton.
  return spinRow;
}

/**
 * Creates an Adwaita-style Button Row.
 * A row designed to hold one or more buttons.
 * @param {object} [options={}] - Configuration options.
 * @param {HTMLElement[]} [options.buttons=[]] - An array of button elements to add to the row.
 *        Alternatively, can be an array of options objects for `Adw.createButton`.
 * @param {boolean} [options.centered=false] - If true, centers the buttons within the row.
 * @returns {HTMLDivElement} The created ButtonRow element (which is an AdwRow).
 */
function createAdwButtonRow(options = {}) {
  const opts = options || {};
  const buttonElements = (opts.buttons || []).map(btnOrOpts => {
    if (btnOrOpts instanceof Node) {
      return btnOrOpts;
    }
    return Adw.createButton(btnOrOpts.label || '', btnOrOpts);
  });

  const row = Adw.createRow({
    // AdwRow doesn't have its own children param in current sig, pass them after creation
  });
  row.classList.add("adw-button-row");

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('adw-button-row-container');
  buttonElements.forEach(btnEl => buttonContainer.appendChild(btnEl));

  row.appendChild(buttonContainer);


  if (opts.centered) {
    row.classList.add("centered");
    buttonContainer.style.justifyContent = 'center'; // Simple centering for the container
  } else {
    // Default might be start or end, depending on typical usage (e.g. form actions often end)
    buttonContainer.style.justifyContent = 'flex-end';
  }

  // Button rows are generally not interactive themselves.
  // They might not need the default padding of other AdwRows if buttons have their own.
  // row.style.paddingTop = 'var(--spacing-s)'; // Example: reduce padding
  // row.style.paddingBottom = 'var(--spacing-s)';

  return row;
}

/**
 * Creates an AdwTabButton element.
 * @param {object} [options={}] Configuration options.
 * @param {string} [options.label="Tab"] Text label for the tab.
 * @param {string} [options.iconHTML] Optional HTML string for an icon.
 * @param {string} options.pageName Unique identifier for the page this tab controls.
 * @param {boolean} [options.isActive=false] If true, tab is styled as active.
 * @param {boolean} [options.isClosable=true] If true, shows a close button.
 * @param {function(string)} [options.onSelect] Callback when tab is selected: `onSelect(pageName)`.
 * @param {function(string)} [options.onClose] Callback when close button is clicked: `onClose(pageName)`.
 * @returns {HTMLDivElement} The created tab button element.
 */
function createAdwTabButton(options = {}) {
    const opts = options || {};
    if (!opts.pageName) {
        console.error("AdwTabButton: options.pageName is required.");
        return document.createElement('div'); // Return empty div on error
    }

    const tabButton = document.createElement('div');
    tabButton.classList.add('adw-tab-button');
    tabButton.dataset.pageName = opts.pageName;
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', opts.isActive ? 'true' : 'false');
    tabButton.setAttribute('tabindex', opts.isActive ? '0' : '-1');


    if (opts.isActive) {
        tabButton.classList.add('active');
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('adw-tab-button-content-wrapper');

    if (opts.iconHTML) {
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('adw-tab-button-icon');
        iconSpan.innerHTML = opts.iconHTML; // SECURITY: Ensure trusted HTML
        contentWrapper.appendChild(iconSpan);
    }

    const labelSpan = document.createElement('span');
    labelSpan.classList.add('adw-tab-button-label');
    labelSpan.textContent = opts.label || 'Tab';
    contentWrapper.appendChild(labelSpan);
    tabButton.appendChild(contentWrapper);


    if (opts.isClosable !== false) {
        const closeButton = createAdwButton('', {
            icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:0.8em;height:0.8em;"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>', // Simple 'x'
            flat: true,
            isCircular: true,
            onClick: (e) => {
                e.stopPropagation(); // Prevent tab selection when clicking close
                if (typeof opts.onClose === 'function') {
                    opts.onClose(opts.pageName);
                }
            }
        });
        closeButton.classList.add('adw-tab-button-close');
        closeButton.setAttribute('aria-label', `Close tab ${opts.label || ''}`);
        tabButton.appendChild(closeButton);
    }

    tabButton.addEventListener('click', () => {
        if (typeof opts.onSelect === 'function') {
            opts.onSelect(opts.pageName);
        }
    });

    tabButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
             if (typeof opts.onSelect === 'function') {
                opts.onSelect(opts.pageName);
            }
        }
    });

    return tabButton;
}

/**
 * Creates an AdwTabBar element.
 * @param {object} [options={}] Configuration options.
 * @param {Array<object>} [options.tabsData=[]] Array of data objects for initial tabs.
 *        Each object: { label: string, iconHTML?: string, pageName: string, isClosable?: boolean }
 * @param {string} [options.activeTabName] The pageName of the initially active tab.
 * @param {function(string)} [options.onTabSelect] Callback when a tab is selected: `onTabSelect(pageName)`.
 * @param {function(string)} [options.onTabClose] Callback when a tab's close button is clicked: `onTabClose(pageName)`.
 * @param {boolean} [options.showNewTabButton=false] If true, shows a '+' button to request a new tab.
 * @param {function} [options.onNewTabRequested] Callback when the new tab button is clicked.
 * @returns {HTMLDivElement & { setActiveTab: function(string): void, addTab: function(object, boolean?): void, removeTab: function(string): void }}
 *          The tab bar element with methods to manage tabs.
 */
function createAdwTabBar(options = {}) {
    const opts = options || {};
    const tabBar = document.createElement('div');
    tabBar.classList.add('adw-tab-bar');
    tabBar.setAttribute('role', 'tablist');
    // Consider aria-label for the tab bar itself if it's not obvious from context.

    const tabButtonContainer = document.createElement('div');
    tabButtonContainer.classList.add('adw-tab-bar-button-container');
    tabBar.appendChild(tabButtonContainer);

    let currentActiveTabName = opts.activeTabName;

    function _updateTabStates(newActivePageName) {
        currentActiveTabName = newActivePageName;
        Array.from(tabButtonContainer.children).forEach(btn => {
            const isActive = btn.dataset.pageName === currentActiveTabName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });
    }

    function _handleTabSelect(pageName) {
        _updateTabStates(pageName);
        if (typeof opts.onTabSelect === 'function') {
            opts.onTabSelect(pageName);
        }
    }

    function _handleTabClose(pageName) {
        if (typeof opts.onTabClose === 'function') {
            opts.onTabClose(pageName);
            // The coordinator (AdwTabView) will be responsible for actually removing the tab
            // and deciding which tab to activate next.
        }
    }

    tabBar.addTab = (tabData, makeActive = false) => {
        const tabButton = createAdwTabButton({
            label: tabData.label,
            iconHTML: tabData.iconHTML,
            pageName: tabData.pageName,
            isClosable: tabData.isClosable,
            isActive: makeActive || (tabData.pageName === currentActiveTabName),
            onSelect: _handleTabSelect,
            onClose: _handleTabClose
        });
        tabButtonContainer.appendChild(tabButton);
        if (makeActive) {
            _updateTabStates(tabData.pageName);
        } else if (!currentActiveTabName && tabButtonContainer.children.length === 1) {
            // If no active tab yet and this is the first one, make it active.
            _updateTabStates(tabData.pageName);
             if (typeof opts.onTabSelect === 'function') { // Also fire event for initial auto-selection
                opts.onTabSelect(tabData.pageName);
            }
        }
        return tabButton;
    };

    tabBar.removeTab = (pageName) => {
        const tabButtonToRemove = tabButtonContainer.querySelector(`.adw-tab-button[data-page-name="${pageName}"]`);
        if (tabButtonToRemove) {
            const wasActive = tabButtonToRemove.classList.contains('active');
            const siblings = Array.from(tabButtonContainer.children);
            const index = siblings.indexOf(tabButtonToRemove);
            tabButtonToRemove.remove();

            if (wasActive && tabButtonContainer.children.length > 0) {
                // Activate previous or first tab
                const newActiveIndex = Math.max(0, index -1);
                const newActiveButton = tabButtonContainer.children[newActiveIndex];
                if(newActiveButton) {
                     _handleTabSelect(newActiveButton.dataset.pageName);
                }
            } else if (tabButtonContainer.children.length === 0) {
                currentActiveTabName = null; // No tabs left
            }
        }
    };

    tabBar.setActiveTab = (pageName) => {
        // Don't fire onTabSelect here, as this is a programmatic change.
        // The expectation is that the content view will be updated by the caller.
        _updateTabStates(pageName);
    };


    (opts.tabsData || []).forEach(tabData => {
        tabBar.addTab(tabData, tabData.pageName === currentActiveTabName);
    });

    // Initialize active tab if not set by tabsData being active
    if(currentActiveTabName && tabButtonContainer.children.length > 0){
        _updateTabStates(currentActiveTabName);
    } else if (!currentActiveTabName && tabButtonContainer.children.length > 0) {
        // Default to first tab if no active one specified
        const firstTabName = tabButtonContainer.children[0].dataset.pageName;
         _updateTabStates(firstTabName);
         // No onTabSelect here, this is initial state. Coordinator will handle initial content.
    }


    if (opts.showNewTabButton) {
        const newTabButton = createAdwButton('', {
            icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>', // Plus icon
            flat: true,
            isCircular: true,
            onClick: () => {
                if (typeof opts.onNewTabRequested === 'function') {
                    opts.onNewTabRequested();
                }
            }
        });
        newTabButton.classList.add('adw-tab-bar-new-tab-button');
        newTabButton.setAttribute('aria-label', 'New tab');
        tabBar.appendChild(newTabButton);
    }

    // Keyboard navigation for tabs
    tabBar.addEventListener('keydown', (e) => {
        const tabs = Array.from(tabButtonContainer.querySelectorAll('.adw-tab-button'));
        const currentIndex = tabs.findIndex(tab => tab === document.activeElement);

        if (currentIndex === -1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            // If focus is on the bar itself, move to the active tab or first tab
            const activeTab = tabs.find(tab => tab.classList.contains('active')) || tabs[0];
            if (activeTab) activeTab.focus();
            e.preventDefault();
            return;
        }

        let newIndex = currentIndex;
        if (e.key === 'ArrowRight') {
            newIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
            newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            newIndex = 0;
        } else if (e.key === 'End') {
            newIndex = tabs.length - 1;
        } else {
            return; // Not a navigation key we handle here
        }

        e.preventDefault();
        if (tabs[newIndex]) {
            tabs[newIndex].focus();
            // Optionally, could also select the tab on arrow navigation if desired (like some native tabs)
            // _handleTabSelect(tabs[newIndex].dataset.pageName);
        }
    });


    return tabBar;
}

/**
 * Creates an AdwTabPage container.
 * @param {object} [options={}] Configuration options.
 * @param {HTMLElement} options.content The main content element for this tab page.
 * @param {string} options.pageName Unique identifier for this page.
 * @returns {HTMLDivElement} The created tab page container.
 */
function createAdwTabPage(options = {}) {
    const opts = options || {};
    if (!opts.pageName) {
        console.error("AdwTabPage: options.pageName is required.");
        return document.createElement('div');
    }
    if (!opts.content) {
        console.error("AdwTabPage: options.content is required.");
        return document.createElement('div');
    }

    const tabPage = document.createElement('div');
    tabPage.classList.add('adw-tab-page');
    tabPage.dataset.pageName = opts.pageName;
    tabPage.setAttribute('role', 'tabpanel');
    // aria-labelledby will be set by the AdwTabView to link to the tab button
    tabPage.setAttribute('tabindex', '0'); // Make page focusable for scroll, etc.
    tabPage.style.display = 'none'; // Initially hidden

    if (opts.content instanceof Node) {
        tabPage.appendChild(opts.content);
    } else {
        // Should ideally be a node, but as a fallback:
        const contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = opts.content; // SECURITY: Ensure trusted HTML
        tabPage.appendChild(contentWrapper);
    }
    return tabPage;
}

/**
 * Creates an AdwTabView element, which coordinates an AdwTabBar and AdwTabPages.
 * @param {object} [options={}] Configuration options.
 * @param {Array<{name: string, title: string, content: HTMLElement, isClosable?: boolean}>} [options.pages=[]]
 *        Initial pages data. `name` is unique ID, `title` for tab button, `content` is the page's HTMLElement.
 * @param {string} [options.activePageName] Name of the page to be initially active.
 * @param {boolean} [options.showNewTabButton=false] If true, tab bar shows a '+' button.
 * @param {function} [options.onNewTabRequested] Callback when new tab button is clicked.
 *        This callback should typically call `adwTabView.addPage(...)`.
 * @param {function(string)} [options.onPageChanged] Callback when active page changes: `onPageChanged(pageName)`.
 * @param {function(string): boolean} [options.onBeforePageClose] Optional callback before a page is closed.
 *        `onBeforePageClose(pageName)`. Return false to prevent closing.
 * @param {function(string)} [options.onPageClosed] Callback after a page is closed: `onPageClosed(pageName)`.
 * @returns {HTMLDivElement & { addPage: function(pageData, boolean?): void, removePage: function(string): void, setActivePage: function(string): void, getActivePageName: function(): string|null }}
 *          The tab view element with methods to manage pages.
 */
function createAdwTabView(options = {}) {
    const opts = options || {};
    const tabView = document.createElement('div');
    tabView.classList.add('adw-tab-view');

    const pagesContainer = document.createElement('div');
    pagesContainer.classList.add('adw-tab-view-pages-container');

    let pageMap = new Map(); // pageName -> { button: HTMLElement, page: HTMLElement }
    let currentActivePageName = opts.activePageName || null;

    const tabBar = createAdwTabBar({
        activeTabName: currentActivePageName,
        showNewTabButton: opts.showNewTabButton,
        onNewTabRequested: () => {
            if (typeof opts.onNewTabRequested === 'function') {
                opts.onNewTabRequested(); // The app should then call adwTabView.addPage()
            }
        },
        onTabSelect: (pageName) => {
            tabView.setActivePage(pageName, false); // Don't re-fire onPageChanged from here if already active
        },
        onTabClose: (pageName) => {
            if (typeof opts.onBeforePageClose === 'function') {
                if (opts.onBeforePageClose(pageName) === false) {
                    return; // Prevent close
                }
            }
            tabView.removePage(pageName);
            if (typeof opts.onPageClosed === 'function') {
                opts.onPageClosed(pageName);
            }
        }
    });

    tabView.appendChild(tabBar);
    tabView.appendChild(pagesContainer);

    tabView.addPage = (pageData, makeActive = false) => {
        if (!pageData || !pageData.name || !pageData.title || !pageData.content) {
            console.error("AdwTabView.addPage: Invalid pageData.", pageData);
            return;
        }
        if (pageMap.has(pageData.name)) {
            console.warn(`AdwTabView: Page with name "${pageData.name}" already exists.`);
            tabView.setActivePage(pageData.name); // Just activate if it exists
            return;
        }

        const tabPage = createAdwTabPage({ content: pageData.content, pageName: pageData.name });
        pagesContainer.appendChild(tabPage);

        const tabButton = tabBar.addTab({
            label: pageData.title,
            pageName: pageData.name,
            isClosable: pageData.isClosable
        }, makeActive);

        // Link tab button and tab panel for ARIA
        const buttonId = tabButton.id || adwGenerateId('adw-tab-btn');
        const panelId = tabPage.id || adwGenerateId('adw-tab-panel');
        tabButton.id = buttonId;
        tabPage.id = panelId;
        tabButton.setAttribute('aria-controls', panelId);
        tabPage.setAttribute('aria-labelledby', buttonId);

        pageMap.set(pageData.name, { button: tabButton, page: tabPage });

        if (makeActive || pageMap.size === 1) {
            tabView.setActivePage(pageData.name);
        } else if(currentActivePageName) {
            // Ensure current active tab is still visibly active if new tab not made active
            tabBar.setActiveTab(currentActivePageName);
        }
    };

    tabView.removePage = (pageName) => {
        if (pageMap.has(pageName)) {
            const { page } = pageMap.get(pageName);
            page.remove();
            pageMap.delete(pageName);
            tabBar.removeTab(pageName); // This will handle activating another tab if needed

            // Update currentActivePageName from tabBar as it might have changed
            const activeTabButton = tabBar.querySelector('.adw-tab-button.active');
            const newActivePageName = activeTabButton ? activeTabButton.dataset.pageName : null;

            if (newActivePageName !== currentActivePageName) {
                 currentActivePageName = newActivePageName;
                 // Show the new active page (if any)
                 pageMap.forEach((p, name) => {
                    p.page.style.display = (name === currentActivePageName) ? '' : 'none';
                 });
                 if (typeof opts.onPageChanged === 'function' && currentActivePageName) {
                    opts.onPageChanged(currentActivePageName);
                 }
            } else if (!newActivePageName && currentActivePageName) {
                // No tabs left, or no active tab decided by tabBar
                currentActivePageName = null;
            }
        }
    };

    tabView.setActivePage = (pageName, fireEvent = true) => {
        if (pageMap.has(pageName)) {
            const oldActivePageName = currentActivePageName;
            currentActivePageName = pageName;

            tabBar.setActiveTab(pageName); // Update tab bar's visual state

            pageMap.forEach((p, name) => {
                p.page.style.display = (name === pageName) ? '' : 'none';
            });

            if (fireEvent && typeof opts.onPageChanged === 'function' && oldActivePageName !== pageName) {
                opts.onPageChanged(pageName);
            }
        }
    };

    tabView.getActivePageName = () => currentActivePageName;

    // Initialize with provided pages
    (opts.pages || []).forEach(pageData => {
        tabView.addPage(pageData, pageData.name === currentActivePageName);
    });

    // If activePageName was provided but didn't match any initial pages,
    // or if no activePageName and there are pages, ensure first one is active.
    if (currentActivePageName && !pageMap.has(currentActivePageName) && pageMap.size > 0) {
        currentActivePageName = pageMap.keys().next().value;
    }
    if (!currentActivePageName && pageMap.size > 0) {
        currentActivePageName = pageMap.keys().next().value;
    }
    if (currentActivePageName) {
        // This final setActivePage ensures the correct page content is shown initially
        // and fires the onPageChanged if it's the first active setting.
        tabView.setActivePage(currentActivePageName, true);
    }


    return tabView;
}

/**
 * Creates an AdwNavigationView element.
 * Manages a stack of views with navigation (push/pop) and an updating HeaderBar.
 * @param {object} [options={}] Configuration options.
 * @param {Array<{name: string, element: HTMLElement, header?: {title?: string, subtitle?: string, start?: HTMLElement[], end?: HTMLElement[]}}>} [options.initialPages=[]]
 *        Initial pages to add to the stack. The first page is shown.
 * @returns {HTMLDivElement & { push: function(pageData): void, pop: function(): void, getVisiblePageName: function(): string|null }}
 *          The navigation view element.
 */
function createAdwNavigationView(options = {}) {
    const opts = options || {};
    const navigationView = document.createElement('div');
    navigationView.classList.add('adw-navigation-view');

    const headerBar = createAdwHeaderBar({ title: "" }); // Initial empty title
    navigationView.appendChild(headerBar);

    const pagesContainer = document.createElement('div');
    pagesContainer.classList.add('adw-navigation-view-pages-container');
    navigationView.appendChild(pagesContainer);

    const pageStack = []; // Stores { name: string, element: HTMLElement, header?: object }

    function _updateHeaderBar() {
        if (pageStack.length === 0) {
            headerBar.updateTitleSubtitle(); // Clear title
            headerBar.setStartWidgets([]);
            headerBar.setEndWidgets([]);
            return;
        }

        const currentPageData = pageStack[pageStack.length - 1];
        const headerData = currentPageData.header || {};

        headerBar.updateTitleSubtitle(headerData.title || currentPageData.name, headerData.subtitle);

        const startWidgets = [];
        if (pageStack.length > 1) { // Show back button if not the root page
            const backButton = createAdwButton('', {
                icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/></svg>', // Left arrow
                flat: true,
                onClick: () => navigationView.pop()
            });
            backButton.setAttribute('aria-label', 'Back');
            startWidgets.push(backButton);
        }
        if (headerData.start && Array.isArray(headerData.start)) {
            startWidgets.push(...headerData.start);
        }
        headerBar.setStartWidgets(startWidgets);

        headerBar.setEndWidgets(headerData.end || []);
    }

    // Monkey-patch headerbar if it doesn't have these methods (from createAdwHeaderBar factory)
    if(!headerBar.updateTitleSubtitle) {
        headerBar.updateTitleSubtitle = (title, subtitle) => {
            const titleEl = headerBar.querySelector('.adw-header-bar-title');
            const subtitleEl = headerBar.querySelector('.adw-header-bar-subtitle');
            if (titleEl) titleEl.textContent = title || '';
            if (subtitleEl) {
                subtitleEl.textContent = subtitle || '';
                subtitleEl.style.display = subtitle ? '' : 'none';
            } else if (subtitle && titleEl && titleEl.parentElement) {
                const newSubtitleEl = document.createElement("h2");
                newSubtitleEl.classList.add("adw-header-bar-subtitle");
                newSubtitleEl.textContent = subtitle;
                titleEl.parentElement.appendChild(newSubtitleEl); // Append to center box
            }
        };
    }
    if(!headerBar.setStartWidgets) {
        headerBar.setStartWidgets = (widgets) => {
            const startBox = headerBar.querySelector('.adw-header-bar-start');
            if(startBox) {
                startBox.innerHTML = ''; // Clear
                widgets.forEach(w => startBox.appendChild(w));
            }
        };
    }
     if(!headerBar.setEndWidgets) {
        headerBar.setEndWidgets = (widgets) => {
            const endBox = headerBar.querySelector('.adw-header-bar-end');
            if(endBox) {
                endBox.innerHTML = ''; // Clear
                widgets.forEach(w => endBox.appendChild(w));
            }
        };
    }


    navigationView.push = (pageData) => {
        if (!pageData || !pageData.name || !pageData.element) {
            console.error("AdwNavigationView.push: Invalid pageData. Requires name and element.", pageData);
            return;
        }

        if (pageStack.length > 0) {
            const currentPage = pageStack[pageStack.length - 1];
            currentPage.element.classList.remove('adw-navigation-page-active');
            currentPage.element.classList.add('adw-navigation-page-exiting-left'); // Slide out left
             // No timeout needed for display:none if using animations that hide it
        }

        pageData.element.classList.add('adw-navigation-page');
        pageData.element.style.display = ''; // Make sure it's not display:none
        pagesContainer.appendChild(pageData.element);

        // Force reflow before adding animation class
        void pageData.element.offsetWidth;
        pageData.element.classList.add('adw-navigation-page-entering-right'); // Slide in from right
        pageData.element.classList.add('adw-navigation-page-active');


        pageStack.push(pageData);
        _updateHeaderBar();

        // Remove animation classes after transition (assuming 300ms)
        setTimeout(() => {
            if (pageStack.length > 1) {
                 const prevPage = pageStack[pageStack.length - 2];
                 if(prevPage) prevPage.element.classList.remove('adw-navigation-page-exiting-left');
            }
            pageData.element.classList.remove('adw-navigation-page-entering-right');
        }, 300);

        navigationView.dispatchEvent(new CustomEvent('pushed', {detail: {pageName: pageData.name}}));
    };

    navigationView.pop = () => {
        if (pageStack.length <= 1) return;

        const poppedPageData = pageStack.pop();
        poppedPageData.element.classList.remove('adw-navigation-page-active');
        poppedPageData.element.classList.add('adw-navigation-page-exiting-right'); // Slide out right

        if (pageStack.length > 0) {
            const newCurrentPageData = pageStack[pageStack.length - 1];
            newCurrentPageData.element.style.display = ''; // Make sure it's visible
            newCurrentPageData.element.classList.remove('adw-navigation-page-exiting-left'); // Remove if it was set
            newCurrentPageData.element.classList.add('adw-navigation-page-entering-left'); // Slide in from left
            newCurrentPageData.element.classList.add('adw-navigation-page-active');

            setTimeout(() => {
                poppedPageData.element.remove();
                newCurrentPageData.element.classList.remove('adw-navigation-page-entering-left');
            }, 300);
        } else { // Should not happen if length <= 1 check is correct
             setTimeout(() => { poppedPageData.element.remove(); }, 300);
        }
        _updateHeaderBar();

        navigationView.dispatchEvent(new CustomEvent('popped', {detail: {pageName: poppedPageData.name}}));
    };

    navigationView.getVisiblePageName = () => {
        return pageStack.length > 0 ? pageStack[pageStack.length - 1].name : null;
    };

    // Initialize with initial pages
    (opts.initialPages || []).forEach((pageData, index) => {
        pageData.element.classList.add('adw-navigation-page');
        pagesContainer.appendChild(pageData.element);
        pageStack.push(pageData);
        if (index === 0) {
            pageData.element.classList.add('adw-navigation-page-active');
            pageData.element.style.display = '';
        } else {
            pageData.element.style.display = 'none';
        }
    });
    if(pageStack.length > 0){
        _updateHeaderBar();
    }


    return navigationView;
}

/**
 * Creates an AdwBin container.
 * A simple container that holds a single child.
 * @param {object} [options={}] Configuration options.
 * @param {HTMLElement} [options.child] The single child element.
 * @returns {HTMLDivElement} The created bin element.
 */
function createAdwBin(options = {}) {
    const opts = options || {};
    const bin = document.createElement('div');
    bin.classList.add('adw-bin');

    if (opts.child instanceof Node) {
        bin.appendChild(opts.child);
    } else if (opts.child) {
        console.warn("AdwBin: options.child was provided but is not a valid DOM Node. It will be ignored.");
    }

    // Alignment options would typically be handled by how the bin itself is placed
    // within a parent flex or grid container, or by applying utility classes directly
    // to the bin from outside. Implementing generic vertical/horizontal alignment
    // that works in all contexts for the child *inside* the bin is complex.
    // For now, AdwBin is just a simple single-child div.

    return bin;
}

/**
 * Creates an AdwWrapBox container.
 * Arranges children in a line, wrapping to new lines as needed.
 * @param {object} [options={}] Configuration options.
 * @param {HTMLElement[]} [options.children=[]] Child elements.
 * @param {"horizontal"|"vertical"} [options.orientation="horizontal"] Main layout direction.
 * @param {string|number} [options.spacing] Gap between items (maps to 'gap'). E.g., '12px' or 12.
 * @param {string|number} [options.lineSpacing] Gap between lines (maps to 'row-gap').
 * @param {"start"|"center"|"end"|"stretch"} [options.align="start"] align-items (cross-axis alignment).
 * @param {"start"|"center"|"end"|"between"|"around"|"evenly"} [options.justify="start"] justify-content (main-axis alignment within a line).
 * @returns {HTMLDivElement} The created wrap box element.
 */
function createAdwWrapBox(options = {}) {
    const opts = options || {};
    const wrapBox = document.createElement('div');
    wrapBox.classList.add('adw-wrap-box');

    wrapBox.style.display = 'flex';
    wrapBox.style.flexWrap = 'wrap';

    if (opts.orientation === 'vertical') {
        wrapBox.style.flexDirection = 'column';
        // In vertical wrap, 'wrap' means items will form new columns.
        // Height constraint on the wrapBox would be needed to see wrapping.
    } else {
        wrapBox.style.flexDirection = 'row'; // Default
    }

    let gapValue = "var(--spacing-m)"; // Default gap
    if (typeof opts.spacing === 'number') {
        gapValue = `${opts.spacing}px`;
    } else if (typeof opts.spacing === 'string') {
        gapValue = opts.spacing;
    }

    let rowGapValue = gapValue;
    if (typeof opts.lineSpacing === 'number') {
        rowGapValue = `${opts.lineSpacing}px`;
    } else if (typeof opts.lineSpacing === 'string') {
        rowGapValue = opts.lineSpacing;
    }

    // If lineSpacing is different from spacing, use row-gap and column-gap
    if (rowGapValue !== gapValue) {
        wrapBox.style.rowGap = rowGapValue;
        wrapBox.style.columnGap = gapValue; // column-gap takes the main spacing value
    } else {
        wrapBox.style.gap = gapValue; // Uniform gap
    }

    const flexAlignMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        stretch: 'stretch'
    };
    wrapBox.style.alignItems = flexAlignMap[opts.align] || flexAlignMap.start;

    const flexJustifyMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        between: 'space-between',
        around: 'space-around',
        evenly: 'space-evenly'
    };
    wrapBox.style.justifyContent = flexJustifyMap[opts.justify] || flexJustifyMap.start;

    // align-content for wrapped lines (default is stretch)
    // wrapBox.style.alignContent = flexAlignMap[opts.align] || flexAlignMap.start; // Can be different from align-items

    (opts.children || []).forEach(child => {
        if (child instanceof Node) {
            wrapBox.appendChild(child);
        }
    });

    return wrapBox;
}

/**
 * Creates an AdwClamp container.
 * Constrains its child's width to a maximum size and centers it.
 * @param {object} [options={}] Configuration options.
 * @param {HTMLElement} [options.child] The single child element.
 * @param {string} [options.maximumSize="80ch"] The maximum width for the child.
 * @param {boolean} [options.isScrollable=false] If true, allows content to scroll.
 * @returns {HTMLDivElement} The created clamp element.
 */
function createAdwClamp(options = {}) {
    const opts = options || {};
    const clamp = document.createElement('div');
    clamp.classList.add('adw-clamp');

    // An inner wrapper to apply max-width and centering easily
    const innerWrapper = document.createElement('div');
    innerWrapper.classList.add('adw-clamp-child-wrapper');
    innerWrapper.style.maxWidth = opts.maximumSize || '80ch'; // Default to a reasonable character measure

    // Centering the innerWrapper within the clamp container
    // This can be done if clamp itself is display:flex, justify-content:center
    // or if innerWrapper has margin: auto and clamp is block
    clamp.style.display = 'flex'; // Using flex on the clamp itself
    clamp.style.justifyContent = 'center'; // Center the wrapper
    // innerWrapper.style.marginLeft = 'auto'; // Alternative for block parent
    // innerWrapper.style.marginRight = 'auto';


    if (opts.child instanceof Node) {
        innerWrapper.appendChild(opts.child);
    } else if (opts.child) {
        console.warn("AdwClamp: options.child was provided but is not a valid DOM Node.");
    }
    clamp.appendChild(innerWrapper);

    if (opts.isScrollable) {
        clamp.classList.add('scrollable');
        // For scrollable clamp, the clamp itself (outer element) should handle scrolling
        // if its content (the wrapper or child) overflows.
        // The inner wrapper still dictates the max-width of the content flow.
        clamp.style.overflowX = 'hidden'; // Typically clamp scrollable is for vertical scroll
        clamp.style.overflowY = 'auto';
        // The inner wrapper should not have overflow itself, it sets width.
        // Ensure the clamp itself can have a defined height or stretches to fill.
        innerWrapper.style.width = '100%'; // Allow wrapper to take full width of scroll area if needed
    }

    return clamp;
}

/**
 * Creates an AdwBreakpointBin container.
 * Shows one of its children based on width breakpoints.
 * @param {object} [options={}] Configuration options.
 * @param {Array<{name: string, element: HTMLElement, condition: string|number}>} options.children
 *        Array of child objects. `condition` can be a media query like string (e.g., "min-width: 600px")
 *        or a number (interpreted as min-width in pixels).
 * @param {string} [options.defaultChildName] Name of the child to show if no conditions match. (Usually the smallest)
 * @returns {HTMLDivElement & { updateVisibility: function(): void }} The created breakpoint bin element.
 */
function createAdwBreakpointBin(options = {}) {
    const opts = options || {};
    const breakpointBin = document.createElement('div');
    breakpointBin.classList.add('adw-breakpoint-bin');
    // BreakpointBin itself doesn't usually have visual styling, it's a controller.
    // It needs to be in the DOM and have a width to be observed.

    let sortedChildren = [];
    if (Array.isArray(opts.children)) {
        // Children should have {name, element, condition (number for min-width, or string for media query)}
        // Sort by condition (ascending for min-width numbers)
        sortedChildren = opts.children.map(c => {
            let minWidth = 0;
            if (typeof c.condition === 'number') {
                minWidth = c.condition;
            } else if (typeof c.condition === 'string') {
                const match = c.condition.match(/min-width:\s*(\d+)(px)?/i);
                if (match && match[1]) {
                    minWidth = parseInt(match[1], 10);
                } else {
                    console.warn(`AdwBreakpointBin: Could not parse condition "${c.condition}" for child "${c.name}". Treating as 0.`);
                }
            }
            return { ...c, _minWidth: minWidth };
        }).sort((a, b) => a._minWidth - b._minWidth);
    }

    let defaultChild = null;
    if(opts.defaultChildName){
        defaultChild = sortedChildren.find(c => c.name === opts.defaultChildName)?.element;
    }
    if(!defaultChild && sortedChildren.length > 0) {
        defaultChild = sortedChildren[0].element; // Fallback to the 'smallest' condition child
    }

    sortedChildren.forEach(childData => {
        if (childData.element instanceof Node) {
            childData.element.style.display = 'none'; // Initially hide all
            breakpointBin.appendChild(childData.element);
        }
    });
    if(defaultChild) defaultChild.style.display = '';


    let currentVisibleChild = defaultChild;

    breakpointBin.updateVisibility = () => {
        const containerWidth = breakpointBin.offsetWidth;
        let newVisibleChild = defaultChild;

        // Iterate from largest condition to smallest
        for (let i = sortedChildren.length - 1; i >= 0; i--) {
            const childData = sortedChildren[i];
            if (containerWidth >= childData._minWidth) {
                newVisibleChild = childData.element;
                break;
            }
        }

        if (currentVisibleChild !== newVisibleChild) {
            if (currentVisibleChild) currentVisibleChild.style.display = 'none';
            if (newVisibleChild) newVisibleChild.style.display = '';
            currentVisibleChild = newVisibleChild;
            // Dispatch an event if needed:
            // breakpointBin.dispatchEvent(new CustomEvent('child-changed', { detail: { visibleChildName: newVisibleChild?.dataset.name } }));
        }
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            breakpointBin.updateVisibility();
        });
        // Start observing when the element is connected to the DOM
        // This is typically handled by the web component's connectedCallback.
        // For factory usage, the user would need to ensure it's in DOM then call observe.
        // To make it more self-contained for factory:
        // Check if in DOM, if so, observe. If not, use MutationObserver to wait.
        // This adds complexity. Simpler: user calls an explicit 'observe' method.
        // Or, we rely on a web component wrapper.
        // For now, let's assume it will be observed by a web component or manually.
    } else {
        console.warn("AdwBreakpointBin: ResizeObserver not supported. Breakpoints will not update on resize.");
        // Could fall back to window resize listener, but that's less accurate.
    }

    // Add a method to start observing, to be called by WC or user.
    breakpointBin.startObserving = () => {
        if (resizeObserver && !breakpointBin._isObserving) {
            resizeObserver.observe(breakpointBin);
            breakpointBin._isObserving = true;
        }
    };
    breakpointBin.stopObserving = () => {
         if (resizeObserver && breakpointBin._isObserving) {
            resizeObserver.unobserve(breakpointBin);
            breakpointBin._isObserving = false;
        }
    };

    // Initial visibility update
    // Needs to be deferred slightly if the element isn't in the DOM yet to get offsetWidth
    // setTimeout(() => breakpointBin.updateVisibility(), 0);
    // Better handled by connectedCallback in a Web Component.

    return breakpointBin;
}

/**
 * Creates an AdwToolbarView layout container.
 * @param {object} [options={}] Configuration options.
 * @param {HTMLElement} [options.content] The main content element.
 * @param {HTMLElement} [options.topBar] Optional element for the top bar.
 * @param {HTMLElement} [options.bottomBar] Optional element for the bottom bar.
 * @param {boolean} [options.topBarRevealed=true] Initial visibility of the top bar.
 * @param {boolean} [options.bottomBarRevealed=true] Initial visibility of the bottom bar.
 * @returns {HTMLDivElement & { setTopBar: Function, setBottomBar: Function, showTopBar: Function, hideTopBar: Function, showBottomBar: Function, hideBottomBar: Function }}
 *          The created toolbar view element with control methods.
 */
function createAdwToolbarView(options = {}) {
    const opts = options || {};
    const toolbarView = document.createElement('div');
    toolbarView.classList.add('adw-toolbar-view');

    const topBarSlot = document.createElement('div');
    topBarSlot.classList.add('adw-toolbar-view-top-bar');
    if (opts.topBar instanceof Node) {
        topBarSlot.appendChild(opts.topBar);
    }
    topBarSlot.style.display = (opts.topBarRevealed !== false) ? '' : 'none';

    const contentSlot = document.createElement('div');
    contentSlot.classList.add('adw-toolbar-view-content');
    if (opts.content instanceof Node) {
        contentSlot.appendChild(opts.content);
    }

    const bottomBarSlot = document.createElement('div');
    bottomBarSlot.classList.add('adw-toolbar-view-bottom-bar');
    if (opts.bottomBar instanceof Node) {
        bottomBarSlot.appendChild(opts.bottomBar);
    }
    bottomBarSlot.style.display = (opts.bottomBarRevealed !== false) ? '' : 'none';

    toolbarView.appendChild(topBarSlot);
    toolbarView.appendChild(contentSlot);
    toolbarView.appendChild(bottomBarSlot);

    toolbarView.setTopBar = (element) => {
        topBarSlot.innerHTML = '';
        if (element instanceof Node) topBarSlot.appendChild(element);
        topBarSlot.style.display = (element && opts.topBarRevealed !== false) ? '' : 'none';
    };
    toolbarView.setBottomBar = (element) => {
        bottomBarSlot.innerHTML = '';
        if (element instanceof Node) bottomBarSlot.appendChild(element);
        bottomBarSlot.style.display = (element && opts.bottomBarRevealed !== false) ? '' : 'none';
    };
    toolbarView.showTopBar = () => {
        opts.topBarRevealed = true;
        if (topBarSlot.firstChild) topBarSlot.style.display = '';
    };
    toolbarView.hideTopBar = () => {
        opts.topBarRevealed = false;
        topBarSlot.style.display = 'none';
    };
    toolbarView.showBottomBar = () => {
        opts.bottomBarRevealed = true;
        if (bottomBarSlot.firstChild) bottomBarSlot.style.display = '';
    };
    toolbarView.hideBottomBar = () => {
        opts.bottomBarRevealed = false;
        bottomBarSlot.style.display = 'none';
    };

    // Add accessors for revealed state if needed
    Object.defineProperty(toolbarView, 'topBarRevealed', {
        get: () => opts.topBarRevealed !== false && topBarSlot.style.display !== 'none',
        set: (value) => value ? toolbarView.showTopBar() : toolbarView.hideTopBar()
    });
     Object.defineProperty(toolbarView, 'bottomBarRevealed', {
        get: () => opts.bottomBarRevealed !== false && bottomBarSlot.style.display !== 'none',
        set: (value) => value ? toolbarView.showBottomBar() : toolbarView.hideBottomBar()
    });


    return toolbarView;
}

// All other Adw.* factory functions follow...
// ... (createAdwProgressBar, createAdwCheckbox, etc.) ...

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
  createAdwBanner: createAdwBanner, // Note: createAdwBanner vs createBanner
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
  createAdwPasswordEntryRow: createAdwPasswordEntryRow,
  createExpanderRow: createAdwExpanderRow,
  createComboRow: createAdwComboRow,
  createAvatar: createAdwAvatar,
  createViewSwitcher: createAdwViewSwitcher,
  createFlap: createAdwFlap,
  createSpinner: createAdwSpinner,
  createStatusPage: createAdwStatusPage,
  createSplitButton: createAdwSplitButton,
  createAlertDialog: createAdwAlertDialog,
  createAboutDialog: createAdwAboutDialog,
  createPreferencesDialog: createAdwPreferencesDialog,
  createSpinButton: createAdwSpinButton,
  createSpinRow: createAdwSpinRow,
  createButtonRow: createAdwButtonRow,
  createTabButton: createAdwTabButton,
  createTabBar: createAdwTabBar,
  createTabPage: createAdwTabPage,
  createTabView: createAdwTabView,
  createNavigationView: createAdwNavigationView,
  createBottomSheet: createAdwBottomSheet,
  createBin: createAdwBin,
  createWrapBox: createAdwWrapBox,
  createClamp: createAdwClamp,
  createBreakpointBin: createAdwBreakpointBin,
  createToolbarView: createAdwToolbarView
};

window.addEventListener("DOMContentLoaded", loadSavedTheme);

// All Web Component class definitions follow...
// ... (AdwButton, AdwBox, etc.) ...

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

class AdwBox extends HTMLElement {
    static get observedAttributes() {
        return ['orientation', 'spacing', 'align', 'justify', 'fill-children'];
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
                const camelCaseAttr = attr.replace(/-([a-z])/g, g => g[1].toUpperCase());
                if (attr === 'fill-children') {
                     options[camelCaseAttr] = value !== null && value !== 'false';
                } else {
                    options[camelCaseAttr] = value;
                }
            }
        });
        const boxElement = Adw.createBox(options);
        boxElement.appendChild(document.createElement('slot'));
        this.shadowRoot.appendChild(boxElement);
    }
}


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

class AdwViewSwitcher extends HTMLElement {
    static get observedAttributes() { return ['label', 'active-view', 'is-inline']; }
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
            views: views,
            label: this.getAttribute('label') || undefined,
            activeViewName: this.getAttribute('active-view') || (views.length > 0 ? views[0].name : undefined),
            isInline: this.hasAttribute('is-inline'),
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

class AdwAlertDialog extends HTMLElement {
    static get observedAttributes() { return ['heading', 'body', 'open', 'close-on-backdrop-click']; }

    constructor() {
        super();
        // No shadow DOM for dialogs that are modal and globally positioned.
        // The factory function handles DOM creation and appending to body.
        this._alertDialogInstance = null;
        this._choices = []; // For declarative choices via slotted buttons
    }

    connectedCallback() {
        // Parse declarative choices first
        this._parseChoices();
        // Then render/build the dialog instance
        this._render();
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    disconnectedCallback() {
        if (this._alertDialogInstance) {
            this._alertDialogInstance.close(); // Ensure cleanup
            // The dialog DOM is removed by its own close mechanism
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // Re-render if other attributes change, ensuring the dialog instance is updated
            // This might involve closing and reopening if the dialog is already open,
            // or simply updating the instance if it's not yet shown.
            if (this._alertDialogInstance && this.hasAttribute('open')) {
                // If open, and attributes change, it's complex to update live.
                // Simplest is to close, re-render, then re-open.
                this._alertDialogInstance.close();
                this._render(); // Rebuilds with new attributes
                this.open();
            } else {
                this._render(); // Rebuild if not open
            }
        }
    }

    _parseChoices() {
        this._choices = [];
        const choiceElements = this.querySelectorAll('button[slot="choice"]');
        choiceElements.forEach(btn => {
            this._choices.push({
                label: btn.textContent.trim(),
                value: btn.getAttribute('value') || btn.textContent.trim().toLowerCase(),
                style: btn.dataset.style || 'default' // e.g., data-style="suggested"
            });
        });
    }

    _render() {
        const bodyContent = this.querySelector('[slot="body-content"]');
        const options = {
            heading: this.getAttribute('heading') || undefined,
            customContent: bodyContent ? bodyContent.cloneNode(true) : undefined,
            choices: this._choices.length > 0 ? this._choices : undefined, // Use parsed choices if available
            closeOnBackdropClick: this.hasAttribute('close-on-backdrop-click') ? (this.getAttribute('close-on-backdrop-click') !== 'false') : false, // Default false for alerts
            onResponse: (value) => {
                this.dispatchEvent(new CustomEvent('response', { detail: { value } }));
                // The factory's button onClick already closes the dialog.
                // We also need to ensure the 'open' attribute is removed.
                if (this.hasAttribute('open')) {
                    this.removeAttribute('open');
                }
            }
        };

        // If AdwAlertDialog's first arg is body string, get it from attribute or slotted text
        let bodyStr = this.getAttribute('body');
        if (!bodyContent && !bodyStr) {
            // Fallback to text content if no body attribute and no specific slot
            const nonChoiceSlots = Array.from(this.childNodes).filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('slot'))).map(n => n.textContent.trim()).join(' ');
            if(nonChoiceSlots.trim()) bodyStr = nonChoiceSlots.trim();
        }


        this._alertDialogInstance = Adw.createAlertDialog(bodyStr || '', options);

        // If AdwDialog's onClose is used by the factory, ensure it syncs 'open' attr
        const originalFactoryOnClose = options.onClose;
        this._alertDialogInstance.dialog.addEventListener('close', () => { // Assuming createAdwDialog's onClose is wired
             if (this.hasAttribute('open')) {
                this.removeAttribute('open');
            }
            if(typeof originalFactoryOnClose === 'function') {
                originalFactoryOnClose();
            }
             this.dispatchEvent(new CustomEvent('close')); // Dispatch standard close event
        });
    }

    open() {
        if (!this._alertDialogInstance) {
            this._render(); // Ensure instance is created
        }
        this._alertDialogInstance.open();
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
    }

    close() {
        if (this._alertDialogInstance) {
            this._alertDialogInstance.close();
        }
        // The dialog's internal onClose or the onResponse callback should handle removing the 'open' attribute.
    }
}

class AdwAboutDialog extends HTMLElement {
    static get observedAttributes() {
        return [
            'app-name', 'app-icon', 'logo', 'version', 'copyright',
            'developer-name', 'website', 'website-label', 'license-type',
            'comments', 'open'
            // More complex attributes like developers array, acknowledgements array
            // are better handled via properties or slotted content.
        ];
    }

    constructor() {
        super();
        this._aboutDialogInstance = null;
        // For slotted content
        this._slotObserver = new MutationObserver(() => this._reRenderIfOpen());
    }

    connectedCallback() {
        this._slotObserver.observe(this, { childList: true, subtree: true, characterData: true });
        this._render();
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
        if (this._aboutDialogInstance) {
            this._aboutDialogInstance.close();
        }
    }

    _reRenderIfOpen() {
        if (this.hasAttribute('open') && this._aboutDialogInstance) {
            this._aboutDialogInstance.close();
            this._render();
            this.open();
        } else {
            // If not open, just mark for re-render on next open
            this._render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            this._reRenderIfOpen();
        }
    }

    _gatherOptions() {
        const options = {};
        ['appName', 'appIcon', 'logo', 'version', 'copyright', 'developerName', 'website', 'websiteLabel', 'licenseType', 'comments']
            .forEach(key => {
                const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                if (this.hasAttribute(attrName)) {
                    options[key] = this.getAttribute(attrName);
                }
            });

        // Helper to parse slotted lists
        const getSlottedArray = (slotName) => {
            const slot = this.querySelector(`[slot="${slotName}"]`);
            if (slot) {
                if (slot.tagName === 'UL' || slot.tagName === 'OL') {
                    return Array.from(slot.children).map(li => li.textContent.trim());
                } else { // Assume a div with paragraphs or comma separated text
                    return slot.innerHTML.split(/<br\s*\/?>|\n|,/g).map(s => s.trim()).filter(Boolean);
                }
            }
            return undefined;
        };

        // Helper for acknowledgements (more complex structure)
        const getSlottedAcknowledgements = () => {
            const slot = this.querySelector('[slot="acknowledgements"]');
            if (slot) {
                const acks = [];
                // Example: <div title="Tooling">Lib Corp, Other Inc</div>
                //          <p>Special thanks to...</p>
                Array.from(slot.children).forEach(child => {
                    if (child.hasAttribute('title') && child.textContent) {
                        acks.push({title: child.getAttribute('title'), names: child.textContent.split(',').map(s=>s.trim()).filter(Boolean)});
                    } else if (child.textContent) {
                        acks.push(child.textContent.trim());
                    }
                });
                if (acks.length > 0) return acks;
            }
            return undefined;
        };


        options.developers = getSlottedArray('developers');
        options.designers = getSlottedArray('designers');
        options.documenters = getSlottedArray('documenters');
        options.artists = getSlottedArray('artists');
        options.acknowledgements = getSlottedAcknowledgements();


        const licenseTextSlot = this.querySelector('[slot="license-text"]');
        if (licenseTextSlot) options.licenseText = licenseTextSlot.textContent.trim();

        const appIconSlot = this.querySelector('[slot="app-icon"]');
        if (appIconSlot && appIconSlot.firstElementChild && appIconSlot.firstElementChild.tagName === 'IMG') {
            options.appIcon = appIconSlot.firstElementChild.src;
        }
        const logoSlot = this.querySelector('[slot="logo"]');
        if (logoSlot && logoSlot.firstElementChild && logoSlot.firstElementChild.tagName === 'IMG') {
            options.logo = logoSlot.firstElementChild.src;
        }
         const commentsSlot = this.querySelector('[slot="comments"]');
        if (commentsSlot) options.comments = commentsSlot.textContent.trim();


        // Allow main text content to be 'comments' if not explicitly slotted or attributed
        if (!options.comments && !commentsSlot) {
            const nonSlottedText = Array.from(this.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
                .map(node => node.textContent.trim())
                .join('\n');
            if (nonSlottedText) options.comments = nonSlottedText;
        }


        return options;
    }

    _render() {
        const options = this._gatherOptions();
        this._aboutDialogInstance = Adw.createAboutDialog(options);

        // Sync close event with attribute
         this._aboutDialogInstance.dialog.addEventListener('close', () => {
             if (this.hasAttribute('open')) {
                this.removeAttribute('open');
            }
            this.dispatchEvent(new CustomEvent('close'));
        });
    }

    open() {
        if (!this._aboutDialogInstance || this._slotObserver.takeRecords().length > 0) {
            // If instance doesn't exist or if slots changed before open, re-render.
             if (this._aboutDialogInstance) this._aboutDialogInstance.close(); // Close old one if exists
            this._render();
        }
        this._aboutDialogInstance.open();
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
    }

    close() {
        if (this._aboutDialogInstance) {
            this._aboutDialogInstance.close();
        }
        // 'open' attribute is removed by the dialog's internal close handling via event listener
    }
}

class AdwPreferencesDialog extends HTMLElement {
    static get observedAttributes() { return ['title', 'open', 'initial-page-name']; }

    constructor() {
        super();
        this._preferencesDialogInstance = null;
        this._slotObserver = new MutationObserver(() => this._reRenderIfOpen());
    }

    connectedCallback() {
        this._slotObserver.observe(this, { childList: true, subtree: false }); // Only direct children (pages)
        this._render();
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
        if (this._preferencesDialogInstance) {
            this._preferencesDialogInstance.close();
        }
    }

    _reRenderIfOpen() {
        if (this.hasAttribute('open') && this._preferencesDialogInstance) {
            this._preferencesDialogInstance.close();
            this._render(); // Re-collect pages from slots
            this.open();
        } else {
             // If not open, just mark for re-render on next open
            this._render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            this._reRenderIfOpen();
        }
    }

    _gatherPages() {
        const pages = [];
        Array.from(this.children).forEach((child, index) => {
            // Assuming children are adw-preferences-page or have a similar contract
            if (child.matches('adw-preferences-page') || child.classList.contains('adw-preferences-page')) {
                const pageName = child.getAttribute('name') || `page-${index}`;
                const pageTitle = child.getAttribute('title') || child.dataset.pageTitle || `Page ${index + 1}`;
                pages.push({
                    name: pageName,
                    title: pageTitle,
                    pageElement: child.cloneNode(true) // Clone to pass to factory
                });
            }
        });
        return pages;
    }

    _render() {
        const pages = this._gatherPages();
        const options = {
            title: this.getAttribute('title') || "Preferences",
            pages: pages,
            initialPageName: this.getAttribute('initial-page-name') || undefined,
            onClose: () => {
                // This is the factory's onClose, AdwDialog handles its own closing.
                // We need to sync the 'open' attribute.
                if (this.hasAttribute('open')) {
                    this.removeAttribute('open');
                }
                this.dispatchEvent(new CustomEvent('close'));
            }
        };
        this._preferencesDialogInstance = Adw.createPreferencesDialog(options);

        // The factory's onClose is passed to AdwDialog, which should handle it.
        // If not, we might need to listen on the dialog instance itself.
        // For instance, if AdwDialog emits a 'close' event on its dialog element:
        // this._preferencesDialogInstance.dialog.addEventListener('close', () => { ... });
    }

    open() {
        if (!this._preferencesDialogInstance || this._slotObserver.takeRecords().length > 0) {
            if(this._preferencesDialogInstance) this._preferencesDialogInstance.close();
            this._render();
        }
        this._preferencesDialogInstance.open();
        if (!this.hasAttribute('open')) {
            this.setAttribute('open', '');
        }
    }

    close() {
        if (this._preferencesDialogInstance) {
            this._preferencesDialogInstance.close();
        }
        // 'open' attribute should be removed by the onClose logic during _render
    }
}

class AdwSpinButton extends HTMLElement {
    static get observedAttributes() { return ['value', 'min', 'max', 'step', 'disabled']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css'; // Adjust path as needed
        this.shadowRoot.appendChild(styleLink);
        this._spinButtonElement = null;
    }

    connectedCallback() {
        this._render();
        // Forward events if necessary, or handle value property
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render(); // Re-render on attribute change
        }
    }

    _render() {
        // Clear previous content except style
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {};
        ['value', 'min', 'max', 'step'].forEach(attr => {
            if (this.hasAttribute(attr)) options[attr] = parseFloat(this.getAttribute(attr));
        });
        if (this.hasAttribute('disabled')) options.disabled = this.getAttribute('disabled') !== 'false';

        options.onValueChanged = (newValue) => {
            // Update attribute if property is changed by the underlying component
            if (this.getAttribute('value') !== String(newValue)) {
                 this.setAttribute('value', newValue);
            }
            this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: newValue } }));
        };

        this._spinButtonElement = Adw.createSpinButton(options);
        this.shadowRoot.appendChild(this._spinButtonElement);
    }

    get value() {
        return this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : (this._spinButtonElement ? parseFloat(this._spinButtonElement.querySelector('.adw-spin-button-entry').value) : 0);
    }

    set value(val) {
        const numVal = parseFloat(val);
        this.setAttribute('value', numVal);
        // this._render(); // Could re-render, or try to update existing element if more performant
        if(this._spinButtonElement) {
            const entry = this._spinButtonElement.querySelector('.adw-spin-button-entry');
            if(entry) entry.value = numVal;
            // Need to also update button states if Adw.createSpinButton's internal logic doesn't handle it from outside
        }
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        if (val) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
    }
}

class AdwSpinRow extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'subtitle', 'value', 'min', 'max', 'step', 'disabled'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._spinRowElement = null;
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

        const spinButtonOptions = {};
        ['value', 'min', 'max', 'step'].forEach(attr => {
            if (this.hasAttribute(attr)) spinButtonOptions[attr] = parseFloat(this.getAttribute(attr));
        });
         if (this.hasAttribute('disabled')) spinButtonOptions.disabled = this.getAttribute('disabled') !== 'false';


        const options = {
            title: this.getAttribute('title') || '',
            subtitle: this.getAttribute('subtitle') || undefined,
            spinButtonOptions: spinButtonOptions,
            onValueChanged: (newValue) => {
                // Update attribute if property is changed by the underlying component
                if (this.getAttribute('value') !== String(newValue)) {
                    this.setAttribute('value', newValue);
                }
                this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: newValue } }));
            }
        };

        this._spinRowElement = Adw.createSpinRow(options);
        this.shadowRoot.appendChild(this._spinRowElement);
    }

    // Value and disabled getters/setters could be added if direct property access is needed
    // For now, attributes drive the component.
    get value() {
        return this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : 0;
    }
    set value(val) {
        this.setAttribute('value', parseFloat(val));
    }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) {
        if (val) this.setAttribute('disabled', '');
        else this.removeAttribute('disabled');
    }
}

class AdwButtonRow extends HTMLElement {
    static get observedAttributes() { return ['centered']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._buttonRowElement = null;
        this._slotObserver = new MutationObserver(() => this._render());
    }

    connectedCallback() {
        this._slotObserver.observe(this, { childList: true, subtree: true }); // Observe children for adw-button etc.
        this._render();
    }
    disconnectedCallback() {
        this._slotObserver.disconnect();
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

        // Collect actual button elements from the slot
        const slottedButtons = Array.from(this.querySelectorAll('adw-button, button'));
        const buttonElements = slottedButtons.map(btn => btn.cloneNode(true));


        const options = {
            buttons: buttonElements, // Pass cloned elements to factory
            centered: this.hasAttribute('centered')
        };

        this._buttonRowElement = Adw.createButtonRow(options);

        // Instead of passing cloned buttons, the factory could accept a slot, or we directly put a slot here.
        // For simplicity with current factory, it takes elements.
        // If factory was modified to accept slot name, that would be cleaner for WC.
        // Alternative: AdwButtonRow's shadow DOM directly contains the .adw-button-row-container and a <slot>.
        // Let's try that for better WC practice.

        const rowDiv = document.createElement('div');
        rowDiv.classList.add('adw-row', 'adw-button-row');
        if(options.centered) rowDiv.classList.add('centered');

        const containerDiv = document.createElement('div');
        containerDiv.classList.add('adw-button-row-container');
        if(options.centered) containerDiv.style.justifyContent = 'center';
        else containerDiv.style.justifyContent = 'flex-end';

        const slot = document.createElement('slot');
        containerDiv.appendChild(slot);
        rowDiv.appendChild(containerDiv);

        this.shadowRoot.appendChild(rowDiv);
        this._buttonRowElement = rowDiv; // Reference to the main row div in shadow DOM
    }
}

class AdwTabButton extends HTMLElement {
    static get observedAttributes() { return ['label', 'page-name', 'active', 'closable', 'icon']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._tabButtonElement = null;
    }

    connectedCallback() {
        this._render();
        // Event listeners for select/close are on the _tabButtonElement itself,
        // they will dispatch events on this custom element.
        if (this._tabButtonElement) {
            this._tabButtonElement.addEventListener('click', (e) => {
                 // Don't dispatch 'select' if the click was on the close button part
                if (e.target.closest && e.target.closest('.adw-tab-button-close')) {
                    return;
                }
                this.dispatchEvent(new CustomEvent('select', { detail: { pageName: this.pageName }}));
            });
            const closeBtn = this._tabButtonElement.querySelector('.adw-tab-button-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Already done in factory, but good practice
                    this.dispatchEvent(new CustomEvent('close', { detail: { pageName: this.pageName }}));
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
        const iconSlot = this.querySelector('[slot="icon"]');

        const options = {
            label: this.getAttribute('label') || this.textContent.trim() || 'Tab',
            pageName: this.pageName, // Use getter
            isActive: this.active,   // Use getter
            isClosable: this.closable, // Use getter
            iconHTML: this.hasAttribute('icon') ? this.getAttribute('icon') : (iconSlot ? iconSlot.innerHTML : undefined),
            // onSelect and onClose are handled by events dispatched from the custom element
        };

        if (!options.pageName) {
            console.warn("adw-tab-button requires a 'page-name' attribute.");
            return;
        }

        this._tabButtonElement = Adw.createTabButton(options);
        this.shadowRoot.appendChild(this._tabButtonElement);
    }

    get pageName() { return this.getAttribute('page-name'); }
    set pageName(value) { this.setAttribute('page-name', value); }

    get active() { return this.hasAttribute('active'); }
    set active(value) {
        if (value) this.setAttribute('active', '');
        else this.removeAttribute('active');
    }

    get closable() { return !this.hasAttribute('closable') || this.getAttribute('closable') !== 'false'; }
    set closable(value) {
        if (value) this.removeAttribute('closable'); // Default is closable, so remove attr if true
        else this.setAttribute('closable', 'false');
    }
}

class AdwTabBar extends HTMLElement {
    static get observedAttributes() { return ['active-tab-name', 'show-new-tab-button']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
        this._tabBarElement = null; // This will be the element from the factory
        this._slotObserver = new MutationObserver(() => this._rebuildTabsFromSlotted());
    }

    connectedCallback() {
        this._render(); // Initial render with factory
        // Observe direct children for adw-tab-button additions/removals
        this._slotObserver.observe(this, { childList: true });
        this._rebuildTabsFromSlotted(); // Populate from initial slotted content

        // Listen to custom events from slotted adw-tab-buttons (if they bubble)
        // Or, more reliably, the factory-created buttons inside shadow DOM will have their own listeners.
        // The factory's onTabSelect/onTabClose will then dispatch events from this AdwTabBar.
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'active-tab-name' && this._tabBarElement) {
            this._tabBarElement.setActiveTab(newValue);
             // Ensure slotted children also reflect this
            Array.from(this.children).forEach(child => {
                if (child.matches('adw-tab-button')) {
                    child.active = child.getAttribute('page-name') === newValue;
                }
            });
        } else if (name === 'show-new-tab-button') {
             this._render();
             this._rebuildTabsFromSlotted();
        }
    }

    _rebuildTabsFromSlotted() {
        if (!this._tabBarElement) {
            // console.warn("AdwTabBar: _tabBarElement not ready for _rebuildTabsFromSlotted");
            return;
        }

        // Clear existing tabs managed by factory from the shadow DOM tabButtonContainer
        const tabButtonContainer = this._tabBarElement.querySelector('.adw-tab-bar-button-container');
        if(tabButtonContainer) {
            while(tabButtonContainer.firstChild) {
                tabButtonContainer.removeChild(tabButtonContainer.firstChild);
            }
        }


        const tabsData = Array.from(this.children)
            .filter(child => child.matches('adw-tab-button'))
            .map(tb => ({
                label: tb.getAttribute('label') || tb.textContent.trim(),
                iconHTML: tb.hasAttribute('icon') ? tb.getAttribute('icon') : (tb.querySelector('[slot="icon"]') ? tb.querySelector('[slot="icon"]').innerHTML : undefined),
                pageName: tb.getAttribute('page-name'),
                isClosable: !tb.hasAttribute('closable') || tb.getAttribute('closable') !== 'false',
            }));

        tabsData.forEach(td => {
            if(td.pageName) {
                 // The factory's addTab method handles isActive internally based on currentActiveTabName
                this._tabBarElement.addTab(td, td.pageName === this.getAttribute('active-tab-name'));
            }
        });

        const activeName = this.getAttribute('active-tab-name');
        if (activeName) {
            this._tabBarElement.setActiveTab(activeName);
        } else if (tabsData.length > 0 && tabsData[0].pageName) {
            this._tabBarElement.setActiveTab(tabsData[0].pageName);
            // Do NOT setAttribute('active-tab-name') here, to avoid loops & let factory handle initial state.
        }
    }

    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }

        const options = {
            activeTabName: this.getAttribute('active-tab-name') || undefined,
            showNewTabButton: this.hasAttribute('show-new-tab-button'),
            onTabSelect: (pageName) => {
                if (this.getAttribute('active-tab-name') !== pageName) {
                    this.setAttribute('active-tab-name', pageName); // This will trigger attributeChangedCallback
                }
                this.dispatchEvent(new CustomEvent('tab-select', { detail: { pageName }, bubbles: true, composed: true }));
            },
            onTabClose: (pageName) => {
                this.dispatchEvent(new CustomEvent('tab-close', { detail: { pageName }, bubbles: true, composed: true }));
                // Parent (adw-tab-view) should handle removing the corresponding adw-tab-button from light DOM
            },
            onNewTabRequested: () => {
                this.dispatchEvent(new CustomEvent('new-tab-requested', { bubbles: true, composed: true }));
            }
        };

        this._tabBarElement = Adw.createTabBar(options);
        this.shadowRoot.appendChild(this._tabBarElement);
    }

    // Public methods for programmatic control
    addSlottedTab(tabButtonElement) {
        if (tabButtonElement && tabButtonElement.matches('adw-tab-button')) {
            this.appendChild(tabButtonElement); // This will trigger slotObserver and _rebuildTabsFromSlotted
        } else {
            console.error("AdwTabBar.addSlottedTab: Argument must be an adw-tab-button element.");
        }
    }

    removeSlottedTab(pageName) {
        const slottedTab = this.querySelector(`adw-tab-button[page-name="${pageName}"]`);
        if (slottedTab) {
            slottedTab.remove(); // This will trigger slotObserver and _rebuildTabsFromSlotted
        }
    }

    setActiveTab(pageName) { // Programmatic way to set active tab
        this.setAttribute('active-tab-name', pageName);
    }
}

class AdwTabPage extends HTMLElement { // Basic component for discoverability and styling
    static get observedAttributes() { return ['page-name', 'label']; } // label for tab if not on button
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';

        const slot = document.createElement('slot');
        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('adw-tab-page');
        this._wrapper.setAttribute('role', 'tabpanel');
        this._wrapper.appendChild(slot);
        this.shadowRoot.append(styleLink, this._wrapper);
    }
    connectedCallback(){
        if(!this.hasAttribute('page-name')) {
            // Try to generate one if possible, or warn
            const generatedName = `page-${[...this.parentElement.children].indexOf(this)}`;
            this.setAttribute('page-name', generatedName);
            console.warn(`adw-tab-page missing 'page-name', assigned '${generatedName}'. Explicit names recommended.`);
        }
        // aria-labelledby will be set by AdwTabView
    }
}

class AdwTabView extends HTMLElement {
    static get observedAttributes() { return ['active-page-name', 'show-new-tab-button']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);

        this._tabViewFactoryInstance = null;
        this._pagesSlot = document.createElement('slot');
        // Naming the slot allows specific assignment if needed, though default slot works too.
        this._pagesSlot.name = "page-content-slot";
        this._slotObserver = new MutationObserver(() => this._rebuildFactoryPages());
    }

    connectedCallback() {
        this._renderFactoryInstance(); // Create the internal Adw.createTabView structure
        this.shadowRoot.appendChild(this._pagesSlot); // Add slot to shadow DOM
        this._slotObserver.observe(this, { childList: true, attributes: true, subtree: false }); // Observe direct children: adw-tab-page elements
        this._rebuildFactoryPages(); // Initial population from slotted children
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this._tabViewFactoryInstance) return;

        if (name === 'active-page-name') {
            this._tabViewFactoryInstance.setActivePage(newValue);
            this._updateSlottedPageDisplay(newValue);
        } else if (name === 'show-new-tab-button') {
            // This option affects the factory's construction, so re-render factory
            this._renderFactoryInstance();
            this._rebuildFactoryPages(); // Re-populate tabs in the new factory instance
        }
    }

    _updateSlottedPageDisplay(activePageName) {
        const slottedElements = this._pagesSlot.assignedNodes({ flatten: true });
        slottedElements.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && (node.matches('adw-tab-page') || node.dataset.adwTabPage)) {
                 const isPageActive = node.getAttribute('page-name') === activePageName;
                 node.style.display = isPageActive ? '' : 'none';
                 if(isPageActive) node.setAttribute('active',''); else node.removeAttribute('active');
            }
        });
    }

    _rebuildFactoryPages() {
        if (!this._tabViewFactoryInstance) this._renderFactoryInstance();

        const slottedElements = this._pagesSlot.assignedNodes({ flatten: true });
        const pagesDataForFactory = [];

        slottedElements.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && (node.matches('adw-tab-page') || node.dataset.adwTabPage)) {
                // Ensure page-name, create if missing (though AdwTabPage now tries to self-assign)
                let pageName = node.getAttribute('page-name');
                if (!pageName) {
                    pageName = adwGenerateId('dyn-page');
                    node.setAttribute('page-name', pageName);
                }
                // The content for the factory is the node itself (or a clone if factory modifies it)
                // The factory's createAdwTabPage will wrap this content.
                // For the Adw.createTabView factory, it expects content to be passed to its internal createAdwTabPage.
                // So we pass the node itself. The factory's AdwTabPage will handle it.
                pagesDataForFactory.push({
                    name: pageName,
                    title: node.getAttribute('label') || pageName,
                    content: node, // Pass the live slotted element
                    isClosable: !node.hasAttribute('non-closable')
                });
            }
        });

        // Clear old pages from factory (assuming a method or re-creation)
        // For now, let's assume Adw.createTabView can be called again to replace.
        // This means the old factory instance and its event listeners need cleanup.
        // A more robust factory would have clearPages() and addPage() methods.

        // Simplified: Re-render factory with new page data.
        // This is not ideal as it rebuilds the tab bar too.
        // A better Adw.createTabView would have methods to update pages dynamically.
        // Given current factory structure, this is the most straightforward.
        this._renderFactoryInstance(pagesDataForFactory, this.getAttribute('active-page-name'));
    }

    _renderFactoryInstance(pagesData = [], activePageNameOverride = null) {
        if (this._tabViewFactoryInstance && this._tabViewFactoryInstance.parentElement) {
            this._tabViewFactoryInstance.remove(); // Clean up old factory instance from shadow DOM
        }

        const effectiveActivePageName = activePageNameOverride || this.getAttribute('active-page-name');

        const options = {
            pages: pagesData, // Factory will create its own tab buttons and page wrappers from this
            activePageName: effectiveActivePageName || undefined,
            showNewTabButton: this.hasAttribute('show-new-tab-button'),
            onNewTabRequested: () => {
                this.dispatchEvent(new CustomEvent('new-tab-requested', {bubbles: true, composed: true}));
            },
            onPageChanged: (pageName) => {
                if(this.getAttribute('active-page-name') !== pageName) {
                    this.setAttribute('active-page-name', pageName); // Triggers attributeChangedCallback
                } else {
                    // If already correct, ensure display is synced (e.g. on initial load)
                     this._updateSlottedPageDisplay(pageName);
                }
                this.dispatchEvent(new CustomEvent('page-changed', {detail: {pageName}, bubbles:true, composed: true}));
            },
            onBeforePageClose: (pageName) => {
                const event = new CustomEvent('before-page-close', {detail: {pageName}, cancelable: true, bubbles:true, composed: true});
                this.dispatchEvent(event);
                return !event.defaultPrevented;
            },
            onPageClosed: (pageName) => {
                // Factory handles removing its internal page and tab button.
                // We need to remove the corresponding slotted adw-tab-page from light DOM.
                const pageElement = this.querySelector(`adw-tab-page[page-name="${pageName}"], [data-adw-tab-page][page-name="${pageName}"]`);
                if (pageElement) pageElement.remove(); // This triggers slotchange, causing a rebuild.
                this.dispatchEvent(new CustomEvent('page-closed', {detail: {pageName}, bubbles:true, composed: true}));
            }
        };
        this._tabViewFactoryInstance = Adw.createTabView(options);
        // Prepend factory output so slot comes after, for correct display order if pages are complex
        this.shadowRoot.insertBefore(this._tabViewFactoryInstance, this._pagesSlot);

        // Initial display sync for slotted pages based on factory's decision
        if (this._tabViewFactoryInstance.getActivePageName()) {
            this._updateSlottedPageDisplay(this._tabViewFactoryInstance.getActivePageName());
        } else if (pagesData.length > 0) {
             this._updateSlottedPageDisplay(pagesData[0].name); // Default to first if factory doesn't pick one
        }
    }

    // Public API
    addPage(pageElement, makeActive = false) {
        if (pageElement && (pageElement.matches('adw-tab-page') || pageElement.dataset.adwTabPage)) {
            let pageName = pageElement.getAttribute('page-name');
            if(!pageName){
                pageName = adwGenerateId('dyn-page-added');
                pageElement.setAttribute('page-name', pageName);
            }
            this.appendChild(pageElement); // Triggers slotchange -> _rebuildFactoryPages
            if (makeActive) {
                this.setActivePage(pageName);
            }
        } else {
            console.error("AdwTabView.addPage: argument must be an adw-tab-page or [data-adw-tab-page] element.");
        }
    }
    removePage(pageName) {
        // This will call factory's removePage -> onPageClosed -> which removes from lightDOM.
        if (this._tabViewFactoryInstance) this._tabViewFactoryInstance.removePage(pageName);
    }
    setActivePage(pageName) {
        this.setAttribute('active-page-name', pageName);
    }
    getActivePageName() {
        return this.getAttribute('active-page-name');
    }
}

class AdwNavigationView extends HTMLElement {
    static get observedAttributes() { return []; } // Initially no attributes, relies on slotted content and methods

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);

        this._navigationViewFactoryInstance = null;
        this._pagesSlot = document.createElement('slot');
        this._slotObserver = new MutationObserver(() => this._rebuildFactoryPagesFromSlotted());
    }

    connectedCallback() {
        this._renderFactoryInstance(); // Create the basic structure (HeaderBar, pages container)
        this.shadowRoot.appendChild(this._pagesSlot);
        this._slotObserver.observe(this, { childList: true, attributes: true, subtree: true }); // Observe for page changes
        this._rebuildFactoryPagesFromSlotted();
    }

    disconnectedCallback() {
        this._slotObserver.disconnect();
    }

    _getPageDataFromElement(element) {
        if (!element || !element.matches || (!element.matches('adw-navigation-page, [data-page-name]') && !element.dataset.adwNavigationPage )) {
            return null;
        }
        const pageName = element.getAttribute('data-page-name') || element.getAttribute('page-name') || adwGenerateId('nav-page');
        if (!element.hasAttribute('data-page-name') && !element.hasAttribute('page-name')) {
            element.setAttribute('data-page-name', pageName); // Ensure it has a name
        }

        const header = {};
        const titleEl = element.querySelector('[slot="header-title"]');
        if (titleEl) header.title = titleEl.textContent;

        const subtitleEl = element.querySelector('[slot="header-subtitle"]');
        if (subtitleEl) header.subtitle = subtitleEl.textContent;

        const startElements = element.querySelectorAll('[slot="header-start"] > *');
        if (startElements.length > 0) header.start = Array.from(startElements).map(el => el.cloneNode(true));

        const endElements = element.querySelectorAll('[slot="header-end"] > *');
        if (endElements.length > 0) header.end = Array.from(endElements).map(el => el.cloneNode(true));

        return {
            name: pageName,
            element: element, // Pass the live element to the factory for management
            header: Object.keys(header).length > 0 ? header : undefined
        };
    }

    _rebuildFactoryPagesFromSlotted() {
        if (!this._navigationViewFactoryInstance) this._renderFactoryInstance();

        const initialPagesData = [];
        const slottedElements = this._pagesSlot.assignedNodes({ flatten: true });

        slottedElements.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                 const pageData = this._getPageDataFromElement(node);
                 if(pageData) initialPagesData.push(pageData);
            }
        });
        this._renderFactoryInstance(initialPagesData);
    }


    _renderFactoryInstance(initialPagesData = []) {
         if (this._navigationViewFactoryInstance && this._navigationViewFactoryInstance.parentElement) {
            this._navigationViewFactoryInstance.remove();
        }

        const options = {
            initialPages: initialPagesData,
        };

        this._navigationViewFactoryInstance = Adw.createAdwNavigationView(options);
        this.shadowRoot.insertBefore(this._navigationViewFactoryInstance, this._pagesSlot);

        this._navigationViewFactoryInstance.addEventListener('pushed', (e) => {
            this.dispatchEvent(new CustomEvent('pushed', { detail: e.detail }));
            this._updateSlottedPageDisplay();
        });
        this._navigationViewFactoryInstance.addEventListener('popped', (e) => {
            this.dispatchEvent(new CustomEvent('popped', { detail: e.detail }));
            this._updateSlottedPageDisplay();
        });

        this._updateSlottedPageDisplay();
    }

    _updateSlottedPageDisplay() {
        if(!this._navigationViewFactoryInstance) return;
        const visiblePageName = this._navigationViewFactoryInstance.getVisiblePageName();
        const slottedElements = this._pagesSlot.assignedNodes({ flatten: true });
        slottedElements.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && (node.matches('adw-navigation-page, [data-page-name]') || node.dataset.adwNavigationPage)) {
                // The factory itself now handles display:none on the actual page elements
                // So we just need to ensure the correct one is active if we add that class for CSS.
                if (node.getAttribute('data-page-name') === visiblePageName || node.getAttribute('page-name') === visiblePageName) {
                    // node.classList.add('adw-navigation-page-active'); // Factory handles this
                } else {
                    // node.classList.remove('adw-navigation-page-active');
                }
            }
        });
    }


    // Public API
    push(pageElementOrName) {
        if (typeof pageElementOrName === 'string') {
            const pageName = pageElementOrName;
            const element = this.querySelector(`[data-page-name="${pageName}"], [page-name="${pageName}"]`);
            if (element && this._navigationViewFactoryInstance) {
                 const pageData = this._getPageDataFromElement(element);
                 if(pageData) this._navigationViewFactoryInstance.push(pageData);
            } else {
                console.error(`AdwNavigationView: Page with name "${pageName}" not found in slotted content.`);
            }
        } else if (pageElementOrName instanceof HTMLElement) {
            const pageData = this._getPageDataFromElement(pageElementOrName);
            if (pageData && this._navigationViewFactoryInstance) {
                if (!pageElementOrName.parentElement) {
                    this.appendChild(pageElementOrName);
                }
                // The factory's push method will take the element from pageData and manage it.
                this._navigationViewFactoryInstance.push(pageData);
            } else if(!pageData) {
                 console.error("AdwNavigationView.push: Invalid page element provided.", pageElementOrName);
            }
        } else {
            console.error("AdwNavigationView.push: Argument must be a page name (string) or an HTMLElement.");
        }
    }

    pop() {
        if (this._navigationViewFactoryInstance) {
            this._navigationViewFactoryInstance.pop();
        }
    }

    getVisiblePageName(){
        if(this._navigationViewFactoryInstance) {
            return this._navigationViewFactoryInstance.getVisiblePageName();
        }
        return null;
    }
}

class AdwBottomSheet extends HTMLElement {
    static get observedAttributes() { return ['open', 'close-on-backdrop-click']; }

    constructor() {
        super();
        // No shadow DOM for modal / overlay components that need to be top-level
        this._bottomSheetInstance = null;
        this._contentElement = null; // To store the slotted content
    }

    connectedCallback() {
        // Grab content from light DOM
        this._contentElement = document.createElement('div');
        while(this.firstChild){
            this._contentElement.appendChild(this.firstChild); // Move children to internal div
        }
        this._render();
        if (this.hasAttribute('open')) {
            this.open();
        }
    }

    disconnectedCallback() {
        if (this._bottomSheetInstance && this._bottomSheetInstance.isOpen) {
            this._bottomSheetInstance.close();
        }
         // Restore content to light DOM if needed, or ensure it's cleaned up
        if(this._contentElement){
            while(this._contentElement.firstChild){
                this.appendChild(this._contentElement.firstChild);
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'open') {
            if (newValue !== null) this.open();
            else this.close();
        } else {
            // Re-render if other attributes change
            this._render();
            if (this.hasAttribute('open')) this.open(); // Re-open if it was open
        }
    }

    _render() {
        // If an instance exists and is open, close it before re-rendering
        if (this._bottomSheetInstance && this._bottomSheetInstance.isOpen) {
            this._bottomSheetInstance.close(); // This is async due to animations
        }

        if(!this._contentElement || !this._contentElement.hasChildNodes()){
            // Create a placeholder if no content, or wait for content.
            // For now, let's assume content will be there or added.
            // console.warn("AdwBottomSheet: No content provided.");
        }

        const options = {
            content: this._contentElement.cloneNode(true), // Pass a clone of the content
            closeOnBackdropClick: !this.hasAttribute('close-on-backdrop-click') || this.getAttribute('close-on-backdrop-click') !== 'false',
            onOpen: () => {
                if (!this.hasAttribute('open')) this.setAttribute('open', '');
                this.dispatchEvent(new CustomEvent('open', {bubbles: true, composed: true}));
            },
            onClose: () => {
                if (this.hasAttribute('open')) this.removeAttribute('open');
                this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
            }
        };
        this._bottomSheetInstance = Adw.createBottomSheet(options);
    }

    open() {
        if (!this._bottomSheetInstance) this._render(); // Ensure instance exists
        // If content was dynamically added after initial render, re-render before opening.
        if (this._contentElement.childNodes.length === 0 && this.childNodes.length > 0) {
             while(this.firstChild){ this._contentElement.appendChild(this.firstChild); }
             this._render();
        }

        this._bottomSheetInstance.open();
        // setAttribute('open') is handled by onOpen callback
    }

    close() {
        if (this._bottomSheetInstance) {
            this._bottomSheetInstance.close();
        }
        // removeAttribute('open') is handled by onClose callback
    }
}

class AdwBin extends HTMLElement {
    // No observedAttributes needed if it's just a simple container.
    // Alignment would be controlled by parent or utility classes applied to the <adw-bin> itself.
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css'; // Adjust path as needed

        const binDiv = document.createElement('div');
        binDiv.classList.add('adw-bin');

        const slot = document.createElement('slot');
        binDiv.appendChild(slot);

        this.shadowRoot.append(styleLink, binDiv);
    }

    connectedCallback() {
        // Ensure only one direct element child if strictly enforcing Bin behavior
        // This is a bit tricky with slots and text nodes.
        // For now, we'll rely on user providing a single element.
        // A MutationObserver could be used to warn or adjust if multiple elements are slotted.
    }
}

class AdwWrapBox extends HTMLElement {
    static get observedAttributes() {
        return ['orientation', 'spacing', 'line-spacing', 'align', 'justify'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css'; // Adjust path as needed

        this._wrapBoxElement = document.createElement('div');
        this._wrapBoxElement.classList.add('adw-wrap-box');

        const slot = document.createElement('slot');
        this._wrapBoxElement.appendChild(slot);

        this.shadowRoot.append(styleLink, this._wrapBoxElement);
    }

    connectedCallback() {
        this._updateStyles();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._updateStyles();
        }
    }

    _updateStyles() {
        const opts = {};
        if (this.hasAttribute('orientation')) opts.orientation = this.getAttribute('orientation');
        if (this.hasAttribute('spacing')) opts.spacing = this.getAttribute('spacing');
        if (this.hasAttribute('line-spacing')) opts.lineSpacing = this.getAttribute('line-spacing');
        if (this.hasAttribute('align')) opts.align = this.getAttribute('align');
        if (this.hasAttribute('justify')) opts.justify = this.getAttribute('justify');

        // Apply styles directly based on attributes, similar to how factory does
        this._wrapBoxElement.style.display = 'flex';
        this._wrapBoxElement.style.flexWrap = 'wrap';

        if (opts.orientation === 'vertical') {
            this._wrapBoxElement.style.flexDirection = 'column';
        } else {
            this._wrapBoxElement.style.flexDirection = 'row';
        }

        let gapValue = "var(--spacing-m)";
        if (opts.spacing) {
            gapValue = isNaN(parseFloat(opts.spacing)) ? opts.spacing : `${opts.spacing}px`;
        }

        let rowGapValue = gapValue;
        if (opts.lineSpacing) {
            rowGapValue = isNaN(parseFloat(opts.lineSpacing)) ? opts.lineSpacing : `${opts.lineSpacing}px`;
        }

        if (rowGapValue !== gapValue) {
            this._wrapBoxElement.style.rowGap = rowGapValue;
            this._wrapBoxElement.style.columnGap = gapValue;
        } else {
            this._wrapBoxElement.style.gap = gapValue;
        }

        const flexAlignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
        this._wrapBoxElement.style.alignItems = flexAlignMap[opts.align] || flexAlignMap.start;

        const flexJustifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', evenly: 'space-evenly' };
        this._wrapBoxElement.style.justifyContent = flexJustifyMap[opts.justify] || flexJustifyMap.start;
    }
}

class AdwClamp extends HTMLElement {
    static get observedAttributes() { return ['maximum-size', 'scrollable']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';

        this._clampElement = document.createElement('div');
        this._clampElement.classList.add('adw-clamp');

        this._childWrapper = document.createElement('div');
        this._childWrapper.classList.add('adw-clamp-child-wrapper');

        const slot = document.createElement('slot');
        this._childWrapper.appendChild(slot);
        this._clampElement.appendChild(this._childWrapper);

        this.shadowRoot.append(styleLink, this._clampElement);
    }

    connectedCallback() {
        this._updateStyles();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._updateStyles();
        }
    }

    _updateStyles() {
        this._childWrapper.style.maxWidth = this.getAttribute('maximum-size') || '80ch';

        this._clampElement.style.display = 'flex';
        this._clampElement.style.justifyContent = 'center';

        if (this.hasAttribute('scrollable')) {
            this._clampElement.classList.add('scrollable');
            this._clampElement.style.overflowX = 'hidden';
            this._clampElement.style.overflowY = 'auto';
            this._childWrapper.style.width = '100%';
        } else {
            this._clampElement.classList.remove('scrollable');
            this._clampElement.style.overflowX = '';
            this._clampElement.style.overflowY = '';
            // this._childWrapper.style.width = ''; // Let it be intrinsic or set by max-width
        }
    }
}

class AdwBreakpointBin extends HTMLElement {
    static get observedAttributes() { return ['default-child-name']; }

    constructor() {
        super();
        // BreakpointBin is a controller, so no Shadow DOM for its own visual style.
        // It directly manipulates its light DOM children's display.
        this._breakpointBinInstance = null;
        this._slotObserver = new MutationObserver(() => this._rebuildChildren());
    }

    connectedCallback() {
        this._rebuildChildren(); // Initial setup based on children
        if(this._breakpointBinInstance) this._breakpointBinInstance.startObserving();
    }

    disconnectedCallback() {
        if (this._breakpointBinInstance) this._breakpointBinInstance.stopObserving();
        this._slotObserver.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'default-child-name' && this._breakpointBinInstance) {
            // Re-initialize or update default child logic in factory if possible
            // For now, simplest is to re-render the factory logic
            this._rebuildChildren();
        }
    }

    _rebuildChildren() {
        const childrenData = [];
        // Detach observer while manipulating children to avoid loops
        this._slotObserver.disconnect();

        Array.from(this.children).forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const condition = child.dataset.condition || child.getAttribute('condition'); // Allow data- or plain attr
                const name = child.dataset.name || child.getAttribute('name') || adwGenerateId('bp-child');
                if(!child.dataset.name && !child.getAttribute('name')) child.setAttribute('data-name', name);

                if (condition) {
                    childrenData.push({
                        name: name,
                        element: child, // Pass live element
                        condition: isNaN(parseFloat(condition)) ? condition : parseFloat(condition)
                    });
                } else {
                    console.warn("AdwBreakpointBin: Child element is missing a 'data-condition' or 'condition' attribute.", child);
                }
            }
        });

        // Clear previous factory instance if exists (especially its DOM manipulations)
        if (this._breakpointBinInstance) {
            // The factory appends children to itself. If we re-create it,
            // we must ensure light DOM children are correctly re-associated or cloned.
            // The current factory takes children and appends them.
            // For WC, it's better if the factory operates on children already in its container.
            // This might require a change in factory or a different approach here.
            // For now, let's assume the factory is re-created and light DOM children are re-slotted/re-managed.
            // This implies the factory should not remove children from their original parent if they are slotted.
            // The factory currently appends children passed to it. This means it needs clones.
            // However, for a WC, we want to operate on the light DOM children.
            // This needs a slight rethink of how factory and WC interact for children.

            // Let's adjust the factory to take the container (this WC itself) and find its children.
            // OR, the WC passes child *data* and the factory creates/manages internal copies.
            // The current factory takes element references and appends them.
            // For the WC, we will pass clones to the factory. The WC will manage display of its own light DOM.
        }


        const factoryOptions = {
            children: childrenData.map(cd => ({...cd, element: cd.element.cloneNode(true)})), // Factory gets clones
            defaultChildName: this.getAttribute('default-child-name') || undefined
        };

        // The factory instance is now just for logic, not DOM manipulation directly in light DOM.
        // The WC itself will manage display of its slotted children.
        // So, we don't append factory output to shadow DOM.

        // If factory was used to manage its own DOM:
        // if (this._breakpointBinInstance && this._breakpointBinInstance.parentElement) {
        //    this._breakpointBinInstance.remove();
        // }
        // this._breakpointBinInstance = Adw.createAdwBreakpointBin(factoryOptions);
        // this.shadowRoot.appendChild(this._breakpointBinInstance); // If it had its own shadow structure
        // this._breakpointBinInstance.startObserving();

        // Simpler: WC does the work, using factory logic if needed, but directly on light DOM.
        this._initializeBreakpointLogic(childrenData);


        this._slotObserver.observe(this, { childList: true, attributes: true, subtree: false });
    }

    _initializeBreakpointLogic(childrenData) {
        // Sort children by their minWidth condition
        this._sortedChildrenConfig = childrenData.map(c => {
            let minWidth = 0;
            if (typeof c.condition === 'number') minWidth = c.condition;
            else if (typeof c.condition === 'string') {
                const match = c.condition.match(/min-width:\s*(\d+)(px)?/i);
                if (match && match[1]) minWidth = parseInt(match[1], 10);
            }
            return { ...c, _minWidth: minWidth };
        }).sort((a, b) => a._minWidth - b._minWidth);

        let defaultChildName = this.getAttribute('default-child-name');
        this._defaultChildElement = null;

        if (defaultChildName) {
            const found = this._sortedChildrenConfig.find(c => c.name === defaultChildName);
            if (found) this._defaultChildElement = found.element;
        }
        if (!this._defaultChildElement && this._sortedChildrenConfig.length > 0) {
            this._defaultChildElement = this._sortedChildrenConfig[0].element; // Smallest one
        }

        this._currentVisibleElement = null;

        if (typeof ResizeObserver !== 'undefined') {
            if (this._resizeObserver) this._resizeObserver.disconnect();
            this._resizeObserver = new ResizeObserver(() => this.updateVisibility());
            this._resizeObserver.observe(this);
        } else {
            console.warn("AdwBreakpointBin WC: ResizeObserver not supported.");
            // Fallback to window resize (less accurate)
            // window.addEventListener('resize', () => this.updateVisibility());
        }
        this.updateVisibility(); // Initial check
    }

    updateVisibility() {
        const containerWidth = this.offsetWidth;
        let newVisibleElement = this._defaultChildElement;

        for (let i = this._sortedChildrenConfig.length - 1; i >= 0; i--) {
            const childConfig = this._sortedChildrenConfig[i];
            if (containerWidth >= childConfig._minWidth) {
                newVisibleElement = childConfig.element;
                break;
            }
        }

        if (this._currentVisibleElement !== newVisibleElement) {
            // Hide all slotted children first
            Array.from(this.children).forEach(child => {
                if(child.style) child.style.display = 'none';
            });

            if (newVisibleElement && newVisibleElement.style) {
                 newVisibleElement.style.display = '';
            }
            this._currentVisibleElement = newVisibleElement;
            this.dispatchEvent(new CustomEvent('child-changed', {
                detail: { visibleChildName: newVisibleElement ? (newVisibleElement.dataset.name || newVisibleElement.getAttribute('name')) : null }
            }));
        }
    }
}

class AdwToolbarView extends HTMLElement {
    static get observedAttributes() { return ['top-bar-revealed', 'bottom-bar-revealed']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet'; styleLink.href = '/static/css/adwaita-web.css';

        this._toolbarViewElement = document.createElement('div');
        this._toolbarViewElement.classList.add('adw-toolbar-view');

        this._topBarSlotContainer = document.createElement('div');
        this._topBarSlotContainer.classList.add('adw-toolbar-view-top-bar');
        this._topBarSlot = document.createElement('slot');
        this._topBarSlot.name = 'top-bar';
        this._topBarSlotContainer.appendChild(this._topBarSlot);

        this._contentSlotContainer = document.createElement('div');
        this._contentSlotContainer.classList.add('adw-toolbar-view-content');
        this._contentSlot = document.createElement('slot'); // Default slot for main content
        this._contentSlotContainer.appendChild(this._contentSlot);

        this._bottomBarSlotContainer = document.createElement('div');
        this._bottomBarSlotContainer.classList.add('adw-toolbar-view-bottom-bar');
        this._bottomBarSlot = document.createElement('slot');
        this._bottomBarSlot.name = 'bottom-bar';
        this._bottomBarSlotContainer.appendChild(this._bottomBarSlot);

        this._toolbarViewElement.append(this._topBarSlotContainer, this._contentSlotContainer, this._bottomBarSlotContainer);
        this.shadowRoot.append(styleLink, this._toolbarViewElement);
    }

    connectedCallback() {
        this._updateBarVisibility();
        // No factory instance needed if we manage display via CSS/attributes directly.
        // This WC will be more about structure and CSS.
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._updateBarVisibility();
        }
    }

    _updateBarVisibility() {
        const topBarRevealed = !this.hasAttribute('top-bar-revealed') || this.getAttribute('top-bar-revealed') !== 'false';
        const bottomBarRevealed = !this.hasAttribute('bottom-bar-revealed') || this.getAttribute('bottom-bar-revealed') !== 'false';

        this._topBarSlotContainer.style.display = topBarRevealed ? '' : 'none';
        this._bottomBarSlotContainer.style.display = bottomBarRevealed ? '' : 'none';

        // Add classes for CSS transitions/animations if desired
        this._topBarSlotContainer.classList.toggle('revealed', topBarRevealed);
        this._bottomBarSlotContainer.classList.toggle('revealed', bottomBarRevealed);

    }

    // Public methods (optional, could rely on attributes)
    showTopBar() { this.setAttribute('top-bar-revealed', ''); }
    hideTopBar() { this.removeAttribute('top-bar-revealed'); } // Or set to "false"
    showBottomBar() { this.setAttribute('bottom-bar-revealed', ''); }
    hideBottomBar() { this.removeAttribute('bottom-bar-revealed'); }
}


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

// console.log('[Debug] components.js execution ended'); // Will be replaced

console.log('[Debug] components.js main script body executed. Defining custom elements now.');

customElements.define('adw-button', AdwButton);
customElements.define('adw-box', AdwBox);
customElements.define('adw-entry', AdwEntry);
customElements.define('adw-label', AdwLabel);
customElements.define('adw-entry-row', AdwEntryRow);
customElements.define('adw-password-entry-row', AdwPasswordEntryRow);
customElements.define('adw-action-row', AdwActionRow);
customElements.define('adw-switch', AdwSwitch);
customElements.define('adw-checkbox', AdwCheckbox);
customElements.define('adw-radio-button', AdwRadioButton);
customElements.define('adw-list-box', AdwListBox);
customElements.define('adw-row', AdwRow);
customElements.define('adw-window-title', AdwWindowTitle);
customElements.define('adw-header-bar', AdwHeaderBar);
customElements.define('adw-application-window', AdwApplicationWindow);
customElements.define('adw-avatar', AdwAvatar);
customElements.define('adw-flap', AdwFlap);
customElements.define('adw-view-switcher', AdwViewSwitcher);
customElements.define('adw-progress-bar', AdwProgressBar);
customElements.define('adw-spinner', AdwSpinner);
customElements.define('adw-split-button', AdwSplitButton);
customElements.define('adw-status-page', AdwStatusPage);
customElements.define('adw-expander-row', AdwExpanderRow);
customElements.define('adw-dialog', AdwDialog);
customElements.define('adw-banner', AdwBanner);
customElements.define('adw-toast', AdwToast);
customElements.define('adw-preferences-view', AdwPreferencesView);
customElements.define('adw-preferences-page', AdwPreferencesPage);
customElements.define('adw-preferences-group', AdwPreferencesGroup);
customElements.define('adw-switch-row', AdwSwitchRow);
customElements.define('adw-combo-row', AdwComboRow);
customElements.define('adw-alert-dialog', AdwAlertDialog);
customElements.define('adw-about-dialog', AdwAboutDialog);
customElements.define('adw-preferences-dialog', AdwPreferencesDialog);
customElements.define('adw-spin-button', AdwSpinButton);
customElements.define('adw-spin-row', AdwSpinRow);
customElements.define('adw-button-row', AdwButtonRow);
customElements.define('adw-tab-button', AdwTabButton);
customElements.define('adw-tab-bar', AdwTabBar);
customElements.define('adw-tab-page', AdwTabPage);
customElements.define('adw-tab-view', AdwTabView);
customElements.define('adw-navigation-view', AdwNavigationView);
customElements.define('adw-bottom-sheet', AdwBottomSheet);
customElements.define('adw-bin', AdwBin);
customElements.define('adw-wrap-box', AdwWrapBox);
customElements.define('adw-clamp', AdwClamp);
customElements.define('adw-breakpoint-bin', AdwBreakpointBin);
customElements.define('adw-toolbar-view', AdwToolbarView);

console.log('[Debug] components.js all custom elements defined and execution ended.');

[end of js/components.js]
