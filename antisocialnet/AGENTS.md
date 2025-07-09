# Agent Instructions for adwaita-web/antisocialnet

This document provides guidance for AI agents working with the `antisocialnet` portion of the `adwaita-web` project.

## Database Setup and Management (`setup_db.py`)

The `antisocialnet/setup_db.py` script is crucial for initializing and managing the application's PostgreSQL database schema and initial data. It should be run from the project root directory (e.g., `python antisocialnet/setup_db.py`).

**Core Functionalities:**

*   **Table Creation:** Ensures all database tables defined in `antisocialnet/models.py` are created if they don't already exist. This is done by calling `db.create_all()`.
*   **Initial Admin User:** Can create or update an initial administrative user. This can be done interactively (prompting for username/password) or non-interactively via command-line arguments.
*   **Database Deletion (`--deletedb`):** Provides an option to completely wipe and recreate the database schema.

**Key Command-Line Arguments:**

*   `--deletedb`:
    *   **WARNING: This is a destructive operation.**
    *   When used, the script will execute `DROP SCHEMA public CASCADE;` followed by `CREATE SCHEMA public;` (for PostgreSQL). This effectively deletes all tables, data, sequences, and other objects within the `public` schema and then recreates an empty schema.
    *   After this, `db.create_all()` is called to recreate the tables based on the current models.
    *   Confirmation is required in interactive mode. Can be run non-interactively if admin user arguments are also provided.
*   `--skipuser`: Skips the initial admin user setup/update process.
*   `--admin-user <username>`: Sets the admin username non-interactively.
*   `--admin-pass <password>`: Sets the admin password non-interactively. Requires `--admin-user`.
*   `--admin-fullname <fullname>`: Sets the admin display name non-interactively.
*   `--admin-bio <bio>`: Sets the admin bio non-interactively.
*   `--config <filepath>`:
    *   Allows overriding configuration settings for the script's execution by providing a path to a YAML configuration file.
    *   Settings in this YAML file will take precedence over those defined in `antisocialnet/config.py` or environment variables.
    *   Flask configuration keys are typically uppercase (e.g., `SQLALCHEMY_DATABASE_URI`).
    *   This file can also be used to define a list of users for batch creation/update using the `USERS` key.
    *   Example `config.yaml` structure:
        ```yaml
        SQLALCHEMY_DATABASE_URI: "postgresql://script_user:script_pass@localhost/script_db"
        SECRET_KEY: "custom_script_secret"

        USERS:
          - username: "admin@example.com"
            password: "securepassword1"
            full_name: "Administrator"
            bio: "Site admin."
            is_admin: true
            is_approved: true # Optional, defaults to true for YAML users
            is_active: true   # Optional, defaults to true for YAML users
          - username: "editor@example.com"
            password: "anotherpassword"
            full_name: "Editor User"
            bio: "Content editor."
            is_admin: false
            # is_approved and is_active will default to true
          - username: "existinguser@example.com" # If this user exists
            password: "newpassword"             # Their password and other details will be updated
            full_name: "Existing User Updated Name"
            bio: "Updated bio."
            is_admin: false # Ensure all fields are specified if updating
        ```
    *   **Supported fields for each user in the `USERS` list:** `username` (required), `password` (required), `full_name` (required), `bio` (optional), `is_admin` (optional, defaults to `False`), `is_approved` (optional, defaults to `True`), `is_active` (optional, defaults to `True`).
    *   **Dependency:** This feature requires the `PyYAML` library. If not installed, the script will print an error. Install it via `pip install PyYAML`.

**User Creation Precedence:**

The script determines how to handle user creation/setup based on the following order:
1.  **`--skipuser`**: If this flag is present, all user setup is skipped.
2.  **`USERS` list in YAML (`--config <filepath>`):** If `--config` is used, a `USERS` list is present in the YAML file, and `--skipuser` is NOT used, the script will non-interactively create or update users based on this list. This takes precedence over CLI arguments for single admin user creation and interactive mode.
3.  **Command-Line Admin Arguments (`--admin-user`, `--admin-pass`):** If `--skipuser` is not used and no users were processed from a YAML `USERS` list, the script checks for `--admin-user` and `--admin-pass` arguments. If provided, it will non-interactively create or update a single admin user with these details.
4.  **Interactive Mode:** If none of the above conditions are met (not skipping, no YAML users, no CLI admin arguments), the script will fall back to prompting interactively for the details of a single initial admin user.

**Important Considerations:**

*   **Environment Variables for Database Connection:** The script (and the main application) relies on environment variables for database connection parameters if not overridden by a `--config` file. These include:
    *   `POSTGRES_USER` (defaults to `postgres`)
    *   `POSTGRES_PASSWORD` (defaults to empty if not set)
    *   `POSTGRES_HOST` (defaults to `localhost`)
    *   `POSTGRES_DB` (defaults to `appdb`)
    *   Alternatively, `DATABASE_URL` can be set to the full connection string (e.g., `postgresql://user:pass@host:port/dbname`).
*   **Error: `FATAL: Ident authentication failed...` or `FATAL: password authentication failed...`**: This means the script could not authenticate with PostgreSQL. Ensure your environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.) are correctly set for your PostgreSQL server's authentication method (see `pg_hba.conf`).
*   **Synchronization with Models:**
    *   **CRITICAL WARNING:** This script directly manipulates the database schema. Any changes to SQLAlchemy models in `antisocialnet/models.py` (e.g., adding/removing tables or columns, altering relationships) require careful consideration of `setup_db.py`'s logic.
    *   The `db.create_all()` command will attempt to create tables according to the current models.
    *   The `--deletedb` option completely rebuilds the schema. Ensure this behavior is understood, especially in environments with existing data.
    *   For more complex schema changes (migrations) in a production-like environment, a proper migration tool like Alembic (Flask-Migrate) would typically be used, but `setup_db.py` is suitable for initial setup and development/testing resets.

**Running the Application (Post-Refactor):**

After the refactor to use an application factory (`create_app` in `antisocialnet/__init__.py`), the application is run using the `flask` command-line interface. Ensure you are in the `antisocialnet` directory.

1.  Set `FLASK_APP`:
    ```bash
    export FLASK_APP=antisocialnet
    ```
    (The `antisocialnet` here refers to the directory `antisocialnet/` which is treated as a package, and `flask` will look for `create_app` or `make_app` within its `__init__.py`).

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

The `antisocialnet` application sources its primary CSS (`adwaita-skin.css`) and core JavaScript components from the `adwaita-web` library. These assets are:
1.  Developed and stored within the `adwaita-web/scss/` and `adwaita-web/js/` directories, respectively.
2.  Compiled and/or copied into `antisocialnet/static/` by the `../build-adwaita-web.sh` script.

Key JavaScript files from `adwaita-web/js/` used by `antisocialnet` include:
*   `app-layout.js`: For managing the responsive sidebar and overall page layout.
*   `banner.js`: For handling dismissible banner notifications.
*   `toast.js`: For managing toast notifications.

These are typically included in `antisocialnet/templates/base.html`.

**Do not directly place or modify source SCSS or JavaScript files in `antisocialnet/static/css/` or `antisocialnet/static/js/`.** Such changes will be ignored by `.gitignore` or overwritten by the build process. All styling and JavaScript development should occur within the `adwaita-web` directory.

Refer to the root `AGENTS.md` and `adwaita-web/AGENTS.md` for more details on asset management and the role of `adwaita-web/scss/_antisocialnet-specific.scss` for styles unique to this application's layout.

## Navigation and Core UI

*   **Main Navigation:** The primary navigation is located in the collapsible sidebar (`app-sidebar` in `base.html`).
*   **Header Bar Menu:** A main application menu is available in the header bar (typically triggered by a "view-more" icon). This menu provides access to application-level actions like the "About" dialog.
*   **"About" Dialog:** Information about the application is presented in an Adwaita-styled dialog, triggered from the header bar menu. The `general.about_page` route and `about.html` template are no longer used for a separate page.
*   **"Contact" Page:** The "Contact" page has been removed from the primary navigation.
*   **Home Page / Feed:** For logged-in users, the "Home" link in the sidebar (endpoint `general.activity_feed`) directs to a page displaying a chronological feed of all published posts. For anonymous users, the main index page (`/`) shows public posts.

## User Notifications and Confirmations

*   **Toasts:** Used for brief success messages (e.g., after creating a post). Implemented via `adwaita-web/js/toast.js` and triggered by flashing messages with the `toast_success` category. Toasts include an 'x' icon for dismissal.
*   **Banners:** Used for more prominent information or errors. Implemented via `adwaita-web/js/banner.js` and triggered by flashed messages with categories like `danger`, `warning`, `info`. Banners include a "Dismiss" text button.
*   **Confirmation Dialogs:** Actions requiring user confirmation (e.g., deleting posts or comments) now use Adwaita-styled dialogs (`<adw-dialog>` custom elements) declared directly in the relevant templates (e.g., `post.html`). These replace native browser `confirm()` dialogs. Their activation and interaction logic (opening, closing, handling cancel/confirm button clicks that lead to form submissions) is primarily managed by global JavaScript in `adwaita-web/js/app-layout.js`.

## Adwaita Styling and Color Compliance

**1. Use Adwaita Named Colors and CSS Variables:**
Please ensure that all UI elements strictly use Adwaita named colors (defined as SASS variables in `adwaita-web/scss/_variables.scss` like `$adw-blue-3`) or, preferably, the Adwaita CSS custom properties (e.g., `var(--accent-bg-color)`, `var(--window-bg-color)`). Do not use hardcoded hex values or other color names unless they are directly derived from or map to these Adwaita named colors/variables. This applies to SCSS files, HTML templates, and any JavaScript that might manipulate styles. For official Adwaita color palette reference, see the [GNOME HIG](https://developer.gnome.org/hig/reference/palette.html) (though our variable names might differ slightly, the principle is to use the defined set).

**2. Critical Styling Guideline: Do Not Override Core Widget Aesthetics:**
To maintain UI consistency and adherence to Adwaita principles, **do not** use custom SCSS in `_app-demo-specific.scss` to override the fundamental visual appearance of standard Adwaita widgets when such appearance is governed by Adwaita's own CSS variables and component styles. This includes, but is not limited to:
    *   Background colors of elements like `.adw-card`, `.adw-list-box`, `.adw-action-row`. These should use variables like `var(--card-bg-color)`, `var(--view-bg-color)`, `var(--list-row-bg-color)`.
    *   Text colors of standard buttons (e.g., `.adw-button.suggested-action` text should come from `var(--accent-fg-color)`).
    *   Default border colors or shadows of widgets.

Always rely on the core Adwaita CSS variables and the cascade for such properties. Custom SCSS in `_antisocialnet-specific.scss` should be reserved for:
    *   Layout adjustments specific to `antisocialnet`'s structure.
    *   Styling entirely new components not provided by Adwaita.
    *   Minor thematic alterations that *complement* Adwaita, not fight its base design (e.g., a specific border on a custom element, not changing all card backgrounds).

Overriding core widget aesthetics leads to inconsistencies, breaks theme adaptability (light/dark/HC), and defeats the purpose of using a consistent design system like Adwaita. If a widget's default Adwaita style seems incorrect, the issue might be in the core Adwaita SCSS for that widget or its variables, which should be investigated there rather than patching with app-specific overrides.

**3. Adherence to HIG for Widget Choice and Structure:**
When implementing UI elements, choose the Adwaita widget that semantically and visually corresponds to the function, as per the GNOME Human Interface Guidelines (HIG).

*   **Toggle Switches vs. Checkboxes**: For boolean settings (on/off, enable/disable), an Adwaita Switch (visual toggle switch) should **always** be preferred over a simple checkbox. Adwaita's implementation typically involves an `<input type='checkbox' class='adw-switch'>` styled accordingly, wrapped in a `<label class='adw-switch'>` with a sibling `<span class='adw-switch-slider'>`. Ensure the HTML structure matches what the Adwaita CSS expects for that widget, as detailed in the component's SCSS file (e.g., `adwaita-web/scss/_switch.scss` requires a specific structure for `.adw-switch` to render correctly). Simple checkboxes (`<input type="checkbox">` without switch styling) should generally be avoided for settings.

Ensure the HTML structure matches what the Adwaita CSS expects for that widget, as detailed in the component's SCSS file.

---

## Database Model Changes (NEW SECTION)

**IMPORTANT**: After any changes to database models in `antisocialnet/models.py` (e.g., adding, removing, or altering tables or columns), you **MUST** also update the `antisocialnet/setup_db.py` script accordingly.

This script is responsible for initializing the database schema. If it's not kept in sync with the models, errors will occur during database setup or application runtime.

**Procedure:**
1.  Modify `antisocialnet/models.py`.
2.  Carefully review `antisocialnet/setup_db.py` and make any necessary adjustments to reflect the model changes. This might involve:
    *   Ensuring `db.create_all()` correctly creates the new schema.
    *   Updating any initial data seeding logic if model structures have changed.
    *   Modifying how tables are dropped or created if specific logic beyond `db.create_all()` is used.
    *   If new tables or columns are added, ensure they are correctly initialized or populated if `setup_db.py` handles initial data.
3.  Test `antisocialnet/setup_db.py` (e.g., by running `python antisocialnet/setup_db.py --config your_config.yaml --deletedb`) to confirm it works with the updated models.

Failure to update `setup_db.py` is a common source of errors and will likely be caught by the user. Always remember this step.
