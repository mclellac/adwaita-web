# Placeholder for configuration
import os
import urllib.parse

class Config:
    SECRET_KEY = os.environ.get(
        'FLASK_SECRET_KEY',
        'a_default_very_secret_key_for_development_only_CHANGE_ME'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'static/uploads/profile_pics' # Relative to app root (app-demo/).
                                                  # Will be made absolute in __init__.py to app-demo/static/uploads/profile_pics
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_PROFILE_PHOTO_SIZE_BYTES = 2 * 1024 * 1024  # 2MB
    GALLERY_UPLOAD_FOLDER = 'static/uploads/gallery_pics' # Relative to app root (app-demo/)
                                                       # Will be made absolute in __init__.py
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
    # SECRET_KEY = os.environ.get('FLASK_SECRET_KEY') # Should be a strong random key
    # if not SECRET_KEY or SECRET_KEY == 'a_default_very_secret_key_for_development_only_CHANGE_ME':
    #     raise ValueError("No FLASK_SECRET_KEY set for production")

# Dictionary to access configs by name
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    flask_env = os.getenv('FLASK_ENV', 'development')
    return config_by_name.get(flask_env, DevelopmentConfig)
