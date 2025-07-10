# AGENTS.md for adwaita-skin

This document provides instructions and guidelines for AI agents (like Jules) working with the `adwaita-skin` CSS library.

## Overview

`adwaita-skin` (this directory, `adwaita-web`) provides CSS and potentially JavaScript components aiming to implement the Adwaita design language for web applications.

**Directory Structure & Asset Placement:**
*   **SCSS:** All SASS source files are located in `adwaita-web/scss/`. These are compiled into `adwaita-web/css/adwaita-skin.css` by the build script.
*   **JavaScript:** Any JavaScript associated with the `adwaita-web` library itself (e.g., for interactive components or demo-specific enhancements like `app-layout.js`) should be placed in `adwaita-web/js/`. These are typically copied to `antisocialnet/static/js/` by the build script.
*   **Static Assets:** Icons, fonts, and other static data used by the library are in `adwaita-web/data/` and `adwaita-web/fonts/`.

## Key Principles

1.  **CSS-First Styling:** The primary method for applying Adwaita styling is through CSS classes (e.g., `.adw-button`, `.adw-entry`, `.adw-list-box`) on standard HTML elements. All visual styling should be achievable with CSS.
2.  **JavaScript for Behavior, Not Styling:** JavaScript should not be used to directly manipulate CSS styles for appearance (e.g., `element.style.color = 'red'`). Its role is to provide interactivity and behavior, or to define web components where necessary.
3.  **Selective Web Components:** While most of the library relies on CSS classes, specific complex and interactive components like Dialogs (`<adw-dialog>`, `<adw-about-dialog>`) are implemented as JavaScript-defined Custom Elements (Web Components). Other elements, like Spinners, are CSS-only.
4.  **HTML Structure Agnostic (Flexible):** Styles should be applicable to common HTML structures. Avoid overly specific selectors that demand a rigid HTML structure unless absolutely necessary for the component's design.
5.  **CSS Custom Properties & Libadwaita Alignment:** Leverage CSS custom properties (variables) extensively for theming. Strive to align variable names and theming concepts with those found in the native Libadwaita GTK library.
    *   Global variables are defined in `scss/_variables.scss` on the `:root` element and overridden by `.theme-dark` and accent classes (e.g., `.accent-green`).
6.  **SCSS Usage:** The library is written in SCSS (`.scss` files) and compiled into a single CSS file (`css/adwaita-skin.css`).
    *   Modular SCSS: Styles are organized into partials (e.g., `_button.scss`, `_entry.scss`) and imported into `adwaita-skin.scss`.
    *   SASS features like variables (`$sass-variable`), mixins (`@mixin`), and nesting should be used for maintainability.
7.  **Accessibility (A11y):** Ensure that styles and components support accessibility best practices (e.g., focus indicators, color contrast, ARIA attributes, `prefers-reduced-motion`).

## Development Workflow

1.  **Modify SCSS:** Make changes to the `.scss` files within the `scss/` directory.
2.  **Compile SCSS:** After making changes, compile the SCSS to CSS using a SASS compiler. The command used previously is:
    ```bash
    sass scss/adwaita-skin.scss css/adwaita-skin.css
    ```
    Ensure the SASS compiler is installed (e.g., `npm install -g sass`).
3.  **Test:** Test the changes by viewing HTML pages that use `adwaita-skin.css`. The `examples/` directory can be used for this, or the main `index.html` and `antisocialnet` if they are up-to-date.

## Iconography

*   Icons are expected to be applied via CSS, potentially using SVG masks or background images.
*   The current `index.html` uses placeholder CSS for icons with `-webkit-mask-image` and `mask-image`, pointing to SVG files originally from `adwaita-web/data/icons/`.
*   A more robust or bundled icon solution might be needed in the future. For now, ensure icon-related classes are styled correctly.

## HTML Structure Expectations

When implementing or modifying styles for components, refer to how standard HTML elements are intended to be styled. For example:
*   A button: `<button class="adw-button">Text</button>` or `<a class="adw-button">Link</a>`
*   An entry: `<input type="text" class="adw-entry">`
*   A list box: `<div class="adw-list-box"> <div class="adw-action-row">...</div> </div>`

Consult existing SCSS files and `examples/` to understand the expected HTML markup for styled components.

## Dark Mode

Dark mode is typically handled by adding a class (e.g., `theme-dark`) to a high-level element (like `<html>` or `<body>`). CSS variables should be defined to change values based on this class. Example from `_variables.scss`:
```scss
:root {
  // Light theme defaults
  --text-color: #{$text-color-light};
  // ... other light variables

  &.theme-dark {
    // Dark theme overrides
    --text-color: #{$text-color-dark};
    // ... other dark variables
  }
}
```

## Future Considerations

*   **Minification:** For production use, the compiled CSS should be minified.
*   **Autoprefixing:** Consider using an autoprefixer during the build process to ensure cross-browser compatibility for CSS properties.
*   **Linting:** Implement SCSS linting to maintain code quality.

By following these guidelines, `adwaita-skin` can be maintained as a robust and easy-to-use pure CSS library for Adwaita styling.

## User Notifications (Banners, Toasts)

*   **Dismiss Mechanisms:** All transient user notifications implemented or styled by this library (or its associated JavaScript helpers like `banner.js`, `toast.js`) **must** include a clearly visible and user-operable mechanism for dismissal.
    *   **Banners (`.adw-banner`):** Should include a text button (e.g., labeled "Dismiss") for dismissal. The `banner.js` helper script looks for a button with class `.adw-banner-dismiss-button` or `.adw-banner-dismiss` within the banner element.
    *   **Toasts (`.adw-toast`):** Should include a circular icon button with an 'X' icon (e.g., using `icon-window-close-symbolic`) for dismissal. The `toast.js` helper script automatically adds such a button.
*   **Functionality:** These dismiss mechanisms must be fully functional, allowing the user to remove the notification from view.
*   **Accessibility:** Ensure these dismiss controls are accessible (e.g., proper ARIA attributes, keyboard focusable).
