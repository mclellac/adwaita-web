# Theming in Adwaita-Web

Adwaita-Web is designed to be themable, primarily through CSS custom properties. It ships with support for light and dark color schemes and allows for customization of accent colors, mirroring the capabilities of the native Adwaita theme.

## Light and Dark Themes

The core styling for light and dark themes is defined in `scss/_variables.scss`. This file sets up CSS variables that control the color palette for various UI elements.

### Switching Themes

Adwaita-Web uses a class on the `<body>` element to switch between themes.

*   **Light Theme:** Apply the class `light-theme` to the `<body>` tag.
    ```html
    <body class="light-theme">
    ```
*   **Dark Theme:** By default, if no theme class is present, Adwaita-Web will use the dark theme. You can also explicitly set it by ensuring `light-theme` is not present or by adding a `dark-theme` class (though the default behavior usually suffices for dark).

The JavaScript file (`js/components.js` or `js/adw-initializer.js`) includes logic to:
1.  Check `localStorage` for a user-saved theme preference (`'light'` or `'dark'`).
2.  If no saved preference, check the system's preferred color scheme via `prefers-color-scheme`.
3.  Apply the appropriate class to the `<body>` element on load.

You can also programmatically switch themes using the `Adw.toggleTheme()` function provided in `js/adw-initializer.js`.

```javascript
// Switch to light theme
Adw.toggleTheme('light');

// Switch to dark theme
Adw.toggleTheme('dark');

// Toggle between light and dark
Adw.toggleTheme();
```

### CSS Variables

The theme system relies heavily on CSS custom properties. Key variables include:

*   `--window-bg-color`, `--window-fg-color`
*   `--view-bg-color`, `--view-fg-color`
*   `--headerbar-bg-color`, `--headerbar-fg-color`
*   `--button-bg-color`, `--button-fg-color`, `--button-border-color`
*   `--accent-bg-color`, `--accent-fg-color` (for suggested actions, active states, etc.)
*   `--destructive-bg-color`, `--destructive-fg-color` (for destructive actions)
*   And many more specific to components or states.

These variables are defined differently for the light and dark themes within `scss/_variables.scss`.

## Accent Colors

Adwaita-Web supports dynamic accent colors, similar to GNOME. The `Adw` JavaScript object provides functions to manage these.

### Available Accent Colors

You can get a list of predefined accent colors:

```javascript
const availableAccents = Adw.getAccentColors();
/*
Returns an object like:
{
  "default": { "label": "Default (Blue)", "light": { "bg": "#3584e4", "fg": "#ffffff" }, "dark": { "bg": "#3584e4", "fg": "#ffffff" } },
  "green": { "label": "Green", "light": { "bg": "#2ec27e", "fg": "#ffffff" }, "dark": { "bg": "#26a269", "fg": "#ffffff" } },
  // ... and other colors like red, yellow, purple, orange
}
*/
```

### Setting Accent Color

To change the accent color application-wide:

```javascript
// Set accent to green
Adw.setAccentColor('green');

// Revert to default (blue)
Adw.setAccentColor('default');
```

This function updates the relevant CSS custom properties (`--accent-bg-color`, `--accent-fg-color`, `--accent-color`) on the `:root` element, causing UI elements that use these variables to reflect the new accent color.

The list of available accent colors and their corresponding CSS variable mappings are defined within `scss/_variables.scss` (e.g., `--accent-blue-light-bg`, `--accent-green-dark-fg`, etc.) and managed by the `js/adw-initializer.js` script.

## Customizing Further

While the built-in themes and accent colors provide a good level of customization, you can further override the CSS variables in your own stylesheets to fine-tune the appearance.

For example, to change the default button background color in the light theme:

```css
/* Your custom stylesheet, loaded after adwaita-web.css */
body.light-theme {
  --button-bg-color: #f0f0f0; /* A slightly different shade of grey */
}
```

By understanding the structure of `scss/_variables.scss` and the CSS custom properties used by components, you can achieve a high degree of visual customization while maintaining the core Adwaita look and feel.
---

Next: [JavaScript API](./javascript-api.md)
