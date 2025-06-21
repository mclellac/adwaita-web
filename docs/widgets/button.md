# Button

Buttons allow users to trigger actions. Adwaita-Web provides `Adw.createButton()` for JavaScript creation and the `<adw-button>` Web Component.

## JavaScript Factory: `Adw.createButton()`

Creates an Adwaita-styled button or a link styled as a button.

**Signature:**

```javascript
Adw.createButton(text, options = {}) -> HTMLButtonElement | HTMLAnchorElement
```

**Parameters:**

*   `text` (String): The text content of the button. Can be empty if using only an icon.
*   `options` (Object, optional): Configuration options:
    *   `href` (String, optional): If provided, creates an `<a>` tag styled as a button. *Security: Ensure this URL is trusted or validated to prevent XSS via `javascript:` URLs.*
    *   `onClick` (Function, optional): Callback function for the button's click event. Not called if the button is disabled.
    *   `suggested` (Boolean, optional): If `true`, applies the 'suggested-action' class (e.g., for primary actions). Defaults to `false`.
    *   `destructive` (Boolean, optional): If `true`, applies the 'destructive-action' class (e.g., for delete actions). Defaults to `false`.
    *   `flat` (Boolean, optional): If `true`, applies the 'flat' class for a less prominent button. Defaults to `false`.
    *   `disabled` (Boolean, optional): If `true`, disables the button. Defaults to `false`.
    *   `active` (Boolean, optional): If `true`, applies the 'active' class (e.g., for toggle buttons). Defaults to `false`.
    *   `isCircular` (Boolean, optional): If `true`, applies the 'circular' class, typically for icon-only buttons. Defaults to `false`.
    *   `icon` (String, optional): HTML string for an SVG icon, or a CSS class name for an icon font. *Security: If providing an HTML string, ensure it's from a trusted source or sanitized.*

**Returns:**

*   `(HTMLButtonElement | HTMLAnchorElement)`: The created button element.

**Example:**

```html
<div id="js-button-container"></div>
<script>
  const container = document.getElementById('js-button-container');

  // Standard button
  const saveButton = Adw.createButton("Save", {
    suggested: true,
    onClick: () => Adw.createToast("Save action triggered!")
  });
  container.appendChild(saveButton);

  // Icon button
  const iconButton = Adw.createButton("", {
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>', // Plus icon
    isCircular: true,
    flat: true,
    onClick: () => Adw.createToast("Icon button clicked!")
  });
  container.appendChild(iconButton);

  // Link styled as button
  const linkButton = Adw.createButton("Learn More", {
    href: "#learn-more-section",
    flat: true
  });
  container.appendChild(linkButton);
</script>
```

## Web Component: `<adw-button>`

A declarative way to use Adwaita buttons.

**HTML Tag:** `<adw-button>`

**Attributes:**

*   `href` (String, optional): If provided, renders as an `<a>` tag.
*   `suggested` (Boolean, optional): Sets suggested action styling.
*   `destructive` (Boolean, optional): Sets destructive action styling.
*   `flat` (Boolean, optional): Sets flat styling.
*   `disabled` (Boolean, optional): Disables the button.
*   `active` (Boolean, optional): Sets active/pressed state styling.
*   `circular` (Boolean, optional): Sets circular styling (for icon-only buttons).
*   `icon` (String, optional): HTML string for an SVG icon, or a CSS class name.
*   `type` (String, optional): Standard HTML button types like `submit`, `button`, `reset`. If `type="submit"`, it will attempt to submit the closest form.

**Slots:**

*   Default slot: The text content of the button.

**Example:**

```html
<!-- Standard suggested button -->
<adw-button suggested>Submit</adw-button>

<!-- Destructive flat button with text -->
<adw-button destructive flat>Delete Item</adw-button>

<!-- Circular icon button -->
<adw-button circular icon='<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.5 5h-9V4h9v1zm0 3h-9V7h9v1zm-2 3h-7v-1h7v1zM3 14v-1h10v1H3zM1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/></svg>'>
</adw-button>

<!-- Link as a button -->
<adw-button href="https://example.com" target="_blank">Visit Example.com</adw-button>

<script>
  document.querySelector('adw-button[suggested]').addEventListener('click', () => {
    Adw.createToast("Submit button (WC) clicked!");
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_button.scss`
*   Variables: Uses general theme variables from `scss/_variables.scss` for colors, padding, etc. (e.g., `--button-bg-color`, `--accent-bg-color`).
*   Key CSS Custom Properties for direct styling (on the component or a parent):
    *   `--button-bg-color`
    *   `--button-fg-color`
    *   `--button-border-color`
    *   `--button-hover-bg-color`
    *   `--button-active-bg-color`
    *   (and variants for flat, suggested, destructive states)

---
Next: [Dialog](./dialog.md) (or another component)
