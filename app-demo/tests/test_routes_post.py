import pytest
from flask import url_for
from app-demo.models import User, Post, PostLike, Notification, Activity
from app-demo import db # db fixture from conftest.py
from app-demo.forms import LikeForm, UnlikeForm # Import forms

def test_like_post_route_authenticated(client, app, db, create_test_user, create_test_post, logged_in_client): # Added app
    """Test POST /post/<id>/like when authenticated."""
    # logged_in_client is already authenticated as 'loginuser'
    # We need the 'loginuser' object if we want to check its state, or create a new user for this test

    post_author = create_test_user(username="post_author_for_like_route", email="p_author_lr@example.com")
    test_post = create_test_post(author=post_author, content="A post to be liked via route")

    # Get the logged-in user (assuming logged_in_client logs in 'loginuser')
    liking_user = User.query.filter_by(username="loginuser").first()
    assert liking_user is not None

    assert not liking_user.has_liked_post(test_post)
    initial_like_count = test_post.like_count
    initial_notifications = Notification.query.filter_by(user_id=post_author.id).count()
    initial_activities = Activity.query.filter_by(user_id=liking_user.id, type='liked_post').count()

    with app.app_context(): # Ensure app context for form creation
        form = LikeForm()
        token = form.csrf_token.current_token

    response = client.post(url_for('post.like_post_route', post_id=test_post.id), data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200 # Assuming redirect to post view
    assert b'Post liked!' in response.data # Check flash message

    db.session.refresh(liking_user) # Refresh user from db session
    db.session.refresh(test_post)   # Refresh post from db session

    assert liking_user.has_liked_post(test_post)
    assert test_post.like_count == initial_like_count + 1

    # Check notification for post author (if not self-like)
    if post_author.id != liking_user.id:
        assert Notification.query.filter_by(user_id=post_author.id, type='new_like', target_id=test_post.id).count() == initial_notifications + 1

    # Check activity log for liking user
    assert Activity.query.filter_by(user_id=liking_user.id, type='liked_post', target_id=test_post.id).count() == initial_activities + 1

def test_unlike_post_route_authenticated(client, app, db, create_test_user, create_test_post, logged_in_client): # Added app
    """Test POST /post/<id>/unlike when authenticated."""
    post_author = create_test_user(username="post_author_for_unlike_route", email="p_author_ulr@example.com")
    test_post = create_test_post(author=post_author, content="A post to be unliked via route")
    liking_user = User.query.filter_by(username="loginuser").first() # User from logged_in_client

    # First, like the post
    liking_user.like_post(test_post)
    db.session.commit()
    assert liking_user.has_liked_post(test_post)
    initial_like_count = test_post.like_count

    with app.app_context(): # Ensure app context for form creation
        form = UnlikeForm()
        token = form.csrf_token.current_token

    response = client.post(url_for('post.unlike_post_route', post_id=test_post.id), data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Post unliked.' in response.data

    db.session.refresh(liking_user)
    db.session.refresh(test_post)

    assert not liking_user.has_liked_post(test_post)
    assert test_post.like_count == initial_like_count - 1
    # Note: Unliking typically doesn't create a notification or activity in this app's logic

def test_like_post_route_unauthenticated(client, create_test_post):
    """Test POST /post/<id>/like when not authenticated."""
    test_post = create_test_post(content="Post for unauth like test")
    response = client.post(url_for('post.like_post_route', post_id=test_post.id), follow_redirects=True)

    assert response.status_code == 200 # Redirects to login
    assert b'Please log in to access this page.' in response.data # Flash message from login_required

def test_like_already_liked_post_route(client, app, db, create_test_post, logged_in_client): # Added app
    """Test liking a post that is already liked by the user."""
    test_post = create_test_post(content="Post already liked test")
    liking_user = User.query.filter_by(username="loginuser").first()

    liking_user.like_post(test_post) # Like it first
    db.session.commit()

    initial_like_count = test_post.like_count
    with app.app_context(): # Ensure app context for form creation
        form = LikeForm()
        token = form.csrf_token.current_token

    response = client.post(url_for('post.like_post_route', post_id=test_post.id), data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'You have already liked this post.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == initial_like_count # Count should not change

def test_unlike_not_liked_post_route(client, app, create_test_post, logged_in_client, db): # Added app, db
    """Test unliking a post that was not liked."""
    test_post = create_test_post(content="Post not liked for unlike test")
    initial_like_count = test_post.like_count

    with app.app_context(): # Ensure app context for form creation
        form = UnlikeForm()
        token = form.csrf_token.current_token

    response = client.post(url_for('post.unlike_post_route', post_id=test_post.id), data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'You have not liked this post yet.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == initial_like_count

def test_like_nonexistent_post_route(client, logged_in_client):
    """Test liking a post that does not exist."""
    response = client.post(url_for('post.like_post_route', post_id=99999), data={'csrf_token': 'dummy_token_but_route_is_404'}, follow_redirects=False) # Don't follow redirects to check 404
    assert response.status_code == 404

def test_like_unpublished_post_route(client, app, db, create_test_user, logged_in_client): # Added app, removed create_test_post
    """Test liking an unpublished post (should be allowed if viewable, but typically not shown to others)."""
    post_author = create_test_user(username="unpublished_author", email="unpub@example.com")
    unpublished_post = Post(content="Unpublished", user_id=post_author.id, is_published=False)
    db.session.add(unpublished_post)
    db.session.commit()

    # The logged_in_client ('loginuser') is not the author. Route logic for like_post_route has:
    # if not post.is_published and post.user_id != current_user.id: abort(404)
    # This check happens before CSRF.
    with app.app_context():
        form = LikeForm()
        token_for_loginuser = form.csrf_token.current_token # Token for 'loginuser'

    response = client.post(url_for('post.like_post_route', post_id=unpublished_post.id), data={'csrf_token': token_for_loginuser}, follow_redirects=False)
    assert response.status_code == 404 # Because non-author cannot see/like unpublished post

    # Test if author can like their own unpublished post
    # Log out 'loginuser'
    client.get(url_for('auth.logout_route'), follow_redirects=True)

    # Log in as post_author
    login_resp = client.post(url_for('auth.login'), data={'username': 'unpub@example.com', 'password': 'password'}, follow_redirects=True)
    assert login_resp.status_code == 200
    # After login, the session is new, so we need a new CSRF token for this new session
    with app.app_context(): # New app context to get token for the new session
        form_author = LikeForm()
        token_for_author = form_author.csrf_token.current_token

    response_author_like = client.post(url_for('post.like_post_route', post_id=unpublished_post.id), data={'csrf_token': token_for_author}, follow_redirects=True)
    assert response_author_like.status_code == 200
    assert b'Post liked!' in response_author_like.data
    db.session.refresh(unpublished_post)
    assert unpublished_post.like_count == 1

    # Clean up by logging out the author if other tests expect 'loginuser'
    client.get(url_for('auth.logout_route'), follow_redirects=True) # Use GET for logout
    # Re-login the default test user ('loginuser') to ensure subsequent tests using logged_in_client are not affected
    # This is important if tests share client state in some way, though function-scoped fixtures should isolate.
    # However, if logged_in_client somehow reuses the same client instance without re-login, this ensures it.
    # A better way: logged_in_client fixture should always ensure 'loginuser' is logged in fresh.
    # The current logged_in_client fixture does create_test_user and then client.post to login.
    # So, this explicit re-login might be redundant if fixtures are properly scoped and isolated.
    # Let's assume for now logged_in_client fixture handles this isolation.


# New tests for CSRF protection

def test_like_post_csrf_missing_token(client, create_test_post, logged_in_client):
    """Test liking a post with a missing CSRF token."""
    test_post = create_test_post(content="CSRF missing token test for like")

    response = client.post(url_for('post.like_post_route', post_id=test_post.id), data={}, follow_redirects=True)

    assert response.status_code == 200 # Should redirect, then show page with flash
    assert b'Could not like post. Invalid request or session expired.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 0 # Like should not have occurred

def test_like_post_csrf_invalid_token(client, create_test_post, logged_in_client):
    """Test liking a post with an invalid CSRF token."""
    test_post = create_test_post(content="CSRF invalid token test for like")

    response = client.post(url_for('post.like_post_route', post_id=test_post.id), data={'csrf_token': 'thisisnotavalidtoken'}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Could not like post. Invalid request or session expired.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 0

def test_unlike_post_csrf_missing_token(client, app, db, create_test_post, logged_in_client):
    """Test unliking a post with a missing CSRF token."""
    test_post = create_test_post(content="CSRF missing token test for unlike")
    liking_user = User.query.filter_by(username="loginuser").first()

    # First, like the post legitimately
    with app.app_context():
        form = LikeForm()
        token = form.csrf_token.current_token
    client.post(url_for('post.like_post_route', post_id=test_post.id), data={'csrf_token': token}, follow_redirects=True)
    db.session.refresh(test_post)
    assert test_post.like_count == 1

    # Attempt to unlike without CSRF token
    response = client.post(url_for('post.unlike_post_route', post_id=test_post.id), data={}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Could not unlike post. Invalid request or session expired.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 1 # Unlike should not have occurred

def test_unlike_post_csrf_invalid_token(client, app, db, create_test_post, logged_in_client):
    """Test unliking a post with an invalid CSRF token."""
    test_post = create_test_post(content="CSRF invalid token test for unlike")
    liking_user = User.query.filter_by(username="loginuser").first()

    # Like the post legitimately
    with app.app_context():
        form = LikeForm()
        token = form.csrf_token.current_token
    client.post(url_for('post.like_post_route', post_id=test_post.id), data={'csrf_token': token}, follow_redirects=True)
    db.session.refresh(test_post)
    assert test_post.like_count == 1

    # Attempt to unlike with invalid CSRF token
    response = client.post(url_for('post.unlike_post_route', post_id=test_post.id), data={'csrf_token': 'thisisnotavalidtokeneither'}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Could not unlike post. Invalid request or session expired.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 1 # Unlike should not have occurred
