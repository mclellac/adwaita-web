import logging
import os
import urllib.parse
from datetime import datetime, timezone
from flask import Flask, render_template, request, session, url_for, current_app, redirect, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_wtf import CSRFProtect
from markupsafe import Markup

from flask_mail import Mail

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()
mail = Mail()

from . import models

def create_app(config_name=None, yaml_config_override=None):
    app = Flask(__name__, instance_relative_config=True)

    from .config import config_by_name, DevelopmentConfig, ProductionConfig, Config
    if config_name:
        app_config = config_by_name.get(config_name, DevelopmentConfig)
    else:
        flask_env = os.getenv('FLASK_ENV', 'development')
        app_config = config_by_name.get(flask_env, DevelopmentConfig)

    app.config.from_object(app_config)

    if yaml_config_override and isinstance(yaml_config_override, dict):
        for key, value in yaml_config_override.items():
            app.config[key.upper()] = value

    if not app.debug and not app.testing: # pragma: no cover
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)
    app.logger.setLevel(logging.INFO if not app.debug else logging.DEBUG)
    app.logger.info(f"Starting Adwaita Web Demo with config: {type(app_config).__name__}")

    default_secret_key_value = 'a_default_very_secret_key_for_development_only_CHANGE_ME'
    if isinstance(app_config, ProductionConfig):
        env_secret_key = os.environ.get('FLASK_SECRET_KEY')
        if env_secret_key:
            app.config['SECRET_KEY'] = env_secret_key
        else:
            app.config['SECRET_KEY'] = default_secret_key_value

    if isinstance(app_config, ProductionConfig) and \
       app.config.get('SECRET_KEY') == default_secret_key_value:
        app.logger.critical(
            "CRITICAL SECURITY WARNING: Running in PRODUCTION mode with the DEFAULT INSECURE SECRET_KEY. "
            "This is highly insecure. Set the FLASK_SECRET_KEY environment variable to a strong, unique random value."
        )

    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError: # pragma: no cover
        app.logger.error(f"Could not create instance path: {app.instance_path}")
        pass

    app.logger.info(f"Database URI configured to: {Config.get_log_db_uri()}")

    profile_upload_path_relative = app.config.get('UPLOAD_FOLDER', 'uploads/profile_pics')
    profile_upload_path_abs = os.path.join(app.static_folder, profile_upload_path_relative)
    try:
        os.makedirs(profile_upload_path_abs, exist_ok=True)
        app.logger.info(f"Profile upload directory ensured at: {profile_upload_path_abs}")
    except OSError as e: # pragma: no cover
        app.logger.error(f"Could not create profile upload directory {profile_upload_path_abs}: {e}")

    gallery_upload_path_relative = app.config.get('GALLERY_UPLOAD_FOLDER', 'uploads/gallery_photos')
    gallery_upload_path_abs = os.path.join(app.static_folder, gallery_upload_path_relative)
    try:
        os.makedirs(gallery_upload_path_abs, exist_ok=True)
        app.logger.info(f"Gallery upload directory ensured at: {gallery_upload_path_abs}")
    except OSError as e: # pragma: no cover
        app.logger.error(f"Could not create gallery upload directory {gallery_upload_path_abs}: {e}")

    app.logger.info(f"Profile upload path (relative to static): {profile_upload_path_relative}")
    app.logger.info(f"Gallery upload path (relative to static): {gallery_upload_path_relative}")

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'
    csrf.init_app(app)
    mail.init_app(app)

    from . import utils as app_utils
    app_utils.init_app(app)
    from .utils import markdown_to_html_and_sanitize_util, linkify_mentions as linkify_mentions_util

    @login_manager.user_loader
    def load_user(user_id_str):
        if user_id_str is None: return None
        try:
            user_id_int = int(user_id_str)
            return db.session.get(models.User, user_id_int)
        except ValueError: return None
        except Exception: return None # pragma: no cover

    @app.template_filter('urlencode')
    def urlencode_filter(s):
        if hasattr(s, 'unescape'): s = s.unescape()
        return urllib.parse.quote_plus(str(s))

    @app.template_filter('escapejs')
    def escapejs_filter(value):
        if value is None: return ''
        return Markup(str(value).replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('/', '\\/'))

    @app.template_filter('linkify_mentions')
    def actual_linkify_mentions_filter(text):
        return linkify_mentions_util(text)

    @app.template_filter('markdown')
    def actual_markdown_filter(text):
        text_with_mention_links = linkify_mentions_util(text)
        return markdown_to_html_and_sanitize_util(text_with_mention_links)

    @app.context_processor
    def inject_global_template_variables():
        unread_notifications_count = 0
        if current_user.is_authenticated:
            unread_notifications_count = models.Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
        return {
            'current_user': current_user,
            'default_avatar_url': url_for('static', filename='img/default_avatar.png'),
            'site_settings': models.SiteSetting,
            'UserPhoto': models.UserPhoto,
            'unread_notifications_count': unread_notifications_count
        }

    @app.context_processor
    def inject_current_year():
        return {'current_year': datetime.now(timezone.utc).year}

    from .routes.general_routes import general_bp
    app.register_blueprint(general_bp)
    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    from .routes.profile_routes import profile_bp
    app.register_blueprint(profile_bp)
    from .routes.post_routes import post_bp
    app.register_blueprint(post_bp)
    from .routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp)
    from .routes.notification_routes import notification_bp
    app.register_blueprint(notification_bp)
    from .routes.photo_routes import photo_bp
    app.register_blueprint(photo_bp)
    from .routes.api_routes import api_bp
    app.register_blueprint(api_bp)
    from .routes.like_routes import like_bp
    app.register_blueprint(like_bp)
    from .routes.repost_routes import repost_bp
    app.register_blueprint(repost_bp)

    from sqlalchemy.exc import SQLAlchemyError

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error): # pragma: no cover
        current_app.logger.error(f"Unhandled SQLAlchemyError caught by global handler: {error}", exc_info=True)
        try:
            if db.session.is_active:
                db.session.rollback()
                current_app.logger.info("Database session rolled back due to SQLAlchemyError.")
        except Exception as e_rollback: # pragma: no cover
            current_app.logger.error(f"Error during session rollback in SQLAlchemyError handler: {e_rollback}", exc_info=True)

        if request.blueprint == 'api' or \
           (hasattr(request, 'accept_mimetypes') and 'application/json' in request.accept_mimetypes):
            return jsonify({"status": "error", "message": "A database error occurred. Please try again later."}), 500
        else:
            flash("A critical database error occurred. Please try again later. If the problem persists, contact support.", "danger")
            return render_template("500.html", error=error), 500

    @app.errorhandler(403)
    def forbidden_page(error):
        user_info = f"User: {current_user.username}" if current_user.is_authenticated else "User: Anonymous"
        app.logger.warning(f"[ERROR_HANDLER] 403 Forbidden - Path: {request.path}, IP: {request.remote_addr}, {user_info}, Error: {error}")
        return render_template('403.html'), 403

    @app.errorhandler(404)
    def page_not_found(error):
        user_info = f"User: {current_user.username}" if current_user.is_authenticated else "User: Anonymous"
        app.logger.warning(f"[ERROR_HANDLER] 404 Not Found - Path: {request.path}, IP: {request.remote_addr}, {user_info}, Error: {error}")
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def server_error_page(error): # pragma: no cover
        user_info = f"User: {current_user.username}" if current_user.is_authenticated else "User: Anonymous"
        app.logger.error(f"[ERROR_HANDLER] 500 Server Error - Path: {request.path}, IP: {request.remote_addr}, {user_info}, Error: {error}", exc_info=True)
        return render_template('500.html'), 500

    @app.after_request
    def add_security_headers(response):
        if not current_app.testing:
             response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        return response

    app.logger.info("Flask application instance created and configured.")
    return app
