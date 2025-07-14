import pytest
from flask import url_for, get_flashed_messages
from unittest.mock import patch
from antisocialnet.models import User, SiteSetting
from antisocialnet import db
import re

def _extract_csrf_token_from_html(html_content):
    match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', html_content)
    assert match, "CSRF token not found in provided HTML content"
    return match.group(1)

@pytest.fixture
def auth_test_user(db, create_test_user):
    return create_test_user(email_address="auth@example.com", password="password123", full_name="Auth Test User")

# --- Test Password Reset Request Route ---
def test_reset_password_request_page_loads(client):
    with client.application.test_request_context():
        response = client.get(url_for('auth.reset_password_request'))
    assert response.status_code == 200
    assert b"Request Password Reset" in response.data
    assert b"Your Email Address" in response.data

def test_reset_password_request_authenticated_user_redirects(logged_in_client):
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('auth.reset_password_request'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Request Password Reset" not in response.data
    assert b"Home" in response.data

@patch('antisocialnet.routes.auth_routes.send_password_reset_email')
def test_reset_password_request_valid_email(mock_send_email, client, db, auth_test_user):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())
    form_data = {'email': auth_test_user.username, 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"An email has been sent with instructions to reset your password." in response.data
    mock_send_email.assert_called_once_with(auth_test_user)

@patch('antisocialnet.routes.auth_routes.send_password_reset_email')
def test_reset_password_request_nonexistent_email(mock_send_email, client, db):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())
    form_data = {'email': 'nonexistent@example.com', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"An email has been sent with instructions to reset your password." in response.data
    mock_send_email.assert_not_called()

def test_reset_password_request_invalid_email_format(client):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())
    form_data = {'email': 'not-an-email', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response before redirect
    assert response.status_code == 200 # Stays on page with error
    assert b"Invalid email address." in response.data
    assert b"Request Password Reset" in response.data

def test_reset_password_request_empty_email(client):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())
    form_data = {'email': '', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Please enter your email address." in response.data
    assert b"Request Password Reset" in response.data

def test_reset_password_request_csrf_missing(client, auth_test_user):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
    response_no_redirect = client.post(url, data={'email': auth_test_user.username})
    assert response_no_redirect.status_code == 400

def test_reset_password_request_csrf_invalid(client, auth_test_user):
    form_data = {'email': auth_test_user.username, 'csrf_token': 'invalidtoken'}
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
    response = client.post(url, data=form_data)
    assert response.status_code == 400

# --- Test Reset Password with Token Route ---
def test_reset_password_with_token_page_loads_valid_token(client, db, auth_test_user, app):
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token=token)
    response = client.get(url)
    assert response.status_code == 200
    assert b"Reset Your Password" in response.data
    assert b"New Password" in response.data

def test_reset_password_with_token_invalid_token(client):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token="invalid.token.string")
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"That is an invalid or expired token." in response.data
    assert b"Request Password Reset" in response.data

def test_reset_password_with_token_authenticated_user_redirects(logged_in_client, app, auth_test_user):
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
    with logged_in_client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token=token)
    response = logged_in_client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Reset Your Password" not in response.data
    assert b"Home" in response.data

def test_reset_password_with_token_valid_submission(client, db, auth_test_user, app):
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
    original_password_hash = auth_test_user.password_hash
    new_password = "newValidPassword123"

    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token=token)
        get_response = client.get(url) # GET to fetch the form and its CSRF token
        assert get_response.status_code == 200
        csrf_token_val = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'password': new_password,
        'confirm_password': new_password,
        'csrf_token': csrf_token_val
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Your password has been reset successfully!" in response.data
    assert b"Login" in response.data

    db.session.refresh(auth_test_user)
    assert auth_test_user.password_hash != original_password_hash
    assert auth_test_user.check_password(new_password)

def test_reset_password_with_token_mismatched_passwords(client, db, auth_test_user, app):
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token=token)
        get_response = client.get(url)
        assert get_response.status_code == 200
        csrf_token_val = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'password': 'newPassword123',
        'confirm_password': 'differentPassword456',
        'csrf_token': csrf_token_val
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Passwords must match." in response.data
    assert b"Reset Your Password" in response.data

def test_reset_password_with_token_post_invalid_token(client, app, db):
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token="invalid.token.here")
        # We need a CSRF token, but the GET for invalid token redirects.
        # For this specific case, we can fetch CSRF from a known valid form page e.g. login
        login_page_resp = client.get(url_for('auth.login'))
        csrf_token_val = _extract_csrf_token_from_html(login_page_resp.data.decode())

    form_data = {
        'password': 'anypassword',
        'confirm_password': 'anypassword',
        'csrf_token': csrf_token_val
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"That is an invalid or expired token." in response.data
    assert b"Request Password Reset" in response.data

def test_reset_password_with_token_csrf_missing(client, app, auth_test_user):
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token=token)
    form_data = {'password': 'newpassword', 'confirm_password': 'newpassword'}
    response = client.post(url, data=form_data)
    assert response.status_code == 400

def test_reset_password_with_token_csrf_invalid(client, app, auth_test_user):
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token=token)
    form_data = {
        'password': 'newpassword',
        'confirm_password': 'newpassword',
        'csrf_token': 'invalidtoken'
    }
    response = client.post(url, data=form_data)
    assert response.status_code == 400

# --- Test Registration Route ---
def test_register_page_loads(client, app, db): # Added app and db fixtures
    with app.app_context():
        SiteSetting.set('allow_registrations', True, 'bool')
        # SiteSetting.set commits itself.

    with client.application.test_request_context(): # Context for url_for
        response = client.get(url_for('auth.register'))

    assert response.status_code == 200
    assert b"Create a New Account" in response.data # Check for a prominent title
    assert b"Email (Username)" in response.data
    assert b"Password" in response.data

    # Optional: Clean up the setting if it could interfere with other tests,
    # though typically test isolation should handle this or tests should be robust to it.
    # with app.app_context():
    #     SiteSetting.query.filter_by(key='allow_registrations').delete()
    #     db.session.commit()

def test_register_authenticated_user_redirects(logged_in_client):
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('auth.register'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Create a New Account" not in response.data
    assert b"Home" in response.data

def test_register_successful(client, app, db):
    with app.app_context(): # Ensure registrations are allowed for this test
        SiteSetting.set('allow_registrations', True, 'bool')

    with client.application.test_request_context():
        url = url_for('auth.register')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'full_name': 'New User',
        'email': 'newuser@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Registration successful! Your account is pending admin approval." in response.data

    user = User.query.filter_by(username='newuser@example.com').first()
    assert user is not None
    assert user.full_name == 'New User'
    assert not user.is_approved
    assert not user.is_active

def test_register_email_exists(client, app, db, auth_test_user): # Added db
    with app.app_context(): # Ensure registrations are allowed for this test
        SiteSetting.set('allow_registrations', True, 'bool')

    with client.application.test_request_context():
        url = url_for('auth.register')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'full_name': 'Another User',
        'email': auth_test_user.username,
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"An account with this email address already exists." in response.data
    assert b"Create a New Account" in response.data

def test_register_mismatched_passwords(client, app, db): # Added db
    with app.app_context(): # Ensure registrations are allowed for this test
        SiteSetting.set('allow_registrations', True, 'bool')

    with client.application.test_request_context():
        url = url_for('auth.register')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'full_name': 'Mismatch User',
        'email': 'mismatch@example.com',
        'password': 'password123',
        'confirm_password': 'password456',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Passwords must match." in response.data
    assert b"Create a New Account" in response.data

def test_register_short_password(client, app, db): # Added db
    with app.app_context(): # Ensure registrations are allowed for this test
        SiteSetting.set('allow_registrations', True, 'bool')

    with client.application.test_request_context():
        url = url_for('auth.register')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'full_name': 'ShortPass User',
        'email': 'shortpass@example.com',
        'password': 'short',
        'confirm_password': 'short',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Password must be at least 8 characters long." in response.data
    assert b"Create a New Account" in response.data

def test_register_registrations_disabled(client, app, db):
    with app.app_context():
        SiteSetting.set('allow_registrations', False, 'bool')
        db.session.commit()

    with client.application.test_request_context():
        url = url_for('auth.register')
        # Get response for disabled GET
        get_response_disabled = client.get(url, follow_redirects=True)
        assert get_response_disabled.status_code == 200
        assert b"User registration is currently disabled." in get_response_disabled.data
        # The form might not be rendered, so getting a CSRF token this way is problematic.
        # For a POST attempt, the route should still check allow_registrations first.
        # We can use a dummy token as the check should happen before CSRF validation.
        # However, if Flask-WTF processes CSRF before route logic, this will 400.
        # A better test for POST when disabled might need to ensure CSRF is valid then check behavior.
        # For now, let's assume the initial check in the route handles it.
        # The route logic *does* check SiteSetting at the very top for GET and POST.

        # To test POST to a disabled registration, we'd ideally need a CSRF token.
        # But if the form isn't rendered, we can't get one easily.
        # The route should reject before CSRF if registrations are off.
        # Let's try with a dummy token first.
        dummy_token = "this_is_a_dummy_token_for_testing_disabled_reg"

    form_data = {
        'full_name': 'NoReg User',
        'email': 'noreg@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': dummy_token
    }
    response_post = client.post(url, data=form_data, follow_redirects=True)
    # For the POST request, if registrations are disabled, it should ideally redirect
    # before CSRF validation. However, if CSRF fails first, it might result in a 400.
    # The primary check for GET is that the page indicates disabled registration.
    # The route logic *should* prevent POST submission if GET doesn't render the form.
    # Given the 400 error in previous runs with a dummy token,
    # we'll separate the POST test and disable CSRF for it.

    # Reset for other tests / next part of test
    with app.app_context():
        SiteSetting.set('allow_registrations', True, 'bool')
        db.session.commit()

def test_register_registrations_disabled_post_attempt(client, app, db):
    """Test POST to /register when registrations are disabled, bypassing CSRF for route logic check."""
    with app.app_context():
        SiteSetting.set('allow_registrations', False, 'bool')
        db.session.commit()
        # Temporarily disable CSRF for this specific test's client operations
        original_csrf_status = app.config.get('WTF_CSRF_ENABLED', True)
        app.config['WTF_CSRF_ENABLED'] = False

    with client.application.test_request_context(): # For url_for
        url = url_for('auth.register')

    form_data = {
        'full_name': 'NoReg User POST',
        'email': 'noreg.post@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        # CSRF token not included as WTF_CSRF_ENABLED is False for this app context
    }

    response_post = client.post(url, data=form_data, follow_redirects=True)
    assert response_post.status_code == 200 # After redirect
    assert b"User registration is currently disabled." in response_post.data
    user = User.query.filter_by(username='noreg.post@example.com').first()
    assert user is None

    # Restore CSRF setting and site setting
    with app.app_context():
        app.config['WTF_CSRF_ENABLED'] = original_csrf_status
        SiteSetting.set('allow_registrations', True, 'bool')
        db.session.commit()

def test_register_csrf_missing(client, app):
    form_data = {
        'full_name': 'CSRF User',
        'email': 'csrfmissing@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
    }
    with client.application.test_request_context():
        url = url_for('auth.register')
    response = client.post(url, data=form_data)
    assert response.status_code == 400

def test_register_csrf_invalid(client, app):
    form_data = {
        'full_name': 'CSRF User',
        'email': 'csrfinvalid@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': 'invalidcsrfyoken'
    }
    with client.application.test_request_context():
        url = url_for('auth.register')
    response = client.post(url, data=form_data)
    assert response.status_code == 400

# --- Test Login Route ---
def test_login_page_loads(client):
    with client.application.test_request_context():
        response = client.get(url_for('auth.login'))
    assert response.status_code == 200
    assert b"Login" in response.data
    assert b"Username" in response.data
    assert b"Password" in response.data

def test_login_authenticated_user_redirects(logged_in_client):
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('auth.login'), follow_redirects=True)
    assert response.status_code == 200
    # The login page might still contain "Login" in its title or button even if redirected to index
    # A better check is for content specific to the target page (e.g., feed) and NOT on login page.
    assert b"Home" in response.data # Assuming "Home" is on the target page after login
    # Assert that some key element of the login form itself is NOT present
    assert b"form-page-header\">Login</h1>" not in response.data

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

def test_login_nonexistent_user(client, app):
    with client.application.test_request_context():
        url = url_for('auth.login')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'username': 'nouser@example.com',
        'password': 'anypassword',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Invalid username or password." in response.data
    assert b"Login" in response.data

def test_login_user_not_approved(client, app, create_test_user, db):
    # User should be active but not approved to test this specific message
    unapproved_user = create_test_user(email_address="unapproved@example.com", password="password123", full_name="unapproved", is_approved=False, is_active=True)
    with client.application.test_request_context():
        url = url_for('auth.login')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'username': unapproved_user.username,
        'password': 'password123',
        'csrf_token': token
    }
    response_direct = client.post(url, data=form_data, follow_redirects=False)
    assert response_direct.status_code == 302 # Should redirect to login
    with client.application.test_request_context(): # For url_for in assertion
      assert response_direct.location == url_for('auth.login')

    response_followed = client.post(url, data=form_data, follow_redirects=True)
    assert response_followed.status_code == 200
    assert b"Your account is pending admin approval." in response_followed.data
    assert b"Login" in response_followed.data # Should be back on the login page

def test_login_user_not_active(client, app, create_test_user, db):
    inactive_user = create_test_user(email_address="inactive@example.com", password="password123", full_name="inactive", is_approved=True, is_active=False)
    with client.application.test_request_context():
        url = url_for('auth.login')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'username': inactive_user.username,
        'password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 302 # Should redirect
    with client.application.test_request_context(): # Need context for url_for
        assert response.location == url_for('auth.login') # Check redirect target

    # Now follow the redirect to check the flash message on the resulting page
    response_followed = client.post(url, data=form_data, follow_redirects=True)
    assert response_followed.status_code == 200
    assert b"Your account is not active." in response_followed.data
    assert b"Login" in response_followed.data # Should be back on the login page

def test_login_empty_credentials(client, app):
    with client.application.test_request_context():
        url = url_for('auth.login')
        get_response = client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {'username': '', 'password': '', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"This field is required." in response.data
    assert b"Login" in response.data

def test_login_csrf_missing(client, app, auth_test_user):
    form_data = {'username': auth_test_user.username, 'password': 'password123'}
    with client.application.test_request_context():
        url = url_for('auth.login')
    response = client.post(url, data=form_data)
    assert response.status_code == 400

def test_login_csrf_invalid(client, app, auth_test_user):
    form_data = {
        'username': auth_test_user.username,
        'password': 'password123',
        'csrf_token': 'totallybreakscsrf'
    }
    with client.application.test_request_context():
        url = url_for('auth.login')
    response = client.post(url, data=form_data)
    assert response.status_code == 400

# --- Test Logout Route ---
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

def test_logout_unauthenticated_user(client):
    with client.application.test_request_context():
        url = url_for('auth.logout')
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Logged out successfully." not in response.data

# --- Test Change Password Route ---
def test_change_password_page_loads(logged_in_client):
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
    response = logged_in_client.get(url)
    assert response.status_code == 200
    assert b"Change Password" in response.data
    assert b"Current Password" in response.data

def test_change_password_unauthenticated_redirects(client):
    with client.application.test_request_context():
        url = url_for('auth.change_password_page')
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Login" in response.data

def test_change_password_successful(client, app, logged_in_client, db):
    login_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert login_user is not None
    original_hash = login_user.password_hash
    new_password_val = "newStrongPassword123"

    with logged_in_client.application.test_request_context():
        change_pass_url = url_for('auth.change_password_page')
        get_response = logged_in_client.get(change_pass_url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'current_password': 'password',
        'new_password': new_password_val,
        'confirm_new_password': new_password_val,
        'csrf_token': token
    }
    response = logged_in_client.post(change_pass_url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Your password has been updated successfully!" in response.data
    assert b"Settings" in response.data

    db.session.refresh(login_user)
    assert login_user.password_hash != original_hash
    assert login_user.check_password(new_password_val)

    logged_in_client.get(url_for('auth.logout'))

    with client.application.test_request_context():
        login_page_resp_old = client.get(url_for('auth.login'))
        token_login_old = _extract_csrf_token_from_html(login_page_resp_old.data.decode())
    login_attempt_old_pass = client.post(url_for('auth.login'), data={
        'username': login_user.username, 'password': 'password', 'csrf_token': token_login_old
    }, follow_redirects=True)
    assert b"Invalid username or password." in login_attempt_old_pass.data

    with client.application.test_request_context():
        login_page_resp_new = client.get(url_for('auth.login'))
        token_login_new = _extract_csrf_token_from_html(login_page_resp_new.data.decode())
    login_attempt_new_pass = client.post(url_for('auth.login'), data={
        'username': login_user.username, 'password': new_password_val, 'csrf_token': token_login_new
    }, follow_redirects=True)
    assert b"Logged in successfully." in login_attempt_new_pass.data

def test_change_password_incorrect_current(logged_in_client):
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
        get_response = logged_in_client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'current_password': 'wrongcurrentpassword',
        'new_password': 'newpassword123',
        'confirm_new_password': 'newpassword123',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Invalid current password." in response.data
    assert b"Change Password" in response.data

def test_change_password_mismatched_new(logged_in_client):
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
        get_response = logged_in_client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'current_password': 'password',
        'new_password': 'newPass1',
        'confirm_new_password': 'newPass2',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"New passwords must match." in response.data
    assert b"Change Password" in response.data

def test_change_password_new_too_short(logged_in_client):
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
        get_response = logged_in_client.get(url)
        assert get_response.status_code == 200
        token = _extract_csrf_token_from_html(get_response.data.decode())

    form_data = {
        'current_password': 'password',
        'new_password': 'short',
        'confirm_new_password': 'short',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=False) # Check direct response
    assert response.status_code == 200
    assert b"Field must be at least 8 characters long." in response.data
    assert b"Change Password" in response.data

def test_change_password_csrf_missing(logged_in_client):
    form_data = {
        'current_password': 'password',
        'new_password': 'newpassword123',
        'confirm_new_password': 'newpassword123',
    }
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

def test_change_password_csrf_invalid(logged_in_client):
    form_data = {
        'current_password': 'password',
        'new_password': 'newpassword123',
        'confirm_new_password': 'newpassword123',
        'csrf_token': 'badtokenchangepass'
    }
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400
