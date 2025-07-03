# AGENTS.md for adwaita-skin

This document provides instructions and guidelines for AI agents (like Jules) working with the `adwaita-skin` CSS library.

## Overview

`adwaita-skin` (this directory, `adwaita-web`) provides CSS and potentially JavaScript components aiming to implement the Adwaita design language for web applications.

**Directory Structure & Asset Placement:**
*   **SCSS:** All SASS source files are located in `adwaita-web/scss/`. These are compiled into `adwaita-web/css/adwaita-skin.css` by the build script.
*   **JavaScript:** Any JavaScript associated with the `adwaita-web` library itself (e.g., for interactive components or demo-specific enhancements like `app-layout.js`) should be placed in `adwaita-web/js/`. These are typically copied to `app-demo/static/js/` by the build script.
*   **Static Assets:** Icons, fonts, and other static data used by the library are in `adwaita-web/data/` and `adwaita-web/fonts/`.

## Key Principles

1.  **Pure CSS:** All styling must be achievable with CSS only. Do not introduce JavaScript for styling purposes. Interactivity that requires JavaScript should be handled by the consuming application, not this library.
2.  **HTML Structure Agnostic (Flexible):** Styles should be applicable to common HTML structures (e.g., standard `<button>`, `<input>`, `<div>` with classes). Avoid overly specific selectors that demand a rigid HTML structure unless absolutely necessary for the component's design.
3.  **Class-Based Styling:** Styling is primarily applied via CSS classes (e.g., `.adw-button`, `.adw-entry`, `.adw-list-box`).
4.  **CSS Custom Properties:** Leverage CSS custom properties (variables) extensively for theming (colors, spacing, fonts, etc.) to allow easy customization and dark mode support.
    *   Global variables should be defined in `scss/_variables.scss` and on the `:root` or `body` element.
    *   Component-specific variables can also be defined if they don't fit the global scope.
5.  **SCSS Usage:** The library is written in SCSS (`.scss` files) and compiled into a single CSS file (`css/adwaita-skin.css`).
    *   Modular SCSS: Styles are organized into partials (e.g., `_button.scss`, `_entry.scss`) and imported into `adwaita-skin.scss`.
    *   SASS features like variables (`$sass-variable`), mixins (`@mixin`), and nesting should be used for maintainability. However, the output must be pure CSS.
6.  **No Web Components:** Unlike `adwaita-web`, this library does *not* use custom elements or shadow DOM. All styles are global.
7.  **Accessibility (A11y):** Ensure that styles support accessibility best practices. For example, provide clear focus indicators (`:focus-visible`), sufficient color contrast, and respect `prefers-reduced-motion` where applicable.

## Development Workflow

1.  **Modify SCSS:** Make changes to the `.scss` files within the `scss/` directory.
2.  **Compile SCSS:** After making changes, compile the SCSS to CSS using a SASS compiler. The command used previously is:
    ```bash
    sass scss/adwaita-skin.scss css/adwaita-skin.css
    ```
    Ensure the SASS compiler is installed (e.g., `npm install -g sass`).
3.  **Test:** Test the changes by viewing HTML pages that use `adwaita-skin.css`. The `examples/` directory can be used for this, or the main `index.html` and `app-demo` if they are up-to-date.

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
