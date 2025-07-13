import pytest
from flask import url_for
from antisocialnet.models import User, Post, Notification, Activity
from antisocialnet import db
from datetime import datetime, timedelta, timezone

# Helper to create a notification for testing
def create_test_notification(db_session, user_recipient, actor_user, type="new_like", target_object=None, is_read=False, days_offset=0):
    ts = datetime.now(timezone.utc) - timedelta(days=days_offset)
    notif = Notification(
        user_id=user_recipient.id,
        actor_id=actor_user.id,
        type=type,
        is_read=is_read,
        timestamp=ts
    )
    if target_object:
        if isinstance(target_object, Post):
            notif.target_type = 'post'
            notif.target_id = target_object.id
        # Add other target types if needed (Comment, UserPhoto, etc.)
    db.session.add(notif)
    db.session.commit()
    return notif

# --- List Notifications Route Tests (/notifications/) ---
def test_list_notifications_unauthenticated(client):
    """Test unauthenticated access to /notifications/ redirects to login."""
    with client.application.test_request_context():
        response = client.get(url_for('notification.list_notifications'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data

def test_list_notifications_authenticated_no_notifications(client, logged_in_client):
    """Test authenticated user with no notifications."""
    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('notification.list_notifications'))
    assert response.status_code == 200
    assert b"Notifications" in response.data # Page title/header
    assert b"You have no notifications." in response.data # Empty message

def test_list_notifications_authenticated_with_unread_and_read(client, logged_in_client, db, create_test_user, create_test_post):
    """Test listing notifications with a mix of read and unread."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first() # from logged_in_client
    actor = create_test_user(email_address="actor_n@example.com", full_name="actor_user_notif")
    post_target = create_test_post(author=actor, content="Target post for notification")

    # Create notifications
    notif_unread = create_test_notification(db, current_user, actor, type="new_comment", target_object=post_target, is_read=False, days_offset=0)
    notif_read = create_test_notification(db, current_user, actor, type="new_like", target_object=post_target, is_read=True, days_offset=1)

    # Notification for another user (should not be visible)
    other_user = create_test_user(email_address="other_n@example.com", full_name="other_user_notif")
    create_test_notification(db, other_user, actor, type="new_follower", target_object=current_user, is_read=False)

    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('notification.list_notifications'))
    assert response.status_code == 200
    assert b"Notifications" in response.data

    # Check for unread notification content (more specific checks depend on template rendering)
    # Example: "actor_user_notif commented on your post Target post for notification"
    assert bytes(actor.username, 'utf-8') in response.data
    assert b"commented on" in response.data
    assert bytes(post_target.content[:20], 'utf-8') in response.data # Check for part of post content

    # Check for read notification content
    assert b"liked your post" in response.data

    # Check that other_user's notification is not present
    # This is harder to assert directly by absence of specific text if text is generic.
    # Count of items or specific links might be better.

    # The template marks unread notifications, e.g. with a class or specific text.
    # A more robust test would parse HTML or check for specific markers of read/unread.
    # For now, presence of text implies it's listed.

    # Check unread count in context (if available and used by base template)
    # This is tested by context processor, but good to see here.
    # The response for /notifications itself might not directly show the global unread count badge
    # if that's only in the site header.

def test_list_notifications_pagination(client, logged_in_client, app, db, create_test_user, create_test_post):
    """Test pagination for notifications."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    actor = create_test_user(email_address="anp@example.com", full_name="actor_notif_pager")
    post_target = create_test_post(author=actor, content="Post for paginated notifications")

    with logged_in_client.application.test_request_context():
        # Notification route uses 'POSTS_PER_PAGE' from config for pagination size
        original_ppp = app.config.get('POSTS_PER_PAGE', 10)
        app.config['POSTS_PER_PAGE'] = 2 # 2 notifications per page

    for i in range(5): # Create 5 notifications
        create_test_notification(db, current_user, actor, type=f"test_type_{i}", target_object=post_target, days_offset=i)

    with logged_in_client.application.test_request_context():
        # Page 1
        response_p1 = logged_in_client.get(url_for('notification.list_notifications', page=1))
        assert response_p1.status_code == 200
        # Notifications are ordered by timestamp desc (newest first)
        assert b"test_type_0" in response_p1.data # days_offset=0 is newest
        assert b"test_type_1" in response_p1.data
        assert b"test_type_2" not in response_p1.data
        assert b"Next" in response_p1.data

        # Page 3 (last page)
        response_p3 = logged_in_client.get(url_for('notification.list_notifications', page=3))
    assert response_p3.status_code == 200
    assert b"test_type_4" in response_p3.data # days_offset=4 is oldest
    assert b"test_type_3" not in response_p3.data # Should be on page 2
    assert b"Previous" in response_p3.data
    assert b"Next" not in response_p3.data # No more pages

    with app.app_context():
        app.config['POSTS_PER_PAGE'] = original_ppp # Reset


# --- Mark Notification as Read Route Tests ---
def test_mark_notification_as_read_successful(client, app, logged_in_client, db, create_test_user):
    """Test successfully marking a single notification as read."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    actor = create_test_user(email_address="amr@example.com", full_name="actor_mark_read")
    unread_notif = create_test_notification(db, current_user, actor, type="to_be_read", is_read=False)

    assert not unread_notif.is_read

    with app.app_context(): # For CSRF and url_for
        from flask_wtf import FlaskForm
        form = FlaskForm()
        token = form.csrf_token.current_token
        url = url_for('notification.mark_as_read', notification_id=unread_notif.id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Notification marked as read." in response.data
    # Should redirect back to notifications list or original page
    assert b"Notifications" in response.data # Assuming redirect to list_notifications

    db.session.refresh(unread_notif)
    assert unread_notif.is_read

def test_mark_notification_as_read_unauthenticated(client, db, create_test_user):
    """Test unauthenticated attempt to mark notification as read."""
    user = create_test_user(email_address="ufnu@example.com", full_name="user_for_notif_unauth")
    actor = create_test_user(email_address="afnu@example.com", full_name="actor_for_notif_unauth")
    notif = create_test_notification(db, user, actor, is_read=False)

    with client.application.test_request_context():
        url = url_for('notification.mark_as_read', notification_id=notif.id)
    response = client.post(url, data={'csrf_token':'dummy'}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data

def test_mark_notification_as_read_not_own_notification(client, logged_in_client, app, db, create_test_user):
    """Test attempting to mark another user's notification as read (should fail - 403/404)."""
    other_user = create_test_user(email_address="oufn@example.com", full_name="other_user_for_notif")
    actor = User.query.filter_by(username="login_fixture_user@example.com").first() # Current user is actor
    other_users_notif = create_test_notification(db, other_user, actor, is_read=False)

    with app.app_context(): # For CSRF and url_for
        from flask_wtf import FlaskForm
        form = FlaskForm()
        token = form.csrf_token.current_token
        url = url_for('notification.mark_as_read', notification_id=other_users_notif.id)
    response = logged_in_client.post(url, data={'csrf_token':token})
    # Route uses get_or_404 on Notification query filtered by current_user.id
    assert response.status_code == 404
    assert not other_users_notif.is_read # Ensure it wasn't changed

def test_mark_notification_as_read_already_read(client, app, logged_in_client, db, create_test_user):
    """Test marking an already read notification (should be graceful)."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    actor = create_test_user(email_address="aar@example.com", full_name="actor_already_read")
    read_notif = create_test_notification(db, current_user, actor, is_read=True)

    with app.app_context(): # For CSRF and url_for
        from flask_wtf import FlaskForm
        form = FlaskForm()
        token = form.csrf_token.current_token
        url = url_for('notification.mark_as_read', notification_id=read_notif.id)
    response = logged_in_client.post(url, data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Notification already marked as read." in response.data # Check for specific message

def test_mark_notification_as_read_csrf_missing(client, logged_in_client, db, create_test_user):
    """Test CSRF protection for marking notification as read."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    actor = create_test_user(email_address="acsr@example.com", full_name="actor_csrf_read")
    unread_notif = create_test_notification(db, current_user, actor, is_read=False)

    with logged_in_client.application.test_request_context():
        url = url_for('notification.mark_as_read', notification_id=unread_notif.id)
    response = logged_in_client.post(url, data={})
    assert response.status_code == 400 # Direct CSRF failure
    db.session.refresh(unread_notif)
    assert not unread_notif.is_read


# --- Mark All Notifications as Read Route Tests ---
def test_mark_all_notifications_as_read_successful(client, app, logged_in_client, db, create_test_user):
    """Test successfully marking all unread notifications as read."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    actor = create_test_user(email_address="ama@example.com", full_name="actor_mark_all")

    notif1 = create_test_notification(db, current_user, actor, type="unread1", is_read=False, days_offset=2)
    notif2 = create_test_notification(db, current_user, actor, type="unread2", is_read=False, days_offset=1)
    notif_already_read = create_test_notification(db, current_user, actor, type="already_read", is_read=True, days_offset=3)

    assert Notification.query.filter_by(user_id=current_user.id, is_read=False).count() == 2

    with app.app_context(): # For CSRF and url_for
        from flask_wtf import FlaskForm
        form = FlaskForm()
        token = form.csrf_token.current_token
        url = url_for('notification.mark_all_as_read')
    response = logged_in_client.post(url, data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"All notifications marked as read." in response.data
    assert b"Notifications" in response.data # Redirects to list

    assert Notification.query.filter_by(user_id=current_user.id, is_read=False).count() == 0
    db.session.refresh(notif1); db.session.refresh(notif2); db.session.refresh(notif_already_read)
    assert notif1.is_read
    assert notif2.is_read
    assert notif_already_read.is_read # Should remain read

def test_mark_all_notifications_as_read_no_unread(client, app, logged_in_client, db, create_test_user):
    """Test marking all as read when user has no unread notifications."""
    current_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    actor = create_test_user(email_address="anu@example.com", full_name="actor_no_unread")
    create_test_notification(db, current_user, actor, type="all_read_test", is_read=True)

    assert Notification.query.filter_by(user_id=current_user.id, is_read=False).count() == 0

    with app.app_context(): # For CSRF and url_for
        from flask_wtf import FlaskForm
        form = FlaskForm()
        token = form.csrf_token.current_token
        url = url_for('notification.mark_all_as_read')
    response = logged_in_client.post(url, data={'csrf_token':token}, follow_redirects=True)
    assert response.status_code == 200
    # The route might flash "No unread notifications." or "All notifications marked as read."
    # Current route logic flashes "All notifications marked as read." regardless.
    assert b"All notifications marked as read." in response.data

def test_mark_all_notifications_as_read_csrf_missing(client, logged_in_client):
    """Test CSRF protection for mark_all_as_read."""
    with logged_in_client.application.test_request_context():
        url = url_for('notification.mark_all_as_read')
    response = logged_in_client.post(url, data={})
    assert response.status_code == 400
