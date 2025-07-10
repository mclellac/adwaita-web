import pytest
import os
from antisocialnet import create_app, db as _db
from antisocialnet.models import User, Post, Category, Tag, PostLike, Notification, Activity, SiteSetting
from antisocialnet.config import TestConfig # Will need to ensure TestConfig exists and is appropriate

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application."""
    # FLASK_ENV is now implicitly handled by passing config_name='testing'
    # to create_app, which should select TestConfig.

    # create_app will now use TestConfig from config.py
    # The yaml_config_override is removed as TestConfig handles these settings.
    app_instance = create_app(config_name='testing')

    # Ensure app context is pushed for operations like db.create_all()
    # and to make app.static_folder available for UPLOAD_FOLDER setup.
    with app_instance.app_context():
        _db.create_all()
        # You can also add any initial seed data common to all tests here
        # For example, a default 'admin' role or essential SiteSettings
        SiteSetting.set('allow_registrations', True, 'bool')
        SiteSetting.set('auto_approve_users', True, 'bool')


    yield app_instance

    # Teardown: context is already popped, db might need explicit removal if not in-memory
    # For in-memory SQLite, it's destroyed when connection closes.
    # If using a file-based SQLite for tests, you might os.remove it here.
    with app_instance.app_context():
        _db.session.remove() # Ensure session is properly closed
        _db.drop_all() # Clean up the in-memory database


@pytest.fixture()
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture()
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()

@pytest.fixture()
def db(app):
    """
    Yields the SQLAlchemy database instance.
    Ensures that the database is created and dropped for each test function if needed,
    though the session-scoped app fixture handles initial create_all and final drop_all.
    This fixture mainly provides easy access to _db.
    If tests modify DB and need isolation per test, more granular setup/teardown would be here.
    For now, assuming tests clean up after themselves or run against a fresh in-memory DB state
    provided by the 'app' fixture's context if it were function-scoped.
    Since 'app' is session-scoped, we need to be careful about test interactions.
    A common pattern is to recreate the DB for each test or use transactions.

    Let's refine this to provide a clean DB for each test.
    """
    with app.app_context():
        # _db.create_all() # Already done by app fixture for the session
        # For per-test isolation if app were function-scoped:
        # _db.session.begin_nested() if using transactions, or recreate tables.

        yield _db

        # _db.session.rollback() # Rollback changes after each test
        # _db.drop_all() # If creating tables per test
    # For session-scoped app, individual tests should manage their own data creation/deletion
    # or use transactions if the DB supports it well with tests.
    # A simple approach for now: the session 'app' fixture creates tables once. Tests run on this.

@pytest.fixture
def new_user(app, db_session): # db_session will be another fixture
    """Create a new user instance (not saved to DB)."""
    user = User(username='testuser', email='test@example.com', full_name='Test User') # noqa: E501
    user.set_password('password')
    return user

@pytest.fixture
def db_session(app):
    """
    Provides a SQLAlchemy session with proper setup and teardown for each test.
    This ensures that tests do not interfere with each other.
    """
    with app.app_context():
        _db.create_all() # Ensure tables are there for this specific test session

        connection = _db.engine.connect()
        transaction = connection.begin()

        # Flask-SQLAlchemy uses a scoped session, so we need to use that
        # Forcing a new scope for the session to avoid interferences
        options = dict(bind=connection, binds={})
        scoped_session = _db.create_scoped_session(options=options)
        _db.session = scoped_session # Override the global session with this test-specific one

        yield _db.session

        _db.session.remove()
        transaction.rollback() # Rollback any changes made during the test
        connection.close()
        _db.drop_all() # Clean up tables after each test for full isolation
                       # This is heavy but ensures no state leakage.
                       # For faster tests, table creation could be session-scoped and only data cleared/rolled back.
                       # Given the current 'app' fixture is session-scoped, let's refine.

@pytest.fixture(scope='function')
def db_session_txn(app): # app is session-scoped, _db is the SQLAlchemy instance
    """
    Provides a transactional scope for tests. Rolls back changes after each test.
    Tables are created once by the session-scoped 'app' fixture.
    SiteSettings are also set once by the 'app' fixture.
    This fixture ensures data isolation between tests.
    """
    with app.app_context():
        connection = _db.engine.connect()
        transaction = connection.begin()

        # Use a specific session bound to this transaction/connection for the test
        # This overrides the default scoped_session from Flask-SQLAlchemy for this test's scope
        options = {'bind': connection, 'binds': {}}
        test_session = _db.create_scoped_session(options=options)

        # Store original session and replace it
        original_session = _db.session
        _db.session = test_session

        yield _db.session # Test uses this session

        # Teardown
        test_session.remove() # Or test_session.close()
        transaction.rollback()
        connection.close()
        _db.session = original_session # Restore original session for other potential uses (though typically not needed if all tests use this)


# The primary 'db' fixture used by tests should now provide the transactional session.
# Tests typically import 'db' from 'antisocialnet' which is '_db' here.
# So, tests that need to commit or rollback will use `db.session`.
# We want `db.session` within a test to be this transactional session.
# The fixture `db_session_txn` now correctly overrides `_db.session`.
# So tests can continue to use `_db.session` or `from antisocialnet import db` and then `db.session`.

# Fixture that provides the SQLAlchemy instance itself, now mostly for convenience if needed.
# Most tests will interact via the session provided by db_session_txn (which is now _db.session during test).
@pytest.fixture
def db_instance(app): # Changed from 'db' to 'db_instance' to avoid confusion with the session
    """Provides the raw SQLAlchemy DB instance, primarily for _db.metadata etc."""
    return _db

# Alias the transactional session fixture to `db_session` for clarity if tests import it,
# or they can just use `db.session` (which is overridden by `db_session_txn`).
# For tests that take `db` as an argument, they are getting the SQLAlchemy instance.
# They then use `db.session`. So, `db_session_txn` correctly makes `db.session` transactional.
# The old `db(init_database)` alias is no longer needed.
# Tests that used `db` fixture expecting the SQLAlchemy instance will still work,
# and `db.session` will be the transactional one.
# The `init_database` fixture is removed.
# The `db` fixture that tests import should be the SQLAlchemy object.
# The `db_session_txn` fixture should be used by tests that need a session,
# or we make `db_session_txn` the primary way to get a session.

# Let's make the primary 'db' fixture for tests return the SQLAlchemy object,
# and ensure 'db_session_txn' is used by tests that need to interact with the session.
# Or, more commonly, tests will import `db` from `antisocialnet` and then use `db.session`.
# The `db_session_txn` fixture should be auto-used if tests depend on a clean session.
# We can make it an autouse fixture or have tests explicitly request it.
# For now, let's make it the primary way to get a session for database operations in tests.

@pytest.fixture(scope="function")
def db(app, request): # request is a pytest fixture
    """
    Provides a transactional scope for tests. Rolls back changes after each test.
    This replaces the old 'db' and 'init_database' fixtures.
    Tests will receive the SQLAlchemy `_db` object through this fixture,
    and `_db.session` will be managed transactionally.
    """
    with app.app_context():
        connection = _db.engine.connect()
        transaction = connection.begin()

        options = {'bind': connection, 'binds': {}}
        # Corrected method name based on AttributeError hint
        scoped_session = _db._make_scoped_session(options=options) # Using _make_scoped_session

        original_session = _db.session
        _db.session = scoped_session

        # Yield the SQLAlchemy instance, tests will use _db.session
        yield _db

        _db.session.remove()
        transaction.rollback()
        connection.close()
        _db.session = original_session

import re # For CSRF token extraction
from datetime import datetime, timezone # For create_test_post
from flask import url_for # For logged_in_client and admin_client

# Fixture to create a test user and add to session
@pytest.fixture
def create_test_user(db): # db fixture provides transactional session
    # Parameter 'email_address' is used for the User model's 'username' field.
    def _create_user(email_address="testuser@example.com", password="password",
                     full_name=None, is_admin=False, is_approved=True, is_active=True,
                     profile_info=None, website_url=None, is_profile_public=True):

        user = User()
        user.username = email_address # User model's username is the email
        user.set_password(password)
        user.full_name = full_name if full_name else email_address.split('@')[0].capitalize()
        user.is_admin = is_admin
        user.is_approved = is_approved
        user.is_active = is_active
        user.profile_info = profile_info
        user.website_url = website_url
        user.is_profile_public = is_profile_public

        db.session.add(user)
        db.session.commit()
        return user
    return _create_user

# Fixture to create a test post
@pytest.fixture
def create_test_post(db, create_test_user):
    _default_author_counter = 0
    def _create_post(author=None, content="Test post content", is_published=True, published_at=None):
        nonlocal _default_author_counter
        if author is None:
            # Use a unique email for the default post author to avoid conflicts
            _default_author_counter += 1
            author_email = f"default_post_author_{_default_author_counter}@example.com"
            author = create_test_user(email_address=author_email)

        if published_at is None:
            published_at = datetime.now(timezone.utc)

        post = Post(content=content, user_id=author.id, is_published=is_published, published_at=published_at)
        db.session.add(post)
        db.session.commit()
        return post
    return _create_post

def _get_csrf_token(client, login_url):
    """Helper to fetch CSRF token from a form page."""
    rv = client.get(login_url)
    assert rv.status_code == 200
    match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', rv.data.decode())
    assert match, "CSRF token not found in login page"
    return match.group(1)

# Fixture to log in a user
@pytest.fixture
def logged_in_client(client, app, create_test_user, db): # Added db to ensure user creation within session
    # Ensure this email is unique or managed if multiple logged_in_clients are used in one test.
    user_email = "login_fixture_user@example.com"
    user_password = "password"

    # Use the db (transactional session) provided by the db fixture
    user = create_test_user(email_address=user_email, password=user_password, is_approved=True, is_active=True)

    with app.test_request_context(): # For url_for
        login_url = url_for('auth.login')
        csrf_token = _get_csrf_token(client, login_url)

    response = client.post(login_url, data={
        'username': user.username, # User model uses email as username
        'password': user_password,
        'csrf_token': csrf_token
    }, follow_redirects=True)

    assert response.status_code == 200, f"Login failed: {response.data.decode()}"
    assert b"Logout" in response.data, "Logout link not found, login might have failed."

    return client

@pytest.fixture
def admin_client(client, app, create_test_user, db): # Added db
    admin_email = "admin_fixture_user@example.com" # Ensure this is unique if used alongside other fixtures
    admin_password = "password"

    admin_user = create_test_user(
        email_address=admin_email,
        password=admin_password,
        is_admin=True,
        is_approved=True,
        is_active=True
    )

    with app.test_request_context(): # For url_for
        login_url = url_for('auth.login')
        csrf_token = _get_csrf_token(client, login_url) # Use helper

    response = client.post(login_url, data={
        'username': admin_user.username, # User model uses email as username
        'password': admin_password,
        'csrf_token': csrf_token
    }, follow_redirects=True)

    assert response.status_code == 200, f"Admin login failed: {response.data.decode()}"
    assert b"Logout" in response.data, "Logout link not found, admin login might have failed."
    # Add a check specific to admin users, e.g., visibility of an "Admin" link or section
    # This depends on your application's templates.
    # For example, if admins see an "Admin Dashboard" link:
    # assert b"Admin Dashboard" in response.data
    # Or if there's a specific part of the layout for admins:
    assert b"Admin" in response.data # A simple check, adjust as per your app's admin indicators

    return client
