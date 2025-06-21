# Clamp

An AdwClamp is a layout container that constrains its single child's width to a maximum size and centers it within the available space. It's useful for content like text documents or forms that should not become too wide on larger screens, improving readability.

## JavaScript Factory: `Adw.createClamp()`

Creates an Adwaita-styled clamp container.

**Signature:**

```javascript
Adw.createClamp(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `child` (HTMLElement, optional): The single child element to be clamped.
    *   `maximumSize` (String, optional): The maximum width for the child. CSS value (e.g., "80ch", "600px"). Defaults to "80ch" (approximately 80 characters wide, good for text).
    *   `isScrollable` (Boolean, optional): If `true`, the clamp container itself will allow vertical scrolling if its content (the child) exceeds the clamp's own height. Defaults to `false`.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the clamp.

**Example:**

```html
<div id="js-clamp-container" style="border: 1px solid var(--borders-color); padding: var(--spacing-s); width: 100%;">
  <p style="text-align:center;"><em>Resize browser window to see clamp effect. Container is full width.</em></p>
</div>
<script>
  const container = document.getElementById('js-clamp-container');

  // Clamped text content
  const textBlock = document.createElement('div');
  textBlock.innerHTML = `
    <h3>Clamped Document</h3>
    <p>This paragraph is inside an AdwClamp. It will be centered and its width will not exceed the maximumSize specified (defaulting to around 80 characters). This is ideal for long-form text to maintain readability on wide screens.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
  `;
  textBlock.style.textAlign = "left"; // Content alignment
  textBlock.style.padding = "var(--spacing-m)";
  textBlock.style.border = "1px solid var(--accent-bg-color)";


  const clampForText = Adw.createClamp({
    child: textBlock,
    maximumSize: "60ch" // A bit narrower for this example
  });
  container.appendChild(clampForText);

  // Clamped form-like structure
  const formContent = Adw.createBox({
      orientation: 'vertical',
      spacing: 'm',
      children: [
          Adw.createEntryRow({title: "Name"}),
          Adw.createEntryRow({title: "Email"}),
          Adw.createButtonRow({buttons: [Adw.createButton("Submit", {suggested: true})]})
      ]
  });
  formContent.style.padding = "var(--spacing-l)";
  formContent.style.backgroundColor = "var(--view-bg-color)";
  formContent.style.borderRadius = "var(--border-radius-default)";


  const clampForForm = Adw.createClamp({
    child: formContent,
    maximumSize: "500px"
  });
  clampForForm.style.marginTop = "var(--spacing-l)";
  container.appendChild(clampForForm);
</script>
```

## Web Component: `<adw-clamp>`

A declarative way to use Adwaita clamp containers.

**HTML Tag:** `<adw-clamp>`

**Attributes:**

*   `maximum-size` (String, optional): The maximum width for the child content (e.g., "80ch", "700px"). Defaults to "80ch".
*   `scrollable` (Boolean, optional): If present, makes the clamp container vertically scrollable if its content overflows its own height.

**Slots:**

*   Default slot: The single child element whose width will be constrained.

**Example:**

```html
<div style="background-color: var(--shade-color); padding: var(--spacing-l);">
  <adw-clamp maximum-size="50ch" style="background-color: var(--window-bg-color); padding: var(--spacing-m); border-radius: var(--border-radius-large);">
    <h2>Article Title</h2>
    <p>This text is within an <code>adw-clamp</code> Web Component. It will be centered on the page (if the clamp itself has room to be centered or is full width) and its content flow will not exceed 50 characters wide, making it pleasant to read.</p>
    <p>Further paragraphs will also adhere to this width constraint, providing a focused reading experience. The clamp itself can have its own background and padding.</p>
    <adw-button>Read More</adw-button>
  </adw-clamp>
</div>

<div style="background-color: var(--body-bg-color); padding: var(--spacing-l); margin-top: var(--spacing-m);">
  <adw-clamp maximum-size="400px" scrollable style="height: 200px; border: 1px solid var(--borders-color); background-color: var(--view-bg-color); padding: var(--spacing-s);">
      <h4>Scrollable Clamped Area</h4>
      <p>This content is clamped to 400px width.</p>
      <p>If it becomes taller than the clamp's explicit height (200px here), the clamp will become scrollable.</p>
      <p>Lorem ipsum dolor sit amet...</p>
      <p>Consectetur adipiscing elit...</p>
      <p>Sed do eiusmod tempor incididunt...</p>
      <p>Ut labore et dolore magna aliqua...</p>
  </adw-clamp>
</div>
```

## Styling

*   Primary SCSS: `scss/_clamp.scss`.
*   The component uses an inner wrapper for its child.
*   `max-width` is applied to this inner wrapper.
*   The outer clamp element uses `display: flex; justify-content: center;` to center the inner wrapper.
*   If `scrollable`, `overflow-y: auto;` is applied to the outer clamp element.

---
Next: [BreakpointBin](./breakpointbin.md)
