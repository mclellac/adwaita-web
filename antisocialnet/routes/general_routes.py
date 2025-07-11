from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify, session
from flask_login import current_user, login_required
from flask_wtf.csrf import generate_csrf # Import generate_csrf
from datetime import datetime, timezone
from sqlalchemy import or_ # For search query

from ..models import Post, User, SiteSetting # User for current_user context if needed, Post for queries, SiteSetting for admin
from ..forms import DeletePostForm, SiteSettingsForm # For dashboard delete buttons, SiteSettingsForm for admin
from .. import db

general_bp = Blueprint('general', __name__) # template_folder defaults to app's

@general_bp.route('/')
def index():
    current_app.logger.info(f"Accessing index page / {request.path}")
    if current_user.is_authenticated:
        current_app.logger.info(f"User {current_user.username} is authenticated, redirecting to activity feed.")
        return redirect(url_for('general.activity_feed'))

    # For anonymous users, show the public posts page
    current_app.logger.info(f"Anonymous user accessing index page, showing public posts.")
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

    return render_template('index.html', posts=posts, pagination=pagination, current_user=current_user)

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
    site_settings_form = None
    if current_user.is_admin:
        # Instantiate the form. Population for GET will happen here.
        # The form submission will still go to admin.site_settings endpoint.
        site_settings_form = SiteSettingsForm()
        # Populate for GET request. If it's a POST request that failed validation on admin.site_settings
        # and redirected here, the form object might already have data.
        # However, admin.site_settings redirects to itself on successful POST or renders its own template on GET/failed POST.
        # So, this route will always be a GET for the site_settings_form part.
        site_settings_form.site_title.data = SiteSetting.get('site_title', current_app.config.get('SITE_TITLE', 'Adwaita Social Demo'))
        site_settings_form.posts_per_page.data = str(SiteSetting.get('posts_per_page', current_app.config.get('POSTS_PER_PAGE', 10)))
        site_settings_form.allow_registrations.data = SiteSetting.get('allow_registrations', False)
        current_app.logger.debug(f"Admin user {current_user.username} viewing settings, site_settings_form populated for display.")

    return render_template('settings.html', site_settings_form=site_settings_form)

@general_bp.route('/search')
def search_results():
    current_app.logger.debug(f"Accessing search page, Method: {request.method}")
    query_param = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int) # Common page number for both result types for simplicity
    posts_per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    users_per_page = current_app.config.get('USERS_PER_PAGE', 10) # Can be different
    current_app.logger.info(f"Unified search performed with query: '{query_param}', page: {page}.")

    posts_results, posts_pagination = [], None
    users_results, users_pagination = [], None

    if query_param:
        search_term = f"%{query_param}%"
        try:
            # Post search
            posts_query = Post.query.filter(
                Post.is_published==True,
                Post.content.ilike(search_term)
            ).order_by(Post.published_at.desc(), Post.created_at.desc())
            posts_pagination = posts_query.paginate(page=page, per_page=posts_per_page, error_out=False)
            posts_results = posts_pagination.items
            current_app.logger.debug(f"Search for '{query_param}' found {len(posts_results)} posts on page {page}. Total: {posts_pagination.total}")

            # User search (excluding current user if logged in)
            user_query_base = User.query.filter(
                or_(
                    User.username.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )
            if current_user.is_authenticated:
                user_query_base = user_query_base.filter(User.id != current_user.id)

            user_query = user_query_base.order_by(User.username.asc())
            users_pagination = user_query.paginate(page=page, per_page=users_per_page, error_out=False)
            users_results = users_pagination.items
            current_app.logger.debug(f"Search for '{query_param}' found {len(users_results)} users on page {page}. Total: {users_pagination.total}")

        except Exception as e:
            current_app.logger.error(f"Error during unified search for query '{query_param}': {e}", exc_info=True)
            flash("Error performing search. Please try again.", "danger")
    else:
        current_app.logger.debug("Search query was empty.")

    return render_template('search_results.html',
                           query=query_param,
                           posts=posts_results,
                           posts_pagination=posts_pagination,
                           users=users_results,
                           users_pagination=users_pagination)

@general_bp.route('/about')
def about_page():
    current_app.logger.debug("Displaying About page.")
    return render_template('about.html')

@general_bp.route('/contact')
def contact_page():
    current_app.logger.debug("Displaying Contact page.")
    return render_template('contact.html')

@general_bp.route('/robots.txt')
def robots_txt():
    return current_app.send_static_file('robots.txt')

@general_bp.route('/favicon.ico')
def favicon():
    return current_app.send_static_file('favicon.ico')

@general_bp.route('/feed') # This is the "Home" page for logged-in users
@login_required
def activity_feed(): # Rename to home_feed or similar if preferred, but endpoint name stays for now
    current_app.logger.info(f"Accessing main feed (posts) for user {current_user.username}.")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10) # Use POSTS_PER_PAGE

    posts_list, pagination = [], None

    # For the main feed, show posts from users the current user is following, plus their own posts.
    # Alternatively, show all public posts if that's the desired global feed behavior.
    # For now, let's implement a feed of all public posts, similar to the anonymous index.
    # A more advanced feed would involve `followed_users_posts`.

    try:
        # Fetch all published posts, newest first.
        posts_query = Post.query.filter(Post.is_published == True)\
                                .order_by(Post.published_at.desc(), Post.created_at.desc())

        pagination = posts_query.paginate(page=page, per_page=per_page, error_out=False)
        posts_list = pagination.items
        current_app.logger.debug(f"Found {len(posts_list)} posts for main feed page {page}. Total: {pagination.total}")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for main feed for user {current_user.username}: {e}", exc_info=True)
        flash("Error loading the feed. Please try again later.", "danger")
        # posts_list and pagination will remain empty or None

    # The template 'feed.html' will need to be adjusted to render posts instead of activities.
    # Or, we can point to 'index.html' if it's suitable for rendering a list of posts with pagination.
    # Let's assume 'feed.html' will be adapted.
    # csrf_token() is globally available in templates if CSRFProtect is setup, no need to pass it explicitly as a string.
    return render_template('feed.html', posts=posts_list, pagination=pagination, current_user=current_user)


# The '/users/find' route is now removed as search is unified.

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
