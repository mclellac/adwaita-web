import pytest
import os
from flask import Flask, current_app, render_template_string, abort, jsonify, url_for
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone # Added

from antisocialnet import create_app, db
from antisocialnet.config import ProductionConfig, DevelopmentConfig, TestConfig, Config
from antisocialnet.models import User # For user_loader test

def test_create_app_default_development_config():
    """Test create_app uses DevelopmentConfig by default if FLASK_ENV is not set or 'development'."""
    # Unset FLASK_ENV for this test if possible, or set to 'development'
    original_flask_env = os.environ.get('FLASK_ENV')
    os.environ['FLASK_ENV'] = 'development'

    app = create_app()
    # Instead of isinstance, check characteristic values
    assert app.config['DEBUG'] is True
    assert app.env == 'development'
    # Optionally, check a value specific to DevelopmentConfig if it exists
    # Example: assert app.config.get('DEVELOPMENT_SPECIFIC_KEY') == 'expected_dev_value'

    if original_flask_env is None:
        del os.environ['FLASK_ENV']
    else:
        os.environ['FLASK_ENV'] = original_flask_env

def test_create_app_production_config():
    """Test create_app uses ProductionConfig."""
    app = create_app(config_name='production')
    # Instead of isinstance, check characteristic values
    assert app.config['DEBUG'] is False
    assert app.env == 'production' # Production config should set this
    # Optionally: assert app.config.get('PRODUCTION_SPECIFIC_KEY') == 'expected_prod_value'


def test_create_app_testing_config():
    """Test create_app uses TestConfig."""
    app = create_app(config_name='testing')
    # Instead of isinstance, check characteristic values
    assert app.config['TESTING'] is True
    assert app.config['DEBUG'] is True # TestConfig also sets DEBUG = True
    assert 'sqlite:///:memory:' in app.config['SQLALCHEMY_DATABASE_URI']
    assert app.config['WTF_CSRF_ENABLED'] is True

# Remove the patch on ProductionConfig, will manage via environment
@patch('logging.Logger.critical') # Mock app.logger.critical
def test_create_app_production_secret_key_warning(mock_logger_critical):
    """Test production mode logs a critical warning if default SECRET_KEY is used."""

    # Use patch.dict to temporarily modify os.environ for this test
    with patch.dict(os.environ, {}, clear=True): # Clear all env vars, then set specific ones if needed
        # Ensure FLASK_SECRET_KEY is NOT set, so it falls back to the default.
        if 'FLASK_SECRET_KEY' in os.environ: # Should be cleared by clear=True, but double check
            del os.environ['FLASK_SECRET_KEY']

        # The warning is logged in create_app.
        # Pass a different app_name to ensure it's a completely fresh instance
        # if there's any caching or module-level state in create_app related to app name.
        # However, create_app should ideally be idempotent regarding config for a given name.
        fresh_app = create_app(config_name='production') # Removed app_name argument

        # The check in __init__.py is:
        # if isinstance(app_config, ProductionConfig) and \
        #    app.config.get('SECRET_KEY') == Config.SECRET_KEY and \
        #    not os.environ.get('FLASK_SECRET_KEY'):
        #
        # This condition should now be met because:
        # 1. config_name='production' -> app_config is ProductionConfig
        # 2. FLASK_SECRET_KEY is unset, so ProductionConfig.SECRET_KEY uses Config.SECRET_KEY
        #    and thus app.config['SECRET_KEY'] will be the default.

        # Check if logger.critical was called
        # The create_app that was patched for logging is the one imported at the top of this file.
        # We need to ensure that the `app.logger.critical` that is called is our mock.
        # This should work if the logger is accessed as `current_app.logger` or `app.logger`
        # within create_app, and `mock_logger_critical` is correctly patching the logger
        # that `create_app`'s `app` instance would use.

        # If the app created by create_app has a different logger instance than the one
        # implicitly patched by 'logging.Logger.critical', this won't work.
        # A more robust patch might be on `antisocialnet.create_app.__init__.current_app.logger.critical`
        # if that's how it's accessed, or patch the logger on the specific app instance.
        # Given the current structure, `app.logger.critical` within `create_app` should be hit by
        # `@patch('logging.Logger.critical')` if `logging.getLogger(app.name).critical` is called.
        # Flask's default app.logger is usually based on app.name.
        # The `create_app` in `antisocialnet/__init__.py` does: `app.logger.info(...)`
        # So, patching `logging.Logger.critical` should work if the logger name matches.
        # Flask uses `self.logger_name` which defaults to `self.name` (`self.import_name`).

        mock_logger_critical.assert_called_once()
        assert "SECURITY WARNING: Running in PRODUCTION mode with the DEFAULT INSECURE SECRET_KEY" in mock_logger_critical.call_args[0][0]


def test_create_app_yaml_override():
    """Test create_app with yaml_config_override."""
    override_values = {'TEST_YAML_KEY': 'YAML_VALUE', 'SECRET_KEY': 'yaml_secret'}
    app = create_app(yaml_config_override=override_values)
    assert app.config['TEST_YAML_KEY'] == 'YAML_VALUE'
    assert app.config['SECRET_KEY'] == 'yaml_secret'

def test_upload_folders_are_absolute(app): # Uses the app fixture from conftest
    """Test that UPLOAD_FOLDER and GALLERY_UPLOAD_FOLDER are relative in config but become absolute when used with static_folder."""
    with app.app_context(): # app fixture already creates an app
        # Configured paths should be relative
        assert not os.path.isabs(current_app.config['UPLOAD_FOLDER'])
        profile_abs_path = os.path.join(current_app.static_folder, current_app.config['UPLOAD_FOLDER'])
        assert os.path.isabs(profile_abs_path)
        # Check if the directory creation logic in __init__ worked by seeing if the path exists
        # This part of the test might be more of an integration test for directory creation
        # For now, let's focus on the path configuration.
        # assert os.path.exists(profile_abs_path) # This would require the test env to allow dir creation

        if 'GALLERY_UPLOAD_FOLDER' in current_app.config: # It's set in TestConfig
            assert not os.path.isabs(current_app.config['GALLERY_UPLOAD_FOLDER'])
            gallery_abs_path = os.path.join(current_app.static_folder, current_app.config['GALLERY_UPLOAD_FOLDER'])
            assert os.path.isabs(gallery_abs_path)
            # assert os.path.exists(gallery_abs_path)

# User Loader test (partially covered by auth tests, but direct test is good)
def test_user_loader(app, db, create_test_user):
    """Test the user_loader callback for Flask-Login."""
    user = create_test_user(username="loaderuser", email="loader@example.com")
    user_id_str = str(user.id)

    with app.app_context():
        loaded_user = app.login_manager._user_callback(user_id_str)
        assert loaded_user is not None
        assert loaded_user.id == user.id

        # Test with invalid ID
        assert app.login_manager._user_callback("99999") is None
        # Test with non-integer ID
        assert app.login_manager._user_callback("abc") is None
        # Test with None ID
        assert app.login_manager._user_callback(None) is None


# Template filter and context processor tests require rendering a template.
# We can create a minimal app and render a string for these.

@pytest.fixture
def minimal_app_for_templates():
    app = create_app(config_name='testing')
    # Add a dummy user for context processor tests if needed for current_user
    @app.login_manager.request_loader
    def load_user_from_request(request):
        return None # No user for these minimal tests unless specifically set

    # Ensure DB tables and necessary SiteSettings are available for context processors
    with app.app_context():
        db.create_all()
        from antisocialnet.models import SiteSetting # Import locally for this setup
        SiteSetting.set('site_title', 'Minimal App Title', 'string')
        db.session.commit()

    return app

def test_context_processors(minimal_app_for_templates):
    """Test context processors inject expected variables."""
    with minimal_app_for_templates.test_request_context():
        # Test inject_current_year
        rendered = render_template_string("{{ current_year }}")
        assert str(datetime.now(timezone.utc).year) in rendered

        # Test inject_global_template_variables (default_avatar_url, site_settings, etc.)
        rendered_globals = render_template_string("{{ default_avatar_url }} | {{ site_settings.get('site_title', 'Default Title') }}")
        assert url_for('static', filename='img/default_avatar.png', _external=False) in rendered_globals
        # SiteSetting.get will use the DB from the app context.
        # The 'minimal_app_for_templates' uses TestConfig (in-memory SQLite).
        # SiteSetting table might be empty unless seeded by TestConfig's app creation.
        # The minimal_app_for_templates fixture now seeds 'Minimal App Title'.
        assert "Minimal App Title" in rendered_globals
        # To test actual SiteSetting.get from DB, need to use 'app' fixture or seed here.


# Error handler tests
@pytest.fixture
def app_for_error_handlers():
    app = create_app(config_name='testing')
    with app.app_context():
        db.create_all() # Ensure tables are created for this app instance

    @app.route('/make_403')
    def make_403(): abort(403)
    @app.route('/make_404')
    def make_404(): abort(404) # Will be caught by default Flask 404 if not specific route
    @app.route('/make_500')
    def make_500(): abort(500)
    @app.route('/make_sqlalchemy_error')
    def make_sqlalchemy_error():
        # Simulate a DB error that might lead to SQLAlchemyError
        # This is hard to do without specific DB interaction that fails.
        # For now, mock db.session.commit to raise it.
        with patch('antisocialnet.db.session.commit', side_effect=SQLAlchemyError("Simulated DB error")):
            try:
                db.session.commit() # This will raise the mocked error
            except SQLAlchemyError: # Catch it to allow execution flow
                pass
        # The error handler should have been invoked by the app's error handling mechanism
        # if the exception bubbled up to Flask.
        # This test setup is a bit indirect for testing the handler.
        # A better way is to ensure the handler is registered and then simulate the exception.
        # For now, this route will trigger the app's error handling if SQLAlchemyError is raised.
        # The actual test will check the response from GETting this route.
        # The error handler itself calls db.session.rollback().
        raise SQLAlchemyError("Simulated DB error for handler test")

    # Add a route specifically for testing the API JSON error response for SQLAlchemyError
    @app.route('/make_sqlalchemy_error_api_test', methods=['POST'])
    def make_sqlalchemy_error_api_test():
        # This route will be called with 'Accept: application/json'
        # We'll mock the commit to raise the error.
        db.session.add(User(username="sa_error_api_user")) # Dummy operation
        db.session.commit() # This will be mocked to raise SQLAlchemyError
        return "Should not reach here" # Should not be reached

    return app

def test_error_handler_403(app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.get('/make_403')
    assert response.status_code == 403
    assert b"Forbidden" in response.data # Check for content from 403.html

def test_error_handler_404(app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    # Accessing a non-existent route will trigger Flask's default 404,
    # which then should be handled by our custom 404 handler.
    response = client.get('/non_existent_route_for_404_test')
    assert response.status_code == 404
    assert b"Page Not Found" in response.data # Check for content from 404.html

def test_error_handler_500(app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.get('/make_500')
    assert response.status_code == 500
    assert b"Internal Server Error" in response.data # Check for content from 500.html

@patch('antisocialnet.db.session.rollback') # Mock rollback to check if it's called
def test_sqlalchemy_error_handler_web(mock_db_rollback, app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    # Temporarily unpatch the commit for this specific path if it was patched globally
    # The route /make_sqlalchemy_error now directly raises SQLAlchemyError.

    response = client.get('/make_sqlalchemy_error')
    assert response.status_code == 500
    assert b"A critical database error occurred." in response.data # Flash message
    assert b"Internal Server Error" in response.data # From 500.html
    mock_db_rollback.assert_called_once() # Check that rollback was attempted

@patch('antisocialnet.db.session.rollback') # Mock rollback as it's called by the handler
def test_sqlalchemy_error_handler_api(mock_db_rollback_api, app_for_error_handlers):
    # Test API request getting a JSON response for SQLAlchemyError
    client = app_for_error_handlers.test_client()

    # Mock db.session.commit to raise SQLAlchemyError specifically for this test path
    # This mock will affect the commit call inside the '/make_sqlalchemy_error_api_test' route
    with patch.object(db.session, 'commit', side_effect=SQLAlchemyError("Simulated DB error for API JSON test")):
        # Make a POST request to the new test route with Accept: application/json header
        response = client.post('/make_sqlalchemy_error_api_test', headers={'Accept': 'application/json'})

    assert response.status_code == 500
    json_data = response.get_json()
    assert json_data is not None
    assert json_data.get("error") == "Database operation failed"
    assert "A database error occurred" in json_data.get("message")
    mock_db_rollback_api.assert_called_once() # Ensure rollback was attempted

# --- Config.py tests ---
# (To be added in a separate test_config.py or here)
# For now, config loading is implicitly tested by create_app tests with different configs.
# Test for get_log_db_uri can be added.
# def test_config_get_log_db_uri():
#     original_uri = Config.SQLALCHEMY_DATABASE_URI
#
#     Config.SQLALCHEMY_DATABASE_URI = "postgresql://user:password@host/dbname"
#     assert Config.get_log_db_uri() == "postgresql://user:********@host/dbname"
#
#     Config.SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
#     assert Config.get_log_db_uri() == "sqlite:///:memory:" # No password to hide
#
#     Config.SQLALCHEMY_DATABASE_URI = "mysql://user@host/db" # No password
#     assert Config.get_log_db_uri() == "mysql://user@host/db"
#
#     Config.SQLALCHEMY_DATABASE_URI = original_uri # Restore
