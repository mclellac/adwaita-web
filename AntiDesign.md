# AntiSocialNet Design Document

## 1. Introduction

This document serves as an audit and design overview of the `antisocialnet` Flask application. Its primary purpose is to assist AI agents in understanding the existing features, UI structure, database models, and established conventions within the project. Adhering to the information outlined here will help prevent regressions, ensure consistency, and facilitate more effective collaboration on future development tasks.

This document is based on a codebase review conducted on October 18, 2024. It reflects the state of the application at that time.

## 2. Core Application Structure

The `antisocialnet` application is a Flask-based web application.

*   **Application Factory:** It utilizes the application factory pattern. The `create_app` function in `antisocialnet/__init__.py` is responsible for initializing and configuring the Flask application instance. This allows for different configurations (e.g., development, production, testing) and helps avoid circular imports.
*   **Key Directories:**
    *   `antisocialnet/`: Contains the core application code.
        *   `__init__.py`: Application factory, blueprint registration, context processors, error handlers.
        *   `models.py`: SQLAlchemy database models.
        *   `forms.py`: WTForms definitions.
        *   `routes/`: Contains Blueprints for different sections of the application (e.g., `auth_routes.py`, `post_routes.py`).
        *   `static/`: Static assets like CSS, JavaScript, images. Note that Adwaita-Web assets are built into here.
        *   `templates/`: Jinja2 HTML templates.
        *   `utils.py`: Utility functions.
        *   `email_utils.py`: Email sending utilities.
        *   `config.py`: Defines different configuration classes (Development, Production, Testing).
        *   `config.yaml` (and `config.yaml.example`): YAML-based configuration file that can override settings from `config.py`.
    *   `adwaita-web/`: Contains the source code for the Adwaita-Web UI library (SCSS, JavaScript components, icons, fonts). This library provides the Adwaita/GTK look and feel for the web application.
        *   `scss/`: Source SCSS files. `adwaita-skin.scss` is the main file.
        *   `js/`: Source JavaScript files for components and utilities.
        *   `build-adwaita-web.sh`: A shell script responsible for compiling SCSS from `adwaita-web/scss/` into `adwaita-web/css/adwaita-skin.css` and then copying the necessary assets (CSS, JS, fonts, icons) into `antisocialnet/static/`.
*   **Database Setup:**
    *   `antisocialnet/setup_db.py`: A script used to initialize the database schema based on `models.py`. It can create tables, set up an initial admin user, and optionally delete and recreate the database. This script is crucial after model changes.
*   **Configuration:**
    *   The application uses a hierarchical configuration system:
        1.  Default values in `antisocialnet/config.py`.
        2.  Values from environment variables (e.g., `FLASK_ENV`, `DATABASE_URL`, `SECRET_KEY`).
        3.  Values from `antisocialnet/config.yaml` (if present) can override settings.
        4.  Values passed directly to `create_app` (e.g., during testing).
*   **Dependencies:**
    *   Key Python dependencies are listed in `antisocialnet/requirements.txt` (e.g., Flask, SQLAlchemy, Flask-Login, Flask-WTF, Werkzeug, Pillow, Bleach, PyJWT, psycopg2-binary).
    *   The `adwaita-web` library itself has no external JavaScript dependencies but requires a SASS compiler (like Dart Sass) for building its CSS.

## 3. Database Models (`antisocialnet/models.py`)

The application uses SQLAlchemy for database interactions. The models define the structure of the database tables and their relationships.

*   **`User(UserMixin, db.Model)`:**
    *   **Purpose:** Represents registered users of the application.
    *   **Key Fields:**
        *   `id`: Primary key.
        *   `username`: Stores the user's email address (unique, used for login). **Must not be publicly displayed.**
        *   `password_hash`: Hashed password.
        *   `full_name`: User's display name (e.g., "Jane Doe"). **Primary name for public display.**
        *   `profile_info`: Text field for user's biography (supports Markdown).
        *   `profile_photo_url`: Path to the user's profile picture.
        *   `website_url`: User's personal website.
        *   Address fields: `street_address`, `city`, `state_province`, `postal_code`, `country`.
        *   Phone fields: `home_phone`, `mobile_phone`.
        *   `birthdate`: User's date of birth.
        *   `is_profile_public`: Boolean, controls visibility of the profile to others.
        *   `theme`: User's preferred theme ('system', 'light', 'dark').
        *   `accent_color`: User's preferred accent color.
        *   `is_admin`: Boolean, indicates if the user has administrative privileges.
        *   `is_approved`: Boolean, indicates if the user's registration has been approved by an admin.
        *   `is_active`: Boolean, indicates if the account is active (used with `is_approved`).
    *   **Relationships:** `posts`, `comments`, `gallery_photos`, `likes`, `notifications`, `followed` (users this user is following), `followers` (users following this user), `activities`.
    *   **Key Methods:** `set_password()`, `check_password()`, `follow()`, `unfollow()`, `is_following()`, `like_item()`, `unlike_item()`, `has_liked_item()`, `get_reset_password_token()`, `verify_reset_password_token()`.

*   **`FollowerLink(db.Model)`:**
    *   **Purpose:** Association table for the many-to-many follow relationship between users.
    *   **Key Fields:** `follower_id` (FK to User), `followed_id` (FK to User), `timestamp`.

*   **`Category(db.Model)`:**
    *   **Purpose:** Represents categories for posts.
    *   **Key Fields:** `id`, `name` (unique), `slug` (unique, auto-generated from name).
    *   **Relationships:** `posts` (many-to-many via `post_categories` table).

*   **`Tag(db.Model)`:**
    *   **Purpose:** Represents tags for posts.
    *   **Key Fields:** `id`, `name` (unique), `slug` (unique, auto-generated from name).
    *   **Relationships:** `posts` (many-to-many via `post_tags` table).

*   **`Post(db.Model)`:**
    *   **Purpose:** Represents blog posts or articles created by users.
    *   **Key Fields:** `id`, `content` (Markdown text), `user_id` (FK to User, author), `created_at`, `updated_at`, `is_published` (boolean, defaults to True), `published_at`.
    *   **Relationships:** `author` (User), `categories` (many-to-many), `tags` (many-to-many), `comments` (one-to-many, top-level comments), `likes` (polymorphic).
    *   **Properties:** `like_count`.

*   **`Comment(db.Model)`:**
    *   **Purpose:** Represents comments made by users on posts. Supports threaded replies.
    *   **Key Fields:** `id`, `text` (Markdown), `created_at`, `user_id` (FK to User, author), `post_id` (FK to Post), `parent_id` (FK to Comment, for replies).
    *   **Relationships:** `author` (User), `post` (Post), `parent` (self-referential for parent comment), `replies` (self-referential for child comments), `flags` (CommentFlag), `likes` (polymorphic).
    *   **Properties:** `is_flagged_active` (boolean, true if there's an unresolved flag), `like_count`.

*   **`UserPhoto(db.Model)`:**
    *   **Purpose:** Represents photos uploaded by users to their gallery.
    *   **Key Fields:** `id`, `user_id` (FK to User, uploader), `image_filename` (path relative to gallery upload folder), `caption` (text), `uploaded_at`.
    *   **Relationships:** `user` (User), `comments` (PhotoComment), `likes` (polymorphic).
    *   **Properties:** `like_count`.

*   **`PhotoComment(db.Model)`:**
    *   **Purpose:** Represents comments made by users on gallery photos.
    *   **Key Fields:** `id`, `text` (plain text, sanitized), `created_at`, `user_id` (FK to User, author), `photo_id` (FK to UserPhoto).
    *   **Relationships:** `author` (User), `photo` (UserPhoto). (Replies are not currently implemented for photo comments).

*   **`CommentFlag(db.Model)`:**
    *   **Purpose:** Represents flags raised by users against comments.
    *   **Key Fields:** `id`, `comment_id` (FK to Comment), `flagger_user_id` (FK to User), `reason` (optional), `created_at`, `is_resolved` (boolean), `resolved_at`, `resolver_user_id` (FK to User, admin who resolved).
    *   **Relationships:** `comment` (Comment), `flagger` (User), `resolver` (User).

*   **`Like(db.Model)`:**
    *   **Purpose:** Polymorphic model to store likes for different types of content (Posts, Comments, UserPhotos).
    *   **Key Fields:** `id`, `user_id` (FK to User), `target_type` (string: 'post', 'comment', 'photo'), `target_id` (integer ID of the liked item), `timestamp`.
    *   **Constraints:** Unique constraint on (`user_id`, `target_type`, `target_id`).
    *   **Relationships:** `user` (User). The target item is accessed dynamically based on `target_type` and `target_id`.

*   **`Notification(db.Model)`:**
    *   **Purpose:** Polymorphic model to store notifications for users.
    *   **Key Fields:** `id`, `user_id` (FK to User, recipient), `actor_id` (FK to User, who performed the action), `type` (string, e.g., 'new_follower', 'new_like'), `target_type` (string), `target_id` (integer), `is_read`, `timestamp`.
    *   **Relationships:** `user` (recipient User), `actor` (User).
    *   **Methods:** `get_target_object()` to fetch the actual item the notification refers to.

*   **`Activity(db.Model)`:**
    *   **Purpose:** Polymorphic model to log user activities for potential feeds or timelines.
    *   **Key Fields:** `id`, `user_id` (FK to User, actor), `type` (string, e.g., 'created_post', 'liked_item'), `target_type` (string), `target_id` (integer), `timestamp`.
    *   **Relationships:** `actor` (User).
    *   **Methods:** `get_target_object()` to fetch the actual item the activity refers to.

*   **`SiteSetting(db.Model)`:**
    *   **Purpose:** Stores global site-wide settings as key-value pairs.
    *   **Key Fields:** `id`, `key` (unique string), `value` (text), `value_type` (string: 'string', 'int', 'bool').
    *   **Static Methods:** `get(key, default)` to retrieve a setting with type conversion, `set(key, value, value_type)` to save a setting.

## 4. Application Features & UI

This section details the application's features, primarily organized by their corresponding route blueprints and template interactions.

### 4.1. Authentication (`auth_routes.py`, `templates/login.html`, `templates/register.html`, etc.)

*   **User Registration:**
    *   Route: `/auth/register`
    *   Form: `RegistrationForm` (`forms.py`)
    *   UI: `templates/register.html`
    *   Functionality: Allows new users to sign up using email (stored as `username`), full name, and password.
    *   Admin Approval: New registrations are created as `is_approved=False` and `is_active=False`. An administrator must approve them via the admin interface.
    *   Site Setting: Registration can be globally enabled/disabled via the `allow_registrations` `SiteSetting`.
*   **User Login:**
    *   Route: `/auth/login`
    *   Form: `LoginForm` (`forms.py`)
    *   UI: `templates/login.html`
    *   Functionality: Authenticates users based on username (email) and password. Checks if the user is active and approved. Redirects to the intended page (`next` parameter) or home/feed.
*   **User Logout:**
    *   Route: `/auth/logout`
    *   Functionality: Logs out the current user and redirects to the index page.
*   **Password Change:**
    *   Route: `/auth/change-password`
    *   Form: `ChangePasswordForm` (`forms.py`)
    *   UI: `templates/change_password.html`
    *   Functionality: Allows logged-in users to change their password by providing their current password and a new password.
*   **Password Reset:**
    *   Request Reset:
        *   Route: `/auth/reset_password_request`
        *   Form: `RequestPasswordResetForm` (`forms.py`)
        *   UI: `templates/request_reset_password.html`
        *   Functionality: Users can request a password reset by entering their email. An email with a unique token is sent.
    *   Reset with Token:
        *   Route: `/auth/reset_password/<token>`
        *   Form: `ResetPasswordForm` (`forms.py`)
        *   UI: `templates/reset_password_with_token.html`
        *   Functionality: Users click the link in the email, enter a new password, and submit. The token's validity and expiration are checked.

### 4.2. General Features (`general_routes.py`, various templates)

*   **Index Page (`/`):**
    *   UI: `templates/index.html`
    *   Functionality:
        *   For anonymous users: Displays a paginated list of all published posts in reverse chronological order.
        *   For authenticated users: Redirects to the Activity Feed (`/feed`).
*   **Activity Feed (`/feed`):**
    *   Route: `/feed` (aliased as "Home" for logged-in users).
    *   UI: `templates/feed.html`
    *   Functionality: Displays a paginated, chronological feed of all published posts for logged-in users. (Future enhancements could make this a personalized feed based on followed users).
*   **Dashboard (`/dashboard`):**
    *   UI: `templates/dashboard.html`
    *   Functionality: For logged-in users, displays a list of their own posts (both published and drafts, though drafts are less relevant with immediate publishing). Provides quick links to view, edit, and delete their posts.
*   **Settings Page (`/settings`):**
    *   UI: `templates/settings.html`
    *   Functionality:
        *   Allows authenticated users to change their preferred theme (System, Light, Dark) and accent color. These preferences are saved to the `User` model and applied via JavaScript and CSS.
        *   Provides links to "Change Password".
        *   If the user is an admin, it also embeds the "Site Settings" form (managed by `admin_routes.site_settings`).
*   **Search (`/search`):**
    *   UI: `templates/search_results.html`
    *   Functionality: Users can search for posts (by content) and users (by username or full name). Results are paginated.
*   **Static/Informational Pages:**
    *   About Page: `templates/about.html` (triggered via main app menu in header).
    *   Contact Page: `templates/contact.html` (currently not linked in main navigation).
*   **API Endpoints (Theme/Accent):**
    *   `/api/settings/theme` (POST): Saves the user's theme preference.
    *   `/api/settings/accent_color` (POST): Saves the user's accent color preference.

### 4.3. User Profiles (`profile_routes.py`, `templates/profile.html`, `templates/edit_profile.html`, etc.)

*   **Viewing Profiles:**
    *   Route: `/profile/<user_id>`
    *   UI: `templates/profile.html`
    *   Functionality: Displays a user's profile.
        *   Shows avatar, full name, @FullName-style handle.
        *   Follow/Unfollow buttons.
        *   Follower/Following counts (links to lists).
        *   Detailed information section (Bio, Age, Address, Phone, Website) if public or viewing own profile.
        *   Paginated list of the user's posts (all for own profile, published-only for others).
        *   Paginated list of the user's comments.
        *   Preview of the user's photo gallery.
    *   Privacy: If a profile is marked as private (`is_profile_public=False`), only the owner can view its full details. Others see a restricted view or a "profile is private" message.
*   **Editing Profiles:**
    *   Route: `/profile/edit`
    *   Form: `ProfileEditForm` (`forms.py`)
    *   UI: `templates/edit_profile.html`
    *   Functionality: Allows the logged-in user to edit their:
        *   Full name, profile info (bio - Markdown, sanitized with Bleach), website URL.
        *   Address and phone details.
        *   Birthdate.
        *   Profile privacy setting (`is_profile_public`).
        *   Profile Photo: Upload new photo, with support for client-side cropping. Old photo is replaced. Photos are resized to a thumbnail.
*   **Photo Gallery:**
    *   Upload:
        *   Route: `/profile/gallery/upload` (POST, part of `profile.html` form)
        *   Form: `GalleryPhotoUploadForm` (`forms.py`)
        *   Functionality: Users can upload one or more photos to their gallery with an optional shared caption.
    *   Viewing Full Gallery:
        *   Route: `/profile/<user_id>/gallery`
        *   UI: `templates/gallery_full.html`
        *   Functionality: Displays all photos in a user's gallery in a grid.
    *   Viewing Single Photo Detail:
        *   Route: `/photo/view/<photo_id>`
        *   UI: `templates/photo_detail.html` (also used for dialog view from profile page gallery preview)
        *   Functionality: Displays a larger version of the photo, its caption, uploader details, like button, and comments.
    *   Deleting Photos:
        *   Route: `/profile/gallery/delete/<photo_id>` (POST)
        *   Functionality: Allows the photo owner or an admin to delete a gallery photo.
    *   Comments on Photos:
        *   API: `/photo/api/photos/<photo_id>/comments` (GET for fetching, POST for adding).
        *   Form: `PhotoCommentForm` (`forms.py`) (used by API for validation).
        *   Functionality: Users can comment on photos. Comments are displayed in the photo detail view/dialog. Mentions are processed.
*   **Follow/Unfollow System:**
    *   Routes: `/profile/follow/<user_id>` (POST), `/profile/unfollow/<user_id>` (POST).
    *   Functionality: Logged-in users can follow and unfollow other users. This creates/deletes `FollowerLink` entries. Notifications and Activity entries are generated for new follows.
*   **Followers/Following Lists:**
    *   Routes: `/profile/<user_id>/followers`, `/profile/<user_id>/following`.
    *   UI: `templates/followers_list.html`, `templates/following_list.html`.
    *   Functionality: Displays paginated lists of users who follow the specified user, or whom the specified user follows.

### 4.4. Posts & Related Features (`post_routes.py`, `templates/post.html`, `templates/create_post.html`, etc.)

*   **Creating Posts:**
    *   Route: `/create`
    *   Form: `PostForm` (`forms.py`)
    *   UI: `templates/create_post.html`
    *   Functionality: Logged-in users can create new posts.
        *   Content is written in Markdown.
        *   Categories and tags can be assigned (input as comma-separated strings, parsed into `Category` and `Tag` objects).
        *   Posts are published immediately (`is_published=True`, `published_at` set).
        *   Activity entries and mention notifications are generated.
*   **Viewing Posts:**
    *   Route: `/posts/<post_id>`
    *   UI: `templates/post.html`
    *   Functionality:
        *   Displays the post content (Markdown rendered to HTML).
        *   Shows author details, publication/update dates, categories, and tags.
        *   Includes an author bio section.
        *   Like button and count.
        *   Threaded comments section.
        *   Lists related posts based on shared tags.
        *   Unpublished posts are only visible to their author.
*   **Editing Posts:**
    *   Route: `/posts/<post_id>/edit`
    *   Form: `PostForm` (`forms.py`)
    *   UI: `templates/edit_post.html`
    *   Functionality: Allows the post author or an admin to edit the content, categories, and tags of a post. `is_published` status is not changed during edit. Mention notifications are re-evaluated.
*   **Deleting Posts:**
    *   Route: `/posts/<post_id>/delete` (POST)
    *   Form: `DeletePostForm` (`forms.py`)
    *   Functionality: Allows the post author or an admin to delete a post. Associated comments, flags, and activities are also deleted.
*   **Comments on Posts:**
    *   Functionality: Integrated into the `post.view_post` route and `templates/post.html`.
    *   Form: `CommentForm` (`forms.py`).
    *   Features:
        *   Users can add comments (Markdown supported).
        *   Threaded replies: Users can reply to existing comments.
        *   Deletion: Comment authors, post authors, and admins can delete comments.
        *   Flagging: Authenticated users can flag comments for admin review. `CommentFlag` objects are created.
        *   Mentions: `@FullName` in comments creates notifications.
        *   Notifications and Activity entries are generated for new comments.
*   **Posts by Category/Tag:**
    *   Routes: `/category/<category_slug>`, `/tag/<tag_slug>`.
    *   UI: `templates/posts_by_category.html`, `templates/posts_by_tag.html`.
    *   Functionality: Displays paginated lists of published posts belonging to a specific category or tag.

### 4.5. Likes (`like_routes.py`)

*   **Polymorphic Likes:**
    *   Routes: `/like/<target_type>/<target_id>` (POST), `/like/unlike/<target_type>/<target_id>` (POST).
    *   Forms: `LikeForm`, `UnlikeForm` (`forms.py`) for CSRF protection.
    *   Functionality: Allows authenticated users to like or unlike various items.
        *   Supported `target_type`: 'post', 'comment', 'photo'.
        *   Creates/deletes `Like` records.
        *   Generates `Notification` for the item's author and `Activity` entries.
    *   UI: Like buttons and counts are typically rendered using the `_macros.html/like_button_and_count` macro.

### 4.6. Notifications (`notification_routes.py`, `templates/notifications.html`)

*   **Listing Notifications:**
    *   Route: `/notifications/`
    *   UI: `templates/notifications.html`
    *   Functionality: Displays a paginated list of the current user's notifications, newest first.
        *   Notifications are automatically marked as read when they appear on the page.
        *   Unread notifications are visually distinct.
        *   The number of unread notifications is shown as a badge in the sidebar.
*   **Types of Notifications:**
    *   `new_follower`: When someone follows the user.
    *   `new_like`: When someone likes the user's post, comment, or photo.
    *   `new_comment`: When someone comments on the user's post.
    *   `new_photo_comment`: When someone comments on the user's photo.
    *   `mention_in_post`: When the user is mentioned in a post.
    *   `mention_in_comment`: When the user is mentioned in a comment on a post.
    *   `mention_in_photo_comment`: When the user is mentioned in a photo comment.
*   **Managing Read Status:**
    *   Routes: `/notifications/mark_read/<notification_id>` (POST), `/notifications/mark_all_read` (POST).
    *   Functionality: Allows users to manually mark individual or all notifications as read. (Though auto-mark-on-view is primary).

### 4.7. Admin Features (`admin_routes.py`, various `templates/admin_*.html`)

*   **Access Control:** All admin routes are protected by the `@admin_required` decorator, which checks `current_user.is_admin`.
*   **Comment Flag Review:**
    *   Route: `/admin/flags`
    *   UI: `templates/admin_flags.html`
    *   Functionality: Admins can view a paginated list of unresolved flagged comments. They can resolve flags (marking them `is_resolved=True`) or delete the offending comment directly from this interface.
*   **Site Settings Management:**
    *   Route: `/admin/site-settings`
    *   Form: `SiteSettingsForm` (`forms.py`)
    *   UI: `templates/admin_site_settings.html` (also embedded in `templates/settings.html` for admins).
    *   Functionality: Admins can modify global site settings:
        *   `site_title`: The title displayed in the browser tab and potentially headers.
        *   `posts_per_page`: Default number of items for pagination.
        *   `allow_registrations`: Toggle to enable/disable new user registrations.
*   **Pending User Management:**
    *   Route: `/admin/pending_users`
    *   UI: `templates/admin_pending_users.html`
    *   Functionality: Admins can view a paginated list of users whose accounts are pending approval (`is_approved=False`). They can approve users (sets `is_approved=True`, `is_active=True`) or reject users (deletes the user record).

### 4.8. API (`api_routes.py`)

*   **Feed Endpoint (`/api/v1/feed` GET):**
    *   Authentication: Requires user to be logged in.
    *   Functionality: Provides a paginated, combined feed of items, currently including published `Post`s and `UserPhoto`s.
    *   Items are sorted by timestamp (descending).
    *   Output includes item details (type, timestamp, actor, type-specific data like content preview, like/comment counts, URLs) and pagination metadata.
    *   Serialization helpers (`serialize_post_item`, `serialize_photo_item`, `serialize_actor`) are used to format the output.
    *   For posts, it indicates if the current user has liked the post.
    *   This endpoint is intended for consumption by client-side JavaScript to build dynamic feeds.

## 5. UI Components and Styling (`adwaita-web/` and Templates)

The application's user interface heavily relies on the `adwaita-web` library, which aims to replicate the look and feel of GNOME's Adwaita/GTK theme for the web.

*   **`adwaita-web` Library:**
    *   **Source:** Located in the `adwaita-web/` directory.
    *   **Assets:** Consists of SCSS for styles (`adwaita-web/scss/`), JavaScript for web components and utilities (`adwaita-web/js/`), icons (`adwaita-web/data/icons/`), and fonts (`adwaita-web/fonts/`).
    *   **Build Process:** The `build-adwaita-web.sh` script compiles the SCSS (primarily `adwaita-skin.scss`) into `adwaita-web/css/adwaita-skin.css` and copies all necessary assets (CSS, JS, fonts, icons) to the `antisocialnet/static/` directory for the Flask application to serve.
    *   **Usage:**
        *   **CSS Classes:** The primary method of applying Adwaita styling is by adding CSS classes (e.g., `.adw-button`, `.adw-entry`, `.adw-list-box`, `.adw-card`, `.adw-header-bar`, `.adw-action-row`) to standard HTML elements in Jinja templates.
        *   **Web Components:** For more complex interactive elements, `adwaita-web` provides JavaScript-defined Custom Elements (Web Components). Examples used in `antisocialnet` include:
            *   `<adw-dialog>`: Used for confirmation dialogs (e.g., delete post, delete comment) and viewing full-size photos.
            *   `<adw-about-dialog>`: Used for the application's "About" information, triggered from the main app menu.
            *   `<adw-spin-row>`: Used in admin settings for numerical input.
        *   **JavaScript Utilities:** Helper functions like `Adw.createToast()` (for temporary notifications) and `banner.js` (for dismissible banners) are used for dynamic UI feedback. `app-layout.js` handles global layout concerns like the responsive sidebar, popover menus, and dialog interactions.

*   **Key UI Patterns and Components in `antisocialnet` Templates:**
    *   **Base Layout (`templates/base.html`):**
        *   Defines the overall HTML structure, including `<head>` (CSS, JS links, theme/accent pre-application script) and `<body>`.
        *   **Header Bar (`<header class="adw-header-bar">`):**
            *   Contains a toggle button for the sidebar.
            *   Displays the page title or site title.
            *   Includes a search input form.
            *   Features a "main app menu" popover (icon button) providing access to "About", "Settings", admin links (if admin), and "Logout".
        *   **Sidebar (`<aside class="app-sidebar">`):**
            *   Collapsible and responsive (slides over content on smaller screens).
            *   Displays user avatar and name (if logged in).
            *   Main navigation links (Home/Feed, Notifications, New Post, Dashboard, Admin links) using `.adw-action-row` elements within an `.adw-list-box`.
        *   **Content Area:** Main content of each page is rendered within an `.app-content-area` which is clamped for width using `.adw-clamp`.
        *   **Flash Messages:** Displayed as banners (using `banner.js`) or toasts (using `Adw.createToast()`).
        *   **Footer:** Minimal, with copyright information.
    *   **Cards (`.adw-card`):** Extensively used for displaying posts (index, feed, profile), comments, and gallery photo previews.
    *   **Lists (`.adw-list-box`, `.adw-action-row`, `.adw-entry-row`, `.adw-combo-row`, `.adw-switch-row`):**
        *   Used for navigation (sidebar), settings pages, admin lists (pending users, flags), displaying comments, and structuring forms.
    *   **Forms:**
        *   Standard HTML forms styled with Adwaita classes.
        *   Input fields use `.adw-entry`.
        *   Buttons use `.adw-button` with modifiers like `.suggested-action` or `.destructive-action`.
        *   Form elements are often wrapped in Adwaita row types for consistent layout (e.g., `.adw-entry-row` for a label and input, `.adw-switch-row` for a setting toggle).
    *   **Dialogs (`<adw-dialog>`, `<adw-about-dialog>`):**
        *   Used for "About" information.
        *   Used for confirming destructive actions (e.g., deleting a post, deleting a comment).
        *   Used to display full-size profile and gallery photos, often including interactive elements like comment sections within the dialog for gallery photos.
    *   **Toasts and Banners:** Used for user feedback (e.g., "Post created successfully!" as a toast, "Invalid login" as a banner).
    *   **Theme and Accent Colors:**
        *   Users can select a theme (Light, Dark, System) and an accent color from the Settings page.
        *   Preferences are stored in the `User` model.
        *   A script in `base.html` applies the theme and accent color classes to the `<html>` element on page load to prevent flashing of unstyled content.
        *   CSS variables are used extensively by `adwaita-web` for theming.
    *   **Macros (`templates/_macros.html`):**
        *   `like_button_and_count`: A key macro used to render the like/unlike button and like count for posts, comments, and photos. It handles CSRF token generation and conditional display based on whether the current user has liked the item.
    *   **Icons:** Symbolic icons (e.g., `icon-actions-open-menu-symbolic`) are used throughout the UI, provided by `adwaita-web`.
    *   **Responsiveness:** The UI incorporates responsive design elements, notably the sidebar which becomes an overlay on smaller screens, and content clamping.

*   **Specific Styling (`adwaita-web/scss/_antisocialnet-specific.scss`):**
    *   This file is intended for styles unique to `antisocialnet`'s layout or specific compositions of Adwaita components that don't belong in the core `adwaita-web` library.
    *   It should **not** be used to override the fundamental appearance of core Adwaita widgets.

## 6. Key Agent Instructions and Conventions (from `AGENTS.md`)

The `AGENTS.md` files in the repository (root, `adwaita-web/`, `antisocialnet/`) provide critical instructions for AI agents working on this codebase. Adherence to these is mandatory. Key summarized points include:

*   **Asset Management:**
    *   Source frontend assets (SCSS, JavaScript, icons, fonts) for the Adwaita-Web UI library **must** reside within `adwaita-web/`.
    *   The `antisocialnet/static/` directory is for **built/compiled assets** generated by `build-adwaita-web.sh` and user-uploaded content.
    *   **Do not manually modify or add source SCSS/JS files directly in `antisocialnet/static/`.**
    *   After changes in `adwaita-web/`, run `./build-adwaita-web.sh` to compile and copy assets.
*   **Styling Guidelines:**
    *   Core Adwaita widget styles should be modified in their respective SCSS partials in `adwaita-web/scss/`.
    *   `adwaita-web/scss/_antisocialnet-specific.scss` is for:
        *   Styling unique `antisocialnet` layout structures.
        *   Styling compositions of `adwaita-web` widgets unique to `antisocialnet`.
        *   Minor, one-off presentational tweaks for `antisocialnet`.
        *   It **must not** be used for globally overriding base styles of core `adwaita-web` widgets.
    *   Avoid direct CSS manipulation from JavaScript; use class toggling or CSS Custom Properties.
*   **Personally Identifiable Information (PII) and User Display (CRITICAL for `antisocialnet/`):**
    *   `User.username` (stores email): **MUST ONLY be used for login, password reset, internal account management.**
    *   `User.username` **MUST NOT be used for public display, in user-facing URLs, or for @mention style identifiers.**
    *   `User.full_name`: **Primary name for display** in most UI contexts.
    *   `@mention` style: Use `@FullName` (e.g., `@Jane Doe`).
    *   Avatar `alt` text and text-based fallbacks: Derive from `full_name`.
    *   Profile URLs: Must be generated using a unique, non-email identifier if `user_id` is not preferred (currently uses `user_id`). The `AGENTS.md` mentions `user.handle` for profile URLs, but the current implementation uses `user_id`. *This is a point of attention: ensure consistency or update `AGENTS.md` if `user_id` is the accepted standard.*
*   **Database Model Changes:**
    *   After any changes to `antisocialnet/models.py` (adding/removing/altering tables or columns), the `antisocialnet/setup_db.py` script **MUST** be updated accordingly to reflect these changes.
    *   Test `setup_db.py` (e.g., with `--deletedb`) after model changes.
*   **Adwaita Color Compliance and HIG:**
    *   Strictly use Adwaita named colors (SASS variables in `_variables.scss`) or Adwaita CSS custom properties (e.g., `var(--accent-bg-color)`).
    *   **Do not override core widget aesthetics** (backgrounds, text colors of standard buttons, default borders/shadows) using `_antisocialnet-specific.scss`. These should come from Adwaita's variables.
    *   Adhere to GNOME HIG for widget choice (e.g., prefer Adwaita Switch over simple checkbox for boolean settings) and ensure HTML structure matches CSS expectations.
*   **JavaScript Interaction with Styles:**
    *   Primarily toggle classes or set attributes that CSS can select on.
    *   Avoid direct `element.style.property = 'value'` for UI/UX or core styling.
*   **Running the Application:**
    *   Use `export FLASK_APP=antisocialnet` and `export FLASK_ENV=development` (optional), then `flask run`.
*   **`setup_db.py` Command-Line Arguments:**
    *   `--deletedb`: Destructive; wipes and recreates the public schema.
    *   `--skipuser`: Skips initial admin user setup.
    *   `--admin-user`, `--admin-pass`, etc.: For non-interactive admin user creation.
    *   `--config <filepath>`: Allows overriding config with a YAML file, which can also define a `USERS` list for batch creation/update.
