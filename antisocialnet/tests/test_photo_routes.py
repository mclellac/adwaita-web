import pytest
from flask import url_for, current_app # Added current_app
from antisocialnet.models import User, UserPhoto, SiteSetting, Like, Notification, Activity, Comment # Added Like, Notification, Activity
from antisocialnet.forms import LikeForm, UnlikeForm # Added form imports
from antisocialnet import db
from io import BytesIO
import os # For checking file existence if needed, though tricky in tests

# --- Upload Photo Route Tests ---
def test_upload_photo_page_loads_get(client, logged_in_client, app, db): # Test if upload form is on profile page
    """Test that the gallery photo upload form is present on the user's own profile page."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert user is not None

    with logged_in_client.application.test_request_context():
        # The gallery upload form is part of the profile.view_profile template when viewing own profile
        response = logged_in_client.get(url_for('profile.view_profile', user_id=user.id))

    assert response.status_code == 200
    # Check for elements of the GalleryPhotoUploadForm
    assert b"Upload New Photo to Gallery" in response.data # Assuming a title for this form section
    assert b'name="photo"' in response.data # File input
    assert b'name="caption"' in response.data # Caption input
    assert b'action="' + url_for('profile.upload_gallery_photo').encode() + b'"' in response.data # Form action points to the POST route


def test_upload_photo_page_unauthenticated_redirects(client):
    """Test POST to /gallery/upload for unauthenticated user redirects to login."""
    # The GET endpoint for the form is part of profile view, which itself might require login
    # This test will check the POST endpoint directly for auth.
    with client.application.test_request_context():
        # Attempt to POST to the upload endpoint directly
        response = client.post(url_for('profile.upload_gallery_photo'), follow_redirects=True)
    assert response.status_code == 200 # After redirect to login
    assert b"Please log in to access this page." in response.data # Flash message

def test_upload_photo_successful(client, app, logged_in_client, db):
    """Test successful photo upload with a caption."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first() # Corrected username
    initial_photo_count = UserPhoto.query.filter_by(user_id=user.id).count()

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import GalleryPhotoUploadForm # For CSRF
        form = GalleryPhotoUploadForm(); token = form.csrf_token.current_token
        url = url_for('profile.upload_gallery_photo') # Corrected endpoint

    image_data = (BytesIO(b"fake_image_bytes_content_for_upload_test"), 'test_upload.jpg')
    # For MultipleFileField, the field expects a list of FileStorage objects.
    # In a test, this means the data for the 'photos' key should be a list of these tuples.
    caption_text = "My awesome test upload."

    form_data = {
        'photos': [image_data], # Field name changed to 'photos' and expects a list
        'caption': caption_text,
        'csrf_token': token
    }

    # Mock app.config['GALLERY_UPLOAD_FOLDER'] to a test-specific one if not already handled by TestConfig
    # TestConfig sets GALLERY_UPLOAD_FOLDER = 'uploads/test_gallery_photos' relative to static.
    # The actual save path will be app.static_folder + app.config['GALLERY_UPLOAD_FOLDER'] + user_id + filename

    response = logged_in_client.post(
        url, # Use the url defined in context
        data=form_data,
        content_type='multipart/form-data',
        follow_redirects=True
    )

    assert response.status_code == 200
    assert b"Photo uploaded successfully!" in response.data
    # Should redirect to user's gallery or the photo detail page.
    # Current route redirects to profile.view_gallery
    assert b"Gallery - " + bytes(user.full_name, 'utf-8') in response.data


    assert UserPhoto.query.filter_by(user_id=user.id).count() == initial_photo_count + 1
    new_photo = UserPhoto.query.filter_by(user_id=user.id).order_by(UserPhoto.id.desc()).first()
    assert new_photo is not None
    assert new_photo.caption == caption_text
    assert "test_upload.jpg" in new_photo.image_filename # Filename might be sanitized/changed
    assert str(user.id) in new_photo.image_filename # Check if user_id is part of path as per route logic

    # Optional: Check if file was actually "saved" (hard to do reliably without full FS access/mocking)
    # For example:
    # expected_folder = os.path.join(app.static_folder, app.config['GALLERY_UPLOAD_FOLDER'], str(user.id))
    # assert os.path.exists(os.path.join(expected_folder, new_photo.image_filename.split('/')[-1]))
    # This requires `app.static_folder` to be a real writable path in test env.

def test_upload_photo_no_file_selected(client, app, logged_in_client):
    """Test photo upload attempt with no file selected."""
    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import GalleryPhotoUploadForm
        form = GalleryPhotoUploadForm(); token = form.csrf_token.current_token
        url = url_for('profile.upload_gallery_photo') # Corrected endpoint

    form_data = {'caption': 'Caption without photo', 'csrf_token': token}
    response = logged_in_client.post(
        url,
        data=form_data,
        content_type='multipart/form-data', # Still multipart
        follow_redirects=True
    )
    assert response.status_code == 200
    # The route's initial check `if not photo_files or all(not f.filename for f in photo_files):`
    # should flash "No photo files selected..."
    # If that passes, then the form's DataRequired on `photos` should kick in.
    # The form's DataRequired message is "Please select one or more photos to upload."
    assert b"No photo files selected" in response.data or b"Please select one or more photos to upload." in response.data
    assert b"Upload New Photo to Gallery" in response.data # Check we are on the profile page with the upload form

def test_upload_photo_invalid_file_type(client, app, logged_in_client):
    """Test photo upload with an invalid file type (e.g., .txt)."""
    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import GalleryPhotoUploadForm
        form = GalleryPhotoUploadForm(); token = form.csrf_token.current_token
        url = url_for('profile.upload_gallery_photo') # Corrected endpoint

    invalid_file_data = (BytesIO(b"this is a text file, not an image."), 'invalid_file.txt')
    # For MultipleFileField, send as a list
    form_data = {'photos': [invalid_file_data], 'csrf_token': token}

    response = logged_in_client.post(
        url,
        data=form_data,
        content_type='multipart/form-data',
        follow_redirects=True
    )
    assert response.status_code == 200
    # The save_uploaded_file utility flashes "File type not allowed."
    assert b"File type not allowed." in response.data
    # It might also redirect to the profile page, where the form is rendered again.
    assert b"Upload New Photo to Gallery" in response.data # Check we are on the profile page with the upload form

def test_upload_photo_csrf_missing(client, logged_in_client):
    """Test photo upload POST with missing CSRF token."""
    image_data = (BytesIO(b"csrf_test_image"), 'csrf_test.jpg')
    form_data = {'photos': [image_data], 'caption': 'CSRF test'} # Use 'photos'

    with logged_in_client.application.test_request_context():
        url = url_for('profile.upload_gallery_photo') # Corrected endpoint
    response = logged_in_client.post(
        url,
        data=form_data,
        content_type='multipart/form-data'
        # No follow_redirects to check direct 400
    )
    assert response.status_code == 400

# --- View Photo Detail Route Tests ---
def create_photo_for_testing(db, user, filename="test_photo.jpg", caption="A test photo"):
    """Helper to create a UserPhoto instance for tests."""
    # In a real scenario, the file would be saved by the upload route.
    # Here, we just create the DB record with a plausible filename.
    # The actual file doesn't need to exist for many backend logic tests.
    # The image_filename should include the user_id path component.
    path_component = str(user.id)
    image_filename_db = os.path.join(path_component, filename) # e.g. "1/test_photo.jpg"

    photo = UserPhoto(user_id=user.id, image_filename=image_filename_db, caption=caption)
    db.session.add(photo)
    db.session.commit()
    return photo

def test_view_photo_detail_loads(client, db, create_test_user):
    """Test viewing an existing photo's detail page."""
    photo_uploader = create_test_user(email_address="pu@example.com", full_name="Photo Uploader")
    test_photo = create_photo_for_testing(db, photo_uploader, caption="Detailed caption view test.")

    with client.application.test_request_context():
        response = client.get(url_for('photo.view_photo_detail', photo_id=test_photo.id))
    assert response.status_code == 200
    assert b"Detailed caption view test." in response.data
    assert b"Photo Uploader" in response.data # Uploader's name
    # Check for comment form elements if user is authenticated (even if no comments yet)
    # If anonymous, comment form might not show or be different.
    # For now, just check basic content.

def test_view_photo_detail_nonexistent(client):
    """Test viewing a non-existent photo returns 404."""
    with client.application.test_request_context():
        response = client.get(url_for('photo.view_photo_detail', photo_id=999999))
    assert response.status_code == 404

def test_view_photo_detail_with_comments(client, app, db, create_test_user, logged_in_client):
    """Test photo detail page shows comments and comment form for logged-in user."""
    photo_uploader = create_test_user(email_address="pu2@example.com", full_name="photouploader2")
    test_photo = create_photo_for_testing(db, photo_uploader, caption="Photo with comments.")

    commenter = User.query.filter_by(username="login_fixture_user@example.com").first() # logged_in_client
    comment1_text = "This is the first comment on the photo."
    comment1 = Comment(text=comment1_text, user_id=commenter.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment1)
    db.session.commit()

    with logged_in_client.application.test_request_context():
        response = logged_in_client.get(url_for('photo.view_photo_detail', photo_id=test_photo.id))
    assert response.status_code == 200
    assert bytes(comment1_text, 'utf-8') in response.data
    assert b"Leave a Comment" in response.data # Assuming comment form has this title for logged-in user
    assert b"text" in response.data # Name of the textarea for comments

# --- Handle Photo Comment Route Tests (POST) ---
def test_add_photo_comment_successful(client, app, logged_in_client, db, create_test_user):
    """Test successfully adding a comment to a photo."""
    photo_uploader = create_test_user(email_address="pu3@example.com", full_name="photouploader3")
    test_photo = create_photo_for_testing(db, photo_uploader, caption="Photo to be commented on.")
    commenting_user = User.query.filter_by(username="login_fixture_user@example.com").first()

    initial_comment_count = Comment.query.filter_by(target_type='userphoto', target_id=test_photo.id).count()

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import CommentForm # For CSRF
        form = CommentForm(); token = form.csrf_token.current_token
        url = url_for('photo.handle_photo_comment', photo_id=test_photo.id)

    comment_text = "A brand new photo comment!"
    form_data = {'text': comment_text, 'csrf_token': token}

    response = logged_in_client.post(
        url,
        data=form_data,
        follow_redirects=True
    )
    assert response.status_code == 200
    assert b"Comment added successfully." in response.data
    assert bytes(comment_text, 'utf-8') in response.data # Comment should be on the page

    assert Comment.query.filter_by(target_type='userphoto', target_id=test_photo.id).count() == initial_comment_count + 1
    new_comment = Comment.query.filter_by(text=comment_text, target_type='userphoto', target_id=test_photo.id).first()
    assert new_comment is not None
    assert new_comment.author == commenting_user

def test_add_photo_comment_unauthenticated(client, db, create_test_user):
    """Test unauthenticated user cannot comment on a photo."""
    photo_uploader = create_test_user(email_address="pu4@example.com", full_name="photouploader4")
    test_photo = create_photo_for_testing(db, photo_uploader)

    form_data = {'text': 'Unauth comment', 'csrf_token': 'dummy'} # CSRF won't matter due to @login_required
    with client.application.test_request_context():
        url = url_for('photo.handle_photo_comment', photo_id=test_photo.id)
    response = client.post(
        url,
        data=form_data,
        follow_redirects=True
    )
    assert response.status_code == 200
    assert b"Please log in to access this page." in response.data

def test_add_photo_comment_empty_text(client, app, logged_in_client, db, create_test_user):
    """Test adding an empty comment to a photo results in validation error."""
    photo_uploader = create_test_user(email_address="pu5@example.com", full_name="photouploader5")
    test_photo = create_photo_for_testing(db, photo_uploader)

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import PhotoCommentForm
        form = PhotoCommentForm(); token = form.csrf_token.current_token
        url = url_for('photo.handle_photo_comment', photo_id=test_photo.id)

    form_data = {'text': '', 'csrf_token': token}
    response = logged_in_client.post(
        url,
        data=form_data,
        follow_redirects=True
    )
    assert response.status_code == 200 # Stays on photo detail page
    assert b"This field is required." in response.data # Validation message
    assert b"Comment added successfully." not in response.data

def test_add_photo_comment_csrf_missing(client, logged_in_client, db, create_test_user):
    """Test adding photo comment with missing CSRF token."""
    photo_uploader = create_test_user(email_address="puc@example.com", full_name="photouploader_csrf")
    test_photo = create_photo_for_testing(db, photo_uploader)
    form_data = {'text': 'CSRF missing comment'}

    with logged_in_client.application.test_request_context():
        url = url_for('photo.handle_photo_comment', photo_id=test_photo.id)
    response = logged_in_client.post(
        url,
        data=form_data
    )
    assert response.status_code == 400


# --- Delete Photo Comment Route Tests ---
def test_delete_photo_comment_author_self(client, app, logged_in_client, db, create_test_user):
    """Comment author deletes their own photo comment."""
    photo_owner = create_test_user(email_address="dpho@example.com", full_name="del_photo_owner")
    test_photo = create_photo_for_testing(db, photo_owner, caption="Photo for comment deletion.")

    commenting_user = User.query.filter_by(username="login_fixture_user@example.com").first() # This is logged_in_client
        comment_to_delete = Comment(text="My comment to delete", user_id=commenting_user.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment_to_delete); db.session.commit()
    comment_id = comment_to_delete.id
    assert Comment.query.get(comment_id) is not None

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import DeleteCommentForm # Generic form, can be reused if empty
        form = DeleteCommentForm(); token = form.csrf_token.current_token
        url = url_for('photo.delete_photo_comment', comment_id=comment_id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Comment deleted successfully." in response.data
    assert Comment.query.get(comment_id) is None

def test_delete_photo_comment_photo_owner(client, app, logged_in_client, db, create_test_user):
    """Photo owner deletes a comment on their photo."""
    photo_owner = User.query.filter_by(username="login_fixture_user@example.com").first() # logged_in_client is photo_owner
    test_photo = create_photo_for_testing(db, photo_owner, caption="My photo, I delete comments.")

    other_commenter = create_test_user(email_address="ocp@example.com", full_name="othercommenter_photo")
        comment_to_delete = Comment(text="A comment on owner's photo", user_id=other_commenter.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment_to_delete); db.session.commit()
    comment_id = comment_to_delete.id
    assert Comment.query.get(comment_id) is not None

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import DeleteCommentForm
        form = DeleteCommentForm(); token = form.csrf_token.current_token
        url = url_for('photo.delete_photo_comment', comment_id=comment_id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Comment deleted successfully." in response.data
    assert Comment.query.get(comment_id) is None

def test_delete_photo_comment_admin(client, app, db, create_test_user):
    """Admin deletes any photo comment."""
    uploader = create_test_user(email_address="ufadp@example.com", full_name="uploader_for_admin_del_pc")
    commenter = create_test_user(email_address="cfadp@example.com", full_name="commenter_for_admin_del_pc")
    test_photo = create_photo_for_testing(db, uploader)
        comment_to_delete = Comment(text="Comment targeted by admin", user_id=commenter.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment_to_delete); db.session.commit()
    comment_id = comment_to_delete.id

    admin = create_test_user(email_address="apcd@example.com", full_name="admin_photo_comment_deleter", is_admin=True)

    login_url_val = None
    delete_url_val = None
    csrf_login_token = None
    csrf_delete_token = None

    with app.app_context():
        from antisocialnet.forms import LoginForm, DeleteCommentForm
        login_form = LoginForm(); csrf_login_token = login_form.csrf_token.current_token
        delete_form = DeleteCommentForm(); csrf_delete_token = delete_form.csrf_token.current_token
        login_url_val = url_for('auth.login')
        delete_url_val = url_for('photo.delete_photo_comment', comment_id=comment_id)

    client.post(login_url_val, data={'username': admin.email, 'password': 'password', 'csrf_token': csrf_login_token})

    response = client.post(delete_url_val, data={'csrf_token': csrf_delete_token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Comment deleted successfully." in response.data
    assert Comment.query.get(comment_id) is None

def test_delete_photo_comment_unauthorized(client, app, logged_in_client, db, create_test_user):
    """Unauthorized user (not comment author, not photo owner, not admin) gets 403."""
    photo_owner_user = create_test_user(email_address="poud@example.com", full_name="powner_unauth_del")
    comment_author_user = create_test_user(email_address="caud@example.com", full_name="cauthor_unauth_del")
    test_photo = create_photo_for_testing(db, photo_owner_user)
        comment_on_photo = Comment(text="A comment for unauth delete test", user_id=comment_author_user.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment_on_photo); db.session.commit()
    comment_id = comment_on_photo.id

    # logged_in_client is 'login_fixture_user@example.com', who is none of the above.
    assert User.query.filter_by(username="login_fixture_user@example.com").first().id not in [photo_owner_user.id, comment_author_user.id]

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import DeleteCommentForm
        form=DeleteCommentForm(); token=form.csrf_token.current_token
        url = url_for('photo.delete_photo_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={'csrf_token': token})
    assert response.status_code == 403
    assert Comment.query.get(comment_id) is not None

def test_delete_photo_comment_csrf_missing(client, app, logged_in_client, db, create_test_user):
    """Test CSRF failure for photo comment deletion."""
    commenting_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_photo = create_photo_for_testing(db, commenting_user) # User owns photo for simplicity of permission
        comment = Comment(text="CSRF delete photo comment", user_id=commenting_user.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment); db.session.commit()
    comment_id = comment.id

    with logged_in_client.application.test_request_context():
        url = url_for('photo.delete_photo_comment', comment_id=comment_id)
    response = logged_in_client.post(url, data={})
    assert response.status_code == 400 # Direct CSRF failure
    assert Comment.query.get(comment_id) is not None


# --- Delete Photo Route Tests ---
def test_delete_photo_owner_successful(client, app, logged_in_client, db):
    """Photo owner successfully deletes their photo."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_photo = create_photo_for_testing(db, user, filename="photo_to_delete.jpg", caption="Delete me")
    photo_id = test_photo.id

    # Add a comment to ensure it's deleted too
        comment = Comment(text="A comment on photo to be deleted", user_id=user.id, target_id=photo_id, target_type='userphoto')
    db.session.add(comment)
    db.session.commit()
    assert UserPhoto.query.get(photo_id) is not None
    assert Comment.query.filter_by(target_type='userphoto', target_id=photo_id).count() == 1

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import DeletePostForm # Can reuse if empty, or make specific DeletePhotoForm
        form = DeletePostForm(); token = form.csrf_token.current_token # Assuming generic delete form for CSRF
        url = url_for('profile.delete_gallery_photo', photo_id=photo_id) # Corrected endpoint

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)
    assert response.status_code == 200
    assert b"Photo deleted successfully." in response.data
    # Should redirect to user's gallery
    assert b"Gallery - " + bytes(user.full_name, 'utf-8') in response.data

    assert UserPhoto.query.get(photo_id) is None
    assert Comment.query.filter_by(target_type='userphoto', target_id=photo_id).count() == 0
    # TODO: Test file deletion from filesystem if possible/necessary for full coverage.
    # This would require knowing the exact path and mocking os.remove or checking a test upload folder.

def test_delete_photo_admin_successful(client, app, db, create_test_user):
    """Admin successfully deletes another user's photo."""
    photo_owner = create_test_user(email_address="po_admindel@example.com", full_name="photoowner_for_admin_del")
    test_photo = create_photo_for_testing(db, photo_owner, filename="admin_del_photo.jpg")
    photo_id = test_photo.id
        comment = Comment(text="Comment on admin-deleted photo", user_id=photo_owner.id, target_id=photo_id, target_type='userphoto')
    db.session.add(comment)
    db.session.commit()

    admin = create_test_user(email_address="admindelphoto@example.com", full_name="admin_photo_deleter", is_admin=True)

    login_url_val = None
    delete_url_val = None
    csrf_login_token = None
    csrf_delete_token = None

    with app.app_context():
        from antisocialnet.forms import LoginForm, DeletePostForm
        login_form = LoginForm(); csrf_login_token = login_form.csrf_token.current_token
        delete_form = DeletePostForm(); csrf_delete_token = delete_form.csrf_token.current_token
        login_url_val = url_for('auth.login')
        delete_url_val = url_for('profile.delete_gallery_photo', photo_id=photo_id) # Corrected endpoint

    client.post(login_url_val, data={'username': admin.email, 'password': 'password', 'csrf_token': csrf_login_token})

    response = client.post(delete_url_val, data={'csrf_token': csrf_delete_token}, follow_redirects=True)

    assert response.status_code == 200
    assert b"Photo deleted successfully." in response.data
    assert UserPhoto.query.get(photo_id) is None
    assert Comment.query.filter_by(target_type='userphoto', target_id=photo_id).count() == 0

def test_delete_photo_unauthorized(client, app, logged_in_client, db, create_test_user):
    """Unauthorized user (not owner, not admin) attempts to delete photo."""
    photo_owner = create_test_user(email_address="ouapd@example.com", full_name="owner_unauth_photo_del")
    test_photo = create_photo_for_testing(db, photo_owner, filename="unauth_del_attempt.jpg")
    photo_id = test_photo.id

    # logged_in_client is 'login_fixture_user@example.com', not the photo_owner or an admin
    assert User.query.filter_by(username="login_fixture_user@example.com").first().id != photo_owner.id
    assert not User.query.filter_by(username="login_fixture_user@example.com").first().is_admin

    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import DeletePostForm
        form=DeletePostForm(); token=form.csrf_token.current_token
        url = url_for('profile.delete_gallery_photo', photo_id=photo_id) # Corrected endpoint
    response = logged_in_client.post(url, data={'csrf_token': token})
    assert response.status_code == 403 # Forbidden
    assert UserPhoto.query.get(photo_id) is not None # Photo should still exist

def test_delete_photo_csrf_missing(client, logged_in_client, db):
    """Test photo deletion with missing CSRF token."""
    user = User.query.filter_by(username="login_fixture_user@example.com").first()
    test_photo = create_photo_for_testing(db, user, filename="csrf_photo_del.jpg")
    photo_id = test_photo.id

    with logged_in_client.application.test_request_context():
        url = url_for('profile.delete_gallery_photo', photo_id=photo_id) # Corrected endpoint
    response = logged_in_client.post(url, data={})
    assert response.status_code == 400 # Direct CSRF failure
    assert UserPhoto.query.get(photo_id) is not None

def test_delete_photo_nonexistent(client, app, logged_in_client):
    """Test attempting to delete a non-existent photo."""
    with app.app_context(): # For CSRF and url_for
        from antisocialnet.forms import DeletePostForm
        form=DeletePostForm(); token=form.csrf_token.current_token
        url = url_for('profile.delete_gallery_photo', photo_id=888777) # Corrected endpoint
    response = logged_in_client.post(url, data={'csrf_token': token})
    assert response.status_code == 404


# --- API Photo Comment Tests ---

def test_api_add_photo_comment_successful_and_get_comments(client, app, logged_in_client, db, create_test_user):
    """Test successfully adding a comment via API and then retrieving it."""
    photo_uploader = create_test_user(email_address="api_pu@example.com", full_name="API Photo Uploader")
    test_photo = create_photo_for_testing(db, photo_uploader, caption="Photo for API comments.")
    # logged_in_client is 'login_fixture_user@example.com'

    comment_text_raw = "API comment with <b>bold</b> and <script>alert('XSS')</script> tags."
    # With bleach.clean(..., tags=[], strip=True), <b>bold</b> becomes "bold".
    # <script>alert('XSS')</script> and its content are removed.
    # So the expected text is "API comment with bold and  tags." (note the double space if script was between words)
    # The route code does form.text.data.strip() before bleach, and bleach itself doesn't add extra spaces.
    # If the original input was "word1 <script>...</script> word2", it becomes "word1  word2".
    # If the input to bleach is "API comment with <b>bold</b> and <script>alert('XSS')</script> tags.",
    # after stripping script tag and content: "API comment with <b>bold</b> and  tags."
    # then after stripping b tag: "API comment with bold and  tags."
    # The .strip() in the route is on form.text.data *before* bleach.clean.
    # bleach.clean itself does not strip leading/trailing whitespace from the overall string.
    comment_text_expected_final = "API comment with bold and  tags." # Adjusted for script content removal


    post_comment_url = None
    get_comments_url = None
    csrf_token_val = None

    with app.test_client() as test_client: # Use a fresh test_client for CSRF or session consistency if needed
                                          # Or ensure logged_in_client's session has CSRF
        # Simulate logged_in_client for CSRF token generation if forms are involved server-side for JSON validation
        # For pure JSON API, CSRF might be handled differently (e.g. headers, or disabled for API blueprint if stateless)
        # The CommentForm is used, so CSRF is likely active.
        # However, the route uses form = CommentForm(data=request.json) and form.validate()
        # This typically bypasses WTForms CSRF if meta={'csrf': False} or if no CSRFField in form.
        # Let's assume CSRF is needed for WTForms by default unless explicitly disabled.
        # The CommentForm does not include a CSRFTokenField.
        # And it's initialized with request.json, so standard session-based CSRF might not apply directly.
        # Let's proceed assuming the API route as written handles validation without session CSRF for JSON.
        # If it fails, we'll know CSRF is an issue.
        # The route photo_bp.route('/api/photos/<int:photo_id>/comments', methods=['POST'])
        # does not have CSRFProtect(api_bp) or similar. It uses CommentForm.
        # CommentForm in forms.py does not have CSRF. So, direct POST should be fine.


        with logged_in_client.application.app_context(): # Ensure context for url_for
            post_comment_url = url_for('photo.post_photo_comment', photo_id=test_photo.id)
            get_comments_url = url_for('photo.get_photo_comments', photo_id=test_photo.id)

    # POST the comment
    response_post = logged_in_client.post(
        post_comment_url,
        json={'text': comment_text_raw}
    )
    assert response_post.status_code == 201
    posted_comment_data = response_post.get_json()
    assert posted_comment_data['text'] == comment_text_expected_final # Check sanitized text in response

    # GET the comments to verify storage
    response_get = logged_in_client.get(get_comments_url)
    assert response_get.status_code == 200
    comments_data = response_get.get_json()
    assert len(comments_data) == 1
    retrieved_comment = comments_data[0]
    assert retrieved_comment['text'] == comment_text_expected_final
    assert "<b>" not in retrieved_comment['text']
    assert "<script>" not in retrieved_comment['text']

def test_api_add_photo_comment_empty(logged_in_client, app, db, create_test_user):
    """Test posting an empty comment via API results in a 400 error."""
    photo_uploader = create_test_user(email_address="api_pu_empty@example.com", full_name="API Photo Uploader Empty")
    test_photo = create_photo_for_testing(db, photo_uploader)

    post_comment_url = None
    with app.app_context():
         post_comment_url = url_for('photo.post_photo_comment', photo_id=test_photo.id)

    response_post = logged_in_client.post(post_comment_url, json={'text': '   '}) # Empty or whitespace only
    assert response_post.status_code == 400
    errors = response_post.get_json().get('errors', {})
    assert 'text' in errors
    assert "required" in errors['text'].lower() or "empty" in errors['text'].lower()


def test_api_get_photo_comments_unauthorized_private_profile(client, app, db, create_test_user):
    """Test GET comments API fails for private profile if not owner."""
    private_user = create_test_user(email_address="api_private@example.com", full_name="API Private User", is_profile_public=False)
    test_photo = create_photo_for_testing(db, private_user)
    # Add a comment so there's something to fetch
        comment = Comment(text="A private comment", user_id=private_user.id, target_id=test_photo.id, target_type='userphoto')
    db.session.add(comment)
    db.session.commit()


    # Unauthenticated client
    with app.app_context():
        get_comments_url = url_for('photo.get_photo_comments', photo_id=test_photo.id)
    response_unauth = client.get(get_comments_url)
    assert response_unauth.status_code == 403

    # Authenticated non-owner client
    other_user = create_test_user(email_address="api_other@example.com", full_name="API Other User")
    with app.test_client() as other_client:
        with app.app_context(): # for url_for and login
            from antisocialnet.forms import LoginForm
            login_form_instance = LoginForm()
            csrf_token_for_login = login_form_instance.csrf_token.current_token

            login_response = other_client.post(url_for('auth.login'), data={
                'username': other_user.email,
                'password': 'password', # Assuming default password for create_test_user
                'csrf_token': csrf_token_for_login
            }, follow_redirects=True)
            # Add an assertion to check if login was successful, e.g., by status code or flashed message
            # For now, we assume it works if no exception and CSRF is handled.
            # A better check would be for login_response.status_code == 200 if it redirects to a success page.

        response_other_auth = other_client.get(get_comments_url)
        assert response_other_auth.status_code == 403

    # Owner client should succeed
    with app.test_client() as owner_client:
        with app.app_context():
            from antisocialnet.forms import LoginForm
            login_form_instance = LoginForm()
            csrf_token_for_login = login_form_instance.csrf_token.current_token

            owner_client.post(url_for('auth.login'), data={
                'username': private_user.email,
                'password': 'password',
                'csrf_token': csrf_token_for_login
            }, follow_redirects=True)
            # Similar assertion for successful login could be added here.

        response_owner = owner_client.get(get_comments_url)
        assert response_owner.status_code == 200
        assert len(response_owner.get_json()) == 1


# End of photo_routes tests for now.


# --- Test Photo Like Routes (New) ---

def test_like_item_route_for_photo_authenticated(client, app, db, create_test_user, logged_in_client):
    """Test POST /like/photo/<id> when authenticated."""
    photo_owner = create_test_user(email_address="photo_owner_lp@example.com", full_name="Photo Owner LP")

    test_photo = UserPhoto(user_id=photo_owner.id, image_filename=f"user_{photo_owner.id}_test.jpg", caption="A photo to be liked.")
    db.session.add(test_photo)
    db.session.commit()

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert liking_user is not None
    assert liking_user.id != photo_owner.id # Ensure not self-liking for notification test

    assert not liking_user.has_liked_item('photo', test_photo.id)
    initial_like_count = test_photo.like_count
    initial_notifications = Notification.query.filter_by(user_id=photo_owner.id, type='new_like', target_type='photo', target_id=test_photo.id).count()
    initial_activities = Activity.query.filter_by(user_id=liking_user.id, type='liked_item', target_type='photo', target_id=test_photo.id).count()

    with app.app_context():
        form = LikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='photo', target_id=test_photo.id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Photo liked!' in response.data

    db.session.refresh(liking_user)
    db.session.refresh(test_photo)

    assert liking_user.has_liked_item('photo', test_photo.id)
    assert test_photo.like_count == initial_like_count + 1
    assert Notification.query.filter_by(user_id=photo_owner.id, type='new_like', target_type='photo', target_id=test_photo.id).count() == initial_notifications + 1
    assert Activity.query.filter_by(user_id=liking_user.id, type='liked_item', target_type='photo', target_id=test_photo.id).count() == initial_activities + 1

def test_unlike_item_route_for_photo_authenticated(client, app, db, create_test_user, logged_in_client):
    """Test POST /like/unlike/photo/<id> when authenticated."""
    photo_owner = create_test_user(email_address="photo_owner_ulp@example.com", full_name="Photo Owner ULP")
    test_photo = UserPhoto(user_id=photo_owner.id, image_filename=f"user_{photo_owner.id}_test_unlike.jpg", caption="A photo to be unliked.")
    db.session.add(test_photo)
    db.session.commit()

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    assert liking_user is not None

    liking_user.like_item('photo', test_photo.id)
    db.session.commit()
    db.session.refresh(test_photo)
    assert liking_user.has_liked_item('photo', test_photo.id)
    initial_like_count = test_photo.like_count
    assert initial_like_count > 0

    with app.app_context():
        form = UnlikeForm()
        token = form.csrf_token.current_token
        url = url_for('like.unlike_item_route', target_type='photo', target_id=test_photo.id)

    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'Photo unliked!' in response.data

    db.session.refresh(liking_user)
    db.session.refresh(test_photo)

    assert not liking_user.has_liked_item('photo', test_photo.id)
    assert test_photo.like_count == initial_like_count - 1

def test_like_already_liked_item_route_for_photo(client, app, db, create_test_user, logged_in_client):
    """Test liking a photo that is already liked by the user."""
    photo_owner = create_test_user(email_address="photo_owner_al_p@example.com")
    test_photo = UserPhoto(user_id=photo_owner.id, image_filename="al_p.jpg")
    db.session.add(test_photo); db.session.commit()

    liking_user = User.query.filter_by(username="login_fixture_user@example.com").first()
    liking_user.like_item('photo', test_photo.id) # Like it first
    db.session.commit()
    db.session.refresh(test_photo)
    initial_like_count = test_photo.like_count

    with app.app_context():
        form = LikeForm(); token = form.csrf_token.current_token
        url = url_for('like.like_item_route', target_type='photo', target_id=test_photo.id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'You have already liked this item.' in response.data
    db.session.refresh(test_photo)
    assert test_photo.like_count == initial_like_count

def test_unlike_not_liked_item_route_for_photo(client, app, db, create_test_user, logged_in_client):
    """Test unliking a photo that was not liked."""
    photo_owner = create_test_user(email_address="photo_owner_unl_p@example.com")
    test_photo = UserPhoto(user_id=photo_owner.id, image_filename="unl_p.jpg")
    db.session.add(test_photo); db.session.commit()
    initial_like_count = test_photo.like_count # Should be 0

    with app.app_context():
        form = UnlikeForm(); token = form.csrf_token.current_token
        url = url_for('like.unlike_item_route', target_type='photo', target_id=test_photo.id)
    response = logged_in_client.post(url, data={'csrf_token': token}, follow_redirects=True)

    assert response.status_code == 200
    assert b'You have not liked this item yet.' in response.data
    db.session.refresh(test_photo)
    assert test_photo.like_count == initial_like_count

def test_like_item_csrf_missing_token_for_photo(client, app, db, create_test_user, logged_in_client):
    """Test liking a photo with a missing CSRF token."""
    photo_owner = create_test_user(email_address="photo_owner_csrf_p@example.com")
    test_photo = UserPhoto(user_id=photo_owner.id, image_filename="csrf_p.jpg")
    db.session.add(test_photo); db.session.commit()

    with app.app_context():
        url = url_for('like.like_item_route', target_type='photo', target_id=test_photo.id)
    # Post without CSRF token, do not follow redirects to see the direct 400
    response = logged_in_client.post(url, data={})

    assert response.status_code == 400
    # Default CSRF error page from Flask-WTF might contain "CSRF token missing" or "The CSRF token is invalid."
    # For now, just checking status code. Specific message can be added if needed.
    # assert b"CSRF token missing" in response.data # Or similar, depending on Flask-WTF version/config

    db.session.refresh(test_photo)
    assert test_photo.like_count == 0 # Action should not have occurred
