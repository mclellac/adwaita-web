import pytest
from antisocialnet.models import User, Post, PostLike, Notification, Activity
from antisocialnet import db # db fixture from conftest.py

def test_like_post(db, create_test_user, create_test_post):
    """Test liking a post."""
    user1 = create_test_user(username="liker", email="liker@example.com")
    post_author = create_test_user(username="postauthor", email="postauthor@example.com")
    post1 = create_test_post(author=post_author, content="A post to be liked")

    assert user1.has_liked_post(post1) == False
    assert post1.like_count == 0

    # User1 likes Post1
    result = user1.like_post(post1)
    db.session.commit()

    assert result == True
    assert user1.has_liked_post(post1) == True
    assert post1.like_count == 1

    # Check if PostLike record was created
    like_record = PostLike.query.filter_by(user_id=user1.id, post_id=post1.id).first()
    assert like_record is not None
    assert like_record.user == user1
    assert like_record.post == post1

    # Check relationships
    assert post1 in [pl.post for pl in user1.post_likes] # User.post_likes relationship
    assert user1 in [pl.user for pl in post1.likes]      # Post.likes relationship

def test_unlike_post(db, create_test_user, create_test_post):
    """Test unliking a post."""
    user1 = create_test_user(username="unliker", email="unliker@example.com")
    post1 = create_test_post(content="A post to be unliked")

    # First, like the post
    user1.like_post(post1)
    db.session.commit()
    assert user1.has_liked_post(post1) == True
    assert post1.like_count == 1

    # Then, unlike the post
    result = user1.unlike_post(post1)
    db.session.commit()

    assert result == True
    assert user1.has_liked_post(post1) == False
    assert post1.like_count == 0

    like_record = PostLike.query.filter_by(user_id=user1.id, post_id=post1.id).first()
    assert like_record is None

def test_like_own_post(db, create_test_user, create_test_post):
    """Test if a user can like their own post (usually allowed)."""
    user1 = create_test_user(username="selfliker", email="selfliker@example.com")
    post1 = create_test_post(author=user1, content="My own post")

    result = user1.like_post(post1)
    db.session.commit()

    assert result == True
    assert user1.has_liked_post(post1) == True
    assert post1.like_count == 1

def test_multiple_likes_same_user(db, create_test_user, create_test_post):
    """Test that a user cannot like the same post multiple times."""
    user1 = create_test_user(username="multiliker", email="multiliker@example.com")
    post1 = create_test_post(content="Post for multi-like test")

    user1.like_post(post1)
    db.session.commit()
    assert post1.like_count == 1

    # Attempt to like again
    result = user1.like_post(post1) # This should return False as per User.like_post logic
    db.session.commit() # Commit to see if DB constraint also catches it (it should due to UniqueConstraint)

    assert result == False
    assert post1.like_count == 1 # Count should not increase

def test_multiple_users_like_post(db, create_test_user, create_test_post):
    """Test that multiple users can like the same post."""
    user1 = create_test_user(username="userone", email="userone@example.com")
    user2 = create_test_user(username="usertwo", email="usertwo@example.com")
    post1 = create_test_post(content="Popular post")

    user1.like_post(post1)
    db.session.commit()
    assert post1.like_count == 1

    user2.like_post(post1)
    db.session.commit()
    assert post1.like_count == 2

    assert user1.has_liked_post(post1) == True
    assert user2.has_liked_post(post1) == True

def test_unlike_not_liked_post(db, create_test_user, create_test_post):
    """Test unliking a post that was not liked by the user."""
    user1 = create_test_user(username="cautiousunliker", email="cautious@example.com")
    post1 = create_test_post(content="A post never liked")

    result = user1.unlike_post(post1) # Should return False
    db.session.commit()

    assert result == False
    assert post1.like_count == 0

def test_post_like_cascade_delete_on_user_delete(db, create_test_user, create_test_post):
    """Test that PostLike records are deleted when a user is deleted."""
    user_to_delete = create_test_user(username="userdel", email="userdel@example.com")
    post1 = create_test_post(content="Post liked by user_to_delete")
    post2 = create_test_post(content="Another post liked by user_to_delete")

    user_to_delete.like_post(post1)
    user_to_delete.like_post(post2)
    db.session.commit()

    assert PostLike.query.filter_by(user_id=user_to_delete.id).count() == 2

    user_id = user_to_delete.id
    db.session.delete(user_to_delete)
    db.session.commit()

    assert User.query.get(user_id) is None
    assert PostLike.query.filter_by(user_id=user_id).count() == 0
    assert post1.like_count == 0 # Assuming only this user liked it
    assert post2.like_count == 0


def test_post_like_cascade_delete_on_post_delete(db, create_test_user, create_test_post):
    """Test that PostLike records are deleted when a post is deleted."""
    user1 = create_test_user(username="user1fordelpost", email="u1@example.com")
    user2 = create_test_user(username="user2fordelpost", email="u2@example.com")
    post_to_delete = create_test_post(content="Post to be deleted")

    user1.like_post(post_to_delete)
    user2.like_post(post_to_delete)
    db.session.commit()

    assert PostLike.query.filter_by(post_id=post_to_delete.id).count() == 2
    assert post_to_delete.like_count == 2

    post_id = post_to_delete.id
    db.session.delete(post_to_delete) # This should trigger cascade delete for PostLikes
    db.session.commit()

    assert Post.query.get(post_id) is None
    assert PostLike.query.filter_by(post_id=post_id).count() == 0
    # Check if user's liked_posts relationship is also updated (it should be empty for this post)
    assert not user1.has_liked_post(post_to_delete) # post_to_delete is now detached
    # A more direct check would be to query PostLike via user1.post_likes after post deletion
    # but since the post is gone, PostLike records are also gone.
    assert PostLike.query.filter_by(user_id=user1.id, post_id=post_id).first() is None
    assert PostLike.query.filter_by(user_id=user2.id, post_id=post_id).first() is None

# Placeholder for testing notifications/activity logs related to likes in model interactions
# These might be better in route tests where the full context is available.
# However, if model methods directly create them, they could be tested here.
# The current like_post/unlike_post methods in User model do not directly create notifications/activities.
# These are created in the routes.

# Tests for Password Reset Token
def test_get_reset_password_token(db, create_test_user, app): # Added app fixture for app.config
    """Test token generation."""
    user = create_test_user(username="tokenuser", email="token@example.com")
    with app.app_context(): # Need app context for current_app.config['SECRET_KEY']
        token = user.get_reset_password_token()
    assert token is not None
    assert isinstance(token, str)

def test_verify_reset_password_token_valid(db, create_test_user, app):
    """Test token verification with a valid token."""
    user = create_test_user(username="validtokenuser", email="validtoken@example.com")
    with app.app_context():
        token = user.get_reset_password_token()
        verified_user = User.verify_reset_password_token(token)
    assert verified_user is not None
    assert verified_user.id == user.id
    assert verified_user.username == user.username

def test_verify_reset_password_token_expired(db, create_test_user, app):
    """Test token verification with an expired token."""
    user = create_test_user(username="expiredtokenuser", email="expiredtoken@example.com")
    with app.app_context():
        token = user.get_reset_password_token(expires_in_seconds=-1) # Expired token
        verified_user = User.verify_reset_password_token(token)
    assert verified_user is None

def test_verify_reset_password_token_invalid_signature(db, create_test_user, app):
    """Test token verification with an invalid signature (tampered token)."""
    user = create_test_user(username="tamperedtokenuser", email="tampered@example.com")
    with app.app_context():
        token_good_user = user.get_reset_password_token()

        # Change the app's secret key temporarily to make the original token invalid
        original_secret_key = app.config['SECRET_KEY']
        app.config['SECRET_KEY'] = 'a-different-secret-key'

        verified_user_tampered_key = User.verify_reset_password_token(token_good_user)
        assert verified_user_tampered_key is None

        # Restore original secret key
        app.config['SECRET_KEY'] = original_secret_key

        # Verify with a completely bogus token string
        verified_user_bogus_token = User.verify_reset_password_token("this.is.not.a.valid.token")
        assert verified_user_bogus_token is None


def test_verify_reset_password_token_different_user_id_payload(db, create_test_user, app):
    """Test token verification with a validly signed token but incorrect user_id in payload."""
    user1 = create_test_user(username="user1payload", email="user1payload@example.com")
    # user2 = create_test_user(username="user2payload", email="user2payload@example.com")

    import jwt
    from datetime import datetime, timedelta, timezone

    with app.app_context():
        # Manually create a token with user1's ID but that we might try to use for user2
        # Or, more simply, a token with a non-existent user ID
        non_existent_user_id = 99999
        payload = {
            'reset_password_user_id': non_existent_user_id,
            'exp': datetime.now(timezone.utc) + timedelta(seconds=1800)
        }
        token_wrong_id = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

        verified_user = User.verify_reset_password_token(token_wrong_id)
        assert verified_user is None # Because user 99999 does not exist

def test_verify_reset_password_token_no_user_id_in_payload(db, app):
    """Test token verification if 'reset_password_user_id' is missing from payload."""
    import jwt
    from datetime import datetime, timedelta, timezone
    with app.app_context():
        payload = {
            # 'reset_password_user_id': 1, # Missing user_id
            'exp': datetime.now(timezone.utc) + timedelta(seconds=1800),
            'some_other_data': 'foo'
        }
        token_no_id = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
        verified_user = User.verify_reset_password_token(token_no_id)
    assert verified_user is None
