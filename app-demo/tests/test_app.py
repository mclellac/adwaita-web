import pytest
import os # Moved import os to the top
from flask import request, url_for, session # Added for request.path and url_for, session for flash messages
from io import BytesIO # Added for file upload simulation
import time # Added for time.sleep in edit_post test
from unittest.mock import patch, MagicMock # Added for mocking
from app import create_app, db, User, Post # Import create_app and extensions
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

    # db.create_all() is called within create_app's app_context.
    # So, no need to call it again here.

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
    if new_user.profile_info:
        assert new_user.profile_info.encode('utf-8') in response.data

def test_profile_edit_post(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    new_info = "This is updated profile information."

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data={'profile_info': new_info}, follow_redirects=True)

    assert response.status_code == 200
    with app_instance.app_context():
        expected_path = url_for('profile', username=new_user.username, _external=False)
    assert response.request.path == expected_path
    assert new_info.encode('utf-8') in response.data

    with app_instance.app_context():
        updated_user = db.session.get(User, new_user.id)
        assert updated_user.profile_info == new_info


def test_profile_photo_upload_integration(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    data = {'profile_info': 'Updated info during photo upload test.'}
    import base64
    png_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60eADAAAAABJRU5ErkJggg==")
    data['profile_photo'] = (BytesIO(png_bytes), 'test_photo.png')

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data=data, content_type='multipart/form-data', follow_redirects=True)
    assert response.status_code == 200

    with app_instance.app_context():
        expected_path = url_for('profile', username=new_user.username, _external=False)
    assert response.request.path == expected_path

    with app_instance.app_context():
        updated_user = db.session.get(User, new_user.id)
        assert updated_user is not None
        assert updated_user.profile_photo_url is not None
        assert updated_user.profile_photo_url.startswith('uploads/profile_pics/')
        assert updated_user.profile_photo_url.endswith('.png')
    assert updated_user.profile_info == 'Updated info during photo upload test.'

    with app_instance.app_context():
        fresh_user_for_check = db.session.get(User, new_user.id)
        assert fresh_user_for_check.profile_photo_url.encode('utf-8') in response.data


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
        expected_redirect_url = url_for('profile', username=new_user.username, _external=False)
    assert response.location == expected_redirect_url

    response_redirect = client.get(response.location)
    assert b"Profile photo updated successfully!" in response_redirect.data

    mock_secure_filename.assert_called_once_with('test_image.png')
    mock_image_open.assert_called_once()
    mock_img_instance.thumbnail.assert_called_once_with((200, 200))

    saved_path = mock_img_instance.save.call_args[0][0]
    assert saved_path.startswith(app_instance.config['UPLOAD_FOLDER']) # Check against app_instance config
    assert saved_path.endswith('.png')

    mock_makedirs.assert_called_once_with(app_instance.config['UPLOAD_FOLDER'], exist_ok=True) # Check against app_instance config

    with app_instance.app_context():
        updated_user = db.session.get(User, new_user.id)
        assert updated_user.profile_photo_url.startswith("uploads/profile_pics/")
        assert updated_user.profile_photo_url.endswith(".png")
        assert updated_user.profile_info == 'Info during mocked photo upload.'

def test_edit_profile_additional_fields(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    # Store the user_id while new_user is attached
    with app_instance.app_context():
        # It's safer to fetch the user by a stable identifier from user_data
        # to get its ID for later checks.
        live_user = User.query.filter_by(username=user_data['username']).first()
        assert live_user is not None
        user_id = live_user.id

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
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])

    original_photo_url = new_user.profile_photo_url

    file_data = (BytesIO(b"dummytextbytes"), 'test_document.txt')
    data = {'profile_photo': file_data}

    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data=data, content_type='multipart/form-data', follow_redirects=True)

    assert response.status_code == 200
    with app_instance.app_context():
        expected_path = url_for('profile', username=new_user.username, _external=False)
    assert response.request.path == expected_path

    assert b"Invalid file type for photo." in response.data

    with app_instance.app_context():
        user_after_attempt = db.session.get(User, new_user.id)
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

    assert b"Page 1 of 2" in response_page1.data
    assert "Next" in html_content_page1 # Check for the word "Next" in button
    # For disabled state, the text "Previous" would still be there but inside a disabled button
    assert "Previous" in html_content_page1

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

    assert b"Page 2 of 2" in response_page2.data
    assert "Previous" in html_content_page2 # "Previous" link should be active
    assert "Next" in html_content_page2 # "Next" button text, but should be disabled or not a link

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
