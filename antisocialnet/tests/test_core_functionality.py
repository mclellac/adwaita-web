import pytest
from .. import create_app, db
from ..models import User, Post, Comment, Like, UserPhoto
import os

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Create an admin user
            admin_user = User(username='admin@example.com', full_name='Admin User', is_admin=True, is_approved=True, is_active=True)
            admin_user.set_password('password')
            db.session.add(admin_user)
            from ..models import SiteSetting
            SiteSetting.set('allow_registrations', True, value_type='bool')
            db.session.commit()
            yield client
            db.drop_all()

def register_and_approve_user(client, email, full_name, password):
    """Helper function to register and approve a user."""
    client.post('/auth/register', data={
        'email': email,
        'full_name': full_name,
        'password': password,
        'confirm_password': password
    }, follow_redirects=True)
    with client.application.app_context():
        user = User.query.filter_by(username=email).first()
        user.is_approved = True
        user.is_active = True
        db.session.commit()
    return user

def login_user(client, email, password):
    """Helper function to log in a user."""
    return client.post('/auth/login', data={'username': email, 'password': password}, follow_redirects=True)

def logout_user(client):
    """Helper function to log out a user."""
    return client.get('/auth/logout', follow_redirects=True)

def test_user_registration_and_login_logout(client):
    """Test user registration, login, and logout."""
    # Test registration
    response = client.post('/auth/register', data={
        'email': 'test@example.com',
        'full_name': 'Test User',
        'password': 'password',
        'confirm_password': 'password'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Your account is pending admin approval.' in response.data

    # Test admin approval
    with client.application.app_context():
        user = User.query.filter_by(username='test@example.com').first()
        assert user is not None
        assert not user.is_approved
        user.is_approved = True
        db.session.commit()

    # Test login
    response = login_user(client, 'test@example.com', 'password')
    assert response.status_code == 200
    assert b'Logout' in response.data

    # Test logout
    response = logout_user(client)
    assert response.status_code == 200
    assert b'Login' in response.data

def test_post_creation_editing_and_deletion(client):
    """Test creating, editing, and deleting a post."""
    register_and_approve_user(client, 'poster@example.com', 'Poster User', 'password')
    login_user(client, 'poster@example.com', 'password')

    # Create a post
    response = client.post('/create', data={'content': 'This is my first post!'}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post created successfully!' in response.data
    with client.application.app_context():
        post = Post.query.filter_by(content='This is my first post!').first()
        assert post is not None

    # Edit the post
    response = client.post(f'/posts/{post.id}/edit', data={'content': 'This is my edited post!'}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Post updated successfully!' in response.data
    with client.application.app_context():
        edited_post = Post.query.get(post.id)
        assert edited_post.content == 'This is my edited post!'

    # Delete the post
    response = client.post(f'/posts/{post.id}/delete', follow_redirects=True)
    assert response.status_code == 200
    assert b'Post deleted successfully!' in response.data
    with client.application.app_context():
        deleted_post = Post.query.get(post.id)
        assert deleted_post is None

def test_commenting_on_posts(client):
    """Test commenting on a post and replying to a comment."""
    register_and_approve_user(client, 'commenter@example.com', 'Commenter User', 'password')
    login_user(client, 'commenter@example.com', 'password')

    # Create a post to comment on
    with client.application.app_context():
        post_author = User(username='postauthor@example.com', full_name='Post Author', is_approved=True)
        post_author.set_password('password')
        db.session.add(post_author)
        db.session.commit()
        post = Post(content='A post to be commented on.', user_id=post_author.id)
        db.session.add(post)
        db.session.commit()
        post_id = post.id

    # Add a comment
    response = client.post(f'/posts/{post_id}', data={'text': 'This is a great post!'}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment posted successfully!' in response.data
    with client.application.app_context():
        comment = Comment.query.filter_by(text='This is a great post!').first()
        assert comment is not None

    # Reply to the comment
    response = client.post(f'/posts/{post_id}', data={'text': 'I agree!', 'parent_id': comment.id}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Comment posted successfully!' in response.data
    with client.application.app_context():
        reply = Comment.query.filter_by(text='I agree!').first()
        assert reply is not None
        assert reply.parent_id == comment.id

def test_liking_posts_and_comments(client):
    """Test liking a post and a comment."""
    register_and_approve_user(client, 'liker@example.com', 'Liker User', 'password')
    login_user(client, 'liker@example.com', 'password')

    # Create a post and a comment
    with client.application.app_context():
        post_author = User(username='likeauthor@example.com', full_name='Like Author', is_approved=True)
        post_author.set_password('password')
        db.session.add(post_author)
        db.session.commit()
        post = Post(content='A post to be liked.', user_id=post_author.id)
        db.session.add(post)
        db.session.commit()
        comment = Comment(text='A comment to be liked.', user_id=post_author.id, target_id=post.id, target_type='post')
        db.session.add(comment)
        db.session.commit()
        post_id = post.id
        comment_id = comment.id

    # Like the post
    response = client.post(f'/like/post/{post_id}', follow_redirects=True)
    assert response.status_code == 200
    with client.application.app_context():
        like = Like.query.filter_by(target_id=post_id, target_type='post').first()
        assert like is not None

    # Like the comment
    response = client.post(f'/like/comment/{comment_id}', follow_redirects=True)
    assert response.status_code == 200
    with client.application.app_context():
        like = Like.query.filter_by(target_id=comment_id, target_type='comment').first()
        assert like is not None

def test_profile_page_and_editing(client):
    """Test viewing and editing a user's profile."""
    user = register_and_approve_user(client, 'profileuser@example.com', 'Profile User', 'password')
    login_user(client, 'profileuser@example.com', 'password')

    # View profile page
    response = client.get(f'/profile/{user.id}')
    assert response.status_code == 200
    assert b'Profile User' in response.data

    # Edit profile
    response = client.post('/profile/edit', data={
        'full_name': 'Updated Profile User',
        'profile_info': 'This is my updated bio.',
        'website_url': 'http://new-website.com'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Profile and photo updated successfully!' in response.data
    with client.application.app_context():
        updated_user = User.query.get(user.id)
        assert updated_user.full_name == 'Updated Profile User'
        assert updated_user.profile_info == 'This is my updated bio.'
        assert updated_user.website_url == 'http://new-website.com'

def test_photo_upload_and_gallery(client):
    """Test uploading a profile photo and a gallery photo."""
    user = register_and_approve_user(client, 'photouser@example.com', 'Photo User', 'password')
    login_user(client, 'photouser@example.com', 'password')

    # Upload profile photo
    with open('test_image.png', 'wb') as f:
        f.write(b'test image data')
    with open('test_image.png', 'rb') as f:
        response = client.post('/profile/edit', data={'profile_photo': (f, 'test_image.png')}, content_type='multipart/form-data', follow_redirects=True)
    os.remove('test_image.png')
    assert response.status_code == 200
    assert b'Profile and photo updated successfully!' in response.data

    # Upload gallery photo
    with open('test_gallery_image.png', 'wb') as f:
        f.write(b'test gallery image data')
    with open('test_gallery_image.png', 'rb') as f:
        response = client.post('/profile/gallery/upload', data={'photos': (f, 'test_gallery_image.png'), 'caption': 'A new gallery photo'}, content_type='multipart/form-data', follow_redirects=True)
    os.remove('test_gallery_image.png')
    assert response.status_code == 200
    assert b'1 photo(s) uploaded to gallery successfully!' in response.data
    with client.application.app_context():
        gallery_photo = UserPhoto.query.first()
        assert gallery_photo is not None
        assert gallery_photo.caption == 'A new gallery photo'

def test_admin_features(client):
    """Test administrator features, such as approving users."""
    login_user(client, 'admin@example.com', 'password')

    # Create a pending user
    client.post('/auth/register', data={
        'email': 'pending@example.com',
        'full_name': 'Pending User',
        'password': 'password',
            'confirm_password': 'password'
    })

    # Approve the user
    with client.application.app_context():
        user = User.query.filter_by(username='pending@example.com').first()
        response = client.post(f'/admin/approve_user/{user.id}', follow_redirects=True)
        assert response.status_code == 200
        assert b'User approved successfully.' in response.data
        approved_user = User.query.get(user.id)
        assert approved_user.is_approved
