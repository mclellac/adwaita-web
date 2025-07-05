# Theming in Adwaita Skin

Adwaita Skin is designed to be themable, primarily through CSS custom properties (variables). It supports light and dark color schemes and allows for customization of accent colors, mirroring many capabilities of the native Libadwaita library.

## Light and Dark Themes

The core styling for light and dark themes is defined via CSS custom properties in `scss/_variables.scss`. This file sets up a comprehensive color palette for various UI elements.

### Switching Themes

Adwaita Skin uses a class on a high-level HTML element (typically `<html>` or `<body>`) to switch between themes. Your application is responsible for adding/removing this class.

*   **Light Theme:** This is the default theme. No specific class is required unless you are switching from dark theme.
*   **Dark Theme:** Apply the class `theme-dark` to the `<html>` or `<body>` tag.
    ```html
    <body class="theme-dark"> <!-- Or <html class="theme-dark"> -->
    ```

Your application's JavaScript would typically:
1.  Check `localStorage` for a user-saved theme preference.
2.  Optionally, check the system's preferred color scheme via `window.matchMedia('(prefers-color-scheme: dark)')`.
3.  Apply the `theme-dark` class to `document.documentElement` or `document.body` as needed.

**Example JavaScript for theme switching (conceptual):**
```javascript
function applyTheme(themeName) {
  if (themeName === 'dark') {
    document.documentElement.classList.add('theme-dark');
  } else {
    document.documentElement.classList.remove('theme-dark');
  }
  localStorage.setItem('theme', themeName);
}

// Initial theme setup
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme) {
  applyTheme(savedTheme);
} else if (systemPrefersDark) {
  applyTheme('dark');
} else {
  applyTheme('light'); // Default
}
```
This JavaScript is illustrative. Adwaita Skin itself does not provide this JavaScript.

### Key CSS Variables for Theming

The theme system relies heavily on CSS custom properties. Some key variables include:

*   `--window-bg-color`, `--window-fg-color` (main application background and text)
*   `--view-bg-color`, `--view-fg-color` (content areas)
*   `--headerbar-bg-color`, `--headerbar-fg-color` (for headers and toolbars)
*   `--sidebar-bg-color`, `--card-bg-color`, `--dialog-bg-color`, `--popover-bg-color`
*   `--accent-bg-color`, `--accent-fg-color`, `--accent-color` (for the current accent)
*   `--destructive-bg-color`, `--destructive-fg-color`, `--destructive-color`
*   `--success-bg-color`, `--warning-bg-color`, `--error-bg-color` (and their `fg`/`color` counterparts)

For a comprehensive list, please refer to the [Theming Reference](./THEMING_REFERENCE.md) document. These variables are defined with default light theme values in `:root` and overridden within `.theme-dark` context in `scss/_variables.scss`.

## Accent Colors

Adwaita Skin supports multiple accent colors. The **default accent color is Blue**.

The currently active accent color is exposed through three main CSS variables:
*   `--accent-bg-color`: Used for backgrounds of elements like suggested action buttons or selected list items.
*   `--accent-fg-color`: Used for text/icons on top of `--accent-bg-color`.
*   `--accent-color`: This is the "standalone" accent color, suitable for text or icons on neutral backgrounds (e.g., a flat suggested button's text, or the border of a focused input field).

### Changing the Accent Color

To change the active accent color for the entire application, add one of the following classes to a root element (e.g., `<html>` or `<body>`):

*   `.accent-blue` (Default)
*   `.accent-teal`
*   `.accent-green`
*   `.accent-yellow`
*   `.accent-orange`
*   `.accent-red`
*   `.accent-pink`
*   `.accent-purple`
*   `.accent-slate`

Applying one of these classes will update the values of `--accent-bg-color`, `--accent-fg-color`, and `--accent-color` to reflect the chosen accent for both light and dark themes.

**Example:**
To make green the active accent color:
```html
<body class="theme-dark accent-green">
  <!-- Your application content -->
</body>
```
Your application's JavaScript can manage adding/removing these classes to allow users to select an accent color.

## High Contrast Considerations

Adwaita Skin aims to respect high contrast preferences by using:
*   Semantic HTML where possible.
*   CSS variables like `--border-opacity`, `--dim-opacity`, and `--disabled-opacity`.
*   A dynamic `--border-color: color-mix(in srgb, currentColor var(--border-opacity), transparent);` which adapts to text color.
True high contrast mode is a system/browser feature that often forces specific color palettes. This library's goal is to provide a base that works well with such modes rather than implementing a separate high contrast theme.

## Customizing Further

Beyond the theme and accent classes, you can further customize the appearance by overriding any of the CSS custom properties in your own stylesheet. Ensure your custom stylesheet is loaded *after* `adwaita-skin.css`.

For example, to slightly change the default window background in the light theme:
```css
/* Your custom-styles.css */
:root { /* Overrides for light theme (default) */
  --window-bg-color: #f8f8f8; /* A slightly different light gray */
}

.theme-dark { /* Overrides for dark theme */
  --window-bg-color: #202020; /* A slightly different dark gray */
}
```

By inspecting `scss/_variables.scss` and the [Theming Reference](./THEMING_REFERENCE.md), you can identify all available CSS variables for detailed customization.
---

Next: [Usage Guide](./usage-guide.md)
