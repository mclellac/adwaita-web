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

*   `(AdwDialogElement)`: The created `<adw-dialog>` Web Component instance.

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

*   Primary SCSS: `scss/_dialog.scss` (and potentially `scss/_alert_dialog.scss` for specialized versions).
*   Variables: Uses general theme variables from `scss/_variables.scss` (e.g., `--dialog-bg-color`, `--dialog-fg-color`, `--popover-bg-color` as dialogs are popover-like).
*   The backdrop is styled via `.adw-dialog-backdrop`.

---
Next: [Avatar](./avatar.md)
