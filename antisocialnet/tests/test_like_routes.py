import pytest
from flask import url_for, get_flashed_messages
from antisocialnet.models import User, Post, Comment, UserPhoto, Like, Notification, Activity
from antisocialnet import db # db here is the SQLAlchemy instance from __init__

# Helper to get a CSRF token from a page that includes a form
def get_csrf_token_from_response(response_data_bytes):
    import re
    match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', response_data_bytes.decode())
    return match.group(1) if match else None

@pytest.fixture
def test_user_1(db, create_test_user): # db fixture here is the transactional session provider
    return create_test_user(email_address="liker@example.com", full_name="Liker User")

@pytest.fixture
def test_user_2(db, create_test_user):
    return create_test_user(email_address="author@example.com", full_name="Author User")

@pytest.fixture
def test_post_by_user_2(db, test_user_2, create_test_post):
    return create_test_post(author=test_user_2, content="A post to be liked.")

@pytest.fixture
def test_comment_by_user_2(db, test_user_2, test_post_by_user_2):
    comment = Comment(text="A comment to be liked", user_id=test_user_2.id, post_id=test_post_by_user_2.id)
    db.session.add(comment)
    db.session.commit()
    return comment

@pytest.fixture
def test_photo_by_user_2(db, test_user_2):
    photo = UserPhoto(user_id=test_user_2.id, image_filename="test_gallery_image.jpg", caption="A photo to be liked")
    db.session.add(photo)
    db.session.commit()
    return photo


# --- Test Like Functionality ---

def test_like_post(client, test_user_1, test_post_by_user_2, db):
    # Login as test_user_1
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    # Like the post
    like_url = url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id)
    # Get a page that would contain a like form to extract CSRF token, e.g., the post page itself
    # For simplicity in this test, we assume the session CSRF is active.
    # Flask-WTF typically uses session-wide CSRF token.
    # If form-specific tokens are needed, the form needs to be rendered.
    # The LikeForm/UnlikeForm are empty, so their CSRF token is the global one.
    response = client.post(like_url, data={'csrf_token': get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_post_by_user_2.id)).data)}, follow_redirects=True)
    assert response.status_code == 200

    # Verify Like record
    like = Like.query.filter_by(user_id=test_user_1.id, target_type='post', target_id=test_post_by_user_2.id).first()
    assert like is not None
    assert test_post_by_user_2.like_count == 1

    # Verify Notification for post author (test_user_2)
    notification = Notification.query.filter_by(user_id=test_post_by_user_2.author.id, type='new_like', actor_id=test_user_1.id).first()
    assert notification is not None
    assert notification.target_type == 'post'
    assert notification.target_id == test_post_by_user_2.id

    # Verify Activity for liker (test_user_1)
    activity = Activity.query.filter_by(user_id=test_user_1.id, type='liked_item').first()
    assert activity is not None
    assert activity.target_type == 'post'
    assert activity.target_id == test_post_by_user_2.id

def test_like_comment(client, test_user_1, test_comment_by_user_2, db):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    like_url = url_for('like.like_item_route', target_type='comment', target_id=test_comment_by_user_2.id)
    response = client.post(like_url, data={'csrf_token': get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_comment_by_user_2.post_id)).data)}, follow_redirects=True)
    assert response.status_code == 200

    like = Like.query.filter_by(user_id=test_user_1.id, target_type='comment', target_id=test_comment_by_user_2.id).first()
    assert like is not None
    assert test_comment_by_user_2.like_count == 1

    notification = Notification.query.filter_by(user_id=test_comment_by_user_2.author.id, type='new_like', actor_id=test_user_1.id).first()
    assert notification is not None
    assert notification.target_type == 'comment'
    assert notification.target_id == test_comment_by_user_2.id

    activity = Activity.query.filter_by(user_id=test_user_1.id, type='liked_item', target_type='comment', target_id=test_comment_by_user_2.id).first()
    assert activity is not None

def test_like_photo(client, test_user_1, test_photo_by_user_2, db):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    like_url = url_for('like.like_item_route', target_type='photo', target_id=test_photo_by_user_2.id)
    # Assuming gallery page or photo detail page would have a form for CSRF
    response = client.post(like_url, data={'csrf_token': get_csrf_token_from_response(client.get(url_for('profile.view_gallery', user_id=test_photo_by_user_2.user_id)).data)}, follow_redirects=True)
    assert response.status_code == 200

    like = Like.query.filter_by(user_id=test_user_1.id, target_type='photo', target_id=test_photo_by_user_2.id).first()
    assert like is not None
    assert test_photo_by_user_2.like_count == 1

    notification = Notification.query.filter_by(user_id=test_photo_by_user_2.user.id, type='new_like', actor_id=test_user_1.id).first()
    assert notification is not None
    assert notification.target_type == 'photo'
    assert notification.target_id == test_photo_by_user_2.id

    activity = Activity.query.filter_by(user_id=test_user_1.id, type='liked_item', target_type='photo', target_id=test_photo_by_user_2.id).first()
    assert activity is not None

def test_like_item_unauthenticated(client, test_post_by_user_2):
    like_url = url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id)
    # Need CSRF token, but for unauthenticated, the like attempt itself should fail first.
    # However, POST requests without login will often redirect to login page.
    # The route is @login_required.
    response = client.post(like_url, data={'csrf_token': 'dummy_token_not_really_used_here'}, follow_redirects=False) # follow_redirects=False to catch the redirect
    assert response.status_code == 302 # Redirect to login
    assert url_for('auth.login') in response.location

    response = client.post(like_url, data={'csrf_token': 'dummy_token_not_really_used_here'}, follow_redirects=True) # Now follow
    assert b"Please log in to access this page." in response.data # Flash message from login_required

def test_like_invalid_target_type(client, test_user_1, test_post_by_user_2):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    like_url = url_for('like.like_item_route', target_type='invalidtype', target_id=test_post_by_user_2.id)
    response = client.post(like_url, data={'csrf_token': get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_post_by_user_2.id)).data)})
    assert response.status_code == 404 # Invalid target type should be a 404

def test_like_non_existent_item(client, test_user_1):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    like_url = url_for('like.like_item_route', target_type='post', target_id=99999) # Non-existent post
    # Need a valid page to get CSRF token from if forms are used, e.g. user's own profile or feed
    csrf_page_response = client.get(url_for('general.activity_feed')) # Assuming user is logged in
    csrf_token = get_csrf_token_from_response(csrf_page_response.data)
    assert csrf_token is not None

    response = client.post(like_url, data={'csrf_token': csrf_token})
    assert response.status_code == 404 # Non-existent item should be 404


# --- Test Unlike Functionality ---

def test_unlike_post(client, test_user_1, test_post_by_user_2, db):
    # First, user_1 likes the post
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    post_page_csrf = get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_post_by_user_2.id)).data)
    client.post(url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert test_post_by_user_2.like_count == 1
    original_like_count = Like.query.count()
    original_activity_count = Activity.query.count() # Notifications are not removed on unlike

    # Now, unlike the post
    unlike_url = url_for('like.unlike_item_route', target_type='post', target_id=test_post_by_user_2.id)
    response = client.post(unlike_url, data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert response.status_code == 200

    # Verify Like record is removed
    like = Like.query.filter_by(user_id=test_user_1.id, target_type='post', target_id=test_post_by_user_2.id).first()
    assert like is None
    assert test_post_by_user_2.like_count == 0
    assert Like.query.count() == original_like_count - 1
    # Activity for "liked_item" is usually not removed on unlike, but this depends on app logic.
    # Current implementation does not remove activity on unlike.
    assert Activity.query.count() == original_activity_count


def test_relike_post_does_not_duplicate_notifications_activities(client, test_user_1, test_post_by_user_2, db):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)

    post_page_csrf = get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_post_by_user_2.id)).data)

    # First like
    client.post(url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert test_post_by_user_2.like_count == 1
    assert Notification.query.count() == 1
    assert Activity.query.count() == 1

    # Unlike
    client.post(url_for('like.unlike_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert test_post_by_user_2.like_count == 0
    assert Notification.query.count() == 1 # Notifications are not deleted on unlike
    assert Activity.query.count() == 1    # Activities are not deleted on unlike

    # Re-like
    client.post(url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert test_post_by_user_2.like_count == 1
    # Notification and Activity should not be created again for the same user liking the same item again after unliking.
    # The Like model has a unique constraint on (user_id, target_type, target_id).
    # The like_item method in User model re-adds a Like if it doesn't exist.
    # The route logic for like_item_route creates Notification/Activity if current_user.like_item() returns True.
    # So, a new Notification and Activity will be created if the like was previously removed.
    # This might be desired behavior (e.g. to show re-engagement).
    # If not, the Notification/Activity creation logic would need to check for prior interactions.
    # Based on current code, it WILL create new Notification/Activity.
    assert Notification.query.count() == 2 # A new notification for the re-like
    assert Activity.query.count() == 2    # A new activity for the re-like

def test_attempt_to_like_already_liked_item(client, test_user_1, test_post_by_user_2, db):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)
    post_page_csrf = get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_post_by_user_2.id)).data)

    # First like
    client.post(url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert test_post_by_user_2.like_count == 1
    assert Notification.query.count() == 1
    assert Activity.query.count() == 1
    initial_like_id = Like.query.first().id

    # Attempt to like again
    response = client.post(url_for('like.like_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert response.status_code == 200
    messages = get_flashed_messages(with_categories=True, response=response) # Pass response to get_flashed_messages
    assert any(msg[1] == 'You have already liked this item.' for msg in messages)

    assert test_post_by_user_2.like_count == 1 # Count should not change
    assert Like.query.count() == 1 # No new Like object
    assert Like.query.first().id == initial_like_id # Same Like object
    assert Notification.query.count() == 1 # No new Notification
    assert Activity.query.count() == 1    # No new Activity

def test_attempt_to_unlike_unliked_item(client, test_user_1, test_post_by_user_2, db):
    client.post(url_for('auth.login'), data={'username': test_user_1.username, 'password': 'password', 'csrf_token': get_csrf_token_from_response(client.get(url_for('auth.login')).data)}, follow_redirects=True)
    post_page_csrf = get_csrf_token_from_response(client.get(url_for('post.view_post', post_id=test_post_by_user_2.id)).data)

    assert test_post_by_user_2.like_count == 0 # Initially unliked

    # Attempt to unlike
    response = client.post(url_for('like.unlike_item_route', target_type='post', target_id=test_post_by_user_2.id), data={'csrf_token': post_page_csrf}, follow_redirects=True)
    assert response.status_code == 200
    messages = get_flashed_messages(with_categories=True, response=response)
    assert any(msg[1] == 'You have not liked this item.' for msg in messages)

    assert test_post_by_user_2.like_count == 0 # Count should remain 0
    assert Like.query.count() == 0 # No Like object should exist or be created
