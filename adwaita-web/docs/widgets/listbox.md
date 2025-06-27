# ListBox

A ListBox is a container used to display a list of `AdwRow` (or row-like)
elements. It groups rows together, often with a distinct visual style like a
card or a bordered list. Adwaita-Web provides `Adw.createListBox()` and the
`<adw-list-box>` Web Component.

## JavaScript Factory: `Adw.createListBox()`

Creates an Adwaita-styled listbox container.

**Signature:**

```javascript
Adw.createListBox(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `children` (Array<HTMLElement>, optional): An array of row elements
        (e.g., created with `Adw.createRow()`, `Adw.createActionRow()`) to
        populate the listbox.
    *   `isFlat` (Boolean, optional): If `true`, removes the default box-shadow/card
        appearance, making it look more like a simple list. Defaults to `false`.
    *   `selectable` (Boolean, optional): If `true`, indicates that rows within the
        listbox can be selected. This might add specific ARIA attributes or
        visual cues, but selection logic is typically handled by the rows
        themselves or application code. Defaults to `false`.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the listbox.

**Example:**

```html
<div id="js-listbox-container" style="max-width: 400px;"></div>
<script>
  const container = document.getElementById('js-listbox-container');

  // Create some rows
  const row1 = Adw.createActionRow({
    title: "General Settings", subtitle: "Network, Display, Sound"
  });
  const row2 = Adw.createEntryRow({ title: "Username" });
  const row3 = Adw.createSwitchRow({ // Assuming AdwSwitchRow exists
    title: "Enable Notifications", active: true
  });

  // Create a ListBox with these rows
  const myListBox = Adw.createListBox({
    children: [row1, row2, row3],
    selectable: true // Indicates rows can be selected
  });
  container.appendChild(myListBox);

  // Example of a flat listbox
  const flatListBox = Adw.createListBox({
    isFlat: true,
    children: [
      Adw.createRow({ children: [Adw.createLabel("Item A")] }),
      Adw.createRow({ children: [Adw.createLabel("Item B")] })
    ]
  });
  container.appendChild(document.createElement('br')); // Separator
  container.appendChild(flatListBox);
</script>
```
*(Note: `Adw.createSwitchRow` is assumed from `js/components.js` structure; if not present, a generic `Adw.createRow` with an `Adw.createSwitch` would be used).*

## Web Component: `<adw-list-box>`

A declarative way to create Adwaita listboxes.

**HTML Tag:** `<adw-list-box>`

**Attributes:**

*   `flat` (Boolean, optional): If present, removes the default card/shadowed appearance.
*   `selectable` (Boolean, optional): If present, indicates rows can be selected. Adds appropriate ARIA roles.

**Slots:**

*   Default slot: This is where you place `<adw-row>`, `<adw-action-row>`, `<adw-entry-row>`, etc., elements.

**Example:**

```html
<adw-list-box selectable style="max-width: 450px;">
  <adw-action-row title="Appearance" subtitle="Themes, Fonts, Backgrounds">
    <!-- Icon could be slotted here if ActionRow supports it -->
  </adw-action-row>

  <adw-entry-row title="Device Name" value="My Laptop"></adw-entry-row>

  <adw-switch-row title="Automatic Updates" active></adw-switch-row>

  <adw-row interactive>
    <adw-label>Custom Row with Details</adw-label>
    <!-- More complex content -->
  </adw-row>
</adw-list-box>

<br/>

<adw-list-box flat style="max-width: 450px;">
  <adw-row><adw-label>Flat List Item 1</adw-label></adw-row>
  <adw-row><adw-label>Flat List Item 2</adw-label></adw-row>
</adw-list-box>
```

## Styling

*   Primary SCSS: `scss/_listbox.scss`
*   Variables:
    *   Uses general theme variables like `--view-bg-color` (often for the listbox background if not flat), `--borders-color`.
    *   May use `--card-bg-color` or similar if it has a card-like appearance.
    *   `--list-row-separator-color` for the lines between rows.
*   Rows within a listbox are typically separated by a border.
*   The `flat` style removes outer borders/shadows and might adjust row separator styles.
*   If `selectable`, it often sets `role="listbox"` on the main element, and rows might get `role="option"`.

---
Next: [ActionRow](./actionrow.md) (as it's a common type of row used in ListBoxes)
