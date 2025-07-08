import logging
import os
import urllib.parse
from datetime import datetime, timezone
from flask import Flask, render_template, request, session, url_for, current_app, redirect # Added current_app, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_wtf import CSRFProtect
from markupsafe import Markup

from flask_mail import Mail # Import Flask-Mail

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()
mail = Mail() # Initialize Mail instance

# Import models at the module level so they are registered with SQLAlchemy
# and accessible via the package for scripts like setup_db.py
from . import models # This will import app-demo/models.py

def create_app(config_name=None, yaml_config_override=None): # Added yaml_config_override
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    # Default to DevelopmentConfig if FLASK_ENV is not set or recognized
    from .config import config_by_name, DevelopmentConfig, ProductionConfig, Config # Import ProductionConfig
    if config_name:
        app_config = config_by_name.get(config_name, DevelopmentConfig)
    else:
        flask_env = os.getenv('FLASK_ENV', 'development')
        app_config = config_by_name.get(flask_env, DevelopmentConfig)
    app.config.from_object(app_config)

    # Apply overrides from YAML config if provided, before logging or extension init
    if yaml_config_override and isinstance(yaml_config_override, dict):
        for key, value in yaml_config_override.items():
            app.config[key.upper()] = value # Flask config keys are typically uppercase
            # Consider adding a debug log here if needed, but logger might not be set up yet.
            # print(f"DEBUG (pre-log): Overriding from YAML in create_app: {key.upper()} = {value}")

    # Runtime check for insecure SECRET_KEY in production
    if isinstance(app_config, ProductionConfig) and app.config.get('SECRET_KEY') == 'a_default_very_secret_key_for_development_only_CHANGE_ME' \
       and not (yaml_config_override and yaml_config_override.get('SECRET_KEY') != 'a_default_very_secret_key_for_development_only_CHANGE_ME'):
        # Ensure app.logger is available if this check is very early or app_config is basic object
        # However, logger is configured a bit later. This check should be fine here.
        app.logger.critical("SECURITY WARNING: Running in PRODUCTION mode with the DEFAULT INSECURE SECRET_KEY. "
                            "This key MUST be changed via the FLASK_SECRET_KEY environment variable for security.")
        # Depending on policy, you might raise an error here to halt startup:
        # raise RuntimeError("Refusing to start in production with default secret key.")

    # Ensure instance folder exists for future use (e.g. SQLite DB, instance specific configs)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        app.logger.error(f"Could not create instance path: {app.instance_path}")
        pass # Or handle more gracefully

    # Make UPLOAD_FOLDER absolute, relative to app.root_path (app-demo directory)
    # app.root_path is the directory where __init__.py (this file) is.
    if not os.path.isabs(app.config['UPLOAD_FOLDER']):
        app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, app.config['UPLOAD_FOLDER'])

    if 'GALLERY_UPLOAD_FOLDER' in app.config and not os.path.isabs(app.config['GALLERY_UPLOAD_FOLDER']):
        app.config['GALLERY_UPLOAD_FOLDER'] = os.path.join(app.root_path, app.config['GALLERY_UPLOAD_FOLDER'])
        # Ensure the base gallery upload directory exists
        os.makedirs(app.config['GALLERY_UPLOAD_FOLDER'], exist_ok=True)


    # Setup logging
    if not app.debug and not app.testing: # pragma: no cover
        # Could add more sophisticated logging here (file, email, etc.)
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        # formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        # stream_handler.setFormatter(formatter)
        app.logger.addHandler(stream_handler)
    app.logger.setLevel(logging.INFO if not app.debug else logging.DEBUG)

    app.logger.info(f"Starting Adwaita Web Demo with config: {type(app_config).__name__}")
    app.logger.info(f"Database URI configured to: {Config.get_log_db_uri()}") # Use static method from Config

    # Ensure upload directories exist within the static folder.
    # app.config['UPLOAD_FOLDER'] and app.config['GALLERY_UPLOAD_FOLDER'] should hold paths
    # relative to the static directory, e.g., "uploads/profile_pics".

    profile_upload_path_relative = app.config.get('UPLOAD_FOLDER', 'uploads/profile_pics')
    profile_upload_path_abs = os.path.join(app.static_folder, profile_upload_path_relative)
    try:
        os.makedirs(profile_upload_path_abs, exist_ok=True)
        app.logger.info(f"Profile upload directory ensured at: {profile_upload_path_abs}")
    except OSError as e:
        app.logger.error(f"Could not create profile upload directory {profile_upload_path_abs}: {e}")

    gallery_upload_path_relative = app.config.get('GALLERY_UPLOAD_FOLDER', 'uploads/gallery_photos')
    gallery_upload_path_abs = os.path.join(app.static_folder, gallery_upload_path_relative)
    try:
        os.makedirs(gallery_upload_path_abs, exist_ok=True)
        app.logger.info(f"Gallery upload directory ensured at: {gallery_upload_path_abs}")
    except OSError as e:
        app.logger.error(f"Could not create gallery upload directory {gallery_upload_path_abs}: {e}")

    app.logger.info(f"Profile upload path (relative to static): {profile_upload_path_relative}")
    app.logger.info(f"Gallery upload path (relative to static): {gallery_upload_path_relative}")

    # Initialize Flask extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login' # Blueprint.route_name
    login_manager.login_message_category = 'info'
    csrf.init_app(app)
    mail.init_app(app) # Initialize Flask-Mail with the app

    # Models are imported at the module level now, no need to re-import here
    # Ensure they are registered with SQLAlchemy (which happens when models.py is imported)

    @login_manager.user_loader
    def load_user(user_id_str):
        # app.logger.info(f"[LOAD_USER] Attempting to load user with ID: {user_id_str}")
        if user_id_str is None:
            # app.logger.warning("[LOAD_USER] user_id is None. Cannot load user.")
            return None
        try:
            user_id_int = int(user_id_str)
            user = db.session.get(models.User, user_id_int) # Use models.User
            # if user:
            #     app.logger.info(f"[LOAD_USER] User {user.username} (ID: {user.id}) loaded.")
            # else:
            #     app.logger.warning(f"[LOAD_USER] No user found for ID: {user_id_int}")
            return user
        except ValueError:
            # app.logger.error(f"[LOAD_USER] Invalid user_id format: {user_id_str}.")
            return None
        except Exception as e:
            # app.logger.error(f"[LOAD_USER] Exception for ID {user_id_str}: {e}", exc_info=True)
            return None

    # Template filters & other utils
    from . import utils as app_utils # Import the utils module
    app_utils.init_app(app) # Register filters defined in utils.py

    from .utils import markdown_to_html_and_sanitize_util, linkify_mentions as linkify_mentions_util # Renamed to avoid conflict

    @app.template_filter('urlencode')
    def urlencode_filter(s):
        if hasattr(s, 'unescape'): # Check if it's a Markup object
            s = s.unescape()
        s = str(s)
        return urllib.parse.quote_plus(s)

    @app.template_filter('escapejs')
    def escapejs_filter(value):
        if value is None: return ''
        if not isinstance(value, str): value = str(value)
        return Markup(value.replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('/', '\\/'))

    @app.template_filter('linkify_mentions')
    def actual_linkify_mentions_filter(text):
        # This filter should be applied BEFORE markdown
        return linkify_mentions_util(text)

    @app.template_filter('markdown') # Changed decorator to register as 'markdown'
    def actual_markdown_filter(text): # Function name can be anything
        # Apply linkify_mentions before markdown processing
        text_with_mention_links = linkify_mentions_util(text)
        return markdown_to_html_and_sanitize_util(text_with_mention_links)

    # Context processors
    @app.context_processor
    def inject_global_template_variables():
        unread_notifications_count = 0
        if current_user.is_authenticated:
            unread_notifications_count = models.Notification.query.filter_by(user_id=current_user.id, is_read=False).count()

        return {
            'current_user': current_user, # From flask_login
            'default_avatar_url': url_for('static', filename='img/default_avatar.png'),
            'site_settings': models.SiteSetting, # Make SiteSetting model available
            'UserPhoto': models.UserPhoto,      # Make UserPhoto model available for ordering
            'unread_notifications_count': unread_notifications_count
        }

    @app.context_processor
    def inject_current_year():
        return {'current_year': datetime.now(timezone.utc).year}

    # Register Blueprints
    from .routes.general_routes import general_bp
    app.register_blueprint(general_bp)

    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp) # prefix is /auth via form action or url_for

    from .routes.profile_routes import profile_bp
    app.register_blueprint(profile_bp) # prefix is /profile from blueprint definition

    from .routes.post_routes import post_bp
    app.register_blueprint(post_bp) # No prefix, routes like /posts/<id>

    from .routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp) # prefix is /admin from blueprint definition

    from .routes.notification_routes import notification_bp
    app.register_blueprint(notification_bp) # prefix is /notifications

    from .routes.photo_routes import photo_bp
    app.register_blueprint(photo_bp) # prefix is /photo from blueprint definition

    from .routes.api_routes import api_bp # Import the new API blueprint
    app.register_blueprint(api_bp) # Register it, prefix is /api/v1 from its definition

    # Error handlers
    from sqlalchemy.exc import SQLAlchemyError # Import SQLAlchemyError

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        # Log the error and rollback the session
        current_app.logger.error(f"Unhandled SQLAlchemyError caught by global handler: {error}", exc_info=True)
        # Check if db.session is active before trying to rollback.
        # In some cases, like connection errors, the session might not be in a state to be rolled back,
        # or might have already been invalidated.
        try:
            if db.session.is_active:
                db.session.rollback()
                current_app.logger.info("Database session rolled back due to SQLAlchemyError.")
        except Exception as e_rollback:
            current_app.logger.error(f"Error during session rollback in SQLAlchemyError handler: {e_rollback}", exc_info=True)

        # Flash a generic message to the user
        # Check if it's an API request or a web request
        if request.blueprint == 'api' or (hasattr(request, 'accept_mimetypes') and 'application/json' in request.accept_mimetypes):
            return jsonify({
                "status": "error",
                "message": "A database error occurred. Please try again later."
            }), 500
        else:
            flash("A critical database error occurred. Please try again later. If the problem persists, contact support.", "danger")
            # Render a generic 500 error page or redirect.
            # Rendering 500.html is consistent with other server errors.
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
    def server_error_page(error):
        user_info = f"User: {current_user.username}" if current_user.is_authenticated else "User: Anonymous"
        app.logger.error(f"[ERROR_HANDLER] 500 Server Error - Path: {request.path}, IP: {request.remote_addr}, {user_info}, Error: {error}", exc_info=True)
        db.session.rollback() # Rollback in case of DB error leading to 500
        return render_template('500.html'), 500

    # Removed redundant db.create_all() from app initialization.
    # Database schema should be managed by setup_db.py or migrations.
    # with app.app_context():
    #     app.logger.info("Application context pushed for initial db.create_all().")
    #     try:
    #         app.logger.info("Attempting to ensure database tables are created (db.create_all())...")
    #         db.create_all()
    #         app.logger.info("db.create_all() completed. Tables should exist if they didn't.")
    #     except Exception as e: # Catch broad exception, could be OperationalError if DB not ready
    #         app.logger.error(f"Error during initial db.create_all(): {e}", exc_info=True)

    app.logger.info("Flask application instance created and configured.")
    return app
