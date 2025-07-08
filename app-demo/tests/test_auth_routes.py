import pytest
from flask import url_for, get_flashed_messages
from unittest.mock import patch
from app-demo.models import User
from app-demo import db

# Fixture to create a user for auth tests if not using the global one from conftest
@pytest.fixture
def auth_test_user(db, create_test_user):
    return create_test_user(username="auth_user", email="auth@example.com", password="password123")

# --- Test Password Reset Request Route ---
def test_reset_password_request_page_loads(client):
    """Test GET /auth/reset_password_request loads the form."""
    response = client.get(url_for('auth.reset_password_request'))
    assert response.status_code == 200
    assert b"Request Password Reset" in response.data
    assert b"Your Email Address" in response.data

def test_reset_password_request_authenticated_user_redirects(client, logged_in_client):
    """Test authenticated user is redirected from reset password request page."""
    response = logged_in_client.get(url_for('auth.reset_password_request'), follow_redirects=True)
    assert response.status_code == 200
    # Should redirect to index or feed, check for content not on reset page
    assert b"Request Password Reset" not in response.data
    assert b"Home" in response.data # Assuming 'Home' is on the index/feed page title or header

@patch('app-demo.routes.auth_routes.send_password_reset_email')
def test_reset_password_request_valid_email(mock_send_email, client, db, auth_test_user):
    """Test POST /auth/reset_password_request with a valid, existing email."""
    response = client.post(url_for('auth.reset_password_request'), data={
        'email': auth_test_user.email
    }, follow_redirects=True)
    assert response.status_code == 200 # Redirects to login
    assert b"An email has been sent with instructions to reset your password." in response.data
    mock_send_email.assert_called_once_with(auth_test_user)

@patch('app-demo.routes.auth_routes.send_password_reset_email')
def test_reset_password_request_nonexistent_email(mock_send_email, client, db):
    """Test POST /auth/reset_password_request with a non-existent email."""
    response = client.post(url_for('auth.reset_password_request'), data={
        'email': 'nonexistent@example.com'
    }, follow_redirects=True)
    assert response.status_code == 200 # Redirects to login
    # Same flash message for security (don't reveal if email exists)
    assert b"An email has been sent with instructions to reset your password." in response.data
    mock_send_email.assert_not_called() # Should not be called if user doesn't exist

def test_reset_password_request_invalid_email_format(client):
    """Test POST /auth/reset_password_request with an invalid email format."""
    response = client.post(url_for('auth.reset_password_request'), data={
        'email': 'not-an-email'
    }, follow_redirects=True)
    assert response.status_code == 200 # Stays on the request page due to form error
    assert b"Invalid email address." in response.data
    assert b"Request Password Reset" in response.data # Still on the same page

def test_reset_password_request_empty_email(client):
    """Test POST /auth/reset_password_request with an empty email."""
    response = client.post(url_for('auth.reset_password_request'), data={
        'email': ''
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please enter your email address." in response.data # DataRequired validator message
    assert b"Request Password Reset" in response.data

# --- Test Reset Password with Token Route ---
def test_reset_password_with_token_page_loads_valid_token(client, db, auth_test_user, app):
    """Test GET /auth/reset_password/<token> with a valid token."""
    with app.app_context(): # For token generation
        token = auth_test_user.get_reset_password_token()

    response = client.get(url_for('auth.reset_password_with_token', token=token))
    assert response.status_code == 200
    assert b"Reset Your Password" in response.data
    assert b"New Password" in response.data

def test_reset_password_with_token_invalid_token(client):
    """Test GET /auth/reset_password/<token> with an invalid/expired token."""
    response = client.get(url_for('auth.reset_password_with_token', token="invalid.token.string"), follow_redirects=True)
    assert response.status_code == 200 # Redirects to request_reset_password
    assert b"That is an invalid or expired token." in response.data
    assert b"Request Password Reset" in response.data # On the request page

def test_reset_password_with_token_authenticated_user_redirects(client, logged_in_client, app, auth_test_user):
    """Test authenticated user is redirected from reset password with token page."""
    with app.app_context():
        token = auth_test_user.get_reset_password_token() # Any valid token
    response = logged_in_client.get(url_for('auth.reset_password_with_token', token=token), follow_redirects=True)
    assert response.status_code == 200
    assert b"Reset Your Password" not in response.data
    assert b"Home" in response.data

def test_reset_password_with_token_valid_submission(client, db, auth_test_user, app):
    """Test POST /auth/reset_password/<token> with valid token and new password."""
    with app.app_context():
        token = auth_test_user.get_reset_password_token()

    original_password_hash = auth_test_user.password_hash
    new_password = "newValidPassword123"

    response = client.post(url_for('auth.reset_password_with_token', token=token), data={
        'password': new_password,
        'confirm_password': new_password
    }, follow_redirects=True)

    assert response.status_code == 200 # Redirects to login
    assert b"Your password has been reset successfully!" in response.data
    assert b"Log In" in response.data # On login page

    db.session.refresh(auth_test_user)
    assert auth_test_user.password_hash != original_password_hash
    assert auth_test_user.check_password(new_password)

def test_reset_password_with_token_mismatched_passwords(client, db, auth_test_user, app):
    """Test POST /auth/reset_password/<token> with mismatched new passwords."""
    with app.app_context():
        token = auth_test_user.get_reset_password_token()

    response = client.post(url_for('auth.reset_password_with_token', token=token), data={
        'password': 'newPassword123',
        'confirm_password': 'differentPassword456'
    }, follow_redirects=True)

    assert response.status_code == 200 # Stays on reset_password_with_token page
    assert b"Passwords must match." in response.data
    assert b"Reset Your Password" in response.data # Still on the same page

def test_reset_password_with_token_post_invalid_token(client, db):
    """Test POST /auth/reset_password/<token> with an invalid token."""
    response = client.post(url_for('auth.reset_password_with_token', token="invalid.token.here"), data={
        'password': 'anypassword',
        'confirm_password': 'anypassword'
    }, follow_redirects=True)

    assert response.status_code == 200 # Redirects to request_reset_password
    assert b"That is an invalid or expired token." in response.data
    assert b"Request Password Reset" in response.data
