# AlertDialog

An AlertDialog is a specialized `AdwDialog` used for displaying important alerts or simple questions that require a user response. It typically has a heading, a body message, and one or more response buttons.

## JavaScript Factory: `Adw.createAlertDialog()`

Creates and manages an Adwaita-styled alert dialog.

**Signature:**

```javascript
Adw.createAlertDialog(body, options = {}) -> { dialog: HTMLDivElement, open: function, close: function }
```

**Parameters:**

*   `body` (String, required): The main message/body text of the alert.
*   `options` (Object, optional): Configuration options:
    *   `heading` (String, optional): An optional heading for the alert dialog.
    *   `choices` (Array<Object>, optional): An array of choice objects to create
        buttons. Each object:
        *   `label` (String, required): Text for the button.
        *   `value` (String, required): A value associated with this choice, passed
            to `onResponse`.
        *   `style` (String, optional): Style for the button. Can be `'default'`,
            `'suggested'`, or `'destructive'`.
        If no choices are provided, a default "OK" button is usually created.
    *   `onResponse` (Function, optional): Callback function executed when a choice
        button is clicked. Receives the `value` of the chosen option as an
        argument. The dialog automatically closes after a response.
    *   `customContent` (HTMLElement, optional): Optional custom HTML element to use
        as the dialog's content instead of the `body` string. If provided, `body`
        string might be ignored or used as a fallback label.
    *   `closeOnBackdropClick` (Boolean, optional): Whether clicking the backdrop
        closes the dialog. Defaults to `false` for alert dialogs to ensure a
        choice is made.

**Returns:**

*   An `Object` with the following properties:
    *   `dialog` (HTMLDivElement): The main dialog DOM element.
    *   `open` (Function): Method to display the alert dialog.
    *   `close` (Function): Method to hide the alert dialog.

**Example:**

```html
<div id="js-alertdialog-trigger"></div>
<script>
  const triggerContainer = document.getElementById('js-alertdialog-trigger');

  const showAlertBtn = Adw.createButton("Show Alert", {
    onClick: () => {
      const alert = Adw.createAlertDialog(
        "Are you sure you want to delete this item? This action cannot be undone.",
        {
          heading: "Confirm Deletion",
          choices: [
            { label: "Cancel", value: "cancel" },
          { label: "Delete", value: "delete", style: "destructive" }
        ],
        onResponse: (value) => {
          Adw.createToast(`Alert response: ${value}`);
          if (value === "delete") {
            console.log("Item deletion confirmed.");
          }
        }
      });
      alert.open();
    }
  });
  triggerContainer.appendChild(showAlertBtn);

  const showSimpleAlertBtn = Adw.createButton("Simple Info Alert", {
      onClick: () => {
          const simpleAlert = Adw.createAlertDialog("Your settings have been saved successfully.", {
              heading: "Success"
              // Default "OK" button will be added
          });
          simpleAlert.open();
      }
  });
  triggerContainer.appendChild(showSimpleAlertBtn);
</script>
```

## Web Component: `<adw-alert-dialog>`

A declarative way to define Adwaita alert dialogs.

**HTML Tag:** `<adw-alert-dialog>`

**Attributes:**

*   `heading` (String, optional): The heading text for the alert.
*   `body` (String, optional): The main message text. If not provided, the component's text content might be used.
*   `open` (Boolean, optional): Controls the visibility of the dialog. Add to open, remove to close.
*   `close-on-backdrop-click` (Boolean, optional): If set to `"true"`, allows closing by clicking the backdrop. Defaults to `false`.

**Slots:**

*   Default slot / `body-content`: For the main body of the alert if more complex HTML than a simple string is needed. If this slot is used, the `body` attribute might be ignored.
*   `choice`: Use `<button slot="choice" value="myValue" data-style="suggested">My Label</button>` to define response buttons declaratively.
    *   `value`: The value passed in the `response` event.
    *   `data-style`: Can be "suggested" or "destructive".

**Events:**

*   `open`: Fired when the dialog opens.
*   `close`: Fired when the dialog closes (not necessarily after a response, e.g., if closed programmatically).
*   `response`: Fired when a choice button is clicked. `event.detail` contains `{ value: String }`.

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
