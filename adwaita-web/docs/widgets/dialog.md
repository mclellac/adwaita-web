# Dialog

Dialogs are modal windows that overlay the current view, used for important messages, choices, or tasks that require user focus. Adwaita-Web provides `Adw.createDialog()` and the `<adw-dialog>` Web Component.

Specialized dialogs like `Adw.createAlertDialog()` and `Adw.createAboutDialog()` are also available (see their respective documentation).

## JavaScript Factory: `Adw.Dialog.factory()` or `createAdwDialog()`

Creates an `<adw-dialog>` Web Component instance.

**Signature:**

```javascript
Adw.Dialog.factory(options = {}) -> AdwDialogElement
// or createAdwDialog(options = {}) -> AdwDialogElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, optional): Sets the `title` attribute on the `<adw-dialog>`.
    *   `content` (Node | String, optional): The main content for the dialog.
        If a string, it's wrapped in a `<p>`. The node is appended to the `<adw-dialog>` and should be targeted to the `content` slot (e.g., by setting `slot="content"` on it, or it will go to the default slot within the content area).
    *   `buttons` (Array<Node>, optional): An array of button elements (e.g., `<adw-button>` instances) to append to the `<adw-dialog>`, targeted to the `buttons` slot (e.g., by setting `slot="buttons"` on them).
    *   `onClose` (Function, optional): Callback function attached as a `close` event listener on the `<adw-dialog>`.
    *   `closeOnBackdropClick` (Boolean, optional): If `false`, sets `close-on-backdrop-click="false"` on the `<adw-dialog>`. Defaults to `true` (attribute not set).

**Returns:**

*   `(AdwDialogElement)`: The created `<adw-dialog>` Web Component instance. Call methods like `open()` and `close()` on this instance.

**Example:**

```html
<div id="js-dialog-trigger-container"></div>
<script>
  // Assuming createAdwDialog and createAdwButton are available
  const triggerContainer = document.getElementById('js-dialog-trigger-container');

  const contentEl = document.createElement('div');
  // It's better to set slot="content" if providing a wrapper div
  // contentEl.setAttribute('slot', 'content');
  const p = document.createElement('p');
  p.textContent = "This is some custom content for the dialog. " +
                  "It can include various HTML elements.";
  const entry = document.createElement('adw-entry'); // Assuming adw-entry is a WC
  entry.placeholder = "Enter something...";
  contentEl.append(p, entry);

  const myDialogWC = createAdwDialog({
    title: "My Custom Dialog",
    content: contentEl, // This will be slotted
    buttons: [
      createAdwButton("Cancel", { onClick: () => myDialogWC.close() }),
      createAdwButton("Submit", {
        suggested: true,
        onClick: () => {
          const dialogEntry = myDialogWC.querySelector('adw-entry'); // Query within the dialog's light DOM
          Adw.createToast(`Submitted: ${dialogEntry.value}`);
          myDialogWC.close();
        }
      })
    ],
    onClose: () => {
      console.log("Custom dialog (WC) closed.");
    }
  });
  // Note: The dialog is not in the DOM yet. Append it if you want to find it by ID,
  // or keep the reference. AdwDialog's open() method appends its structure to body.

  const openDialogButton = createAdwButton("Open JS Dialog", {
    onClick: () => myDialogWC.open() // Call open() on the WC instance
  });
  triggerContainer.appendChild(openDialogButton);
</script>
```

## Web Component: `<adw-dialog>`

A declarative way to define Adwaita dialogs. This component does not use Shadow DOM due to its modal nature of overlaying the entire page.

**HTML Tag:** `<adw-dialog>`

**Attributes:**

*   `title` (String, optional): The title of the dialog.
*   `open` (Boolean attribute): If present, the dialog will be open. Can be added/removed to programmatically open/close.
*   `close-on-backdrop-click` (String, optional): If set to `"false"`, clicking the backdrop will not close the dialog. Defaults to `true` (attribute absent).

**Slots:**

*   `content` (Named slot): The main content area of the dialog. Example: `<div slot="content">...</div>`.
*   Default slot: Fallback content if `slot="content"` is not used. Content placed here will also appear in the main content area of the dialog.
*   `buttons` (Named slot): Place `adw-button` or standard `<button>` elements here for the dialog's action area. Example: `<adw-button slot="buttons">OK</adw-button>`.

**Events:**

*   `open`: Fired when the dialog opens.
*   `close`: Fired when the dialog closes.

**Methods:**

*   `open()`: Call this method on the component instance to show the dialog.
*   `close()`: Call this method on the component instance to hide the dialog.

**Example:**

```html
<adw-button id="open-wc-dialog-btn">Open Web Component Dialog</adw-button>

<adw-dialog id="my-wc-dialog" title="Web Component Dialog"
            close-on-backdrop-click="false">
  <div slot="content">
    <p>This dialog is defined declaratively using the
       <code>&lt;adw-dialog&gt;</code> tag.</p>
    <adw-entry placeholder="Your input here..."></adw-entry>
  </div>
  <div slot="buttons">
    <adw-button id="wc-dialog-cancel-btn">Cancel</adw-button>
    <adw-button id="wc-dialog-ok-btn" suggested>OK</adw-button>
  </div>
</adw-dialog>

<script>
  const wcDialog = document.getElementById('my-wc-dialog');
  const openWcDialogBtn = document.getElementById('open-wc-dialog-btn');
  const wcDialogCancelBtn = document.getElementById('wc-dialog-cancel-btn');
  const wcDialogOkBtn = document.getElementById('wc-dialog-ok-btn');

  openWcDialogBtn.addEventListener('click', () => {
    wcDialog.open(); // or wcDialog.setAttribute('open', '');
  });

  wcDialogCancelBtn.addEventListener('click', () => {
    wcDialog.close(); // or wcDialog.removeAttribute('open');
  });

  wcDialogOkBtn.addEventListener('click', () => {
    const inputInsideDialog = wcDialog.querySelector('adw-entry');
    Adw.createToast(`Dialog OK with input: ${inputInsideDialog.value}`);
    wcDialog.close();
  });

  wcDialog.addEventListener('close', () => {
    console.log('Web Component Dialog was closed.');
  });
</script>
```

## Styling

*   **SCSS Source:** `scss/_dialog.scss`. This file styles the base `adw-dialog` (and `adw-about-dialog` host elements) and also includes specific styling for content typically found in alert dialogs.
*   **Base Dialog Structure & Classes (for `<adw-dialog>` Web Component's Light DOM / Slots):**
    *   Host: `adw-dialog` (or `adw-about-dialog`, `adw-preferences-dialog`). Styled as a modal overlay with background, shadow, and border radius.
        *   `max-width`: Default is `550px`, can be overridden by specialized dialogs.
        *   Animated with `opacity` and `transform: scale()` on open/close.
    *   Header: A `div` with class `adw-dialog__header` (typically not directly slotted, but part of the WC's template if a title is provided).
        *   Contains `h2.adw-dialog__title` for the dialog title.
        *   Contains a close button (e.g., `.adw-dialog-close-button`).
    *   Content Area: A `div` with class `adw-dialog-content` (content provided via the default slot or `slot="content"` goes here).
        *   `padding: var(--spacing-l)`.
    *   Footer: A `div` with class `adw-dialog-footer` (content provided via `slot="buttons"` goes here).
        *   `padding: var(--spacing-m)`, `border-top`, `gap` for buttons.
*   **Alert Dialog Content Classes (styled within `_dialog.scss` inside `.adw-dialog-content`):**
    *   `.adw-alert-dialog-heading`: For the main heading of an alert.
    *   `.adw-alert-dialog-body`: For the descriptive body text of an alert.
    *   `.adw-alert-dialog-responses`: A flex container for alert buttons. Can be `.horizontal`.
*   **Backdrop:**
    *   Class: `.adw-dialog-backdrop`.
    *   Covers the entire viewport behind the dialog.
    *   Styled with `background-color: var(--dialog-backdrop-color)`.
*   **Key Theming Variables:**
    *   `--dialog-bg-color`, `--dialog-fg-color`
    *   `--dialog-box-shadow`, `--window-radius` (for dialog corners)
    *   `--dialog-backdrop-color`
    *   `--z-index-dialog`, `--z-index-dialog-backdrop`
    *   `--animation-duration-short`, `--animation-ease-out-cubic` (for open/close transitions)
    *   Border colors use `var(--border-color)`.

Specialized dialogs like `<adw-about-dialog>` and `<adw-preferences-dialog>` use these base dialog styles and add their own specific content styling (see `_about_dialog.scss`, `_preferences.scss`). `<adw-alert-dialog>` also uses the base `adw-dialog` and the alert-specific content classes from `_dialog.scss`.

---
Next: [AlertDialog](./alertdialog.md)
