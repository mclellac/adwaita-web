# WrapBox

An AdwWrapBox is a layout container that arranges its children in a line (horizontally or vertically) and wraps them to new lines as needed if there isn't enough space. It's based on CSS Flexbox with `flex-wrap: wrap`.

## JavaScript Factory: `Adw.createWrapBox()`

Creates an Adwaita-styled wrap box container.

**Signature:**

```javascript
Adw.createWrapBox(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `children` (Array<HTMLElement>, optional): Child elements to add to the
        wrap box.
    *   `orientation` (String, optional): Main layout direction before wrapping.
        Can be `"horizontal"` (default) or `"vertical"`.
    *   `spacing` (String | Number, optional): Gap between items along the main
        axis and cross axis if `lineSpacing` is not set. Can be a predefined
        Adwaita spacing unit (e.g., "s", "m") or a CSS value (e.g., "10px",
        10 for 10px). Defaults to a medium spacing.
    *   `lineSpacing` (String | Number, optional): Gap between lines of wrapped
        items (cross-axis spacing). If not set, `spacing` is used for both item
        and line gaps.
    *   `align` (String, optional): `align-items` value (cross-axis alignment of
        items within a line). E.g., `"start"`, `"center"`, `"end"`, `"stretch"`.
        Defaults to `"start"`.
    *   `justify` (String, optional): `justify-content` value (main-axis
        alignment of items within a line). E.g., `"start"`, `"center"`, `"end"`,
        `"between"`. Defaults to `"start"`.
    *   *Note: `align-content` (for alignment of wrapped lines) might also be
        configurable or default to stretch/start.*

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the wrap box.

**Example:**

```html
<div id="js-wrapbox-container" style="border: 1px solid var(--borders-color); padding: var(--spacing-s); max-width: 350px;">
  <p>Horizontal WrapBox (default):</p>
</div>
<div id="js-wrapbox-container-vertical" style="border: 1px solid var(--borders-color); padding: var(--spacing-s); max-width: 200px; height: 150px; margin-top: 10px;">
  <p>Vertical WrapBox:</p>
</div>

<script>
  const hContainer = document.getElementById('js-wrapbox-container');
  const vContainer = document.getElementById('js-wrapbox-container-vertical');

  const items = [];
  for (let i = 1; i <= 8; i++) {
    items.push(Adw.createButton(`Item ${i}`, { flat: true, style: "min-width: 80px;" }));
  }

  // Horizontal WrapBox
  const hWrapBox = Adw.createWrapBox({
    children: items.map(item => item.cloneNode(true)), // Pass clones if items array is reused
    spacing: "s", // "var(--spacing-s)" for gap
    align: "center"
  });
  hContainer.appendChild(hWrapBox);

  // Vertical WrapBox (needs explicit height on container to demonstrate wrapping)
  const vWrapBox = Adw.createWrapBox({
    children: items.slice(0,5).map(item => {
        const btn = item.cloneNode(true);
        btn.style.width = "100%"; // Make buttons take full width of column
        return btn;
    }),
    orientation: "vertical",
    spacing: "xs",
    lineSpacing: "m", // Different spacing between columns
    align: "stretch" // Stretch items in the cross axis (horizontally here)
  });
  vContainer.appendChild(vWrapBox);
</script>
```

## Web Component: `<adw-wrap-box>`

A declarative way to use Adwaita wrap box containers.

**HTML Tag:** `<adw-wrap-box>`

**Attributes:**

*   `orientation` (String, optional): `"horizontal"` (default) or `"vertical"`.
*   `spacing` (String, optional): Spacing preset (e.g., `"xs"`, `"s"`, `"m"`) or a CSS value for gap between items.
*   `line-spacing` (String, optional): Spacing preset or CSS value for gap between wrapped lines.
*   `align` (String, optional): `align-items` value (e.g., `"start"`, `"center"`, `"end"`, `"stretch"`).
*   `justify` (String, optional): `justify-content` value (e.g., `"start"`, `"center"`, `"end"`, `"between"`).

**Slots:**

*   Default slot: Child elements to be arranged by the wrap box.

**Example:**

```html
<p>Horizontal Wrapping (default):</p>
<adw-wrap-box spacing="m" align="start" style="border: 1px solid var(--borders-color); padding: var(--spacing-s); max-width: 400px;">
  <adw-button style="width: 120px;">Button 1</adw-button>
  <adw-button style="width: 150px;">Button Two</adw-button>
  <adw-button style="width: 100px;">Item C</adw-button>
  <adw-button style="width: 180px;">Another Button</adw-button>
  <adw-entry placeholder="Input field" style="width: 150px;"></adw-entry>
</adw-wrap-box>

<p style="margin-top: 1em;">Vertical Wrapping (items form new columns):</p>
<adw-wrap-box orientation="vertical" spacing="s" line-spacing="l" align="stretch"
              style="border: 1px solid var(--borders-color); padding: var(--spacing-s); height: 120px; width: 300px;">
  <adw-button>Alpha</adw-button>
  <adw-button>Beta</adw-button>
  <adw-button>Gamma</adw-button>
  <adw-button>Delta</adw-button>
  <adw-button>Epsilon</adw-button>
</adw-wrap-box>
```

## Styling

*   Primary SCSS: `scss/_wrap_box.scss`.
*   The component uses CSS Flexbox with `flex-wrap: wrap;`.
*   `gap`, `row-gap`, `column-gap` are used for spacing based on `spacing` and `line-spacing` attributes.
*   `align-items` and `justify-content` are set based on `align` and `justify` attributes.
*   `flex-direction` is set based on the `orientation` attribute.

---
Next: [Clamp](./clamp.md)
