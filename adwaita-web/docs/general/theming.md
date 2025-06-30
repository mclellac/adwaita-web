# Theming in Adwaita Skin

Adwaita Skin is designed to be themable, primarily through CSS custom properties (variables). It ships with support for light and dark color schemes and allows for customization of accent colors, mirroring the capabilities of the native Adwaita theme.

## Light and Dark Themes

The core styling for light and dark themes is defined in `scss/_variables.scss`. This file sets up CSS variables that control the color palette for various UI elements.

### Switching Themes

Adwaita Skin uses a class on a high-level HTML element (typically `<html>` or `<body>`) to switch between themes. The application is responsible for adding and removing this class.

*   **Light Theme:** Apply the class `light-theme` (or ensure no specific theme class is present if light is the default) to the `<html>` or `<body>` tag.
    ```html
    <body class="light-theme"> <!-- Or <html class="light-theme"> -->
    ```
*   **Dark Theme:** Apply the class `theme-dark` to the `<html>` or `<body>` tag. (Note: The exact class name might be `dark-theme` or `theme-dark`, check `scss/_variables.scss` for the precise implementation. `theme-dark` is a common convention).
    ```html
    <body class="theme-dark"> <!-- Or <html class="theme-dark"> -->
    ```

Your application's JavaScript would be responsible for:
1.  Checking `localStorage` for a user-saved theme preference (e.g., `'light'` or `'dark'`).
2.  Optionally, checking the system's preferred color scheme via `window.matchMedia('(prefers-color-scheme: dark)')`.
3.  Applying the appropriate class to the `<body>` or `<html>` element on load and when the preference changes.

**Example JavaScript for theme switching (conceptual):**

```javascript
function applyTheme(themeName) {
  if (themeName === 'dark') {
    document.documentElement.classList.add('theme-dark');
    document.documentElement.classList.remove('light-theme'); // Example: ensure only one is active
  } else {
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.classList.add('light-theme'); // Example: ensure light-theme is present
  }
  // Optionally, save preference to localStorage
  // localStorage.setItem('theme', themeName);
}

// Initial theme setup
// const savedTheme = localStorage.getItem('theme');
// if (savedTheme) {
//   applyTheme(savedTheme);
// } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//   applyTheme('dark');
// } else {
//   applyTheme('light'); // Default
// }
```
This JavaScript is illustrative; you'll need to implement the exact logic for your application. Adwaita Skin itself does not provide this JavaScript.

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

Adwaita Skin supports accent colors through CSS custom properties. The SCSS variables in `scss/_variables.scss` define a set of accent colors (e.g., blue, green, red, etc.) and how they apply in light and dark themes.

Key CSS variables for accent colors (defined on `:root` or a themed element):
*   `--accent-color`
*   `--accent-bg-color`
*   `--accent-fg-color`

These variables are used by elements like suggested action buttons or active state indicators.

### Changing Accent Color

Unlike a JavaScript-driven library, Adwaita Skin itself doesn't provide functions to dynamically change accent colors on the fly by rewriting CSS variables through JavaScript.

To change the accent color:
1.  **Compile-Time (SCSS):** The most straightforward way is to modify the SCSS variables in `scss/_variables.scss` to change the default accent color values before compiling `adwaita-skin.scss` to `adwaita-skin.css`. For example, you could change `$accent_color` or related map values.

2.  **Run-Time (CSS Override):** You can override the accent color CSS variables in your own stylesheet that is loaded *after* `adwaita-skin.css`.

    ```css
    /* Your custom stylesheet */
    :root { /* Or body.light-theme, html.theme-dark etc. for specific themes */
      --accent-color: #yourChosenAccentColor;
      --accent-bg-color: #yourChosenAccentBackground;
      --accent-fg-color: #yourChosenAccentForeground;
    }
    ```
    If your application needs to offer users a choice of accent colors at runtime, it would be your application's JavaScript responsibility to:
    *   Define different sets of overrides for these CSS variables (perhaps by adding a class to the `<body>` or `<html>` element like `accent-green`, `accent-red`).
    *   Update these overrides or switch the class when the user makes a selection.

    For example, your CSS could define:
    ```css
    :root.accent-green {
      --accent-bg-color: #2ec27e; /* Example green */
      --accent-fg-color: #ffffff;
    }
    :root.accent-purple {
      --accent-bg-color: #8e44ad; /* Example purple */
      --accent-fg-color: #ffffff;
    }
    ```
    And your JavaScript would toggle `document.documentElement.classList.add('accent-green')` etc.

The specific named accent colors (like "blue", "green") and their default values are defined in `scss/_variables.scss`. You can inspect this file to see the available predefined values and how they map to CSS custom properties.

## Customizing Further

While the built-in themes and accent colors provide a good level of customization, you can further override the CSS variables in your own stylesheets to fine-tune the appearance.

For example, to change the default button background color in the light theme:

```css
/* Your custom stylesheet, loaded after adwaita-web.css */
body.light-theme {
  --button-bg-color: #f0f0f0; /* A slightly different shade of grey */
}
```

By understanding the structure of `scss/_variables.scss` and the CSS custom properties used by Adwaita Skin, you can achieve a high degree of visual customization while maintaining the core Adwaita look and feel.
---

Next: [Usage Guide](./usage-guide.md)
