# SpinButton

An AdwSpinButton allows users to select a numerical value by typing it in or by using up/down arrow buttons to increment/decrement the value.

## JavaScript Factory: `Adw.createSpinButton()`

Creates an Adwaita-styled spin button control.

**Signature:**

```javascript
Adw.createSpinButton(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `value` (Number, optional): Initial value. Defaults to `0` or `min` if `min` is greater than `0`.
    *   `min` (Number, optional): Minimum allowed value. Defaults to `0`.
    *   `max` (Number, optional): Maximum allowed value. Defaults to `100`.
    *   `step` (Number, optional): The amount to increment or decrement when arrow buttons are clicked or arrow keys are used. Defaults to `1`.
    *   `onValueChanged` (Function, optional): Callback function executed when the value changes. Receives the new numerical value as an argument.
    *   `disabled` (Boolean, optional): If `true`, disables the entire control. Defaults to `false`.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` container for the spin button, which includes the text entry and the up/down buttons.

**Example:**

```html
<div id="js-spinbutton-container" style="padding: 10px; display: flex; flex-direction: column; gap: 15px; max-width: 200px;"></div>
<script>
  const container = document.getElementById('js-spinbutton-container');

  // Basic SpinButton
  const spin1 = Adw.createSpinButton({
    min: 0,
    max: 10,
    value: 5,
    onValueChanged: (value) => console.log("SpinButton 1 value:", value)
  });
  container.appendChild(Adw.createLabel("Value (0-10):"));
  container.appendChild(spin1);

  // SpinButton with different step and range
  const spin2 = Adw.createSpinButton({
    min: -10,
    max: 10,
    step: 2,
    value: 0,
    onValueChanged: (value) => Adw.createToast(`Stepped value: ${value}`)
  });
  container.appendChild(Adw.createLabel("Stepped Value (-10 to 10, step 2):"));
  container.appendChild(spin2);

  // Disabled SpinButton
  const spinDisabled = Adw.createSpinButton({
    value: 50,
    disabled: true
  });
  container.appendChild(Adw.createLabel("Disabled SpinButton:"));
  container.appendChild(spinDisabled);
</script>
```

## Web Component: `<adw-spin-button>`

A declarative way to define Adwaita spin buttons.

**HTML Tag:** `<adw-spin-button>`

**Attributes:**

*   `value` (Number, optional): Initial value.
*   `min` (Number, optional): Minimum allowed value.
*   `max` (Number, optional): Maximum allowed value.
*   `step` (Number, optional): Step increment/decrement.
*   `disabled` (Boolean, optional): If present, disables the control.

**Properties:**

*   `value` (Number): Gets or sets the current numerical value.
*   `min` (Number): Gets or sets the minimum value.
*   `max` (Number): Gets or sets the maximum value.
*   `step` (Number): Gets or sets the step value.
*   `disabled` (Boolean): Gets or sets the disabled state.

**Events:**

*   `value-changed`: Fired when the value changes. `event.detail` contains `{ value: Number }`. (Verify event name from implementation, could also be `change` or `input`).

**Example:**

```html
<div style="padding: 10px; display: flex; flex-direction: column; gap: 5px; max-width: 250px;">
  <label for="wc-spin1">Quantity (1-20):</label>
  <adw-spin-button id="wc-spin1" min="1" max="20" value="5" step="1"></adw-spin-button>

  <label for="wc-spin2">Percentage (0-100, step 5):</label>
  <adw-spin-button id="wc-spin2" min="0" max="100" value="25" step="5"></adw-spin-button>

  <label for="wc-spin-disabled">Disabled:</label>
  <adw-spin-button id="wc-spin-disabled" value="10" disabled></adw-spin-button>
</div>

<script>
  const wcSpin1 = document.getElementById('wc-spin1');
  wcSpin1.addEventListener('value-changed', (event) => { // Assuming 'value-changed' event
    console.log("WC SpinButton 1 new value:", event.detail.value);
  });

  // Programmatically change value
  setTimeout(() => {
    // wcSpin1.value = 10;
  }, 2000);
</script>
```

## Styling

*   Primary SCSS: `scss/_spin_button.scss`.
*   The control consists of an `AdwEntry` (or a similarly styled input) and two small `AdwButton` elements for increment and decrement, typically styled as flat icon buttons.
*   The buttons are usually arranged vertically next to the input field.
*   Focus and disabled states are handled for the entire composite control.

---
Next: [SpinRow](./spinrow.md)
