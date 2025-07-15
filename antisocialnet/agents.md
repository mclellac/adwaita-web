This project is a Flask-based social media platform. The functionality of antisocialnet should all be API driven. Polymorphism of antisocialnet should be implemented for all related systems, such as different types of Posts (comments/posts/docs,etc). Same with the like system (photos, comments, posts, docs).

The frontend is built using the adwaita-web UI widgets. Do not use custom CSS for antisocialnet. Strictly use the adwaita-web UI widgets. Any custom CSS code for an adwaita-widget should be moved into the widgets scss file itself. The widgets need to work the same across all applications.

The database models are defined in `antisocialnet/models.py` and the API routes are in `antisocialnet/routes/api_routes.py`. The frontend templates are in `antisocialnet/templates`.

When making changes, please ensure that the documentation and readme are kept current.

## Notifications

The following notification types should be used:

*   `new_post_by_followed_user`: When a user you follow creates a new post.
*   `new_comment_by_followed_user`: When a user you follow posts a new comment.
*   `new_photo_by_followed_user`: When a user you follow uploads a new photo.
*   `pending_user_approval`: When a new user is awaiting approval (for admins).
*   `user_approved`: When an admin approves a new user (for all users).
*   `site_setting_changed`: When an admin changes a site setting (for all users).
