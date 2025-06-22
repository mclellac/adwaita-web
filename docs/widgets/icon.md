# Icon

The Adwaita Icon component (`<adw-icon>`) is used to display symbolic icons from the Adwaita icon theme. It provides a convenient way to include scalable vector icons in your interface.

## Web Component: `<adw-icon>`

A declarative way to display Adwaita icons.

**HTML Tag:** `<adw-icon>`

**Attributes:**

*   `icon-name` (String, required): The name of the Adwaita icon to display. This typically follows a namespaced pattern like `category/icon-name-symbolic` (e.g., `actions/document-save-symbolic`, `ui/pan-down-symbolic`). The component uses this name to apply appropriate CSS classes that render the icon (often via SVG masks or an icon font).
*   `alt` (String, optional): Alternative text for the icon, crucial for accessibility. If not provided, the icon might be treated as decorative by assistive technologies. For purely decorative icons, an empty `alt=""` might be appropriate, or ensure the context provides sufficient information.

**Example:**

```html
<!-- Displaying a document save icon -->
<adw-icon icon-name="actions/document-save-symbolic" alt="Save Document"></adw-icon>

<!-- A navigation arrow icon -->
<adw-button>
  <adw-icon icon-name="ui/pan-down-symbolic" alt="Show more options"></adw-icon>
  More
</adw-button>

<!-- A decorative icon (context provided by surrounding text/elements) -->
<adw-label>
  <adw-icon icon-name="emotes/face-smile-symbolic" alt=""></adw-icon>
  Happy Message!
</adw-label>
```

## JavaScript Factory: `Adw.createIcon()` or `createAdwIcon()`

Creates an `<adw-icon>` Web Component instance.

**Signature:**

```javascript
createAdwIcon(iconName, options = {}) -> AdwIconElement // AdwIconElement is the class for <adw-icon>
```

**Parameters:**

*   `iconName` (String, required): The name of the Adwaita icon (e.g., `actions/document-save-symbolic`).
*   `options` (Object, optional): Configuration options:
    *   `alt` (String, optional): Sets the `alt` attribute on the created `<adw-icon>` for accessibility.

**Returns:**

*   `(AdwIconElement)`: The created `<adw-icon>` Web Component instance.

**Example:**

```html
<div id="js-icon-container" style="display: flex; gap: 10px; align-items: center;"></div>
<script>
  // Assuming createAdwIcon is globally available or Adw.Icon.factory
  const container = document.getElementById('js-icon-container');

  const saveIcon = createAdwIcon("actions/document-save-symbolic", { alt: "Save" });
  container.appendChild(saveIcon);

  const userIcon = createAdwIcon("actions/user-info-symbolic", { alt: "User Information" });
  container.appendChild(userIcon);
</script>
```

## Styling

*   Primary SCSS: `scss/_icon.scss`
*   The component typically renders as a `<span>` with specific classes derived from the `icon-name`. The actual icons are usually applied via CSS using SVG masks, background images, or an icon font defined in the main Adwaita stylesheet (`style.scss`).
*   The size and color of the icon are often inherited from the parent text elements (`font-size`, `color`) or can be overridden with CSS.

---
Next: [WindowTitle](./windowtitle.md) (or another component)
