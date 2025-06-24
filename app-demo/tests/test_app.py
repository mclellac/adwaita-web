import pytest
import os # Moved import os to the top
from flask import request, url_for, session # Added for request.path and url_for, session for flash messages
from io import BytesIO # Added for file upload simulation
import time # Added for time.sleep in edit_post test
from unittest.mock import patch, MagicMock # Added for mocking
from app import create_app, db, User, Post, Tag, Comment, Category # Import create_app and extensions, ADDED Category
from datetime import datetime, timezone, timedelta # Added for post creation timestamps


# Changed scope from 'module' to 'function' for better test isolation.
# This ensures each test gets a fresh app configuration and database.
@pytest.fixture(scope='function')
def app_instance(): # Renamed from test_client_setup to reflect it yields the app
    # Configuration for testing
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': os.environ.get('TEST_DATABASE_URL', 'sqlite:///:memory:'),
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'WTF_CSRF_ENABLED': False,
        'LOGIN_DISABLED': False,
        'SECRET_KEY': 'test-secret-key',
        'LOGIN_MANAGER_LOGIN_VIEW': 'login', # Ensure this is set
        'SERVER_NAME': 'localhost.test', # For url_for to work outside request context
        'APPLICATION_ROOT': '/',
        'PREFERRED_URL_SCHEME': 'http',
        # UPLOAD_FOLDER is set within create_app by default, can be overridden here if needed
    }
    _app = create_app(config_overrides=test_config)

    with _app.app_context():
        db.create_all()

    yield _app # Provide the app instance

    # Teardown: drop all tables - this needs to happen in an app context
    with _app.app_context():
        db.session.remove() # Good practice
        db.drop_all()


@pytest.fixture
def client(app_instance): # Depends on app_instance
    return app_instance.test_client()


@pytest.fixture(scope='function')
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
def new_user(app_instance, new_user_data_factory): # Depends on app_instance for app_context
    user_data = new_user_data_factory() # Get default user data
    with app_instance.app_context(): # Use app_instance's context
        user = User.query.filter_by(username=user_data['username']).first()
        if not user:
            user = User(username=user_data['username'], profile_info=user_data['profile_info'])
            user.set_password(user_data['password'])
            db.session.add(user)
            db.session.commit()
        return user # Return the persisted user object

# Helper function for login
def login_user_helper(client, username, password):
    # url_for needs an app context if used outside a request,
    # but client.post creates its own request context.
    return client.post('/login', data=dict(
        username=username,
        password=password
    ), follow_redirects=True)

# Helper function for logout
def logout_user_helper(client):
    return client.get('/logout', follow_redirects=True) # Same as above

# --- Basic Tests ---
def test_index_page(client): # app_instance not strictly needed if not using url_for here
    response = client.get('/')
    assert response.status_code == 200
    assert b"All Blog Posts" in response.data

# --- Authentication Tests ---
def test_user_login_logout(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()

    response = login_user_helper(client, user_data['username'], user_data['password'])
    assert response.status_code == 200
    assert b"Logout" in response.data
    assert f"Logged in as {user_data['username']}".encode() not in response.data

    with app_instance.app_context():
        response = client.get(url_for('profile', username=user_data["username"]))
    assert response.status_code == 200
    assert user_data['username'].encode() in response.data

    response = logout_user_helper(client)
    assert response.status_code == 200
    assert b"Login" in response.data
    assert b"Logout" not in response.data

    with app_instance.app_context():
        response = client.get(url_for('profile', username=user_data["username"]), follow_redirects=True)
    assert response.status_code == 200
    assert b"Login" in response.data

def test_login_failed_wrong_password(client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    response = login_user_helper(client, user_data['username'], 'wrongpassword')
    assert response.status_code == 200
    assert b"Invalid username or password." in response.data
    assert b"Logout" not in response.data

def test_login_failed_nonexistent_user(client):
    response = login_user_helper(client, 'nonexistentuser', 'anypassword')
    assert response.status_code == 200
    assert b"Invalid username or password." in response.data
    assert b"Logout" not in response.data

# --- Settings Page Tests ---
def test_settings_page_loads_authenticated(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        response = client.get(url_for('settings_page'))
    assert response.status_code == 200
    assert b"Settings" in response.data
    assert b"Appearance" in response.data
    assert b"Accent Color" in response.data
    assert b"Dark Mode" in response.data

def test_settings_page_redirects_unauthenticated(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('settings_page'))
    assert response.status_code == 302

    from urllib.parse import urlparse, parse_qs
    with app_instance.app_context():
        # Ensure expected paths are relative for comparison with parsed_location.path
        expected_login_path = url_for('login', _external=False)
        expected_settings_path_for_next_param = url_for('settings_page', _external=False)

    parsed_location = urlparse(response.location)
    assert parsed_location.path == expected_login_path

    query_params = parse_qs(parsed_location.query)
    assert 'next' in query_params
    # The 'next' parameter in the redirect URL should also be a relative path
    assert query_params['next'][0] == expected_settings_path_for_next_param


# --- Settings API Tests ---
def test_save_theme_preference_authenticated(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        response = client.post(url_for('save_theme_preference'), json={'theme': 'dark'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'

    with app_instance.app_context():
        # Fetch user by username from user_data to ensure it's session-bound
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert user_to_check.theme == 'dark'

    with app_instance.app_context():
        response = client.post(url_for('save_theme_preference'), json={'theme': 'light'})
    assert response.status_code == 200
    with app_instance.app_context():
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert user_to_check.theme == 'light'

def test_save_accent_color_preference_authenticated(app_instance, client, new_user, new_user_data_factory): # new_user fixture provides the user in DB
    user_data = new_user_data_factory() # To get username/password for login
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        response = client.post(url_for('save_accent_color_preference'), json={'accent_color': 'green'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'

    with app_instance.app_context():
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert user_to_check.accent_color == 'green'

    with app_instance.app_context():
        response = client.post(url_for('save_accent_color_preference'), json={'accent_color': 'orange'})
    assert response.status_code == 200
    with app_instance.app_context():
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert user_to_check.accent_color == 'orange'

def test_save_theme_preference_unauthenticated(app_instance, client):
    with app_instance.app_context():
        response = client.post(url_for('save_theme_preference'), json={'theme': 'dark'})
    assert response.status_code == 302 # Redirects to login

def test_save_accent_color_preference_unauthenticated(app_instance, client):
    with app_instance.app_context():
        response = client.post(url_for('save_accent_color_preference'), json={'accent_color': 'blue'})
    assert response.status_code == 302 # Redirects to login

def test_save_theme_preference_invalid_data(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        # Missing 'theme' key
        response = client.post(url_for('save_theme_preference'), json={'other_key': 'dark'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Missing theme data' in json_data['message']

    with app_instance.app_context():
        # Invalid theme value
        response = client.post(url_for('save_theme_preference'), json={'theme': 'invalid_theme_value'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Invalid theme value' in json_data['message']

def test_save_accent_color_preference_invalid_data(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        # Missing 'accent_color' key
        response = client.post(url_for('save_accent_color_preference'), json={'other_key': 'blue'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Missing accent_color data' in json_data['message']
    # Note: The current app.py route for accent_color doesn't validate the *value* of accent_color,
    # so we don't test for an invalid value here. If validation is added, a test should be too.


# --- Blog Post Creation Tests ---

def test_create_post_success(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    # Fetch user_id within an app_context to ensure 'new_user' (or a fresh query) is session-attached
    with app_instance.app_context():
        # It's safer to re-fetch the user by a stable identifier from user_data
        # or ensure new_user is merged if its attributes are needed.
        # For just the ID, fetching by username is robust.
        temp_user = User.query.filter_by(username=user_data['username']).first()
        assert temp_user is not None, "User for post creation not found."
        user_id = temp_user.id

    login_user_helper(client, user_data['username'], user_data['password'])

    post_data = {
        'title': 'My Successful Test Post',
        'content': 'This is the content of my successful test post.'
    }
    with app_instance.app_context():
        response_post = client.post(url_for('create_post'), data=post_data)

    assert response_post.status_code == 302
    with app_instance.app_context():
        expected_redirect_url = url_for('index', _external=False)
    assert response_post.location == expected_redirect_url

    response_redirect = client.get(response_post.location)
    assert response_redirect.status_code == 200
    assert b"Post created successfully!" in response_redirect.data
    assert post_data['title'].encode('utf-8') in response_redirect.data

    with app_instance.app_context(): # Re-fetch user in this context to ensure it's attached
        user_for_check = db.session.get(User, user_id) # Use captured user_id
        assert user_for_check is not None
        assert user_for_check.username.encode('utf-8') in response_redirect.data

    with app_instance.app_context():
        # User for authorship check, fetched by the captured user_id
        author_user = db.session.get(User, user_id)
        assert author_user is not None
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        assert created_post.content == post_data['content']
        assert created_post.author.id == author_user.id
        assert created_post.user_id == author_user.id


def test_create_post_unauthenticated(app_instance, client):
    post_data = {
        'title': 'Unauthenticated Post Attempt',
        'content': 'This content should not be saved.'
    }
    with app_instance.app_context():
        response = client.post(url_for('create_post'), data=post_data)

    assert response.status_code == 302
    from urllib.parse import urlparse
    with app_instance.app_context():
        expected_login_url = url_for('login', _external=False) # Ensure relative path
    assert urlparse(response.location).path == expected_login_url

    with app_instance.app_context():
        post = Post.query.filter_by(title=post_data['title']).first()
        assert post is None


def test_create_post_missing_data(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        response_missing_title = client.post(url_for('create_post'), data={'content': 'Some content without a title'})
    assert response_missing_title.status_code == 200
    assert b"This field is required." in response_missing_title.data
    with app_instance.app_context():
        assert Post.query.filter_by(content='Some content without a title').first() is None

    with app_instance.app_context():
        response_missing_content = client.post(url_for('create_post'), data={'title': 'Some title without content'})
    assert response_missing_content.status_code == 200
    assert b"This field is required." in response_missing_content.data
    with app_instance.app_context():
        assert Post.query.filter_by(title='Some title without content').first() is None

    with app_instance.app_context():
        response_missing_both = client.post(url_for('create_post'), data={})
    assert response_missing_both.status_code == 200
    assert b"This field is required." in response_missing_both.data


# --- Profile Update Tests ---
def test_profile_edit_get(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        response = client.get(url_for('edit_profile'))
    assert response.status_code == 200
    assert b"Edit Profile" in response.data
    # Use user_data for initial info, as new_user object might be detached
    # or fetch the user fresh if needed.
    initial_profile_info = user_data.get('profile_info', 'Test profile') # Default from factory
    if initial_profile_info: # Check against the data used to create the user
        assert initial_profile_info.encode('utf-8') in response.data

def test_profile_edit_post(app_instance, client, new_user, new_user_data_factory): # new_user fixture ensures user exists
    user_data = new_user_data_factory() # Use for login and username
    login_user_helper(client, user_data['username'], user_data['password'])
    new_info = "This is updated profile information."

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data={'profile_info': new_info}, follow_redirects=True)

    assert response.status_code == 200
    with app_instance.app_context():
        expected_path = url_for('profile', username=user_data['username'], _external=False) # Use username from user_data
    assert response.request.path == expected_path
    assert new_info.encode('utf-8') in response.data
    assert b"Profile updated successfully!" in response.data # Check for flash message

    with app_instance.app_context():
        # Fetch user by a stable identifier (username from user_data)
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert user_to_check.profile_info == new_info


def test_profile_photo_upload_integration(app_instance, client, new_user, new_user_data_factory): # new_user ensures user exists
    user_data = new_user_data_factory() # Use for login and username
    login_user_helper(client, user_data['username'], user_data['password'])

    data = {'profile_info': 'Updated info during photo upload test.'}
    import base64
    png_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60eADAAAAABJRU5ErkJggg==")
    data['profile_photo'] = (BytesIO(png_bytes), 'test_photo.png')

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data=data, content_type='multipart/form-data', follow_redirects=True)
    assert response.status_code == 200
    assert b"Profile and photo updated successfully!" in response.data # Check for flash message

    with app_instance.app_context():
        expected_path = url_for('profile', username=user_data['username'], _external=False) # Use username from user_data
    assert response.request.path == expected_path

    with app_instance.app_context():
        updated_user = User.query.filter_by(username=user_data['username']).first() # Fetch by username
        assert updated_user is not None
        assert updated_user.profile_photo_url is not None
        assert updated_user.profile_photo_url.startswith('uploads/profile_pics/')
        assert updated_user.profile_photo_url.endswith('.png')
        assert updated_user.profile_info == 'Updated info during photo upload test.' # Verify other fields still update
        assert updated_user.profile_photo_url.encode('utf-8') in response.data # Check new photo URL is in the response


# --- Unit Tests for Profile Photo Upload with Mocking ---

@patch('app.Image.open') # Use 'app.Image.open' as per the create_app structure
@patch('app.os.makedirs') # Use 'app.os.makedirs'
@patch('app.secure_filename') # Use 'app.secure_filename'
def test_edit_profile_photo_upload_success(mock_secure_filename, mock_makedirs, mock_image_open, app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    mock_secure_filename.return_value = 'test_image.png'
    mock_img_instance = MagicMock()
    mock_image_open.return_value = mock_img_instance

    import base64
    png_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/2+BqAAAAABJRU5ErkJggg==")
    file_data = (BytesIO(png_bytes), 'test_image.png')
    data = {
        'profile_info': 'Info during mocked photo upload.',
        'profile_photo': file_data
    }

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data=data, content_type='multipart/form-data')

    assert response.status_code == 302
    with app_instance.app_context():
        expected_redirect_url = url_for('profile', username=user_data['username'], _external=False) # Use username from user_data
    assert response.location == expected_redirect_url

    response_redirect = client.get(response.location)
    # The flash message was changed in app.py, this test is for mocked success
    # The actual flash message is "Profile and photo updated successfully!" if photo is processed.
    # Let's check for the more specific one.
    assert b"Profile and photo updated successfully!" in response_redirect.data


    mock_secure_filename.assert_called_once_with('test_image.png')
    mock_image_open.assert_called_once()
    mock_img_instance.thumbnail.assert_called_once_with((200, 200))

    saved_path = mock_img_instance.save.call_args[0][0]
    assert saved_path.startswith(app_instance.config['UPLOAD_FOLDER']) # Check against app_instance config
    assert saved_path.endswith('.png')

    mock_makedirs.assert_called_once_with(app_instance.config['UPLOAD_FOLDER'], exist_ok=True) # Check against app_instance config

    with app_instance.app_context():
        updated_user = User.query.filter_by(username=user_data['username']).first() # Fetch by username
        assert updated_user.profile_photo_url.startswith("uploads/profile_pics/")
        assert updated_user.profile_photo_url.endswith(".png")
        assert updated_user.profile_info == 'Info during mocked photo upload.'

def test_edit_profile_additional_fields(app_instance, client, new_user, new_user_data_factory): # new_user ensures user exists
    user_data = new_user_data_factory() # Use for login and username
    login_user_helper(client, user_data['username'], user_data['password'])

    # Store the user_id while new_user is attached
    # This is fine as user_id is just an integer, not a detached object problem.
    # However, for consistency and robustness, fetching by username from user_data is better.
    with app_instance.app_context():
        live_user = User.query.filter_by(username=user_data['username']).first()
        assert live_user is not None
        user_id = live_user.id # Keep user_id for direct fetching if preferred, but username is more robust for cross-context

    profile_data = {
        'full_name': 'Test User Full Name',
        'location': 'Test Location, Test Country',
        'website_url': 'https://testwebsite.example.com',
        'profile_info': 'Updated profile info along with new fields.' # Can also update existing fields
    }

    # POST the new data
    with app_instance.app_context():
        response_post = client.post(url_for('edit_profile'), data=profile_data, follow_redirects=True)

    assert response_post.status_code == 200 # Should redirect to profile page

    # Verify on profile page
    assert profile_data['full_name'].encode('utf-8') in response_post.data
    assert profile_data['location'].encode('utf-8') in response_post.data
    assert profile_data['website_url'].encode('utf-8') in response_post.data # Check if URL is displayed as text
    assert f'href="{profile_data["website_url"]}"'.encode('utf-8') in response_post.data # Check if it's a link
    assert profile_data['profile_info'].encode('utf-8') in response_post.data

    # Verify in database
    with app_instance.app_context():
        updated_user = db.session.get(User, user_id) # Use the stored user_id
        assert updated_user is not None
        assert updated_user.full_name == profile_data['full_name']
        assert updated_user.location == profile_data['location']
        assert updated_user.website_url == profile_data['website_url']
        assert updated_user.profile_info == profile_data['profile_info']


def test_edit_profile_photo_upload_invalid_file_type(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory() # Use for login and username
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context(): # Fetch original_photo_url in a context
        user_for_setup = User.query.filter_by(username=user_data['username']).first()
        assert user_for_setup is not None
        original_photo_url = user_for_setup.profile_photo_url

    file_data = (BytesIO(b"dummytextbytes"), 'test_document.txt')
    data = {'profile_photo': file_data}

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data=data, content_type='multipart/form-data', follow_redirects=True)

    assert response.status_code == 200
    with app_instance.app_context():
        expected_path = url_for('profile', username=user_data['username'], _external=False) # Use username from user_data
    assert response.request.path == expected_path

    assert b"Invalid file type for photo." in response.data

    with app_instance.app_context():
        user_after_attempt = User.query.filter_by(username=user_data['username']).first() # Fetch by username
        assert user_after_attempt is not None
        assert user_after_attempt.profile_photo_url == original_photo_url


# Removed @pytest.mark.xfail
def test_user_posts_on_profile_page(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    num_posts_to_create = 7
    per_page_in_app = 5 # Should match what's in app.py profile route
    post_titles = [f"Test Post {i+1}" for i in range(num_posts_to_create)]

    # Need timedelta for creating distinct post times
    from datetime import timedelta

    with app_instance.app_context():
        # Fetch the user by username to ensure it's attached to this session for post creation
        user_for_posts = User.query.filter_by(username=user_data['username']).first()
        assert user_for_posts is not None, "User not found for post creation: " + user_data['username']

        for i in range(num_posts_to_create):
            # Create posts with slightly different creation times for reliable ordering
            post_time = datetime.now(timezone.utc) - timedelta(minutes=num_posts_to_create - i)
            db.session.add(Post(title=post_titles[i], content=f"Content for post {i+1}", author=user_for_posts, created_at=post_time))
        db.session.commit()

    # Test Page 1
    with app_instance.app_context():
        response_page1 = client.get(url_for('profile', username=user_data['username'], page=1))
    assert response_page1.status_code == 200
    html_content_page1 = response_page1.data.decode('utf-8')

    # Posts are ordered desc by created_at. Post N is newest, Post 1 is oldest.
    # Page 1 should have: Post 7, Post 6, Post 5, Post 4, Post 3
    expected_titles_page1 = post_titles[num_posts_to_create-per_page_in_app:][::-1]

    for i in range(per_page_in_app):
        # Checking for title within the adw-action-row structure
        assert f'title="{expected_titles_page1[i]}"' in html_content_page1

    # Check for current page '1' being active, and '2' being a link
    assert '<adw-button class="suggested-action" aria-current="page">1</adw-button>' in html_content_page1
    with app_instance.app_context(): # Add context for url_for
        profile_url_page2 = url_for("profile", username=user_data["username"], page=2, _external=False)
        assert f'<adw-button href="{profile_url_page2}">2</adw-button>' in html_content_page1
        assert f'<adw-button href="{profile_url_page2}">Next &raquo;</adw-button>' in html_content_page1
    assert '<adw-button disabled>&laquo; Previous</adw-button>' in html_content_page1
    # Test Page 2
    with app_instance.app_context():
        response_page2 = client.get(url_for('profile', username=user_data['username'], page=2))
    assert response_page2.status_code == 200
    html_content_page2 = response_page2.data.decode('utf-8')

    # Page 2 should have the remaining 2 posts: Post 2, Post 1
    expected_titles_page2 = post_titles[:num_posts_to_create-per_page_in_app][::-1]

    for i in range(len(expected_titles_page2)):
         assert f'title="{expected_titles_page2[i]}"' in html_content_page2

    # Ensure posts from page 1 are not on page 2 (e.g. check Post 7 is not on page 2)
    assert f'title="{expected_titles_page1[0]}"' not in html_content_page2

    # Check for current page '2' being active, and '1' being a link
    assert '<adw-button class="suggested-action" aria-current="page">2</adw-button>' in html_content_page2
    with app_instance.app_context(): # Add context for url_for
        profile_url_page1 = url_for("profile", username=user_data["username"], page=1, _external=False)
        assert f'<adw-button href="{profile_url_page1}">1</adw-button>' in html_content_page2
        assert f'<adw-button href="{profile_url_page1}">&laquo; Previous</adw-button>' in html_content_page2
    assert '<adw-button disabled>Next &raquo;</adw-button>' in html_content_page2


def test_edit_post(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    original_title = "Original Post Title to Edit"
    original_content = "Original content."
    with app_instance.app_context():
        post_to_edit = Post(title=original_title, content=original_content, author=new_user)
        db.session.add(post_to_edit)
        db.session.commit()
        post_id = post_to_edit.id
        original_created_at = post_to_edit.created_at
        original_updated_at = post_to_edit.updated_at

    with app_instance.app_context():
        response_get = client.get(url_for('edit_post', post_id=post_id))
    assert response_get.status_code == 200
    assert original_title.encode('utf-8') in response_get.data
    assert original_content.encode('utf-8') in response_get.data

    edited_title = "Edited Post Title"
    edited_content = "Edited content."
    time.sleep(0.01)

    with app_instance.app_context():
        response_post = client.post(
            url_for('edit_post', post_id=post_id),
            data={'title': edited_title, 'content': edited_content},
            follow_redirects=True
        )
    assert response_post.status_code == 200

    with app_instance.app_context():
        expected_redirect_url = url_for('view_post', post_id=post_id, _external=False)
    assert response_post.request.path == expected_redirect_url

    assert edited_title.encode('utf-8') in response_post.data
    assert edited_content.encode('utf-8') in response_post.data
    assert original_title.encode('utf-8') not in response_post.data

    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        assert updated_post.title == edited_title
        assert updated_post.content == edited_content
        assert updated_post.updated_at > original_updated_at
        assert updated_post.updated_at > original_created_at


# --- Tag Functionality Tests ---
def test_create_post_with_tags(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    post_data_1 = {
        'title': 'Post with Tags 1',
        'content': 'Content for post with tags 1.',
        'tags_string': 'tech, python, webdev'
    }
    with app_instance.app_context():
        response_post_1 = client.post(url_for('create_post'), data=post_data_1, follow_redirects=True)

    assert response_post_1.status_code == 200
    assert b"Post created successfully!" in response_post_1.data

    with app_instance.app_context():
        created_post_1 = Post.query.filter_by(title=post_data_1['title']).first()
        assert created_post_1 is not None
        assert len(created_post_1.tags) == 3
        tag_names_1 = sorted([tag.name for tag in created_post_1.tags])
        assert tag_names_1 == sorted(['tech', 'python', 'webdev'])

        # Check if Tag objects were created
        assert Tag.query.filter_by(name='tech').first() is not None
        assert Tag.query.filter_by(name='python').first() is not None
        assert Tag.query.filter_by(name='webdev').first() is not None
        initial_tag_count = Tag.query.count() # Should be 3

    # Create another post with some overlapping and some new tags
    post_data_2 = {
        'title': 'Post with Tags 2',
        'content': 'Content for post with tags 2.',
        'tags_string': 'python, flask, newtag' # 'python' is existing, 'flask' and 'newtag' are new
    }
    with app_instance.app_context():
        response_post_2 = client.post(url_for('create_post'), data=post_data_2, follow_redirects=True)

    assert response_post_2.status_code == 200
    assert b"Post created successfully!" in response_post_2.data

    with app_instance.app_context():
        created_post_2 = Post.query.filter_by(title=post_data_2['title']).first()
        assert created_post_2 is not None
        assert len(created_post_2.tags) == 3
        tag_names_2 = sorted([tag.name for tag in created_post_2.tags])
        assert tag_names_2 == sorted(['python', 'flask', 'newtag'])

        # Verify existing tag 'python' was reused and new tags 'flask', 'newtag' were created
        assert Tag.query.filter_by(name='python').count() == 1 # Still only one 'python' tag
        assert Tag.query.filter_by(name='flask').first() is not None
        assert Tag.query.filter_by(name='newtag').first() is not None
        assert Tag.query.count() == initial_tag_count + 2 # Total tags should be 3 (initial) + 2 (new) = 5


def test_edit_post_with_tags(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Create an initial post with tags
    initial_tags_string = "alpha, beta, gamma"
    with app_instance.app_context():
        post = Post(title="Post to Edit Tags", content="Initial content.", author=new_user)
        tag_names = [name.strip() for name in initial_tags_string.split(',') if name.strip()]
        for tag_name in tag_names:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.session.add(tag)
            post.tags.append(tag)
        db.session.add(post)
        db.session.commit()
        post_id = post.id

    # Edit the post with new tags
    edited_tags_string = "alpha, delta, epsilon" # 'alpha' remains, 'beta', 'gamma' removed, 'delta', 'epsilon' added
    edit_data = {
        'title': 'Post to Edit Tags', # Title and content can be the same or different
        'content': 'Updated content.',
        'tags_string': edited_tags_string
    }
    with app_instance.app_context():
        response_edit = client.post(url_for('edit_post', post_id=post_id), data=edit_data, follow_redirects=True)

    assert response_edit.status_code == 200
    assert b"Post updated successfully!" in response_edit.data

    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        updated_tag_names = sorted([tag.name for tag in updated_post.tags])
        assert updated_tag_names == sorted(['alpha', 'delta', 'epsilon'])

        # Verify database state for tags
        assert Tag.query.filter_by(name='alpha').first() is not None
        assert Tag.query.filter_by(name='beta').first() is not None # Should still exist in DB, just not associated
        assert Tag.query.filter_by(name='gamma').first() is not None # Same as beta
        assert Tag.query.filter_by(name='delta').first() is not None
        assert Tag.query.filter_by(name='epsilon').first() is not None


# --- Comment Functionality Tests ---
def test_create_comment_on_post(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Create a post first
    with app_instance.app_context():
        post = Post(title="Post for Commenting", content="Content that will be commented on.", author=new_user)
        db.session.add(post)
        db.session.commit()
        post_id = post.id

    comment_text = "This is a test comment!"
    with app_instance.app_context():
        response_comment = client.post(
            url_for('view_post', post_id=post_id),
            data={'text': comment_text},
            follow_redirects=True
        )

    assert response_comment.status_code == 200
    assert b"Comment posted successfully!" in response_comment.data
    assert comment_text.encode('utf-8') in response_comment.data # Comment should be visible on the page

    with app_instance.app_context():
        # Fetch the post again to access its comments relationship
        # post_with_comments = Post.query.get(post_id) # This might be detached from session
        post_with_comments = db.session.get(Post, post_id) # Better way to get from session
        assert post_with_comments is not None

        # Query comments directly to be certain
        comments = Comment.query.filter_by(post_id=post_id).all()
        assert len(comments) == 1
        assert comments[0].text == comment_text
        user_to_check = User.query.filter_by(username=user_data['username']).first() # Fetch user to get ID safely
        assert user_to_check is not None
        assert comments[0].user_id == user_to_check.id
        assert comments[0].post_id == post_id

        # Also check through relationship
        assert len(post_with_comments.comments.all()) == 1
        assert post_with_comments.comments[0].text == comment_text


def test_delete_own_comment(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        post = Post(title="Post for Deleting Own Comment", content="Content.", author=new_user)
        comment_to_delete = Comment(text="My own comment to delete", author=new_user, post=post)
        db.session.add_all([post, comment_to_delete])
        db.session.commit()
        post_id = post.id
        comment_id = comment_to_delete.id

    with app_instance.app_context():
        # The DeleteCommentForm is implicitly created and validated in the route for CSRF
        response_delete = client.post(url_for('delete_comment', comment_id=comment_id), follow_redirects=True)

    assert response_delete.status_code == 200
    assert b"Comment deleted." in response_delete.data
    assert b"My own comment to delete" not in response_delete.data # Comment text should be gone

    with app_instance.app_context():
        assert Comment.query.get(comment_id) is None
        # Ensure post still exists
        assert Post.query.get(post_id) is not None


# --- Change Password Tests ---
class TestChangePassword:
    def test_change_password_page_get_unauthenticated(self, app_instance, client):
        with app_instance.app_context():
            response = client.get(url_for('change_password_page'))
        assert response.status_code == 302 # Should redirect to login
        from urllib.parse import urlparse
        with app_instance.app_context():
            assert urlparse(response.location).path == url_for('login', _external=False)

    def test_change_password_page_post_unauthenticated(self, app_instance, client):
        with app_instance.app_context():
            response = client.post(url_for('change_password_page'), data={
                'current_password': 'any',
                'new_password': 'new_secure_password',
                'confirm_new_password': 'new_secure_password'
            })
        assert response.status_code == 302 # Should redirect to login
        from urllib.parse import urlparse
        with app_instance.app_context():
            assert urlparse(response.location).path == url_for('login', _external=False)

    def test_change_password_page_get_authenticated(self, app_instance, client, new_user, new_user_data_factory):
        user_data = new_user_data_factory()
        login_user_helper(client, user_data['username'], user_data['password'])
        with app_instance.app_context():
            response = client.get(url_for('change_password_page'))
        assert response.status_code == 200
        assert b"Change Password" in response.data
        assert b"Current Password" in response.data
        assert b"New Password" in response.data
        assert b"Confirm New Password" in response.data

    def test_change_password_success(self, app_instance, client, new_user, new_user_data_factory):
        user_data = new_user_data_factory()
        login_user_helper(client, user_data['username'], user_data['password'])

        new_password = "new_password_!@#"
        with app_instance.app_context():
            response = client.post(url_for('change_password_page'), data={
                'current_password': user_data['password'],
                'new_password': new_password,
                'confirm_new_password': new_password
            }, follow_redirects=True)

        assert response.status_code == 200
        with app_instance.app_context():
            assert response.request.path == url_for('settings_page', _external=False) # Check final URL after redirect
        assert b"Your password has been updated successfully!" in response.data

        # Verify new password works
        logout_user_helper(client)
        response_login_new_pw = login_user_helper(client, user_data['username'], new_password)
        assert response_login_new_pw.status_code == 200
        assert b"Logout" in response_login_new_pw.data # Successful login indicator

        # Verify old password no longer works
        logout_user_helper(client)
        response_login_old_pw = login_user_helper(client, user_data['username'], user_data['password'])
        assert response_login_old_pw.status_code == 200
        assert b"Invalid username or password." in response_login_old_pw.data

    def test_change_password_wrong_current(self, app_instance, client, new_user, new_user_data_factory):
        user_data = new_user_data_factory()
        login_user_helper(client, user_data['username'], user_data['password'])

        with app_instance.app_context():
            response = client.post(url_for('change_password_page'), data={
                'current_password': 'wrong_current_password',
                'new_password': 'new_password123',
                'confirm_new_password': 'new_password123'
            })

        assert response.status_code == 200 # Re-renders the form
        assert b"Invalid current password." in response.data
        assert b"Change Password" in response.data # Still on the change password page

        # Verify password has not changed
        logout_user_helper(client)
        response_login_original_pw = login_user_helper(client, user_data['username'], user_data['password'])
        assert b"Logout" in response_login_original_pw.data # Original password still works

    def test_change_password_mismatched_new(self, app_instance, client, new_user, new_user_data_factory):
        user_data = new_user_data_factory()
        login_user_helper(client, user_data['username'], user_data['password'])

        with app_instance.app_context():
            response = client.post(url_for('change_password_page'), data={
                'current_password': user_data['password'],
                'new_password': 'new_password123',
                'confirm_new_password': 'mismatched_password321'
            })

        assert response.status_code == 200 # Re-renders the form
        assert b"New passwords must match." in response.data # WTForms error
        assert b"Change Password" in response.data

    def test_change_password_new_password_too_short(self, app_instance, client, new_user, new_user_data_factory):
        user_data = new_user_data_factory()
        login_user_helper(client, user_data['username'], user_data['password'])

        short_password = "short"
        with app_instance.app_context():
            response = client.post(url_for('change_password_page'), data={
                'current_password': user_data['password'],
                'new_password': short_password,
                'confirm_new_password': short_password
            })

        assert response.status_code == 200 # Re-renders the form
        assert b"Field must be at least 8 characters long." in response.data # WTForms error for Length(min=8)
        assert b"Change Password" in response.data

# --- Search Functionality Tests ---
class TestSearchFunctionality:
    def _create_posts_for_search(self, app_instance, new_user, titles_contents):
        """Helper to create multiple posts with specific titles and contents."""
        posts_created = []
        with app_instance.app_context():
            for i, (title, content) in enumerate(titles_contents):
                # Create posts with slightly different creation times for reliable ordering if needed
                post_time = datetime.now(timezone.utc) - timedelta(minutes=len(titles_contents) - i)
                post = Post(title=title, content=content, author=new_user, created_at=post_time)
                db.session.add(post)
                posts_created.append(post)
            db.session.commit()
        return posts_created

    def test_search_results_found_in_title(self, app_instance, client, new_user):
        self._create_posts_for_search(app_instance, new_user, [
            ("Unique Searchable Title", "Some content here."),
            ("Another Post", "Different content."),
            ("Title with Searchable word", "More words.")
        ])

        with app_instance.app_context():
            response = client.get(url_for('search_results', q='Searchable'))
        assert response.status_code == 200
        assert b"Search Results for 'Searchable'" in response.data
        assert b"Unique Searchable Title" in response.data
        assert b"Title with Searchable word" in response.data
        assert b"Another Post" not in response.data # This one should not match

    def test_search_results_found_in_content(self, app_instance, client, new_user):
        self._create_posts_for_search(app_instance, new_user, [
            ("First Title", "Content with a specific keyword to find."),
            ("Second Title", "Other random text."),
            ("Third Title", "Another instance of the keyword here.")
        ])

        with app_instance.app_context():
            response = client.get(url_for('search_results', q='keyword'))
        assert response.status_code == 200
        assert b"Search Results for 'keyword'" in response.data
        assert b"Content with a specific keyword to find." in response.data # Full content might not be shown, check title
        assert b"First Title" in response.data
        assert b"Third Title" in response.data
        assert b"Second Title" not in response.data

    def test_search_results_case_insensitive(self, app_instance, client, new_user):
        self._create_posts_for_search(app_instance, new_user, [
            ("Post about Apples", "Oranges and APPLES are fruits.")
        ])

        with app_instance.app_context():
            response = client.get(url_for('search_results', q='apples')) # Search lowercase
        assert response.status_code == 200
        assert b"Search Results for 'apples'" in response.data
        assert b"Post about Apples" in response.data # Title matches
        assert b"Oranges and APPLES are fruits." in response.data # Content matches (via title)

    def test_search_results_not_found(self, app_instance, client, new_user):
        self._create_posts_for_search(app_instance, new_user, [
            ("Regular Post", "Some regular content.")
        ])

        with app_instance.app_context():
            response = client.get(url_for('search_results', q='NonExistentTermXYZ'))
        assert response.status_code == 200
        assert b"No Results Found" in response.data
        assert b"Sorry, no posts matched your search for 'NonExistentTermXYZ'" in response.data
        assert b"Regular Post" not in response.data # No posts should be listed

    def test_search_results_empty_query_param(self, app_instance, client):
        # Test with q=''
        with app_instance.app_context():
            response = client.get(url_for('search_results', q=''))
        assert response.status_code == 200
        # Expecting the "Please enter a search term" or similar state
        assert b"Search Posts" in response.data # General page title
        assert b"Please enter a term in the search bar above to find posts." in response.data
        assert b"Search Results for ''" not in response.data # Should not say "results for empty query"
        assert b"No Results Found" not in response.data # Should not show "no results for query"

    def test_search_results_no_query_param(self, app_instance, client):
        # Test with no q parameter at all
        with app_instance.app_context():
            response = client.get(url_for('search_results'))
        assert response.status_code == 200
        assert b"Search Posts" in response.data
        assert b"Please enter a term in the search bar above to find posts." in response.data
        assert b"No Results Found" not in response.data

    def test_search_pagination(self, app_instance, client, new_user):
        search_term = "pageable"
        # Create more posts than per_page (e.g., 7 if per_page is 5)
        num_posts_to_create = 7
        per_page_in_app = 5 # Should match app.py search_results route

        titles_contents = []
        for i in range(num_posts_to_create):
            titles_contents.append(
                (f"Post {i+1} with {search_term}", f"Content for post {i+1} also mentioning {search_term}.")
            )
        # Add one post that doesn't match
        titles_contents.append(("Non-matching post", "Content without the term."))

        self._create_posts_for_search(app_instance, new_user, titles_contents)

        # Test Page 1
        with app_instance.app_context():
            response_page1 = client.get(url_for('search_results', q=search_term, page=1))
        assert response_page1.status_code == 200
        # Posts are ordered by created_at desc. Newest first.
        # Post 7 ... Post 3 should be on page 1
        for i in range(num_posts_to_create, num_posts_to_create - per_page_in_app, -1):
             assert f"Post {i} with {search_term}".encode() in response_page1.data
        # Post 2 should not be on page 1
        assert f"Post {num_posts_to_create - per_page_in_app} with {search_term}".encode() not in response_page1.data
        assert b"Non-matching post" not in response_page1.data
        assert b"Next" in response_page1.data # Pagination control

        # Test Page 2
        with app_instance.app_context():
            response_page2 = client.get(url_for('search_results', q=search_term, page=2))
        assert response_page2.status_code == 200
        # Posts Post 2, Post 1 should be on page 2
        for i in range(num_posts_to_create - per_page_in_app, 0, -1):
            assert f"Post {i} with {search_term}".encode() in response_page2.data
        # Post 3 should not be on page 2
        assert f"Post {per_page_in_app + 1} with {search_term}".encode() not in response_page2.data
        assert b"Previous" in response_page2.data # Pagination control

# --- Static Page Tests ---
def test_about_page(app_instance, client): # Added app_instance
    with app_instance.app_context(): # Added app_context
        response = client.get(url_for('about_page'))
    assert response.status_code == 200
    assert b'<adw-preferences-group' in response.data
    assert b'title="About This Blog Demo"' in response.data

def test_contact_page(app_instance, client): # Added app_instance
    with app_instance.app_context(): # Added app_context
        response = client.get(url_for('contact_page'))
    assert response.status_code == 200
    assert b"Contact Us" in response.data # Assuming "Contact Us" is a key phrase

# --- Post Deletion Tests ---
def test_delete_post_success(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    with app_instance.app_context():
        post_to_delete = Post(title="Post to be Deleted", content="Content of deletable post.", author=new_user)
        db.session.add(post_to_delete)
        db.session.commit()
        post_id = post_to_delete.id

    with app_instance.app_context():
        response = client.post(url_for('delete_post', post_id=post_id), follow_redirects=True)

    assert response.status_code == 200 # Should redirect to index
    with app_instance.app_context():
        assert response.request.path == url_for('index', _external=False)
    # Flash message for deletion is not explicitly defined in app.py's delete_post, so we don't check it.
    # Instead, we verify the post is gone from the index page and DB.
    assert b"Post to be Deleted" not in response.data

    with app_instance.app_context():
        assert Post.query.get(post_id) is None

def test_delete_post_unauthorized(app_instance, client, new_user, new_user_data_factory):
    # User1 creates a post
    user1_data = new_user_data_factory(username_suffix="_user1")
    with app_instance.app_context():
        user1 = User(username=user1_data['username'])
        user1.set_password(user1_data['password'])
        db.session.add(user1)
        post_by_user1 = Post(title="User1's Post", content="Content by User1.", author=user1)
        db.session.add(post_by_user1)
        db.session.commit()
        post_id = post_by_user1.id

    # User2 (new_user) logs in and tries to delete User1's post
    user2_data = new_user_data_factory() # Default new_user
    login_user_helper(client, user2_data['username'], user2_data['password'])

    with app_instance.app_context():
        response = client.post(url_for('delete_post', post_id=post_id))

    assert response.status_code == 403 # Forbidden

    with app_instance.app_context():
        assert Post.query.get(post_id) is not None # Post should still exist

def test_delete_post_unauthenticated(app_instance, client, new_user): # new_user creates the post
    with app_instance.app_context():
        post_to_delete = Post(title="Unauth Delete Test Post", content="Content", author=new_user)
        db.session.add(post_to_delete)
        db.session.commit()
        post_id = post_to_delete.id

    # No login
    with app_instance.app_context():
        response = client.post(url_for('delete_post', post_id=post_id))
    assert response.status_code == 302 # Redirect to login

    with app_instance.app_context():
        assert Post.query.get(post_id) is not None # Post should still exist


# --- Comment Deletion Tests (Extended) ---
def test_delete_comment_by_post_author(app_instance, client, new_user_data_factory):
    # User1 (post author)
    post_author_data = new_user_data_factory(username_suffix="_post_author")
    # User2 (comment author)
    comment_author_data = new_user_data_factory(username_suffix="_comment_author")

    with app_instance.app_context():
        post_author = User(username=post_author_data['username'])
        post_author.set_password(post_author_data['password'])
        comment_author = User(username=comment_author_data['username'])
        comment_author.set_password(comment_author_data['password'])
        db.session.add_all([post_author, comment_author])
        db.session.commit() # Commit users first to get IDs

        post = Post(title="Post for Comment Deletion by Author", content="Content.", author=post_author)
        comment_by_other = Comment(text="Comment by another user", author=comment_author, post=post)
        db.session.add_all([post, comment_by_other])
        db.session.commit()
        comment_id = comment_by_other.id
        post_id_for_redirect = post.id

    # Post author logs in
    login_user_helper(client, post_author_data['username'], post_author_data['password'])

    with app_instance.app_context():
        response_delete = client.post(url_for('delete_comment', comment_id=comment_id), follow_redirects=True)

    assert response_delete.status_code == 200
    assert b"Comment deleted." in response_delete.data
    assert b"Comment by another user" not in response_delete.data

    with app_instance.app_context():
        assert Comment.query.get(comment_id) is None
        # Check redirect went to the correct post page
        assert response_delete.request.path == url_for('view_post', post_id=post_id_for_redirect, _external=False)


def test_delete_comment_unauthorized(app_instance, client, new_user_data_factory):
    # User1 (post author)
    post_author_data = new_user_data_factory(username_suffix="_pa")
    # User2 (comment author)
    comment_author_data = new_user_data_factory(username_suffix="_ca")
    # User3 (random user trying to delete)
    deleter_data = new_user_data_factory(username_suffix="_deleter")

    with app_instance.app_context():
        post_author = User(username=post_author_data['username']); post_author.set_password(post_author_data['password'])
        comment_author = User(username=comment_author_data['username']); comment_author.set_password(comment_author_data['password'])
        deleter = User(username=deleter_data['username']); deleter.set_password(deleter_data['password'])
        db.session.add_all([post_author, comment_author, deleter])
        db.session.commit()

        post = Post(title="Unauthorized Comment Deletion Test", content="Content.", author=post_author)
        comment = Comment(text="A comment", author=comment_author, post=post)
        db.session.add_all([post, comment])
        db.session.commit()
        comment_id = comment.id

    # Deleter logs in
    login_user_helper(client, deleter_data['username'], deleter_data['password'])

    with app_instance.app_context():
        response_delete = client.post(url_for('delete_comment', comment_id=comment_id))
    assert response_delete.status_code == 403 # Forbidden

    with app_instance.app_context():
        assert Comment.query.get(comment_id) is not None # Comment should still exist

# --- Category and Tag Page Tests ---
def test_posts_by_category_page(app_instance, client, new_user):
    with app_instance.app_context():
        category1 = Category(name="Tech Reviews")
        db.session.add(category1)
        db.session.commit() # Commit to get category1.slug

        post1 = Post(title="Tech Post 1", content="Content about tech.", author=new_user, categories=[category1])
        post2 = Post(title="Another Post", content="Different topic.", author=new_user) # No category or different category
        db.session.add_all([post1, post2])
        db.session.commit()

        response = client.get(url_for('posts_by_category', category_slug=category1.slug))
    assert response.status_code == 200
    assert b"Posts in Tech Reviews" in response.data # Assuming template shows "Posts in CategoryName"
    assert b"Tech Post 1" in response.data
    assert b"Another Post" not in response.data

def test_posts_by_tag_page(app_instance, client, new_user):
    with app_instance.app_context():
        tag1 = Tag(name="python-programming")
        db.session.add(tag1)
        db.session.commit() # Commit to get tag1.slug

        post1 = Post(title="Python Post 1", content="Content about Python.", author=new_user, tags=[tag1])
        post2 = Post(title="Java Post", content="Content about Java.", author=new_user) # No tag or different tag
        db.session.add_all([post1, post2])
        db.session.commit()

        response = client.get(url_for('posts_by_tag', tag_slug=tag1.slug))
    assert response.status_code == 200
    # The template uses <adw-preferences-group title="Posts tagged '{{ tag.name }}'">
    assert b'<adw-preferences-group' in response.data
    assert f'title="Posts tagged \'{tag1.name}\'"'.encode('utf-8') in response.data
    assert b"Python Post 1" in response.data # Post content should be bytes
    assert b"Java Post" not in response.data   # Post content should be bytes

def test_category_page_not_found(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('posts_by_category', category_slug="non-existent-category"))
    assert response.status_code == 404

def test_tag_page_not_found(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('posts_by_tag', tag_slug="non-existent-tag"))
    assert response.status_code == 404

# --- Error Page Tests ---
def test_404_not_found(client): # app_instance not strictly needed as it's a direct client call
    response = client.get("/this-page-does-not-exist")
    assert response.status_code == 404
    assert b"Page Not Found" in response.data # Check for a key phrase from 404.html

# To test 403, we can try accessing a route that explicitly aborts(403)
# Example: deleting someone else's post (already covered in test_delete_post_unauthorized)

# To test 500, we need to mock a route to raise an unhandled exception.
# Patch target needs to be where it's looked up (app.py in this case if Post is used as app.Post)
# or the direct module if Post.query is called from 'from app import Post'.
# Given the import style, 'app.Post.query' should be correct IF Post is used like app.Post in routes.
# However, routes likely use 'Post' directly due to 'from app import ... Post'.
# So, the target for patch should be 'app.Post.query' if Post is from app.py,
# or more precisely where `Post` is defined and used.
# The error "Working outside of application context" for patch suggests it needs app context.
def test_500_server_error(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    original_propagate_setting = app_instance.config.get('PROPAGATE_EXCEPTIONS')
    app_instance.config['PROPAGATE_EXCEPTIONS'] = False # Allow Flask's 500 handler to run

    try:
        with app_instance.app_context():
            with patch('app.Post.query') as mock_post_query:
                mock_post_query.order_by.side_effect = Exception("Simulated database error")

                with patch.object(app_instance.logger, 'error') as mock_logger_error:
                    response = client.get(url_for('index'))
                    # Check that the error was logged by Flask's handler
                    # This assertion might be tricky if the log format is complex or other errors are logged.
                    # A more robust check might be to see if any log message contains "Simulated database error"
                    # For now, just check if error logger was called.
                    mock_logger_error.assert_called()

        assert response.status_code == 500
        assert b"Internal Server Error" in response.data # Check for key phrase from 500.html
    finally:
        # Restore original setting
        if original_propagate_setting is not None:
            app_instance.config['PROPAGATE_EXCEPTIONS'] = original_propagate_setting
        else:
            # If it wasn't set, it defaults to True if DEBUG is True, False otherwise.
            # For testing, it's often True. We can remove it to revert to default behavior.
            app_instance.config.pop('PROPAGATE_EXCEPTIONS', None)


# --- Bleach Sanitization (Implicit Check) ---
# This test ensures that if a user tries to inject harmful HTML, it's sanitized.
# The app.py uses bleach.clean on post content and profile info.
def test_html_sanitization_in_post_content(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    raw_content = "This is <strong>strong</strong> text with a <script>alert('Hacked!');</script> tag."
    expected_sanitized_content = "This is <strong>strong</strong> text with a &lt;script&gt;alert('Hacked!');&lt;/script&gt; tag."
    # Note: Bleach by default escapes unknown tags, it doesn't remove them unless strip=True.
    # The app.py uses strip=True, so the script tag should be removed entirely.
    expected_sanitized_content_stripped = "This is <strong>strong</strong> text with a  tag." # If script tag content is also stripped
    # Let's check the app.py ALLOWED_TAGS and strip settings
    # ALLOWED_TAGS does not include 'script'. strip=True means it's removed.
    # ALLOWED_ATTRIBUTES = {'*': ['class', 'style', 'id', 'title'], 'a': ['href', 'target', 'rel']}
    # So, the script tag and its content should be gone.

    post_data = {
        'title': 'HTML Sanitization Test Post',
        'content': raw_content
    }
    with app_instance.app_context():
        client.post(url_for('create_post'), data=post_data, follow_redirects=True)
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        # The exact output depends on bleach configuration.
        # We expect the <script> tag to be gone.
        assert "<script>" not in created_post.content
        assert "<strong>" in created_post.content # Allowed tag

        # Let's check the actual sanitized content based on app's bleach config
        import bleach
        from app import ALLOWED_TAGS, ALLOWED_ATTRIBUTES # Import from app.py
        app_expected_sanitized = bleach.clean(raw_content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
        assert created_post.content == app_expected_sanitized

    # Verify on the view page
    with app_instance.app_context():
        response_view = client.get(url_for('view_post', post_id=created_post.id))
    assert response_view.status_code == 200
    # The browser will render &lt; as <, so we check for the escaped version if it wasn't stripped
    # Since it's stripped, we check that the script tag is NOT present.
    assert b"<script>alert('Hacked!');</script>" not in response_view.data
    assert b"&lt;script&gt;alert('Hacked!');&lt;/script&gt;" not in response_view.data
    assert b"<strong>strong</strong>" in response_view.data # Allowed HTML should be present


def test_html_sanitization_in_profile_bio(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    raw_bio = "My bio: <img src=x onerror=alert('bio_hacked') /> <a href=\"javascript:alert('link_hacked')\">Click</a>"
    # Expected after bleach based on app.py's ALLOWED_TAGS/ATTRIBUTES and strip=True
    # img is not allowed. a is allowed but with specific attributes. javascript: hrefs are usually stripped.
    # ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del', 'ins', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    # ALLOWED_ATTRIBUTES = {'*': ['class', 'style', 'id', 'title'], 'a': ['href', 'target', 'rel']}
    # bleach will remove the img tag and its attributes.
    # bleach will remove the href from 'a' if it's 'javascript:...'.

    profile_data = {'profile_info': raw_bio}
    with app_instance.app_context():
        client.post(url_for('edit_profile'), data=profile_data, follow_redirects=True)
        updated_user = User.query.filter_by(username=user_data['username']).first()
        assert updated_user is not None

        import bleach
        from app import ALLOWED_TAGS, ALLOWED_ATTRIBUTES
        app_expected_sanitized_bio = bleach.clean(raw_bio, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)

        assert updated_user.profile_info == app_expected_sanitized_bio
        assert "<img" not in updated_user.profile_info
        assert "onerror" not in updated_user.profile_info
        assert "javascript:alert" not in updated_user.profile_info # Check if the dangerous href is gone

    # Verify on the profile view page
    with app_instance.app_context():
        response_view = client.get(url_for('profile', username=user_data['username']))
    assert response_view.status_code == 200
    # Check that the sanitized (and likely less harmful) version is displayed
    # For example, the 'Click' text from the link might remain, but not the JS href.
    assert b"My bio:" in response_view.data

    # Check specifically within the rendered bio section if possible, to avoid global JS handler interference
    # For now, we rely on the DB check being correct and assume the template renders db_user.profile_info directly or via a safe filter.
    # The raw_bio should not be present in its harmful form.
    assert b"<img src=x onerror=alert('bio_hacked') />" not in response_view.data
    assert b"javascript:alert('link_hacked')" not in response_view.data # Check the dangerous JS href

    # Check if the benign parts are there, based on how bleach processes it
    if "Click" in app_expected_sanitized_bio and "<a>" in app_expected_sanitized_bio:
        assert b"<a>Click</a>" in response_view.data # If 'a' tag is kept (even if href is stripped)
    elif "Click" in app_expected_sanitized_bio:
         assert b"Click" in response_view.data # If 'a' tag is stripped but content remains
    # else: the word "Click" itself might have been stripped if the 'a' tag was removed entirely by bleach.

# Ensure all fixtures are used or remove if not necessary for a test.
# Ensure app_instance is used when app context is needed (e.g., for url_for, db operations).
