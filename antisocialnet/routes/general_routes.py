from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify, session
from flask_login import current_user, login_required
from flask_wtf.csrf import generate_csrf # Import generate_csrf
from datetime import datetime, timezone
from sqlalchemy import or_ # For search query
from sqlalchemy.orm import selectinload # Added for eager loading

from ..models import Post, User, SiteSetting # User for current_user context if needed, Post for queries, SiteSetting for admin
from ..forms import DeletePostForm, SiteSettingsForm # For dashboard delete buttons, SiteSettingsForm for admin
from .. import db

general_bp = Blueprint('general', __name__) # template_folder defaults to app's

@general_bp.route('/')
def index():
    """
    This catch-all route is designed to serve the main `index.html` file
    for any non-API, non-static file request. This allows the frontend
    JavaScript application to handle routing.
    """
    # Here, you simply render the main entry point of your single-page application.
    # The actual content for paths like /dashboard, /settings, etc., will be
    # fetched via API calls from the JavaScript running in index.html.
    return render_template('index.html')


@general_bp.route('/robots.txt')
def robots_txt():
    return current_app.send_static_file('robots.txt')

@general_bp.route('/favicon.ico')
def favicon():
    return current_app.send_static_file('favicon.ico')

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
