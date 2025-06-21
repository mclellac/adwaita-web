# ButtonRow

An AdwButtonRow is a specialized `AdwRow` designed to hold one or more buttons, typically for form actions (like "Cancel", "Apply") or a small set of related actions. It provides specific styling to manage the layout of these buttons within a row context.

## JavaScript Factory: `Adw.createButtonRow()`

Creates an Adwaita-styled row for holding buttons.

**Signature:**

```javascript
Adw.createButtonRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `buttons` (Array<HTMLElement | Object>, optional): An array of button elements (e.g., created with `Adw.createButton()`) or button option objects (which will be used to create buttons internally).
    *   `centered` (Boolean, optional): If `true`, centers the buttons within the row. If `false` (default), buttons are typically aligned to the end (right).

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the button row.

**Example:**

```html
<div id="js-buttonrow-listbox" style="max-width: 450px;">
  <!-- AdwListBox might wrap this, or it could be standalone in a form -->
</div>
<script>
  const container = document.getElementById('js-buttonrow-listbox');

  // ButtonRow with end-aligned buttons (default)
  const formActionsRow = Adw.createButtonRow({
    buttons: [
      Adw.createButton("Cancel", { onClick: () => Adw.createToast("Cancel clicked") }),
      Adw.createButton("Apply", { onClick: () => Adw.createToast("Apply clicked") }),
      Adw.createButton("Save", { suggested: true, onClick: () => Adw.createToast("Save clicked") })
    ]
  });
  container.appendChild(formActionsRow);

  container.appendChild(document.createElement('hr')); // separator

  // ButtonRow with centered buttons
  const centeredActionsRow = Adw.createButtonRow({
    buttons: [
      { label: "Option 1", onClick: () => Adw.createToast("Option 1") }, // Pass options object
      { label: "Option 2", flat: true, onClick: () => Adw.createToast("Option 2") }
    ],
    centered: true
  });
  container.appendChild(centeredActionsRow);
</script>
```

## Web Component: `<adw-button-row>`

A declarative way to define Adwaita button rows.

**HTML Tag:** `<adw-button-row>`

**Attributes:**

*   `centered` (Boolean, optional): If present, centers the buttons within the row. Otherwise, buttons are typically end-aligned.

**Slots:**

*   Default slot: Place `adw-button` elements or standard `<button>` elements here.

**Example:**

```html
<div style="max-width: 500px; display: flex; flex-direction: column; gap: 10px;">

  <adw-list-box>
    <adw-entry-row title="Name"></adw-entry-row>
    <!-- Default: end-aligned buttons -->
    <adw-button-row>
      <adw-button id="br-cancel">Cancel</adw-button>
      <adw-button id="br-save" suggested>Save Changes</adw-button>
    </adw-button-row>
  </adw-list-box>


  <adw-button-row centered style="border-top: 1px solid var(--borders-color); padding-top: var(--spacing-s);">
    <adw-button flat>Previous</adw-button>
    <adw-button flat>Next Page</adw-button>
  </adw-button-row>

</div>

<script>
  document.getElementById('br-save').addEventListener('click', () => Adw.createToast("Save from WC ButtonRow"));
</script>
```

## Styling

*   Primary SCSS: `scss/_button_row.scss` (and inherits from `_listbox.scss` / `_row_types.scss`, uses `_button.scss`).
*   The layout uses flexbox to arrange the buttons within a container.
*   `justify-content: flex-end` is common for default alignment, and `justify-content: center` for the `centered` variant.
*   Spacing between buttons is managed by the flex container's `gap` property or margins on the buttons.
*   The row itself usually has padding appropriate for its context (e.g., within a listbox or dialog footer).

---
Next: [TabView (and its sub-components TabBar, TabButton, TabPage)](./tabview.md)
