import pytest
from flask import url_for
from antisocialnet.models import User, Post, UserPhoto, Like, Comment
from antisocialnet import db
from datetime import datetime, timedelta, timezone

def create_api_test_photo(db_session, user, filename_suffix="photo.jpg", caption="API Test Photo", days_offset=0):
    ts = datetime.now(timezone.utc) - timedelta(days=days_offset)
    photo = UserPhoto(
        user_id=user.id,
        image_filename=f"{user.id}_api_{filename_suffix}",
        caption=caption,
        uploaded_at=ts
    )
    db_session.session.add(photo)
    db_session.session.commit()
    return photo

def create_api_test_post(db_session, user, content="API Test Post Content", days_offset=0, is_published=True):
    ts = datetime.now(timezone.utc) - timedelta(days=days_offset)
    post = Post(
        user_id=user.id,
        content=content,
        created_at=ts,
        published_at=ts if is_published else None,
        is_published=is_published
    )
    db_session.session.add(post)
    db_session.session.commit()
    return post

def test_api_feed_unauthenticated(client):
    """Test GET /api/v1/feed when not authenticated."""
    response = client.get(url_for('api.get_feed'))
    assert response.status_code == 302

def test_api_feed_authenticated_empty(logged_in_client):
    """Test authenticated GET /api/v1/feed with no posts or photos."""
    response = logged_in_client.get(url_for('api.get_feed'))
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['items'] == []
    assert json_data['pagination']['total_items'] == 0

def test_api_feed_with_posts_and_photos(logged_in_client, db, create_test_user):
    """Test API feed with a mix of posts and photos."""
    user = create_test_user(email_address="testuser@example.com", full_name="Test User")
    post = create_api_test_post(db, user, content="Test Post")
    photo = create_api_test_photo(db, user, caption="Test Photo")

    response = logged_in_client.get(url_for('api.get_feed'))
    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data['items']) == 2
    assert json_data['pagination']['total_items'] == 2

    # Check that both items are in the feed
    item_types = {item['type'] for item in json_data['items']}
    assert 'post' in item_types
    assert 'photo' in item_types

def test_get_item(logged_in_client, db, create_test_user):
    """Test the /api/v1/item/<item_type>/<item_id> endpoint."""
    user = create_test_user(email_address="testuser@example.com", full_name="Test User")
    post = create_api_test_post(db, user, content="Test Post")

    response = logged_in_client.get(url_for('api.get_item', item_type='post', item_id=post.id))
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['id'] == f"post_{post.id}"
    assert json_data['data']['post_id'] == post.id

def test_get_item_like_details(logged_in_client, db, create_test_user):
    """Test the /api/v1/item/<target_type>/<target_id>/like_details endpoint."""
    user = create_test_user(email_address="testuser@example.com", full_name="Test User")
    post = create_api_test_post(db, user, content="Test Post")

    response = logged_in_client.get(url_for('api.get_item_like_details', target_type='post', target_id=post.id))
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['like_count'] == 0
    assert not json_data['current_user_has_liked']

    # Like the post and check again
    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    like = Like(user_id=liking_user.id, target_type='post', target_id=post.id)
    db.session.add(like)
    db.session.commit()

    response = logged_in_client.get(url_for('api.get_item_like_details', target_type='post', target_id=post.id))
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['like_count'] == 1
    assert json_data['current_user_has_liked']

def test_get_item_comments(logged_in_client, db, create_test_user):
    """Test the /api/v1/item/<target_type>/<target_id>/comments endpoint."""
    user = create_test_user(email_address="testuser@example.com", full_name="Test User")
    post = create_api_test_post(db, user, content="Test Post")
    commenter = create_test_user(email_address="commenter@example.com", full_name="Commenter")
    comment = Comment(text="Test comment", user_id=commenter.id, target_type='post', target_id=post.id)
    db.session.add(comment)
    db.session.commit()

    response = logged_in_client.get(url_for('api.get_item_comments', target_type='post', target_id=post.id))
    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data['comments']) == 1
    assert json_data['comments'][0]['data']['comment_id'] == comment.id
