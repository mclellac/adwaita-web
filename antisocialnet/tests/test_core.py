import pytest
from flask import url_for
from antisocialnet.models import User, Post, Like
from antisocialnet import db
import re

def _extract_csrf_token_from_html(html_content):
    match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', html_content)
    assert match, "CSRF token not found in provided HTML content"
    return match.group(1)

def test_login_page_loads(client):
    with client.application.test_request_context():
        response = client.get(url_for('auth.login'))
    assert response.status_code == 200
    assert b"Login" in response.data
    assert b"Username" in response.data
    assert b"Password" in response.data

def test_login_successful(client, app, auth_test_user):
    auth_test_user.is_active = True
    auth_test_user.is_approved = True
    db.session.commit()

    with client.application.test_request_context():
        url = url_for('auth.login')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'username': auth_test_user.username,
        'password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Logged in successfully." in response.data
    assert b"Logout" in response.data

def test_login_incorrect_password(client, app, auth_test_user):
    with client.application.test_request_context():
        url = url_for('auth.login')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'username': auth_test_user.username,
        'password': 'wrongpassword',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200 # Stays on login page with error
    assert b"Invalid username or password." in response.data
    assert b"Login" in response.data

def test_logout_successful(logged_in_client):
    with logged_in_client.application.test_request_context():
        logout_url = url_for('auth.logout')
        dashboard_url = url_for('general.dashboard')

    response = logged_in_client.get(logout_url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Logged out successfully." in response.data
    assert b"Login" in response.data

    dashboard_response = logged_in_client.get(dashboard_url, follow_redirects=True)
    assert dashboard_response.status_code == 200
    assert b"Please log in to access this page." in dashboard_response.data

def test_create_post_page_loads(client, logged_in_client):
    """Test GET /create loads the create post form."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('post.create_post'))
    assert response.status_code == 200
    assert b"Create New Post" in response.data # Assuming this is in the template
    assert b"Content (Markdown)" in response.data

def test_create_post_successful_simple(client, app, logged_in_client, db):
    """Test successful post creation with minimal data (content only)."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first() # User from logged_in_client
    assert user is not None

    initial_post_count = Post.query.count()

    with logged_in_client.application.test_request_context():
        from flask_wtf.csrf import generate_csrf
        token = generate_csrf()
        url = url_for('post.create_post')

    post_content = "This is a simple test post."
    form_data = {
        'content': post_content,
        'tags_string': '',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)

    assert response.status_code == 200
    assert b'Post created successfully!' in response.data

    assert Post.query.count() == initial_post_count + 1
    new_post = Post.query.order_by(Post.id.desc()).first()
    assert new_post is not None
    assert new_post.content == post_content
    assert new_post.author == user
    assert new_post.is_published
    assert new_post.published_at is not None

def test_like_post(client, test_user_1, test_post_by_user_2, db):
    # Login as test_user_1
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': _extract_csrf_token_from_html(client.get(url_for('auth.login')).data.decode())}, follow_redirects=True)

    # Like the post
    like_url = url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id)
    with client.application.test_request_context():
        from flask_wtf.csrf import generate_csrf
        token = generate_csrf()
    response = client.post(like_url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200

    # Verify Like record
    like = Like.query.filter_by(user_id=test_user_1.id, target_type='post', target_id=test_post_by_user_2.id).first()
    assert like is not None
    assert test_post_by_user_2.like_count == 1

def test_unlike_post(client, test_user_1, test_post_by_user_2, db):
    # First, user_1 likes the post
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': _extract_csrf_token_from_html(client.get(url_for('auth.login')).data.decode())}, follow_redirects=True)

    with client.application.test_request_context():
        from flask_wtf.csrf import generate_csrf
        token = generate_csrf()
    client.post(url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': token}, follow_redirects=True)
    assert test_post_by_user_2.like_count == 1

    # Now, unlike the post
    unlike_url = url_for('like.unlike_item_route', target_type='post', target_id=test_post_by_user_2.id)
    with client.application.test_request_context():
        from flask_wtf.csrf import generate_csrf
        token = generate_csrf()
    response = client.post(unlike_url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200

    # Verify Like record is removed
    like = Like.query.filter_by(user_id=test_user_1.id, target_type='post', target_id=test_post_by_user_2.id).first()
    assert like is None
    assert test_post_by_user_2.like_count == 0

def test_view_profile_exists_public(client, create_test_user):
    """Test viewing an existing public profile."""
    profile_user = create_test_user(email_address="profile@example.com", full_name="Profile Owner Name", profile_info="Public bio.", is_profile_public=True)
    client.post(url_for('auth.login'), data={'username': profile_user.username, 'password': 'password', 'csrf_token': _extract_csrf_token_from_html(client.get(url_for('auth.login')).data.decode())}, follow_redirects=True)
    with client.application.test_request_context():
        response = client.get(url_for('profile.view_profile', user_id=profile_user.id))
    assert response.status_code == 200
    assert b"Profile Owner Name" in response.data
    assert b"fetchProfileData" in response.data

def test_edit_profile_post_successful_update(client, app, logged_in_client, db):
    """Test successful profile update via POST."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()

    with logged_in_client.application.test_request_context():
        from flask_wtf.csrf import generate_csrf
        token = generate_csrf()
        url = url_for('profile.edit_profile')

    new_full_name = "Updated Full Name"
    new_bio = "This is my updated bio."

    form_data = {
        'full_name': new_full_name,
        'profile_info': new_bio,
        'csrf_token': token
    }

    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Profile updated successfully!" in response.data
    # Should redirect to view_profile page
    assert bytes(new_full_name, 'utf-8') in response.data
    assert b"fetchProfileData" in response.data

    db.session.refresh(user)
    assert user.full_name == new_full_name
    assert user.profile_info == new_bio
