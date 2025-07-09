import pytest
from flask import url_for
from app_demo.models import User, Post, FollowerLink, SiteSetting
from app_demo import db
from io import BytesIO

# --- View Profile Route Tests ---
def test_view_profile_exists_public(client, create_test_user):
    """Test viewing an existing public profile."""
    profile_user = create_test_user(username="profileowner", email="profile@example.com", full_name="Profile Owner Name", profile_info="Public bio.", is_profile_public=True)
    response = client.get(url_for('profile.view_profile', username=profile_user.username))
    assert response.status_code == 200
    assert b"Profile Owner Name" in response.data
    assert b"Public bio." in response.data
    assert b"Edit Profile" not in response.data # Anonymous user shouldn't see edit button

def test_view_profile_exists_private_anonymous(client, create_test_user):
    """Test anonymous user viewing a private profile results in 403 (or redirect/message)."""
    # Current logic in profile.html shows limited info for private profiles, not a 403 from route.
    # Let's test the template behavior.
    private_user = create_test_user(username="privateprof", email="private@example.com", full_name="Private User", is_profile_public=False)
    response = client.get(url_for('profile.view_profile', username=private_user.username))
    assert response.status_code == 200 # Page loads, but content should be restricted
    assert b"Private User" in response.data # Name might still be visible
    assert b"This profile is private." in response.data # Expected message from template

def test_view_own_profile_authenticated(client, logged_in_client):
    """Test authenticated user viewing their own profile."""
    # logged_in_client is 'loginuser'
    login_user = User.query.filter_by(username="loginuser").first()
    login_user.profile_info = "My own detailed bio."
    login_user.is_profile_public = False # Even if private, should see full details
    db.session.commit()

    response = logged_in_client.get(url_for('profile.view_profile', username=login_user.username))
    assert response.status_code == 200
    assert bytes(login_user.full_name, 'utf-8') in response.data
    assert b"My own detailed bio." in response.data
    assert b"Edit Profile" in response.data # Should see edit button
    assert b"This profile is private." not in response.data # Should see full profile

def test_view_other_private_profile_authenticated(client, logged_in_client, create_test_user):
    """Test authenticated user viewing another user's private profile."""
    private_user = create_test_user(username="otherprivate", email="op@example.com", full_name="Other Private User", is_profile_public=False)
    response = logged_in_client.get(url_for('profile.view_profile', username=private_user.username))
    assert response.status_code == 200
    assert b"Other Private User" in response.data
    assert b"This profile is private." in response.data
    assert b"Edit Profile" not in response.data

def test_view_profile_nonexistent(client):
    """Test viewing a non-existent profile returns 404."""
    response = client.get(url_for('profile.view_profile', username="nosuchuseraroundhere"))
    assert response.status_code == 404

def test_view_profile_shows_user_posts(client, create_test_user, create_test_post):
    """Test that a user's public posts are shown on their profile."""
    profile_user = create_test_user(username="profileposter", email="pp@example.com")
    post1 = create_test_post(author=profile_user, content="Profile Post Alpha", is_published=True)
    post2 = create_test_post(author=profile_user, content="Profile Post Beta (Unpublished)", is_published=False)

    response = client.get(url_for('profile.view_profile', username=profile_user.username))
    assert response.status_code == 200
    assert b"Profile Post Alpha" in response.data
    assert b"Profile Post Beta (Unpublished)" not in response.data # Only own unpublished visible if logged in as author

# --- Edit Profile Route Tests (GET) ---
def test_edit_profile_page_loads_authenticated(client, logged_in_client):
    """Test GET /profile/edit loads form for authenticated user."""
    login_user = User.query.filter_by(username="loginuser").first()
    login_user.full_name = "Login User Fullname" # Ensure some data to check pre-fill
    login_user.profile_info = "Bio for editing."
    db.session.commit()

    response = logged_in_client.get(url_for('profile.edit_profile'))
    assert response.status_code == 200
    assert b"Edit Your Profile" in response.data
    assert b"Login User Fullname" in response.data # Check pre-fill
    assert b"Bio for editing." in response.data   # Check pre-fill

def test_edit_profile_page_unauthenticated(client):
    """Test GET /profile/edit for unauthenticated user redirects to login."""
    response = client.get(url_for('profile.edit_profile'), follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data
    assert b"Log In" in response.data

# --- Edit Profile Route Tests (POST) ---
def test_edit_profile_post_successful_update(client, app, logged_in_client, db):
    """Test successful profile update via POST."""
    user = User.query.filter_by(username="loginuser").first()
    original_full_name = user.full_name
    original_website = user.website_url

    with app.app_context():
        from app_demo.forms import ProfileEditForm
        form = ProfileEditForm(); token = form.csrf_token.current_token

    new_full_name = "Updated Full Name"
    new_bio = "This is my updated bio."
    new_website = "http://updated.example.com"

    form_data = {
        'full_name': new_full_name,
        'profile_info': new_bio,
        'website_url': new_website,
        'street_address': '123 Test St',
        'city': 'Testville',
        'state_province': 'TS',
        'postal_code': '12345',
        'country': 'Testland',
        'home_phone': '555-0101',
        'mobile_phone': '555-0102',
        'birthdate': '2000-01-01', # YYYY-MM-DD
        'is_profile_public': True, # Send as 'y' or True, form coerces
        'csrf_token': token
        # profile_photo is not included in this test for simplicity
    }

    response = logged_in_client.post(url_for('profile.edit_profile'), data=form_data, follow_redirects=True)
    assert response.status_code == 200
    assert b"Profile updated successfully!" in response.data
    # Should redirect to view_profile page
    assert bytes(new_full_name, 'utf-8') in response.data
    assert bytes(new_bio, 'utf-8') in response.data

    db.session.refresh(user)
    assert user.full_name == new_full_name
    assert user.profile_info == new_bio
    assert user.website_url == new_website
    assert user.street_address == '123 Test St'
    assert user.is_profile_public == True
    from datetime import date
    assert user.birthdate == date(2000,1,1)

def test_edit_profile_post_validation_error(client, app, logged_in_client):
    """Test profile update with a validation error (e.g., full_name empty)."""
    with app.app_context():
        from app_demo.forms import ProfileEditForm
        form = ProfileEditForm(); token = form.csrf_token.current_token

    form_data = {
        'full_name': '', # Empty full_name, which is required
        'profile_info': 'Bio here',
        'csrf_token': token
    }
    response = logged_in_client.post(url_for('profile.edit_profile'), data=form_data, follow_redirects=True)
    assert response.status_code == 200 # Stays on edit_profile page
    assert b"This field is required." in response.data # WTForms DataRequired for full_name
    assert b"Edit Your Profile" in response.data # Still on edit page

def test_edit_profile_post_photo_upload(client, app, logged_in_client, db):
    """Test profile update with a photo upload."""
    user = User.query.filter_by(username="loginuser").first()
    original_photo_url = user.profile_photo_url

    with app.app_context():
        from app_demo.forms import ProfileEditForm
        form = ProfileEditForm(); token = form.csrf_token.current_token

    # Create a dummy image file for upload
    image_data = (BytesIO(b"test_image_content_for_profile"), 'test_image.png')

    form_data = {
        'full_name': user.full_name, # Keep other fields valid
        'profile_photo': image_data,
        'csrf_token': token
    }

    response = logged_in_client.post(
        url_for('profile.edit_profile'),
        data=form_data,
        content_type='multipart/form-data', # Important for file uploads
        follow_redirects=True
    )
    assert response.status_code == 200
    assert b"Profile updated successfully!" in response.data

    db.session.refresh(user)
    assert user.profile_photo_url is not None
    assert user.profile_photo_url != original_photo_url
    # Check if file exists (harder in test without knowing full path and if it's cleaned up)
    # For now, checking DB field change is sufficient for this test.
    # Example: user.profile_photo_url might be 'uploads/profile_pics/loginuser_test_image.png'

def test_edit_profile_post_csrf_missing(client, logged_in_client):
    """Test POST to edit_profile with missing CSRF token."""
    form_data = {'full_name': 'CSRF Test Name'}
    response = logged_in_client.post(url_for('profile.edit_profile'), data=form_data)
    assert response.status_code == 400

def test_edit_profile_post_csrf_invalid(client, logged_in_client):
    """Test POST to edit_profile with invalid CSRF token."""
    form_data = {'full_name': 'CSRF Test Name', 'csrf_token': 'invalidtokenhere'}
    response = logged_in_client.post(url_for('profile.edit_profile'), data=form_data)
    assert response.status_code == 400


# --- Follow/Unfollow Route Tests ---
def test_follow_user_successful(client, app, logged_in_client, create_test_user, db):
    """Authenticated user ('loginuser') follows another user."""
    follower = User.query.filter_by(username="loginuser").first()
    followed_user = create_test_user(username="tobefollowed", email="followme@example.com")

    assert not follower.is_following(followed_user)
    initial_follower_count = followed_user.followers.count()
    initial_following_count_self = follower.followed.count()

    with app.app_context():
        # These routes use simple POST, no specific WTForm, but CSRF is still active.
        # We need a CSRF token from the session.
        from flask_wtf import FlaskForm
        class DummyCSRFForm(FlaskForm): pass # For token generation
        token = DummyCSRFForm().csrf_token.current_token

    response = logged_in_client.post(url_for('profile.follow_user', username=followed_user.username), data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"You are now following " + bytes(followed_user.username, 'utf-8') in response.data

    db.session.refresh(follower)
    db.session.refresh(followed_user)
    assert follower.is_following(followed_user)
    assert followed_user.followers.count() == initial_follower_count + 1
    assert follower.followed.count() == initial_following_count_self + 1

def test_unfollow_user_successful(client, app, logged_in_client, create_test_user, db):
    """Authenticated user unfollows a user they were following."""
    follower = User.query.filter_by(username="loginuser").first()
    followed_user = create_test_user(username="tobeunfollowed", email="unfollowme@example.com")

    # First, follow the user
    follower.follow(followed_user)
    db.session.commit()
    assert follower.is_following(followed_user)
    initial_follower_count = followed_user.followers.count() # Should be 1
    initial_following_count_self = follower.followed.count() # Should be 1

    with app.app_context():
        from flask_wtf import FlaskForm; class D(FlaskForm):pass; token = D().csrf_token.current_token

    response = logged_in_client.post(url_for('profile.unfollow_user', username=followed_user.username), data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"You have unfollowed " + bytes(followed_user.username, 'utf-8') in response.data

    db.session.refresh(follower)
    db.session.refresh(followed_user)
    assert not follower.is_following(followed_user)
    assert followed_user.followers.count() == initial_follower_count - 1
    assert follower.followed.count() == initial_following_count_self - 1

def test_follow_user_self_fails(client, app, logged_in_client, db):
    """User cannot follow themselves."""
    user_self = User.query.filter_by(username="loginuser").first()
    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token = D().csrf_token.current_token

    response = logged_in_client.post(url_for('profile.follow_user', username=user_self.username), data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200 # Or specific error code if route handles it differently
    assert b"You cannot follow yourself." in response.data
    assert not user_self.is_following(user_self)

def test_follow_user_already_following(client, app, logged_in_client, create_test_user, db):
    """User attempts to follow someone they already follow."""
    follower = User.query.filter_by(username="loginuser").first()
    followed_user = create_test_user(username="alreadyfollowed", email="already@example.com")
    follower.follow(followed_user); db.session.commit()
    assert follower.is_following(followed_user)

    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token = D().csrf_token.current_token
    response = logged_in_client.post(url_for('profile.follow_user', username=followed_user.username), data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"You are already following this user." in response.data

def test_unfollow_user_not_following(client, app, logged_in_client, create_test_user, db):
    """User attempts to unfollow someone they are not following."""
    follower = User.query.filter_by(username="loginuser").first()
    not_followed_user = create_test_user(username="notfollowed", email="notf@example.com")
    assert not follower.is_following(not_followed_user)

    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token = D().csrf_token.current_token
    response = logged_in_client.post(url_for('profile.unfollow_user', username=not_followed_user.username), data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"You are not following this user." in response.data

def test_follow_unauthenticated(client, create_test_user):
    """Unauthenticated user attempts to follow."""
    user_to_follow = create_test_user(username="targetfollow", email="tf@example.com")
    response = client.post(url_for('profile.follow_user', username=user_to_follow.username), data={'csrf_token':'dummy'}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data

def test_follow_nonexistent_user(client, app, logged_in_client):
    """Attempt to follow a non-existent user."""
    with app.app_context(): from flask_wtf import FlaskForm; class D(FlaskForm):pass; token = D().csrf_token.current_token
    response = logged_in_client.post(url_for('profile.follow_user', username="ghostuser"), data={'csrf_token': token})
    assert response.status_code == 404

def test_follow_user_csrf_missing(client, logged_in_client, create_test_user):
    """CSRF token missing for follow action."""
    user_to_follow = create_test_user(username="followcsrf", email="fcsrf@example.com")
    response = logged_in_client.post(url_for('profile.follow_user', username=user_to_follow.username), data={})
    assert response.status_code == 400 # Direct CSRF failure from Flask-WTF

def test_unfollow_user_csrf_missing(client, logged_in_client, create_test_user, db):
    """CSRF token missing for unfollow action."""
    follower = User.query.filter_by(username="loginuser").first()
    user_to_unfollow = create_test_user(username="unfollowcsrf", email="ucrsf@example.com")
    follower.follow(user_to_unfollow); db.session.commit() # Must be following first

    response = logged_in_client.post(url_for('profile.unfollow_user', username=user_to_unfollow.username), data={})
    assert response.status_code == 400


# --- Followers/Following List Route Tests ---
def test_followers_list_loads_with_followers(client, app, db, create_test_user):
    """Test viewing a user's followers list."""
    profile_user = create_test_user(username="followedone", email="foned@example.com")
    follower1 = create_test_user(username="followerone", email="fone@example.com", full_name="Follower Uno")
    follower2 = create_test_user(username="followertwo", email="ftwo@example.com", full_name="Follower Dos")

    # follower1 follows profile_user
    f_link1 = FollowerLink(follower_id=follower1.id, followed_id=profile_user.id)
    # follower2 follows profile_user
    f_link2 = FollowerLink(follower_id=follower2.id, followed_id=profile_user.id)
    db.session.add_all([f_link1, f_link2])
    db.session.commit()

    response = client.get(url_for('profile.followers_list', username=profile_user.username))
    assert response.status_code == 200
    assert b"Followers of followedone" in response.data # Check title/header
    assert b"Follower Uno" in response.data
    assert b"Follower Dos" in response.data
    assert profile_user.followers.count() == 2

def test_followers_list_empty(client, create_test_user):
    """Test viewing followers list for a user with no followers."""
    profile_user = create_test_user(username="nofollowers", email="nof@example.com")
    response = client.get(url_for('profile.followers_list', username=profile_user.username))
    assert response.status_code == 200
    assert b"Followers of nofollowers" in response.data
    assert b"has no followers yet." in response.data # Check for empty message

def test_followers_list_nonexistent_user(client):
    """Test 404 for followers list of a non-existent user."""
    response = client.get(url_for('profile.followers_list', username="ghost_user_followers"))
    assert response.status_code == 404

def test_following_list_loads_with_followed(client, app, db, create_test_user):
    """Test viewing a user's following list."""
    main_user = create_test_user(username="mainuser_follows", email="mainf@example.com", full_name="Main User Follows")
    followed1 = create_test_user(username="followedby_main1", email="fbm1@example.com", full_name="Followed Alpha")
    followed2 = create_test_user(username="followedby_main2", email="fbm2@example.com", full_name="Followed Beta")

    main_user.follow(followed1)
    main_user.follow(followed2)
    db.session.commit()

    response = client.get(url_for('profile.following_list', username=main_user.username))
    assert response.status_code == 200
    assert b"Users followed by Main User Follows" in response.data
    assert b"Followed Alpha" in response.data
    assert b"Followed Beta" in response.data
    assert main_user.followed.count() == 2

def test_following_list_empty(client, create_test_user):
    """Test viewing following list for a user who follows no one."""
    profile_user = create_test_user(username="followsnone", email="fnone@example.com")
    response = client.get(url_for('profile.following_list', username=profile_user.username))
    assert response.status_code == 200
    assert b"Users followed by followsnone" in response.data
    assert b"is not following anyone yet." in response.data

def test_following_list_nonexistent_user(client):
    """Test 404 for following list of a non-existent user."""
    response = client.get(url_for('profile.following_list', username="ghost_user_following"))
    assert response.status_code == 404


# --- User Gallery Route Tests ---
def test_view_gallery_empty(client, create_test_user):
    """Test viewing an empty gallery for a user."""
    gallery_user = create_test_user(username="galleryempty", email="ge@example.com", full_name="Gallery User Empty")
    response = client.get(url_for('profile.view_gallery', username=gallery_user.username))
    assert response.status_code == 200
    assert b"Gallery - Gallery User Empty" in response.data
    assert b"has not uploaded any photos yet." in response.data # Check for empty message

def test_view_gallery_nonexistent_user(client):
    """Test 404 for gallery of a non-existent user."""
    response = client.get(url_for('profile.view_gallery', username="ghost_user_gallery"))
    assert response.status_code == 404

# Note: Tests for gallery with photos will depend on UserPhoto model and photo upload functionality,
# which will be tested in test_photo_routes.py. We can add a test here that uses a fixture
# to create UserPhoto instances if needed for isolated testing of view_gallery.
# For now, these cover the basic GET requests for profile lists and gallery structure.

# More tests for photo_routes.py will handle photo uploads and detailed gallery views.
