# Libadwaita-Web Blog CMS Demo

This is a simple Flask-based Blog Content Management System that uses `libadwaita-web` for styling.

## Prerequisites

*   Python 3.x
*   pip (Python package installer)
*   PostgreSQL server

## Setup and Running

1.  **Navigate to the `app-demo` directory (if not already there):**
    If your current directory is the root of the repository, change to the `app-demo` directory:
    ```bash
    cd app-demo
    ```
    All subsequent commands assume you are in the `app-demo` directory.

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Database Setup**:

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
        After configuring your environment variables and ensuring the database and user exist, run the setup script (ensure you are in the `app-demo` directory):
        ```bash
        python setup_db.py
        ```
        This script will:
        *   Create the necessary database tables if they don't already exist.
        *   Guide you through creating an initial admin user for the application.

5.  **Run the Flask development server:**
    Once the database is set up, you can run the application using the Flask CLI.
    Ensure you are in the `app-demo` directory.

    Set the `FLASK_APP` environment variable to point to the application factory:
    ```bash
    export FLASK_APP=app_demo
    ```
    For development mode (enables debugger and automatic reloading), also set `FLASK_ENV`:
    ```bash
    export FLASK_ENV=development
    ```
    Then, run the development server:
    ```bash
    flask run
    ```
    The `app_demo` in `FLASK_APP=app_demo` refers to the `app-demo` directory (which is a Python package containing `__init__.py` where `create_app()` is defined).

6.  Open your web browser and go to `http://127.0.0.1:5000/` (or the address shown in the `flask run` output) to see the application.

## Key Features

*   **User Authentication**: Login, logout, and profile management.
*   **Post Management**: Create, edit, and delete blog posts.
*   **Drafts and Publishing**: Save posts as drafts before publishing them. Published posts are visible to everyone, while drafts are only visible to the author.
*   **Categories and Tags**: Organize posts with categories and tags.
*   **Comments**: Users can comment on posts.
*   **Profile Customization**: Users can edit their profile information, including bio and profile photo.
*   **Theme Customization**: Users can select light/dark mode and accent colors (via Settings API).
*   **Search**: Basic search functionality for posts.
*   **Adwaita Styling**: UI styled with the `adwaita-web` library.

## Project Structure

*   `__init__.py`: (Inside `app-demo/`) Main application package initializer. Contains the Flask `create_app` factory function and initializes extensions.
*   `config.py`: Contains application configuration classes (e.g., for development, production).
*   `models.py`: Defines SQLAlchemy database models.
*   `forms.py`: Defines WTForms classes for handling web forms.
*   `routes/`: Directory containing Blueprints for different parts of the application (e.g., auth, posts).
*   `setup_db.py`: Script for initial database setup (table creation, initial admin user).
*   `requirements.txt`: Python dependencies.
*   `static/`: Contains static assets (CSS, JavaScript, images).
*   `templates/`: Contains HTML templates for the application.
*   `utils.py`: Utility functions for the application.

```
