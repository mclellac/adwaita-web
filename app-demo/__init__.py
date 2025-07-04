import logging
import os
import urllib.parse
from datetime import datetime, timezone
from flask import Flask, render_template, request, session, url_for, current_app, redirect # Added current_app, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_wtf import CSRFProtect
from markupsafe import Markup

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

# Import models at the module level so they are registered with SQLAlchemy
# and accessible via the package for scripts like setup_db.py
from . import models # This will import app-demo/models.py

def create_app(config_name=None):
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    # Default to DevelopmentConfig if FLASK_ENV is not set or recognized
    from .config import config_by_name, DevelopmentConfig, Config
    if config_name:
        app_config = config_by_name.get(config_name, DevelopmentConfig)
    else:
        flask_env = os.getenv('FLASK_ENV', 'development')
        app_config = config_by_name.get(flask_env, DevelopmentConfig)
    app.config.from_object(app_config)

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
    app.logger.info(f"Upload folder set to: {app.config['UPLOAD_FOLDER']}")


    # Initialize Flask extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login' # Blueprint.route_name
    login_manager.login_message_category = 'info'
    csrf.init_app(app)

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

    # Template filters
    from .utils import markdown_to_html_and_sanitize_util # Renamed to avoid conflict

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

    @app.template_filter('markdown_to_html') # Simpler name for template
    def markdown_filter(text):
        return markdown_to_html_and_sanitize_util(text)

    # Context processors
    @app.context_processor
    def inject_global_template_variables():
        return {
            'current_user': current_user, # From flask_login
            'default_avatar_url': url_for('static', filename='img/default_avatar.png'),
            'site_settings': models.SiteSetting, # Make SiteSetting model available
            'UserPhoto': models.UserPhoto      # Make UserPhoto model available for ordering
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

    # Error handlers
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

    with app.app_context():
        app.logger.info("Application context pushed for initial db.create_all().")
        try:
            app.logger.info("Attempting to ensure database tables are created (db.create_all())...")
            db.create_all()
            app.logger.info("db.create_all() completed. Tables should exist if they didn't.")
        except Exception as e: # Catch broad exception, could be OperationalError if DB not ready
            app.logger.error(f"Error during initial db.create_all(): {e}", exc_info=True)
            # Depending on the app's needs, this might be a fatal error or something to warn about.
            # For now, just log it. The app might still run if tables exist or are not immediately needed.

    app.logger.info("Flask application instance created and configured.")
    return app
