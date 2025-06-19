# Libadwaita-Web Blog CMS Demo

This is a simple Flask-based Blog Content Management System that uses `libadwaita-web` for styling.

## Prerequisites

*   Python 3.x
*   pip (Python package installer)

## Setup and Running

1.  **Navigate to the `app-demo` directory:**
    ```bash
    cd app-demo
    ```
    (Or ensure you are in this directory if you've just cloned the repository and `app-demo` is the root).

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
        You must have a PostgreSQL server running and accessible.

    *   **Configure Database Connection**:
        The application connects to PostgreSQL using a connection URI. You should set the `DATABASE_URL` environment variable. For example, in your terminal:
        ```bash
        export DATABASE_URL="postgresql://youruser:yourpassword@yourhost:yourport/yourdbname"
        ```
        Replace `youruser`, `yourpassword`, `yourhost`, `yourport`, and `yourdbname` with your actual PostgreSQL credentials and database details.
        If `DATABASE_URL` is not set, the application will attempt to connect to `postgresql://user:password@localhost/dbname` by default (as defined in `app.py`).

    *   **Initialize Database and Create Admin User**:
        From within the `app-demo` directory, run the setup script:
        ```bash
        python setup_db.py
        ```
        This script will:
        *   Create the necessary database tables if they don't already exist (based on the models in `app.py`).
        *   Guide you through creating an initial admin user. It will prompt for a username (default: `admin`), a password, and optional profile information. If the specified admin user already exists, it will offer to update the password.

5.  **Run the Flask development server:**
    Once the database is set up, you can run the application:
    ```bash
    python app.py
    ```

6.  Open your web browser and go to `http://127.0.0.1:5000/` to see the application.

## Project Structure

*   `app.py`: Main Flask application file, contains routes and logic.
*   `setup_db.py`: Script for initial database setup (table creation, initial user).
*   `requirements.txt`: Python dependencies.
*   `static/`: Contains static assets.
    *   `libadwaita-web/`: Copied `libadwaita-web` CSS and JS files.
*   `templates/`: Contains HTML templates for the application.
    *   `base.html`: Base template with `libadwaita-web` structure.
    *   `index.html`: Page to list all blog posts.
    *   `post.html`: Page to display a single blog post.
    *   `create_post.html`: Page with a form to create new blog posts.
    *   `profile.html`: Displays user profile.
    *   `edit_profile.html`: Page to edit user profile information.
    *   `login.html`: User login page.
*   `tests/`: Contains unit and integration tests.
    *   `test_app.py`: Pytest tests for the application.

```
