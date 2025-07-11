import pytest
from flask import url_for
from antisocialnet.models import User, Post, UserPhoto, Like, Activity # Added Activity for potential future feed items
from antisocialnet import db
from datetime import datetime, timedelta, timezone

# Helper to create photos, similar to the one in test_photo_routes
def create_api_test_photo(db_session, user, filename_suffix="photo.jpg", caption="API Test Photo", days_offset=0):
    # Simpler filename for API tests, actual path construction is complex
    # The important part for feed is uploaded_at
    ts = datetime.now(timezone.utc) - timedelta(days=days_offset)
    photo = UserPhoto(
        user_id=user.id,
        image_filename=f"{user.id}_api_{filename_suffix}", # Simplified
        caption=caption,
        uploaded_at=ts
    )
    db_session.add(photo)
    db_session.commit()
    return photo

# Helper to create posts for API tests
def create_api_test_post(db_session, user, content="API Test Post Content", days_offset=0, is_published=True):
    ts = datetime.now(timezone.utc) - timedelta(days=days_offset)
    post = Post(
        user_id=user.id,
        content=content,
        created_at=ts, # Explicitly set for sorting
        published_at=ts if is_published else None,
        is_published=is_published
    )
    db_session.add(post)
    db_session.commit()
    return post

# --- API Feed Route (/api/v1/feed) Tests ---

def test_api_feed_unauthenticated(client):
    """Test GET /api/v1/feed when not authenticated."""
    with client.application.test_request_context('/'): # Ensure context for url_for
        url = url_for('api.get_feed')
        login_url = url_for('auth.login') # Also get login_url for assertion

    response = client.get(url)
    # Flask-Login usually redirects to login_view for web requests.
    # For API, it might return 401 if configured, or redirect if not AJAX.
    # Current setup: @login_required without specific API handling will likely redirect.
    # If it redirects to HTML login page, status code after redirect might be 200.
    # A true API would return 401.
    # Let's check for redirection to login.
    if response.status_code == 302: # Redirect
        response = client.get(response.location, follow_redirects=True)
        assert b"Please log in to access this page." in response.data # Flash message from login_required
    else:
        # If it's a direct 401 (ideal for API)
        assert response.status_code == 401
        # json_data = response.get_json()
        # assert json_data['message'] == "Unauthenticated" # Or similar

def test_api_feed_authenticated_empty(client, logged_in_client):
    """Test authenticated GET /api/v1/feed with no posts or photos."""
    response = logged_in_client.get(url_for('api.get_feed'))
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['items'] == []
    assert json_data['pagination']['total_items'] == 0
    assert json_data['pagination']['total_pages'] == 0

def test_api_feed_with_only_posts(client, logged_in_client, db, create_test_user):
    """Test API feed when only posts exist."""
    author = create_test_user(email_address="aposta@example.com", full_name="API Post Author")
    post1 = create_api_test_post(db, author, content="API Post 1", days_offset=1) # Older
    post2 = create_api_test_post(db, author, content="API Post 2", days_offset=0) # Newer

    response = logged_in_client.get(url_for('api.get_feed'))
    assert response.status_code == 200
    json_data = response.get_json()

    assert len(json_data['items']) == 2
    assert json_data['pagination']['total_items'] == 2

    # Check order (newest first)
    assert json_data['items'][0]['type'] == 'post'
    assert json_data['items'][0]['data']['post_id'] == post2.id
    assert json_data['items'][0]['actor']['username'] == author.username

    assert json_data['items'][1]['type'] == 'post'
    assert json_data['items'][1]['data']['post_id'] == post1.id

    # Check structure of a post item
    item_data = json_data['items'][0]['data']
    assert 'title' in item_data # Even if None for posts
    assert 'content_html_preview' in item_data
    assert 'comment_count' in item_data
    assert 'like_count' in item_data
    assert 'url' in item_data
    assert 'categories' in item_data
    assert 'tags' in item_data
    assert 'is_liked_by_current_user' in item_data

def test_api_feed_with_only_photos(client, logged_in_client, db, create_test_user):
    """Test API feed when only photos exist."""
    uploader = create_test_user(email_address="aphou@example.com", full_name="API Photo Uploader")
    photo1 = create_api_test_photo(db, uploader, caption="API Photo 1", days_offset=2) # Oldest
    photo2 = create_api_test_photo(db, uploader, caption="API Photo 2", days_offset=0) # Newest

    response = logged_in_client.get(url_for('api.get_feed'))
    assert response.status_code == 200
    json_data = response.get_json()

    assert len(json_data['items']) == 2
    assert json_data['pagination']['total_items'] == 2

    assert json_data['items'][0]['type'] == 'photo'
    assert json_data['items'][0]['data']['photo_id'] == photo2.id
    assert json_data['items'][0]['actor']['username'] == uploader.username

    assert json_data['items'][1]['type'] == 'photo'
    assert json_data['items'][1]['data']['photo_id'] == photo1.id

    # Check structure of a photo item
    item_data = json_data['items'][0]['data']
    assert 'caption_html' in item_data
    assert 'image_url_large' in item_data
    assert 'comment_count' in item_data
    assert 'gallery_url' in item_data

def test_api_feed_mixed_content_sorted_correctly(client, logged_in_client, db, create_test_user):
    """Test API feed with mixed posts and photos, ensuring correct chronological order."""
    user1 = create_test_user(email_address="mix1@example.com", full_name="Mixer User 1")
    user2 = create_test_user(email_address="mix2@example.com", full_name="Mixer User 2")

    # Create items with varying timestamps
    # Newest
    post_new = create_api_test_post(db, user1, content="Very new post", days_offset=0)
    # Middle
    photo_mid = create_api_test_photo(db, user2, caption="Middle photo", days_offset=1)
    # Oldest
    post_old = create_api_test_post(db, user1, content="Older post", days_offset=2)

    response = logged_in_client.get(url_for('api.get_feed'))
    assert response.status_code == 200
    json_data = response.get_json()

    assert len(json_data['items']) == 3
    assert json_data['items'][0]['id'] == f"post_{post_new.id}"
    assert json_data['items'][1]['id'] == f"photo_{photo_mid.id}"
    assert json_data['items'][2]['id'] == f"post_{post_old.id}"

def test_api_feed_pagination(client, app, logged_in_client, db, create_test_user):
    """Test pagination for the API feed."""
    user = create_test_user(email_address="apage@example.com", full_name="API Pager")

    # Override POSTS_PER_PAGE for this test via app config directly (SiteSetting not used by API for per_page)
    # The API route uses app.config.get('POSTS_PER_PAGE', 10) as default per_page
    with app.app_context():
        # This modification of app.config might not affect already running app from fixture.
        # It's better if the API route allows 'per_page' as a query param.
        # The route does: per_page = request.args.get('per_page', current_app.config.get('POSTS_PER_PAGE', 10), type=int)
        # So we can pass it as a query param.
        pass

    num_items = 5
    for i in range(num_items):
        create_api_test_post(db, user, content=f"Feed Item {i}", days_offset=i) # Creates items with decreasing newness

    # Test with per_page=2
    response_p1 = logged_in_client.get(url_for('api.get_feed', page=1, per_page=2))
    json_p1 = response_p1.get_json()
    assert len(json_p1['items']) == 2
    assert json_p1['items'][0]['data']['content_html_preview'].startswith(b"Feed Item 0") # Newest (days_offset=0)
    assert json_p1['pagination']['page'] == 1
    assert json_p1['pagination']['per_page'] == 2
    assert json_p1['pagination']['total_items'] == num_items
    assert json_p1['pagination']['total_pages'] == 3 # 5 items, 2 per page = 3 pages
    assert json_p1['pagination']['has_next'] == True
    assert json_p1['pagination']['has_prev'] == False
    with app.app_context(): # Ensure context for url_for in assertion
        assert url_for('api.get_feed', page=2, per_page=2, _external=True) in json_p1['pagination']['next_page_url']

    response_p3 = logged_in_client.get(url_for('api.get_feed', page=3, per_page=2))
    json_p3 = response_p3.get_json()
    assert len(json_p3['items']) == 1 # Last page has 1 item
    assert json_p3['items'][0]['data']['content_html_preview'].startswith(b"Feed Item 4") # Oldest (days_offset=4)
    assert json_p3['pagination']['page'] == 3
    assert json_p3['pagination']['has_next'] == False
    assert json_p3['pagination']['has_prev'] == True
    with app.app_context(): # Ensure context for url_for in assertion
        assert url_for('api.get_feed', page=2, per_page=2, _external=True) in json_p3['pagination']['prev_page_url']

def test_api_feed_post_liked_by_current_user(client, logged_in_client, db, create_test_user):
    """Test that 'is_liked_by_current_user' is correctly set for posts in the feed."""
    post_author = create_test_user(email_address="la@example.com", full_name="Likable Author")
    test_post = create_api_test_post(db, post_author, content="A post to be liked.")

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first() # This is logged_in_client

    # Scenario 1: Post not liked
    response_not_liked = logged_in_client.get(url_for('api.get_feed'))
    json_not_liked = response_not_liked.get_json()
    assert json_not_liked['items'][0]['data']['post_id'] == test_post.id
    assert json_not_liked['items'][0]['data']['is_liked_by_current_user'] == False

    # Scenario 2: Post liked by current user
    like = PostLike(user_id=liking_user.id, post_id=test_post.id)
    db.session.add(like)
    db.session.commit()

    response_liked = logged_in_client.get(url_for('api.get_feed'))
    json_liked = response_liked.get_json()
    assert json_liked['items'][0]['data']['post_id'] == test_post.id
    assert json_liked['items'][0]['data']['is_liked_by_current_user'] == True

# No POST/PUT/DELETE in api_routes.py currently, so no CSRF tests for those.
# GET requests are generally not CSRF protected.
