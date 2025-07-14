# Libadwaita-Web Blog CMS Demo

This is a simple Flask-based Blog Content Management System that uses `libadwaita-web` for styling.

## Prerequisites

*   Python 3.x
*   pip (Python package installer)
*   PostgreSQL server
*   [Dart Sass](https://sass-lang.com/install) (for compiling Adwaita-Web SCSS). The `build-adwaita-web.sh` script, located in the repository root, is used for building the Adwaita-Web assets and expects `dart-sass/sass` to be executable.

## Setup and Running

1.  **Navigate to the `antisocialnet` directory (if not already there):**
    If your current directory is the root of the repository, change to the `antisocialnet` directory:
    ```bash
    cd antisocialnet
    ```
    All subsequent commands assume you are in the `antisocialnet` directory.

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Build Adwaita-Web Assets:**
    The `adwaita-web` SCSS and JavaScript assets need to be compiled/copied into the `antisocialnet/static` directory.
    Navigate to the **root of the repository** (e.g., `cd ..` if you are in `antisocialnet`) and run the build script:
    ```bash
    ./build-adwaita-web.sh
    ```
    After the script completes, navigate back to the `antisocialnet` directory for subsequent steps:
    ```bash
    cd antisocialnet
    ```

5.  **Database Setup**:

    This application uses a PostgreSQL database to store user and blog post data.

    *   **Ensure PostgreSQL is Running**:
        You must have a PostgreSQL server running and accessible. The application defaults expect a PostgreSQL server running on `localhost` accessible by user `postgres` with password `postgres`.

    *   **Configure Database Connection (Recommended Method: Environment Variables)**:
        It is **strongly recommended** to configure the database connection using the following environment variables:
        *   `POSTGRES_USER`: The username for the PostgreSQL database. (Application default: `postgres`)
        *   `POSTGRES_PASSWORD`: The password for the PostgreSQL user. **This must be set to the correct password for the specified user when connecting via TCP/IP (e.g., to `localhost`).** (Application default: `postgres`)
        *   `POSTGRES_HOST`: The host of the PostgreSQL server. (Application default: `localhost`)
        *   `POSTGRES_DB`: The name of the PostgreSQL database. (Application default: `appdb`)

        **Example for typical password authentication (TCP/IP to localhost):**
        Set these variables in your terminal before running the application:
        ```bash
        export POSTGRES_USER="myuser"         # Or your actual PostgreSQL username
        export POSTGRES_PASSWORD="mypassword" # The password you set for 'myuser'
        export POSTGRES_HOST="localhost"      # Or your actual PostgreSQL host
        export POSTGRES_DB="mydb"             # Or your actual database name
        ```

    *   **Alternative: Using `DATABASE_URL`**:
        You can also set the `DATABASE_URL` environment variable directly. If set, it will override the individual `POSTGRES_*` variables.
        ```bash
        export DATABASE_URL="postgresql://myuser:mypassword@localhost/mydb"
        ```

    *   **Note on Peer Authentication (Advanced)**:
        If you wish to use peer authentication (common for local Unix socket connections where the database user matches the system user):
        1.  Set `POSTGRES_PASSWORD` to an empty string: `export POSTGRES_PASSWORD=""`
        2.  Set `POSTGRES_HOST` to the directory containing the PostgreSQL Unix domain socket. Common locations include `/var/run/postgresql` or `/tmp`. (e.g., `export POSTGRES_HOST="/var/run/postgresql"`)
        3.  **Crucially, the script (`setup_db.py` or when running the app) must be run by a system user whose username exactly matches the `POSTGRES_USER` configured in the database** (e.g., if `POSTGRES_USER` is `myuser`, you must run the Python script as the `myuser` system user).
        Peer authentication is generally more complex to set up correctly for web applications and is less common than password authentication when connecting from an application.

    *   **Creating a PostgreSQL User and Database (if they don't exist):**
        If you need to create a new user and database, you can use `psql` commands.
        Connect to your PostgreSQL server (you might need to do this as the `postgres` superuser, e.g., `sudo -u postgres psql`):
        ```bash
        sudo -u postgres psql
        ```
        Then, in the `psql` prompt:
        ```sql
        -- Create a new user. Replace 'myuser' and 'mypassword' with your desired credentials.
        -- This password ('mypassword') is what you should set for the POSTGRES_PASSWORD environment variable.
        CREATE USER myuser WITH PASSWORD 'mypassword';

        -- Create a new database and set the owner to your new user.
        CREATE DATABASE mydb OWNER myuser;

        -- Optional: Grant all privileges on the new database to the new user.
        -- GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;

        -- Exit psql
        \q
        ```
        If you are using the default application user `postgres` and have set its password to `postgres`, you might not need to create a new user, but ensure the `postgres` user has a password set in the database.

    *   **Initialize Database and Create Admin User**:
        After configuring your environment variables and ensuring the database and user exist, navigate into the `antisocialnet` directory if you aren't already there. Then, run the setup script:
        ```bash
        # Make sure you are in the antisocialnet directory
        python setup_db.py
        ```
        This script will:
        *   Create the necessary database tables if they don't already exist.
        *   Guide you through creating an initial admin user for the application.

6.  **Run the Flask development server:**
    Once the database is set up, you can run the application using the Flask CLI.
    Ensure you are in the `antisocialnet` directory.

    Set the `FLASK_APP` environment variable to point to the application factory:
    ```bash
    export FLASK_APP=antisocialnet
    ```
    For development mode (enables debugger and automatic reloading), also set `FLASK_ENV`:
    ```bash
    export FLASK_ENV=development
    ```
    Then, run the development server:
    ```bash
    flask run
    ```
    The `antisocialnet` in `FLASK_APP=antisocialnet` refers to the `antisocialnet` directory (which is a Python package containing `__init__.py` where `create_app()` is defined).

7.  Open your web browser and go to `http://127.0.0.1:5000/` (or the address shown in the `flask run` output) to see the application.

## Running Tests

The application includes a test suite using `pytest`.

1.  **Navigate to the `antisocialnet` directory** (if not already there).
2.  **Ensure dependencies are installed**, including `pytest` (it's part of `requirements.txt`).
3.  **Configure Test Database Environment Variables:**
    The tests will create and destroy their own database tables. It's recommended to use a separate database for testing. You can configure this using the same environment variables as for development (e.g., `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DB`), but point `POSTGRES_DB` to a dedicated test database name.
    ```bash
    export POSTGRES_USER="your_test_db_user"      # Default: postgres
    export POSTGRES_PASSWORD="your_test_db_password" # Default: postgres
    export POSTGRES_HOST="localhost"             # Default: localhost
    export POSTGRES_DB="appdb_test"              # Example: appdb_test (choose a name for your test DB)
    ```
    The `setup_db.py` script (which can be invoked by tests or manually) will handle table creation. If the test database itself doesn't exist, you might need to create it once using `psql` before running tests for the first time:
    ```pql
    -- In psql, connected as a superuser or a user with CREATEDB rights:
    CREATE DATABASE appdb_test OWNER your_test_db_user;
    ```

4.  **Run tests using pytest:**
    From the `antisocialnet` directory:
    ```bash
    python -m pytest
    ```
    Or simply:
    ```bash
    pytest
    ```

## Key Features

*   **API-Driven**: All functionality is exposed through a RESTful API.
*   **Polymorphic Models**: The database schema is designed to be polymorphic, allowing for different types of postable items (e.g., posts, photos, documents) and likeable items.
*   **User Authentication**: Login, logout, and profile management.
*   **Post Management**: Create, edit, and delete posts.
*   **Photo Management**: Upload and manage photos.
*   **Comments**: Users can comment on posts and photos.
*   **Likes**: Users can like posts, photos, and comments.
*   **Profile Customization**: Users can edit their profile information, including bio and profile photo.
*   **Theme Customization**: Users can select light/dark mode and accent colors.
*   **Adwaita Styling**: UI styled with the `adwaita-web` library.

## Project Structure

*   `__init__.py`: Main application package initializer.
*   `api_utils.py`: Utility functions for the API.
*   `config.py`: Application configuration.
*   `models.py`: SQLAlchemy database models with a polymorphic design.
*   `forms.py`: WTForms classes.
*   `routes/`: Blueprints for different parts of the application.
    *   `api_routes.py`: Defines the RESTful API endpoints.
*   `setup_db.py`: Script for initial database setup.
*   `requirements.txt`: Python dependencies.
*   `static/`: Static assets (CSS, JavaScript, images).
*   `templates/`: HTML templates (primarily for the initial page load, with dynamic content loaded via the API).
*   `utils.py`: Utility functions.

```
