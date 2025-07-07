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

@general_bp.route('/feed') # This is the "Home" page for logged-in users
@login_required
def activity_feed():
    current_app.logger.info(f"Accessing activity feed for user {current_user.username}.")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)

    feed_items = []
    try:
        followed_user_ids = [user.id for user in current_user.followed]
        user_ids_for_feed = followed_user_ids + [current_user.id]

        current_app.logger.debug(f"Fetching feed items for user IDs: {user_ids_for_feed}")

        # Fetch posts
        posts_query = Post.query.filter(
            Post.user_id.in_(user_ids_for_feed),
            Post.is_published == True
        ).order_by(db.func.coalesce(Post.published_at, Post.created_at).desc())

        # Fetch photos (UserPhoto model from ..models)
        from ..models import UserPhoto # Ensure UserPhoto is imported
        photos_query = UserPhoto.query.filter(
            UserPhoto.user_id.in_(user_ids_for_feed)
            # Assuming UserPhotos are always "public" if the user is followed or it's self.
            # Add privacy checks if UserPhoto has its own or inherits from profile.
        ).order_by(UserPhoto.uploaded_at.desc())

        # Combine and sort
        # This is a simplified combination. For robust pagination and large datasets,
        # this approach (fetch all, then sort/paginate in Python) can be inefficient.
        # A more complex SQL query (UNION ALL) or a different feed generation strategy
        # might be needed for scale.

        raw_posts = posts_query.all()
        raw_photos = photos_query.all()

        for post in raw_posts:
            feed_items.append({
                'type': 'post',
                'timestamp': post.published_at or post.created_at,
                'author': post.author, # Direct User object
                'data': post, # The Post object itself
                'id': f'post-{post.id}' # Unique ID for template key
            })

        for photo in raw_photos:
            feed_items.append({
                'type': 'photo',
                'timestamp': photo.uploaded_at,
                'author': photo.user, # Direct User object (backref from UserPhoto.user_id)
                'data': photo, # The UserPhoto object itself
                'id': f'photo-{photo.id}' # Unique ID for template key
            })

        # Sort all feed items by timestamp, newest first
        feed_items.sort(key=lambda x: x['timestamp'], reverse=True)

        # Manual pagination
        total_items = len(feed_items)
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        paginated_feed_items = feed_items[start_index:end_index]

        # Create a simple pagination object for the template
        from flask_sqlalchemy.pagination import Pagination # For object structure
        # This is a mock pagination object, not a real SQLAlchemy one for this combined list.
        # For a real solution, a custom pagination class or helper would be better.
        class ManualPagination:
            def __init__(self, page, per_page, total_items, items):
                self.page = page
                self.per_page = per_page
                self.total = total_items
                self.items = items

            @property
            def pages(self):
                return (self.total + self.per_page - 1) // self.per_page if self.total > 0 else 0

            @property
            def has_prev(self):
                return self.page > 1

            @property
            def has_next(self):
                return self.page < self.pages

            @property
            def prev_num(self):
                return self.page - 1 if self.has_prev else None

            @property
            def next_num(self):
                return self.page + 1 if self.has_next else None

            def iter_pages(self, left_edge=2, right_edge=2, left_current=2, right_current=5):
                # Simplified iter_pages for manual pagination
                if self.pages <= (left_edge + left_current + right_edge + right_current + 1):
                    return range(1, self.pages + 1)
                pages_iter = []
                # Left Capped pages
                for i in range(1, left_edge + 1):
                    pages_iter.append(i)
                pages_iter.append(None) # Ellipsis
                # Middle pages
                for i in range(self.page - left_current, self.page + right_current +1):
                    if i > left_edge and i < self.pages - right_edge + 1 :
                        pages_iter.append(i)
                # Right Capped pages
                if self.pages - right_edge > self.page + right_current : # check if ellipsis needed
                    pages_iter.append(None)
                for i in range(self.pages - right_edge + 1, self.pages + 1):
                    if i not in pages_iter: # Avoid duplicates if ranges overlap
                         pages_iter.append(i)
                # Remove duplicate Nones if they occur consecutively
                final_pages_iter = []
                for i, val in enumerate(pages_iter):
                    if val is None and (i == 0 or pages_iter[i-1] is None):
                        continue
                    final_pages_iter.append(val)
                return final_pages_iter


        pagination_obj = ManualPagination(page, per_page, total_items, paginated_feed_items)

        current_app.logger.debug(f"Processed {len(paginated_feed_items)} items for feed page {page}. Total combined: {total_items}")

    except Exception as e:
        current_app.logger.error(f"Error fetching or processing feed for user {current_user.username}: {e}", exc_info=True)
        flash("Error loading the feed. Please try again later.", "danger")
        paginated_feed_items = []
        pagination_obj = ManualPagination(page, per_page, 0, [])


    return render_template('feed.html', feed_items=paginated_feed_items, pagination=pagination_obj)


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
