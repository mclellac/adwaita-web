# SwitchRow

A SwitchRow is a specialized `AdwRow` that combines a label (title and optional subtitle) with an `AdwSwitch` toggle. It's commonly used in settings or preference panels within an `AdwListBox`.

## Web Component: `<adw-switch-row>`

Adwaita-Web provides the `<adw-switch-row>` Web Component as the primary way to create this type of row declaratively.

**HTML Tag:** `<adw-switch-row>`

**Attributes:**

*   `title` (String, required): The main title/label for the switch.
*   `subtitle` (String, optional): Additional descriptive text displayed below the title.
*   `active` (Boolean, optional): If present, the switch is initially turned on (checked).
*   `disabled` (Boolean, optional): If present, disables the entire row, including the switch, making it non-interactive.

**Properties:**

*   `active` (Boolean): Gets or sets the active (checked) state of the switch.
*   `disabled` (Boolean): Gets or sets the disabled state of the row.

**Events:**

*   `change`: Fired when the switch's state (`active` property) changes. The `event.target.active` will reflect the new state.

**Example:**

```html
<adw-list-box style="max-width: 450px;">
  <adw-switch-row
    title="Enable Feature X"
    subtitle="This feature allows you to do amazing things."
    id="feature-x-switch">
  </adw-switch-row>

  <adw-switch-row
    title="Dark Mode Preference"
    active
    id="dark-mode-switch">
  </adw-switch-row>

  <adw-switch-row
    title="Advanced Option (Disabled)"
    subtitle="This option is currently unavailable."
    disabled>
  </adw-switch-row>
</adw-list-box>

<script>
  const featureXSwitch = document.getElementById('feature-x-switch');
  featureXSwitch.addEventListener('change', () => {
    const state = featureXSwitch.active ? 'ON' : 'OFF';
    Adw.createToast(`Feature X is now ${state}`);
  });

  const darkModeSwitch = document.getElementById('dark-mode-switch');
  // Example of programmatically changing the state
  setTimeout(() => {
    // darkModeSwitch.active = false;
  }, 2000);
</script>
```

## JavaScript Factory Approach (Composite)

While a dedicated `Adw.createSwitchRow()` factory function might not be explicitly listed in `Adw.*` (depending on the version of `js/components.js`), a similar row can be constructed by combining `Adw.createRow`, `Adw.createLabel` (for title/subtitle), and `Adw.createSwitch`.

**Conceptual Example:**

```javascript
function createCustomSwitchRow(options = {}) {
  const titleLabel = Adw.createLabel(options.title || "", { htmlTag: "span" });
  titleLabel.classList.add("adw-action-row-title"); // Use action row title class or specific

  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("adw-action-row-text-content"); // Or similar class
  textContentDiv.appendChild(titleLabel);

  if (options.subtitle) {
    const subtitleLabel = Adw.createLabel(options.subtitle, { htmlTag: "span" });
    subtitleLabel.classList.add("adw-action-row-subtitle");
    textContentDiv.appendChild(subtitleLabel);
  }

  const switchControl = Adw.createSwitch({
    checked: options.active || false,
    disabled: options.disabled || false, // If only switch is disabled
    onChanged: (event) => {
      if (options.onChanged) {
        options.onChanged(event.target.checked);
      }
    }
  });

  const row = Adw.createRow({
    children: [textContentDiv, switchControl],
    disabled: options.disabled || false, // Disables the whole row
    // AdwRow itself isn't typically interactive if the switch handles interaction
  });
  row.classList.add('adw-switch-row'); // Add specific class for styling alignment
  if(options.disabled) row.classList.add('disabled');

  // Helper to get/set active state for the custom row
  row.isActive = () => switchControl.querySelector('input').checked;
  row.setActive = (isActive) => {
    const input = switchControl.querySelector('input');
    if (input.checked !== isActive) {
        input.checked = isActive;
        // Manually dispatch change if needed, or let Adw.createSwitch handle it
    }
  };

  return row;
}

// Usage:
const jsSwitchRowContainer = document.getElementById('js-switchrow-container'); // Assuming this div exists
if (jsSwitchRowContainer) {
    const myJsSwitchRow = createCustomSwitchRow({
        title: "JavaScript Switch Row",
        subtitle: "Manually assembled",
        active: true,
        onChanged: (isActive) => Adw.createToast(`JS Switch is ${isActive}`)
    });
    jsSwitchRowContainer.appendChild(myJsSwitchRow);
}
```
*The `<adw-switch-row>` Web Component internally handles this composition.*

## Styling

*   Primary SCSS: `scss/_switch_row.scss` (if it exists), `scss/_action_row.scss`, `scss/_switch.scss`, and inherits from `_listbox.scss` / `_row_types.scss`.
*   The layout typically places the title/subtitle block to the left and the switch to the right, aligned vertically.
*   The `disabled` state affects the appearance of the labels and the switch.

---
Next: [ComboRow](./comborow.md)
