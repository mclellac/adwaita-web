# Checkbox

An AdwCheckbox is a standard checkbox input that allows users to select or deselect an option. It can be used standalone or in groups. Adwaita Web provides styling for checkboxes via the `.adw-checkbox` class (and wrapper) and an `<adw-checkbox>` Web Component.

*(Note: Previous versions of this documentation may have described a JavaScript factory like `Adw.createCheckbox()`. As of the current review, this specific factory function was not found in the core `adwaita-web/js` source. Usage should primarily rely on the CSS classes with the specified HTML structure, or the `<adw-checkbox>` Web Component.)*

## HTML Structure (for CSS Styling)

To style a checkbox manually, you typically wrap an `<input type="checkbox">` and its label text within a `<label>` element that has the `.adw-checkbox-wrapper` class. The input itself gets the `.adw-checkbox` class.

```html
<label class="adw-checkbox-wrapper">
  <input type="checkbox" class="adw-checkbox" name="option1" value="value1">
  Option Text
</label>
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
