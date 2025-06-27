# RadioButton

An AdwRadioButton is used when users need to select one option from a mutually exclusive set. Radio buttons are typically used in groups where only one can be selected at a time.

## JavaScript Factory: `Adw.createRadioButton()`

Creates an Adwaita-styled radio button.

**Signature:**

```javascript
Adw.createRadioButton(options = {}) -> HTMLLabelElement (wrapper)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `label` (String, optional): Text label to display next to the radio button.
    *   `checked` (Boolean, optional): Initial checked state. Defaults to `false`.
    *   `disabled` (Boolean, optional): If `true`, disables the radio button. Defaults to `false`.
    *   `name` (String, required): The `name` attribute for the underlying `<input type="radio">`. All radio buttons in a group must share the same `name`.
    *   `value` (String, required): The `value` attribute for the input. This value is submitted with the form if the radio button is checked.
    *   `onChanged` (Function, optional): Callback function executed when the radio button state changes (i.e., it becomes checked). Receives the `change` event.

**Returns:**

*   `(HTMLLabelElement)`: The created `<label>` element which wraps the actual `<input type="radio">` and its visual representation.

**Example:**

```html
<div id="js-radiobutton-container" style="padding: 10px;">
  <p>Choose your preferred contact method:</p>
  <div id="js-radio-group1" style="display: flex; flex-direction: column; gap: 5px;"></div>
  <p>Selected: <span id="selected-contact">None</span></p>

  <hr style="margin: 10px 0;">
  <p>Delivery Speed (disabled group example):</p>
  <div id="js-radio-group2" style="display: flex; flex-direction: column; gap: 5px;"></div>
</div>
<script>
  const radioGroup1Container = document.getElementById('js-radio-group1');
  const selectedContactSpan = document.getElementById('selected-contact');

  const radioName = "contactMethod";
  const onContactChange = (e) => {
    if(e.target.checked) selectedContactSpan.textContent = e.target.parentElement.textContent.trim();
  };

  const emailRadio = Adw.createRadioButton({
    label: "Email", name: radioName, value: "email", checked: true, onChanged: onContactChange
  });
  const phoneRadio = Adw.createRadioButton({
    label: "Phone", name: radioName, value: "phone", onChanged: onContactChange
  });
  const mailRadio = Adw.createRadioButton({
    label: "Mail (Post)", name: radioName, value: "post", onChanged: onContactChange
  });

  radioGroup1Container.append(emailRadio, phoneRadio, mailRadio);
  if(emailRadio.querySelector('input').checked) selectedContactSpan.textContent = "Email";


  const radioGroup2Container = document.getElementById('js-radio-group2');
  const speedRadioName = "deliverySpeed";
  radioGroup2Container.append(
    Adw.createRadioButton({ label: "Standard (5-7 days)", name: speedRadioName, value: "standard", checked: true, disabled: true }),
    Adw.createRadioButton({ label: "Express (2-3 days)", name: speedRadioName, value: "express", disabled: true })
  );
</script>
```

## Web Component: `<adw-radio-button>`

A declarative way to define Adwaita radio buttons.

**HTML Tag:** `<adw-radio-button>`

**Attributes:**

*   `label` (String, optional): Text label displayed next to the radio button.
*   `checked` (Boolean, optional): If present, the radio button is initially selected.
*   `disabled` (Boolean, optional): If present, disables the radio button.
*   `name` (String, required): The name for the radio group. All related radio buttons must have the same name.
*   `value` (String, required): The value associated with this radio button.

**Properties:**

*   `checked` (Boolean): Gets or sets the checked state.
*   `disabled` (Boolean): Gets or sets the disabled state.
*   `name` (String): Gets or sets the name.
*   `value` (String): Gets or sets the value.

**Events:**

*   `change`: Standard HTML `change` event fired when the state changes.

**Example:**

```html
<div style="padding: 10px;">
  <fieldset>
    <legend>Select Output Format:</legend>
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <adw-radio-button name="outputFormat" value="json" label="JSON" id="wc-radio-json" checked></adw-radio-button>
      <adw-radio-button name="outputFormat" value="xml" label="XML" id="wc-radio-xml"></adw-radio-button>
      <adw-radio-button name="outputFormat" value="csv" label="CSV" id="wc-radio-csv"></adw-radio-button>
      <adw-radio-button name="outputFormat" value="text" label="Plain Text (Disabled)" disabled></adw-radio-button>
    </div>
  </fieldset>
  <p>Current format: <span id="current-format">JSON</span></p>
</div>

<script>
  const formatRadios = document.querySelectorAll('adw-radio-button[name="outputFormat"]');
  const currentFormatSpan = document.getElementById('current-format');

  formatRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
      if (event.target.checked) {
        currentFormatSpan.textContent = event.target.value.toUpperCase();
        Adw.createToast(`Format set to: ${event.target.value}`);
      }
    });
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_radio.scss`.
*   Styles the visual appearance of the radio button (the circle and the inner dot for selection).
*   The actual `<input type="radio">` is often visually hidden, with its state reflected by custom-styled elements.
*   Focus indicators and disabled states are styled according to Adwaita guidelines.
*   Uses CSS variables like `--radio-bg-color`, `--radio-border-color`, `--accent-bg-color` (for the selected state).

---
Next: [Label](./label.md)
