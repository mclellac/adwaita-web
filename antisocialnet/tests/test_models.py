import pytest
from antisocialnet.models import User, Post, Like, Notification, Activity
from antisocialnet import db # db fixture from conftest.py

def test_like_post(db, create_test_user, create_test_post):
    """Test liking a post."""
    user1 = create_test_user(email_address="liker@example.com", full_name="liker")
    post_author = create_test_user(email_address="postauthor@example.com", full_name="postauthor")
    post1 = create_test_post(author=post_author, content="A post to be liked")

    assert user1.has_liked_item(target_type='post', target_id=post1.id) == False
    assert post1.like_count == 0

    # User1 likes Post1
    result = user1.like_item(target_type='post', target_id=post1.id)
    db.session.commit()

    assert result == True
    assert user1.has_liked_item(target_type='post', target_id=post1.id) == True
    assert post1.like_count == 1

    # Check if PostLike record was created
    like_record = Like.query.filter_by(user_id=user1.id, target_type='post', target_id=post1.id).first()
    assert like_record is not None
    assert like_record.user == user1
    # assert like_record.post == post1 # 'post' attribute no longer directly on Like model

    # Check relationships
    # User.likes is now a generic list, filter for post likes
    user_post_likes = [like for like in user1.likes if like.target_type == 'post' and like.target_id == post1.id]
    assert len(user_post_likes) == 1
    # Post.likes relationship should still work and point to Like objects
    assert user1 in [like.user for like in post1.likes]

def test_unlike_post(db, create_test_user, create_test_post):
    """Test unliking a post."""
    user1 = create_test_user(email_address="unliker@example.com", full_name="unliker")
    post1 = create_test_post(content="A post to be unliked")

    # First, like the post
    user1.like_item(target_type='post', target_id=post1.id)
    db.session.commit()
    assert user1.has_liked_item(target_type='post', target_id=post1.id) == True
    assert post1.like_count == 1

    # Then, unlike the post
    result = user1.unlike_item(target_type='post', target_id=post1.id)
    db.session.commit()

    assert result == True
    assert user1.has_liked_item(target_type='post', target_id=post1.id) == False
    assert post1.like_count == 0

    like_record = Like.query.filter_by(user_id=user1.id, target_type='post', target_id=post1.id).first()
    assert like_record is None

def test_like_own_post(db, create_test_user, create_test_post):
    """Test if a user can like their own post (usually allowed)."""
    user1 = create_test_user(email_address="selfliker@example.com", full_name="selfliker")
    post1 = create_test_post(author=user1, content="My own post")

    result = user1.like_item(target_type='post', target_id=post1.id)
    db.session.commit()

    assert result == True
    assert user1.has_liked_item(target_type='post', target_id=post1.id) == True
    assert post1.like_count == 1

def test_multiple_likes_same_user(db, create_test_user, create_test_post):
    """Test that a user cannot like the same post multiple times."""
    user1 = create_test_user(email_address="multiliker@example.com", full_name="multiliker")
    post1 = create_test_post(content="Post for multi-like test")

    user1.like_item(target_type='post', target_id=post1.id)
    db.session.commit()
    assert post1.like_count == 1

    # Attempt to like again
    result = user1.like_item(target_type='post', target_id=post1.id) # This should return False as per User.like_item logic
    db.session.commit() # Commit to see if DB constraint also catches it (it should due to UniqueConstraint)

    assert result == False
    assert post1.like_count == 1 # Count should not increase

def test_multiple_users_like_post(db, create_test_user, create_test_post):
    """Test that multiple users can like the same post."""
    user1 = create_test_user(email_address="userone@example.com", full_name="userone")
    user2 = create_test_user(email_address="usertwo@example.com", full_name="usertwo")
    post1 = create_test_post(content="Popular post")

    user1.like_item(target_type='post', target_id=post1.id)
    db.session.commit()
    assert post1.like_count == 1

    user2.like_item(target_type='post', target_id=post1.id)
    db.session.commit()
    assert post1.like_count == 2

    assert user1.has_liked_item(target_type='post', target_id=post1.id) == True
    assert user2.has_liked_item(target_type='post', target_id=post1.id) == True

def test_unlike_not_liked_post(db, create_test_user, create_test_post):
    """Test unliking a post that was not liked by the user."""
    user1 = create_test_user(email_address="cautious@example.com", full_name="cautiousunliker")
    post1 = create_test_post(content="A post never liked")

    result = user1.unlike_item(target_type='post', target_id=post1.id) # Should return False
    db.session.commit()

    assert result == False
    assert post1.like_count == 0

def test_post_like_cascade_delete_on_user_delete(db, create_test_user, create_test_post):
    """Test that PostLike records are deleted when a user is deleted."""
    user_to_delete = create_test_user(email_address="userdel@example.com", full_name="userdel")
    post1 = create_test_post(content="Post liked by user_to_delete")
    post2 = create_test_post(content="Another post liked by user_to_delete")

    user_to_delete.like_item(target_type='post', target_id=post1.id)
    user_to_delete.like_item(target_type='post', target_id=post2.id)
    db.session.commit()

    assert Like.query.filter_by(user_id=user_to_delete.id, target_type='post').count() == 2

    user_id = user_to_delete.id
    db.session.delete(user_to_delete)
    db.session.commit()

    assert User.query.get(user_id) is None
    assert Like.query.filter_by(user_id=user_id, target_type='post').count() == 0
    assert post1.like_count == 0 # Assuming only this user liked it
    assert post2.like_count == 0


def test_post_like_cascade_delete_on_post_delete(db, create_test_user, create_test_post):
    """Test that Like records are deleted when a post is deleted."""
    user1 = create_test_user(email_address="u1@example.com", full_name="user1fordelpost")
    user2 = create_test_user(email_address="u2@example.com", full_name="user2fordelpost")
    post_to_delete = create_test_post(content="Post to be deleted")

    user1.like_item(target_type='post', target_id=post_to_delete.id)
    user2.like_item(target_type='post', target_id=post_to_delete.id)
    db.session.commit()

    assert Like.query.filter_by(target_type='post', target_id=post_to_delete.id).count() == 2
    assert post_to_delete.like_count == 2

    post_id = post_to_delete.id
    db.session.delete(post_to_delete) # This should trigger cascade delete for Likes
    db.session.commit()

    assert Post.query.get(post_id) is None
    assert Like.query.filter_by(target_type='post', target_id=post_id).count() == 0
    # Check if user's liked_items relationship is also updated (it should be empty for this post)
    assert not user1.has_liked_item(target_type='post', target_id=post_id) # post_to_delete is now detached
    # A more direct check would be to query Like via user1.likes after post deletion
    # but since the post is gone, Like records are also gone.
    assert Like.query.filter_by(user_id=user1.id, target_type='post', target_id=post_id).first() is None
    assert Like.query.filter_by(user_id=user2.id, target_type='post', target_id=post_id).first() is None

# Placeholder for testing notifications/activity logs related to likes in model interactions
# These might be better in route tests where the full context is available.
# However, if model methods directly create them, they could be tested here.
# The current like_post/unlike_post methods in User model do not directly create notifications/activities.
# These are created in the routes.

# Tests for Password Reset Token
def test_get_reset_password_token(db, create_test_user, app): # Added app fixture for app.config
    """Test token generation."""
    user = create_test_user(email_address="token@example.com", full_name="tokenuser")
    with app.app_context(): # Need app context for current_app.config['SECRET_KEY']
        token = user.get_reset_password_token()
    assert token is not None
    assert isinstance(token, str)

def test_verify_reset_password_token_valid(db, create_test_user, app):
    """Test token verification with a valid token."""
    user = create_test_user(email_address="validtoken@example.com", full_name="validtokenuser")
    with app.app_context():
        token = user.get_reset_password_token()
        verified_user = User.verify_reset_password_token(token)
    assert verified_user is not None
    assert verified_user.id == user.id
    assert verified_user.username == user.username

def test_verify_reset_password_token_expired(db, create_test_user, app):
    """Test token verification with an expired token."""
    user = create_test_user(email_address="expiredtoken@example.com", full_name="expiredtokenuser")
    with app.app_context():
        token = user.get_reset_password_token(expires_in_seconds=-1) # Expired token
        verified_user = User.verify_reset_password_token(token)
    assert verified_user is None

def test_verify_reset_password_token_invalid_signature(db, create_test_user, app):
    """Test token verification with an invalid signature (tampered token)."""
    user = create_test_user(email_address="tampered@example.com", full_name="tamperedtokenuser")
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
    user1 = create_test_user(email_address="user1payload@example.com", full_name="user1payload")
    # user2 = create_test_user(email_address="user2payload@example.com", full_name="user2payload")

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
