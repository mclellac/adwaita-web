# Button

Buttons allow users to trigger actions. Adwaita-Web provides `Adw.Button.factory()` (or equivalent global `createAdwButton()`) for JavaScript creation and the `<adw-button>` Web Component.

## JavaScript Factory: `Adw.Button.factory()` or `createAdwButton()`

Creates an `<adw-button>` Web Component instance.

**Signature:**

```javascript
Adw.Button.factory(text, options = {}) -> AdwButtonElement // Assuming AdwButtonElement is the class for <adw-button>
// or createAdwButton(text, options = {}) -> AdwButtonElement
```

**Parameters:**

*   `text` (String, optional): The text content for the button. If provided, it's set as the button's `textContent`.
*   `options` (Object, optional): Configuration options, mapped to attributes of the `<adw-button>`:
    *   `href` (String, optional): If provided, the button behaves like a link. *Security: Ensure this URL is trusted or validated.*
    *   `onClick` (Function, optional): Callback function for the button's click event. Attached directly to the created `<adw-button>` element. Not called if disabled.
    *   `suggested` (Boolean, optional): Sets the `suggested` attribute.
    *   `destructive` (Boolean, optional): Sets the `destructive` attribute.
    *   `flat` (Boolean, optional): Sets the `flat` attribute.
    *   `disabled` (Boolean, optional): Sets the `disabled` attribute.
    *   `active` (Boolean, optional): Sets the `active` attribute.
    *   `circular` (Boolean, optional): Sets the `circular` attribute (renamed from `isCircular`).
    *   `iconName` (String, optional): Name of the Adwaita icon (e.g., `actions/document-save-symbolic`). Sets the `icon-name` attribute. This is the preferred way to add icons.
    *   `icon` (String, optional): **Deprecated.** Previously for SVG strings or CSS class names. Use `iconName`.
    *   `type` (String, optional): Standard HTML button types (`submit`, `button`, `reset`). Sets the `type` attribute.
    *   `appearance` (String, optional): A general class name to add. Can be used for non-standard styles like `small`, `compact` if defined in application CSS.
    *   ARIA attributes (e.g., `ariaLabel`, `ariaHaspopup`): These will be set as `aria-label`, `aria-haspopup` on the `<adw-button>` element.

**Returns:**

*   `(AdwButtonElement)`: The created `<adw-button>` Web Component instance.

**Example:**

```html
<div id="js-button-container"></div>
<script>
  // Assuming createAdwButton is globally available or Adw.Button.factory
  const container = document.getElementById('js-button-container');

  // Standard button
  const saveButton = createAdwButton("Save", {
    suggested: true,
    onClick: () => Adw.createToast("Save action triggered!")
  });
  container.appendChild(saveButton);

  // Icon button
  const iconButton = createAdwButton("", { // Text is empty
    iconName: "document-new-symbolic", // Use iconName
    circular: true,
    flat: true,
    onClick: () => Adw.createToast("Icon button clicked!")
  });
  container.appendChild(iconButton);

  // Link styled as button
  const linkButton = createAdwButton("Learn More", {
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

*   `href` (String, optional): If provided, the underlying element inside the Shadow DOM will be an `<a>` tag.
*   `suggested` (Boolean attribute): Add attribute for suggested action styling.
*   `destructive` (Boolean attribute): Add attribute for destructive action styling.
*   `flat` (Boolean attribute): Add attribute for flat styling.
*   `disabled` (Boolean attribute): Add attribute to disable the button.
*   `active` (Boolean attribute): Add attribute for active/pressed state styling.
*   `circular` (Boolean attribute): Add attribute for circular styling (for icon-only buttons).
*   `icon-name` (String, optional): Name of the Adwaita icon (e.g., `actions/document-save-symbolic`). This is the preferred method for icons.
*   `icon` (String, optional): **Deprecated.** Previously for SVG strings or CSS class names. Use `icon-name`.
*   `type` (String, optional): Standard HTML button types like `submit`, `button`, `reset`. If `type="submit"`, it will attempt to submit the closest form.
*   `appearance` (String, optional): A general class name that will be added to the internal button element. Useful for custom application-specific appearances like `small` or `compact` if you define these CSS classes.

**Slots:**

*   Default slot: The text content or other inline elements for the button.

**Example:**

```html
<!-- Standard suggested button -->
<adw-button suggested>Submit</adw-button>

<!-- Destructive flat button with text -->
<adw-button destructive flat>Delete Item</adw-button>

<!-- Circular icon button using icon-name -->
<adw-button circular icon-name="edit-undo-symbolic" aria-label="Undo"></adw-button>

<!-- Link as a button -->
<adw-button href="https://example.com" target="_blank">Visit Example.com</adw-button>

<!-- Button with custom appearance class (assuming 'small' is defined in app CSS) -->
<adw-button appearance="small">Small Button</adw-button>

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
