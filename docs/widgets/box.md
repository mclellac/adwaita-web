# Box

A Box is a fundamental layout container that arranges its child elements in a single line, either horizontally or vertically. It's based on CSS Flexbox. Adwaita-Web provides `Adw.createBox()` and the `<adw-box>` Web Component.

## JavaScript Factory: `Adw.createBox()`

Creates an Adwaita-styled box container.

**Signature:**

```javascript
Adw.createBox(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `orientation` (String, optional): Flex direction. Can be `"horizontal"` (default) or `"vertical"`.
    *   `align` (String, optional): `align-items` value. Common values: `"start"`, `"center"`, `"end"`, `"stretch"`, `"baseline"`.
    *   `justify` (String, optional): `justify-content` value. Common values: `"start"`, `"center"`, `"end"`, `"between"` (space-between), `"around"` (space-around), `"evenly"` (space-evenly).
    *   `spacing` (String, optional): Gap spacing between children. Maps to Adwaita spacing variables (e.g., `"xs"`, `"s"`, `"m"`, `"l"`, `"xl"`) or a direct CSS value like `"10px"`. If using predefined spacing like "m", it typically maps to a CSS variable like `var(--spacing-m)`.
    *   `fillChildren` (Boolean, optional): If `true`, children will grow to fill available space along the main axis (applies `flex-grow: 1` to children via a class). Defaults to `false`.
    *   `children` (Array<HTMLElement>, optional): An array of HTML elements to append as children to the box. *Security: Ensure children are trusted or sanitized if user-generated.*

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the box.

**Example:**

```html
<div id="js-box-container"></div>
<script>
  const container = document.getElementById('js-box-container');

  // Horizontal box with spacing and centered alignment
  const hbox = Adw.createBox({
    orientation: "horizontal",
    spacing: "m", // uses var(--spacing-m)
    align: "center",
    children: [
      Adw.createButton("Button 1"),
      Adw.createLabel("Some Text"),
      Adw.createEntry({ placeholder: "Input..." })
    ]
  });
  container.appendChild(hbox);

  // Vertical box
  const vbox = Adw.createBox({
    orientation: "vertical",
    spacing: "s",
    fillChildren: true, // Children will try to expand vertically
    children: [
      Adw.createButton("Top Button (fills)"),
      Adw.createButton("Bottom Button (fills)")
    ]
  });
  vbox.style.height = "150px"; // Give vbox a height to see fillChildren effect
  vbox.style.border = "1px solid var(--borders-color)";
  container.appendChild(vbox);
</script>
```

## Web Component: `<adw-box>`

A declarative way to use Adwaita box containers.

**HTML Tag:** `<adw-box>`

**Attributes:**

*   `orientation` (String, optional): `"horizontal"` (default) or `"vertical"`.
*   `spacing` (String, optional): Spacing preset (e.g., `"xs"`, `"s"`, `"m"`, `"l"`, `"xl"`) or a CSS value.
*   `align` (String, optional): `align-items` value (e.g., `"start"`, `"center"`, `"end"`, `"stretch"`).
*   `justify` (String, optional): `justify-content` value (e.g., `"start"`, `"center"`, `"end"`, `"between"`).
*   `fill-children` (Boolean, optional): If present, children will attempt to grow to fill space.

**Slots:**

*   Default slot: Child elements to be arranged by the box.

**Example:**

```html
<!-- Horizontal box with medium spacing, items centered vertically -->
<adw-box orientation="horizontal" spacing="m" align="center" style="border: 1px solid var(--borders-color); padding: 5px;">
  <adw-button suggested>Save</adw-button>
  <adw-label>Status: OK</adw-label>
  <adw-spinner active size="small"></adw-spinner>
</adw-box>

<br/>

<!-- Vertical box, children stretched horizontally -->
<adw-box orientation="vertical" spacing="s" align="stretch" style="border: 1px solid var(--borders-color); padding: 5px; width: 200px;">
  <adw-button>First Item</adw-button>
  <adw-entry placeholder="Type here..."></adw-entry>
  <adw-button flat>Last Item</adw-button>
</adw-box>

<br/>

<!-- Horizontal box where children fill available width -->
<adw-box orientation="horizontal" spacing="xs" fill-children style="border: 1px solid var(--borders-color); padding: 5px; width: 100%;">
  <adw-button style="min-width: 100px;">A</adw-button> <!-- flex-grow will be applied -->
  <adw-label style="text-align: center;">B (Centered)</adw-label>
  <adw-button style="min-width: 100px;">C</adw-button>
</adw-box>
```

## Styling

*   Primary SCSS: `scss/_box.scss`
*   The component primarily uses CSS Flexbox properties (`display: flex`, `flex-direction`, `gap`, `align-items`, `justify-content`).
*   Spacing classes like `adw-box-spacing-m` apply CSS variables like `var(--spacing-m)` to the `gap` property.
*   `adw-box-fill-children` class makes direct children of the box have `flex-grow: 1`.

---
Next: [Row](./row.md)
