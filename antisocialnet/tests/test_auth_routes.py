import pytest
from flask import url_for, get_flashed_messages
from unittest.mock import patch
from antisocialnet.models import User
from antisocialnet import db

# Fixture to create a user for auth tests if not using the global one from conftest
@pytest.fixture
def auth_test_user(db, create_test_user):
    return create_test_user(email_address="auth@example.com", password="password123", full_name="auth_user")

# --- Test Password Reset Request Route ---
def test_reset_password_request_page_loads(client):
    """Test GET /auth/reset_password_request loads the form."""
    with client.application.test_request_context(): # Added context
        response = client.get(url_for('auth.reset_password_request'))
    assert response.status_code == 200
    assert b"Request Password Reset" in response.data
    assert b"Your Email Address" in response.data

def test_reset_password_request_authenticated_user_redirects(client, logged_in_client): # logged_in_client provides context
    """Test authenticated user is redirected from reset password request page."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('auth.reset_password_request'), follow_redirects=True)
    assert response.status_code == 200
    # Should redirect to index or feed, check for content not on reset page
    assert b"Request Password Reset" not in response.data
    assert b"Home" in response.data # Assuming 'Home' is on the index/feed page title or header

@patch('antisocialnet.routes.auth_routes.send_password_reset_email')
def test_reset_password_request_valid_email(mock_send_email, client, db, auth_test_user):
    """Test POST /auth/reset_password_request with a valid, existing email."""
    with client.application.app_context(): # client.application gives the app instance
        # For POST requests, we need a CSRF token.
        # We can get one by first GETting the form page if the form is rendered there,
        # or by creating an instance of the form if it's simpler.
        # Assuming RequestPasswordResetForm is used for this route.
        from antisocialnet.forms import RequestPasswordResetForm
        form = RequestPasswordResetForm()
        token = form.csrf_token.current_token
        url = url_for('auth.reset_password_request')

    form_data = {'email': auth_test_user.username, 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Redirects to login
    assert b"An email has been sent with instructions to reset your password." in response.data
    mock_send_email.assert_called_once_with(auth_test_user)

@patch('antisocialnet.routes.auth_routes.send_password_reset_email')
def test_reset_password_request_nonexistent_email(mock_send_email, client, db):
    """Test POST /auth/reset_password_request with a non-existent email."""
    with client.application.app_context():
        from antisocialnet.forms import RequestPasswordResetForm
        form = RequestPasswordResetForm()
        token = form.csrf_token.current_token
        url = url_for('auth.reset_password_request')

    form_data = {'email': 'nonexistent@example.com', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Redirects to login
    # Same flash message for security (don't reveal if email exists)
    assert b"An email has been sent with instructions to reset your password." in response.data
    mock_send_email.assert_not_called() # Should not be called if user doesn't exist

def test_reset_password_request_invalid_email_format(client):
    """Test POST /auth/reset_password_request with an invalid email format."""
    with client.application.app_context():
        from antisocialnet.forms import RequestPasswordResetForm
        form = RequestPasswordResetForm()
        token = form.csrf_token.current_token
        url = url_for('auth.reset_password_request')

    form_data = {'email': 'not-an-email', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on the request page due to form error
    assert b"Invalid email address." in response.data
    assert b"Request Password Reset" in response.data # Still on the same page

def test_reset_password_request_empty_email(client):
    """Test POST /auth/reset_password_request with an empty email."""
    with client.application.app_context():
        from antisocialnet.forms import RequestPasswordResetForm
        form = RequestPasswordResetForm()
        token = form.csrf_token.current_token
        url = url_for('auth.reset_password_request')

    form_data = {'email': '', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please enter your email address." in response.data # DataRequired validator message
    assert b"Request Password Reset" in response.data

def test_reset_password_request_csrf_missing(client, auth_test_user):
    """Test POST /auth/reset_password_request with missing CSRF token."""
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
    # Test without follow_redirects for CSRF errors to see the direct 400
    response_no_redirect = client.post(url, data={'email': auth_test_user.username})
    assert response_no_redirect.status_code == 400 # Expecting direct 400 from Flask-WTF

def test_reset_password_request_csrf_invalid(client, auth_test_user):
    """Test POST /auth/reset_password_request with invalid CSRF token."""
    form_data = {'email': auth_test_user.username, 'csrf_token': 'invalidtoken'}
    with client.application.test_request_context():
        url = url_for('auth.reset_password_request')
    response = client.post(url, data=form_data)
    assert response.status_code == 400


# --- Test Reset Password with Token Route ---
def test_reset_password_with_token_page_loads_valid_token(client, db, auth_test_user, app):
    """Test GET /auth/reset_password/<token> with a valid token."""
    with app.app_context(): # For token generation
        token = auth_test_user.get_reset_password_token()
        url = url_for('auth.reset_password_with_token', token=token)

    response = client.get(url)
    assert response.status_code == 200
    assert b"Reset Your Password" in response.data
    assert b"New Password" in response.data

def test_reset_password_with_token_invalid_token(client):
    """Test GET /auth/reset_password/<token> with an invalid/expired token."""
    with client.application.test_request_context():
        url = url_for('auth.reset_password_with_token', token="invalid.token.string")
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200 # Redirects to request_reset_password
    assert b"That is an invalid or expired token." in response.data
    assert b"Request Password Reset" in response.data # On the request page

def test_reset_password_with_token_authenticated_user_redirects(client, logged_in_client, app, auth_test_user):
    """Test authenticated user is redirected from reset password with token page."""
    with app.app_context(): # For token generation
        token = auth_test_user.get_reset_password_token() # Any valid token
        url = url_for('auth.reset_password_with_token', token=token)
    response = logged_in_client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Reset Your Password" not in response.data
    assert b"Home" in response.data

def test_reset_password_with_token_valid_submission(client, db, auth_test_user, app):
    """Test POST /auth/reset_password/<token> with valid token and new password."""
    with app.app_context():
        token = auth_test_user.get_reset_password_token()

    original_password_hash = auth_test_user.password_hash
    new_password = "newValidPassword123"

    # The form itself will generate its own CSRF token if rendered on a GET page.
    # For a POST test, we need to supply one that matches the session.
    # Since this route's GET displays a form, let's fetch it first to get a token.
    # However, simpler: create form instance in context to get a token for this session.
    with app.app_context(): # Use app fixture for context
        from antisocialnet.forms import ResetPasswordForm
        form = ResetPasswordForm() # This form is used by the route
        csrf_token_val = form.csrf_token.current_token
        url = url_for('auth.reset_password_with_token', token=token)

    form_data = {
        'password': new_password,
        'confirm_password': new_password,
        'csrf_token': csrf_token_val
    }
    response = client.post(url, data=form_data, follow_redirects=True)

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
        from antisocialnet.forms import ResetPasswordForm
        form = ResetPasswordForm()
        csrf_token_val = form.csrf_token.current_token
        url = url_for('auth.reset_password_with_token', token=token)

    form_data = {
        'password': 'newPassword123',
        'confirm_password': 'differentPassword456',
        'csrf_token': csrf_token_val
    }
    response = client.post(url, data=form_data, follow_redirects=True)

    assert response.status_code == 200 # Stays on reset_password_with_token page
    assert b"Passwords must match." in response.data
    assert b"Reset Your Password" in response.data # Still on the same page

def test_reset_password_with_token_post_invalid_token(client, app, db): # Added app
    """Test POST /auth/reset_password/<token> with an invalid token."""
    with app.app_context(): # Use app fixture for context
        from antisocialnet.forms import ResetPasswordForm
        form = ResetPasswordForm() # This form is used by the route
        csrf_token_val = form.csrf_token.current_token
        url = url_for('auth.reset_password_with_token', token="invalid.token.here")

    form_data = {
        'password': 'anypassword',
        'confirm_password': 'anypassword',
        'csrf_token': csrf_token_val
    }
    response = client.post(url, data=form_data, follow_redirects=True)

    assert response.status_code == 200 # Redirects to request_reset_password
    assert b"That is an invalid or expired token." in response.data
    assert b"Request Password Reset" in response.data

def test_reset_password_with_token_csrf_missing(client, app, auth_test_user):
    """Test POST /auth/reset_password/<token> with missing CSRF token."""
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
        url = url_for('auth.reset_password_with_token', token=token)

    form_data = {'password': 'newpassword', 'confirm_password': 'newpassword'}
    response = client.post(url, data=form_data)
    assert response.status_code == 400 # Expect direct 400

def test_reset_password_with_token_csrf_invalid(client, app, auth_test_user):
    """Test POST /auth/reset_password/<token> with invalid CSRF token."""
    with app.app_context():
        token = auth_test_user.get_reset_password_token()
        url = url_for('auth.reset_password_with_token', token=token)

    form_data = {
        'password': 'newpassword',
        'confirm_password': 'newpassword',
        'csrf_token': 'invalidtoken'
    }
    response = client.post(url, data=form_data)
    assert response.status_code == 400 # Expect direct 400


# --- Test Registration Route ---
def test_register_page_loads(client):
    """Test GET /register loads the registration form."""
    with client.application.test_request_context():
        response = client.get(url_for('auth.register'))
    assert response.status_code == 200
    assert b"Register New Account" in response.data # Assuming this title
    assert b"Email (Username)" in response.data
    assert b"Password" in response.data

def test_register_authenticated_user_redirects(client, logged_in_client):
    """Test authenticated user is redirected from /register page."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('auth.register'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Register New Account" not in response.data
    assert b"Home" in response.data # Or wherever they are redirected

def test_register_successful(client, app, db):
    """Test successful user registration."""
    with app.app_context():
        from antisocialnet.forms import RegistrationForm
        form = RegistrationForm()
        token = form.csrf_token.current_token
        url = url_for('auth.register')

    form_data = {
        'full_name': 'New User',
        'email': 'newuser@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Assuming redirect to login or a success page
    # Default auto_approve_users is True in TestConfig's init_database
    # Default allow_registrations is True in TestConfig's init_database
    # So, user should be created and approved.
    # The message might depend on approval status.
    # If auto-approved: "Registration successful! Please log in."
    # If not: "Registration successful! Your account is pending admin approval."
    # Current auth_routes.py has: "Registration successful! Please log in." if approved,
    # or "Registration successful! Your account is pending approval." if not.
    # SiteSetting 'auto_approve_users' is True in tests.
    assert b"Registration successful! Please log in." in response.data

    user = User.query.filter_by(email='newuser@example.com').first()
    assert user is not None
    assert user.full_name == 'New User'
    assert user.is_approved # Because SiteSetting auto_approve_users is True in test setup
    assert user.is_active # Default should be True upon creation if approved.

def test_register_email_exists(client, app, auth_test_user): # auth_test_user is 'auth@example.com'
    """Test registration with an email that already exists."""
    with app.app_context():
        from antisocialnet.forms import RegistrationForm
        form = RegistrationForm()
        token = form.csrf_token.current_token
        url = url_for('auth.register')

    form_data = {
        'full_name': 'Another User',
        'email': auth_test_user.username, # Existing email
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on registration page
    assert b"Email is already registered." in response.data
    assert b"Register New Account" in response.data

def test_register_mismatched_passwords(client, app):
    """Test registration with mismatched passwords."""
    with app.app_context():
        from antisocialnet.forms import RegistrationForm
        form = RegistrationForm()
        token = form.csrf_token.current_token
        url = url_for('auth.register')

    form_data = {
        'full_name': 'Mismatch User',
        'email': 'mismatch@example.com',
        'password': 'password123',
        'confirm_password': 'password456', # Mismatch
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Passwords must match." in response.data
    assert b"Register New Account" in response.data

def test_register_short_password(client, app):
    """Test registration with a password that is too short."""
    with app.app_context():
        from antisocialnet.forms import RegistrationForm
        form = RegistrationForm()
        token = form.csrf_token.current_token
        url = url_for('auth.register')

    form_data = {
        'full_name': 'ShortPass User',
        'email': 'shortpass@example.com',
        'password': 'short',
        'confirm_password': 'short',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Password must be at least 8 characters long." in response.data
    assert b"Register New Account" in response.data

def test_register_registrations_disabled(client, app, db):
    """Test registration when SiteSetting 'allow_registrations' is False."""
    with app.app_context():
        from antisocialnet.models import SiteSetting
        SiteSetting.set('allow_registrations', False, 'bool')
        db.session.commit()

        from antisocialnet.forms import RegistrationForm
        form = RegistrationForm()
        token = form.csrf_token.current_token
        url = url_for('auth.register')

    form_data = {
        'full_name': 'NoReg User',
        'email': 'noreg@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Should show an error or redirect
    assert b"User registration is currently disabled." in response.data
    # Check user was not created
    user = User.query.filter_by(email='noreg@example.com').first()
    assert user is None

    # Reset site setting for other tests
    with app.app_context():
        SiteSetting.set('allow_registrations', True, 'bool')
        db.session.commit()

def test_register_csrf_missing(client, app):
    """Test registration POST with missing CSRF token."""
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


# --- Test Login Route ---
def test_login_page_loads(client):
    """Test GET /login loads the login form."""
    with client.application.test_request_context():
        response = client.get(url_for('auth.login'))
    assert response.status_code == 200
    assert b"Log In" in response.data
    assert b"Username" in response.data # Assuming 'Username' is used, though it's email
    assert b"Password" in response.data

def test_login_authenticated_user_redirects(client, logged_in_client):
    """Test authenticated user is redirected from /login page."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('auth.login'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Log In" not in response.data # Should not be on login page
    assert b"Home" in response.data # Or wherever they are redirected

def test_login_successful(client, app, auth_test_user): # auth_test_user: email='auth@example.com', pass='password123'
    """Test successful login with correct credentials for an active, approved user."""
    # Ensure user is active and approved (auth_test_user is by default)
    auth_test_user.is_active = True
    auth_test_user.is_approved = True
    db.session.commit()

    with app.app_context():
        from antisocialnet.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
        url = url_for('auth.login')

    form_data = {
        'username': auth_test_user.username, # Login form uses 'username' field for email
        'password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Logged in successfully!" in response.data # Expected flash message
    # Check that current_user is now set (indirectly, e.g. by seeing content only for logged-in users)
    # A direct check of session is possible but more complex.
    # For now, check for redirection away from login page and a success message.
    assert b"Logout" in response.data # Logout link usually appears for logged-in users

def test_login_incorrect_password(client, app, auth_test_user):
    """Test login with incorrect password."""
    with app.app_context():
        from antisocialnet.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
        url = url_for('auth.login')

    form_data = {
        'username': auth_test_user.username,
        'password': 'wrongpassword',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on login page
    assert b"Invalid username or password." in response.data
    assert b"Log In" in response.data # Still on login page

def test_login_nonexistent_user(client, app):
    """Test login with a username/email that does not exist."""
    with app.app_context():
        from antisocialnet.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
        url = url_for('auth.login')

    form_data = {
        'username': 'nouser@example.com',
        'password': 'anypassword',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Invalid username or password." in response.data # Same message for security
    assert b"Log In" in response.data

def test_login_user_not_approved(client, app, create_test_user, db):
    """Test login for a user who is created but not yet approved."""
    unapproved_user = create_test_user(email_address="unapproved@example.com", password="password123", full_name="unapproved", is_approved=False)

    with app.app_context():
        from antisocialnet.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
        url = url_for('auth.login')

    form_data = {
        'username': unapproved_user.username,
        'password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Your account has not been approved yet." in response.data
    assert b"Log In" in response.data

def test_login_user_not_active(client, app, create_test_user, db):
    """Test login for a user who is approved but not active (is_active=False)."""
    inactive_user = create_test_user(email_address="inactive@example.com", password="password123", full_name="inactive", is_approved=True)
    inactive_user.is_active = False # Explicitly set inactive
    db.session.commit()

    with app.app_context():
        from antisocialnet.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
        url = url_for('auth.login')

    form_data = {
        'username': inactive_user.username,
        'password': 'password123',
        'csrf_token': token
    }
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Your account is inactive." in response.data
    assert b"Log In" in response.data

def test_login_empty_credentials(client, app):
    """Test login form with empty username and password."""
    with app.app_context():
        from antisocialnet.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
        url = url_for('auth.login')

    form_data = {'username': '', 'password': '', 'csrf_token': token}
    response = client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"This field is required." in response.data # WTForms DataRequired message
    assert b"Log In" in response.data

def test_login_csrf_missing(client, app, auth_test_user):
    """Test login POST with missing CSRF token."""
    form_data = {'username': auth_test_user.username, 'password': 'password123'}
    with client.application.test_request_context():
        url = url_for('auth.login')
    response = client.post(url, data=form_data)
    assert response.status_code == 400

def test_login_csrf_invalid(client, app, auth_test_user):
    """Test login POST with invalid CSRF token."""
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
def test_logout_successful(client, logged_in_client):
    """Test successful logout for an authenticated user."""
    # logged_in_client is already logged in.
    # In Flask, current_user is available in the test client's context after login.
    # We can check by trying to access a protected route or checking for session keys.
    # For simplicity, we'll check the flash message and redirection.
    with logged_in_client.application.test_request_context():
        logout_url = url_for('auth.logout_route')
        dashboard_url = url_for('general.dashboard')
        # login_url = url_for('auth.login') # Not needed for this part

    response = logged_in_client.get(logout_url, follow_redirects=True)
    assert response.status_code == 200
    assert b"You have been logged out." in response.data
    assert b"Log In" in response.data # Should be on a page with a Login link (e.g., index or login page)

    # Verify user is logged out by trying to access a @login_required page
    # (e.g., dashboard, or a simple settings page if that's easier)
    # Let's assume 'general.dashboard' is login_required
    dashboard_response = logged_in_client.get(dashboard_url, follow_redirects=True)
    assert dashboard_response.status_code == 200
    assert b"Please log in to access this page." in dashboard_response.data # Indicates redirect to login

def test_logout_unauthenticated_user(client):
    """Test accessing /logout when not authenticated."""
    # Should not error, just redirect (likely to index or login)
    with client.application.test_request_context():
        url = url_for('auth.logout_route')
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200
    # No "You have been logged out." message should appear for already logged-out user.
    assert b"You have been logged out." not in response.data
    # Behavior might be a simple redirect to index.
    # If index is the target:
    # assert b"Latest Updates" in response.data # Assuming this is on index page

# --- Test Change Password Route ---
def test_change_password_page_loads(client, logged_in_client): # logged_in_client provides context
    """Test GET /change-password loads the form for an authenticated user."""
    with logged_in_client.application.test_request_context():
        url = url_for('auth.change_password_page')
    response = logged_in_client.get(url)
    assert response.status_code == 200
    assert b"Change Your Password" in response.data
    assert b"Current Password" in response.data

def test_change_password_unauthenticated_redirects(client):
    """Test unauthenticated user is redirected from /change-password."""
    with client.application.test_request_context():
        url = url_for('auth.change_password_page')
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Log In" in response.data # Should be on login page

def test_change_password_successful(client, app, logged_in_client, db):
    """Test successful password change."""
    # logged_in_client is 'login_fixture_user@example.com' with password 'password'
    login_user = User.query.filter_by(username="login_fixture_user@example.com").first() # from logged_in_client fixture
    assert login_user is not None
    original_hash = login_user.password_hash
    new_password_val = "newStrongPassword123"

    with app.app_context():
        from antisocialnet.forms import ChangePasswordForm
        form = ChangePasswordForm()
        token = form.csrf_token.current_token

        change_pass_url = url_for('auth.handle_change_password')
        logout_url = url_for('auth.logout_route')
        login_url = url_for('auth.login')


    form_data = {
        'current_password': 'password',
        'new_password': new_password_val,
        'confirm_new_password': new_password_val,
        'csrf_token': token
    }
    # Use logged_in_client for the POST as it maintains the session
    response = logged_in_client.post(change_pass_url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Your password has been updated successfully!" in response.data
    # Should be redirected, e.g., to settings or dashboard
    assert b"Settings" in response.data # Assuming redirection to settings page

    db.session.refresh(login_user)
    assert login_user.password_hash != original_hash
    assert login_user.check_password(new_password_val)

    # Verify old password no longer works (logout and try to log back in with old pass)
    logged_in_client.get(url_for('auth.logout_route')) # Logout
    with app.app_context(): from antisocialnet.forms import LoginForm; form = LoginForm(); token = form.csrf_token.current_token
    login_attempt_old_pass = logged_in_client.post(url_for('auth.login'), data={
        'username': login_user.username, 'password': 'password', 'csrf_token': token
    }, follow_redirects=True)
    assert b"Invalid username or password." in login_attempt_old_pass.data

    # Verify new password works
    with app.app_context(): from antisocialnet.forms import LoginForm; form = LoginForm(); token = form.csrf_token.current_token
    login_attempt_new_pass = logged_in_client.post(url_for('auth.login'), data={
        'username': login_user.username, 'password': new_password_val, 'csrf_token': token
    }, follow_redirects=True)
    assert b"Logged in successfully!" in login_attempt_new_pass.data


def test_change_password_incorrect_current(client, app, logged_in_client):
    """Test password change with incorrect current password."""
    with app.app_context():
        from antisocialnet.forms import ChangePasswordForm
        form = ChangePasswordForm()
        token = form.csrf_token.current_token
        url = url_for('auth.handle_change_password')

    form_data = {
        'current_password': 'wrongcurrentpassword',
        'new_password': 'newpassword123',
        'confirm_new_password': 'newpassword123',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on change password page
    assert b"Incorrect current password." in response.data
    assert b"Change Your Password" in response.data

def test_change_password_mismatched_new(client, app, logged_in_client):
    """Test password change with mismatched new passwords."""
    with app.app_context():
        from antisocialnet.forms import ChangePasswordForm
        form = ChangePasswordForm()
        token = form.csrf_token.current_token
        url = url_for('auth.handle_change_password')

    form_data = {
        'current_password': 'password', # Correct current password
        'new_password': 'newPass1',
        'confirm_new_password': 'newPass2', # Mismatch
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"New passwords must match." in response.data
    assert b"Change Your Password" in response.data

def test_change_password_new_too_short(client, app, logged_in_client):
    """Test password change with new password too short."""
    with app.app_context():
        from antisocialnet.forms import ChangePasswordForm
        form = ChangePasswordForm()
        token = form.csrf_token.current_token
        url = url_for('auth.handle_change_password')

    form_data = {
        'current_password': 'password',
        'new_password': 'short',
        'confirm_new_password': 'short',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    # The length validator is on New Password field in ChangePasswordForm
    # Default WTForms message for Length is like "Field must be between X and Y characters long."
    # The form uses Length(min=8)
    assert b"Field must be at least 8 characters long." in response.data # Or similar based on actual validator message
    assert b"Change Your Password" in response.data

def test_change_password_csrf_missing(client, logged_in_client):
    """Test change password POST with missing CSRF token."""
    form_data = {
        'current_password': 'password',
        'new_password': 'newpassword123',
        'confirm_new_password': 'newpassword123',
    }
    with logged_in_client.application.test_request_context(): # Use context from logged_in_client's app
        url = url_for('auth.handle_change_password')
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

def test_change_password_csrf_invalid(client, logged_in_client):
    """Test change password POST with invalid CSRF token."""
    form_data = {
        'current_password': 'password',
        'new_password': 'newpassword123',
        'confirm_new_password': 'newpassword123',
        'csrf_token': 'badtokenchangepass'
    }
    with logged_in_client.application.test_request_context():
        url = url_for('auth.handle_change_password')
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

# Note: 'app' fixture is used when form instances are created for CSRF token.
# 'db' fixture is used when database interactions are asserted or setup.
# 'logged_in_client' provides an authenticated client session.
# 'auth_test_user' is a specific user for some tests, 'loginuser' is from logged_in_client.

def test_register_csrf_invalid(client, app):
    """Test registration POST with invalid CSRF token."""
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
