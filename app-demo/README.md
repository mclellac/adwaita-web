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

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask development server:**
    ```bash
    python app.py
    ```

5.  Open your web browser and go to `http://127.0.0.1:5000/` to see the application.

## Project Structure

*   `app.py`: Main Flask application file, contains routes and logic.
*   `requirements.txt`: Python dependencies.
*   `static/`: Contains static assets.
    *   `libadwaita-web/`: Copied `libadwaita-web` CSS and JS files.
*   `templates/`: Contains HTML templates for the application.
    *   `base.html`: Base template with `libadwaita-web` structure.
    *   `index.html`: Page to list all blog posts.
    *   `post.html`: Page to display a single blog post.
    *   `create_post.html`: Page with a form to create new blog posts.
```
