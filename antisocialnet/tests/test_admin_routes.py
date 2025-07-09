import pytest
from flask import url_for
from app_demo.models import User, SiteSetting, Post, Comment, CommentFlag
from app_demo import db

# Helper fixture to create and log in an admin user
@pytest.fixture
def admin_client(client, app, create_test_user):
    admin_user = create_test_user(username="admin_user", email="admin@example.com", password="password", is_admin=True, is_approved=True, is_active=True)
    with app.app_context():
        from app_demo.forms import LoginForm
        form = LoginForm()
        token = form.csrf_token.current_token
    client.post(url_for('auth.login'), data={
        'username': admin_user.email,
        'password': 'password',
        'csrf_token': token
    }, follow_redirects=True)
    return client

# --- Admin Access Control Tests (applied to one route, assume decorator handles others) ---
def test_admin_route_unauthenticated_redirects(client):
    """Test unauthenticated access to an admin route (e.g., site_settings) redirects to login."""
    response = client.get(url_for('admin.site_settings'), follow_redirects=True)
    assert response.status_code == 200 # Due to redirect
    assert b"Please log in to access this page." in response.data
    assert b"Log In" in response.data # On login page

def test_admin_route_non_admin_authenticated_forbidden(client, logged_in_client):
    """Test non-admin authenticated user gets 403 from an admin route."""
    # logged_in_client is 'loginuser', who is not an admin by default
    assert not User.query.filter_by(username="loginuser").first().is_admin
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
    assert b'<input type="checkbox" name="allow_registrations" id="allow_registrations_input_admin">' in response.data
    assert b'checked' not in response.data.split(b'name="allow_registrations"')[1].split(b'>')[0]


def test_site_settings_update_successful(admin_client, app, db):
    """Test POST /admin/site-settings successfully updates settings."""
    with app.app_context(): # Use app context for form token
        from app_demo.forms import SiteSettingsForm
        form = SiteSettingsForm(); token = form.csrf_token.current_token

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
    with app.app_context(): from app_demo.forms import SiteSettingsForm; form=SiteSettingsForm(); token=form.csrf_token.current_token
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
    with app.app_context():
        from app_demo.forms import SiteSettingsForm
        form = SiteSettingsForm(); token = form.csrf_token.current_token

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
    with app.app_context():
        from app_demo.forms import SiteSettingsForm
        form = SiteSettingsForm(); token = form.csrf_token.current_token

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
    pending_user1 = create_test_user(username="pending1", email="p1@example.com", is_approved=False, is_active=False)
    pending_user2 = create_test_user(username="pending2", email="p2@example.com", is_approved=False, is_active=False)
    # An already approved user should not show up
    approved_user = create_test_user(username="alreadyapproved", email="aa@example.com", is_approved=True, is_active=True)

    response_with_pending = admin_client.get(url_for('admin.pending_users'))
    assert response_with_pending.status_code == 200
    assert b"Pending User Approvals" in response_with_pending.data
    assert bytes(pending_user1.email, 'utf-8') in response_with_pending.data
    assert bytes(pending_user2.email, 'utf-8') in response_with_pending.data
    assert bytes(approved_user.email, 'utf-8') not in response_with_pending.data
    assert b"No users are currently pending approval." not in response_with_pending.data
    # Check for approve/reject buttons (e.g., by form action URL part)
    assert bytes(url_for('admin.approve_user', user_id=pending_user1.id), 'utf-8') in response_with_pending.data

def test_pending_users_pagination(admin_client, app, db, create_test_user):
    """Test pagination for /admin/pending_users."""
    with app.app_context(): # To modify config for test
        original_ppp = app.config.get('POSTS_PER_PAGE', 10) # Route uses POSTS_PER_PAGE
        app.config['POSTS_PER_PAGE'] = 2

    for i in range(5):
        create_test_user(username=f"pending_page_user{i}", email=f"ppu{i}@example.com", is_approved=False, is_active=False)

    response_p1 = admin_client.get(url_for('admin.pending_users', page=1))
    assert response_p1.status_code == 200
    # Check for 2 users (e.g. by counting "Approve" buttons or email)
    # This is brittle. Better to check if pagination controls are present.
    assert response_p1.data.count(b"Approve User") == 2 # Assuming each user has one such button text
    assert b"Next" in response_p1.data

    response_p3 = admin_client.get(url_for('admin.pending_users', page=3))
    assert response_p3.status_code == 200
    assert response_p3.data.count(b"Approve User") == 1 # Last page has 1 user
    assert b"Previous" in response_p3.data

    with app.app_context():
        app.config['POSTS_PER_PAGE'] = original_ppp # Reset

# --- Approve/Reject User Route Tests ---
def test_approve_user_successful(admin_client, app, db, create_test_user):
    """Admin successfully approves a pending user."""
    pending_user = create_test_user(username="to_approve", email="approveme@example.com", is_approved=False, is_active=False)
    user_id = pending_user.id
    assert not pending_user.is_approved and not pending_user.is_active

    with app.app_context(): # For CSRF token
        from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token

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
    pending_user = create_test_user(username="to_reject", email="rejectme@example.com", is_approved=False)
    user_id = pending_user.id
    assert User.query.get(user_id) is not None

    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token
    response = admin_client.post(url_for('admin.reject_user', user_id=user_id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"User rejectme@example.com rejected and deleted." in response.data
    assert b"Pending User Approvals" in response.data
    assert User.query.get(user_id) is None # User should be deleted

def test_approve_nonexistent_user(admin_client, app):
    """Attempt to approve a non-existent user returns 404."""
    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token
    response = admin_client.post(url_for('admin.approve_user', user_id=99999), data={'csrf_token':token})
    assert response.status_code == 404

def test_approve_user_already_approved(admin_client, app, db, create_test_user):
    """Attempt to approve an already approved user."""
    approved_user = create_test_user(username="already_ok", email="alreadyok@example.com", is_approved=True, is_active=True)
    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token
    response = admin_client.post(url_for('admin.approve_user', user_id=approved_user.id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"User is already approved." in response.data

def test_approve_user_csrf_missing(admin_client, create_test_user):
    """Test approve user POST with missing CSRF token."""
    pending_user = create_test_user(username="approve_csrf", email="approvecsrf@example.com", is_approved=False)
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
    post_author = create_test_user(username="flag_post_auth", email="fpa@example.com")
    comment_author = create_test_user(username="flag_comment_auth", email="fca@example.com")
    flagger_user = create_test_user(username="flagger007", email="f007@example.com")

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
        original_ppp = app.config.get('POSTS_PER_PAGE', 10) # Route uses POSTS_PER_PAGE for pagination
        app.config['POSTS_PER_PAGE'] = 1 # 1 flag per page for testing

    post_author = create_test_user(username="flag_pag_post_auth", email="fppa@example.com")
    comment_author = create_test_user(username="flag_pag_comment_auth", email="fpca@example.com")
    flagger = create_test_user(username="flag_pag_flagger", email="fpf@example.com")
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
        app.config['POSTS_PER_PAGE'] = original_ppp # Reset

# --- Resolve Flag Route Tests ---
def test_resolve_flag_successful(admin_client, app, db, create_test_user, create_test_post):
    """Admin successfully resolves an active flag."""
    flagger = create_test_user(username="flag_resolver_flagger", email="frf@example.com")
    comment_author = create_test_user(username="flag_resolver_cauth", email="frca@example.com")
    post = create_test_post(author=comment_author, content="Post for flag resolution.")
    comment = Comment(text="Comment to be resolved", user_id=comment_author.id, post_id=post.id)
    db.session.add(comment); db.session.commit()
    active_flag = CommentFlag(comment_id=comment.id, flagger_user_id=flagger.id, is_resolved=False)
    db.session.add(active_flag); db.session.commit()
    flag_id = active_flag.id

    assert not active_flag.is_resolved

    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token
    response = admin_client.post(url_for('admin.resolve_flag', flag_id=flag_id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Flag marked as resolved." in response.data
    # Should redirect to view_flags page
    assert b"Review Content Flags" in response.data

    resolved_flag = CommentFlag.query.get(flag_id)
    assert resolved_flag.is_resolved
    assert resolved_flag.resolver_user_id == User.query.filter_by(username="admin_user").first().id # From admin_client
    assert resolved_flag.resolved_at is not None

def test_resolve_flag_nonexistent(admin_client, app):
    """Attempt to resolve a non-existent flag returns 404."""
    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token
    response = admin_client.post(url_for('admin.resolve_flag', flag_id=999888), data={'csrf_token':token})
    assert response.status_code == 404

def test_resolve_flag_already_resolved(admin_client, app, db, create_test_user, create_test_post):
    """Attempt to resolve an already resolved flag."""
    flagger = create_test_user(username="flag_alreadyres_flagger", email="farf@example.com")
    admin_user_obj = User.query.filter_by(username="admin_user").first()
    comment = Comment(text="Comment for already resolved flag", user_id=flagger.id, post_id=create_test_post().id)
    db.session.add(comment); db.session.commit()
    resolved_flag = CommentFlag(comment_id=comment.id, flagger_user_id=flagger.id, is_resolved=True, resolver_user_id=admin_user_obj.id)
    db.session.add(resolved_flag); db.session.commit()

    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token=D().csrf_token.current_token
    response = admin_client.post(url_for('admin.resolve_flag', flag_id=resolved_flag.id), data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"This flag has already been resolved." in response.data

def test_resolve_flag_csrf_missing(admin_client, db, create_test_user, create_test_post):
    """Test resolve flag POST with missing CSRF token."""
    flagger = create_test_user(username="flag_csrf_flagger", email="fcsrf@example.com")
    comment = Comment(text="Comment for CSRF resolve test", user_id=flagger.id, post_id=create_test_post().id)
    db.session.add(comment); db.session.commit()
    active_flag = CommentFlag(comment_id=comment.id, flagger_user_id=flagger.id, is_resolved=False)
    db.session.add(active_flag); db.session.commit()

    response = admin_client.post(url_for('admin.resolve_flag', flag_id=active_flag.id), data={})
    assert response.status_code == 400 # Direct CSRF failure
    db.session.refresh(active_flag) # Re-fetch from DB
    assert not active_flag.is_resolved # Should not have been resolved
