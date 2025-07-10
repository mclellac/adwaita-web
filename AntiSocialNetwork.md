# AntiSocialNetwork Design Document

This document outlines the features, systems, APIs, and project structure of the AntiSocialNetwork application.

## 1. Overview

AntiSocialNetwork is a web application designed to mimic a social networking platform, built with Flask for the backend and utilizing the Adwaita-Web UI framework for a GNOME-like frontend experience. It allows users to register, create posts, comment, upload photos, follow other users, and interact with content through likes. The application also includes administrative features for user and content management.

## 2. Core Features

*   **User Registration and Authentication:** Secure user sign-up, login, and session management.
*   **Profile Management:** Users can create and customize their profiles with personal information, a bio, and a profile picture.
*   **Content Creation:**
    *   **Posts:** Users can create rich-text posts using Markdown.
    *   **Comments:** Users can comment on posts and photos.
    *   **Photos:** Users can upload photos to their personal gallery.
*   **Social Interaction:**
    *   **Following:** Users can follow/unfollow other users.
    *   **Likes:** Users can like posts, comments, and photos.
    *   **Notifications:** Users receive notifications for relevant activities (new followers, likes, comments, mentions).
    *   **Mentions:** Users can mention others in posts and comments using `@fullname`.
*   **Feed:** A chronological feed of posts from followed users or all public posts.
*   **Search:** Users can search for posts and other users.
*   **Administration:** Admin panel for managing users (approval, rejection), site settings, and flagged content.
*   **API:** A RESTful API for certain frontend interactions (e.g., theme settings, feed retrieval).
*   **Theming:** Light/dark mode and accent color customization, powered by Adwaita-Web.

## 3. User Management & Authentication

*   **Models:**
    *   `User` (`antisocialnet/models.py`): Stores user details including username (email), password hash, full name, profile information, theme preferences, admin status, approval status, and activity status.
*   **Forms:**
    *   `LoginForm`, `RegistrationForm`, `ChangePasswordForm`, `RequestPasswordResetForm`, `ResetPasswordForm` (`antisocialnet/forms.py`).
*   **Routes:**
    *   Located in `antisocialnet/routes/auth_routes.py`.
    *   `/auth/register`: Allows new users to sign up. Registrations require admin approval (`is_approved=False`, `is_active=False` by default).
    *   `/auth/login`: Authenticates users.
    *   `/auth/logout`: Logs users out.
    *   `/auth/change-password`: Allows logged-in users to change their password.
    *   `/auth/reset_password_request`: Allows users to request a password reset email.
    *   `/auth/reset_password/<token>`: Allows users to set a new password using a token.
*   **Authentication Flow:**
    *   Flask-Login is used for session management (`login_user`, `logout_user`, `current_user`).
    *   `login_manager.user_loader` loads users.
    *   Passwords are hashed using `werkzeug.security.generate_password_hash` and verified with `check_password_hash`.
    *   Password reset tokens are JWTs generated using `PyJWT`.
*   **Profile:**
    *   `ProfileEditForm` (`antisocialnet/forms.py`) for updating profile details.
    *   Route: `/profile/edit` (`antisocialnet/routes/profile_routes.py`).
    *   Profile picture uploads are handled, resized (thumbnailed), and stored.
    *   Users can set their profile to public or private (`is_profile_public`).

## 4. Content Management

### 4.1. Posts

*   **Model:** `Post` (`antisocialnet/models.py`): Stores content (Markdown), author (`user_id`), timestamps, publication status (`is_published`, `published_at`), categories, and tags.
*   **Forms:** `PostForm` (`antisocialnet/forms.py`) for creating and editing posts.
*   **Routes:**
    *   Located in `antisocialnet/routes/post_routes.py`.
    *   `/create`: Allows logged-in users to create new posts. Posts are published immediately.
    *   `/posts/<post_id>`: Displays a single post.
    *   `/posts/<post_id>/edit`: Allows the author or an admin to edit a post.
    *   `/posts/<post_id>/delete`: Allows the author or an admin to delete a post.
*   **Features:**
    *   Markdown support for post content (rendered to HTML using `markdown_to_html_and_sanitize_util`).
    *   Posts can be categorized and tagged (`Category`, `Tag` models).
    *   Mentions within posts trigger notifications.

### 4.2. Comments

*   **Model:** `Comment` (`antisocialnet/models.py`): Stores comment text, author (`user_id`), associated post (`post_id`), parent comment for replies (`parent_id`), and timestamps.
*   **Forms:** `CommentForm` (`antisocialnet/forms.py`) for adding comments.
*   **Routes:**
    *   Comment submission is handled within the `/posts/<post_id>` route.
    *   `/comment/<comment_id>/delete`: Allows comment author, post author, or admin to delete comments.
    *   `/comment/<comment_id>/flag`: Allows users to flag comments for review.
*   **Features:**
    *   Comments can be replies to other comments (threaded).
    *   Mentions within comments trigger notifications.
    *   Comments can be flagged (`CommentFlag` model). Admins can review and resolve flags.

### 4.3. Photos (User Gallery)

*   **Model:** `UserPhoto` (`antisocialnet/models.py`): Stores user ID, image filename (path relative to static uploads), caption, and upload timestamp.
*   **Forms:**
    *   `GalleryPhotoUploadForm` (`antisocialnet/forms.py`) for uploading photos.
    *   `PhotoCommentForm` (`antisocialnet/forms.py`) for commenting on photos.
*   **Routes:**
    *   Located in `antisocialnet/routes/profile_routes.py` (for uploads) and `antisocialnet/routes/photo_routes.py` (for viewing and API).
    *   `/profile/gallery/upload` (POST): Allows users to upload photos to their gallery.
    *   `/profile/gallery/delete/<photo_id>` (POST): Allows users to delete their photos.
    *   `/profile/<user_id>/gallery`: Displays a user's photo gallery.
    *   `/photo/view/<photo_id>`: Displays a single photo detail page (HTML).
    *   `/photo/api/photos/<photo_id>/comments` (GET, POST): API for fetching and posting comments on photos (JSON).
*   **Features:**
    *   Photos are stored in user-specific subdirectories within the gallery upload folder.
    *   Users can add captions to photos.
    *   Photos can be commented on (`PhotoComment` model).
    *   Photos can be liked.

## 5. Social Features

### 5.1. Following

*   **Model:** `FollowerLink` (`antisocialnet/models.py`) association table between users (follower and followed).
*   **Routes:**
    *   Located in `antisocialnet/routes/profile_routes.py`.
    *   `/profile/follow/<user_id>` (POST): Allows the current user to follow another user.
    *   `/profile/unfollow/<user_id>` (POST): Allows the current user to unfollow another user.
    *   `/profile/<user_id>/followers`: Lists users who follow the specified user.
    *   `/profile/<user_id>/following`: Lists users whom the specified user follows.
*   **Logic:**
    *   Managed by `User.follow()`, `User.unfollow()`, and `User.is_following()` methods.
    *   Following a user creates a `Notification` for the followed user and an `Activity` entry.

### 5.2. Likes

*   **Model:** `Like` (`antisocialnet/models.py`): Polymorphic table storing `user_id`, `target_type` (e.g., 'post', 'comment', 'photo'), and `target_id`.
*   **Forms:** `LikeForm`, `UnlikeForm` (`antisocialnet/forms.py`) for CSRF protection.
*   **Routes:**
    *   Located in `antisocialnet/routes/like_routes.py`.
    *   `/like/<target_type>/<target_id>` (POST): Allows users to like an item.
    *   `/unlike/<target_type>/<target_id>` (POST): Allows users to unlike an item.
*   **Logic:**
    *   Managed by `User.like_item()`, `User.unlike_item()`, and `User.has_liked_item()` methods.
    *   Liking an item creates a `Notification` for the item's author and an `Activity` entry.
    *   Posts, Comments, and UserPhotos have a `like_count` property.

### 5.3. Notifications

*   **Model:** `Notification` (`antisocialnet/models.py`): Stores recipient (`user_id`), actor (`actor_id`), type of notification, polymorphic target (`target_type`, `target_id`), read status, and timestamp.
*   **Routes:**
    *   Located in `antisocialnet/routes/notification_routes.py`.
    *   `/notifications/`: Displays a list of notifications for the current user.
*   **Features:**
    *   Notifications are generated for:
        *   New followers.
        *   Likes on posts, comments, photos.
        *   New comments on user's posts/photos.
        *   Mentions in posts, comments, photo comments.
    *   Notifications are marked as read when viewed on the notifications page.
    *   An unread notification count is displayed in the site header.

### 5.4. Mentions

*   **Logic:**
    *   Handled by `extract_mentions()` utility (`antisocialnet/utils.py`) which parses `@fullname` from text.
    *   When content (posts, comments, photo captions/comments) is created or edited, mentions are processed.
    *   If a valid user is mentioned, a `Notification` of type `mention_in_post`, `mention_in_comment`, or `mention_in_photo_comment` is created for the mentioned user.
    *   Mentions are linkified in displayed content using the `linkify_mentions` template filter.

### 5.5. Activity Feed

*   **Model:** `Activity` (`antisocialnet/models.py`): Records significant user actions (e.g., created post, started following, liked item, commented). Stores `user_id` (actor), `type`, `timestamp`, and polymorphic target (`target_type`, `target_id`).
*   **Routes:**
    *   `/feed` (`antisocialnet/routes/general_routes.py`): Displays a feed. Currently shows all public posts. Intended to evolve into a more personalized activity feed.
    *   `/api/v1/feed` (`antisocialnet/routes/api_routes.py`): API endpoint to retrieve a paginated, combined feed of posts and photos.

## 6. Administration

*   **Decorator:** `@admin_required` (`antisocialnet/routes/admin_routes.py`) protects admin routes.
*   **Routes:**
    *   Located in `antisocialnet/routes/admin_routes.py`, prefixed with `/admin`.
    *   `/admin/flags`: Displays comments flagged by users. Admins can resolve flags or delete the offending comment.
    *   `/admin/site-settings`: Allows admins to configure site-wide settings (title, posts per page, registration allowance) via `SiteSettingsForm`. Settings stored in `SiteSetting` model.
    *   `/admin/pending_users`: Lists users awaiting approval. Admins can approve or reject (delete) pending user registrations.
    *   `/admin/users/<user_id>/approve` (POST): Approves and activates a user.
    *   `/admin/users/<user_id>/reject` (POST): Deletes a pending user registration.
*   **User Model:** `User.is_admin` boolean field.

## 7. API Design

*   **Blueprint:** `api_bp` (`antisocialnet/routes/api_routes.py`), prefixed with `/api/v1`.
*   **Authentication:** Primarily session-based (`@login_required`).
*   **Endpoints:**
    *   `/api/v1/settings/theme` (POST): Saves user's theme preference (light/dark/system).
        *   Request: JSON `{"theme": "theme_name"}`
        *   Response: JSON `{"status": "success/error", "message": "..."}`
    *   `/api/v1/settings/accent_color` (POST): Saves user's accent color preference.
        *   Request: JSON `{"accent_color": "color_name"}`
        *   Response: JSON `{"status": "success/error", "message": "..."}`
    *   `/api/v1/feed` (GET): Retrieves a paginated feed of posts and photos.
        *   Query Params: `page`, `per_page`.
        *   Response: JSON object with `items` array and `pagination` details (see `api_routes.py` docstring for structure).
    *   `/api/v1/photos/<photo_id>/comments` (GET): Retrieves comments for a specific photo.
        *   Response: JSON array of comment objects.
    *   `/api/v1/photos/<photo_id>/comments` (POST): Adds a new comment to a photo.
        *   Request: JSON `{"text": "comment_content"}`
        *   Response: JSON of the newly created comment object or error details.
*   **Serialization:** Helper functions (`serialize_actor`, `serialize_post_item`, `serialize_photo_item`) are used to format data for API responses.

## 8. Project Structure

### 8.1. Backend (Flask Application - `antisocialnet/`)

*   **`__init__.py`**: Application factory (`create_app`), initializes Flask extensions (SQLAlchemy, LoginManager, CSRFProtect, Mail), registers blueprints, defines template filters and context processors.
*   **`config.py`**: Configuration classes for different environments (Development, Production, Testing). Loads settings from environment variables and `config.yaml`.
*   **`models.py`**: Defines SQLAlchemy database models (User, Post, Comment, Category, Tag, Like, Notification, Activity, SiteSetting, UserPhoto, PhotoComment, FollowerLink, CommentFlag).
*   **`forms.py`**: Defines WTForms classes for data input and validation.
*   **`routes/`**: Contains Blueprints for different application modules:
    *   `general_routes.py`: Core pages (index, dashboard, settings, search, about, contact, feed), theme/accent API.
    *   `auth_routes.py`: User authentication (register, login, logout, password management).
    *   `post_routes.py`: Post and comment management (create, view, edit, delete, categories, tags, flagging).
    *   `profile_routes.py`: User profiles, photo gallery, follow/unfollow.
    *   `admin_routes.py`: Administrative functions.
    *   `api_routes.py`: RESTful API endpoints.
    *   `like_routes.py`: Like/unlike functionality.
    *   `notification_routes.py`: Viewing notifications.
    *   `photo_routes.py`: Photo viewing and commenting API.
*   **`static/`**: Static files (CSS, JS, images, user uploads).
    *   `static/uploads/profile_pics/`: Stores user profile pictures.
    *   `static/uploads/gallery_photos/`: Stores user gallery photos.
    *   `static/adwaita-web/`: Contains built assets from the Adwaita-Web library (CSS, JS, fonts, icons).
*   **`templates/`**: Jinja2 HTML templates.
    *   `base.html`: Base template with common layout and navigation.
    *   Individual templates for specific pages and components.
    *   `_macros.html`: Reusable Jinja2 macros.
*   **`utils.py`**: Utility functions (slug generation, Markdown rendering, file uploads, mention extraction, form error flashing).
*   **`email_utils.py`**: Utilities for sending emails (e.g., password reset).
*   **`setup_db.py`**: Script for initial database schema creation and admin user setup.
*   **`requirements.txt`**: Python dependencies.
*   **`config.yaml` / `config.yaml.example`**: Main application configuration file.

### 8.2. Frontend Styling (Adwaita-Web - `adwaita-web/`)

*   **`scss/`**: Source SCSS files for the Adwaita-Web component library and application-specific styles (`_antisocialnet-specific.scss`).
*   **`js/`**: Source JavaScript files for Adwaita-Web components and application layout helpers.
*   **`style.css` (generated)**: Compiled CSS output from SCSS files.
*   **`build-adwaita-web.sh`**: Script to compile SCSS and copy necessary assets from `adwaita-web/` to `antisocialnet/static/adwaita-web/`.

## 9. Database Schema

*   **User**: User accounts, profiles, roles.
    *   Relations: Posts, Comments, Likes, Notifications (recipient, actor), Activity (actor), UserPhotos, FollowerLinks (follower, followed), CommentFlags (flagger, resolver).
*   **Post**: Blog-style posts.
    *   Relations: User (author), Categories (many-to-many), Tags (many-to-many), Comments, Likes.
*   **Category**: Categories for posts.
    *   Relations: Posts (many-to-many).
*   **Tag**: Tags for posts.
    *   Relations: Posts (many-to-many).
*   **Comment**: Comments on posts.
    *   Relations: User (author), Post, Comment (parent for replies), Likes, CommentFlags.
*   **UserPhoto**: User-uploaded gallery photos.
    *   Relations: User (owner), PhotoComments, Likes.
*   **PhotoComment**: Comments on gallery photos.
    *   Relations: User (author), UserPhoto.
*   **Like**: Polymorphic likes for posts, comments, photos.
    *   Relations: User (liker).
*   **Notification**: User notifications for various events.
    *   Relations: User (recipient), User (actor), Polymorphic target (Post, Comment, UserPhoto, User).
*   **Activity**: Log of user activities.
    *   Relations: User (actor), Polymorphic target (Post, Comment, UserPhoto, User).
*   **FollowerLink**: Association table for user following relationships.
    *   Relations: User (follower), User (followed).
*   **CommentFlag**: Flags raised by users for comments.
    *   Relations: Comment, User (flagger), User (resolver).
*   **SiteSetting**: Key-value store for site-wide configuration.

(Primary keys are typically `id`, foreign keys link related tables, timestamps `created_at`, `updated_at` are common).

## 10. Frontend Styling and Components (Adwaita-Web)

*   The application's UI is built using the `adwaita-web` library, which provides web components and SCSS styles mimicking GTK Adwaita.
*   Key components used: Buttons, Entries, Switches, Labels, HeaderBars, ListBoxes, Rows (ActionRow, EntryRow, etc.), Dialogs, Toasts, Avatars.
*   Styling is primarily managed through SCSS variables and compiled CSS.
*   The library supports light/dark themes and customizable accent colors.
*   JavaScript in `adwaita-web/js/` handles component logic and dynamic behaviors (e.g., dialog management, theme switching).
*   Application-specific layout JavaScript (e.g., sidebar, banner handling) is also included.
*   The build process (`build-adwaita-web.sh`) is essential for preparing frontend assets.

## 11. Deployment/Setup Considerations

*   **Dependencies:** Python 3, pip, PostgreSQL, Dart Sass (for frontend asset building).
*   **Configuration:**
    *   Environment variables are used for sensitive data (database credentials, secret key). See `antisocialnet/config.py`.
    *   `config.yaml` provides the main application configuration.
*   **Database Setup:**
    *   `antisocialnet/setup_db.py` script initializes the database schema and can create an initial admin user.
    *   Requires PostgreSQL server to be running and accessible.
*   **Frontend Assets:**
    *   `./build-adwaita-web.sh` must be run to compile SCSS and copy assets to `antisocialnet/static/`.
*   **Running the Application (Development):**
    *   Set `FLASK_APP=antisocialnet` and `FLASK_ENV=development`.
    *   Run `flask run`.
*   **Production:**
    *   Use a production-grade WSGI server (e.g., Gunicorn, uWSGI).
    *   Ensure `FLASK_ENV=production`.
    *   Set a strong `SECRET_KEY`.
    *   Configure logging appropriately.
    *   Serve static files efficiently (e.g., via a web server like Nginx).
*   **Email:**
    *   Flask-Mail is configured for sending emails (e.g., password resets). Requires SMTP server details to be configured (e.g., via environment variables `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`).
