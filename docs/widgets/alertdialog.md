# AlertDialog

An AlertDialog is a specialized `AdwDialog` used for displaying important alerts or simple questions that require a user response. It typically has a heading, a body message, and one or more response buttons.

## JavaScript Factory: `Adw.AlertDialog.factory()` or `createAdwAlertDialog()`

Creates an `<adw-alert-dialog>` Web Component instance.

**Signature:**

```javascript
Adw.AlertDialog.factory(body, options = {}) -> AdwAlertDialogElement
// or createAdwAlertDialog(body, options = {}) -> AdwAlertDialogElement
```

**Parameters:**

*   `body` (String, optional): The main message/body text of the alert. Sets the `body` attribute if `options.customContent` is not provided.
*   `options` (Object, optional): Configuration options:
    *   `heading` (String, optional): Sets the `heading` attribute.
    *   `choices` (Array<Object>, optional): An array of choice objects to create buttons. Each object should have:
        *   `label` (String, required): Text for the button.
        *   `value` (String, required): A value associated with this choice.
        *   `style` (String, optional): Style for the button (`'suggested'`, `'destructive'`).
        The factory creates `<button slot="choice" ...>` elements from these and appends them to the `<adw-alert-dialog>`.
    *   `onResponse` (Function, optional): Callback for the `response` event. Receives `event.detail.value`.
    *   `onDialogClosed` (Function, optional): Callback for the `close` event. (Note: `AdwAlertDialog` itself fires `close` when its internal dialog closes).
    *   `customContent` (Node, optional): A DOM Node to use as the dialog's main content. It will be slotted with `slot="body-content"`.
    *   `closeOnBackdropClick` (Boolean, optional): Sets the `close-on-backdrop-click` attribute (e.g., `"true"` or `"false"`). Defaults to `false` behavior in the WC if attribute is absent or not "true".

**Returns:**

*   `(AdwAlertDialogElement)`: The created `<adw-alert-dialog>` Web Component instance.

**Example:**

```html
<div id="js-alertdialog-trigger"></div>
<script>
  // Assuming createAdwAlertDialog and createAdwButton are available
  const triggerContainer = document.getElementById('js-alertdialog-trigger');

  const showAlertBtn = createAdwButton("Show Alert", {
    onClick: () => {
      const alertDialogWC = createAdwAlertDialog(
        "Are you sure you want to delete this item? This action cannot be undone.",
        {
          heading: "Confirm Deletion",
          choices: [
            { label: "Cancel", value: "cancel" },
            { label: "Delete", value: "delete", style: "destructive" }
          ],
          onResponse: (value) => { // Note: event.detail.value for WC
            Adw.createToast(`Alert response: ${value}`);
            if (value === "delete") {
              console.log("Item deletion confirmed.");
            }
          },
          onDialogClosed: () => console.log("Alert dialog was closed.")
        }
      );
      alertDialogWC.open(); // Call open() on the WC instance
    }
  });
  triggerContainer.appendChild(showAlertBtn);

  const showSimpleAlertBtn = createAdwButton("Simple Info Alert", {
      onClick: () => {
          const simpleAlertWC = createAdwAlertDialog(
            "Your settings have been saved successfully.",
            { heading: "Success" }
            // AdwAlertDialog WC provides a default "OK" button if no choices.
          );
          simpleAlertWC.open();
      }
  });
  triggerContainer.appendChild(showSimpleAlertBtn);
</script>
```

## Web Component: `<adw-alert-dialog>`

A declarative way to define Adwaita alert dialogs. This component internally uses `<adw-dialog>`.

**HTML Tag:** `<adw-alert-dialog>`

**Attributes:**

*   `heading` (String, optional): The heading text for the alert.
*   `body` (String, optional): The main message text. Used if `body-content` slot is empty.
*   `open` (Boolean attribute): Controls the visibility of the dialog.
*   `close-on-backdrop-click` (String, optional): Set to `"true"` to allow closing by clicking the backdrop. Defaults to `false` behavior (dialog does not close on backdrop click).

**Slots:**

*   Default slot: Fallback content for the alert body if `body` attribute is not set and `body-content` slot is not used.
*   `body-content` (Named slot): For providing more complex HTML as the main body of the alert. Takes precedence over `body` attribute and default slot.
*   `choice`: Use `<button slot="choice" value="myValue" data-style="suggested">My Label</button>` or `<adw-button slot="choice" ...>` to define response buttons.
    *   `value`: The value passed in the `response` event detail.
    *   `data-style`: Can be "suggested" or "destructive" to style the generated `adw-button`.

**Events:**

*   `open`: Fired when the dialog begins to open.
*   `close`: Fired when the dialog has closed.
*   `response`: Fired when a choice button is clicked. `event.detail` contains `{ value: String }`. The dialog typically closes itself after a response.

**Methods:**

*   `open()`: Shows the dialog.
*   `close()`: Hides the dialog.

**Example:**

```html
<adw-button id="wc-alert-btn">Show WC Alert</adw-button>

<adw-alert-dialog id="my-wc-alert" heading="Action Required" body="Please choose an option below.">
  <!-- Choices defined via slotted buttons -->
  <button slot="choice" value="option1">Option 1</button>
  <adw-button slot="choice" value="option2" data-style="suggested">Option 2 (Suggested)</adw-button>
  <adw-button slot="choice" value="cancel" data-style="destructive">Cancel</adw-button>
</adw-alert-dialog>

<script>
  const wcAlert = document.getElementById('my-wc-alert');
  const wcAlertBtn = document.getElementById('wc-alert-btn');

  wcAlertBtn.addEventListener('click', () => {
    wcAlert.open();
  });

  wcAlert.addEventListener('response', (event) => {
    Adw.createToast(`WC Alert responded with: ${event.detail.value}`);
    // Dialog closes automatically on response via factory.
    // The 'open' attribute should be removed by the component's internal logic.
  });
   wcAlert.addEventListener('close', () => {
    console.log('WC Alert dialog closed.');
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_alert_dialog.scss` (which builds upon `scss/_dialog.scss`).
*   Typically has a more focused layout than a generic `AdwDialog`, with clear visual separation for heading, body, and action buttons.
*   Buttons are usually arranged in a specific order (e.g., cancel on the left, confirm on the right or destructive actions).

---
Next: [AboutDialog](./aboutdialog.md)
