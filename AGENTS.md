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
    *   Currently, `app-demo` uses a manually included (or to-be-built and copied) version of the `adwaita-web` library's assets (CSS, JS, icons, fonts). Refer to `build-adwaita-web.sh` for an example of how these might be prepared and copied into `app-demo/static/`.
    *   For specific instructions related to the `app-demo` application (e.g., running the Flask app, database setup, testing), please refer to the `app-demo/AGENTS.md` file.

**General Workflow:**

*   Changes to the UI library should generally be made within the `adwaita-web/` directory.
*   After making changes to `adwaita-web/`, these changes need to be reflected in `app-demo/static/` for the demo app to pick them up. This might involve running a build script (like `build-adwaita-web.sh`) or manually copying the relevant files.
*   The `app-demo/` application can then be run to test the library changes in a real-world context.

Please consult the respective `AGENTS.md` files in each subdirectory for more detailed, context-specific instructions.
