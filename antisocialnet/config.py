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

    # Database URI
    DB_USER = os.environ.get('POSTGRES_USER', 'postgres')
    DB_PASS = os.environ.get('POSTGRES_PASSWORD')
    DB_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
    DB_NAME = os.environ.get('POSTGRES_DB', 'appdb')

    if DB_PASS:
        DEFAULT_DB_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
    else:
        # This might fail if password is required by PG server. AGENTS.md covers this.
        DEFAULT_DB_URI = f"postgresql://{DB_USER}@{DB_HOST}/{DB_NAME}"

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', DEFAULT_DB_URI)

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
    SECRET_KEY_FALLBACK_USED = False
    if Config.SECRET_KEY == 'a_default_very_secret_key_for_development_only_CHANGE_ME':
        # This check happens at class definition time.
        # If FLASK_SECRET_KEY is set in the environment, Config.SECRET_KEY would be that value.
        # So, if it's still the default, it means FLASK_SECRET_KEY was NOT set or was set to the default.
        # We can't easily log here directly at class definition without a logger instance.
        # A better place might be in create_app when ProductionConfig is chosen.
        # For now, let's set a flag that create_app can check.
        SECRET_KEY_FALLBACK_USED = True
        # Or, simply override it if FLASK_SECRET_KEY is not set,
        # but that might hide the issue if FLASK_SECRET_KEY itself is set to the default.
        # The current Config.SECRET_KEY already reflects the env var or fallback.
        # So the check `Config.SECRET_KEY == '...'` is correct.

    # The following is more of a runtime check if we want to raise an error,
    # but it should be done when the config is loaded by the app.
    # if not os.environ.get('FLASK_SECRET_KEY') or os.environ.get('FLASK_SECRET_KEY') == 'a_default_very_secret_key_for_development_only_CHANGE_ME':
    #     # This implies the environment variable itself is missing or insecure.
    #     # Better to check app.config['SECRET_KEY'] after it's loaded.
    #     pass # See __init__.py for a runtime check

# Dictionary to access configs by name
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory SQLite for tests
    WTF_CSRF_ENABLED = True  # ENABLE CSRF protection for tests
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
