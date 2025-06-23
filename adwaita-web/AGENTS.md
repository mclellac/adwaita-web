# Agent Instructions for the `adwaita-web` Library

This directory, `adwaita-web/`, contains a web UI library designed to provide components and styling that emulate the GTK Adwaita theme for web applications.

## Purpose

The primary goal of this library is to offer a familiar Adwaita look and feel for web projects through a collection of reusable web components (custom elements) and JavaScript helper functions.

## Structure

The library is organized as follows:

*   **`js/`**: Contains the JavaScript source code.
    *   **`js/components/`**: Individual JavaScript modules for each component (e.g., `button.js`, `dialog.js`, `rows.js`, `views.js`, etc.). These files typically define both a factory function (e.g., `createAdwButton`) and a custom element class (e.g., `class AdwButton extends HTMLElement`).
    *   **`js/components.js`**: This is the main aggregator script. It imports all individual component modules and utility functions, populates the global `Adw` object (`window.Adw`), and defines all the custom elements using `customElements.define()`. This script is intended to be the primary entry point for using the library's JavaScript.
*   **`scss/`**: Contains the SCSS source files for styling the components. These are compiled into a single CSS file (e.g., `adwaita-web.css`).
    *   `_variables.scss`: Defines common SCSS variables (colors, spacing, etc.).
    *   Individual `_<component>.scss` files: Styles for each specific component.
    *   `style.scss`: The main SCSS file that imports all other SCSS partials.
*   **`data/`**: Contains static assets like icons.
    *   **`data/icons/symbolic/`**: SVG icons used by components (e.g., via `AdwIcon` or directly).
*   **`fonts/`**: Contains font files used by the theme.

## Usage

The `adwaita-web` library is intended to be consumed by other web applications or projects (like `app-demo` in this repository). Typically, this involves:

1.  **Building/Copying Assets**: The consuming project needs access to the compiled CSS (`adwaita-web.css`), the main JavaScript bundle (`components.js`), and static assets like icons (`data/icons/`) and fonts (`fonts/`). The `build-adwaita-web.sh` script in the repository root provides an example of how SASS can be compiled and assets copied.
2.  **Including CSS**: Link the `adwaita-web.css` file in the HTML of the consuming application.
3.  **Including JavaScript**: Include the `components.js` script (usually as a module) in the HTML. This will make the `Adw` object and all custom elements available.
4.  **Configuration (Optional)**: The consuming application can pre-configure `Adw.config` (e.g., `Adw.config.cssPath`, `Adw.config.iconBasePath`) before `components.js` loads if the asset paths differ from the defaults. See `app-demo/templates/base.html` for an example.
5.  **Using Components**: Utilize the Adwaita custom elements (e.g., `<adw-button>`, `<adw-header-bar>`) in HTML or create them programmatically using the factory functions (e.g., `Adw.createButton()`).

## Development Notes

*   **Web Components**: Components are primarily implemented as standard Web Components (Custom Elements).
*   **ES6 Modules**: JavaScript code is written using ES6 modules.
*   **SCSS**: Styling is managed using SCSS. Changes to `.scss` files require recompilation to CSS.
*   **No Bundler (Currently)**: The project, as-is, doesn't rely on a complex JavaScript bundler like Webpack or Rollup for `components.js`. It's a simple aggregation of ES modules. This might change if dependencies or complexity increases.
*   **Accessibility**: Strive to make components accessible by following ARIA best practices. Provide clear labels for interactive elements, especially icon-only buttons.
*   **Manual Builds/Copying for Demo**: For the `app-demo` in this repository, changes made in `adwaita-web/` (especially to SCSS or JS) need to be manually "built" (e.g., SCSS compiled) and the resulting assets (CSS, JS, icons, fonts) copied or symlinked into `app-demo/static/` to be visible in the demo application. The `build-adwaita-web.sh` script in the root directory can assist with this.

When working on this library, remember to test changes in a consuming application (like `app-demo`) to see their real-world effect.
