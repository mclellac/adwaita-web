import pytest
import os
from flask import Flask, current_app, render_template_string, abort, jsonify, url_for # Added jsonify for consistency, though not directly used in this file
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
import logging # For caplog

from antisocialnet import create_app, db
from antisocialnet.config import ProductionConfig, DevelopmentConfig, TestConfig, Config
from antisocialnet.models import User

def test_create_app_default_development_config():
    """Test create_app uses DevelopmentConfig by default if FLASK_ENV is not set or 'development'."""
    original_flask_env = os.environ.get('FLASK_ENV')
    os.environ['FLASK_ENV'] = 'development'
    app = create_app()
    assert app.config['DEBUG'] is True
    if original_flask_env is None:
        del os.environ['FLASK_ENV']
    else:
        os.environ['FLASK_ENV'] = original_flask_env

def test_create_app_production_config():
    """Test create_app uses ProductionConfig."""
    app = create_app(config_name='production')
    assert app.config['DEBUG'] is False

def test_create_app_testing_config():
    """Test create_app uses TestConfig."""
    app = create_app(config_name='testing')
    assert app.config['TESTING'] is True
    assert app.config['DEBUG'] is True
    assert 'sqlite:///:memory:' in app.config['SQLALCHEMY_DATABASE_URI']
    assert app.config['WTF_CSRF_ENABLED'] is True

def test_create_app_production_secret_key_warning(caplog):
    """Test production mode logs a critical warning if default SECRET_KEY is used."""
    with patch.dict(os.environ, {}, clear=True):
        if 'FLASK_SECRET_KEY' in os.environ:
            del os.environ['FLASK_SECRET_KEY']

        with caplog.at_level(logging.CRITICAL, logger='antisocialnet'):
            # Pass a config override to ensure the default secret key is used
            fresh_app = create_app(config_name='production', yaml_config_override={'SECRET_KEY': 'a_default_very_secret_key_for_development_only_CHANGE_ME'})

        # Assuming the __init__.py logic for SECRET_KEY warning is correct and reachable
        found_warning = False
        for record in caplog.records:
            if record.levelname == 'CRITICAL' and "CRITICAL SECURITY WARNING" in record.message and "DEFAULT INSECURE SECRET_KEY" in record.message:
                found_warning = True
                break
        assert found_warning, "The expected CRITICAL security warning was not logged or condition in __init__.py not met as expected."

def test_create_app_yaml_override():
    """Test create_app with yaml_config_override."""
    override_values = {'TEST_YAML_KEY': 'YAML_VALUE', 'SECRET_KEY': 'yaml_secret'}
    app = create_app(yaml_config_override=override_values)
    assert app.config['TEST_YAML_KEY'] == 'YAML_VALUE'
    assert app.config['SECRET_KEY'] == 'yaml_secret'

def test_upload_folders_are_absolute(app):
    with app.app_context():
        assert not os.path.isabs(current_app.config['UPLOAD_FOLDER'])
        profile_abs_path = os.path.join(current_app.static_folder, current_app.config['UPLOAD_FOLDER'])
        assert os.path.isabs(profile_abs_path)
        if 'GALLERY_UPLOAD_FOLDER' in current_app.config:
            assert not os.path.isabs(current_app.config['GALLERY_UPLOAD_FOLDER'])
            gallery_abs_path = os.path.join(current_app.static_folder, current_app.config['GALLERY_UPLOAD_FOLDER'])
            assert os.path.isabs(gallery_abs_path)

def test_user_loader(app, db, create_test_user):
    user = create_test_user(email_address="loaderuser@example.com", full_name="Loader User")
    user_id_str = str(user.id)
    with app.app_context():
        loaded_user = app.login_manager._user_callback(user_id_str)
        assert loaded_user is not None
        assert loaded_user.id == user.id
        assert app.login_manager._user_callback("99999") is None
        assert app.login_manager._user_callback("abc") is None
        assert app.login_manager._user_callback(None) is None

@pytest.fixture(scope="module")
def minimal_app_for_templates():
    app = create_app(config_name='testing')
    @app.login_manager.request_loader
    def load_user_from_request(request): # pragma: no cover
        return None
    with app.app_context():
        db.create_all()
        from antisocialnet.models import SiteSetting
        SiteSetting.set('site_title', 'Minimal App Title', 'string')
        db.session.commit()
    yield app

def test_context_processors(minimal_app_for_templates):
    with minimal_app_for_templates.test_request_context():
        rendered = render_template_string("{{ current_year }}")
        assert str(datetime.now(timezone.utc).year) in rendered
        rendered_globals = render_template_string("{{ default_avatar_url }} | {{ site_settings.get('site_title', 'Default Title') }}")
        assert url_for('static', filename='img/default_avatar.png', _external=False) in rendered_globals
        assert "Minimal App Title" in rendered_globals

@pytest.fixture(scope="module")
def app_for_error_handlers():
    app = create_app(config_name='testing')
    app.config['WTF_CSRF_ENABLED'] = False # Disable CSRF for these specific error handler tests
    app.config['TESTING_ERROR_HANDLERS'] = True
    with app.app_context():
        db.create_all()

    @app.route('/make_403')
    def make_403(): abort(403) # pragma: no cover
    @app.route('/make_404_test_route')
    def make_404_test_route(): abort(404) # pragma: no cover
    @app.route('/make_500')
    def make_500(): abort(500) # pragma: no cover

    @app.route('/make_sqlalchemy_error_web')
    def make_sqlalchemy_error_web(): # pragma: no cover
        raise SQLAlchemyError("Simulated DB error for web handler test")

    @app.route('/make_sqlalchemy_error_api_test', methods=['POST'])
    def make_sqlalchemy_error_api_test(): # pragma: no cover
        raise SQLAlchemyError("Simulated DB error for API JSON test")

    yield app

def test_error_handler_403(app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.get('/make_403')
    assert response.status_code == 403
    assert b"Forbidden" in response.data

def test_error_handler_404(app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.get('/non_existent_route_for_404_test_xyz')
    assert response.status_code == 404
    assert b"Page Not Found" in response.data

def test_error_handler_500(app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.get('/make_500')
    assert response.status_code == 500
    assert b"Internal Server Error" in response.data

@patch('antisocialnet.db.session.rollback')
def test_sqlalchemy_error_handler_web(mock_db_rollback, app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.get('/make_sqlalchemy_error_web')
    assert response.status_code == 500
    assert b"A critical database error occurred." in response.data
    assert b"Internal Server Error" in response.data
    mock_db_rollback.assert_called_once()

@patch('antisocialnet.db.session.rollback')
def test_sqlalchemy_error_handler_api(mock_db_rollback_api, app_for_error_handlers):
    client = app_for_error_handlers.test_client()
    response = client.post('/make_sqlalchemy_error_api_test', headers={'Accept': 'application/json'})
    assert response.status_code == 500
    json_data = response.get_json()
    assert json_data is not None
    assert json_data.get("status") == "error"
    assert "A database error occurred" in json_data.get("message")
    mock_db_rollback_api.assert_called_once()
