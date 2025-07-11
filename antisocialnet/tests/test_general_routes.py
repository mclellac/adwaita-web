import pytest
from flask import url_for, session
from antisocialnet.models import User, Post, SiteSetting, Activity
from antisocialnet import db
import re # Added for CSRF token extraction

def test_index_anonymous_no_posts(client, app, db): # Added db fixture
    """Test anonymous access to index page when there are no posts."""
    # Ensure no posts exist from previous tests
    Post.query.delete()
    db.session.commit()
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
        response = logged_in_client.get(url_for('general.index'), follow_redirects=False) # Check direct response
    assert response.status_code == 302 # Should redirect
    # Ensure consistent comparison by checking endswith or using _external=True for url_for
    with logged_in_client.application.test_request_context(): # For url_for to pick up SERVER_NAME if set
        expected_location = url_for('general.activity_feed', _external=False) # Get relative path
    assert response.location.endswith(expected_location)


    # Optionally, test the page it redirects to:
    response_followed = logged_in_client.get(url_for('general.index'), follow_redirects=True)
    assert response_followed.status_code == 200
    assert b"Home" in response_followed.data # Assuming 'Home' is title of activity_feed
    # The post created might or might not be on the feed depending on feed logic
    # For now, just checking the redirect and target page status/title is enough.

def test_index_pagination(client, app, db, create_test_user, create_test_post): # Added db
    """Test pagination on the index page."""
    # Ensure clean slate for posts
    Post.query.delete()
    db.session.commit()

    author = create_test_user(email_address="pga@example.com", full_name="pagination_author")

    with app.app_context():
        original_posts_per_page = app.config.get('POSTS_PER_PAGE', 10)
        app.config['POSTS_PER_PAGE'] = 2 # Set to 2 for easier testing
        # The index route currently does not use SiteSetting for posts_per_page for anonymous users.
        # SiteSetting.set('posts_per_page', 2, 'int')
        # db.session.commit()

    for i in range(5): # Create 5 posts
        create_test_post(author=author, content=f"Paginated Post {i+1}", is_published=True)

    with client.application.test_request_context():
        # Page 1
        response_p1 = client.get(url_for('general.index', page=1))
        assert response_p1.status_code == 200
        assert b"Paginated Post 5" in response_p1.data # Newest first
        assert b"Paginated Post 4" in response_p1.data
        assert b"Paginated Post 3" not in response_p1.data
        assert b"icon-actions-go-next-symbolic" in response_p1.data # Check for next icon

        # Page 2
        response_p2 = client.get(url_for('general.index', page=2))
        assert response_p2.status_code == 200
        assert b"Paginated Post 3" in response_p2.data
        assert b"Paginated Post 2" in response_p2.data
        assert b"Paginated Post 1" not in response_p2.data
        assert b"icon-actions-go-previous-symbolic" in response_p2.data # Check for prev icon
        assert b"icon-actions-go-next-symbolic" in response_p2.data # Check for next icon

        # Page 3 (last page)
        response_p3 = client.get(url_for('general.index', page=3))
    assert response_p3.status_code == 200
    assert b"Paginated Post 1" in response_p3.data
    assert b"Paginated Post 2" not in response_p3.data # From page 2
    assert b"icon-actions-go-previous-symbolic" in response_p3.data # Check for prev icon
    # Check for the disabled next button on the last page
    assert b'<button class="adw-button" disabled><span class="adw-icon icon-actions-go-next-symbolic"></span></button>' in response_p3.data
    # Ensure the active link for next is NOT present
    next_page_link_html = f'<a href="{url_for("general.index", page=4)}" class="adw-button"><span class="adw-icon icon-actions-go-next-symbolic"></span></a>'.encode()
    assert next_page_link_html not in response_p3.data


    # Reset SiteSetting or rely on test isolation from init_database
    with app.app_context():
        # Restore original config value
        app.config['POSTS_PER_PAGE'] = original_posts_per_page
        # SiteSetting.set('posts_per_page', original_posts_per_page, 'int')
        # db.session.commit()


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
    assert b"My Posts Dashboard" in response.data # Title of the dashboard page


def test_dashboard_unauthenticated(client):
    """Test unauthenticated access to dashboard redirects to login."""
    with client.application.test_request_context():
        response = client.get(url_for('general.dashboard'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Login" in response.data # Check for "Login" page title/header
    assert b"Dashboard" not in response.data

# --- Activity Feed Route Tests ---
def test_activity_feed_authenticated_empty(client, logged_in_client, db): # Added db fixture
    """Test activity feed for authenticated user when no activities exist."""
    # Ensure no posts exist from previous tests
    Post.query.delete()
    Activity.query.delete() # Feed might also show activities
    db.session.commit()
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
    assert b"Login" in response.data # Check for "Login" page title/header

# --- Search Route Tests ---
def test_search_results_no_query(client):
    """Test search page with no query term."""
    with client.application.test_request_context():
        response = client.get(url_for('general.search_results'))
    assert response.status_code == 200
    print(f"DEBUG: test_search_results_no_query response data for title: {response.data.decode()[:500]}") # Debug print
    # More basic check for title tag presence and then specific content
    assert b"<title>" in response.data
    # Account for newlines and spacing revealed by debug print
    assert b"Search\n - Test Site</title>" in response.data
    # Check H2 header on the page for no query
    assert b"Search Content and Users" in response.data
    # Check specific message for no query
    assert b"Please enter a term in the search bar" in response.data


def test_search_results_with_query_matches_posts(client, create_test_post, create_test_user):
    """Test search that matches post content."""
    author = create_test_user(email_address="search@example.com", full_name="search_author")
    post1 = create_test_post(author=author, content="Unique searchable keyword Alpha", is_published=True)
    post2 = create_test_post(author=author, content="Another post without the keyword", is_published=True)

    with client.application.test_request_context():
        response = client.get(url_for('general.search_results', q="Alpha"))
    assert response.status_code == 200
    assert b"Results for 'Alpha'" in response.data # Check header title
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
        assert b"Results for 'alpha_u@example.com'" in response_user.data # Check header title
        assert b"alpha_u@example.com" in response_user.data # Email/Username
        assert b"Alpha Tester" in response_user.data # Full name
        assert b"beta_u@example.com" not in response_user.data

        # Search by full name part
        response_fullname = client.get(url_for('general.search_results', q="Tester"))
    assert response_fullname.status_code == 200
    assert b"Results for 'Tester'" in response_fullname.data # Check header title
    assert b"Alpha Tester" in response_fullname.data
    assert b"Beta User" not in response_fullname.data # "Beta User" does not contain "Tester"

def test_search_results_no_matches(client):
    """Test search with a query term that matches nothing."""
    with client.application.test_request_context():
        response = client.get(url_for('general.search_results', q="qwertyuiopasdfghjkl"))
    assert response.status_code == 200
    print(f"DEBUG: test_search_results_no_matches response data for title: {response.data.decode()[:500]}") # Debug print
    # Check page title - focusing on the unique part from page_title block
    assert b"<title>Search Results for 'qwertyuiopasdfghjkl'" in response.data # Check start
    assert b"Search Results for 'qwertyuiopasdfghjkl'</title>" in response.data # Check it ends properly if no site title
    # Check header title on page
    assert b"Results for 'qwertyuiopasdfghjkl'" in response.data
    # Check for specific messages
    assert b"No posts found matching 'qwertyuiopasdfghjkl'." in response.data
    assert b"No users found matching 'qwertyuiopasdfghjkl'." in response.data

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

    # Log in the admin user properly
    login_url = url_for('auth.login')
    # Get CSRF token from the login page
    get_response = client.get(login_url)
    assert get_response.status_code == 200
    csrf_token_match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', get_response.data.decode())
    assert csrf_token_match, "CSRF token not found in login page"
    csrf_token_val = csrf_token_match.group(1)

    login_response = client.post(login_url, data={
        'username': admin.username, # admin.email is admin.username
        'password': 'password', # Assuming default password from create_test_user
        'csrf_token': csrf_token_val
    }, follow_redirects=True)
    assert login_response.status_code == 200
    assert b"Logged in successfully." in login_response.data

    # Now access the settings page with the logged-in admin client
    with client.application.test_request_context(): # Context for url_for
        settings_url = url_for('general.settings_page')
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
    assert b"Login" in response.data # Check for "Login" page title/header

# --- Save Theme/Accent Color Preferences (POST) ---
def test_save_theme_preference_successful(client, app, logged_in_client, db):
    """Test successfully saving theme preference."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert user is not None, "Fixture user not found"
    original_theme = user.theme
    new_theme_to_set = "dark"
    if original_theme == new_theme_to_set: # Ensure we are actually changing the theme
        new_theme_to_set = "light" if new_theme_to_set == "dark" else "dark" # toggle
    assert user.theme != new_theme_to_set

    # Get CSRF token from a page the logged_in_client can access
    # The settings page itself is a good candidate as it's CSRF protected.
    settings_page_url = url_for('general.settings_page')
    get_response = logged_in_client.get(settings_page_url)
    assert get_response.status_code == 200
    csrf_token_match = re.search(r'name="csrf-token" content="([^"]+)"', get_response.data.decode())
    if not csrf_token_match: # Fallback if meta tag not found, check for hidden input
        csrf_token_match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', get_response.data.decode())
    assert csrf_token_match, "CSRF token not found in settings page"
    csrf_token_val = csrf_token_match.group(1)

    with logged_in_client.application.test_request_context(): # context for url_for
        url = url_for('general.save_theme_preference')

    headers = {'X-CSRFToken': csrf_token_val, 'Content-Type': 'application/json'}
    payload = {'theme': new_theme_to_set}
    response = logged_in_client.post(url, json=payload, headers=headers)

    assert response.status_code == 200, f"API call failed: {response.data.decode()}"
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    db.session.refresh(user)
    assert user.theme == 'dark'

def test_save_accent_color_preference_successful(client, app, logged_in_client, db):
    """Test successfully saving accent color preference."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert user is not None, "Fixture user not found"
    original_accent = user.accent_color
    new_accent_to_set = "red"
    if original_accent == new_accent_to_set:
        new_accent_to_set = "green" # pick another valid one
    assert user.accent_color != new_accent_to_set

    # Get CSRF token from settings page
    settings_page_url = url_for('general.settings_page')
    get_response = logged_in_client.get(settings_page_url)
    assert get_response.status_code == 200
    csrf_token_match = re.search(r'name="csrf-token" content="([^"]+)"', get_response.data.decode())
    if not csrf_token_match:
        csrf_token_match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', get_response.data.decode())
    assert csrf_token_match, "CSRF token not found in settings page"
    csrf_token_val = csrf_token_match.group(1)

    with logged_in_client.application.test_request_context(): # context for url_for
        url = url_for('general.save_accent_color_preference')

    headers = {'X-CSRFToken': csrf_token_val, 'Content-Type': 'application/json'}
    payload = {'accent_color': new_accent_to_set}
    response = logged_in_client.post(url, json=payload, headers=headers)

    assert response.status_code == 200, f"API call failed: {response.data.decode()}"
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    db.session.refresh(user)
    assert user.accent_color == 'red'

def test_save_theme_preference_invalid_theme(client, app, logged_in_client):
    """Test saving an invalid theme preference."""
    # Get CSRF token
    settings_page_url = url_for('general.settings_page')
    get_response = logged_in_client.get(settings_page_url)
    assert get_response.status_code == 200
    csrf_token_match = re.search(r'name="csrf-token" content="([^"]+)"', get_response.data.decode())
    if not csrf_token_match:
        csrf_token_match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', get_response.data.decode())
    assert csrf_token_match, "CSRF token not found in settings page"
    csrf_token_val = csrf_token_match.group(1)

    with logged_in_client.application.test_request_context(): # context for url_for
        url = url_for('general.save_theme_preference')

    headers = {'X-CSRFToken': csrf_token_val, 'Content-Type': 'application/json'}
    payload = {'theme': 'invalid_theme_name'}
    response = logged_in_client.post(url, json=payload, headers=headers)

    assert response.status_code == 400, f"API call did not return 400: {response.data.decode()}" # Bad request due to invalid theme
    json_data = response.get_json()
    assert json_data is not None, "Response was not JSON"
    assert json_data['status'] == 'error'
    # The message from the route is 'Invalid theme value'
    assert 'Invalid theme value' in json_data['message']

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
        # Test the new direct route general.favicon
        url = url_for('general.favicon') # Corrected endpoint name
    response = client.get(url) # Should serve directly, not redirect
    assert response.status_code == 200
    # Check the mimetype of the served file
    # This assumes a real .ico file is present in static/favicon.ico
    # If it's a placeholder text file for testing, mimetype might be text/plain
    assert response.mimetype in ['image/vnd.microsoft.icon', 'image/x-icon', 'image/x.ico', 'text/plain']


# Placeholder for other general_routes tests if any emerge
# For example, error handlers (403, 404, 500) are in __init__.py but could be tested via general routes
# by forcing those errors if specific general routes could lead to them.
# However, error handlers are often tested separately or implicitly.
