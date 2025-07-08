# ComboRow

A ComboRow is a specialized `AdwRow` that combines a label (title and optional
subtitle) with a dropdown select input (a `<select>` element). It's used for
selecting one option from a list within a form or settings panel, typically
inside an `AdwListBox`.

## Web Component: `<adw-combo-row>`

Adwaita-Web provides the `<adw-combo-row>` Web Component for creating this type of row.

*(Note: Previous versions of this documentation may have described or implied a JavaScript factory like `Adw.createComboRow()`. As of the current review, a direct factory function for ComboRow was not found in the core `adwaita-web/js` source. Usage should primarily rely on the `<adw-combo-row>` Web Component or by applying CSS classes to a manually constructed HTML structure as detailed in the "Styling" section.)*

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
    const selectedLabel = langCombo.querySelector('select option:checked').textContent;
    Adw.createToast(`Language changed to: ${langCombo.value} (${selectedLabel})`);
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

## Styling

*   **SCSS Sources:** `scss/_combo_row.scss` and the `AdwComboRow` section in `scss/_row_types.scss`.
*   **Key Classes and Structure:**
    *   The `.adw-combo-row` class is the main container, typically styled like an `AdwActionRow`.
    *   **Manual HTML Structure (if not using Web Component):**
        ```html
        <div class="adw-combo-row">
          <div class="adw-combo-row__text-content"> <!-- Or adw-action-row-content -->
            <span class="adw-combo-row__title">Label Title</span>
            <span class="adw-combo-row__subtitle">Optional Subtitle</span>
          </div>
          <select class="adw-combo-row-select">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>
          <!-- The chevron might be part of the select's default UI,
               or could be a separate .adw-combo-row__button span if native arrow is hidden -->
        </div>
        ```
    *   **Web Component `<adw-combo-row>`:** This component likely generates an internal structure that utilizes these (or similar) classes. Refer to its specific implementation if you need to target internal parts not exposed via attributes/properties.
    *   `.adw-combo-row__title`, `.adw-combo-row__subtitle`: Style the text parts.
    *   `.adw-combo-row-select` (from `_row_types.scss`): This class is crucial for styling the native `<select>` element. It gives it a subtle bottom border, removes default browser appearance for cleaner integration, and applies an accent color border on focus.
    *   `.adw-combo-row__selected-value` (from `_combo_row.scss`): An optional element to display the selected value text separately, often to the right.
    *   `.adw-combo-row__button` (from `_combo_row.scss`): Styles a chevron icon, useful if the native dropdown arrow of `<select>` is hidden (which is complex and often avoided for native `<select>`).
*   **Theming:**
    *   The row itself inherits ActionRow theming (background, hover, active states).
    *   The `<select>` element (`.adw-combo-row-select`) uses `var(--borders-color)` for its bottom border and `var(--accent-color)` for the border on focus.
    *   Disabled state styles the entire row and the select element as inactive (e.g., dashed border for select, opacity).

---
Next: [ViewSwitcher](./viewswitcher.md)
