# SpinRow

An AdwSpinRow is a specialized `AdwRow` that combines a label (title and optional subtitle) with an `AdwSpinButton` control. It's commonly used in forms or settings panels within an `AdwListBox`.

## JavaScript Factory: `Adw.createSpinRow()`

Creates an Adwaita-styled row with a label and a spin button.

**Signature:**

```javascript
Adw.createSpinRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, required): The main title/label for the spin button row.
    *   `subtitle` (String, optional): Additional descriptive text displayed below the title.
    *   `spinButtonOptions` (Object, optional): An object containing options to be passed directly to the underlying `Adw.createSpinButton()` factory function. These include `value`, `min`, `max`, `step`, and `disabled` (for the spin button itself).
    *   `onValueChanged` (Function, optional): Callback executed when the spin button's value changes. Receives the new numerical value. This is a convenience for forwarding the `onValueChanged` from `spinButtonOptions`.
    *   `disabled` (Boolean, optional): If `true`, disables the entire row, including the label and the spin button.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the spin row.

**Example:**

```html
<div id="js-spinrow-listbox" style="max-width: 450px;">
  <!-- AdwListBox would typically wrap these -->
</div>
<script>
  const container = document.getElementById('js-spinrow-listbox');

  const quantityRow = Adw.createSpinRow({
    title: "Quantity",
    subtitle: "Number of items to order",
    spinButtonOptions: {
      min: 1,
      max: 99,
      value: 10
    },
    onValueChanged: (value) => {
      console.log("Quantity changed to:", value);
    }
  });
  container.appendChild(quantityRow);

  const fontSizeRow = Adw.createSpinRow({
    title: "Font Size (pt)",
    spinButtonOptions: {
      min: 8,
      max: 72,
      step: 2,
      value: 12
    },
    onValueChanged: (value) => Adw.createToast(`Font size: ${value}pt`)
  });
  container.appendChild(fontSizeRow);

  const disabledSpinRow = Adw.createSpinRow({
    title: "Timeout (seconds)",
    subtitle: "Setting is currently locked",
    disabled: true, // Disables the whole row
    spinButtonOptions: {
      value: 30
    }
  });
  container.appendChild(disabledSpinRow);
</script>
```

## Web Component: `<adw-spin-row>`

A declarative way to define Adwaita spin button rows.

**HTML Tag:** `<adw-spin-row>`

**Attributes:**

*   `title` (String, required): The main title/label.
*   `subtitle` (String, optional): Subtitle text.
*   `value` (Number, optional): Initial value for the spin button.
*   `min` (Number, optional): Minimum value for the spin button.
*   `max` (Number, optional): Maximum value for the spin button.
*   `step` (Number, optional): Step increment/decrement for the spin button.
*   `disabled` (Boolean, optional): If present, disables the entire row.

**Properties:**

*   `value` (Number): Gets or sets the value of the internal spin button.
*   `min`, `max`, `step`, `disabled` also available as properties.

**Events:**

*   `value-changed`: Fired when the spin button's value changes. `event.detail` contains `{ value: Number }`. (Verify actual event name from component implementation).

**Example:**

```html
<adw-list-box style="max-width: 500px;">
  <adw-spin-row
    title="Adjust Brightness"
    subtitle="Screen brightness level"
    min="0"
    max="100"
    step="5"
    value="75"
    id="brightness-spin-row">
  </adw-spin-row>

  <adw-spin-row
    title="Retry Attempts"
    min="1"
    max="5"
    value="3">
  </adw-spin-row>

  <adw-spin-row
    title="Sample Rate (kHz)"
    value="44"
    disabled> <!-- Disables the whole row -->
  </adw-spin-row>
</adw-list-box>

<script>
  const brightnessRow = document.getElementById('brightness-spin-row');
  brightnessRow.addEventListener('value-changed', (event) => { // Assuming 'value-changed'
    console.log("Brightness SpinRow new value:", event.detail.value);
  });

  // Programmatically update value
  // setTimeout(() => { brightnessRow.value = 50; }, 2000);
</script>
```

## Styling

*   Primary SCSS: `scss/_spin_row.scss` (if it exists), and inherits from `_spin_button.scss`, `_listbox.scss`, `_row_types.scss`.
*   The layout typically places the title/subtitle block to the left and the spin button control to the right.
*   The `disabled` state affects the appearance of both the label part and the spin button.

---
Next: [ButtonRow](./buttonrow.md)
