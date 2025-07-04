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

The `app-demo` application sources its primary CSS (`adwaita-skin.css`) and JavaScript (e.g., `app-layout.js`) from the `adwaita-web` library. These assets are:
1.  Developed and stored within the `adwaita-web/scss/` and `adwaita-web/js/` directories, respectively.
2.  Compiled and/or copied into `app-demo/static/` by the `../build-adwaita-web.sh` script.

**Do not directly place or modify source SCSS or JavaScript files in `app-demo/static/css/` or `app-demo/static/js/`.** Such changes will be ignored by `.gitignore` or overwritten by the build process. All styling and JavaScript development should occur within the `adwaita-web` directory.

Refer to the root `AGENTS.md` and `adwaita-web/AGENTS.md` for more details on asset management and the role of `adwaita-web/scss/_app-demo-specific.scss` for styles unique to this application's layout.

## Adwaita Color Compliance

Please ensure that all UI elements strictly use Adwaita named colors as specified in the [official Adwaita documentation](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1.5/named-colors.html). Do not use hardcoded hex values or other color names unless they are directly derived from or map to these Adwaita named colors. This applies to SCSS files, HTML templates, and any JavaScript that might manipulate styles.
