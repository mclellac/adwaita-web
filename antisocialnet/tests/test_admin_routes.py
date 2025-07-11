import pytest
from flask import url_for
from antisocialnet.models import User, SiteSetting, Post, Comment, CommentFlag
from antisocialnet import db

# The admin_client fixture is now taken from conftest.py

# --- Admin Access Control Tests (applied to one route, assume decorator handles others) ---
def test_admin_route_unauthenticated_redirects(client):
    """Test unauthenticated access to an admin route (e.g., site_settings) redirects to login."""
    # Use test_request_context for url_for calls within the test function
    with client.application.test_request_context('/'):
        url_to_access = url_for('admin.site_settings')
        expected_redirect_target_path = url_for('auth.login')

    response = client.get(url_to_access, follow_redirects=True)
    assert response.status_code == 200 # Due to redirect
    assert b"Please log in to access this page." in response.data # Flash message
    assert b"Login" in response.data # Should be on the login page

    # response.request.path is the path of the final page after redirects.
    # Compare the path component of the URL.
    from urllib.parse import urlparse
    assert urlparse(response.request.path).path == urlparse(expected_redirect_target_path).path

def test_admin_route_non_admin_authenticated_forbidden(client, logged_in_client):
    """Test non-admin authenticated user gets 403 from an admin route."""
    # logged_in_client uses "login_fixture_user@example.com"
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert user is not None, "Logged in user not found in DB"
    assert not user.is_admin
    response = logged_in_client.get(url_for('admin.site_settings'))
    assert response.status_code == 403 # Forbidden

# --- Site Settings Route Tests ---
def test_site_settings_page_loads_for_admin(admin_client):
    """Test GET /admin/site-settings loads form for admin."""
    # Seed some initial settings to check pre-population
    with admin_client.application.app_context():
        SiteSetting.set('site_title', 'Initial Test Title', 'string')
        SiteSetting.set('posts_per_page', 15, 'int')
        SiteSetting.set('allow_registrations', False, 'bool')
        db.session.commit()

    response = admin_client.get(url_for('admin.site_settings'))
    assert response.status_code == 200
    assert b"Site Settings (Admin)" in response.data # From settings.html, also used for admin section
    assert b"Initial Test Title" in response.data
    assert b'value="15"' in response.data # For posts_per_page
    # For boolean 'allow_registrations' False, checkbox should not be checked
    # Check for essential parts of the checkbox, as exact HTML string can be fragile
    assert b'name="allow_registrations"' in response.data
    assert b'id="allow_registrations_input"' in response.data
    assert b'type="checkbox"' in response.data
    # Ensure it's not checked (this part was working and is important)
    # Extract the relevant part of HTML for the checkbox to check its state
    checkbox_html_segment = response.data.split(b'id="allow_registrations_input"')[0]
    relevant_segment_for_checked = checkbox_html_segment.split(b'<input')[-1]
    assert b'checked' not in relevant_segment_for_checked

    # Old assertion for checked status, which is more robust if the exact input tag changes:
    # assert b'checked' not in response.data.split(b'name="allow_registrations"')[1].split(b'>')[0]
    # Re-evaluating the checked assertion: the original split was likely better if name attribute is stable.
    # The id="allow_registrations_input" is within the <input ...> tag.
    # We need to find the input tag associated with name="allow_registrations"
    # and check if 'checked' attribute is present for that specific tag.

    # A more robust way to check if a specific checkbox is not checked:
    # 1. Find the input tag.
    # 2. Check its attributes.
    # For now, let's assume the original split for 'checked' was good if the name is unique enough.
    # The id "allow_registrations_input" is what we hardcoded in the template.
    # The most reliable part of the original test for the 'checked' status was:
    input_tag_parts = response.data.split(b'name="allow_registrations"')
    if len(input_tag_parts) > 1:
        # Check the part of the string that immediately follows name="allow_registrations"
        # up to the closing '>' of that input tag.
        following_html = input_tag_parts[1].split(b'>')[0]
        assert b'checked' not in following_html
    else:
        assert False, "Checkbox with name='allow_registrations' not found"


def test_site_settings_update_successful(admin_client, app, db):
    """Test POST /admin/site-settings successfully updates settings."""
    with admin_client.application.test_request_context(): # Use test_request_context for form token
        from antisocialnet.forms import SiteSettingsForm
        form = SiteSettingsForm()
        token = form.csrf_token.current_token

    new_title = "Updated Awesome Site"
    new_ppp = "25"
    # allow_registrations will be sent as 'y' if checkbox is checked, or not present if unchecked.
    form_data = {
        'site_title': new_title,
        'posts_per_page': new_ppp,
        'allow_registrations': 'y', # Check the box (True)
        'csrf_token': token
    }
    response = admin_client.post(url_for('admin.site_settings'), data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Site settings updated successfully." in response.data
    # Stays on the settings page (which is general.settings_page, but admin form is there)
    assert b"Site Settings (Admin)" in response.data

    with app.app_context():
        assert SiteSetting.get('site_title') == new_title
        assert SiteSetting.get('posts_per_page') == 25 # Stored as int
        assert SiteSetting.get('allow_registrations') == True

    # Test updating to False for boolean
    with admin_client.application.test_request_context(): # Use test_request_context for form token
        from antisocialnet.forms import SiteSettingsForm
        form = SiteSettingsForm()
        token = form.csrf_token.current_token
    form_data_uncheck = {
        'site_title': new_title,
        'posts_per_page': new_ppp,
        # 'allow_registrations' field not present in form_data means checkbox unchecked -> False
        'csrf_token': token
    }
    admin_client.post(url_for('admin.site_settings'), data=form_data_uncheck, follow_redirects=True)
    with app.app_context():
        assert SiteSetting.get('allow_registrations') == False


def test_site_settings_update_validation_error(admin_client, app):
    """Test POST /admin/site-settings with validation errors (e.g., empty title)."""
    with admin_client.application.test_request_context(): # Use test_request_context for form token
        from antisocialnet.forms import SiteSettingsForm
        form = SiteSettingsForm()
        token = form.csrf_token.current_token

    form_data = {
        'site_title': '', # Empty, which is required
        'posts_per_page': '10',
        'csrf_token': token
    }
    response = admin_client.post(url_for('admin.site_settings'), data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on settings page
    assert b"This field is required." in response.data # For site_title
    assert b"Site settings updated successfully." not in response.data

def test_site_settings_update_invalid_ppp(admin_client, app):
    """Test POST /admin/site-settings with invalid posts_per_page value."""
    with admin_client.application.test_request_context(): # Use test_request_context for form token
        from antisocialnet.forms import SiteSettingsForm
        form = SiteSettingsForm()
        token = form.csrf_token.current_token

    form_data = {
        'site_title': 'Valid Title',
        'posts_per_page': 'abc', # Invalid integer
        'csrf_token': token
    }
    response = admin_client.post(url_for('admin.site_settings'), data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Posts per page must be a number." in response.data # Custom error from route
    assert b"Site Settings (Admin)" in response.data

def test_site_settings_csrf_missing(admin_client):
    """Test POST to site_settings with missing CSRF token."""
    form_data = {'site_title': 'CSRF Test Title', 'posts_per_page': '5'}
    response = admin_client.post(url_for('admin.site_settings'), data=form_data)
    assert response.status_code == 400 # Direct CSRF failure

# --- Pending Users Route Tests ---
def test_pending_users_page_loads_for_admin(admin_client, db, create_test_user):
    """Test GET /admin/pending_users for admin, with and without pending users."""
    # Scenario 1: No pending users
    response_no_pending = admin_client.get(url_for('admin.pending_users'))
    assert response_no_pending.status_code == 200
    assert b"Pending User Approvals" in response_no_pending.data
    assert b"No users are currently pending approval." in response_no_pending.data

    # Scenario 2: With pending users
    pending_user1 = create_test_user(email_address="p1@example.com", full_name="Pending User 1", is_approved=False, is_active=False)
    pending_user2 = create_test_user(email_address="p2@example.com", full_name="Pending User 2", is_approved=False, is_active=False)
    # An already approved user should not show up
    approved_user = create_test_user(email_address="aa@example.com", full_name="Approved User", is_approved=True, is_active=True)

    response_with_pending = admin_client.get(url_for('admin.pending_users'))
    assert response_with_pending.status_code == 200
    assert b"Pending User Approvals" in response_with_pending.data
    assert bytes(pending_user1.username, 'utf-8') in response_with_pending.data
    assert bytes(pending_user2.username, 'utf-8') in response_with_pending.data
    assert bytes(approved_user.username, 'utf-8') not in response_with_pending.data
    assert b"No users are currently pending approval." not in response_with_pending.data
    # Check for approve/reject buttons (e.g., by form action URL part)
    # Use relative path for assertion as url_for in tests can sometimes produce absolute paths
    # depending on SERVER_NAME config, while templates typically render relative ones.
    approve_url_path = f'/admin/users/{pending_user1.id}/approve'
    assert bytes(approve_url_path, 'utf-8') in response_with_pending.data

def test_pending_users_pagination(admin_client, app, db, create_test_user):
    """Test pagination for /admin/pending_users."""
    with app.app_context(): # To modify config for test
        # Clean up any pre-existing pending users to ensure test isolation for counts
        User.query.filter_by(is_approved=False, is_active=False).delete()
        db.session.commit()

        original_admin_users_ppp = app.config.get('ADMIN_USERS_PER_PAGE', 15) # Default from route
        app.config['ADMIN_USERS_PER_PAGE'] = 2 # For testing

    # User creation and subsequent calls should be at the same indent level as the 'with' block above.
    for i in range(5): # Create exactly 5 pending users for this test
        create_test_user(email_address=f"ppu{i}@example.com", full_name=f"Pending Page User{i}", is_approved=False, is_active=False)

    response_p1 = admin_client.get(url_for('admin.pending_users', page=1))
    assert response_p1.status_code == 200
    # Check for 2 users (e.g. by counting "Approve" buttons or email)
    # This is brittle. Better to check if pagination controls are present.
    assert response_p1.data.count(b"Approve") == 2 # Assuming each user has one such button text
    assert b"Next" in response_p1.data

    response_p3 = admin_client.get(url_for('admin.pending_users', page=3))
    assert response_p3.status_code == 200
    assert response_p3.data.count(b"Approve") == 1 # Last page has 1 user
    assert b"Previous" in response_p3.data

    with app.app_context(): # This with block should also be at the same indent level
        app.config['ADMIN_USERS_PER_PAGE'] = original_admin_users_ppp # Reset

# --- Approve/Reject User Route Tests ---
def test_approve_user_successful(admin_client, app, db, create_test_user):
    """Admin successfully approves a pending user."""
    pending_user = create_test_user(email_address="approveme@example.com", full_name="To Approve", is_approved=False, is_active=False)
    user_id = pending_user.id
    assert not pending_user.is_approved and not pending_user.is_active

    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token

    response = admin_client.post(url_for('admin.approve_user', user_id=user_id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"User approveme@example.com approved successfully." in response.data
    # Should redirect to pending_users page
    assert b"Pending User Approvals" in response.data

    approved_user = User.query.get(user_id)
    assert approved_user.is_approved
    assert approved_user.is_active # Route sets is_active=True on approval

def test_reject_user_successful(admin_client, app, db, create_test_user):
    """Admin successfully rejects (deletes) a pending user."""
    # Ensure user is both not approved and not active to be rejectable by this logic
    pending_user = create_test_user(email_address="rejectme@example.com", full_name="To Reject", is_approved=False, is_active=False)
    user_id = pending_user.id
    assert User.query.get(user_id) is not None

    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token
    response = admin_client.post(url_for('admin.reject_user', user_id=user_id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    expected_flash_message = b"User rejectme@example.com rejected and deleted."
    if expected_flash_message not in response.data:
        print("DEBUG: Flash message for reject_user not found. Response data:")
        print(response.data.decode('utf-8', errors='replace')) # Print decoded HTML
    assert expected_flash_message in response.data
    assert b"Pending User Approvals" in response.data
    assert User.query.get(user_id) is None # User should be deleted

def test_approve_nonexistent_user(admin_client, app):
    """Attempt to approve a non-existent user returns 404."""
    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token
    response = admin_client.post(url_for('admin.approve_user', user_id=99999), data={'csrf_token':token})
    assert response.status_code == 404

def test_approve_user_already_approved(admin_client, app, db, create_test_user):
    """Attempt to approve an already approved user."""
    approved_user = create_test_user(email_address="alreadyok@example.com", full_name="Already OK", is_approved=True, is_active=True)
    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token
    response = admin_client.post(url_for('admin.approve_user', user_id=approved_user.id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"User is already approved." in response.data

def test_approve_user_csrf_missing(admin_client, create_test_user):
    """Test approve user POST with missing CSRF token."""
    pending_user = create_test_user(email_address="approvecsrf@example.com", full_name="Approve CSRF", is_approved=False)
    response = admin_client.post(url_for('admin.approve_user', user_id=pending_user.id), data={})
    assert response.status_code == 400 # Direct CSRF failure

# --- View Flags Route Tests ---
def test_view_flags_page_loads_for_admin(admin_client, db, create_test_user, create_test_post):
    """Test GET /admin/flags for admin, with and without active flags."""
    # Scenario 1: No active flags
    response_no_flags = admin_client.get(url_for('admin.view_flags'))
    assert response_no_flags.status_code == 200
    assert b"Review Content Flags" in response_no_flags.data
    assert b"No active flags to review at this time." in response_no_flags.data

    # Scenario 2: With active flags
    post_author = create_test_user(email_address="fpa@example.com", full_name="Flag Post Author")
    comment_author = create_test_user(email_address="fca@example.com", full_name="Flag Comment Author")
    flagger_user = create_test_user(email_address="f007@example.com", full_name="Flagger007")

    test_post = create_test_post(author=post_author, content="A post with a comment to be flagged.")
    comment_to_flag = Comment(text="This is a flaggable comment.", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(comment_to_flag)
    db.session.commit()

    flag1 = CommentFlag(comment_id=comment_to_flag.id, flagger_user_id=flagger_user.id, is_resolved=False)
    # Create an already resolved flag - should not show up in "active" list
    resolved_comment = Comment(text="Another comment", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(resolved_comment); db.session.commit()
    flag2_resolved = CommentFlag(comment_id=resolved_comment.id, flagger_user_id=flagger_user.id, is_resolved=True)
    db.session.add_all([flag1, flag2_resolved])
    db.session.commit()

    response_with_flags = admin_client.get(url_for('admin.view_flags'))
    assert response_with_flags.status_code == 200
    assert b"Review Content Flags" in response_with_flags.data
    assert bytes(comment_to_flag.text, 'utf-8') in response_with_flags.data # Flaggable comment text
    assert bytes(flagger_user.username, 'utf-8') in response_with_flags.data # Flagger username
    assert b"Resolve" in response_with_flags.data # Resolve button/link
    assert b"No active flags to review at this time." not in response_with_flags.data
    assert bytes(resolved_comment.text, 'utf-8') not in response_with_flags.data # Resolved flag's comment should not be listed here

def test_view_flags_pagination(admin_client, app, db, create_test_user, create_test_post):
    """Test pagination for /admin/flags."""
    with app.app_context():
            original_admin_flags_ppp = app.config.get('ADMIN_FLAGS_PER_PAGE', 15) # Default from route
            app.config['ADMIN_FLAGS_PER_PAGE'] = 1 # 1 flag per page for testing

    post_author = create_test_user(email_address="fppa@example.com", full_name="Flag Pag Post Author")
    comment_author = create_test_user(email_address="fpca@example.com", full_name="Flag Pag Comment Author")
    flagger = create_test_user(email_address="fpf@example.com", full_name="Flag Pag Flagger")
    test_post = create_test_post(author=post_author, content="Post for flag pagination.")

    for i in range(3): # Create 3 active flags
        c = Comment(text=f"Flagged comment {i+1}", user_id=comment_author.id, post_id=test_post.id)
        db.session.add(c); db.session.commit()
        f = CommentFlag(comment_id=c.id, flagger_user_id=flagger.id, is_resolved=False)
        db.session.add(f); db.session.commit()

    response_p1 = admin_client.get(url_for('admin.view_flags', page=1))
    assert response_p1.status_code == 200
    assert b"Flagged comment 3" in response_p1.data # Newest flag first (depends on query order)
                                                   # Current query is order_by(CommentFlag.created_at.desc())
    assert b"Flagged comment 2" not in response_p1.data
    assert b"Next" in response_p1.data

    response_p3 = admin_client.get(url_for('admin.view_flags', page=3))
    assert response_p3.status_code == 200
    assert b"Flagged comment 1" in response_p3.data
    assert b"Previous" in response_p3.data

    with app.app_context():
        app.config['ADMIN_FLAGS_PER_PAGE'] = original_admin_flags_ppp # Reset

# --- Resolve Flag Route Tests ---
def test_resolve_flag_successful(admin_client, app, db, create_test_user, create_test_post):
    """Admin successfully resolves an active flag."""
    flagger = create_test_user(email_address="frf@example.com", full_name="Flag Resolver Flagger")
    comment_author = create_test_user(email_address="frca@example.com", full_name="Flag Resolver CAuth")
    post = create_test_post(author=comment_author, content="Post for flag resolution.")
    comment = Comment(text="Comment to be resolved", user_id=comment_author.id, post_id=post.id)
    db.session.add(comment); db.session.commit()
    active_flag = CommentFlag(comment_id=comment.id, flagger_user_id=flagger.id, is_resolved=False)
    db.session.add(active_flag); db.session.commit()
    flag_id = active_flag.id

    assert not active_flag.is_resolved

    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token
    response = admin_client.post(url_for('admin.resolve_flag', flag_id=flag_id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Flag marked as resolved." in response.data
    # Should redirect to view_flags page
    assert b"Review Content Flags" in response.data

    resolved_flag = CommentFlag.query.get(flag_id)
    assert resolved_flag.is_resolved
    # admin_client fixture in conftest.py uses "admin_fixture_user@example.com"
    admin_user_for_check = User.query.filter_by(username="admin_fixture_user@example.com").first()
    assert admin_user_for_check is not None
    assert resolved_flag.resolver_user_id == admin_user_for_check.id
    assert resolved_flag.resolved_at is not None

def test_resolve_flag_nonexistent(admin_client, app):
    """Attempt to resolve a non-existent flag returns 404."""
    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token
    response = admin_client.post(url_for('admin.resolve_flag', flag_id=999888), data={'csrf_token':token})
    assert response.status_code == 404

def test_resolve_flag_already_resolved(admin_client, app, db, create_test_user, create_test_post):
    """Attempt to resolve an already resolved flag."""
    flagger = create_test_user(email_address="farf@example.com", full_name="Flag AlreadyRes Flagger")
    # Get the admin user created by the admin_client fixture
    with admin_client.application.app_context():
        admin_user_for_setup = User.query.filter_by(username="admin_fixture_user@example.com").first()
        assert admin_user_for_setup is not None, "Admin user 'admin_fixture_user@example.com' not found for test setup."

    comment_post = create_test_post() # Create post in the same session
    comment = Comment(text="Comment for already resolved flag", user_id=flagger.id, post_id=comment_post.id)
    db.session.add(comment); db.session.commit()
    resolved_flag = CommentFlag(comment_id=comment.id, flagger_user_id=flagger.id, is_resolved=True, resolver_user_id=admin_user_for_setup.id)
    db.session.add(resolved_flag); db.session.commit()

    with admin_client.application.test_request_context(): # For CSRF token
        from flask_wtf import FlaskForm
        form = FlaskForm() # Basic form for CSRF token generation
        token = form.csrf_token.current_token
    response = admin_client.post(url_for('admin.resolve_flag', flag_id=resolved_flag.id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"This flag has already been resolved." in response.data

def test_resolve_flag_csrf_missing(admin_client, db, create_test_user, create_test_post):
    """Test resolve flag POST with missing CSRF token."""
    flagger = create_test_user(email_address="fcsrf@example.com", full_name="Flag CSRF Flagger")
    comment = Comment(text="Comment for CSRF resolve test", user_id=flagger.id, post_id=create_test_post().id)
    db.session.add(comment); db.session.commit()
    active_flag = CommentFlag(comment_id=comment.id, flagger_user_id=flagger.id, is_resolved=False)
    db.session.add(active_flag); db.session.commit()

    response = admin_client.post(url_for('admin.resolve_flag', flag_id=active_flag.id), data={})
    assert response.status_code == 400 # Direct CSRF failure
    db.session.refresh(active_flag) # Re-fetch from DB
    assert not active_flag.is_resolved # Should not have been resolved
