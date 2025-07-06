# Agent Instructions for Adwaita Web Demo Repository

This repository contains two main projects:

1.  **`adwaita-web/`**:
    *   This directory houses a web UI library aiming to provide components and styling that mimic the GTK Adwaita theme for web applications.
    *   It includes JavaScript modules for web components (custom elements), SCSS for styling, and associated assets like icons and fonts.
    *   This library is intended to be somewhat standalone, though in this repository, it's primarily used by `app-demo/`.
    *   For more specific instructions on working with the `adwaita-web` library itself, see the `adwaita-web/AGENTS.md` file.

2.  **`app-demo/`**:
    *   This directory contains a Flask-based demonstration application (a blog).
    *   It utilizes the `adwaita-web` library to style its user interface.
    *   The application is structured using a Flask application factory (`create_app` located in `app-demo/__init__.py`) and is run using the `flask run` command (after setting `FLASK_APP=app_demo`).
    *   Currently, `app-demo` uses a manually included (or to-be-built and copied) version of the `adwaita-web` library's assets (CSS, JS, icons, fonts). Refer to `build-adwaita-web.sh` for an example of how these might be prepared and copied into `app-demo/static/`.
    *   For specific instructions related to the `app-demo` application (e.g., running the Flask app, database setup, testing), please refer to the `app-demo/AGENTS.md` file.

**General Workflow:**

*   **Asset Management:**
    *   All source frontend assets for the `adwaita-web` library (SCSS, JavaScript, icons, fonts) **must** reside within the `adwaita-web/` directory structure (e.g., `adwaita-web/scss/`, `adwaita-web/js/`).
    *   The `app-demo/static/` directory is primarily for housing **built/compiled assets**. These are generated and copied from `adwaita-web/` by the `build-adwaita-web.sh` script.
    *   User-uploaded content for `app-demo` (e.g., profile pictures) also resides in `app-demo/static/uploads/`.
    *   **Do not manually add or modify source SCSS or JavaScript files directly in `app-demo/static/`.** These changes will be ignored by `.gitignore` or overwritten by the build script.
*   Changes to the UI library (`adwaita-web/`) or `app-demo`-specific styles (`adwaita-web/scss/_app-demo-specific.scss`) should be made in their respective source files within the `adwaita-web/` directory.
*   After making changes, run the `./build-adwaita-web.sh` script. This compiles SCSS, prepares assets, and copies them to the appropriate locations in `app-demo/static/`.
*   The `app-demo/` application can then be run to test the library changes in a real-world context.

**Styling Guidelines:**
*   **Core Widget Styles:** Modifications to the default appearance or behavior of base Adwaita widgets (e.g., how all `.adw-button` or `.adw-entry` elements look and feel) should be made directly in their respective SCSS partials within `adwaita-web/scss/` (e.g., `_button.scss`, `_entry.scss`).
*   **`app-demo`-Specific Styles:** The file `adwaita-web/scss/_app-demo-specific.scss` is intended for:
    *   Styling unique layout structures of `app-demo` (e.g., the main sidebar layout, specific page containers).
    *   Styling compositions of `adwaita-web` widgets that are unique to `app-demo`.
    *   Minor, one-off presentational tweaks for `app-demo` that do not represent a change to the core widget's default behavior.
    *   It should **not** be used for globally overriding the base styles of core `adwaita-web` widgets.
*   **CSS and JavaScript Interaction**:
    *   Avoid direct manipulation of CSS styles (e.g., `element.style.property = 'value'`) from JavaScript for UI/UX, animations, or core styling.
    *   All fundamental UI/UX appearances, animations, and styles should be defined in the Adwaita-Web UI SCSS files (`adwaita-web/scss/`).
    *   JavaScript should primarily interact with styles by toggling classes, setting attributes (which CSS can select on), or using CSS Custom Properties.
    *   For web components with Shadow DOM, if internal styles need access to asset paths (like icons), prefer using CSS Custom Properties defined in global SCSS to pass these paths rather than hardcoding them in JS or inline styles within the component.

Please consult the respective `AGENTS.md` files in each subdirectory for more detailed, context-specific instructions.
