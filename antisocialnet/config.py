# Placeholder for configuration
import os
import urllib.parse

class Config:
    SECRET_KEY = os.environ.get(
        'FLASK_SECRET_KEY',
        'a_default_very_secret_key_for_development_only_CHANGE_ME'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_TIME_LIMIT = 14400 # 4 hours, for diagnosing "CSRF token invalid" errors
    UPLOAD_FOLDER = 'uploads/profile_pics' # Relative to app.static_folder
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_PROFILE_PHOTO_SIZE_BYTES = 2 * 1024 * 1024  # 2MB
    GALLERY_UPLOAD_FOLDER = 'uploads/gallery_pics' # Relative to app.static_folder
    MAX_GALLERY_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # Max overall request size 10MB (increased for gallery)
    POSTS_PER_PAGE = 10 # Default, can be overridden by SiteSetting
    ACTIVITIES_PER_PAGE = 20 # For the new activity feed
    ALLOWED_THEMES = {'light', 'dark', 'system'}

    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'antisocialnet.db')

    # Flask-Mail configuration (sensible defaults for development/testing)
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 25)) # Default to 25 for local SMTP, 587 for TLS, 465 for SSL
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'false').lower() in ['true', '1', 't']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', '1', 't']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', '"Your App Name" <noreply@example.com>')
    # For development, you might use a local SMTP debugging server like `python -m smtpd -c DebuggingServer -n localhost:1025`
    # And set MAIL_PORT = 1025, MAIL_SERVER = 'localhost', MAIL_USE_TLS/SSL = False

    @staticmethod
    def get_log_db_uri():
        # Utility to get a log-safe version of the DB URI
        log_db_uri = Config.SQLALCHEMY_DATABASE_URI
        # Try to hide password if present in the effective URI
        try:
            parsed_url = urllib.parse.urlparse(log_db_uri)
            if parsed_url.password:
                log_db_uri = parsed_url._replace(password="********").geturl()
        except Exception: # Catch any parsing errors with unusual URIs
            # If DATABASE_URL was set directly and is malformed, this could happen.
            # Or if one of the components was weird.
            # Fallback to a generic message or just the original if it's not obviously parsable.
            if Config.DB_PASS and Config.DB_PASS in log_db_uri: # Basic check
                 log_db_uri = "postgresql://USER:********@HOST/DB (details hidden)"
            # else, it might be a non-password URI or already obscured.
        return log_db_uri

class DevelopmentConfig(Config):
    DEBUG = True
    # SQLALCHEMY_ECHO = True # Useful for debugging SQL

class ProductionConfig(Config):
    DEBUG = False
    # Add any production specific settings, e.g.
    SECRET_KEY_FALLBACK_USED = False # This flag is checked in __init__.py
    if Config.SECRET_KEY == 'a_default_very_secret_key_for_development_only_CHANGE_ME':
        SECRET_KEY_FALLBACK_USED = True

    # Security settings for session cookie
    SESSION_COOKIE_SECURE = True  # Ensure cookies are only sent over HTTPS
    SESSION_COOKIE_HTTPONLY = True # Prevent JavaScript access to session cookie (Flask default)
    SESSION_COOKIE_SAMESITE = 'Lax' # CSRF protection measure
    # REMEMBER_COOKIE_SECURE = True # If using "remember me" functionality
    # REMEMBER_COOKIE_HTTPONLY = True # If using "remember me" functionality
    # REMEMBER_COOKIE_SAMESITE = 'Lax' # If using "remember me" functionality

# Dictionary to access configs by name
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory SQLite for tests
    WTF_CSRF_ENABLED = False  # ENABLE CSRF protection for tests
    SECRET_KEY = 'test-secret-key' # Explicit test secret key
    SERVER_NAME = 'localhost.test' # Added for url_for in tests
    MAIL_SUPPRESS_SEND = True # Do not send emails during tests
    # Ensure UPLOAD_FOLDER and GALLERY_UPLOAD_FOLDER are set if needed by tests,
    # or rely on defaults from Config class if they are suitable.
    # They are defined in Config, so they will be inherited.
    # For tests, we might want to ensure they point to temporary, test-specific locations
    # if actual file uploads are tested and files are written.
    # However, for unit tests focusing on logic, this might not be needed.
    # The default 'static/uploads/profile_pics' from Config class is fine if app.static_folder is mocked/handled.
    # My conftest.py already sets UPLOAD_FOLDER in yaml_config_override, so this will be overridden again.
    # For consistency, I can set them here too.
    UPLOAD_FOLDER = 'uploads/test_profile_pics' # Relative to static folder for tests
    GALLERY_UPLOAD_FOLDER = 'uploads/test_gallery_photos' # Relative to static folder for tests
    DEBUG = True # Often useful for tests to get more detailed error output
    SQLALCHEMY_ECHO = False # Keep SQL queries quiet during tests unless specifically debugging


# Update config_by_name to include TestConfig
config_by_name['testing'] = TestConfig

def get_config():
    flask_env = os.getenv('FLASK_ENV', 'development')
    return config_by_name.get(flask_env, DevelopmentConfig)
