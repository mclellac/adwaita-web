# Row

A Row is a list item container, typically used within an `AdwListBox` or for creating form-like structures. It arranges its children horizontally and can have interactive states. Adwaita-Web provides `Adw.createRow()` and the `<adw-row>` Web Component.

Many specialized rows like `AdwActionRow`, `AdwEntryRow`, `AdwSwitchRow`, etc., are built upon or share characteristics with this basic Row.

## JavaScript Factory: `Adw.createRow()`

Creates an Adwaita-styled row element.

**Signature:**

```javascript
Adw.createRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `children` (Array<HTMLElement>, optional): An array of child elements for the row. *Security: Ensure children are trusted or sanitized.*
    *   `activated` (Boolean, optional): If `true`, applies an 'activated' class, often for selection indication. Defaults to `false`.
    *   `interactive` (Boolean, optional): If `true`, applies an 'interactive' class for hover effects and makes the row focusable if `onClick` is provided. Defaults to `false`.
    *   `onClick` (Function, optional): Click handler. If provided and `interactive` is `true` (or implicitly set by providing `onClick`), the row becomes keyboard-activatable (Enter/Space).

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the row.

**Example:**

```html
<div id="js-row-listbox-container" style="max-width: 350px;">
  <!-- AdwListBox would typically wrap these -->
</div>
<script>
  const container = document.getElementById('js-row-listbox-container');

  // Simple row with text
  const row1Content = Adw.createLabel("Simple Row Content");
  const row1 = Adw.createRow({ children: [row1Content] });
  container.appendChild(row1);

  // Interactive row with an icon and text
  const row2Icon = document.createElement('span'); // Using a simple span for icon placeholder
  row2Icon.className = 'icon'; // Add your icon class or SVG here
  row2Icon.innerHTML = '<svg viewBox="0 0 16 16"><path d="M8 0a8Z"/></svg>'; // Shortened
  const row2Label = Adw.createLabel("Clickable Row");
  const row2Children = [row2Icon, row2Label];
  const row2Box = Adw.createBox({children: row2Children, spacing: "s", align: "center"});

  const row2 = Adw.createRow({
    children: [row2Box],
    interactive: true,
    onClick: () => Adw.createToast("Row 2 clicked!")
  });
  container.appendChild(row2);

  // Activated (selected) row
  const row3Label = "This row is activated/selected.";
  const row3Content = Adw.createLabel(row3Label);
  const row3 = Adw.createRow({
    children: [row3Content],
    activated: true,
    interactive: true // Often activated rows are also interactive
  });
  container.appendChild(row3);
</script>
```

## Web Component: `<adw-row>`

A declarative way to use Adwaita row elements.

**HTML Tag:** `<adw-row>`

**Attributes:**

*   `activated` (Boolean, optional): If present, applies 'activated' styling.
*   `interactive` (Boolean, optional): If present, applies hover effects and makes the row focusable and clickable. An `onClick` handler should be attached via JavaScript if specific actions are needed.

**Slots:**

*   Default slot: Content of the row. Typically, this would be a combination of labels, icons, or other Adwaita components.

**Events:**
*   `click`: Standard click event if the row is interactive.

**Example:**

```html
<adw-list-box style="max-width: 400px;">
  <adw-row interactive id="wc-row-1">
    <adw-label title-level="2">Web Component Row 1</adw-label>
    <p>Some descriptive text for the row.</p>
  </adw-row>

  <adw-row activated interactive id="wc-row-2">
    <adw-box align="center" spacing="m">
      <!-- Placeholder for an icon -->
      <span style="font-size: 24px;">⭐</span>
      <adw-label>Selected Item</adw-label>
    </adw-box>
  </adw-row>

  <adw-row>
    This is a non-interactive row.
  </adw-row>
</adw-list-box>

<script>
  document.getElementById('wc-row-1').addEventListener('click', () => {
    Adw.createToast("Web Component Row 1 was clicked!");
  });
  document.getElementById('wc-row-2').addEventListener('click', () => {
    Adw.createToast("Activated Web Component Row 2 was clicked!");
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_listbox.scss` (as rows are fundamental to listboxes) and `scss/_row_types.scss` (for general row styling).
*   Variables:
    *   Uses general theme variables for background, text colors.
    *   Specific variables like `--list-row-hover-bg-color`, `--list-row-active-bg-color` might be defined.
*   Rows typically have padding and a bottom border when part of a listbox.
*   The `interactive` class adds hover feedback.
*   The `activated` class provides a distinct background to indicate selection.

---
Next: [ListBox](./listbox.md) (as it's closely related to Row)
