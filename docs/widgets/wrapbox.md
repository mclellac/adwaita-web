# WrapBox

An AdwWrapBox is a layout container that arranges its children in a line (horizontally or vertically) and wraps them to new lines as needed if there isn't enough space. It's based on CSS Flexbox with `flex-wrap: wrap`.

## JavaScript Factory: `Adw.createWrapBox()`

Creates an Adwaita-styled wrap box container by creating an `<adw-wrap-box>` element and applying CSS classes.

**Signature:**

```javascript
Adw.createWrapBox(options = {}) -> AdwWrapBoxElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options. The factory function will add appropriate CSS classes to the `<adw-wrap-box>` element:
    *   `children` (Array<HTMLElement>, optional): Child elements to add to the wrap box (will be slotted).
    *   `orientation` (String, optional): Adds `"wrap-box-horizontal"` (default) or `"wrap-box-vertical"`.
    *   `spacing` (String, optional): Adds class like `"wrap-box-spacing-m"` (e.g., "xs", "s", "m", "l", "xl"). This controls the `gap` property.
    *   `lineSpacing` (String, optional): *Note: This option is not directly mapped to a separate class in the CSS-first refactor if it differs from `spacing`. `spacing` controls the overall `gap`. For distinct row/column gaps, custom styling might be needed on the element.*
    *   `align` (String, optional): Adds class like `"wrap-align-center"` (e.g., `"start"`, `"center"`, `"end"`, `"stretch"`, `"baseline"`). Controls `align-items`.
    *   `justify` (String, optional): Adds class like `"wrap-justify-between"` (e.g., `"start"`, `"center"`, `"end"`, `"between"`, `"around"`, `"evenly"`). Controls `justify-content`.

**Returns:**

*   `(AdwWrapBoxElement)`: The created `<adw-wrap-box>` Web Component instance, with CSS classes applied.

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
    children: items.map(item => item.cloneNode(true)),
    spacing: "s",
    align: "center"
  });
  hContainer.appendChild(hWrapBox);

  // Vertical WrapBox (needs explicit height on container to demonstrate wrapping)
  const vWrapBox = Adw.createWrapBox({
    children: items.slice(0,5).map(item => {
        const btn = item.cloneNode(true);
        btn.style.width = "100%";
        return btn;
    }),
    orientation: "vertical",
    spacing: "xs",
    // lineSpacing: "m", // For distinct line spacing, apply custom style for row-gap or column-gap
    align: "stretch"
  });
  // Example for custom line spacing if needed:
  // vWrapBox.style.rowGap = 'var(--spacing-m)'; // If orientation is horizontal
  // vWrapBox.style.columnGap = 'var(--spacing-m)'; // If orientation is vertical
  vContainer.appendChild(vWrapBox);
</script>
```

## Web Component: `<adw-wrap-box>`

A declarative way to use Adwaita wrap box containers. Styling and behavior are controlled by applying CSS classes directly to the `<adw-wrap-box>` element.

**HTML Tag:** `<adw-wrap-box>`

**CSS Classes for Styling:**

*   **Base Class:** `adw-wrap-box` (This class is automatically handled by the component's internal structure or should be applied to the host element if it's expected to behave as the wrap box directly).
*   **Orientation:**
    *   `wrap-box-horizontal` (default, `flex-direction: row;`)
    *   `wrap-box-vertical` (`flex-direction: column;`)
*   **Spacing (Gap):**
    *   `wrap-box-spacing-xs`
    *   `wrap-box-spacing-s`
    *   `wrap-box-spacing-m` (default gap if no spacing class is specified by the SCSS for `.adw-wrap-box` base)
    *   `wrap-box-spacing-l`
    *   `wrap-box-spacing-xl`
    *   *Note:* These classes set a uniform `gap`. If you need different `row-gap` and `column-gap` (equivalent to a distinct `line-spacing`), you may need to apply custom inline styles or additional CSS.
*   **Alignment (`align-items` on the cross-axis):**
    *   `wrap-align-start` (default)
    *   `wrap-align-center`
    *   `wrap-align-end`
    *   `wrap-align-stretch`
    *   `wrap-align-baseline`
*   **Justification (`justify-content` on the main-axis):**
    *   `wrap-justify-start` (default)
    *   `wrap-justify-center`
    *   `wrap-justify-end`
    *   `wrap-justify-between`
    *   `wrap-justify-around`
    *   `wrap-justify-evenly`

**Slots:**

*   Default slot: Child elements to be arranged by the wrap box.

**Example:**

```html
<p>Horizontal Wrapping (default):</p>
<adw-wrap-box class="adw-wrap-box wrap-box-spacing-m wrap-align-start" style="border: 1px solid var(--borders-color); padding: var(--spacing-s); max-width: 400px;">
  <adw-button style="width: 120px;">Button 1</adw-button>
  <adw-button style="width: 150px;">Button Two</adw-button>
  <adw-button style="width: 100px;">Item C</adw-button>
  <adw-button style="width: 180px;">Another Button</adw-button>
  <adw-entry placeholder="Input field" style="width: 150px;"></adw-entry>
</adw-wrap-box>

<p style="margin-top: 1em;">Vertical Wrapping (items form new columns):</p>
<adw-wrap-box class="adw-wrap-box wrap-box-vertical wrap-box-spacing-s wrap-align-stretch"
              style="border: 1px solid var(--borders-color); padding: var(--spacing-s); height: 120px; width: 300px; column-gap: var(--spacing-l); /* Custom line spacing */">
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
*   Styling (orientation, gap, alignment, justification) is primarily controlled by the CSS classes applied to the `<adw-wrap-box>` host element.

---
Next: [Clamp](./clamp.md)
