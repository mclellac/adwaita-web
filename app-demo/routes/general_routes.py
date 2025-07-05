from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify, session
from flask_login import current_user, login_required
from datetime import datetime, timezone
from sqlalchemy import or_ # For search query

from ..models import Post, User # User for current_user context if needed, Post for queries
from ..forms import DeletePostForm # For dashboard delete buttons
from .. import db

general_bp = Blueprint('general', __name__) # template_folder defaults to app's

@general_bp.route('/')
def index():
    current_app.logger.info(f"Accessing index page {request.path}")
    if current_user.is_authenticated:
        current_app.logger.info(f"User {current_user.username}: theme='{current_user.theme}', accent_color='{current_user.accent_color}' before rendering index.")

    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    current_app.logger.debug(f"Fetching published posts for index page {page}, {per_page} posts per page.")

    try:
        query = Post.query.filter_by(is_published=True).order_by(Post.published_at.desc(), Post.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        current_app.logger.debug(f"Found {len(posts)} published posts for page {page}. Total: {pagination.total}")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for index page: {e}", exc_info=True)
        flash("Error loading posts. Please try again later.", "danger")
        posts, pagination = [], None

    return render_template('index.html', posts=posts, pagination=pagination)

@general_bp.route('/dashboard')
@login_required
def dashboard():
    current_app.logger.debug(f"Accessing dashboard, User: {current_user.username}")
    # Fetch all posts by the current user (published and drafts)
    user_posts = Post.query.filter_by(user_id=current_user.id)\
                           .order_by(Post.updated_at.desc()).all()

    # Create delete forms for each post
    delete_forms = {
        post.id: DeletePostForm(prefix=f"del-post-{post.id}-") for post in user_posts
    }
    current_app.logger.debug(f"Fetched {len(user_posts)} posts for user {current_user.username} for dashboard.")
    return render_template('dashboard.html', user_posts=user_posts, delete_forms=delete_forms)

@general_bp.route('/settings')
@login_required
def settings_page():
    current_app.logger.debug(f"Displaying settings page for user {current_user.username}.")
    # The actual change password form is handled by auth_bp.change_password_page
    # This page could link to it or display other user settings.
    return render_template('settings.html')

@general_bp.route('/search')
def search_results():
    current_app.logger.debug(f"Accessing search page, Method: {request.method}")
    query_param = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    current_app.logger.info(f"Search performed with query: '{query_param}', page: {page}.")

    posts, pagination = [], None
    if query_param:
        search_term = f"%{query_param}%"
        try:
            posts_query = Post.query.filter(
                Post.is_published==True, # Ensure only published posts are searchable by public
                Post.content.ilike(search_term) # Search only in content now
            ).order_by(Post.published_at.desc(), Post.created_at.desc())

            pagination = posts_query.paginate(page=page, per_page=per_page, error_out=False)
            posts = pagination.items
            current_app.logger.debug(f"Search for '{query_param}' found {len(posts)} posts on page {page}. Total: {pagination.total}")
        except Exception as e:
            current_app.logger.error(f"Error during search for query '{query_param}': {e}", exc_info=True)
            flash("Error performing search. Please try again.", "danger")
    else:
        current_app.logger.debug("Search query was empty.")
        # flash("Please enter a search term.", "info") # Optional: only show if user tried to submit empty

    return render_template('search_results.html', query=query_param, posts=posts, pagination=pagination)

@general_bp.route('/about')
def about_page():
    current_app.logger.debug("Displaying About page.")
    return render_template('about.html')

@general_bp.route('/contact')
def contact_page():
    current_app.logger.debug("Displaying Contact page.")
    return render_template('contact.html')

@general_bp.route('/feed')
@login_required
def activity_feed():
    current_app.logger.info(f"Accessing activity feed for user {current_user.username}.")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ACTIVITIES_PER_PAGE', 20) # New config for activities per page

    # Get users the current user is following
    followed_users_list = current_user.followed.all() # .all() executes the query

    activities_list, pagination = [], None
    followed_users_count = len(followed_users_list)

    if not followed_users_list:
        current_app.logger.debug(f"User {current_user.username} is not following anyone. Feed will be based on their own activities if desired, or empty.")
        # Optionally, show user's own activities if they follow no one, or just show empty.
        # For now, let's make it empty if not following anyone, for a cleaner "followed feed".
        # To include own activities:
        # activity_query = Activity.query.filter_by(user_id=current_user.id)...
        pass # Will render with empty activities_list
    else:
        followed_user_ids = [user.id for user in followed_users_list]
        current_app.logger.debug(f"User {current_user.username} is following users with IDs: {followed_user_ids}.")

        try:
            from ..models import Activity # Local import
            # Query activities from followed users, ordered by timestamp
            activity_query = Activity.query.filter(
                Activity.user_id.in_(followed_user_ids)
            ).order_by(Activity.timestamp.desc())

            pagination = activity_query.paginate(page=page, per_page=per_page, error_out=False)
            activities_list = pagination.items
            current_app.logger.debug(f"Found {len(activities_list)} activities for feed page {page} for user {current_user.username}. Total: {pagination.total}")
        except Exception as e:
            current_app.logger.error(f"Error fetching activities for feed for user {current_user.username}: {e}", exc_info=True)
            flash("Error loading your activity feed. Please try again later.", "danger")
            # activities_list and pagination will remain empty or None

    return render_template('feed.html', activities_list=activities_list, pagination=pagination, followed_users_count=followed_users_count)


@general_bp.route('/users/find', methods=['GET'])
@login_required # Recommended to require login for user searching
def find_users():
    query_param = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    # Using a different per_page for user lists, e.g., 15 or 20, can be configured
    per_page = current_app.config.get('USERS_PER_PAGE', 15)

    users_list, pagination = [], None

    if query_param:
        search_term = f"%{query_param}%"
        current_app.logger.info(f"User {current_user.username} searching for users with query: '{query_param}', page: {page}.")
        try:
            # Search in username and full_name, case-insensitive
            # Exclude the current user from search results
            user_query = User.query.filter(
                User.id != current_user.id, # Don't show self in results
                or_(
                    User.username.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            ).order_by(User.username.asc())

            pagination = user_query.paginate(page=page, per_page=per_page, error_out=False)
            users_list = pagination.items
            current_app.logger.debug(f"User search for '{query_param}' found {len(users_list)} users on page {page}. Total: {pagination.total}")
        except Exception as e:
            current_app.logger.error(f"Error during user search for query '{query_param}': {e}", exc_info=True)
            flash("Error performing user search. Please try again.", "danger")
    else:
        current_app.logger.debug(f"User search page accessed without a query by {current_user.username}.")
        # Optionally, could display some default list here, or just the search bar.
        # For now, it will just show the search bar and an empty list if no query.

    return render_template('user_search_results.html', query=query_param, users_list=users_list, pagination=pagination)


# API routes for theme/accent settings
@general_bp.route('/api/settings/theme', methods=['POST'])
@login_required
def save_theme_preference():
    current_app.logger.debug(f"API call to /api/settings/theme by {current_user.username}")
    data = request.get_json()
    if not data or 'theme' not in data:
        current_app.logger.warning(f"API /api/settings/theme: Missing theme data. Data: {data}")
        return jsonify({'status': 'error', 'message': 'Missing theme data'}), 400

    new_theme = data['theme']
    current_app.logger.info(f"User {current_user.username} setting theme to: '{new_theme}'.")

    if new_theme not in current_app.config['ALLOWED_THEMES']:
        current_app.logger.warning(f"API /api/settings/theme: Invalid theme '{new_theme}'.")
        return jsonify({'status': 'error', 'message': 'Invalid theme value'}), 400

    current_user.theme = new_theme
    try:
        db.session.add(current_user) # Add to session before commit
        db.session.commit()
        current_app.logger.info(f"Theme '{new_theme}' saved for {current_user.username}.")
        return jsonify({'status': 'success', 'message': 'Theme updated successfully'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"DB Error saving theme for {current_user.username}: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Failed to save theme preference'}), 500

@general_bp.route('/api/settings/accent_color', methods=['POST'])
@login_required
def save_accent_color_preference():
    current_app.logger.debug(f"API call to /api/settings/accent_color by {current_user.username}")
    data = request.get_json()
    if not data or 'accent_color' not in data:
        current_app.logger.warning(f"API /api/settings/accent_color: Missing accent_color data. Data: {data}")
        return jsonify({'status': 'error', 'message': 'Missing accent_color data'}), 400

    new_accent_color = data['accent_color'] # Basic validation could be added here if there's a fixed list
    current_app.logger.info(f"User {current_user.username} setting accent_color to: '{new_accent_color}'.")

    current_user.accent_color = new_accent_color
    try:
        db.session.add(current_user) # Add to session before commit
        db.session.commit()
        current_app.logger.info(f"Accent color '{new_accent_color}' saved for {current_user.username}.")
        return jsonify({'status': 'success', 'message': 'Accent color updated successfully'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"DB Error saving accent_color for {current_user.username}: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Failed to save accent color preference'}), 500
