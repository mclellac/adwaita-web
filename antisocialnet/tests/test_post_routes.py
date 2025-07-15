import pytest
from flask import url_for
from antisocialnet.models import User, Post, Like, Notification, Activity, Comment, CommentFlag, Category, Tag # Updated PostLike to Like
from antisocialnet import db # db fixture from conftest.py
from antisocialnet.forms import (
    LikeForm, UnlikeForm, PostForm, CommentForm,
    DeletePostForm, DeleteCommentForm, FlagCommentForm
)

def test_like_item_route_for_post_authenticated(client, app, db, create_test_user, create_test_post, logged_in_client): # Added app, renamed test
    """Test POST /like/post/<id> when authenticated."""
    # logged_in_client is already authenticated as 'login_fixture_user@example.com'

    post_author = create_test_user(email_address="p_author_lr@example.com", full_name="post_author_for_like_route")
    test_post = create_test_post(author=post_author, content="A post to be liked via route")

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert liking_user is not None

    assert not liking_user.has_liked_item('post', test_post.id) # Updated method
    initial_like_count = test_post.like_count
    initial_notifications = Notification.query.filter_by(user_id=post_author.id, type='new_like', target_type='post', target_id=test_post.id).count()
    initial_activities = Activity.query.filter_by(user_id=liking_user.id, type='liked_item', target_type='post', target_id=test_post.id).count() # Updated type

    with logged_in_client.application.test_request_context(): # For CSRF and url_for
        form = LikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='post', target_id=test_post.id) # Updated route

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True) # Use logged_in_client for session

    assert response.status_code == 200 # Assuming redirect to post view
    assert b'Post liked!' in response.data # Check flash message (route specific)

    db.session.refresh(liking_user) # Refresh user from db session
    db.session.refresh(test_post)   # Refresh post from db session

    assert liking_user.has_liked_item('post', test_post.id) # Updated method
    assert test_post.like_count == initial_like_count + 1

    # Check notification for post author (if not self-like)
    if post_author.id != liking_user.id:
        assert Notification.query.filter_by(user_id=post_author.id, type='new_like', target_type='post', target_id=test_post.id).count() == initial_notifications + 1

    # Check activity log for liking user
    assert Activity.query.filter_by(user_id=liking_user.id, type='liked_item', target_type='post', target_id=test_post.id).count() == initial_activities + 1 # Updated type

def test_unlike_item_route_for_post_authenticated(client, app, db, create_test_user, create_test_post, logged_in_client): # Added app, renamed test
    """Test POST /like/unlike/post/<id> when authenticated."""
    post_author = create_test_user(email_address="p_author_ulr@example.com", full_name="post_author_for_unlike_route")
    test_post = create_test_post(author=post_author, content="A post to be unliked via route")
    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first() # User from logged_in_client

    # First, like the item
    liking_user.like_item('post', test_post.id) # Updated method
    db.session.commit()
    assert liking_user.has_liked_item('post', test_post.id) # Updated method
    initial_like_count = test_post.like_count

    with logged_in_client.application.test_request_context(): # For CSRF and url_for
        form = UnlikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.unlike_item_route', target_type='post', target_id=test_post.id) # Updated route

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True) # Use logged_in_client for session

    assert response.status_code == 200
    assert b'Post unliked.' in response.data # Flash message from new route

    db.session.refresh(liking_user)
    db.session.refresh(test_post)

    assert not liking_user.has_liked_item('post', test_post.id) # Updated method
    assert test_post.like_count == initial_like_count - 1
    # Note: Unliking typically doesn't create a notification or activity in this app's logic

def test_like_item_route_for_post_unauthenticated(client, create_test_post): # Renamed test
    """Test POST /like/post/<id> when not authenticated."""
    test_post = create_test_post(content="Post for unauth like test")
    with client.application.test_request_context():
        url = url_for('like.like_item_route', target_type='post', target_id=test_post.id) # Updated route
    response = client.post(url, data={'csrf_token':'dummy'}, follow_redirects=True) # Added dummy CSRF to pass form validation if it's checked before auth

    assert response.status_code == 200 # Redirects to login
    assert b'Please log in to access this page.' in response.data # Flash message from login_required

def test_like_already_liked_item_route_for_post(client, app, db, create_test_post, logged_in_client): # Added app, renamed test
    """Test liking a post (item) that is already liked by the user."""
    test_post = create_test_post(content="Post already liked test")
    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()

    liking_user.like_item('post', test_post.id) # Like it first - Updated method
    db.session.commit()

    initial_like_count = test_post.like_count
    with logged_in_client.application.test_request_context(): # For CSRF and url_for
        form = LikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='post', target_id=test_post.id) # Updated route

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True) # Use logged_in_client

    assert response.status_code == 200
    assert b'You have already liked this item.' in response.data # Updated flash message from generic route
    db.session.refresh(test_post)
    assert test_post.like_count == initial_like_count # Count should not change

def test_unlike_not_liked_item_route_for_post(client, app, create_test_post, logged_in_client, db): # Added app, db, renamed test
    """Test unliking a post (item) that was not liked."""
    test_post = create_test_post(content="Post not liked for unlike test")
    initial_like_count = test_post.like_count

    with logged_in_client.application.test_request_context(): # For CSRF and url_for
        form = UnlikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.unlike_item_route', target_type='post', target_id=test_post.id) # Updated route

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True) # Use logged_in_client

    assert response.status_code == 200
    assert b'You have not liked this item yet.' in response.data # Updated flash message
    db.session.refresh(test_post)
    assert test_post.like_count == initial_like_count

def test_like_item_route_for_nonexistent_post(client, logged_in_client, app): # Renamed test, added app
    """Test liking a post (item) that does not exist."""
    with app.app_context(): # Using app.app_context for url_for if client's context is tricky
        # form = LikeForm() # For CSRF, if needed before 404
        # token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='post', target_id=99999) # Updated route
    # The new route checks CSRF first. So, a valid token is needed even if item doesn't exist.
    # However, if the item doesn't exist, it might 404 before full form validation, depending on route structure.
    # The new route validates CSRF then target_type then fetches item.
    # For a truly non-existent item, it will 404 after CSRF and target_type check.
    # We need a CSRF token.
    with logged_in_client.application.test_request_context():
        form = LikeForm()
        token = form.csrf_token.current_token
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=False)
    assert response.status_code == 404 # Or could be 400 if CSRF fails and that's prioritized. New route makes it 404.

def test_like_item_route_for_unpublished_post(client, app, db, create_test_user, logged_in_client): # Renamed test
    """Test liking an unpublished post (item)."""
    post_author = create_test_user(email_address="unpub@example.com", full_name="unpublished_author")
    unpublished_post = Post(content="Unpublished", user_id=post_author.id, is_published=False)
    db.session.add(unpublished_post)
    db.session.commit()

    # The logged_in_client ('login_fixture_user@example.com') is not the author.
    like_url = None
    logout_url = None
    login_url = None
    with logged_in_client.application.test_request_context(): # For CSRF and url_for
        form = LikeForm()
        token_for_loginuser = form.csrf_token.current_token
        like_url = url_for('like.like_item_route', target_type='post', target_id=unpublished_post.id) # Updated route
        logout_url = url_for('auth.logout') # Corrected endpoint name
        login_url = url_for('auth.login')

    response = logged_in_client.post(like_url, data={'csrf_token': token_for_loginuser}, follow_redirects=False)
    # The new route checks if post is published. If not, and user is not author, it aborts (404 or 403).
    # The like_item_route has:
    # if target_item:
    #     if not target_item.is_published and target_item.user_id != current_user.id:
    #         abort(404) # Or 403
    assert response.status_code == 404

    # Test if author can like their own unpublished post
    logged_in_client.get(logout_url, follow_redirects=True)

    csrf_login_author = None
    with app.app_context(): # For CSRF for login
        # Re-initialize a form in the current app context to get a valid token for this login attempt
        login_form_for_author_session = LikeForm() # Can use any form for CSRF token generation
        csrf_login_author = login_form_for_author_session.csrf_token.current_token
    login_resp = client.post(login_url, data={'username': post_author.username, 'password': 'password', 'csrf_token': csrf_login_author}, follow_redirects=True)
    assert login_resp.status_code == 200
    # After this, 'client' is now authenticated as post_author

    token_for_author_like = None
    with client.application.test_request_context(): # Use client's context for new session
        form_author_like = LikeForm()
        token_for_author_like = form_author_like.csrf_token.current_token
        # like_url was defined above and is still correct

    response_author_like = client.post(like_url, data={'csrf_token': token_for_author_like}, follow_redirects=True)
    assert response_author_like.status_code == 200
    assert b'Post liked!' in response_author_like.data # Message from like_item_route
    db.session.refresh(unpublished_post)
    assert unpublished_post.like_count == 1

    # Clean up by logging out the author if other tests expect 'loginuser'
    client.get(logout_url, follow_redirects=True) # Use GET for logout
    # Re-login the default test user ('loginuser') to ensure subsequent tests using logged_in_client are not affected
    # This is important if tests share client state in some way, though function-scoped fixtures should isolate.
    # However, if logged_in_client somehow reuses the same client instance without re-login, this ensures it.
    # A better way: logged_in_client fixture should always ensure 'loginuser' is logged in fresh.
    # The current logged_in_client fixture does create_test_user and then client.post to login.
    # So, this explicit re-login might be redundant if fixtures are properly scoped and isolated.
    # Let's assume for now logged_in_client fixture handles this isolation.


# New tests for CSRF protection

def test_like_item_csrf_missing_token_for_post(client, app, db, create_test_post, logged_in_client): # Renamed, added app, db
    """Test liking a post (item) with a missing CSRF token."""
    test_post = create_test_post(content="CSRF missing token test for like")

    with app.app_context(): # Use app.app_context for url_for
        url = url_for('like.like_item_route', target_type='post', target_id=test_post.id) # Updated route
    response = logged_in_client.post(url, data={}, follow_redirects=False) # Check direct 400

    assert response.status_code == 400
    # assert b'CSRF token missing' in response.data # Or other CSRF specific message
    db.session.refresh(test_post)
    assert test_post.like_count == 0

def test_like_item_csrf_invalid_token_for_post(client, app, db, create_test_post, logged_in_client): # Renamed, added app, db
    """Test liking a post (item) with an invalid CSRF token."""
    test_post = create_test_post(content="CSRF invalid token test for like")

    with app.app_context(): # Use app.app_context for url_for
        url = url_for('like.like_item_route', target_type='post', target_id=test_post.id) # Updated route
    response = logged_in_client.post(url, data={'csrf_token': 'thisisnotavalidtoken'}, follow_redirects=False) # Check direct 400

    assert response.status_code == 400
    # assert b'CSRF token invalid' in response.data # Or other CSRF specific message
    db.session.refresh(test_post)
    assert test_post.like_count == 0

def test_unlike_item_csrf_missing_token_for_post(client, app, db, create_test_post, logged_in_client): # Renamed
    """Test unliking a post (item) with a missing CSRF token."""
    test_post = create_test_post(content="CSRF missing token test for unlike")
    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()

    # First, like the post legitimately
    with logged_in_client.application.test_request_context():
        form = LikeForm()
        token = form.csrf_token.current_token
        like_url = url_for('like.like_item_route', target_type='post', target_id=test_post.id) # Updated route
        unlike_url = url_for('like.unlike_item_route', target_type='post', target_id=test_post.id) # Updated route
    logged_in_client.post(like_url, data={'csrf_token': token}, follow_redirects=True)
    db.session.refresh(test_post)
    assert test_post.like_count == 1

    # Attempt to unlike without CSRF token
    response = logged_in_client.post(unlike_url, data={}, follow_redirects=False) # Check direct 400

    assert response.status_code == 400
    # assert b'CSRF token missing' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 1 # Unlike should not have occurred

def test_unlike_item_csrf_invalid_token_for_post(client, app, db, create_test_post, logged_in_client): # Renamed
    """Test unliking a post (item) with an invalid CSRF token."""
    test_post = create_test_post(content="CSRF invalid token test for unlike")
    # liking_user = User.query.filter_by(username="login_fixture_user@example.com").first() # Not strictly needed for this test path

    # First, like the post legitimately
    with logged_in_client.application.test_request_context():
        form = LikeForm()
        token = form.csrf_token.current_token
        like_url = url_for('like.like_item_route', target_type='post', target_id=test_post.id)
        unlike_url = url_for('like.unlike_item_route', target_type='post', target_id=test_post.id)
    logged_in_client.post(like_url, data={'csrf_token': token}, follow_redirects=True)
    db.session.refresh(test_post)
    assert test_post.like_count == 1

    # Attempt to unlike with invalid CSRF token
    response = logged_in_client.post(unlike_url, data={'csrf_token': 'thisisnotavalidtokeneither'}, follow_redirects=False) # Check direct 400

    assert response.status_code == 400
    # assert b'CSRF token invalid' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 1 # Unlike should not have occurred


# --- Test Comment Like Routes (New) ---

def test_like_item_route_for_comment_authenticated(client, app, db, create_test_user, create_test_post, logged_in_client):
    """Test POST /like/comment/<id> when authenticated."""
    post_author = create_test_user(email_address="comment_post_author_lc@example.com", full_name="Comment Post Author LC")
    test_post = create_test_post(author=post_author, content="A post with comments to be liked.")

    comment_author = create_test_user(email_address="comment_author_lc@example.com", full_name="Comment Author LC")
        test_comment = Comment(text="A comment to be liked", user_id=comment_author.id, target_id=test_post.id, target_type='post')
    db.session.add(test_comment)
    db.session.commit()

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert liking_user is not None
    assert liking_user.id != comment_author.id # Ensure not self-liking for notification test simplicity

    assert not liking_user.has_liked_item('comment', test_comment.id)
    initial_like_count = test_comment.like_count
    initial_notifications = Notification.query.filter_by(user_id=comment_author.id, type='new_like', target_type='comment', target_id=test_comment.id).count()
    initial_activities = Activity.query.filter_by(user_id=liking_user.id, type='liked_item', target_type='comment', target_id=test_comment.id).count()

    with logged_in_client.application.test_request_context():
        form = LikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='comment', target_id=test_comment.id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Comment liked!' in response.data # Check flash message

    db.session.refresh(liking_user)
    db.session.refresh(test_comment)

    assert liking_user.has_liked_item('comment', test_comment.id)
    assert test_comment.like_count == initial_like_count + 1

    # Check notification for comment author
    assert Notification.query.filter_by(user_id=comment_author.id, type='new_like', target_type='comment', target_id=test_comment.id).count() == initial_notifications + 1

    # Check activity log for liking user
    assert Activity.query.filter_by(user_id=liking_user.id, type='liked_item', target_type='comment', target_id=test_comment.id).count() == initial_activities + 1

def test_unlike_item_route_for_comment_authenticated(client, app, db, create_test_user, create_test_post, logged_in_client):
    """Test POST /like/unlike/comment/<id> when authenticated."""
    post_author = create_test_user(email_address="comment_post_author_ulc@example.com", full_name="Comment Post Author ULC")
    test_post = create_test_post(author=post_author, content="A post with comments to be unliked.")

    comment_author = create_test_user(email_address="comment_author_ulc@example.com", full_name="Comment Author ULC")
    test_comment = Comment(text="A comment to be unliked", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(test_comment)
    db.session.commit()

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert liking_user is not None

    # First, like the comment
    liking_user.like_item('comment', test_comment.id)
    db.session.commit()
    db.session.refresh(test_comment) # Refresh to get updated like_count
    assert liking_user.has_liked_item('comment', test_comment.id)
    initial_like_count = test_comment.like_count
    assert initial_like_count > 0 # Ensure it was actually liked

    with logged_in_client.application.test_request_context():
        form = UnlikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.unlike_item_route', target_type='comment', target_id=test_comment.id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Comment unliked.' in response.data # Corrected punctuation

    db.session.refresh(liking_user)
    db.session.refresh(test_comment)

    assert not liking_user.has_liked_item('comment', test_comment.id)
    assert test_comment.like_count == initial_like_count - 1

def test_like_already_liked_item_route_for_comment(client, app, db, create_test_user, create_test_post, logged_in_client):
    """Test liking a comment that is already liked by the user."""
    test_post = create_test_post(author=create_test_user(email_address="cal_post_author@example.com"), content="Post for already liked comment")
    comment_author = create_test_user(email_address="cal_comment_author@example.com")
    test_comment = Comment(text="Already liked comment", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(test_comment)
    db.session.commit()

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    liking_user.like_item('comment', test_comment.id) # Like it first
    db.session.commit()
    db.session.refresh(test_comment)
    initial_like_count = test_comment.like_count

    with logged_in_client.application.app_context(): # Use client's context
        form = LikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='comment', target_id=test_comment.id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'You have already liked this item.' in response.data
    db.session.refresh(test_comment)
    assert test_comment.like_count == initial_like_count

def test_unlike_not_liked_item_route_for_comment(client, app, db, create_test_user, create_test_post, logged_in_client):
    """Test unliking a comment that was not liked."""
    test_post = create_test_post(author=create_test_user(email_address="cunl_post_author@example.com"), content="Post for unliked comment")
    comment_author = create_test_user(email_address="cunl_comment_author@example.com")
    test_comment = Comment(text="Not liked comment", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(test_comment)
    db.session.commit()
    initial_like_count = test_comment.like_count # Should be 0

    with logged_in_client.application.app_context(): # Use client's context
        form = UnlikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.unlike_item_route', target_type='comment', target_id=test_comment.id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'You have not liked this item yet.' in response.data
    db.session.refresh(test_comment)
    assert test_comment.like_count == initial_like_count

def test_like_item_csrf_missing_token_for_comment(client, app, db, create_test_user, create_test_post, logged_in_client):
    """Test liking a comment with a missing CSRF token."""
    test_post = create_test_post(author=create_test_user(email_address="csrf_comment_post_author@example.com"), content="Post for CSRF comment like")
    comment_author = create_test_user(email_address="csrf_comment_author@example.com")
    test_comment = Comment(text="CSRF like comment", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(test_comment)
    db.session.commit()

    with app.app_context():
        url = url_for('like.like_item_route', target_type='comment', target_id=test_comment.id)
    response = logged_in_client.post(url, data={}, follow_redirects=False) # Check direct 400

    assert response.status_code == 400
    # assert b'CSRF token missing' in response.data
    db.session.refresh(test_comment)
    assert test_comment.like_count == 0


# --- Test Comment Routes ---

def test_create_comment_successful(client, app, logged_in_client, create_test_post, db):
    """Authenticated user successfully creates a comment."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Post to comment on.") # User can comment on own post
    post_id = test_post.id

    initial_comment_count = Comment.query.filter_by(target_id=post_id, target_type='post').count()
    initial_activity_count = Activity.query.filter_by(user_id=user.id, type='commented_on_post').count()

    with logged_in_client.application.app_context(): # Use client's context
        form = CommentForm(); token = form.csrf_token.current_token
        url = url_for('post.view_post', post_id=post_id)

    comment_text = "This is a new comment."
    form_data = {'text': comment_text, 'csrf_token': token}

    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment posted successfully!' in response.data
    assert bytes(comment_text, 'utf-8') in response.data # Comment should appear on page

    assert Comment.query.filter_by(target_id=post_id, target_type='post').count() == initial_comment_count + 1
    new_comment = Comment.query.filter_by(text=comment_text, target_id=post_id, target_type='post').first()
    assert new_comment is not None
    assert new_comment.author == user

    # Check activity
    assert Activity.query.filter_by(user_id=user.id, type='commented_on_post', target_id=new_comment.id).count() == initial_activity_count + 1

def test_create_comment_reply_successful(client, app, logged_in_client, create_test_post, db, create_test_user):
    """Authenticated user successfully replies to a comment."""
    post_author = create_test_user(email_address="cpa@example.com", full_name="comment_post_author")
    test_post = create_test_post(author=post_author, content="Post for replies.")

    commenter1 = create_test_user(email_address="c1@example.com", full_name="commenter1")
    parent_comment = Comment(text="Parent comment", user_id=commenter1.id, target_id=test_post.id, target_type='post')
    db.session.add(parent_comment)
    db.session.commit()
    parent_comment_id = parent_comment.id

    replying_user = User.query.filter_by(username="login_fixture_user@example.com").first()

    with logged_in_client.application.app_context(): # Use client's context
        form = CommentForm(); token = form.csrf_token.current_token
        url = url_for('post.view_post', post_id=test_post.id)

    reply_text = "This is a reply."
    form_data = {'text': reply_text, 'parent_id': parent_comment_id, 'csrf_token': token}

    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment posted successfully!' in response.data
    assert bytes(reply_text, 'utf-8') in response.data

    reply_comment = Comment.query.filter_by(text=reply_text, parent_id=parent_comment_id).first()
    assert reply_comment is not None
    assert reply_comment.author == replying_user
    assert reply_comment.parent == parent_comment

def test_create_comment_unauthenticated(client, create_test_post):
    """Unauthenticated user attempting to comment redirects to login."""
    test_post = create_test_post(content="A post for unauth comment.")
    with client.application.test_request_context():
        url = url_for('post.view_post', post_id=test_post.id)
    response = client.post(url,
                           data={'text': 'unauth comment try', 'csrf_token': 'dummytoken'},
                           follow_redirects=False) # Check direct response
    assert response.status_code == 400 # Expecting CSRF failure before auth check in POST
    # The flash messages for auth failure won't be present if CSRF fails first.

def test_create_comment_empty_text_validation(client, app, logged_in_client, create_test_post):
    """Test comment creation with empty text."""
    test_post = create_test_post(content="Post for empty comment test.")
    with logged_in_client.application.app_context(): # Use client's context
        form = CommentForm(); token = form.csrf_token.current_token
        url = url_for('post.view_post', post_id=test_post.id)

    form_data = {'text': '', 'csrf_token': token}
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on post view page
    assert b"This field is required." in response.data # From CommentForm validator
    # Ensure the flash message from flash_form_errors_util is displayed
    assert b'Please correct the errors in the form.' in response.data # General flash message for form errors.

def test_create_comment_csrf_missing(client, logged_in_client, create_test_post):
    """Test comment creation with missing CSRF token."""
    test_post = create_test_post(content="Post for CSRF comment test.")
    form_data = {'text': 'some comment text'}
    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.view_post', post_id=test_post.id)
    # POSTing to view_post which handles comments.
    response = logged_in_client.post(url, data=form_data) # Check direct response first for CSRF
    # If CSRF fails, form.validate_on_submit() is false. Route logic then calls flash_form_errors_util.
    # This should show a CSRF error message if that's how WTForms/Flask-WTF reports it in form.errors.
    # Or, it might be a generic 400 if not caught by form validation display.
    # The route has: flash_form_errors_util(form). If form.errors contains CSRF error, it's flashed.
    # Let's check for the generic form error flash and that comment wasn't created.
    response = logged_in_client.post(url, data=form_data, follow_redirects=False) # Check direct 400
    assert response.status_code == 400
    # The default CSRF error might not use the flash_form_errors_util path.
    # assert b'CSRF token missing' in response.data # Or similar depending on Flask-WTF
    assert Comment.query.filter_by(target_id=test_post.id, target_type='post', text='some comment text').count() == 0


# --- Test Delete Comment Route ---

def test_delete_comment_author_self(client, app, logged_in_client, create_test_post, db):
    """Author deletes their own comment."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Post for comment deletion by author.")
    comment_to_delete = Comment(text="Comment by author", user_id=user.id, post_id=test_post.id)
    db.session.add(comment_to_delete)
    db.session.commit()
    comment_id = comment_to_delete.id
    assert Comment.query.get(comment_id) is not None

    with logged_in_client.application.app_context(): # Use client's context
        form = DeleteCommentForm(); token = form.csrf_token.current_token
        url = url_for('post.delete_comment', comment_id=comment_id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment deleted.' in response.data
    assert Comment.query.get(comment_id) is None

def test_delete_comment_post_author_deletes_other(client, app, logged_in_client, create_test_post, db, create_test_user):
    """Post author deletes another user's comment on their post."""
    post_author = User.query.filter_by(username="login_fixture_user@example.com").first() # logged_in_client is post_author
    test_post = create_test_post(author=post_author, content="Post for comment deletion by post author.")

    commenter = create_test_user(email_address="cv@example.com", full_name="commenter_victim")
    comment_to_delete = Comment(text="Comment by other user", user_id=commenter.id, post_id=test_post.id)
    db.session.add(comment_to_delete)
    db.session.commit()
    comment_id = comment_to_delete.id
    assert Comment.query.get(comment_id) is not None

    with logged_in_client.application.app_context(): # Use client's context
        form = DeleteCommentForm(); token = form.csrf_token.current_token
        url = url_for('post.delete_comment', comment_id=comment_id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment deleted.' in response.data
    assert Comment.query.get(comment_id) is None

def test_delete_comment_admin_deletes_any(client, app, db, create_test_user, create_test_post):
    """Admin deletes any comment."""
    comment_author = create_test_user(email_address="cadmin@example.com", full_name="comment_author_admin_del")
    post_for_comment = create_test_post(author=comment_author, content="Post for admin comment deletion test.")
    comment_to_delete = Comment(text="A comment to be admin-deleted", user_id=comment_author.id, post_id=post_for_comment.id)
    db.session.add(comment_to_delete)
    db.session.commit()
    comment_id = comment_to_delete.id

    admin = create_test_user(email_address="sacd@example.com", full_name="superadmin_comment_deleter", is_admin=True)

    login_url_val = None
    delete_url_val = None
    csrf_login_token = None
    csrf_delete_token = None

    # Login admin
    with client.application.app_context(): # Context for login CSRF
        from antisocialnet.forms import LoginForm # Ensure LoginForm is imported if not already
        login_form = LoginForm()
        csrf_login_token = login_form.csrf_token.current_token
        login_url_val = url_for('auth.login')
    client.post(login_url_val, data={'username': admin.email, 'password': 'password', 'csrf_token': csrf_login_token})

    # Perform action as admin
    with client.application.app_context(): # Context for action CSRF, using the logged-in client's context
        # DeleteCommentForm is already imported at the top of the file
        delete_form = DeleteCommentForm()
        csrf_delete_token = delete_form.csrf_token.current_token
        delete_url_val = url_for('post.delete_comment', comment_id=comment_id)
    response = client.post(delete_url_val, data={'csrf_token': csrf_delete_token}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment deleted.' in response.data
    assert Comment.query.get(comment_id) is None

def test_delete_comment_unauthorized(client, app, logged_in_client, create_test_post, db, create_test_user):
    """Unauthorized user (not comment author, not post author, not admin) gets 403."""
    post_owner = create_test_user(email_address="dpo@example.com", full_name="del_post_owner")
    comment_owner = create_test_user(email_address="dco@example.com", full_name="del_comment_owner")
    test_post = create_test_post(author=post_owner, content="Post for unauthorized comment delete test.")
    comment_on_post = Comment(text="A comment", user_id=comment_owner.id, post_id=test_post.id)
    db.session.add(comment_on_post)
    db.session.commit()
    comment_id = comment_on_post.id

    # logged_in_client is 'login_fixture_user@example.com', who is none of the above.
    assert User.query.filter_by(username="login_fixture_user@example.com").first().id not in [post_owner.id, comment_owner.id]

    with logged_in_client.application.app_context(): # Use client's context
        form=DeleteCommentForm(); token=form.csrf_token.current_token
        url = url_for('post.delete_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={'csrf_token': token})
    assert response.status_code == 403
    assert Comment.query.get(comment_id) is not None

def test_delete_comment_csrf_failure(client, app, logged_in_client, create_test_post, db):
    """Test CSRF failure (missing token) for comment deletion."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Post for CSRF comment delete.")
        test_comment = Comment(text="CSRF like comment", user_id=comment_author.id, target_id=test_post.id, target_type='post')
    db.session.add(comment); db.session.commit()
    comment_id = comment.id

    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.delete_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={}, follow_redirects=False) # Check direct 400
    assert response.status_code == 400
    # assert b'CSRF token missing' in response.data
    assert Comment.query.get(comment_id) is not None


# --- Test Flag Comment Route ---

def test_flag_comment_successful(client, app, logged_in_client, create_test_post, db, create_test_user):
    """Authenticated user flags a comment successfully."""
    post_owner = create_test_user(email_address="fpo@example.com", full_name="flag_post_owner")
    comment_author = create_test_user(email_address="fca@example.com", full_name="flag_comment_author")
    test_post = create_test_post(author=post_owner, content="Post for comment flagging.")
    comment_to_flag = Comment(text="This comment will be flagged.", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(comment_to_flag); db.session.commit()
    comment_id = comment_to_flag.id

    # logged_in_client ('login_fixture_user@example.com') is the flagger
    assert User.query.filter_by(username="login_fixture_user@example.com").first().id != comment_author.id # Not flagging own comment

    initial_flag_count = CommentFlag.query.filter_by(comment_id=comment_id).count()

    with logged_in_client.application.app_context(): # Use client's context
        form=FlagCommentForm(); token=form.csrf_token.current_token
        url = url_for('post.flag_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Comment flagged for review.' in response.data
    assert CommentFlag.query.filter_by(comment_id=comment_id).count() == initial_flag_count + 1
    flag = CommentFlag.query.filter_by(comment_id=comment_id, flagger_user_id=User.query.filter_by(username="loginuser").first().id).first()
    assert flag is not None
    assert not flag.is_resolved

def test_flag_comment_own_comment_fails(client, app, logged_in_client, create_test_post, db):
    """User cannot flag their own comment."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Post for self-flag test.")
    own_comment = Comment(text="My own comment, can't flag.", user_id=user.id, post_id=test_post.id)
    db.session.add(own_comment); db.session.commit()
    comment_id = own_comment.id

    with logged_in_client.application.app_context(): # Use client's context
        form=FlagCommentForm(); token=form.csrf_token.current_token
        url = url_for('post.flag_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"You cannot flag your own comment." in response.data
    assert CommentFlag.query.filter_by(comment_id=comment_id).count() == 0

def test_flag_comment_already_flagged_by_user(client, app, logged_in_client, create_test_post, db, create_test_user):
    """User cannot flag a comment they already actively flagged."""
    comment_author = create_test_user(email_address="cadf@example.com", full_name="c_author_double_flag")
    test_post = create_test_post(author=comment_author, content="Post for double flag test.")
    comment_to_flag = Comment(text="Flag me once.", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(comment_to_flag); db.session.commit()
    comment_id = comment_to_flag.id

    flagger = User.query.filter_by(username="login_fixture_user@example.com").first()
    existing_flag = CommentFlag(comment_id=comment_id, flagger_user_id=flagger.id, is_resolved=False)
    db.session.add(existing_flag); db.session.commit()
    initial_flag_count = CommentFlag.query.filter_by(comment_id=comment_id).count() # Should be 1

    with logged_in_client.application.app_context(): # Use client's context
        form=FlagCommentForm(); token=form.csrf_token.current_token
        url = url_for('post.flag_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b'You have already flagged this comment.' in response.data
    assert CommentFlag.query.filter_by(comment_id=comment_id).count() == initial_flag_count # Count should not change

def test_flag_comment_csrf_failure(client, app, logged_in_client, create_test_post, db, create_test_user):
    """Test CSRF failure for flagging a comment."""
    comment_author = create_test_user(email_address="cacsf@example.com", full_name="c_author_csrf_flag")
    test_post = create_test_post(author=comment_author, content="Post for CSRF flag test.")
    comment_to_flag = Comment(text="CSRF Flag me.", user_id=comment_author.id, post_id=test_post.id)
    db.session.add(comment_to_flag); db.session.commit()
    comment_id = comment_to_flag.id

    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.flag_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={}, follow_redirects=False) # Check direct 400
    assert response.status_code == 400
    # assert b'CSRF token missing' in response.data
    assert CommentFlag.query.filter_by(comment_id=comment_id).count() == 0


# --- Test Posts by Category/Tag Routes ---

def test_posts_by_category_loads_correct_posts(client, app, db, create_test_post, create_test_user):
    """Test that the category page lists only relevant, published posts."""
    author = create_test_user(email_address="cta@example.com", full_name="cat_tag_author")

    cat_tech = Category.query.filter_by(name="Tech").first() or Category(name="Tech")
    cat_news = Category.query.filter_by(name="News").first() or Category(name="News")
    db.session.add_all([cat_tech, cat_news])
    db.session.commit()

    post_tech1 = create_test_post(author=author, content="Tech Post 1")
    post_tech1.categories.append(cat_tech)
    post_news1 = create_test_post(author=author, content="News Post 1")
    post_news1.categories.append(cat_news)
    post_both = create_test_post(author=author, content="Tech and News Post")
    post_both.categories.extend([cat_tech, cat_news])
    post_none = create_test_post(author=author, content="Uncategorized Post")
    post_unpublished_tech = create_test_post(author=author, content="Unpublished Tech Post")
    post_unpublished_tech.categories.append(cat_tech)
    post_unpublished_tech.is_published = False # Ensure it's unpublished
    db.session.add_all([post_tech1, post_news1, post_both, post_none, post_unpublished_tech])
    db.session.commit()

    with client.application.test_request_context():
        # Test Tech category page
        response_tech = client.get(url_for('post.posts_by_category', category_slug=cat_tech.slug))
    assert response_tech.status_code == 200
    assert bytes(cat_tech.name, 'utf-8') in response_tech.data
    assert b"Tech Post 1" in response_tech.data
    assert b"Tech and News Post" in response_tech.data
    assert b"News Post 1" not in response_tech.data # Should not be on Tech page if only in News
    assert b"Uncategorized Post" not in response_tech.data
    assert b"Unpublished Tech Post" not in response_tech.data # Unpublished should not show

    with client.application.test_request_context():
        # Test News category page
        response_news = client.get(url_for('post.posts_by_category', category_slug=cat_news.slug))
    assert response_news.status_code == 200
    assert bytes(cat_news.name, 'utf-8') in response_news.data
    assert b"News Post 1" in response_news.data
    assert b"Tech and News Post" in response_news.data
    assert b"Tech Post 1" not in response_news.data # Should not be on News page if only in Tech

def test_posts_by_tag_loads_correct_posts(client, app, db, create_test_post, create_test_user):
    """Test that the tag page lists only relevant, published posts."""
    author = User.query.filter_by(username="cta@example.com").first() or create_test_user(email_address="cta@example.com", full_name="cat_tag_author")

    tag_python = Tag.query.filter_by(name="python").first() or Tag(name="python")
    tag_flask = Tag.query.filter_by(name="flask").first() or Tag(name="flask")
    db.session.add_all([tag_python, tag_flask])
    db.session.commit()

    post_python1 = create_test_post(author=author, content="Python Post 1")
    post_python1.tags.append(tag_python)
    post_flask1 = create_test_post(author=author, content="Flask Post 1")
    post_flask1.tags.append(tag_flask)
    post_both_tags = create_test_post(author=author, content="Python and Flask Post")
    post_both_tags.tags.extend([tag_python, tag_flask])
    post_no_tags = create_test_post(author=author, content="Untagged Post")
    post_unpublished_python = create_test_post(author=author, content="Unpublished Python Post")
    post_unpublished_python.tags.append(tag_python)
    post_unpublished_python.is_published = False
    db.session.add_all([post_python1, post_flask1, post_both_tags, post_no_tags, post_unpublished_python])
    db.session.commit()

    with client.application.test_request_context():
        response_python = client.get(url_for('post.posts_by_tag', tag_slug=tag_python.slug))
    assert response_python.status_code == 200
    assert bytes(tag_python.name, 'utf-8') in response_python.data
    assert b"Python Post 1" in response_python.data
    assert b"Python and Flask Post" in response_python.data
    assert b"Flask Post 1" not in response_python.data
    assert b"Untagged Post" not in response_python.data
    assert b"Unpublished Python Post" not in response_python.data

def test_posts_by_category_empty(client, app, db):
    """Test category page with no posts."""
    cat_empty = Category.query.filter_by(name="EmptyCat").first() or Category(name="EmptyCat")
    db.session.add(cat_empty); db.session.commit()

    with client.application.test_request_context():
        response = client.get(url_for('post.posts_by_category', category_slug=cat_empty.slug))
    assert response.status_code == 200
    assert bytes(cat_empty.name, 'utf-8') in response.data
    assert bytes(f"There are no posts in the category '{cat_empty.name}'.", 'utf-8') in response.data

def test_posts_by_tag_empty(client, app, db):
    """Test tag page with no posts."""
    tag_empty = Tag.query.filter_by(name="emptytag").first() or Tag(name="emptytag")
    db.session.add(tag_empty); db.session.commit()

    with client.application.test_request_context():
        response = client.get(url_for('post.posts_by_tag', tag_slug=tag_empty.slug))
    assert response.status_code == 200
    assert bytes(tag_empty.name, 'utf-8') in response.data
    assert bytes(f"There are no posts with the tag '{tag_empty.name}'.", 'utf-8') in response.data

def test_posts_by_category_nonexistent(client):
    """Test GET for a non-existent category slug returns 404."""
    with client.application.test_request_context():
        response = client.get(url_for('post.posts_by_category', category_slug="non-existent-cat-slug"))
    assert response.status_code == 404

def test_posts_by_tag_nonexistent(client):
    """Test GET for a non-existent tag slug returns 404."""
    with client.application.test_request_context():
        response = client.get(url_for('post.posts_by_tag', tag_slug="non-existent-tag-slug"))
    assert response.status_code == 404

def test_posts_by_category_pagination(client, app, db, create_test_user, create_test_post):
    """Test pagination for category pages."""
    author = User.query.filter_by(username="cta_pag@example.com").first() or create_test_user(email_address="cta_pag@example.com", full_name="cat_tag_author")
    cat_paged = Category.query.filter_by(name="PagedCat").first() or Category(name="PagedCat")
    db.session.add(cat_paged); db.session.commit()

    with app.app_context():
        original_posts_per_page = app.config.get('POSTS_PER_PAGE', 10)
        app.config['POSTS_PER_PAGE'] = 3

    for i in range(5):
        p = create_test_post(author=author, content=f"Paged Cat Post {i+1}")
        p.categories.append(cat_paged)
        db.session.add(p)
    db.session.commit()

    with client.application.test_request_context():
        # Page 1
        response_p1 = client.get(url_for('post.posts_by_category', category_slug=cat_paged.slug, page=1))
        assert response_p1.status_code == 200
        assert b"Paged Cat Post 5" in response_p1.data
        assert b"Paged Cat Post 3" in response_p1.data
        assert b"Paged Cat Post 2" not in response_p1.data
    expected_next_page_url_part = url_for('post.posts_by_category', category_slug=cat_paged.slug, page=2)
    # Check for the presence of the "go-next-symbolic" icon within an href link to page 2
    assert b'<adw-button icon-name="go-next-symbolic" href="' + expected_next_page_url_part.encode() + b'">' in response_p1.data

    # Page 2
    response_p2 = client.get(url_for('post.posts_by_category', category_slug=cat_paged.slug, page=2))
    assert response_p2.status_code == 200
    assert b"Paged Cat Post 2" in response_p2.data
    assert b"Paged Cat Post 1" in response_p2.data
    assert b"Paged Cat Post 3" not in response_p2.data
    assert b"Previous" in response_p2.data

    # Page beyond limit (empty)
    response_p3 = client.get(url_for('post.posts_by_category', category_slug=cat_paged.slug, page=3))
    assert response_p3.status_code == 200 # Should not be 404 for valid page number even if empty
    assert b"Paged Cat Post" not in response_p3.data # No posts
    # Check for "No posts found" or similar if template handles empty page after first.
    # The pagination object's items list will be empty.

    with app.app_context():
        app.config['POSTS_PER_PAGE'] = original_posts_per_page # Restore


# --- Test Create Post Route ---

def test_create_post_page_loads(client, logged_in_client):
    """Test GET /create loads the create post form."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('post.create_post'))
    assert response.status_code == 200
    assert b"Create New Post" in response.data # Assuming this is in the template
    assert b"Content (Markdown)" in response.data

def test_create_post_unauthenticated_redirects(client):
    """Test unauthenticated user is redirected from /create."""
    with client.application.test_request_context():
        response = client.get(url_for('post.create_post'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data

def test_create_post_successful_simple(client, app, logged_in_client, db):
    """Test successful post creation with minimal data (content only)."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first() # User from logged_in_client
    assert user is not None

    initial_post_count = Post.query.count()
    initial_activity_count = Activity.query.filter_by(user_id=user.id, type='created_post').count()

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm()
        token = form.csrf_token.current_token
        url = url_for('post.create_post')

    post_content = "This is a simple test post."
    form_data = {
        'content': post_content,
        'tags_string': '',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)

    assert response.status_code == 200
    assert b'Post created successfully!' in response.data

    assert Post.query.count() == initial_post_count + 1
    new_post = Post.query.order_by(Post.id.desc()).first()
    assert new_post is not None
    assert new_post.content == post_content
    assert new_post.author == user
    assert new_post.is_published
    assert new_post.published_at is not None
    assert not new_post.categories
    assert not new_post.tags

    # Check activity
    assert Activity.query.filter_by(user_id=user.id, type='created_post', target_id=new_post.id).count() == initial_activity_count + 1

def test_create_post_successful_with_new_tags(client, app, logged_in_client, db):
    """Test creating a post with new tags."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    initial_tag_count = db.session.query(db.func.count(Tag.id)).scalar() # Corrected to count Tag.id

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm()
        token = form.csrf_token.current_token
        url = url_for('post.create_post')

    post_content = "Post with new tags"
    tags_input = "  newtag1, another new tag, NewTag1  " # Test trimming and case
    form_data = {
        'content': post_content,
        'tags_string': tags_input,
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post created successfully!' in response.data

    new_post = Post.query.filter_by(content=post_content).first()
    assert new_post is not None
    assert len(new_post.tags) == 2 # "newtag1", "another new tag" (NewTag1 becomes newtag1)

    tag_names = sorted([tag.name for tag in new_post.tags])
    assert tag_names == sorted(["newtag1", "another new tag"])

    # Verify new tags were created in DB (assuming these tags didn't exist)
    # This is a bit simplistic if other tests create same tags. A better check is on count increase.
    # For this test, let's assume 'newtag1' and 'another new tag' are unique to this test run.
    assert db.session.query(db.func.count(Post.tags.mapper.class_.id)).scalar() == initial_tag_count + 2


def test_create_post_successful_with_existing_and_new_tags(client, app, logged_in_client, db):
    """Test creating a post with a mix of new and existing tags."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()

    # Create an existing tag
    existing_tag_name = "existingtag"
    existing_tag = Tag.query.filter_by(name=existing_tag_name).first()
    if not existing_tag:
        existing_tag = Tag(name=existing_tag_name)
        db.session.add(existing_tag)
        db.session.commit()

    initial_tag_count_db = Tag.query.count()

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm()
        token = form.csrf_token.current_token
        url = url_for('post.create_post')

    post_content = "Post with mixed tags"
    tags_input = f"{existing_tag_name}, brandnewtag, {existing_tag_name.upper()}" # Test existing, new, and case-insensitivity for existing
    form_data = {
        'content': post_content,
        'tags_string': tags_input,
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post created successfully!' in response.data

    new_post = Post.query.filter_by(content=post_content).first()
    assert new_post is not None

    tag_names = sorted([tag.name for tag in new_post.tags])
    assert len(tag_names) == 2 # 'existingtag', 'brandnewtag'
    assert tag_names == sorted([existing_tag_name, "brandnewtag"])

    # Verify only one new tag ('brandnewtag') was created in the DB
    assert Tag.query.count() == initial_tag_count_db + 1


def test_create_post_successful_with_categories(client, app, logged_in_client, db):
    """Test creating a post and associating it with existing categories."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()

    cat1 = Category.query.filter_by(name="Tech").first()
    if not cat1: cat1 = Category(name="Tech"); db.session.add(cat1)
    cat2 = Category.query.filter_by(name="Travel").first()
    if not cat2: cat2 = Category(name="Travel"); db.session.add(cat2)
    db.session.commit()

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm() # For CSRF token
        token = form.csrf_token.current_token
        url = url_for('post.create_post')

    post_content = "Post with categories"
    form_data = {
        'content': post_content,
        'tags_string': 'some,tags',
        'categories': [cat1.id, cat2.id],
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post created successfully!' in response.data

    new_post = Post.query.filter_by(content=post_content).first()
    assert new_post is not None
    assert len(new_post.categories) == 2
    category_names = sorted([cat.name for cat in new_post.categories])
    assert category_names == sorted(["Tech", "Travel"])

def test_create_post_content_missing_validation(client, app, logged_in_client):
    """Test form validation when post content is missing."""
    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm()
        token = form.csrf_token.current_token
        url = url_for('post.create_post')

    form_data = {
        'content': '', # Empty content
        'tags_string': 'test',
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on create_post page
    assert b"This field is required." in response.data # WTForms DataRequired message for content
    assert b"Create New Post" in response.data # Still on the same page

def test_create_post_csrf_missing(client, logged_in_client):
    """Test create post POST with missing CSRF token."""
    form_data = {'content': 'test content'}
    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.create_post')
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

def test_create_post_csrf_invalid(client, logged_in_client):
    """Test create post POST with invalid CSRF token."""
    form_data = {'content': 'test content', 'csrf_token': 'badtoken'}
    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.create_post')
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

# TODO: Add tests for edit_post route, including similar scenarios for content, tags, categories, and CSRF.
# TODO: Add tests for delete_post route, including CSRF.
# TODO: Add tests for comment creation, deletion, flagging, including CSRF.
# TODO: Add tests for posts_by_category and posts_by_tag (pagination, empty results).


# --- Test Edit Post Route ---

def test_edit_post_page_loads(client, app, logged_in_client, create_test_post, db):
    """Test GET /posts/<id>/edit loads the form for the post author."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content to edit.")

    tag1 = Tag.query.filter_by(name="edittesttag").first() or Tag(name="edittesttag")
    cat1 = Category.query.filter_by(name="EditTestCat").first() or Category(name="EditTestCat")
    test_post.tags.append(tag1)
    test_post.categories.append(cat1)
    db.session.add_all([tag1, cat1, test_post])
    db.session.commit()

    with logged_in_client.application.test_request_context(): # For url_for
        response = logged_in_client.get(url_for('post.edit_post', post_id=test_post.id))
    assert response.status_code == 200
    assert b"Edit Post" in response.data # Page title or header
    assert bytes(test_post.content, 'utf-8') in response.data
    assert bytes(tag1.name, 'utf-8') in response.data # Check if tag is in tags_string
    # For categories, QuerySelectMultipleField pre-selects checkboxes.
    # Check for the category name and that its input is checked.
    assert bytes(cat1.name, 'utf-8') in response.data
    # A more robust check for category might involve parsing HTML to find the checked checkbox.
    # For now, presence of name is a good indicator. Example: <input ... value="<id>" checked> ... <label>CatName</label>
    assert b'value="' + str(cat1.id).encode() + b'"' in response.data # Check if cat id is in form
    # A simple way to check if it's selected is to look for 'checked' attribute near its value.
    # This is brittle. A better way is to use a library like BeautifulSoup or assert form.categories.data in the route's GET part.
    # For functional tests, checking for pre-filled form fields is important.
    # The PostForm is populated with obj=post in the route.

def test_edit_post_unauthenticated(client, create_test_post):
    """Test unauthenticated user is redirected from /posts/<id>/edit."""
    test_post = create_test_post(content="A post") # Author doesn't matter here
    with client.application.test_request_context():
        url = url_for('post.edit_post', post_id=test_post.id)
    response = client.get(url, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data

def test_edit_post_unauthorized_user(client, logged_in_client, create_test_post, create_test_user):
    """Test non-author/non-admin user gets 403 when trying to edit."""
    other_user = create_test_user(email_address="other@example.com", full_name="otherauthor")
    test_post_by_other = create_test_post(author=other_user, content="Other's post")

    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('post.edit_post', post_id=test_post_by_other.id))
    assert response.status_code == 403 # Forbidden

def test_edit_post_admin_can_access(client, app, db, create_test_user, create_test_post):
    """Test admin user can access edit page for another user's post."""
    regular_user = create_test_user(email_address="reg@example.com", full_name="regularposter")
    post_by_regular_user = create_test_post(author=regular_user, content="A regular post for admin edit test")

    admin_user = create_test_user(email_address="adminedit@example.com", full_name="admineditor", is_admin=True)

    login_url_val = None
    edit_url_val = None
    csrf_login_token = None

    # Login admin
    with client.application.app_context(): # Context for login CSRF
        from antisocialnet.forms import LoginForm # Ensure LoginForm is imported
        login_form = LoginForm()
        csrf_login_token = login_form.csrf_token.current_token
        login_url_val = url_for('auth.login')
    client.post(login_url_val, data={
        'username': admin_user.username, # User model uses email as username
        'password': 'password',
        'csrf_token': csrf_login_token
    }, follow_redirects=True)

    # Admin gets the edit page
    with client.application.app_context(): # Context for url_for using the logged-in client
        edit_url_val = url_for('post.edit_post', post_id=post_by_regular_user.id)
    response = client.get(edit_url_val)
    assert response.status_code == 200
    assert b"Edit Post" in response.data
    assert bytes(post_by_regular_user.content, 'utf-8') in response.data

def test_edit_post_successful_content_change(client, app, logged_in_client, create_test_post, db):
    """Author edits content of their post."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Original content.")
    original_updated_at = test_post.updated_at

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm() # For CSRF
        token = form.csrf_token.current_token
        url = url_for('post.edit_post', post_id=test_post.id)

    new_content = "Updated content here."
    form_data = {
        'content': new_content,
        'tags_string': '', # Keep tags same or empty for this test
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)

    assert response.status_code == 200
    assert b'Post updated successfully!' in response.data
    # Check redirection to view_post page
    assert bytes(new_content, 'utf-8') in response.data # New content should be on the view page

    db.session.refresh(test_post)
    assert test_post.content == new_content
    assert test_post.updated_at > original_updated_at

def test_edit_post_successful_tags_change(client, app, logged_in_client, create_test_post, db):
    """Author changes tags of their post."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content with tags to change.")

    tag_before = Tag.query.filter_by(name="beforeedit").first() or Tag(name="beforeedit")
    test_post.tags.append(tag_before)
    db.session.add(test_post)
    db.session.commit()
    assert "beforeedit" in [t.name for t in test_post.tags]

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm(); token = form.csrf_token.current_token
        url = url_for('post.edit_post', post_id=test_post.id)

    new_tags_string = "afteredit, anothertag"
    form_data = {
        'content': test_post.content,
        'tags_string': new_tags_string,
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post updated successfully!' in response.data

    db.session.refresh(test_post)
    updated_tag_names = sorted([t.name for t in test_post.tags])
    assert updated_tag_names == sorted(["afteredit", "anothertag"])
    assert "beforeedit" not in updated_tag_names

def test_edit_post_successful_categories_change(client, app, logged_in_client, create_test_post, db):
    """Author changes categories of their post."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content with categories to change.")

    cat_before = Category.query.filter_by(name="CatBefore").first() or Category(name="CatBefore")
    cat_after1 = Category.query.filter_by(name="CatAfter1").first() or Category(name="CatAfter1")
    cat_after2 = Category.query.filter_by(name="CatAfter2").first() or Category(name="CatAfter2")
    db.session.add_all([cat_before, cat_after1, cat_after2]) # Ensure they exist

    test_post.categories.append(cat_before)
    db.session.add(test_post)
    db.session.commit()
    assert "CatBefore" in [c.name for c in test_post.categories]

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm(); token = form.csrf_token.current_token
        url = url_for('post.edit_post', post_id=test_post.id)

    form_data = {
        'content': test_post.content,
        'categories': [cat_after1.id, cat_after2.id], # New category IDs
        'csrf_token': token
    }
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post updated successfully!' in response.data

    db.session.refresh(test_post)
    updated_cat_names = sorted([c.name for c in test_post.categories])
    assert updated_cat_names == sorted(["CatAfter1", "CatAfter2"])
    assert "CatBefore" not in updated_cat_names

def test_edit_post_empty_content_validation(client, app, logged_in_client, create_test_post):
    """Author attempts to save post with empty content during edit."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Some content.")

    with logged_in_client.application.app_context(): # Use client's context
        form = PostForm(); token = form.csrf_token.current_token
        url = url_for('post.edit_post', post_id=test_post.id)

    form_data = {'content': '', 'csrf_token': token}
    response = logged_in_client.post(url, data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on edit page
    assert b"This field is required." in response.data # Content is DataRequired
    assert b"Edit Post" in response.data # Still on edit page

def test_edit_post_csrf_missing(client, logged_in_client, create_test_post):
    """Test edit post POST with missing CSRF token."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content for CSRF test.")
    form_data = {'content': 'new content'}
    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.edit_post', post_id=test_post.id)
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

def test_edit_post_csrf_invalid(client, logged_in_client, create_test_post):
    """Test edit post POST with invalid CSRF token."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content for CSRF invalid test.")
    form_data = {'content': 'new content', 'csrf_token': 'badeditposttoken'}
    with logged_in_client.application.test_request_context(): # For url_for
        url = url_for('post.edit_post', post_id=test_post.id)
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 400

def test_edit_post_nonexistent_post_get(client, logged_in_client):
    """Test GET edit page for a non-existent post."""
    with logged_in_client.application.test_request_context(): # For url_for
        response = logged_in_client.get(url_for('post.edit_post', post_id=99999))
    assert response.status_code == 404

def test_edit_post_nonexistent_post_post(client, app, logged_in_client):
    """Test POST edit for a non-existent post."""
    with logged_in_client.application.app_context(): # Use client's context
        from antisocialnet.forms import PostForm # Corrected import
        form = PostForm(); token = form.csrf_token.current_token
        url = url_for('post.edit_post', post_id=99999)
    form_data = {'content': 'some content', 'csrf_token': token}
    response = logged_in_client.post(url, data=form_data)
    assert response.status_code == 404


# --- Test Delete Post Route ---

def test_delete_post_successful_author(client, app, logged_in_client, create_test_post, db):
    """Author successfully deletes their own post."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Post to be deleted by author.")
    post_id = test_post.id
    assert Post.query.get(post_id) is not None

    with logged_in_client.application.app_context(): # Use client's context
        form = DeletePostForm(); token = form.csrf_token.current_token
        url = url_for('post.delete_post', post_id=post_id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post deleted successfully!' in response.data
    assert Post.query.get(post_id) is None

def test_delete_post_successful_admin(client, app, db, create_test_user, create_test_post):
    """Admin successfully deletes another user's post."""
    # Create a regular user and their post
    regular_user = create_test_user(email_address="posterdel@example.com", full_name="Poster for Delete")
    post_to_delete = create_test_post(author=regular_user, content="Post to be deleted by admin.")
    post_id = post_to_delete.id
    assert Post.query.get(post_id) is not None

    # Create and log in as an admin user
    admin_user = create_test_user(email_address="admindelete@example.com", full_name="Admin Deleter", is_admin=True)

    login_url_val = None
    delete_url_val = None
    csrf_login_token = None
    csrf_delete_token = None

    # Login admin
    with client.application.app_context(): # Context for login CSRF
        from antisocialnet.forms import LoginForm
        login_form = LoginForm()
        csrf_login_token = login_form.csrf_token.current_token
        login_url_val = url_for('auth.login')
    login_response = client.post(login_url_val, data={
        'username': admin_user.username,
        'password': 'password',
        'csrf_token': csrf_login_token
    }, follow_redirects=True)
    assert login_response.status_code == 200

    # Admin performs delete action
    with client.application.app_context(): # Context for action CSRF
        from antisocialnet.forms import DeletePostForm
        delete_form = DeletePostForm()
        csrf_delete_token = delete_form.csrf_token.current_token
        delete_url_val = url_for('post.delete_post', post_id=post_id)
    response = client.post(delete_url_val, data={'csrf_token': csrf_delete_token}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post deleted successfully!' in response.data
    assert Post.query.get(post_id) is None

def test_delete_post_unauthorized_user(client, app, logged_in_client, create_test_post, create_test_user):
    """Non-author/non-admin user gets 403 when attempting to delete."""
    # logged_in_client is 'login_fixture_user@example.com'
    other_user = create_test_user(email_address="anotherdel@example.com", full_name="Another Poster")
    post_by_other = create_test_post(author=other_user, content="Other's post for delete test.")
    post_id = post_by_other.id

    url_val = None
    token_val = None
    with logged_in_client.application.app_context(): # Use client's context
        from antisocialnet.forms import DeletePostForm
        form = DeletePostForm()
        token_val = form.csrf_token.current_token
        url_val = url_for('post.delete_post', post_id=post_id)

    response = logged_in_client.post(url_val, data={'csrf_token': token_val})
    assert response.status_code == 403 # Forbidden
    assert Post.query.get(post_id) is not None # Post should still exist

def test_delete_post_unauthenticated(client, app, create_test_post): # Added app
    """Unauthenticated user is redirected from delete post attempt."""
    test_post = create_test_post(content="Post for unauth delete.")
    url_val = None
    with app.app_context(): # For url_for
        url_val = url_for('post.delete_post', post_id=test_post.id)
    # Unauthenticated POST to a CSRF-protected, login_required route.
    # CSRF protection likely triggers first, resulting in 400.
    response = client.post(url_val, data={}, follow_redirects=False) # Send no data (hence no CSRF token)
    assert response.status_code == 400
    # The "Please log in" flash won't be there if CSRF fails with 400 directly.

def test_delete_post_csrf_missing(client, app, logged_in_client, create_test_post): # Added app
    """Test delete post POST with missing CSRF token."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content for CSRF delete test.")

    url_val = None
    with app.app_context(): # For url_for
        url_val = url_for('post.delete_post', post_id=test_post.id)

    response = logged_in_client.post(url_val, data={})
    # The route uses DeletePostForm.validate_on_submit(). If CSRF fails, it flashes and redirects.
    # So we expect a 200 (after redirect) and a specific flash message.
    # If DeletePostForm had other validators that failed first with empty data, that message would appear.
    # But DeletePostForm is empty except for CSRF.
    # The route has: flash('Failed to delete post. Invalid request or session expired.', 'danger')
    # Let's check for this message with follow_redirects=True
    response = logged_in_client.post(url_val, data={}, follow_redirects=False) # Check direct 400
    assert response.status_code == 400
    # assert b'CSRF token missing' in response.data
    assert Post.query.get(test_post.id) is not None # Post should not be deleted

def test_delete_post_csrf_invalid(client, app, logged_in_client, create_test_post): # Added app
    """Test delete post POST with invalid CSRF token."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_post = create_test_post(author=user, content="Content for CSRF invalid delete.")
    url_val = None
    with app.app_context(): # For url_for
        url_val = url_for('post.delete_post', post_id=test_post.id)
    response = logged_in_client.post(url_val, data={'csrf_token': 'baddeleteposttoken'}, follow_redirects=False) # Check direct 400
    assert response.status_code == 400
    # assert b'CSRF token invalid' in response.data
    assert Post.query.get(test_post.id) is not None # Post should not be deleted

def test_delete_post_nonexistent_post(client, app, logged_in_client):
    """Test POST delete for a non-existent post."""
    with logged_in_client.application.app_context(): # Use client's context
        from antisocialnet.forms import DeletePostForm # Ensure DeletePostForm is imported
        form = DeletePostForm(); token = form.csrf_token.current_token
        url = url_for('post.delete_post', post_id=99999) # Define URL inside context
    # This should result in a 404 because Post.query.get_or_404(post_id) is called first.
    response = logged_in_client.post(url, data={'csrf_token': token})
    assert response.status_code == 404

def test_delete_post_deletes_associated_data(client, app, logged_in_client, db, create_test_user): # Added create_test_user
    """Test that deleting a post also deletes its comments, likes, comment flags, and related activities."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    # Ensure other_user for commenting/liking exists
    other_user_email = "commenter_deleterelated@example.com"
    other_user = User.query.filter_by(username=other_user_email).first()
    if not other_user:
        other_user = create_test_user(email_address=other_user_email, full_name="Commenter DeleteRelated")


    # 1. Create a post
    test_post = Post(author=user, content="Post with lots of associations")
    db.session.add(test_post)
    db.session.commit()
    post_id = test_post.id

    # 2. Add likes to the post
    like1 = Like(user_id=user.id, target_type='post', target_id=post_id) # Updated to generic Like
    like2 = Like(user_id=other_user.id, target_type='post', target_id=post_id) # Updated to generic Like
    db.session.add_all([like1, like2])
    db.session.commit()
    assert Like.query.filter_by(target_type='post', target_id=post_id).count() == 2 # Updated query

    # 3. Add comments to the post
    from antisocialnet.models import Comment, CommentFlag # Ensure models are imported
    comment1 = Comment(text="Test comment 1", user_id=other_user.id, post_id=post_id)
    comment2 = Comment(text="Test comment 2 by author", user_id=user.id, post_id=post_id)
    db.session.add_all([comment1, comment2])
    db.session.commit()
    comment1_id = comment1.id
    assert Comment.query.filter_by(post_id=post_id).count() == 2

    # 4. Add flags to a comment
    flag1 = CommentFlag(comment_id=comment1_id, flagger_user_id=user.id)
    db.session.add(flag1)
    db.session.commit()
    assert CommentFlag.query.filter_by(comment_id=comment1_id).count() == 1

    # 5. Add activities related to the post
    # 'created_post' activity (created by create_post route)
    # 'liked_post' activity (created by like_post route)
    # We will create these directly here to ensure they exist for this specific test.
    # The delete_post route will now query by target_type='post' and target_id=post_id.

    activity_created_post = Activity(user_id=user.id, type='created_post', target_type='post', target_id=post_id)
    activity_liked_post_by_other = Activity(user_id=other_user.id, type='liked_post', target_type='post', target_id=post_id)
    # Example of an activity that should NOT be deleted by deleting this post:
    activity_other_unrelated = Activity(user_id=user.id, type='some_other_action', target_type='user', target_id=other_user.id)

    db.session.add_all([activity_created_post, activity_liked_post_by_other, activity_other_unrelated])
    db.session.commit()

    assert Activity.query.filter_by(target_type='post', target_id=post_id).count() == 2
    assert Activity.query.get(activity_other_unrelated.id) is not None # Ensure unrelated activity exists

    # Now, delete the post
    delete_url_val = None
    token = None
    with logged_in_client.application.app_context(): # Use client's context
        from antisocialnet.forms import DeletePostForm # Ensure DeletePostForm is imported
        form = DeletePostForm()
        token = form.csrf_token.current_token
        delete_url_val = url_for('post.delete_post', post_id=post_id)

    logged_in_client.post(delete_url_val, data={'csrf_token': token}, follow_redirects=True)

    # Assertions
    assert Post.query.get(post_id) is None
    assert Like.query.filter_by(target_type='post', target_id=post_id).count() == 0 # Updated query
    assert Comment.query.filter_by(post_id=post_id).count() == 0
    assert CommentFlag.query.filter_by(comment_id=comment1_id).count() == 0 # Flags for comments on this post

    # Check that activities related to the post are deleted
    assert Activity.query.filter_by(target_type='post', target_id=post_id).count() == 0
    # Ensure the unrelated activity still exists
    assert Activity.query.get(activity_other_unrelated.id) is not None


def test_unlike_post_csrf_invalid_token(client, app, db, create_test_post, logged_in_client):
    """Test unliking a post with an invalid CSRF token."""
    test_post = create_test_post(content="CSRF invalid token test for unlike")
    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first() # Corrected username

    like_url_val = None
    unlike_url_val = None
    valid_token_val = None

    # Like the post legitimately
    with logged_in_client.application.app_context(): # Use client's context
        from antisocialnet.forms import LikeForm
        form = LikeForm()
        valid_token_val = form.csrf_token.current_token
        like_url_val = url_for('post.like_post_route', post_id=test_post.id) # This endpoint seems to be old, like.like_item_route is the new one
        unlike_url_val = url_for('post.unlike_post_route', post_id=test_post.id) # This endpoint seems to be old, like.unlike_item_route is the new one

    # Use logged_in_client to like, as it has the session
    logged_in_client.post(like_url_val, data={'csrf_token': valid_token_val}, follow_redirects=True)
    db.session.refresh(test_post)
    assert test_post.like_count == 1

    # Attempt to unlike with invalid CSRF token using logged_in_client
    response = logged_in_client.post(unlike_url_val, data={'csrf_token': 'thisisnotavalidtokeneither'}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Could not unlike post. Invalid request or session expired.' in response.data
    db.session.refresh(test_post)
    assert test_post.like_count == 1 # Unlike should not have occurred
