# Agent Instructions for adwaita-web/app-demo

This document provides guidance for AI agents working with the `app-demo` portion of the `adwaita-web` project.

## Database Setup (`setup_db.py`)

The `setup_db.py` script and the main Flask application (`app.py`) connect to a PostgreSQL database. The connection parameters are configured using environment variables.

**Error: `FATAL: Ident authentication failed for user "postgres"` (or similar)**

If you encounter an `OperationalError` from `psycopg2` with a message like `FATAL: Ident authentication failed for user "..."` or `FATAL: password authentication failed for user "..."`, it means the application could not successfully authenticate with your PostgreSQL server using the provided credentials (or lack thereof).

**Required Environment Variables:**

To ensure a successful database connection, you **must** set the following environment variables in your shell session *before* running `python app-demo/setup_db.py` or running the application (e.g., with `flask run`):

1.  **`POSTGRES_USER`**: The username for your PostgreSQL database.
    *   Defaults to `postgres` in the application if not set.
    *   Example: `export POSTGRES_USER=myuser`

2.  **`POSTGRES_PASSWORD`**: The password for the specified PostgreSQL user.
    *   **This is crucial if your PostgreSQL server uses password authentication (e.g., `md5` or `scram-sha-256` in `pg_hba.conf`).**
    *   The application defaults to an empty password if this is not set, which will likely fail if your server requires a password.
    *   Example: `export POSTGRES_PASSWORD=mypassword123`

3.  **`POSTGRES_HOST`**: The hostname or IP address of your PostgreSQL server.
    *   Defaults to `localhost` if not set.
    *   Example: `export POSTGRES_HOST=db.example.com`

4.  **`POSTGRES_DB`**: The name of the database to connect to.
    *   Defaults to `appdb` if not set.
    *   Example: `export POSTGRES_DB=mydemoapp_db`

**Alternative: `DATABASE_URL`**

Alternatively, you can provide the full database connection URI via the `DATABASE_URL` environment variable. If this is set, it will override the individual `POSTGRES_*` variables.

*   Format: `postgresql://username:password@host:port/database`
*   Example: `export DATABASE_URL="postgresql://myuser:mypassword123@localhost:5432/mydemoapp_db"`

**Running the Application (Post-Refactor):**

After the refactor to use an application factory (`create_app` in `app-demo/__init__.py`), the application is run using the `flask` command-line interface. Ensure you are in the `app-demo` directory.

1.  Set `FLASK_APP`:
    ```bash
    export FLASK_APP=app_demo
    ```
    (The `app_demo` here refers to the directory `app-demo/` which is treated as a package, and `flask` will look for `create_app` or `make_app` within its `__init__.py`).

2.  Set `FLASK_ENV` (optional, recommended for development):
    ```bash
    export FLASK_ENV=development
    ```
    This enables debug mode and auto-reloading.

3.  Run the application:
    ```bash
    flask run
    ```

**Why the "Ident authentication failed" error happens:**

PostgreSQL uses a file named `pg_hba.conf` to control client authentication.
*   If this file is configured to use `ident` or `peer` authentication for local connections, PostgreSQL tries to verify that your operating system username matches the database username you're trying to connect as. If they don't match, or `ident` services aren't correctly configured, authentication fails.
*   If `pg_hba.conf` is configured to use `md5` or `scram-sha-256` (which are common for password authentication), then a password must be supplied in the connection string. If `POSTGRES_PASSWORD` is not set, the application attempts to connect without a password, leading to failure.

**To resolve:** Ensure you have set `POSTGRES_PASSWORD` (and other variables as needed) correctly for your PostgreSQL setup. Modifying `pg_hba.conf` on your PostgreSQL server to allow the connection type the application is attempting is an alternative solution but is outside the scope of what this application's code can control.

## Static Assets (CSS, JS)

The `app-demo` application sources its primary CSS (`adwaita-skin.css`) and core JavaScript components from the `adwaita-web` library. These assets are:
1.  Developed and stored within the `adwaita-web/scss/` and `adwaita-web/js/` directories, respectively.
2.  Compiled and/or copied into `app-demo/static/` by the `../build-adwaita-web.sh` script.

Key JavaScript files from `adwaita-web/js/` used by `app-demo` include:
*   `app-layout.js`: For managing the responsive sidebar and overall page layout.
*   `banner.js`: For handling dismissible banner notifications.
*   `toast.js`: For managing toast notifications.

These are typically included in `app-demo/templates/base.html`.

**Do not directly place or modify source SCSS or JavaScript files in `app-demo/static/css/` or `app-demo/static/js/`.** Such changes will be ignored by `.gitignore` or overwritten by the build process. All styling and JavaScript development should occur within the `adwaita-web` directory.

Refer to the root `AGENTS.md` and `adwaita-web/AGENTS.md` for more details on asset management and the role of `adwaita-web/scss/_app-demo-specific.scss` for styles unique to this application's layout.

## Navigation and Core UI

*   **Main Navigation:** The primary navigation is located in the collapsible sidebar (`app-sidebar` in `base.html`).
*   **Header Bar Menu:** A main application menu is available in the header bar (typically triggered by a "view-more" icon). This menu provides access to application-level actions like the "About" dialog.
*   **"About" Dialog:** Information about the application is presented in an Adwaita-styled dialog, triggered from the header bar menu. The `general.about_page` route and `about.html` template are no longer used for a separate page.
*   **"Contact" Page:** The "Contact" page has been removed from the primary navigation.
*   **Home Page / Feed:** For logged-in users, the "Home" link in the sidebar (endpoint `general.activity_feed`) directs to a page displaying a chronological feed of all published posts. For anonymous users, the main index page (`/`) shows public posts.

## User Notifications and Confirmations

*   **Toasts:** Used for brief success messages (e.g., after creating a post). Implemented via `adwaita-web/js/toast.js` and triggered by flashing messages with the `toast_success` category. Toasts include an 'x' icon for dismissal.
*   **Banners:** Used for more prominent information or errors. Implemented via `adwaita-web/js/banner.js` and triggered by flashed messages with categories like `danger`, `warning`, `info`. Banners include a "Dismiss" text button.
*   **Confirmation Dialogs:** Actions requiring user confirmation (e.g., deleting posts or comments) now use Adwaita-styled dialogs implemented directly in the relevant templates (e.g., `post.html`). These replace native browser `confirm()` dialogs and are managed by inline JavaScript within the templates.

## Adwaita Styling and Color Compliance

**1. Use Adwaita Named Colors and CSS Variables:**
Please ensure that all UI elements strictly use Adwaita named colors (defined as SASS variables in `adwaita-web/scss/_variables.scss` like `$adw-blue-3`) or, preferably, the Adwaita CSS custom properties (e.g., `var(--accent-bg-color)`, `var(--window-bg-color)`). Do not use hardcoded hex values or other color names unless they are directly derived from or map to these Adwaita named colors/variables. This applies to SCSS files, HTML templates, and any JavaScript that might manipulate styles. For official Adwaita color palette reference, see the [GNOME HIG](https://developer.gnome.org/hig/reference/palette.html) (though our variable names might differ slightly, the principle is to use the defined set).

**2. Critical Styling Guideline: Do Not Override Core Widget Aesthetics:**
To maintain UI consistency and adherence to Adwaita principles, **do not** use custom SCSS in `_app-demo-specific.scss` to override the fundamental visual appearance of standard Adwaita widgets when such appearance is governed by Adwaita's own CSS variables and component styles. This includes, but is not limited to:
    *   Background colors of elements like `.adw-card`, `.adw-list-box`, `.adw-action-row`. These should use variables like `var(--card-bg-color)`, `var(--view-bg-color)`, `var(--list-row-bg-color)`.
    *   Text colors of standard buttons (e.g., `.adw-button.suggested-action` text should come from `var(--accent-fg-color)`).
    *   Default border colors or shadows of widgets.

Always rely on the core Adwaita CSS variables and the cascade for such properties. Custom SCSS in `_app-demo-specific.scss` should be reserved for:
    *   Layout adjustments specific to `app-demo`'s structure.
    *   Styling entirely new components not provided by Adwaita.
    *   Minor thematic alterations that *complement* Adwaita, not fight its base design (e.g., a specific border on a custom element, not changing all card backgrounds).

Overriding core widget aesthetics leads to inconsistencies, breaks theme adaptability (light/dark/HC), and defeats the purpose of using a consistent design system like Adwaita. If a widget's default Adwaita style seems incorrect, the issue might be in the core Adwaita SCSS for that widget or its variables, which should be investigated there rather than patching with app-specific overrides.

**3. Adherence to HIG for Widget Choice and Structure:**
When implementing UI elements, choose the Adwaita widget that semantically and visually corresponds to the function, as per the GNOME Human Interface Guidelines (HIG). For instance, for an on/off toggle or an enable/disable function, an Adwaita Switch (typically an `<input type='checkbox' class='adw-switch'>` styled accordingly, wrapped in a `<label class='adw-switch'>` with a sibling `<span class='adw-switch-slider'>`) should be used instead of a simple checkbox if the visual representation of a switch is intended. Ensure the HTML structure matches what the Adwaita CSS expects for that widget, as detailed in the component's SCSS file (e.g., `_switch.scss` requires a specific structure for `.adw-switch` to render correctly).
