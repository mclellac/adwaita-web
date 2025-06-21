# Checkbox

An AdwCheckbox is a standard checkbox input that allows users to select or deselect an option. It can be used standalone or in groups.

## JavaScript Factory: `Adw.createCheckbox()`

Creates an Adwaita-styled checkbox.

**Signature:**

```javascript
Adw.createCheckbox(options = {}) -> HTMLLabelElement (wrapper)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `label` (String, optional): Text label to display next to the checkbox.
    *   `checked` (Boolean, optional): Initial checked state. Defaults to `false`.
    *   `disabled` (Boolean, optional): If `true`, disables the checkbox. Defaults to `false`.
    *   `name` (String, optional): The `name` attribute for the underlying `<input type="checkbox">`.
    *   `value` (String, optional): The `value` attribute for the input. Defaults to "on".
    *   `onChanged` (Function, optional): Callback function executed when the checkbox state changes. Receives the `change` event as an argument, so `event.target.checked` gives the new state.

**Returns:**

*   `(HTMLLabelElement)`: The created `<label>` element which wraps the actual `<input type="checkbox">` and its visual representation.

**Example:**

```html
<div id="js-checkbox-container" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;"></div>
<script>
  const container = document.getElementById('js-checkbox-container');

  // Checkbox with label
  const rememberMeCheck = Adw.createCheckbox({
    label: "Remember me on this computer",
    name: "remember",
    onChanged: (event) => {
      Adw.createToast(`Remember me: ${event.target.checked}`);
    }
  });
  container.appendChild(rememberMeCheck);

  // Checked and disabled checkbox
  const termsCheck = Adw.createCheckbox({
    label: "I agree to the terms (already agreed)",
    checked: true,
    disabled: true,
    name: "terms_agreed"
  });
  container.appendChild(termsCheck);

  // Standalone checkbox (no label text via options)
  const standaloneCheck = Adw.createCheckbox({
    checked: false,
    onChanged: (e) => console.log("Standalone checked:", e.target.checked)
  });
  // You might wrap this with an external label:
  const externalLabel = Adw.createLabel("Enable option: ", {htmlTag: 'span'});
  const box = Adw.createBox({children: [externalLabel, standaloneCheck], align: "center"});
  container.appendChild(box)

</script>
```

## Web Component: `<adw-checkbox>`

A declarative way to define Adwaita checkboxes.

**HTML Tag:** `<adw-checkbox>`

**Attributes:**

*   `label` (String, optional): Text label displayed next to the checkbox.
*   `checked` (Boolean, optional): If present, the checkbox is initially checked.
*   `disabled` (Boolean, optional): If present, disables the checkbox.
*   `name` (String, optional): The `name` attribute for the input.
*   `value` (String, optional): The `value` attribute for the input (default "on").

**Properties:**

*   `checked` (Boolean): Gets or sets the checked state.
*   `disabled` (Boolean): Gets or sets the disabled state.
*   `name` (String): Gets or sets the name.
*   `value` (String): Gets or sets the value.

**Events:**

*   `change`: Standard HTML `change` event fired when the state changes.

**Example:**

```html
<div style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
  <adw-checkbox label="Subscribe to newsletter" name="newsletter_opt_in" id="wc-check1"></adw-checkbox>

  <adw-checkbox checked label="Enable experimental features" name="experimental"></adw-checkbox>

  <adw-checkbox disabled label="Admin access (locked)" name="admin"></adw-checkbox>

  <adw-checkbox checked disabled label="License accepted (locked)" name="license"></adw-checkbox>
</div>

<script>
  const wcCheck1 = document.getElementById('wc-check1');
  wcCheck1.addEventListener('change', (event) => {
    Adw.createToast(`Newsletter subscription: ${event.target.checked}`);
  });

  // Programmatically check a box
  // setTimeout(() => { wcCheck1.checked = true; }, 2000);
</script>
```

## Styling

*   Primary SCSS: `scss/_checkbox.scss`.
*   The component styles the visual appearance of the checkbox (the box itself and the checkmark).
*   The actual `<input type="checkbox">` is often visually hidden, and its state is reflected by custom-styled elements.
*   Focus indicators and disabled states are styled according to Adwaita guidelines.
*   Uses CSS variables like `--checkbox-bg-color`, `--checkbox-border-color`, `--accent-bg-color` (for the checkmark when active).

---
Next: [RadioButton](./radiobutton.md)
