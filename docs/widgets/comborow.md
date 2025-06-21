# ComboRow

A ComboRow is a specialized `AdwRow` that combines a label (title and optional subtitle) with a dropdown select input (a `<select>` element). It's used for selecting one option from a list within a form or settings panel, typically inside an `AdwListBox`.

## Web Component: `<adw-combo-row>`

Adwaita-Web provides the `<adw-combo-row>` Web Component for creating this type of row.

**HTML Tag:** `<adw-combo-row>`

**Attributes:**

*   `title` (String, required): The main title/label for the combo row.
*   `subtitle` (String, optional): Additional descriptive text displayed below the title.
*   `value` (String, optional): The `value` attribute of the initially selected `<option>`.
*   `disabled` (Boolean, optional): If present, disables the entire row, including the select dropdown, making it non-interactive.

**Properties:**

*   `value` (String): Gets or sets the value of the currently selected option in the dropdown.
*   `selectOptions` (Array of Objects): Gets or sets the options for the dropdown. Each object in the array should have `label` (String, for display) and `value` (String) properties.
    ```javascript
    // Example:
    // comboRowElement.selectOptions = [
    //   { label: "Option 1", value: "opt1" },
    //   { label: "Second Option", value: "opt2" },
    //   { label: "Option the Third", value: "opt3" }
    // ];
    ```
*   `disabled` (Boolean): Gets or sets the disabled state of the row.

**Events:**

*   `change`: Fired when the selected option in the dropdown changes. The `event.target.value` (or `event.detail.value` if the component dispatches a custom event) will reflect the new selected value.

**Example:**

```html
<adw-list-box style="max-width: 450px;">
  <adw-combo-row
    title="Preferred Language"
    subtitle="Select your application language"
    id="language-combo-row">
  </adw-combo-row>

  <adw-combo-row
    title="Notification Sound"
    id="sound-combo-row"
    value="ding"> <!-- Pre-select 'ding' -->
  </adw-combo-row>

  <adw-combo-row
    title="Disabled Combo"
    subtitle="This option cannot be changed"
    disabled
    id="disabled-combo-row">
  </adw-combo-row>
</adw-list-box>

<script>
  const langCombo = document.getElementById('language-combo-row');
  langCombo.selectOptions = [
    { label: "English (US)", value: "en-US" },
    { label: "Español", value: "es-ES" },
    { label: "Français", value: "fr-FR" },
    { label: "Deutsch", value: "de-DE" }
  ];
  // Set initial value after populating options, if needed
  langCombo.value = "fr-FR";

  langCombo.addEventListener('change', () => {
    Adw.createToast(`Language changed to: ${langCombo.value} (${langCombo.querySelector('select option:checked').textContent})`);
  });

  const soundCombo = document.getElementById('sound-combo-row');
  soundCombo.selectOptions = [
    { label: "Default Beep", value: "beep" },
    { label: "Chime", value: "chime" },
    { label: "Ding", value: "ding" },
    { label: "Silent", value: "silent" }
  ];
  // Value "ding" was set via attribute, so it should be selected.

  const disabledCombo = document.getElementById('disabled-combo-row');
  disabledCombo.selectOptions = [{label: "Fixed Option", value: "fixed"}];
  disabledCombo.value = "fixed";

</script>
```

## JavaScript Factory Approach (Composite)

A dedicated `Adw.createComboRow()` might not be available. If so, you would construct it by combining `Adw.createRow`, labels, and a styled `<select>` element.

**Conceptual Example:**

```javascript
function createCustomComboRow(options = {}) {
  const titleLabel = Adw.createLabel(options.title || "", { htmlTag: "span" });
  titleLabel.classList.add("adw-combo-row-title"); // Or appropriate class

  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("adw-combo-row-text-content");
  textContentDiv.appendChild(titleLabel);

  if (options.subtitle) {
    const subtitleLabel = Adw.createLabel(options.subtitle, { htmlTag: "span" });
    subtitleLabel.classList.add("adw-combo-row-subtitle");
    textContentDiv.appendChild(subtitleLabel);
  }

  const selectEl = document.createElement('select');
  selectEl.classList.add('adw-combo-row-select'); // Ensure this class is styled
  if (options.selectOptions && Array.isArray(options.selectOptions)) {
    options.selectOptions.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      selectEl.appendChild(optionEl);
    });
  }
  if (options.value) selectEl.value = options.value;
  if (options.disabled) selectEl.disabled = true; // Disable select only

  selectEl.addEventListener('change', () => {
    if (options.onChanged) {
      options.onChanged(selectEl.value);
    }
  });

  const row = Adw.createRow({
    children: [textContentDiv, selectEl],
    disabled: options.disabled || false // Disables the whole row
  });
  row.classList.add('adw-combo-row');
  if(options.disabled) row.classList.add('disabled');

  // Add methods to mimic WC properties
  row.getValue = () => selectEl.value;
  row.setValue = (val) => { selectEl.value = val; };
  // ... and for selectOptions, disabled

  return row;
}

// Usage:
const jsComboContainer = document.getElementById('js-comborow-container'); // Assuming div exists
if(jsComboContainer) {
    const myJsComboRow = createCustomComboRow({
        title: "JS Combo Row",
        selectOptions: [ {label: "Yes", value: "yes"}, {label: "No", value: "no"}],
        value: "no",
        onChanged: (value) => Adw.createToast(`JS Combo selected: ${value}`)
    });
    jsComboContainer.appendChild(myJsComboRow);
}
```
*The `<adw-combo-row>` Web Component encapsulates this logic.*

## Styling

*   Primary SCSS: `scss/_combo_row.scss` (if exists), `scss/_row_types.scss`, and potentially styles for native `<select>` elements.
*   The layout aligns the label part to the left and the select dropdown to the right.
*   The standard Adwaita styling for `<select>` elements (often subtle, matching entry fields) will apply.
*   Disabled state styles the entire row as inactive.

---
Next: [ViewSwitcher](./viewswitcher.md)
