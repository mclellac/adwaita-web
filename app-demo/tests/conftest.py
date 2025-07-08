import pytest
import os
from app-demo import create_app, db as _db
from app-demo.models import User, Post, Category, Tag, PostLike, Notification, Activity, SiteSetting
from app-demo.config import TestConfig # Will need to ensure TestConfig exists and is appropriate

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
    user = User(username='testuser', email='test@example.com', full_name='Test User')
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

@pytest.fixture(scope='function') # Changed to function scope for isolation
def init_database(app):
    """
    Function-scoped fixture to ensure a clean database for each test.
    Relies on the session-scoped 'app' fixture for the app instance.
    """
    with app.app_context():
        _db.drop_all() # Drop all tables
        _db.create_all() # Create all tables

        # Seed essential data if needed for most tests
        SiteSetting.set('allow_registrations', True, 'bool')
        SiteSetting.set('auto_approve_users', True, 'bool')
        _db.session.commit() # Commit seed data

        yield _db # Provide the db object for convenience in tests

        _db.session.remove()
        _db.drop_all() # Clean up after the test


# Re-aliasing db to use the function-scoped init_database for test functions
@pytest.fixture()
def db(init_database):
    return init_database

# Fixture to create a test user and add to session
@pytest.fixture
def create_test_user(db):
    def _create_user(username="testuser", email="test@example.com", password="password", is_admin=False, is_approved=True):
        user = User(username=username, email=email, full_name=username.capitalize(), is_admin=is_admin, is_approved=is_approved, is_active=True)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
    return _create_user

# Fixture to create a test post
@pytest.fixture
def create_test_post(db, create_test_user):
    def _create_post(author=None, content="Test post content"):
        if author is None:
            author = create_test_user(username="postauthor", email="author@example.com")
        post = Post(content=content, user_id=author.id, is_published=True, published_at=datetime.utcnow())
        db.session.add(post)
        db.session.commit()
        return post
    return _create_post

# Fixture to log in a user
@pytest.fixture
def logged_in_client(client, create_test_user):
    user = create_test_user(username="loginuser", email="login@example.com", password="password")
    # Simulate login - directly manipulating session is complex with Flask-Login
    # It's better to use the login route with the test client
    response = client.post('/login', data=dict(
        username=user.email, # Assuming login uses email as username field
        password="password"
    ), follow_redirects=True)
    assert response.status_code == 200 # Check login was successful
    return client # client is now authenticated
