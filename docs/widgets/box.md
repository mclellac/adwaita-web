# Box

A Box is a fundamental layout container that arranges its child elements in a single line, either horizontally or vertically. It's based on CSS Flexbox. Adwaita-Web provides `Adw.createBox()` and the `<adw-box>` Web Component.

## JavaScript Factory: `Adw.Box.factory()` or `createAdwBox()`

Creates an `<adw-box>` Web Component instance.

**Signature:**

```javascript
Adw.Box.factory(options = {}) -> AdwBoxElement // Assuming AdwBoxElement is the class for <adw-box>
// or createAdwBox(options = {}) -> AdwBoxElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options, mapped to attributes of the `<adw-box>`:
    *   `orientation` (String, optional): Sets the `orientation` attribute (`"horizontal"` or `"vertical"`).
    *   `align` (String, optional): Sets the `align` attribute (e.g., `"start"`, `"center"`, `"end"`).
    *   `justify` (String, optional): Sets the `justify` attribute (e.g., `"start"`, `"center"`, `"between"`).
    *   `spacing` (String, optional): Sets the `spacing` attribute (e.g., `"s"`, `"m"`, or a CSS value).
    *   `fillChildren` (Boolean, optional): If `true`, sets the `fill-children` attribute.
    *   `children` (Array<Node>, optional): An array of DOM nodes to append as children to the created `<adw-box>` element. These will be handled by the default slot.

**Returns:**

*   `(AdwBoxElement)`: The created `<adw-box>` Web Component instance.

**Example:**

```html
<div id="js-box-container"></div>
<script>
  // Assuming createAdwBox is globally available or Adw.Box.factory
  const container = document.getElementById('js-box-container');

  // Horizontal box with spacing and centered alignment
  const hbox = createAdwBox({
    orientation: "horizontal",
    spacing: "m",
    align: "center"
  });
  // Append children (which are now also Web Components or standard elements)
  hbox.appendChild(createAdwButton("Button 1")); // Assuming createAdwButton exists
  const label = document.createElement('adw-label'); // Example: createAdwLabel might not exist yet
  label.textContent = "Some Text";
  hbox.appendChild(label);
  // hbox.appendChild(createAdwEntry({ placeholder: "Input..." })); // If createAdwEntry exists
  container.appendChild(hbox);

  // Vertical box
  const vbox = createAdwBox({
    orientation: "vertical",
    spacing: "s",
    fillChildren: true // Sets the fill-children attribute
  });
  vbox.appendChild(createAdwButton("Top Button (fills)"));
  vbox.appendChild(createAdwButton("Bottom Button (fills)"));

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
<adw-box orientation="horizontal" spacing="xs" fill-children
           style="border: 1px solid var(--borders-color); padding: 5px; width: 100%;">
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
