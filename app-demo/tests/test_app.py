import pytest
import os
from flask import request, url_for, session
from io import BytesIO
import time
from unittest.mock import patch, MagicMock
from app import create_app, db, User, Post, Tag, Comment, Category
from datetime import datetime, timezone, timedelta


@pytest.fixture(scope='function')
def app_instance():
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': os.environ.get('TEST_DATABASE_URL', 'sqlite:///:memory:'),
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'WTF_CSRF_ENABLED': False,
        'LOGIN_DISABLED': False,
        'SECRET_KEY': 'test-secret-key',
        'LOGIN_MANAGER_LOGIN_VIEW': 'login',
        'SERVER_NAME': 'localhost.test',
        'APPLICATION_ROOT': '/',
        'PREFERRED_URL_SCHEME': 'http',
    }
    _app = create_app(config_overrides=test_config)

    with _app.app_context():
        db.create_all()
    yield _app
    with _app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

@pytest.fixture(scope='function')
def new_user_data_factory():
    def _factory(username_suffix="", profile_info_extra=""):
        return {
            'username': f'testuser{username_suffix}',
            'password': f'password123{username_suffix}',
            'profile_info': f'Test profile{profile_info_extra}'
        }
    return _factory

@pytest.fixture
def new_user(app_instance, new_user_data_factory):
    user_data = new_user_data_factory()
    with app_instance.app_context():
        user = User.query.filter_by(username=user_data['username']).first()
        if not user:
            user = User(username=user_data['username'], profile_info=user_data['profile_info'])
            user.set_password(user_data['password'])
            db.session.add(user)
            db.session.commit()
        return user

@pytest.fixture
def create_specific_user(app_instance, new_user_data_factory):
    def _creator(username_suffix):
        user_data = new_user_data_factory(username_suffix=username_suffix)
        with app_instance.app_context():
            user = User.query.filter_by(username=user_data['username']).first()
            if not user:
                user = User(username=user_data['username'])
                user.set_password(user_data['password'])
                db.session.add(user)
                db.session.commit()
            # Return essential data (ID, username, password)
            # The user object itself might become detached.
            return user.id, user.username, user_data['password']
    return _creator

def login_user_helper(client, username, password):
    return client.post('/login', data=dict(
        username=username,
        password=password
    ), follow_redirects=True)

def logout_user_helper(client):
    return client.get('/logout', follow_redirects=True)

# --- Basic Tests ---
def test_index_page_shows_only_published_posts(app_instance, client, new_user):
    with app_instance.app_context():
        published_post = Post(title="Published Post Visible", content="Content", author=new_user, is_published=True, published_at=datetime.now(timezone.utc))
        draft_post = Post(title="Draft Post Hidden", content="Draft Content", author=new_user, is_published=False)
        db.session.add_all([published_post, draft_post])
        db.session.commit()

    response = client.get('/')
    assert response.status_code == 200
    assert b"All Blog Posts" in response.data
    assert b"Published Post Visible" in response.data
    assert b"Draft Post Hidden" not in response.data

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
        expected_login_path = url_for('login', _external=False)
        expected_settings_path_for_next_param = url_for('settings_page', _external=False)
    parsed_location = urlparse(response.location)
    assert parsed_location.path == expected_login_path
    query_params = parse_qs(parsed_location.query)
    assert 'next' in query_params
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

def test_save_accent_color_preference_authenticated(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
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
    assert response.status_code == 302

def test_save_accent_color_preference_unauthenticated(app_instance, client):
    with app_instance.app_context():
        response = client.post(url_for('save_accent_color_preference'), json={'accent_color': 'blue'})
    assert response.status_code == 302

def test_save_theme_preference_invalid_data(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    with app_instance.app_context():
        response = client.post(url_for('save_theme_preference'), json={'other_key': 'dark'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Missing theme data' in json_data['message']
    with app_instance.app_context():
        response = client.post(url_for('save_theme_preference'), json={'theme': 'invalid_theme_value'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Invalid theme value' in json_data['message']

def test_save_accent_color_preference_invalid_data(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    with app_instance.app_context():
        response = client.post(url_for('save_accent_color_preference'), json={'other_key': 'blue'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Missing accent_color data' in json_data['message']

# --- Blog Post Creation Tests ---
def test_create_post_publish_success(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    with app_instance.app_context():
        temp_user = User.query.filter_by(username=user_data['username']).first()
        assert temp_user is not None, "User for post creation not found."
        user_id = temp_user.id
    login_user_helper(client, user_data['username'], user_data['password'])
    post_data = {
        'title': 'My Successfully Published Post',
        'content': 'This is the content of my successfully published test post.',
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_post = client.post(url_for('create_post'), data=post_data)
    assert response_post.status_code == 302
    with app_instance.app_context():
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        expected_redirect_url = url_for('view_post', post_id=created_post.id, _external=False)
    assert response_post.location == expected_redirect_url
    response_redirect = client.get(response_post.location)
    assert response_redirect.status_code == 200
    assert b"Post published successfully!" in response_redirect.data
    assert post_data['title'].encode('utf-8') in response_redirect.data
    with app_instance.app_context():
        user_for_check = db.session.get(User, user_id)
        assert user_for_check is not None
        assert user_for_check.username.encode('utf-8') in response_redirect.data
    with app_instance.app_context():
        author_user = db.session.get(User, user_id)
        assert author_user is not None
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        assert created_post.content == post_data['content']
        assert created_post.author.id == author_user.id
        assert created_post.user_id == author_user.id
        assert created_post.is_published is True
        assert created_post.published_at is not None
        now_utc = datetime.now(timezone.utc)
        db_published_at = created_post.published_at
        if db_published_at and db_published_at.tzinfo is None: # Check if naive
            # Make now_utc naive assuming db_published_at was stored as UTC
            assert (now_utc.replace(tzinfo=None) - db_published_at) < timedelta(seconds=5)
        elif db_published_at: # It's aware
            assert (now_utc - db_published_at) < timedelta(seconds=5)
        else:
            pytest.fail("published_at is None for a published post")

def test_create_post_draft_success(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    with app_instance.app_context():
        temp_user = User.query.filter_by(username=user_data['username']).first()
        assert temp_user is not None
        user_id = temp_user.id
    login_user_helper(client, user_data['username'], user_data['password'])
    post_data = {
        'title': 'My Test Draft Post',
        'content': 'This is the content of my test draft.',
        'save_draft': 'Save Draft'
    }
    with app_instance.app_context():
        response_post = client.post(url_for('create_post'), data=post_data)
    assert response_post.status_code == 302
    with app_instance.app_context():
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        expected_redirect_url = url_for('view_post', post_id=created_post.id, _external=False)
    assert response_post.location == expected_redirect_url
    response_redirect = client.get(response_post.location)
    assert response_redirect.status_code == 200
    assert b"Post saved as draft successfully!" in response_redirect.data
    assert post_data['title'].encode('utf-8') in response_redirect.data
    assert b"(Draft)" in response_redirect.data
    with app_instance.app_context():
        author_user = db.session.get(User, user_id)
        assert author_user is not None
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        assert created_post.content == post_data['content']
        assert created_post.author.id == author_user.id
        assert created_post.is_published is False
        assert created_post.published_at is None

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
        expected_login_url = url_for('login', _external=False)
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
    assert b"Edit Your Profile" in response.data
    initial_profile_info = user_data.get('profile_info', 'Test profile')
    if initial_profile_info:
        assert initial_profile_info.encode('utf-8') in response.data

def test_profile_edit_post(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    new_info = "This is updated profile information."
    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data={'profile_info': new_info}, follow_redirects=True)
    assert response.status_code == 200
    with app_instance.app_context():
        expected_path = url_for('profile', username=user_data['username'], _external=False)
    assert response.request.path == expected_path
    assert new_info.encode('utf-8') in response.data
    assert b"Profile updated successfully!" in response.data
    with app_instance.app_context():
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert user_to_check.profile_info == new_info

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
    assert b"Profile and photo updated successfully!" in response.data
    with app_instance.app_context():
        expected_path = url_for('profile', username=user_data['username'], _external=False)
    assert response.request.path == expected_path
    with app_instance.app_context():
        updated_user = User.query.filter_by(username=user_data['username']).first()
        assert updated_user is not None
        assert updated_user.profile_photo_url is not None
        assert updated_user.profile_photo_url.startswith('uploads/profile_pics/')
        assert updated_user.profile_photo_url.endswith('.png')
        assert updated_user.profile_info == 'Updated info during photo upload test.'
        assert updated_user.profile_photo_url.encode('utf-8') in response.data

# --- Unit Tests for Profile Photo Upload with Mocking ---
@patch('app.Image.open')
@patch('app.os.makedirs')
@patch('app.secure_filename')
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
        expected_redirect_url = url_for('profile', username=user_data['username'], _external=False)
    assert response.location == expected_redirect_url
    response_redirect = client.get(response.location)
    assert b"Profile and photo updated successfully!" in response_redirect.data
    mock_secure_filename.assert_called_once_with('test_image.png')
    mock_image_open.assert_called_once()
    mock_img_instance.thumbnail.assert_called_once_with((200, 200))
    saved_path = mock_img_instance.save.call_args[0][0]
    assert saved_path.startswith(app_instance.config['UPLOAD_FOLDER'])
    assert saved_path.endswith('.png')
    mock_makedirs.assert_called_once_with(app_instance.config['UPLOAD_FOLDER'], exist_ok=True)
    with app_instance.app_context():
        updated_user = User.query.filter_by(username=user_data['username']).first()
        assert updated_user.profile_photo_url.startswith("uploads/profile_pics/")
        assert updated_user.profile_photo_url.endswith(".png")
        assert updated_user.profile_info == 'Info during mocked photo upload.'

def test_edit_profile_additional_fields(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    with app_instance.app_context():
        live_user = User.query.filter_by(username=user_data['username']).first()
        assert live_user is not None
        user_id = live_user.id
    profile_data = {
        'full_name': 'Test User Full Name',
        'location': 'Test Location, Test Country',
        'website_url': 'https://testwebsite.example.com',
        'profile_info': 'Updated profile info along with new fields.'
    }
    with app_instance.app_context():
        response_post = client.post(url_for('edit_profile'), data=profile_data, follow_redirects=True)
    assert response_post.status_code == 200
    assert profile_data['full_name'].encode('utf-8') in response_post.data
    assert profile_data['location'].encode('utf-8') in response_post.data
    assert profile_data['website_url'].encode('utf-8') in response_post.data
    assert f'href="{profile_data["website_url"]}"'.encode('utf-8') in response_post.data
    assert profile_data['profile_info'].encode('utf-8') in response_post.data
    with app_instance.app_context():
        updated_user = db.session.get(User, user_id)
        assert updated_user is not None
        assert updated_user.full_name == profile_data['full_name']
        assert updated_user.location == profile_data['location']
        assert updated_user.website_url == profile_data['website_url']
        assert updated_user.profile_info == profile_data['profile_info']

def test_edit_profile_photo_upload_invalid_file_type(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    with app_instance.app_context():
        user_for_setup = User.query.filter_by(username=user_data['username']).first()
        assert user_for_setup is not None
        original_photo_url = user_for_setup.profile_photo_url
    file_data = (BytesIO(b"dummytextbytes"), 'test_document.txt')
    data = {'profile_photo': file_data}
    with app_instance.app_context():
        response = client.post(url_for('edit_profile'), data=data, content_type='multipart/form-data', follow_redirects=True)
    assert response.status_code == 200
    with app_instance.app_context():
        expected_path = url_for('profile', username=user_data['username'], _external=False)
    assert response.request.path == expected_path
    assert b"Invalid file type for photo." in response.data
    with app_instance.app_context():
        user_after_attempt = User.query.filter_by(username=user_data['username']).first()
        assert user_after_attempt is not None
        assert user_after_attempt.profile_photo_url == original_photo_url

def test_user_posts_on_profile_page(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    num_posts_to_create = 7
    per_page_in_app = 5
    post_titles = [f"Test Post {i+1}" for i in range(num_posts_to_create)]
    with app_instance.app_context():
        user_for_posts = User.query.filter_by(username=user_data['username']).first()
        assert user_for_posts is not None, "User not found for post creation: " + user_data['username']
        for i in range(num_posts_to_create):
            post_time = datetime.now(timezone.utc) - timedelta(minutes=num_posts_to_create - i)
            is_published = (i % 2 == 0)
            published_at_time = post_time if is_published else None
            db.session.add(Post(title=post_titles[i], content=f"Content for post {i+1}",
                                author=user_for_posts, created_at=post_time,
                                updated_at=post_time,
                                is_published=is_published, published_at=published_at_time))
        db.session.commit()
    with app_instance.app_context():
        response_page1 = client.get(url_for('profile', username=user_data['username'], page=1))
    assert response_page1.status_code == 200
    html_content_page1 = response_page1.data.decode('utf-8')
    with app_instance.app_context():
        user_for_posts = User.query.filter_by(username=user_data['username']).first()
        all_user_posts = Post.query.with_parent(user_for_posts).order_by(Post.updated_at.desc()).all()
    expected_posts_page1 = all_user_posts[:per_page_in_app]
    for post_obj in expected_posts_page1:
        expected_title_in_html = f'title="{post_obj.title}{" (Draft)" if not post_obj.is_published else ""}'
        assert expected_title_in_html in html_content_page1
    assert '<adw-button suggested aria-current="page">1</adw-button>' in html_content_page1
    with app_instance.app_context():
        profile_url_page2 = url_for("profile", username=user_data["username"], page=2, _external=False)
        assert f'<adw-button href="{profile_url_page2}">2</adw-button>' in html_content_page1
        assert f'<adw-button href="{profile_url_page2}">Next &raquo;</adw-button>' in html_content_page1
    assert '<adw-button disabled>&laquo; Previous</adw-button>' in html_content_page1
    with app_instance.app_context():
        response_page2 = client.get(url_for('profile', username=user_data['username'], page=2))
    assert response_page2.status_code == 200
    html_content_page2 = response_page2.data.decode('utf-8')
    expected_posts_page2 = all_user_posts[per_page_in_app : per_page_in_app * 2]
    for post_obj in expected_posts_page2:
        expected_title_in_html = f'title="{post_obj.title}{" (Draft)" if not post_obj.is_published else ""}'
        assert expected_title_in_html in html_content_page2
    if expected_posts_page1: # Check that a post from page 1 is not on page 2
         assert f'title="{expected_posts_page1[0].title}{" (Draft)" if not expected_posts_page1[0].is_published else ""}' not in html_content_page2
    assert '<adw-button suggested aria-current="page">2</adw-button>' in html_content_page2
    with app_instance.app_context():
        profile_url_page1 = url_for("profile", username=user_data["username"], page=1, _external=False)
        assert f'<adw-button href="{profile_url_page1}">1</adw-button>' in html_content_page2
        assert f'<adw-button href="{profile_url_page1}">&laquo; Previous</adw-button>' in html_content_page2
    if len(all_user_posts) > per_page_in_app * 2 :
        assert b'Next &raquo;' in response_page2.data # Check for Next button if more pages
    else:
        assert '<adw-button disabled>Next &raquo;</adw-button>' in html_content_page2

def test_other_user_views_profile_page(app_instance, client, create_specific_user):
    profile_owner_id, profile_owner_username, _ = create_specific_user("_owner")

    with app_instance.app_context():
        profile_owner_for_posts = db.session.get(User, profile_owner_id)
        assert profile_owner_for_posts is not None, f"Failed to fetch profile_owner with ID {profile_owner_id}"
        # Ensure the author object is part of the current session context before adding posts
        db.session.add(profile_owner_for_posts)

        post1 = Post(title="Owner Published Post", content="p1", author=profile_owner_for_posts, is_published=True, published_at=datetime.now(timezone.utc) - timedelta(days=1))
        post2 = Post(title="Owner Draft Post", content="d1", author=profile_owner_for_posts, is_published=False)
        post3 = Post(title="Owner Another Published", content="p2", author=profile_owner_for_posts, is_published=True, published_at=datetime.now(timezone.utc))
        db.session.add_all([post1, post2, post3]) # Add posts explicitly
        db.session.commit()
        # db.session.expunge_all() # Removed
        # db.session.close() # Removed

    _, viewer_username, viewer_password = create_specific_user("_viewer")
    login_user_helper(client, viewer_username, viewer_password)

    profile_url = None
    with app_instance.app_context():
        profile_url = url_for('profile', username=profile_owner_username) # Use username from fixture return

    response = client.get(profile_url) # GET request

    assert response.status_code == 200
    # For debugging, let's print response.data if the assertion fails
    if b"Owner Published Post" not in response.data:
        print(f"DEBUG: Response data for {profile_url} (Viewer: {viewer_username}, Owner: {profile_owner_username}): {response.data.decode('utf-8', 'ignore')}") # Corrected viewer.username to viewer_username
    assert b"Owner Published Post" in response.data
    assert b"Owner Another Published" in response.data
    assert b"Owner Draft Post" not in response.data

def test_edit_published_post_save_changes(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    original_title = "Original Published Post Title"
    original_content = "Original published content."
    with app_instance.app_context():
        published_time = datetime.now(timezone.utc) - timedelta(hours=1)
        post_to_edit = Post(title=original_title, content=original_content, author=new_user, is_published=True, published_at=published_time)
        db.session.add(post_to_edit)
        db.session.commit()
        post_id = post_to_edit.id
        original_updated_at = post_to_edit.updated_at
        original_published_at = post_to_edit.published_at
    with app_instance.app_context():
        response_get = client.get(url_for('edit_post', post_id=post_id))
    assert response_get.status_code == 200
    assert original_title.encode('utf-8') in response_get.data
    assert original_content.encode('utf-8') in response_get.data
    edited_title = "Edited Published Post Title"
    edited_content = "Edited published content."
    time.sleep(0.01)
    form_data_payload = {
        'title': edited_title,
        'content': edited_content,
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_post = client.post(
            url_for('edit_post', post_id=post_id),
            data=form_data_payload,
            follow_redirects=True
        )
    assert response_post.status_code == 200
    with app_instance.app_context():
        expected_redirect_url = url_for('view_post', post_id=post_id, _external=False)
    assert response_post.request.path == expected_redirect_url
    assert edited_title.encode('utf-8') in response_post.data
    assert edited_content.encode('utf-8') in response_post.data
    assert b"Post updated and published successfully!" in response_post.data
    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        assert updated_post.title == edited_title
        assert updated_post.content == edited_content
        assert updated_post.updated_at > original_updated_at
        assert updated_post.is_published is True
        assert updated_post.published_at == original_published_at

def test_edit_draft_post_save_changes(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    original_title = "Original Draft Title"
    original_content = "Original draft content."
    with app_instance.app_context():
        post_to_edit = Post(title=original_title, content=original_content, author=new_user, is_published=False, published_at=None)
        db.session.add(post_to_edit)
        db.session.commit()
        post_id = post_to_edit.id
        original_updated_at = post_to_edit.updated_at
    edited_title = "Edited Draft Title"
    edited_content = "Edited draft content."
    time.sleep(0.01)
    form_data_payload = {
        'title': edited_title,
        'content': edited_content,
        'save_draft': 'Save Draft'
    }
    with app_instance.app_context():
        response_post = client.post(
            url_for('edit_post', post_id=post_id),
            data=form_data_payload,
            follow_redirects=True
        )
    assert response_post.status_code == 200
    with app_instance.app_context():
        expected_redirect_url = url_for('view_post', post_id=post_id, _external=False)
    assert response_post.request.path == expected_redirect_url
    assert edited_title.encode('utf-8') in response_post.data
    assert b"(Draft)" in response_post.data
    assert b"Post updated and saved as draft successfully!" in response_post.data
    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        assert updated_post.title == edited_title
        assert updated_post.content == edited_content
        assert updated_post.updated_at > original_updated_at
        assert updated_post.is_published is False
        assert updated_post.published_at is None

def test_edit_draft_post_publish(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    original_title = "Draft to Publish Title"
    original_content = "Draft content to be published."
    with app_instance.app_context():
        post_to_edit = Post(title=original_title, content=original_content, author=new_user, is_published=False, published_at=None)
        db.session.add(post_to_edit)
        db.session.commit()
        post_id = post_to_edit.id
        original_updated_at = post_to_edit.updated_at
    edited_title = "Published Title from Draft"
    edited_content = "Published content from draft."
    time.sleep(0.01)
    form_data_payload = {
        'title': edited_title,
        'content': edited_content,
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_post = client.post(
            url_for('edit_post', post_id=post_id),
            data=form_data_payload,
            follow_redirects=True
        )
    assert response_post.status_code == 200
    with app_instance.app_context():
        expected_redirect_url = url_for('view_post', post_id=post_id, _external=False)
    assert response_post.request.path == expected_redirect_url
    assert edited_title.encode('utf-8') in response_post.data
    assert b"(Draft)" not in response_post.data
    assert b"Post updated and published successfully!" in response_post.data
    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        assert updated_post.title == edited_title
        assert updated_post.content == edited_content
        assert updated_post.updated_at > original_updated_at
        assert updated_post.is_published is True
        assert updated_post.published_at is not None
        now_utc = datetime.now(timezone.utc)
        db_published_at = updated_post.published_at
        if db_published_at and db_published_at.tzinfo is None:
            assert (now_utc.replace(tzinfo=None) - db_published_at) < timedelta(seconds=5)
        elif db_published_at:
            assert (now_utc - db_published_at) < timedelta(seconds=5)
        else:
            pytest.fail("published_at is None for a published post after editing to publish")

def test_edit_published_post_revert_to_draft(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    original_title = "Published to Revert to Draft"
    original_content = "Published content to be drafted."
    with app_instance.app_context():
        published_time = datetime.now(timezone.utc) - timedelta(hours=1)
        post_to_edit = Post(title=original_title, content=original_content, author=new_user, is_published=True, published_at=published_time)
        db.session.add(post_to_edit)
        db.session.commit()
        post_id = post_to_edit.id
        original_updated_at = post_to_edit.updated_at
    edited_title = "Reverted to Draft Title"
    edited_content = "Reverted to draft content."
    time.sleep(0.01)
    form_data_payload = {
        'title': edited_title,
        'content': edited_content,
        'save_draft': 'Save Draft'
    }
    with app_instance.app_context():
        response_post = client.post(
            url_for('edit_post', post_id=post_id),
            data=form_data_payload,
            follow_redirects=True
        )
    assert response_post.status_code == 200
    with app_instance.app_context():
        expected_redirect_url = url_for('view_post', post_id=post_id, _external=False)
    assert response_post.request.path == expected_redirect_url
    assert edited_title.encode('utf-8') in response_post.data
    assert b"(Draft)" in response_post.data
    assert b"Post updated and saved as draft successfully!" in response_post.data
    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        assert updated_post.title == edited_title
        assert updated_post.content == edited_content
        assert updated_post.updated_at > original_updated_at
        assert updated_post.is_published is False
        assert updated_post.published_at is None

# --- Draft Visibility Tests for view_post ---
def test_view_draft_post_by_author(app_instance, client, create_specific_user):
    author_id, author_username, author_password = create_specific_user("_draft_author")
    login_user_helper(client, author_username, author_password)

    post_id = None
    with app_instance.app_context():
        author_for_post = db.session.get(User, author_id)
        assert author_for_post is not None
        draft_post = Post(title="Author's Draft View Test", content="Content", author=author_for_post, is_published=False)
        db.session.add(draft_post)
        db.session.commit()
        post_id = draft_post.id

    post_url = None
    with app_instance.app_context():
        post_url = url_for('view_post', post_id=post_id)
    response = client.get(post_url)

    assert response.status_code == 200
    expected_title_bytes = "Author&#39;s Draft View Test".encode('utf-8')
    if expected_title_bytes not in response.data:
        print(f"DEBUG: Response data for {post_url} (Author: {author_username}): {response.data.decode('utf-8', 'ignore')}")
    assert expected_title_bytes in response.data
    assert b"(Draft)" in response.data

def test_view_draft_post_by_other_user(app_instance, client, create_specific_user):
    author_id, author_username, _ = create_specific_user("_author_of_draft")
    post_id = None
    with app_instance.app_context():
        author_for_post = db.session.get(User, author_id)
        assert author_for_post is not None
        draft_post = Post(title="Other's Draft", content="Content", author=author_for_post, is_published=False)
        db.session.add(draft_post)
        db.session.commit()
        post_id = draft_post.id

    _, viewer_username, viewer_password = create_specific_user("_viewer_of_draft") # Use username from fixture
    login_user_helper(client, viewer_username, viewer_password)

    post_url = None
    with app_instance.app_context():
        post_url = url_for('view_post', post_id=post_id)
    response = client.get(post_url)
    assert response.status_code == 404

def test_view_draft_post_by_anonymous_user(app_instance, client, create_specific_user):
    author_id, _, _ = create_specific_user("_author_for_anon_view_test") # Get author_id
    post_id = None
    with app_instance.app_context():
        author_for_post = db.session.get(User, author_id) # Re-fetch author
        assert author_for_post is not None
        draft_post = Post(title="Anonymous View Draft Test", content="Content", author=author_for_post, is_published=False)
        db.session.add(draft_post)
        db.session.commit()
        post_id = draft_post.id
    with app_instance.app_context():
        response = client.get(url_for('view_post', post_id=post_id))
    assert response.status_code == 404

# --- Tag Functionality Tests ---
def test_create_post_with_tags(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    post_data_1 = {
        'title': 'Post with Tags 1',
        'content': 'Content for post with tags 1.',
        'tags_string': 'tech, python, webdev',
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_post_1 = client.post(url_for('create_post'), data=post_data_1, follow_redirects=True)
    assert response_post_1.status_code == 200
    assert b"Post published successfully!" in response_post_1.data
    with app_instance.app_context():
        created_post_1 = Post.query.filter_by(title=post_data_1['title']).first()
        assert created_post_1 is not None
        assert len(created_post_1.tags) == 3
        tag_names_1 = sorted([tag.name for tag in created_post_1.tags])
        assert tag_names_1 == sorted(['tech', 'python', 'webdev'])
        assert Tag.query.filter_by(name='tech').first() is not None
        assert Tag.query.filter_by(name='python').first() is not None
        assert Tag.query.filter_by(name='webdev').first() is not None
        initial_tag_count = Tag.query.count()
    post_data_2 = {
        'title': 'Post with Tags 2',
        'content': 'Content for post with tags 2.',
        'tags_string': 'python, flask, newtag',
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_post_2 = client.post(url_for('create_post'), data=post_data_2, follow_redirects=True)
    assert response_post_2.status_code == 200
    assert b"Post published successfully!" in response_post_2.data
    with app_instance.app_context():
        created_post_2 = Post.query.filter_by(title=post_data_2['title']).first()
        assert created_post_2 is not None
        assert len(created_post_2.tags) == 3
        tag_names_2 = sorted([tag.name for tag in created_post_2.tags])
        assert tag_names_2 == sorted(['python', 'flask', 'newtag'])
        assert Tag.query.filter_by(name='python').count() == 1
        assert Tag.query.filter_by(name='flask').first() is not None
        assert Tag.query.filter_by(name='newtag').first() is not None
        assert Tag.query.count() == initial_tag_count + 2

def test_edit_post_with_tags(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    initial_tags_string = "alpha, beta, gamma"
    with app_instance.app_context():
        post = Post(title="Post to Edit Tags", content="Initial content.", author=new_user, is_published=True, published_at=datetime.now(timezone.utc))
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
    edited_tags_string = "alpha, delta, epsilon"
    edit_data = {
        'title': 'Post to Edit Tags',
        'content': 'Updated content.',
        'tags_string': edited_tags_string,
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_edit = client.post(url_for('edit_post', post_id=post_id), data=edit_data, follow_redirects=True)
    assert response_edit.status_code == 200
    assert b"Post updated and published successfully!" in response_edit.data
    with app_instance.app_context():
        updated_post = db.session.get(Post, post_id)
        assert updated_post is not None
        updated_tag_names = sorted([tag.name for tag in updated_post.tags])
        assert updated_tag_names == sorted(['alpha', 'delta', 'epsilon'])
        assert Tag.query.filter_by(name='alpha').first() is not None
        assert Tag.query.filter_by(name='beta').first() is not None
        assert Tag.query.filter_by(name='gamma').first() is not None
        assert Tag.query.filter_by(name='delta').first() is not None
        assert Tag.query.filter_by(name='epsilon').first() is not None

# --- Comment Functionality Tests ---
def test_create_comment_on_post(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    with app_instance.app_context():
        post = Post(title="Post for Commenting", content="Content that will be commented on.", author=new_user, is_published=True, published_at=datetime.now(timezone.utc))
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
    assert comment_text.encode('utf-8') in response_comment.data
    with app_instance.app_context():
        post_with_comments = db.session.get(Post, post_id)
        assert post_with_comments is not None
        comments = Comment.query.filter_by(post_id=post_id).all()
        assert len(comments) == 1
        assert comments[0].text == comment_text
        user_to_check = User.query.filter_by(username=user_data['username']).first()
        assert user_to_check is not None
        assert comments[0].user_id == user_to_check.id
        assert comments[0].post_id == post_id
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
        response_delete = client.post(url_for('delete_comment', comment_id=comment_id), follow_redirects=True)
    assert response_delete.status_code == 200
    assert b"Comment deleted." in response_delete.data
    assert b"My own comment to delete" not in response_delete.data
    with app_instance.app_context():
        assert Comment.query.get(comment_id) is None
        assert Post.query.get(post_id) is not None

# --- Change Password Tests ---
class TestChangePassword:
    def test_change_password_page_get_unauthenticated(self, app_instance, client):
        with app_instance.app_context():
            response = client.get(url_for('change_password_page'))
        assert response.status_code == 302
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
        assert response.status_code == 302
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
            assert response.request.path == url_for('settings_page', _external=False)
        assert b"Your password has been updated successfully!" in response.data
        logout_user_helper(client)
        response_login_new_pw = login_user_helper(client, user_data['username'], new_password)
        assert response_login_new_pw.status_code == 200
        assert b"Logout" in response_login_new_pw.data
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
        assert response.status_code == 200
        assert b"Invalid current password." in response.data
        assert b"Change Password" in response.data
        logout_user_helper(client)
        response_login_original_pw = login_user_helper(client, user_data['username'], user_data['password'])
        assert b"Logout" in response_login_original_pw.data
    def test_change_password_mismatched_new(self, app_instance, client, new_user, new_user_data_factory):
        user_data = new_user_data_factory()
        login_user_helper(client, user_data['username'], user_data['password'])
        with app_instance.app_context():
            response = client.post(url_for('change_password_page'), data={
                'current_password': user_data['password'],
                'new_password': 'new_password123',
                'confirm_new_password': 'mismatched_password321'
            })
        assert response.status_code == 200
        assert b"New passwords must match." in response.data
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
        assert response.status_code == 200
        assert b"Field must be at least 8 characters long." in response.data
        assert b"Change Password" in response.data

# --- Search Functionality Tests ---
class TestSearchFunctionality:
    def _create_posts_for_search(self, app_instance, new_user, titles_contents):
        posts_created = []
        with app_instance.app_context():
            for i, (title, content) in enumerate(titles_contents):
                post_time = datetime.now(timezone.utc) - timedelta(minutes=len(titles_contents) - i)
                post = Post(title=title, content=content, author=new_user, created_at=post_time, is_published=True, published_at=post_time)
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
        assert b"Another Post" not in response.data
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
        assert b"First Title" in response.data
        assert b"Third Title" in response.data
        assert b"Second Title" not in response.data
    def test_search_results_case_insensitive(self, app_instance, client, new_user):
        self._create_posts_for_search(app_instance, new_user, [
            ("Post about Apples", "Oranges and APPLES are fruits.")
        ])
        with app_instance.app_context():
            response = client.get(url_for('search_results', q='apples'))
        assert response.status_code == 200
        assert b"Search Results for 'apples'" in response.data
        assert b"Post about Apples" in response.data
        assert b"Oranges and APPLES are fruits." in response.data
    def test_search_results_not_found(self, app_instance, client, new_user):
        self._create_posts_for_search(app_instance, new_user, [
            ("Regular Post", "Some regular content.")
        ])
        with app_instance.app_context():
            response = client.get(url_for('search_results', q='NonExistentTermXYZ'))
        assert response.status_code == 200
        assert b"No Results Found" in response.data
        assert b"Sorry, no posts matched your search for 'NonExistentTermXYZ'" in response.data
        assert b"Regular Post" not in response.data
    def test_search_results_empty_query_param(self, app_instance, client):
        with app_instance.app_context():
            response = client.get(url_for('search_results', q=''))
        assert response.status_code == 200
        assert b"Search Posts" in response.data
        assert b"Please enter a term in the search bar above to find posts." in response.data
        assert b"Search Results for ''" not in response.data
        assert b"No Results Found" not in response.data
    def test_search_results_no_query_param(self, app_instance, client):
        with app_instance.app_context():
            response = client.get(url_for('search_results'))
        assert response.status_code == 200
        assert b"Search Posts" in response.data
        assert b"Please enter a term in the search bar above to find posts." in response.data
        assert b"No Results Found" not in response.data
    def test_search_pagination(self, app_instance, client, new_user):
        search_term = "pageable"
        num_posts_to_create = 7
        per_page_in_app = 5
        titles_contents = []
        for i in range(num_posts_to_create):
            titles_contents.append(
                (f"Post {i+1} with {search_term}", f"Content for post {i+1} also mentioning {search_term}.")
            )
        titles_contents.append(("Non-matching post", "Content without the term."))
        self._create_posts_for_search(app_instance, new_user, titles_contents)
        with app_instance.app_context():
            response_page1 = client.get(url_for('search_results', q=search_term, page=1))
        assert response_page1.status_code == 200
        for i in range(num_posts_to_create, num_posts_to_create - per_page_in_app, -1):
             assert f"Post {i} with {search_term}".encode() in response_page1.data
        assert f"Post {num_posts_to_create - per_page_in_app} with {search_term}".encode() not in response_page1.data
        assert b"Non-matching post" not in response_page1.data
        assert b"Next" in response_page1.data
        with app_instance.app_context():
            response_page2 = client.get(url_for('search_results', q=search_term, page=2))
        assert response_page2.status_code == 200
        for i in range(num_posts_to_create - per_page_in_app, 0, -1):
            assert f"Post {i} with {search_term}".encode() in response_page2.data
        assert f"Post {per_page_in_app + 1} with {search_term}".encode() not in response_page2.data
        assert b"Previous" in response_page2.data
    def test_search_does_not_find_drafts(self, app_instance, client, new_user):
        search_term = "searchabledraft"
        with app_instance.app_context():
            db.session.add(new_user) # Ensure user is in session
            post1 = Post(title=f"Published {search_term} Post", content="Content", author=new_user, is_published=True, published_at=datetime.now(timezone.utc))
            post2 = Post(title=f"Draft {search_term} Post", content="Content", author=new_user, is_published=False)
            db.session.add_all([post1, post2])
            db.session.commit()
            # Attempt to ensure data is visible to subsequent requests
            # db.session.expunge_all() # Removed
            # db.session.close() # Removed
        search_url = None
        with app_instance.app_context():
            search_url = url_for('search_results', q=search_term)
        response = client.get(search_url)
        assert response.status_code == 200
        if f"Published {search_term} Post".encode() not in response.data:
            print(f"DEBUG: Response data for {search_url}: {response.data.decode('utf-8', 'ignore')}")
        assert f"Published {search_term} Post".encode() in response.data
        assert f"Draft {search_term} Post".encode() not in response.data

# --- Static Page Tests ---
def test_about_page(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('about_page'))
    assert response.status_code == 200
    assert b'<adw-preferences-group' in response.data
    assert b'About This Application' in response.data

def test_contact_page(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('contact_page'))
    assert response.status_code == 200
    assert b"Contact Us" in response.data

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
    assert response.status_code == 200
    with app_instance.app_context():
        assert response.request.path == url_for('index', _external=False)
    assert b"Post to be Deleted" not in response.data
    with app_instance.app_context():
        assert Post.query.get(post_id) is None

def test_delete_post_unauthorized(app_instance, client, new_user, new_user_data_factory):
    user1_data = new_user_data_factory(username_suffix="_user1")
    with app_instance.app_context():
        user1 = User(username=user1_data['username'])
        user1.set_password(user1_data['password'])
        db.session.add(user1)
        post_by_user1 = Post(title="User1's Post", content="Content by User1.", author=user1)
        db.session.add(post_by_user1)
        db.session.commit()
        post_id = post_by_user1.id
    user2_data = new_user_data_factory()
    login_user_helper(client, user2_data['username'], user2_data['password'])
    with app_instance.app_context():
        response = client.post(url_for('delete_post', post_id=post_id))
    assert response.status_code == 403
    with app_instance.app_context():
        assert Post.query.get(post_id) is not None

def test_delete_post_unauthenticated(app_instance, client, new_user):
    with app_instance.app_context():
        post_to_delete = Post(title="Unauth Delete Test Post", content="Content", author=new_user)
        db.session.add(post_to_delete)
        db.session.commit()
        post_id = post_to_delete.id
    with app_instance.app_context():
        response = client.post(url_for('delete_post', post_id=post_id))
    assert response.status_code == 302
    with app_instance.app_context():
        assert Post.query.get(post_id) is not None

# --- Comment Deletion Tests (Extended) ---
def test_delete_comment_by_post_author(app_instance, client, new_user_data_factory):
    post_author_data = new_user_data_factory(username_suffix="_post_author")
    comment_author_data = new_user_data_factory(username_suffix="_comment_author")
    with app_instance.app_context():
        post_author = User(username=post_author_data['username'])
        post_author.set_password(post_author_data['password'])
        comment_author = User(username=comment_author_data['username'])
        comment_author.set_password(comment_author_data['password'])
        db.session.add_all([post_author, comment_author])
        db.session.commit()
        post = Post(title="Post for Comment Deletion by Author", content="Content.", author=post_author)
        comment_by_other = Comment(text="Comment by another user", author=comment_author, post=post)
        db.session.add_all([post, comment_by_other])
        db.session.commit()
        comment_id = comment_by_other.id
        post_id_for_redirect = post.id
    login_user_helper(client, post_author_data['username'], post_author_data['password'])
    with app_instance.app_context():
        response_delete = client.post(url_for('delete_comment', comment_id=comment_id), follow_redirects=True)
    assert response_delete.status_code == 200
    assert b"Comment deleted." in response_delete.data
    assert b"Comment by another user" not in response_delete.data
    with app_instance.app_context():
        assert Comment.query.get(comment_id) is None
        assert response_delete.request.path == url_for('view_post', post_id=post_id_for_redirect, _external=False)

def test_delete_comment_unauthorized(app_instance, client, new_user_data_factory):
    post_author_data = new_user_data_factory(username_suffix="_pa")
    comment_author_data = new_user_data_factory(username_suffix="_ca")
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
    login_user_helper(client, deleter_data['username'], deleter_data['password'])
    with app_instance.app_context():
        response_delete = client.post(url_for('delete_comment', comment_id=comment_id))
    assert response_delete.status_code == 403
    with app_instance.app_context():
        assert Comment.query.get(comment_id) is not None

# --- Category and Tag Page Tests ---
def test_posts_by_category_page(app_instance, client, new_user):
    with app_instance.app_context():
        db.session.add(new_user) # Ensure user is in session
        category1 = Category(name="Tech Reviews")
        db.session.add(category1)
        # It's better to commit category and user before creating posts that reference them.
        db.session.commit()

        post1 = Post(title="Published Tech Post 1", content="Content about tech.", author=new_user, categories=[category1], is_published=True, published_at=datetime.now(timezone.utc))
        post2 = Post(title="Draft Tech Post 2", content="Draft content about tech.", author=new_user, categories=[category1], is_published=False)
        post3 = Post(title="Another Published Post", content="Different topic.", author=new_user, is_published=True, published_at=datetime.now(timezone.utc))
        db.session.add_all([post1, post2, post3])
        db.session.commit()

        category_slug_val = category1.slug # Access slug while category1 is session-bound
        # Ensure session is closed after setup
        # db.session.expunge_all() # Removed
        # db.session.close() # Removed
        category_url = None
        # category_url needs to be defined within an app_context if using url_for,
        # but the client.get can be outside if the URL is already formed.
        # For simplicity and consistency, keeping url_for and client.get together.
        category_url = url_for('posts_by_category', category_slug=category_slug_val)
        response = client.get(category_url)

    assert response.status_code == 200
    assert b"Posts in Category: Tech Reviews" in response.data
    if b"Published Tech Post 1" not in response.data:
        print(f"DEBUG: Response data for {category_url}: {response.data.decode('utf-8', 'ignore')}")
    assert b"Published Tech Post 1" in response.data
    assert b"Draft Tech Post 2" not in response.data
    assert b"Another Published Post" not in response.data

def test_posts_by_tag_page(app_instance, client, new_user):
    with app_instance.app_context():
        db.session.add(new_user) # Ensure user is in session
        tag1 = Tag(name="python-programming")
        db.session.add(tag1)
        # It's better to commit tag and user before creating posts that reference them.
        db.session.commit()

        post1 = Post(title="Published Python Post 1", content="Content about Python.", author=new_user, tags=[tag1], is_published=True, published_at=datetime.now(timezone.utc))
        post2 = Post(title="Draft Python Post 2", content="Draft about Python.", author=new_user, tags=[tag1], is_published=False)
        post3 = Post(title="Java Post", content="Content about Java.", author=new_user, is_published=True, published_at=datetime.now(timezone.utc))
        db.session.add_all([post1, post2, post3])
        db.session.commit()

        tag_slug_val = tag1.slug # Access slug while tag1 is session-bound
        tag_name_val = tag1.name # Access name while tag1 is session-bound
        # Ensure session is closed after setup
        # db.session.expunge_all() # Removed
        # db.session.close() # Removed
        tag_url = None
        with app_instance.app_context(): # Context for url_for
            tag_url = url_for('posts_by_tag', tag_slug=tag_slug_val)
        response = client.get(tag_url) # client.get() outside explicit context
    assert response.status_code == 200
    assert f"Posts tagged with <mark>{tag_name_val}</mark>".encode('utf-8') in response.data # Check full title with mark
    if b"Published Python Post 1" not in response.data:
        print(f"DEBUG: Response data for {tag_url}: {response.data.decode('utf-8', 'ignore')}")
    assert b"Published Python Post 1" in response.data
    assert b"Draft Python Post 2" not in response.data
    assert b"Java Post" not in response.data

def test_category_page_not_found(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('posts_by_category', category_slug="non-existent-category"))
    assert response.status_code == 404

def test_tag_page_not_found(app_instance, client):
    with app_instance.app_context():
        response = client.get(url_for('posts_by_tag', tag_slug="non-existent-tag"))
    assert response.status_code == 404

# --- Error Page Tests ---
def test_404_not_found(client):
    response = client.get("/this-page-does-not-exist")
    assert response.status_code == 404
    assert b"Page Not Found" in response.data

def test_500_server_error(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    original_propagate_setting = app_instance.config.get('PROPAGATE_EXCEPTIONS')
    app_instance.config['PROPAGATE_EXCEPTIONS'] = False
    try:
        with app_instance.app_context():
            with patch('app.Post.query') as mock_post_query:
                mock_post_query.order_by.side_effect = Exception("Simulated database error")
                with patch.object(app_instance.logger, 'error') as mock_logger_error:
                    response = client.get(url_for('index'))
                    mock_logger_error.assert_called()
        assert response.status_code == 500
        assert b"Internal Server Error" in response.data
    finally:
        if original_propagate_setting is not None:
            app_instance.config['PROPAGATE_EXCEPTIONS'] = original_propagate_setting
        else:
            app_instance.config.pop('PROPAGATE_EXCEPTIONS', None)

# --- Bleach Sanitization (Implicit Check) ---
def test_html_sanitization_in_post_content(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    raw_content = "This is <strong>strong</strong> text with a <script>alert('Hacked!');</script> tag."
    post_data = {
        'title': 'HTML Sanitization Test Post',
        'content': raw_content,
        'publish': 'Publish'
    }
    with app_instance.app_context():
        response_create = client.post(url_for('create_post'), data=post_data, follow_redirects=False)
        assert response_create.status_code == 302
        created_post = Post.query.filter_by(title=post_data['title']).first()
        assert created_post is not None
        assert "<script>" not in created_post.content
        assert "<strong>" in created_post.content
        import bleach
        from app import ALLOWED_TAGS, ALLOWED_ATTRIBUTES
        app_expected_sanitized = bleach.clean(raw_content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
        assert created_post.content == app_expected_sanitized
    with app_instance.app_context():
        response_view = client.get(url_for('view_post', post_id=created_post.id))
    assert response_view.status_code == 200
    assert b"<script>alert('Hacked!');</script>" not in response_view.data
    assert b"&lt;script&gt;alert('Hacked!');&lt;/script&gt;" not in response_view.data
    assert b"<strong>strong</strong>" in response_view.data

def test_html_sanitization_in_profile_bio(app_instance, client, new_user, new_user_data_factory):
    user_data = new_user_data_factory()
    login_user_helper(client, user_data['username'], user_data['password'])
    raw_bio = "My bio: <img src=x onerror=alert('bio_hacked') /> <a href=\"javascript:alert('link_hacked')\">Click</a>"
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
        assert "javascript:alert" not in updated_user.profile_info
    with app_instance.app_context():
        response_view = client.get(url_for('profile', username=user_data['username']))
    assert response_view.status_code == 200
    assert b"My bio:" in response_view.data
    assert b"<img src=x onerror=alert('bio_hacked') />" not in response_view.data
    assert b"javascript:alert('link_hacked')" not in response_view.data
    if "Click" in app_expected_sanitized_bio and "<a>" in app_expected_sanitized_bio:
        assert b"<a>Click</a>" in response_view.data
    elif "Click" in app_expected_sanitized_bio:
         assert b"Click" in response_view.data
