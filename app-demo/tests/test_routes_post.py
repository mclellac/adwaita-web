import pytest
from flask import url_for
from app-demo.models import User, Post, PostLike, Notification, Activity
from app-demo import db # db fixture from conftest.py

def test_like_post_route_authenticated(client, db, create_test_user, create_test_post, logged_in_client):
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

    response = client.post(url_for('post.like_post_route', post_id=test_post.id), follow_redirects=True)

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

def test_unlike_post_route_authenticated(client, db, create_test_user, create_test_post, logged_in_client):
    """Test POST /post/<id>/unlike when authenticated."""
    post_author = create_test_user(username="post_author_for_unlike_route", email="p_author_ulr@example.com")
    test_post = create_test_post(author=post_author, content="A post to be unliked via route")
    liking_user = User.query.filter_by(username="loginuser").first() # User from logged_in_client

    # First, like the post
    liking_user.like_post(test_post)
    db.session.commit()
    assert liking_user.has_liked_post(test_post)
    initial_like_count = test_post.like_count

    response = client.post(url_for('post.unlike_post_route', post_id=test_post.id), follow_redirects=True)

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

def test_like_already_liked_post_route(client, db, create_test_post, logged_in_client):
    """Test liking a post that is already liked by the user."""
    test_post = create_test_post(content="Post already liked test")
    liking_user = User.query.filter_by(username="loginuser").first()

    liking_user.like_post(test_post) # Like it first
    db.session.commit()

    initial_like_count = test_post.like_count
    response = client.post(url_for('post.like_post_route', post_id=test_post.id), follow_redirects=True)

    assert response.status_code == 200
    assert b'You have already liked this post.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == initial_like_count # Count should not change

def test_unlike_not_liked_post_route(client, create_test_post, logged_in_client):
    """Test unliking a post that was not liked."""
    test_post = create_test_post(content="Post not liked for unlike test")
    initial_like_count = test_post.like_count

    response = client.post(url_for('post.unlike_post_route', post_id=test_post.id), follow_redirects=True)

    assert response.status_code == 200
    assert b'You have not liked this post yet.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == initial_like_count

def test_like_nonexistent_post_route(client, logged_in_client):
    """Test liking a post that does not exist."""
    response = client.post(url_for('post.like_post_route', post_id=99999), follow_redirects=False) # Don't follow redirects to check 404
    assert response.status_code == 404

def test_like_unpublished_post_route(client, db, create_test_user, create_test_post, logged_in_client):
    """Test liking an unpublished post (should be allowed if viewable, but typically not shown to others)."""
    post_author = create_test_user(username="unpublished_author", email="unpub@example.com")
    unpublished_post = Post(content="Unpublished", user_id=post_author.id, is_published=False)
    db.session.add(unpublished_post)
    db.session.commit()

    # The logged_in_client is not the author. Route logic for like_post_route has:
    # if not post.is_published and post.user_id != current_user.id: abort(404)
    response = client.post(url_for('post.like_post_route', post_id=unpublished_post.id), follow_redirects=False)
    assert response.status_code == 404 # Because non-author cannot see/like unpublished post

    # Test if author can like their own unpublished post
    author_client = client # Need to log in as post_author
    client.post(url_for('auth.logout_route'), follow_redirects=True) # Log out current
    client.post(url_for('auth.login'), data={'username': 'unpub@example.com', 'password': 'password'}, follow_redirects=True)

    response_author_like = client.post(url_for('post.like_post_route', post_id=unpublished_post.id), follow_redirects=True)
    assert response_author_like.status_code == 200
    assert b'Post liked!' in response_author_like.data
    db.session.refresh(unpublished_post)
    assert unpublished_post.like_count == 1

    # Clean up by logging out the author if other tests expect 'loginuser'
    client.post(url_for('auth.logout_route'), follow_redirects=True)
    # Re-login the default test user if necessary for subsequent tests, or ensure tests are fully isolated.
    # The logged_in_client fixture does this per test that uses it.
    # For this test, we modified client's auth state. If other tests in the same file
    # use 'client' directly assuming it's 'loginuser', it might fail.
    # It's better if fixtures handle login state consistently or tests re-login if they change it.
    # The `logged_in_client` fixture should provide a fresh logged-in client for each test using it.
    # This test uses `client` directly after `logged_in_client` was used, so it's fine.
    # The modification of `client` state here is temporary for this test function.
    # To be super clean, this test should use its own client fixture or re-login 'loginuser'.
    # For now, this should work as pytest fixtures are re-evaluated if not session scoped.
    # `client` is function-scoped, `logged_in_client` is also function-scoped and uses `client`.
    # So, this is fine.
