import pytest
from flask import url_for, session
from antisocialnet.models import User, Post, SiteSetting, Activity
from antisocialnet import db

def test_index_anonymous_no_posts(client, app):
    """Test anonymous access to index page when there are no posts."""
    with client.application.test_request_context():
        response = client.get(url_for('general.index'))
    assert response.status_code == 200
    assert b"Latest Updates" in response.data # From index.html title
    assert b"No Posts Yet" in response.data # Expected message if no posts

def test_index_anonymous_with_posts(client, app, create_test_user, create_test_post):
    """Test anonymous access to index page with some posts."""
    author = create_test_user(email_address="pai@example.com", full_name="post_author_index")
    post1 = create_test_post(author=author, content="Public Post 1 for Index", is_published=True)
    post2 = create_test_post(author=author, content="Unpublished Post for Index", is_published=False)

    with client.application.test_request_context():
        response = client.get(url_for('general.index'))
    assert response.status_code == 200
    assert b"Public Post 1 for Index" in response.data
    assert b"Unpublished Post for Index" not in response.data # Should not be shown

def test_index_authenticated_user(client, logged_in_client, create_test_post):
    """Test authenticated user access to index page."""
    # Behavior is same as anonymous for index; feed is separate
    create_test_post(content="Post for logged in index view", is_published=True)
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('general.index'))
    assert response.status_code == 200
    assert b"Latest Updates" in response.data
    assert b"Post for logged in index view" in response.data

def test_index_pagination(client, app, create_test_user, create_test_post):
    """Test pagination on the index page."""
    author = create_test_user(email_address="pga@example.com", full_name="pagination_author")

    with app.app_context():
        original_posts_per_page = app.config.get('POSTS_PER_PAGE', 10)
        # SiteSetting can override app.config['POSTS_PER_PAGE']
        # For testing, we can directly set the SiteSetting
        SiteSetting.set('posts_per_page', 2, 'int') # Set to 2 for easier testing
        db.session.commit() # SiteSetting.set commits, but good practice

    for i in range(5): # Create 5 posts
        create_test_post(author=author, content=f"Paginated Post {i+1}", is_published=True)

    with client.application.test_request_context():
        # Page 1
        response_p1 = client.get(url_for('general.index', page=1))
        assert response_p1.status_code == 200
        assert b"Paginated Post 5" in response_p1.data # Newest first
        assert b"Paginated Post 4" in response_p1.data
        assert b"Paginated Post 3" not in response_p1.data
        assert b"Next" in response_p1.data # Check for pagination controls

        # Page 2
        response_p2 = client.get(url_for('general.index', page=2))
        assert response_p2.status_code == 200
        assert b"Paginated Post 3" in response_p2.data
        assert b"Paginated Post 2" in response_p2.data
        assert b"Paginated Post 1" not in response_p2.data
        assert b"Previous" in response_p2.data
        assert b"Next" in response_p2.data

        # Page 3 (last page)
        response_p3 = client.get(url_for('general.index', page=3))
    assert response_p3.status_code == 200
    assert b"Paginated Post 1" in response_p3.data
    assert b"Paginated Post 2" not in response_p3.data # From page 2
    assert b"Previous" in response_p3.data
    assert b"Next" not in response_p3.data # No next page

    # Reset SiteSetting or rely on test isolation from init_database
    with app.app_context():
        # To be perfectly clean, remove the setting or set it back if it affects other tests
        # For now, init_database should clear SiteSetting table for next test.
        # Or, explicitly set it back:
        SiteSetting.set('posts_per_page', original_posts_per_page, 'int')
        db.session.commit()


# --- Dashboard Route Tests ---
def test_dashboard_authenticated(client, logged_in_client, create_test_post):
    """Test authenticated access to dashboard."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first() # Corrected username
    my_post = create_test_post(author=user, content="My dashboard post")
    other_post = create_test_post(content="Someone else's post") # By default_author from create_test_post

    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('general.dashboard'))
    assert response.status_code == 200
    assert b"Dashboard" in response.data
    assert b"My dashboard post" in response.data
    # Dashboard might show only user's posts or also other things.
    # Current dashboard template shows user's posts and some stats.
    # assert b"Someone else's post" not in response.data # If it only shows user's posts
    assert b"Your Posts" in response.data


def test_dashboard_unauthenticated(client):
    """Test unauthenticated access to dashboard redirects to login."""
    with client.application.test_request_context():
        response = client.get(url_for('general.dashboard'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Log In" in response.data
    assert b"Dashboard" not in response.data

# --- Activity Feed Route Tests ---
def test_activity_feed_authenticated_empty(client, logged_in_client):
    """Test activity feed for authenticated user when no activities exist."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('general.activity_feed'))
    assert response.status_code == 200
    assert b"Home" in response.data # Header title for feed
    # The feed page shows posts, not activities directly. Renamed from 'activity_feed' to 'feed' in general_routes
    # The template 'feed.html' shows "No Posts Yet" if no posts.
    assert b"No Posts Yet" in response.data

def test_activity_feed_authenticated_with_posts(client, logged_in_client, create_test_post):
    """Test activity feed (shows posts) for authenticated user."""
    create_test_post(content="A post for the feed", is_published=True)
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('general.activity_feed')) # general.activity_feed is the endpoint for /feed
    assert response.status_code == 200
    assert b"A post for the feed" in response.data
    assert b"No Posts Yet" not in response.data

def test_activity_feed_unauthenticated(client):
    """Test unauthenticated access to activity feed redirects to login."""
    with client.application.test_request_context():
        response = client.get(url_for('general.activity_feed'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Log In" in response.data

# --- Search Route Tests ---
def test_search_results_no_query(client):
    """Test search page with no query term."""
    with client.application.test_request_context():
        response = client.get(url_for('general.search_results'))
    assert response.status_code == 200
    assert b"Search Results" in response.data
    # Expect some message like "Please enter a search term" or just shows empty results.
    # Current template search_results.html shows "Search Results for """
    assert b"Search Results for \"\"" in response.data

def test_search_results_with_query_matches_posts(client, create_test_post, create_test_user):
    """Test search that matches post content."""
    author = create_test_user(email_address="search@example.com", full_name="search_author")
    post1 = create_test_post(author=author, content="Unique searchable keyword Alpha", is_published=True)
    post2 = create_test_post(author=author, content="Another post without the keyword", is_published=True)

    with client.application.test_request_context():
        response = client.get(url_for('general.search_results', q="Alpha"))
    assert response.status_code == 200
    assert b"Search Results for \"Alpha\"" in response.data
    assert b"Unique searchable keyword Alpha" in response.data
    assert b"Another post without the keyword" not in response.data

def test_search_results_with_query_matches_users(client, create_test_user):
    """Test search that matches username or full name."""
    user_alpha = create_test_user(email_address="alpha_u@example.com", full_name="Alpha Tester") # Changed: username to full_name for display consistency
    user_beta = create_test_user(email_address="beta_u@example.com", full_name="Beta User")

    with client.application.test_request_context():
        # Search by username (which is email)
        response_user = client.get(url_for('general.search_results', q="alpha_u@example.com"))
        assert response_user.status_code == 200
        assert b"Search Results for \"alpha_u@example.com\"" in response_user.data
        assert b"alpha_u@example.com" in response_user.data # Email/Username
        assert b"Alpha Tester" in response_user.data # Full name
        assert b"beta_u@example.com" not in response_user.data

        # Search by full name part
        response_fullname = client.get(url_for('general.search_results', q="Tester"))
    assert response_fullname.status_code == 200
    assert b"Search Results for \"Tester\"" in response_fullname.data
    assert b"Alpha Tester" in response_fullname.data
    assert b"Beta User" not in response_fullname.data # "Beta User" does not contain "Tester"

def test_search_results_no_matches(client):
    """Test search with a query term that matches nothing."""
    with client.application.test_request_context():
        response = client.get(url_for('general.search_results', q="qwertyuiopasdfghjkl"))
    assert response.status_code == 200
    assert b"Search Results for \"qwertyuiopasdfghjkl\"" in response.data
    assert b"No posts found matching your query." in response.data # Check for appropriate messages
    assert b"No users found matching your query." in response.data

# --- Settings Page (GET) ---
def test_settings_page_get_authenticated(client, logged_in_client, app):
    """Test authenticated GET access to settings page."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('general.settings_page'))
    assert response.status_code == 200
    assert b"Settings" in response.data
    assert b"Theme" in response.data
    assert b"Accent Color" in response.data

    # Check for admin site settings form if user is admin
    with app.app_context(): # Need app context to check current_user.is_admin
        # logged_in_client is 'loginuser', who is not admin by default
        # To test admin part, need an admin client.
        # For now, this test ensures non-admin does NOT see admin settings.
        assert b"Site Settings (Admin)" not in response.data

def test_settings_page_get_admin_sees_admin_settings(client, app, db, create_test_user):
    """Test admin GET access to settings page shows admin site settings form."""
    admin = create_test_user(email_address="setadmin@example.com", full_name="settingsadmin", is_admin=True)
    with app.app_context(): # For login and getting settings page
        from antisocialnet.forms import LoginForm
        form = LoginForm() # For CSRF token
        token = form.csrf_token.current_token
        login_url = url_for('auth.login')
        settings_url = url_for('general.settings_page')

    client.post(login_url, data={'username':admin.email, 'password':'password', 'csrf_token':token})

    response = client.get(settings_url)
    assert response.status_code == 200
    assert b"Settings" in response.data
    assert b"Site Settings (Admin)" in response.data
    assert b"Site Title" in response.data # Field from SiteSettingsForm

def test_settings_page_get_unauthenticated(client):
    """Test unauthenticated GET access to settings page."""
    with client.application.test_request_context():
        response = client.get(url_for('general.settings_page'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Log In" in response.data

# --- Save Theme/Accent Color Preferences (POST) ---
def test_save_theme_preference_successful(client, app, logged_in_client, db):
    """Test successfully saving theme preference."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first() # Corrected username
    assert user.theme != "dark" # Assuming default is not dark or it's system

    with app.app_context():
        from flask_wtf import FlaskForm
        class DummyCSRFForm(FlaskForm): pass
        dummy_form = DummyCSRFForm()
        csrf_token_val = dummy_form.csrf_token.current_token
        url = url_for('general.save_theme_preference')

    headers = {'X-CSRFToken': csrf_token_val, 'Content-Type': 'application/json'}
    payload = {'theme': 'dark'}
    # Use logged_in_client as it has an active session for CSRF validation
    response = logged_in_client.post(url, json=payload, headers=headers)

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    db.session.refresh(user)
    assert user.theme == 'dark'

def test_save_accent_color_preference_successful(client, app, logged_in_client, db):
    """Test successfully saving accent color preference."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first() # Corrected username
    assert user.accent_color != "red"

    with app.app_context():
        from flask_wtf import FlaskForm
        class DummyCSRFForm(FlaskForm): pass
        dummy_form = DummyCSRFForm()
        csrf_token_val = dummy_form.csrf_token.current_token
        url = url_for('general.save_accent_color_preference')

    headers = {'X-CSRFToken': csrf_token_val, 'Content-Type': 'application/json'}
    payload = {'accent_color': 'red'}
    response = logged_in_client.post(url, json=payload, headers=headers)

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    db.session.refresh(user)
    assert user.accent_color == 'red'

def test_save_theme_preference_invalid_theme(client, app, logged_in_client):
    """Test saving an invalid theme preference."""
    with app.app_context():
        from flask_wtf import FlaskForm
        form = FlaskForm() # Renamed to avoid conflict with outer scope 'form' if any test had it
        csrf_token_val = form.csrf_token.current_token
        url = url_for('general.save_theme_preference')
    headers = {'X-CSRFToken': csrf_token_val, 'Content-Type': 'application/json'}
    payload = {'theme': 'invalid_theme_name'}
    response = logged_in_client.post(url, json=payload, headers=headers)
    assert response.status_code == 400 # Bad request due to invalid theme
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Invalid theme selected' in json_data['message']

def test_save_theme_preference_csrf_missing_header(client, logged_in_client):
    """Test save theme without X-CSRFToken header."""
    headers = {'Content-Type': 'application/json'} # No X-CSRFToken
    payload = {'theme': 'dark'}
    with logged_in_client.application.test_request_context():
        url = url_for('general.save_theme_preference')
    response = logged_in_client.post(url, json=payload, headers=headers)
    assert response.status_code == 400 # CSRF validation should fail
    # Default Flask-WTF CSRF error is a simple text/html 400 response.
    # It might not be JSON unless specifically handled by a CSRF error handler.
    # The app has a default CSRF error handler that returns a generic 400 page.
    # The error message "The CSRF token is missing." is common.
    assert b"CSRF token missing" in response.data or b"Bad Request" in response.data


# --- robots.txt and favicon.ico ---
def test_robots_txt(client):
    """Test the robots.txt route."""
    with client.application.test_request_context():
        response = client.get(url_for('general.robots_txt'))
    assert response.status_code == 200
    assert response.mimetype == 'text/plain'
    assert b"User-agent: *" in response.data

def test_favicon_ico(client):
    """Test the favicon.ico route."""
    # This route serves a static file. If it doesn't exist, it will 404.
    # The test environment might not have the static file available if not configured.
    # Let's assume it should find it or a placeholder.
    # The app creates static/favicon.ico
    with client.application.test_request_context():
        url = url_for('general.favicon_ico')
    response = client.get(url) # Test the redirect itself first
    assert response.status_code == 302 # Redirect to static file

    # Follow the redirect to check the actual file serving
    with client.application.test_request_context(): # New context for the redirected URL
        response_redirect = client.get(url_for('general.favicon_ico'), follow_redirects=True)
    assert response_redirect.status_code == 200
    assert response_redirect.mimetype in ['image/vnd.microsoft.icon', 'image/x-icon']

# Placeholder for other general_routes tests if any emerge
# For example, error handlers (403, 404, 500) are in __init__.py but could be tested via general routes
# by forcing those errors if specific general routes could lead to them.
# However, error handlers are often tested separately or implicitly.
