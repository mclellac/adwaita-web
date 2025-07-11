# Agent Instructions for Adwaita Web Demo Repository

This repository contains two main projects: `adwaita-web/` (a UI library) and `antisocialnet/` (a Flask demo application using the library). This document provides guidance for AI agents working with this repository.

## General Workflow & Build Process

1.  **Source Asset Location:**
    *   All source frontend assets for the `adwaita-web` UI library (SCSS, JavaScript components, icons, fonts) **must** reside within the `adwaita-web/` directory structure (e.g., `adwaita-web/scss/`, `adwaita-web/js/`).
    *   The `antisocialnet/static/` directory is primarily for housing **built/compiled assets** and user-uploaded content.
2.  **Making Changes:**
    *   Changes to the UI library (`adwaita-web/`) or `antisocialnet`-specific styles (`adwaita-web/scss/_antisocialnet-specific.scss`) should be made in their respective source files within the `adwaita-web/` directory.
    *   **Do not manually add or modify source SCSS or JavaScript files directly in `antisocialnet/static/`.** These changes will be ignored by `.gitignore` or overwritten by the build script.
3.  **Building Assets:**
    *   After making changes to `adwaita-web/` sources, run the `./build-adwaita-web.sh` script from the repository root.
    *   This script compiles SCSS, prepares assets (JS, fonts, icons), and copies them to the appropriate locations in `antisocialnet/static/`.
4.  **Testing:**
    *   The `antisocialnet/` application can then be run to test the library changes in a real-world context.

## Adwaita-Web UI Library (`adwaita-web/`)

This section details working with the `adwaita-web` UI library, which aims to implement the Adwaita design language for web applications. Its source is in `adwaita-web/`.

**Directory Structure & Asset Placement:**
*   **SCSS:** All SASS source files are in `adwaita-web/scss/`. The main file `adwaita-skin.scss` is compiled into `adwaita-web/css/adwaita-skin.css` (and then copied by the build script).
*   **JavaScript:** Library-specific JavaScript (e.g., for interactive components like `app-layout.js`, `banner.js`, `toast.js`, or web components like `<adw-dialog>`) resides in `adwaita-web/js/`.
*   **Static Assets:** Icons, fonts, etc., are in `adwaita-web/data/` and `adwaita-web/fonts/`.

**Key Principles:**

1.  **CSS-First Styling:** The primary method for Adwaita styling is CSS classes (e.g., `.adw-button`, `.adw-entry`) on standard HTML. All visual styling should be CSS-achievable.
2.  **JavaScript for Behavior, Not Styling:**
    *   JS should not directly manipulate CSS styles for appearance (e.g., `element.style.color = 'red'`).
    *   Its role is interactivity, behavior, or defining web components.
    *   JS should primarily interact with styles by toggling classes, setting attributes (which CSS can select on), or using CSS Custom Properties.
3.  **Web Components:** Complex interactive components (e.g., Dialogs) are implemented as Custom Elements. Simpler ones (e.g., Spinners) are CSS-only.
4.  **Flexible HTML Structure:** Styles should be flexible, avoiding overly specific selectors unless essential for the component's design.
5.  **CSS Custom Properties & Libadwaita Alignment:** Extensively use CSS custom properties (variables) for theming. Strive to align variable names and theming concepts with those found in the native Libadwaita GTK library.
    *   Global variables are defined in `scss/_variables.scss` on the `:root` element and overridden by `.theme-dark` and accent classes.
    *   For web components with Shadow DOM, if internal styles need access to asset paths (like icons), prefer using CSS Custom Properties defined in global SCSS to pass these paths rather than hardcoding them in JS or inline styles within the component.
6.  **SCSS Usage:** The library uses SCSS, organized into partials (e.g., `_button.scss`) imported into `adwaita-skin.scss`. Utilize SASS features (variables, mixins, nesting).
7.  **Accessibility (A11y):** Styles and components must support accessibility best practices (focus indicators, contrast, ARIA, `prefers-reduced-motion`).

**Development Workflow (within `adwaita-web/`):**

1.  **Modify SCSS/JS:** Edit files in `adwaita-web/scss/` or `adwaita-web/js/`.
2.  **Compile SCSS (Manual):** To test `adwaita-web` examples directly, you might compile SCSS using a SASS compiler:
    ```bash
    # From within adwaita-web/ directory
    sass scss/adwaita-skin.scss css/adwaita-skin.css
    ```
    (Ensure SASS compiler is installed, e.g., `npm install -g sass`).
    **Note:** The main build is done by `../build-adwaita-web.sh` from the repo root for `antisocialnet`.
3.  **Test:** View changes using `adwaita-web/examples/` or by running the full build script and then `antisocialnet`.

**Iconography:**
*   Icons are applied via CSS (SVG masks or background images). Current `index.html` (likely refers to an example) uses `-webkit-mask-image` with SVGs from `adwaita-web/data/icons/`.

**HTML Structure Expectations:**
*   Refer to existing SCSS and examples for expected HTML markup for components (e.g., `<button class="adw-button">`, `<input type="text" class="adw-entry">`).

**Dark Mode:**
*   Handled by a class (e.g., `theme-dark`) on a high-level element. CSS variables in `_variables.scss` change based on this class.

**User Notifications (Banners, Toasts - Component Guidelines):**
*   All transient notifications (`.adw-banner`, `.adw-toast`) **must** include a clearly visible, user-operable dismiss mechanism.
    *   **Banners:** Should include a text button (e.g., "Dismiss"). `banner.js` looks for `.adw-banner-dismiss-button` or `.adwaita-banner-dismiss`.
    *   **Toasts:** Should include a circular 'X' icon button. `toast.js` adds this.
*   Dismiss mechanisms must be functional and accessible.

## AntiSocialNet Application (`antisocialnet/`)

This section provides an overview of the `antisocialnet` Flask application, its structure, features, and conventions. It is based on an audit and aims to assist AI agents.

### 1. Core Application Structure

*   **Application Factory:** Uses `create_app` in `antisocialnet/__init__.py`.
*   **Key Directories:**
    *   `antisocialnet/`: Core code.
        *   `__init__.py`: Factory, blueprint registration, context processors, error handlers.
        *   `models.py`: SQLAlchemy models.
        *   `forms.py`: WTForms.
        *   `routes/`: Blueprints (e.g., `auth_routes.py`).
        *   `static/`: **Built** static assets (CSS, JS from `adwaita-web`), user uploads.
        *   `templates/`: Jinja2 templates.
        *   `config.py`: Configuration classes.
        *   `config.yaml` (and `.example`): YAML config overrides.
    *   `adwaita-web/`: Source for the UI library (see previous section).
    *   `build-adwaita-web.sh` (root dir): Builds `adwaita-web` assets into `antisocialnet/static/`.
*   **Configuration:** Hierarchical: `config.py` defaults -> Environment Vars -> `config.yaml` -> `create_app` args.
*   **Dependencies:** Python deps in `antisocialnet/requirements.txt`. `adwaita-web` needs a SASS compiler for its build.

### 2. Database Models (`antisocialnet/models.py`)

SQLAlchemy models define the database structure. Key models include:

*   **`User(UserMixin, db.Model)`:** Registered users.
    *   `id`, `username` (email, for login, **NOT public display**), `password_hash`, `full_name` (**primary public display name**), `profile_info` (bio), `profile_photo_url`, `is_admin`, `is_approved`, `is_active`, theme/accent preferences, etc.
    *   Relationships: `posts`, `comments`, `likes`, `notifications`, `followers`/`followed`.
*   **`FollowerLink(db.Model)`:** Many-to-many follow relationship.
*   **`Category(db.Model)` & `Tag(db.Model)`:** For posts.
*   **`Post(db.Model)`:** User-created articles.
    *   `content` (Markdown), `user_id`, `created_at`, `is_published`.
    *   Relationships: `author`, `categories`, `tags`, `comments`, `likes`.
*   **`Comment(db.Model)`:** Comments on posts (threaded).
    *   `text` (Markdown), `user_id`, `post_id`, `parent_id`.
    *   Relationships: `author`, `post`, `replies`, `flags`, `likes`.
*   **`UserPhoto(db.Model)`:** User gallery photos.
    *   Relationships: `user`, `comments` (PhotoComment), `likes`.
*   **`PhotoComment(db.Model)`:** Comments on gallery photos.
*   **`CommentFlag(db.Model)`:** Flags on comments.
*   **`Like(db.Model)`:** Polymorphic likes (posts, comments, photos).
*   **`Notification(db.Model)`:** Polymorphic user notifications.
*   **`Activity(db.Model)`:** Polymorphic user activity logging.
*   **`SiteSetting(db.Model)`:** Global key-value site settings.

**IMPORTANT: Database Model Changes & `setup_db.py`**
*   After any changes to `antisocialnet/models.py` (adding/removing/altering tables or columns), the `antisocialnet/setup_db.py` script **MUST** be updated accordingly.
*   This script initializes the schema. Failure to update it will cause errors.
*   Test `setup_db.py` (e.g., `python antisocialnet/setup_db.py --config your_config.yaml --deletedb`) after model changes.

### 3. `setup_db.py` Script

Located at `antisocialnet/setup_db.py`, run from project root (e.g., `python antisocialnet/setup_db.py`).
*   **Functionalities:** Table creation (`db.create_all()`), initial admin user setup (interactive/CLI/YAML), database deletion.
*   **Key Command-Line Arguments:**
    *   `--deletedb`: **Destructive.** Wipes and recreates the public schema. Requires confirmation or non-interactive admin args.
    *   `--skipuser`: Skips initial admin user setup.
    *   `--admin-user <username>`, `--admin-pass <password>`, `--admin-fullname <fullname>`, `--admin-bio <bio>`: Non-interactive admin user creation.
    *   `--config <filepath>`: Path to YAML config file. Overrides `config.py`/env vars. Can define a `USERS` list for batch creation/update (requires `PyYAML`).
        ```yaml
        # Example config.yaml for USERS:
        USERS:
          - username: "admin@example.com"
            password: "securepassword1"
            full_name: "Administrator"
            bio: "Site admin."
            is_admin: true
            is_approved: true
            is_active: true
          # ... more users
        ```
*   **User Creation Precedence:** `--skipuser` -> `USERS` in YAML -> CLI admin args -> Interactive mode.
*   **Database Connection:** Relies on env vars (`POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.) or `DATABASE_URL` if not overridden by `--config`.
*   **Error: `Ident authentication failed...`**: Check PostgreSQL auth method (`pg_hba.conf`) and ensure env vars are correct.

### 4. Running the `antisocialnet` Application

1.  Set `FLASK_APP` (from project root):
    ```bash
    export FLASK_APP=antisocialnet
    ```
2.  Set `FLASK_ENV` (optional, for development):
    ```bash
    export FLASK_ENV=development
    ```
3.  Run:
    ```bash
    flask run
    ```

### 5. Personally Identifiable Information (PII) and User Display Guidelines (CRITICAL)

*   **User Identifiers in `User` model:**
    *   `username`: Stores user's email. **MUST ONLY be used for login, password reset, and internal account management. MUST NOT be used for public display, in user-facing URLs, or for @mention style identifiers.**
    *   `full_name`: User's chosen display name. **Primary name for display** in UI contexts.
*   **Displaying Users:**
    *   Prefer `user.full_name`.
    *   For `@mention` style text or secondary identifier: Use `'@' + user.full_name` (e.g., `@Jane Doe`).
    *   **Under no circumstances display `user.username` (email) to other users.**
*   **Avatar Alt Text & Fallbacks:** Derive from `user.full_name`.
*   **Profile URLs:** Use user ID (e.g., `url_for('profile.view_profile', user_id=user.id)`). *Note: An older AGENTS.md mentioned `user.handle` which is not the current model.*
*   **Logging:** Prefer User ID. If user-facing identifiers are logged, prefer `full_name` or an ID. Log `username` (email) only when essential for debugging auth/account issues, mindful of PII.

### 6. UI Components and Styling (Usage in `antisocialnet`)

`antisocialnet` uses `adwaita-web` for its Adwaita/GTK look and feel.
*   **Build Process:** `build-adwaita-web.sh` compiles `adwaita-web` assets into `antisocialnet/static/`.
*   **Usage in Templates:**
    *   **CSS Classes:** Apply Adwaita classes (e.g., `.adw-button`, `.adw-card`) to HTML in Jinja templates.
    *   **Web Components:** Use `<adw-dialog>`, `<adw-about-dialog>`, etc.
    *   **JS Utilities:** Use `Adw.createToast()`, `banner.js`, `app-layout.js` for dynamic UI.
*   **Key UI Patterns:**
    *   `base.html`: Defines main layout (header bar, responsive sidebar, content area, footer).
    *   Flash messages use banners or toasts.
    *   Cards (`.adw-card`), Lists (`.adw-list-box`, `.adw-action-row`), Adwaita-styled forms.
    *   Dialogs for confirmations and "About" info.
    *   Theme/Accent colors applied via classes on `<html>` from user preferences.
*   **`adwaita-web/scss/_antisocialnet-specific.scss`:**
    *   For styles unique to `antisocialnet`'s layout or specific compositions.
    *   **Must not** override fundamental appearance of core Adwaita widgets.

### 7. Adwaita Styling and Color Compliance (for `antisocialnet`)

1.  **Use Adwaita Named Colors/CSS Variables:**
    *   Strictly use Adwaita named colors (SASS vars in `adwaita-web/scss/_variables.scss`, e.g., `$adw-blue-3`) or, preferably, Adwaita CSS custom properties (e.g., `var(--accent-bg-color)`).
    *   No hardcoded hex values unless derived from Adwaita palette.
2.  **Critical: Do Not Override Core Widget Aesthetics:**
    *   **Do not** use `_antisocialnet-specific.scss` to override fundamental visual appearance of standard Adwaita widgets (e.g., background of `.adw-card`, text colors of `.adw-button.suggested-action`). These must come from Adwaita's CSS variables.
    *   Custom SCSS is for layout, new components, or minor complementary thematic alterations.
    *   If a widget's default Adwaita style seems incorrect, investigate core Adwaita SCSS, not patch in app-specific overrides.
3.  **Adherence to HIG for Widget Choice & Structure:**
    *   Choose Adwaita widgets semantically (per GNOME HIG).
    *   **Toggle Switches vs. Checkboxes:** For boolean settings, Adwaita Switch (e.g., `<input type='checkbox' class='adw-switch'>` styled by CSS) is **always** preferred over simple checkboxes. Ensure HTML structure matches CSS expectations (see `adwaita-web/scss/_switch.scss`).

### 8. Application Features Overview (from `AntiDesign.md`)

(This provides a high-level map, refer to `antisocialnet/routes/` and `antisocialnet/templates/` for details)

*   **Authentication (`auth_routes.py`):** Registration (with admin approval via `is_approved`), Login, Logout, Password Change/Reset.
*   **General (`general_routes.py`):** Index page (public posts / redirects to feed), Activity Feed (`/feed`), Dashboard, Settings (theme/accent, links to admin site settings), Search.
*   **User Profiles (`profile_routes.py`):** View profiles (`/profile/<user_id>`), Edit Profile (bio, photo with crop, privacy), Photo Gallery, Follow/Unfollow, Followers/Following lists.
    *   **Photo Gallery (`gallery_full.html`, uses `profile_routes.py` and `photo_routes.py` for backend):**
        *   Users can upload photos to their gallery (via profile page).
        *   The main gallery view (`/profile/<user_id>/gallery`) displays thumbnails of the user's photos.
        *   **Interactive Liking (Grid):** Liking/unliking a photo directly from the gallery grid view must occur without a page reload. JavaScript should handle the form submission asynchronously and update the like count/button state dynamically.
        *   **Full-Size Photo Dialog:**
            *   Clicking a photo thumbnail in the gallery grid must open a dialog/modal view (e.g., using `<adw-dialog>`).
            *   This dialog must display the full-size photo and its caption.
            *   **Interactive Liking (Dialog):** The dialog must contain like/unlike buttons for the photo. These interactions must also occur without a page reload, updating UI elements within the dialog.
            *   **Comments (Dialog):** The dialog must display existing comments for the photo and allow authenticated users to post new comments. Posting and displaying new comments must happen asynchronously without a page reload.
            *   The backend API for likes and comments should return JSON responses suitable for client-side updates (e.g., new like count, liked status, new comment data).
*   **Posts (`post_routes.py`):** Create (Markdown, categories/tags, immediate publish), View (Markdown rendered, author bio, related posts), Edit, Delete. Comments on posts (threaded, Markdown, delete, flag). Posts by Category/Tag.
*   **Likes (`like_routes.py`):** Polymorphic like/unlike for posts, comments, photos. Ensure endpoints used by client-side JS for photo likes return appropriate JSON (e.g., `{status: 'success', new_like_count: 10, user_has_liked: true}`).
*   **Notifications (`notification_routes.py`):** List user notifications (auto-mark-as-read), types for follows, likes, comments, mentions. Unread count badge.
*   **Admin (`admin_routes.py`):** Comment Flag review, Site Settings management (title, posts per page, registration toggle), Pending User approval.
*   **API (`api_routes.py`):** `/api/v1/feed` (paginated, combined posts/photos for client-side feeds), theme/accent saving endpoints.
