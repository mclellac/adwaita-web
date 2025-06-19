import pytest
import os # Moved import os to the top
from flask import request, url_for, session # Added for request.path and url_for, session for flash messages
from io import BytesIO # Added for file upload simulation
import time # Added for time.sleep in edit_post test
from unittest.mock import patch, MagicMock # Added for mocking
# Trying to import 'app' directly, assuming app-demo is in sys.path somehow
from app import app, db, User, Post # app also imports Image from PIL


# Scope 'session' might be more appropriate if db setup is costly and shared across all test files (if any more are added)
# For a single test file, 'module' is fine.
@pytest.fixture(scope='module')
def test_client_setup():
    app.config['TESTING'] = True
    # Use an environment variable for the test database URL if possible, fallback to in-memory SQLite
    # For CI/CD, you might set TEST_DATABASE_URL to a PostgreSQL test instance.
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('TEST_DATABASE_URL', 'sqlite:///:memory:')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Silence the warning
    app.config['WTF_CSRF_ENABLED'] = False # Disable CSRF for testing forms
    app.config['LOGIN_DISABLED'] = False # Ensure login is not globally disabled for tests that need it
    app.config['SECRET_KEY'] = 'test-secret-key' # Consistent secret key for tests
    app.config['LOGIN_MANAGER_LOGIN_VIEW'] = 'login' # Explicitly set for tests if needed
    app.config['SERVER_NAME'] = 'localhost.test' # For url_for to work outside request context
    app.config['APPLICATION_ROOT'] = '/'
    app.config['PREFERRED_URL_SCHEME'] = 'http'

    # Initialize extensions with the test-configured app
    # We need to import init_extensions or call db.init_app and login_manager.init_app directly
    from app import init_extensions # Assuming app.py where init_extensions is defined
    init_extensions(app)

    with app.app_context():
        db.create_all()
        # No initial global data for now, tests can set up their own.

    client = app.test_client()

    # Yield the client
    yield client

    # Teardown: drop all tables
    with app.app_context():
        db.session.remove()
        db.drop_all()

# Renaming fixture to avoid conflict if there's one named test_client from pytest itself or another plugin.
# This fixture now depends on test_client_setup to ensure app is configured and DB is up.
@pytest.fixture
def client(test_client_setup):
    return test_client_setup


@pytest.fixture(scope='module')
def new_user_data_factory():
    """Factory to create different user data if needed, returning a dict."""
    def _factory(username_suffix="", profile_info_extra=""):
        return {
            'username': f'testuser{username_suffix}',
            'password': f'password123{username_suffix}',
            'profile_info': f'Test profile{profile_info_extra}'
        }
    return _factory

@pytest.fixture
def new_user(client, new_user_data_factory): # Depends on client to ensure app_context and db
    user_data = new_user_data_factory() # Get default user data
    with app.app_context():
        user = User.query.filter_by(username=user_data['username']).first()
        if not user:
            user = User(username=user_data['username'], profile_info=user_data['profile_info'])
            user.set_password(user_data['password'])
            db.session.add(user)
            db.session.commit()
        return user # Return the persisted user object

# Helper function for login
def login_user_helper(client, username, password):
    return client.post('/login', data=dict(
        username=username,
        password=password
    ), follow_redirects=True)

# Helper function for logout
def logout_user_helper(client):
    return client.get('/logout', follow_redirects=True)

# --- Basic Tests ---
def test_index_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"All Blog Posts" in response.data # Check for a known string on the index page

# --- Authentication Tests ---
def test_user_login_logout(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory() # Get default user data matching the new_user fixture

    # Test successful login
    response = login_user_helper(client, user_data['username'], user_data['password'])
    assert response.status_code == 200
    assert b"Logout" in response.data # Assuming "Logout" link is visible after login
    assert f"Logged in as {user_data['username']}".encode() not in response.data # Example check, adjust as per your layout

    # Test accessing a protected page (e.g., profile)
    response = client.get(f'/profile/{user_data["username"]}')
    assert response.status_code == 200
    assert user_data['username'].encode() in response.data

    # Test logout
    response = logout_user_helper(client)
    assert response.status_code == 200
    assert b"Login" in response.data # Assuming "Login" link is visible after logout
    assert b"Logout" not in response.data

    # Test accessing a protected page after logout
    response = client.get(f'/profile/{user_data["username"]}', follow_redirects=True) # follow to login page
    assert response.status_code == 200 # Should redirect to login
    assert b"Login" in response.data # On the login page

def test_login_failed_wrong_password(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    response = login_user_helper(client, user_data['username'], 'wrongpassword')
    assert response.status_code == 200 # Login page reloads with error
    assert b"Invalid username or password." in response.data
    assert b"Logout" not in response.data

def test_login_failed_nonexistent_user(client):
    response = login_user_helper(client, 'nonexistentuser', 'anypassword')
    assert response.status_code == 200
    assert b"Invalid username or password." in response.data
    assert b"Logout" not in response.data

# --- Settings Page Tests ---
def test_settings_page_loads_authenticated(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    response = client.get(url_for('settings_page'))
    assert response.status_code == 200
    assert b"Settings" in response.data # Page Title
    assert b"Appearance" in response.data # Preferences Group
    assert b"Accent Color" in response.data # Action Row for Accent Color
    assert b"Dark Mode" in response.data # Action Row for Theme

def test_settings_page_redirects_unauthenticated(client):
    response = client.get(url_for('settings_page')) # No login
    assert response.status_code == 302 # Should redirect
    with app.app_context(): # url_for needs app context for redirect check
        expected_redirect_url = url_for('login', _external=False)
    assert response.location == expected_redirect_url


# --- Blog Post Creation Tests ---

# Renamed from test_create_post_post_and_verify and enhanced
def test_create_post_success(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    post_data = {
        'title': 'My Successful Test Post',
        'content': 'This is the content of my successful test post.'
    }
    # Make the POST request, but don't follow redirects immediately to check the redirect response itself
    response_post = client.post('/create', data=post_data) # Removed follow_redirects=True initially

    assert response_post.status_code == 302 # Check for redirect
    with app.app_context(): # url_for needs app context
        expected_redirect_url = url_for('index', _external=False) # Get relative path
    assert response_post.location == expected_redirect_url

    # Now follow the redirect to check flash message and content on index page
    response_redirect = client.get(response_post.location)
    assert response_redirect.status_code == 200
    assert b"Post created successfully!" in response_redirect.data # Check flash message
    assert post_data['title'].encode('utf-8') in response_redirect.data
    # Author check might be more complex if only username is shown; new_user.username would be good
    assert new_user.username.encode('utf-8') in response_redirect.data


    # Verify post in database
    with app.app_context():
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        assert created_post.content == post_data['content']
        assert created_post.author.id == new_user.id
        assert created_post.user_id == new_user.id # Explicitly check user_id foreign key


def test_create_post_unauthenticated(client):
    post_data = {
        'title': 'Unauthenticated Post Attempt',
        'content': 'This content should not be saved.'
    }
    response = client.post('/create', data=post_data) # follow_redirects=False by default

    assert response.status_code == 302 # Should redirect to login
    with app.app_context():
        expected_redirect_url = url_for('login', _external=False)
    assert response.location == expected_redirect_url

    # Verify no post was created
    with app.app_context():
        post = Post.query.filter_by(title=post_data['title']).first()
        assert post is None


def test_create_post_missing_data(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Test case 1: Missing title
    response_missing_title = client.post('/create', data={'content': 'Some content without a title'})
    assert response_missing_title.status_code == 200 # Form re-rendered
    assert b"Title and content are required." in response_missing_title.data # Check flash message
    with app.app_context():
        assert Post.query.filter_by(content='Some content without a title').first() is None

    # Test case 2: Missing content
    response_missing_content = client.post('/create', data={'title': 'Some title without content'})
    assert response_missing_content.status_code == 200 # Form re-rendered
    assert b"Title and content are required." in response_missing_content.data # Check flash message
    with app.app_context():
        assert Post.query.filter_by(title='Some title without content').first() is None

    # Test case 3: Missing both title and content
    response_missing_both = client.post('/create', data={})
    assert response_missing_both.status_code == 200
    assert b"Title and content are required." in response_missing_both.data
    # No need to check DB again if previous checks are fine and logic is simple


# --- Profile Update Tests ---
def test_profile_edit_get(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    response = client.get('/profile/edit')
    assert response.status_code == 200
    assert b"Edit Profile" in response.data # Check for a known title or element
    # Check if current profile info is in the form (if it exists)
    # Ensure new_user.profile_info is not None before encoding
    if new_user.profile_info:
        assert new_user.profile_info.encode('utf-8') in response.data

def test_profile_edit_post(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    new_info = "This is updated profile information."
    # current_path before POST
    # print(f"Current path before POST: {request.path}") # This won't work here, request is out of context

    # Make the POST request
    response = client.post('/profile/edit', data={'profile_info': new_info}, follow_redirects=True)

    assert response.status_code == 200
    # After follow_redirects=True, response.request.path should be the path of the redirected page
    with app.app_context(): # url_for needs app context
        expected_path = url_for('profile', username=new_user.username, _external=False)
    assert response.request.path == expected_path
    assert new_info.encode('utf-8') in response.data

    # Verify in database
    with app.app_context():
        # Re-fetch the user from the session to ensure it's the updated instance
        # No, better to query it to ensure commit worked
        updated_user = db.session.get(User, new_user.id)
        assert updated_user.profile_info == new_info

# --- Blog Post Creation Tests ---
# The test_create_post_get is fine as it is, can be kept.
# test_create_post_post_and_verify was renamed and enhanced to test_create_post_success.
# The old test_create_post_post_and_verify will be removed by the diff.

# Renaming this to clarify it's more of an integration test for the photo upload
def test_profile_photo_upload_integration(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Simulate file upload
    data = {
        'profile_info': 'Updated info during photo upload test.' # Can also update other fields
    }
    # Create a dummy file for upload
    # The name 'profile_photo' must match the name attribute of the file input field in the form
    data['profile_photo'] = (BytesIO(b"dummyimagebytes"), 'test_photo.jpg')

    response = client.post('/profile/edit', data=data, content_type='multipart/form-data', follow_redirects=True)
    assert response.status_code == 200

    with app.app_context(): # url_for needs app context
        expected_path = url_for('profile', username=new_user.username, _external=False)
    assert response.request.path == expected_path # Check redirect to profile

    # Verify in database
    updated_user = db.session.get(User, new_user.id)
    assert updated_user.profile_photo_url is not None
    assert 'test_photo.jpg' in updated_user.profile_photo_url
    assert updated_user.username in updated_user.profile_photo_url # As per current naming convention
    assert updated_user.profile_info == 'Updated info during photo upload test.'

    # Verify the photo URL is used in the response data (e.g., in an <img> tag)
    # This depends on how the path is constructed; current code uses relative path for static.
    # For a direct check, you might need to parse HTML or check for a fragment of the URL.
    assert updated_user.profile_photo_url.encode('utf-8') in response.data


# --- Unit Tests for Profile Photo Upload with Mocking ---

@patch('app.Image.open')
@patch('app.os.makedirs')
@patch('app.secure_filename')
def test_edit_profile_photo_upload_success(mock_secure_filename, mock_makedirs, mock_image_open, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Configure mocks
    mock_secure_filename.return_value = 'test_image.png'
    mock_img_instance = MagicMock()
    mock_image_open.return_value = mock_img_instance

    # Simulate file upload
    file_data = (BytesIO(b"dummyimagebytes"), 'test_image.png')
    data = {
        'profile_info': 'Info during mocked photo upload.',
        'profile_photo': file_data
    }

    # POST request
    response = client.post('/profile/edit', data=data, content_type='multipart/form-data') # No follow_redirects initially

    assert response.status_code == 302 # Should redirect to profile page
    with app.app_context():
        expected_redirect_url = url_for('profile', username=new_user.username)
    assert response.location == expected_redirect_url

    # Follow redirect to check flash message
    response_redirect = client.get(response.location)
    assert b"Profile photo updated successfully!" in response_redirect.data # Check for general success or photo specific
    # Or check "Profile updated successfully!" if that's the one being flashed.
    # The app.py logic is: flash photo success, then general success if only info changed,
    # or if photo was attempted and URL set, general success is skipped.
    # So "Profile photo updated successfully!" is the one to check.

    # Assertions on mocks
    mock_secure_filename.assert_called_once_with('test_image.png')
    # The file object passed to Image.open is a FileStorage object.
    # We can check that Image.open was called, but checking the exact instance might be tricky
    # if it's wrapped or changed. Checking it was called once is a good start.
    mock_image_open.assert_called_once()
    mock_img_instance.thumbnail.assert_called_once_with((200, 200))

    # Construct the expected save path for the assertion on img.save()
    # Expected unique_filename = f"{new_user.username}_{mock_secure_filename.return_value}"
    # save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    # This path construction happens inside the route.
    # We need to ensure the mock_img_instance.save was called with a path that ends correctly.
    assert mock_img_instance.save.call_args[0][0].endswith(f"{new_user.username}_test_image.png")

    mock_makedirs.assert_called_once_with(app.config['UPLOAD_FOLDER'], exist_ok=True)


    # Verify DB update
    with app.app_context():
        updated_user = db.session.get(User, new_user.id)
        assert updated_user.profile_photo_url == f"uploads/profile_pics/{new_user.username}_test_image.png"
        assert updated_user.profile_info == 'Info during mocked photo upload.'


def test_edit_profile_photo_upload_invalid_file_type(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    original_photo_url = new_user.profile_photo_url # Could be None

    # Simulate file upload with an invalid extension
    file_data = (BytesIO(b"dummytextbytes"), 'test_document.txt')
    data = {'profile_photo': file_data}

    # POST request - follow redirects to check flash message on the rendered page
    response = client.post('/profile/edit', data=data, content_type='multipart/form-data', follow_redirects=True)

    assert response.status_code == 200 # Should re-render profile page (or edit_profile if no redirect on error)
                                      # The current code redirects to profile even on photo error.
    with app.app_context():
        expected_path = url_for('profile', username=new_user.username) # It redirects to profile page
    assert response.request.path == expected_path


    assert b"Invalid file type for photo." in response.data # Check flash message

    # Verify DB state (profile_photo_url should not have changed)
    with app.app_context():
        user_after_attempt = db.session.get(User, new_user.id)
        assert user_after_attempt.profile_photo_url == original_photo_url


def test_user_posts_on_profile_page(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Create a couple of posts for this user
    post_titles = ["User's First Post", "User's Second Post"]
    with app.app_context():
        db.session.add(Post(title=post_titles[0], content="Content 1", author=new_user))
        db.session.add(Post(title=post_titles[1], content="Content 2", author=new_user))
        db.session.commit()

    response = client.get(f'/profile/{new_user.username}')
    assert response.status_code == 200
    assert post_titles[0].encode('utf-8') in response.data
    assert post_titles[1].encode('utf-8') in response.data
    assert b"Posts by " + new_user.username.encode('utf-8') in response.data

def test_edit_post(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # First, create a post
    original_title = "Original Post Title to Edit"
    original_content = "Original content."
    with app.app_context():
        post_to_edit = Post(title=original_title, content=original_content, author=new_user)
        db.session.add(post_to_edit)
        db.session.commit()
        post_id = post_to_edit.id
        # Ensure created_at is set for comparison later
        original_created_at = post_to_edit.created_at
        original_updated_at = post_to_edit.updated_at


    # GET the edit page
    # edit_url = url_for('edit_post', post_id=post_id) # Need app context for url_for outside request
    with app.app_context():
        response_get = client.get(url_for('edit_post', post_id=post_id))
    assert response_get.status_code == 200
    assert original_title.encode('utf-8') in response_get.data
    assert original_content.encode('utf-8') in response_get.data

    # POST the changes
    edited_title = "Edited Post Title"
    edited_content = "Edited content."

    # Make a small delay to ensure updated_at will be different if system clock resolution is low
    time.sleep(0.01)

    with app.app_context():
        response_post = client.post(
            url_for('edit_post', post_id=post_id),
            data={'title': edited_title, 'content': edited_content},
            follow_redirects=True
        )
    assert response_post.status_code == 200

    # Verify redirection to the view_post page
    with app.app_context():
        expected_redirect_url = url_for('view_post', post_id=post_id)
    assert response_post.request.path == expected_redirect_url

    # Verify content on the view_post page
    assert edited_title.encode('utf-8') in response_post.data
    assert edited_content.encode('utf-8') in response_post.data
    assert original_title.encode('utf-8') not in response_post.data # Original title should be gone

    # Verify in database
    with app.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        assert updated_post.title == edited_title
        assert updated_post.content == edited_content
        assert updated_post.updated_at > original_updated_at
        assert updated_post.updated_at > original_created_at # Also ensure it's greater than created_at
