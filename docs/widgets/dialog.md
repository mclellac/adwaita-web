# Dialog

Dialogs are modal windows that overlay the current view, used for important messages, choices, or tasks that require user focus. Adwaita-Web provides `Adw.createDialog()` and the `<adw-dialog>` Web Component.

Specialized dialogs like `Adw.createAlertDialog()` and `Adw.createAboutDialog()` are also available (see their respective documentation).

## JavaScript Factory: `Adw.createDialog()`

Creates and manages an Adwaita-styled dialog.

**Signature:**

```javascript
Adw.createDialog(options = {}) -> { dialog: HTMLDivElement, open: function, close: function }
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, optional): Title displayed at the top of the dialog.
    *   `content` (HTMLElement | String, optional): The main content of the dialog. If a string is provided, it's wrapped in a `<p>` tag. *Security: If providing an HTMLElement, ensure its content is trusted/sanitized if it's user-generated HTML.*
    *   `buttons` (Array<HTMLElement>, optional): An array of button elements (e.g., created with `Adw.createButton()`) to display in the dialog's action area.
    *   `onClose` (Function, optional): Callback function executed when the dialog is closed (either programmatically, by Escape key, or backdrop click if enabled).
    *   `closeOnBackdropClick` (Boolean, optional): If `true` (default), clicking the backdrop overlay will close the dialog. Set to `false` to prevent this.

**Returns:**

*   An `Object` with the following properties:
    *   `dialog` (HTMLDivElement): The main dialog DOM element.
    *   `open` (Function): Method to call to display the dialog.
    *   `close` (Function): Method to call to hide the dialog.

**Example:**

```html
<div id="js-dialog-trigger-container"></div>
<script>
  const triggerContainer = document.getElementById('js-dialog-trigger-container');

  const contentEl = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = "This is some custom content for the dialog. It can include various HTML elements.";
  const entry = Adw.createEntry({ placeholder: "Enter something..."});
  contentEl.append(p, entry);

  const myDialog = Adw.createDialog({
    title: "My Custom Dialog",
    content: contentEl,
    buttons: [
      Adw.createButton("Cancel", { onClick: () => myDialog.close() }),
      Adw.createButton("Submit", {
        suggested: true,
        onClick: () => {
          Adw.createToast(`Submitted: ${entry.value}`);
          myDialog.close();
        }
      })
    ],
    onClose: () => {
      console.log("Custom dialog closed.");
    }
  });

  const openDialogButton = Adw.createButton("Open JS Dialog", {
    onClick: () => myDialog.open()
  });
  triggerContainer.appendChild(openDialogButton);
</script>
```

## Web Component: `<adw-dialog>`

A declarative way to define Adwaita dialogs.

**HTML Tag:** `<adw-dialog>`

**Attributes:**

*   `title` (String, optional): The title of the dialog.
*   `open` (Boolean, optional): If present, the dialog will be open by default or can be used to programmatically open/close the dialog by adding/removing the attribute.
*   `close-on-backdrop-click` (Boolean, optional): If set to `"false"`, clicking the backdrop will not close the dialog. Defaults to `true`.

**Slots:**

*   `content` (default slot if not named, or `slot="content"`): The main content area of the dialog.
*   `buttons` (`slot="buttons"`): Place `adw-button` or standard `<button>` elements here for the dialog's action area.

**Events:**

*   `open`: Fired when the dialog opens.
*   `close`: Fired when the dialog closes.

**Methods:**

*   `open()`: Call this method on the component instance to show the dialog.
*   `close()`: Call this method on the component instance to hide the dialog.

**Example:**

```html
<adw-button id="open-wc-dialog-btn">Open Web Component Dialog</adw-button>

<adw-dialog id="my-wc-dialog" title="Web Component Dialog" close-on-backdrop-click="false">
  <div slot="content">
    <p>This dialog is defined declaratively using the <code>&lt;adw-dialog&gt;</code> tag.</p>
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
