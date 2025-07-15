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

*   `options` (Object, optional): Configuration options. The factory function will add appropriate CSS classes to the `<adw-box>` element based on these options:
    *   `orientation` (String, optional): Adds `"adw-box-horizontal"` (default) or `"adw-box-vertical"`.
    *   `align` (String, optional): Adds class like `"align-center"` (e.g., `"start"`, `"center"`, `"end"`).
    *   `justify` (String, optional): Adds class like `"justify-between"` (e.g., `"start"`, `"center"`, `"between"`).
    *   `spacing` (String, optional): Adds class like `"adw-box-spacing-m"` (e.g., `"s"`, `"m"`, or a CSS value - though presets are preferred for classes).
    *   `fillChildren` (Boolean, optional): If `true`, adds class `"adw-box-fill-children"`.
    *   `children` (Array<Node>, optional): An array of DOM nodes to append as children to the created `<adw-box>` element. These will be handled by the default slot.

**Returns:**

*   `(AdwBoxElement)`: The created `<adw-box>` Web Component instance, with CSS classes applied.

**Example:**

```html
<div id="js-box-container"></div>
<script>
  // Assuming createAdwBox is globally available or Adw.Box.factory
  const container = document.getElementById('js-box-container');

  // Horizontal box with spacing and centered alignment
  const hbox = createAdwBox({
    orientation: "horizontal", // results in class "adw-box-horizontal"
    spacing: "m",          // results in class "adw-box-spacing-m"
    align: "center"          // results in class "align-center"
  });
  // Append children (which are now also Web Components or standard elements)
  hbox.appendChild(createAdwButton("Button 1")); // Assuming createAdwButton exists
  const label = document.createElement('adw-label');
  label.textContent = "Some Text";
  hbox.appendChild(label);
  container.appendChild(hbox);

  // Vertical box
  const vbox = createAdwBox({
    orientation: "vertical", // results in class "adw-box-vertical"
    spacing: "s",          // results in class "adw-box-spacing-s"
    fillChildren: true     // results in class "adw-box-fill-children"
  });
  vbox.appendChild(createAdwButton("Top Button (fills)"));
  vbox.appendChild(createAdwButton("Bottom Button (fills)"));

  vbox.style.height = "150px"; // Give vbox a height to see fillChildren effect
  vbox.style.border = "1px solid var(--borders-color)";
  container.appendChild(vbox);
</script>
```

## Web Component: `<adw-box>`

A declarative way to use Adwaita box containers. Styling and behavior are controlled by applying CSS classes.

**HTML Tag:** `<adw-box>`

**CSS Classes for Styling:**

*   **Base Class:** `adw-box` (should always be present on the element you want to act as a box, often the `<adw-box>` custom element itself, or a `div` inside it if the custom element is just a slot provider).
*   **Orientation:**
    *   `adw-box-horizontal` (default if neither is specified on a plain `div.adw-box`)
    *   `adw-box-vertical`
*   **Spacing (Gap):**
    *   `adw-box-spacing-xs`
    *   `adw-box-spacing-s`
    *   `adw-box-spacing-m`
    *   `adw-box-spacing-l`
    *   `adw-box-spacing-xl`
*   **Alignment (`align-items`):**
    *   `align-start`
    *   `align-center`
    *   `align-end`
    *   `align-stretch`
*   **Justification (`justify-content`):**
    *   `justify-start`
    *   `justify-center`
    *   `justify-end`
    *   `justify-between`
    *   `justify-around`
    *   `justify-evenly`
*   **Fill Children:**
    *   `adw-box-fill-children` (children will attempt to grow to fill space)

**Slots:**

*   Default slot: Child elements to be arranged by the box.

**Example:**

```html
<!-- Horizontal box with medium spacing, items centered vertically -->
<adw-box class="adw-box adw-box-horizontal adw-box-spacing-m align-center" style="border: 1px solid var(--borders-color); padding: 5px;">
  <adw-button suggested>Save</adw-button>
  <adw-label>Status: OK</adw-label>
  <adw-spinner active size="small"></adw-spinner>
</adw-box>

<br/>

<!-- Vertical box, children stretched horizontally -->
<adw-box class="adw-box adw-box-vertical adw-box-spacing-s align-stretch" style="border: 1px solid var(--borders-color); padding: 5px; width: 200px;">
  <adw-button>First Item</adw-button>
  <adw-entry placeholder="Type here..."></adw-entry>
  <adw-button flat>Last Item</adw-button>
</adw-box>

<br/>

<!-- Horizontal box where children fill available width -->
<adw-box class="adw-box adw-box-horizontal adw-box-spacing-xs adw-box-fill-children"
           style="border: 1px solid var(--borders-color); padding: 5px; width: 100%;">
  <adw-button style="min-width: 100px;">A</adw-button> <!-- flex-grow will be applied -->
  <adw-label style="text-align: center;">B (Centered)</adw-label>
  <adw-button style="min-width: 100px;">C</adw-button>
</adw-box>
```

## Styling

*   Primary SCSS: `scss/_box.scss`
*   The component relies on CSS Flexbox properties (`display: flex`, `flex-direction`, `gap`, `align-items`, `justify-content`) applied through the utility classes.
*   Spacing classes like `adw-box-spacing-m` apply CSS variables like `var(--spacing-m)` to the `gap` property.
*   `adw-box-fill-children` class makes direct children of the box have `flex-grow: 1`.

---
Next: [Row](./row.md)
