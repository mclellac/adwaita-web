import pytest
from .. import create_app, db
from ..models import User, Post, Comment

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_register_and_login(client):
    """Test user registration and login."""
    # Register a new user
    response = client.post('/auth/register', data={
        'email': 'testuser@example.com',
        'full_name': 'Test User',
        'password': 'password',
        'password2': 'password'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Your account is pending admin approval.' in response.data

    # Approve the user
    with client.application.app_context():
        user = User.query.filter_by(username='testuser@example.com').first()
        if user:
            user.is_approved = True
            db.session.commit()

    # Login
    response = client.post('/auth/login', data={
        'username': 'testuser@example.com',
        'password': 'password'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Logout' in response.data

def test_create_post_and_comment(client):
    """Test creating a post and adding a comment."""
    # Register and login a user
    client.post('/auth/register', data={'email': 'testuser@example.com', 'full_name': 'Test User', 'password': 'password', 'password2': 'password'})
    with client.application.app_context():
        user = User.query.filter_by(username='testuser@example.com').first()
        if user:
            user.is_approved = True
            db.session.commit()
    client.post('/auth/login', data={'username': 'testuser@example.com', 'password': 'password'})

    # Create a post
    response = client.post('/post/create_post', data={'content': 'This is a test post.'}, follow_redirects=True)
    assert response.status_code == 200
    assert b'This is a test post.' in response.data

    # Add a comment
    with client.application.app_context():
        post = Post.query.first()
        response = client.post(f'/post/{post.id}', data={'text': 'This is a test comment.'}, follow_redirects=True)
        assert response.status_code == 200
        assert b'This is a test comment.' in response.data

def test_profile_page(client):
    """Test that the profile page loads correctly."""
    # Register and login a user
    client.post('/auth/register', data={'email': 'testuser@example.com', 'full_name': 'Test User', 'password': 'password', 'password2': 'password'})
    with client.application.app_context():
        user = User.query.filter_by(username='testuser@example.com').first()
        if user:
            user.is_approved = True
            db.session.commit()
    client.post('/auth/login', data={'username': 'testuser@example.com', 'password': 'password'})

    # View profile page
    with client.application.app_context():
        user = User.query.filter_by(username='testuser@example.com').first()
        response = client.get(f'/profile/{user.id}')
        assert response.status_code == 200
        assert b'Test User' in response.data

def test_edit_profile(client):
    """Test editing a user's profile."""
    # Register and login a user
    client.post('/auth/register', data={'email': 'testuser@example.com', 'full_name': 'Test User', 'password': 'password', 'password2': 'password'})
    with client.application.app_context():
        user = User.query.filter_by(username='testuser@example.com').first()
        if user:
            user.is_approved = True
            db.session.commit()
    client.post('/auth/login', data={'username': 'testuser@example.com', 'password': 'password'})

    # Edit profile
    response = client.post('/profile/edit', data={
        'full_name': 'Updated User',
        'profile_info': 'This is my updated profile.',
        'website_url': 'https://example.com'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Updated User' in response.data
    assert b'This is my updated profile.' in response.data
    assert b'https://example.com' in response.data

def test_notifications(client):
    """Test that notifications are created and displayed."""
    # Register and login two users
    client.post('/auth/register', data={'email': 'user1@example.com', 'full_name': 'User One', 'password': 'password', 'password2': 'password'})
    client.post('/auth/register', data={'email': 'user2@example.com', 'full_name': 'User Two', 'password': 'password', 'password2': 'password'})
    with client.application.app_context():
        user1 = User.query.filter_by(username='user1@example.com').first()
        if user1:
            user1.is_approved = True
        user2 = User.query.filter_by(username='user2@example.com').first()
        if user2:
            user2.is_approved = True
        db.session.commit()
    client.post('/auth/login', data={'username': 'user1@example.com', 'password': 'password'})

    # User 1 follows User 2
    with client.application.app_context():
        user2 = User.query.filter_by(username='user2@example.com').first()
        client.post(f'/profile/follow/{user2.id}', follow_redirects=True)

    # Logout and login as User 2
    client.get('/auth/logout')
    client.post('/auth/login', data={'username': 'user2@example.com', 'password': 'password'})

    # Check for notification
    response = client.get('/notifications')
    assert response.status_code == 200
    assert b'User One is now following you.' in response.data
