from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify, session
from flask_login import current_user, login_required
from flask_wtf.csrf import generate_csrf # Import generate_csrf
from datetime import datetime, timezone
from sqlalchemy import or_ # For search query
from sqlalchemy.orm import selectinload # Added for eager loading

from ..models import Post, User, SiteSetting, Repost
from ..forms import DeletePostForm, SiteSettingsForm
from .. import db

general_bp = Blueprint('general', __name__) # template_folder defaults to app's

@general_bp.route('/')
def index():
    current_app.logger.info(f"Accessing index page / {request.path}")
    if current_user.is_authenticated:
        current_app.logger.info(f"User {current_user.username} is authenticated, redirecting to activity feed.")
        return redirect(url_for('general.activity_feed'))

    current_app.logger.info(f"Anonymous user accessing index page, showing public posts.")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    current_app.logger.debug(f"Fetching published posts for index page {page}, {per_page} posts per page.")

    try:
        query = Post.query.filter_by(is_published=True)\
            .options(selectinload(Post.categories), selectinload(Post.tags), selectinload(Post.author))\
            .order_by(Post.published_at.desc(), Post.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        current_app.logger.debug(f"Found {len(posts)} published posts for index page {page}. Total: {pagination.total}")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for index page: {e}", exc_info=True)
        flash("Error loading posts. Please try again later.", "danger")
        posts, pagination = [], None

    return render_template('index.html', posts=posts, pagination=pagination, current_user=current_user)

@general_bp.route('/dashboard')
@login_required
def dashboard():
    current_app.logger.debug(f"Accessing dashboard, User: {current_user.username}")
    user_posts_query = Post.query.filter_by(user_id=current_user.id)\
                                 .options(selectinload(Post.categories), selectinload(Post.tags))\
                                 .order_by(Post.updated_at.desc())
    user_posts = user_posts_query.all()

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
        site_settings_form = SiteSettingsForm()
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
            posts_query = Post.query.filter(
                Post.is_published==True,
                Post.content.ilike(search_term)
            ).options(selectinload(Post.categories), selectinload(Post.tags), selectinload(Post.author))\
             .order_by(Post.published_at.desc(), Post.created_at.desc())
            posts_pagination = posts_query.paginate(page=page, per_page=posts_per_page, error_out=False)
            posts_results = posts_pagination.items
            current_app.logger.debug(f"Search for '{query_param}' found {len(posts_results)} posts on page {page}. Total: {posts_pagination.total}")

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

@general_bp.route('/feed')
@login_required
def activity_feed():
    current_app.logger.info(f"Accessing main feed (posts and reposts) for user {current_user.username}.")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)

    try:
        # Get IDs of users the current user is following
        followed_user_ids = [user.id for user in current_user.followed]

        # Include current user's own ID for their posts and reposts
        relevant_user_ids = followed_user_ids + [current_user.id]

        # Union of posts and reposts
        posts_query = db.session.query(
            Post.id.label('id'),
            Post.user_id.label('user_id'),
            Post.published_at.label('timestamp'),
            db.literal('post').label('type')
        ).filter(
            Post.user_id.in_(relevant_user_ids),
            Post.is_published == True
        )

        reposts_query = db.session.query(
            Repost.id.label('id'),
            Repost.user_id.label('user_id'),
            Repost.timestamp.label('timestamp'),
            db.literal('repost').label('type')
        ).filter(
            Repost.user_id.in_(relevant_user_ids)
        )

        feed_query = posts_query.union_all(reposts_query).order_by(db.desc('timestamp'))

        pagination = feed_query.paginate(page=page, per_page=per_page, error_out=False)

        feed_items_paginated = pagination.items

        # Now fetch the full objects
        post_ids = [item.id for item in feed_items_paginated if item.type == 'post']
        repost_ids = [item.id for item in feed_items_paginated if item.type == 'repost']

        posts = Post.query.filter(Post.id.in_(post_ids)).all() if post_ids else []
        reposts = Repost.query.filter(Repost.id.in_(repost_ids)).all() if repost_ids else []

        # Combine and sort again to maintain order
        feed_items = sorted(
            posts + reposts,
            key=lambda x: x.published_at if isinstance(x, Post) else x.timestamp,
            reverse=True
        )

    except Exception as e:
        current_app.logger.error(f"Error fetching feed for user {current_user.username}: {e}", exc_info=True)
        flash("Error loading the feed. Please try again later.", "danger")
        feed_items = []
        pagination = None

    return render_template('feed.html', feed_items=feed_items, pagination=pagination, current_user=current_user)


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
