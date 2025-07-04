from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
import bleach # For cleaning profile_info

from ..models import User, Post, Comment # Assuming models are in models.py
from ..forms import ProfileEditForm # Assuming forms are in forms.py
from .. import db # Assuming db is initialized in __init__.py
from ..utils import allowed_file_util, flash_form_errors_util, ALLOWED_TAGS_CONFIG, ALLOWED_ATTRIBUTES_CONFIG

profile_bp = Blueprint('profile', __name__, url_prefix='/profile') # template_folder defaults to 'templates' in app root

@profile_bp.route('/<username>')
@login_required # Original app had this, implies viewing any profile requires login
def view_profile(username):
    current_app.logger.debug(f"Accessing profile for {username}, requested by {current_user.username}")
    user_profile = User.query.filter_by(username=username).first_or_404()
    current_app.logger.debug(f"Displaying profile for '{user_profile.username}' (ID: {user_profile.id}).")

    if not user_profile.is_profile_public and user_profile != current_user:
        current_app.logger.warning(f"User {current_user.username} attempted to view private profile of {user_profile.username}.")
        flash("This profile is private.", "warning")
        abort(403)

    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)

    posts_query = Post.query.filter_by(user_id=user_profile.id)
    if current_user == user_profile:
        current_app.logger.debug(f"Fetching all posts (published and drafts) for own profile '{user_profile.username}', page {page}.")
        posts_query = posts_query.order_by(Post.updated_at.desc())
    else:
        current_app.logger.debug(f"Fetching only published posts for profile '{user_profile.username}', page {page}.")
        posts_query = posts_query.filter_by(is_published=True).order_by(Post.published_at.desc(), Post.created_at.desc())

    try:
        posts_pagination = posts_query.paginate(page=page, per_page=per_page, error_out=False)
        current_app.logger.debug(f"Found {len(posts_pagination.items)} posts for '{user_profile.username}' page {page} (total: {posts_pagination.total}).")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for profile {user_profile.username}: {e}", exc_info=True)
        flash("Error loading posts for this profile.", "danger")
        posts_pagination = None

    comments_page = request.args.get('comments_page', 1, type=int)
    comments_per_page = 5 # Or make this configurable
    comments_query = Comment.query.filter_by(user_id=user_profile.id).order_by(Comment.created_at.desc())
    try:
        comments_pagination = comments_query.paginate(page=comments_page, per_page=comments_per_page, error_out=False)
        current_app.logger.debug(f"Found {len(comments_pagination.items)} comments by '{user_profile.username}' for comments_page {comments_page} (total: {comments_pagination.total}).")
    except Exception as e:
        current_app.logger.error(f"Error fetching comments for profile {user_profile.username}: {e}", exc_info=True)
        flash("Error loading comments for this profile.", "danger")
        comments_pagination = None

    # Logging for static file handling (photo URL)
    if user_profile.profile_photo_url:
        try:
            generated_photo_url = url_for('static', filename=user_profile.profile_photo_url, _external=False)
            current_app.logger.info(f"Profile page for {user_profile.username}: Stored profile_photo_url: '{user_profile.profile_photo_url}'")
            current_app.logger.info(f"Profile page for {user_profile.username}: Generated static URL for photo: '{generated_photo_url}'")

            current_app.logger.info(f"Flask static_folder (resolved): {os.path.abspath(current_app.static_folder)}")
            current_app.logger.info(f"Flask static_url_path: {current_app.static_url_path}")

            # current_app.static_folder is already absolute if app created with default Flask(__name__)
            # and __init__.py is in app-demo. So app.root_path is app-demo, static_folder is app-demo/static
            expected_photo_path_abs = os.path.join(current_app.static_folder, user_profile.profile_photo_url)
            current_app.logger.info(f"Expected absolute photo path for check: {expected_photo_path_abs}")
            current_app.logger.info(f"Does expected photo path exist? {os.path.exists(expected_photo_path_abs)}")

            upload_folder_config = current_app.config['UPLOAD_FOLDER'] # This is now absolute from __init__.py
            current_app.logger.info(f"UPLOAD_FOLDER (from config, should be abs): {upload_folder_config}")
            expected_photo_path_from_upload_config = os.path.join(upload_folder_config, os.path.basename(user_profile.profile_photo_url))
            current_app.logger.info(f"Expected photo path based on UPLOAD_FOLDER: {expected_photo_path_from_upload_config}")
            current_app.logger.info(f"Does photo exist at UPLOAD_FOLDER path? {os.path.exists(expected_photo_path_from_upload_config)}")

        except Exception as e_url_for:
            current_app.logger.error(f"Error during photo URL or path logging for '{user_profile.profile_photo_url}': {e_url_for}", exc_info=True)
    else:
        current_app.logger.info(f"Profile page for {user_profile.username}: No profile_photo_url stored.")

    return render_template('profile.html', user_profile=user_profile,
                           posts_pagination=posts_pagination,
                           comments_pagination=comments_pagination)


@profile_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    current_app.logger.debug(f"Accessing /profile/edit, Method: {request.method}, User: {current_user.username}")
    form = ProfileEditForm(obj=current_user) # Populate form with current user's data for GET

    if form.validate_on_submit():
        current_app.logger.info(f"User {current_user.username} updating profile.")
        raw_profile_info = form.profile_info.data
        current_user.profile_info = bleach.clean(
            raw_profile_info,
            tags=ALLOWED_TAGS_CONFIG,
            attributes=ALLOWED_ATTRIBUTES_CONFIG,
            strip=True
        )
        current_user.full_name = form.full_name.data
        current_user.location = form.location.data
        current_user.website_url = form.website_url.data
        current_user.is_profile_public = form.is_profile_public.data

        file = form.profile_photo.data
        photo_update_attempted = False
        photo_saved_successfully = False

        if file and file.filename: # Ensure a file was actually selected
            photo_update_attempted = True
            current_app.logger.debug(f"Profile photo update attempt by {current_user.username}. Filename: {file.filename}, Content-Length: {getattr(file, 'content_length', 'N/A')}")

            # Check file size (using request.content_length as fallback if file.content_length is not available)
            file_size = file.content_length if hasattr(file, 'content_length') else request.content_length
            if file_size is None: # Should not happen with FileField normally
                 current_app.logger.warning(f"Could not determine file size for {current_user.username}.")
                 flash("Could not determine file size. Please try again.", "warning")
            elif file_size > current_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES']:
                current_app.logger.warning(f"Profile photo for {current_user.username} too large: {file_size} bytes.")
                max_size_mb = current_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES'] // 1024 // 1024
                flash(f"Profile photo too large. Max size: {max_size_mb}MB.", 'danger')
            elif not allowed_file_util(file.filename): # Uses current_app from utils
                current_app.logger.warning(f"Invalid file type for photo by {current_user.username}: {file.filename}")
                flash(f"Invalid file type for photo. Allowed types are {', '.join(current_app.config['ALLOWED_EXTENSIONS'])}.", 'warning')
            else:
                try:
                    original_filename = secure_filename(file.filename)
                    ext = original_filename.rsplit('.', 1)[-1].lower()
                    unique_filename = f"{uuid.uuid4()}.{ext}"

                    upload_folder_path = current_app.config['UPLOAD_FOLDER'] # This is now absolute
                    save_path = os.path.join(upload_folder_path, unique_filename)

                    current_app.logger.info(f"Ensuring upload directory exists: {upload_folder_path}")
                    os.makedirs(upload_folder_path, exist_ok=True)
                    current_app.logger.info(f"Attempting to process and save profile photo for {current_user.username} to: {save_path}")

                    file.stream.seek(0) # Important: rewind stream before Pillow opens it
                    img = Image.open(file.stream)
                    current_app.logger.info(f"Photo opened with Pillow for {current_user.username}. Format: {img.format}, Size: {img.size}")

                    # Cropping logic (from app.py)
                    crop_x_str = request.form.get('crop_x')
                    crop_y_str = request.form.get('crop_y')
                    crop_width_str = request.form.get('crop_width')
                    crop_height_str = request.form.get('crop_height')
                    if (crop_x_str and crop_y_str and crop_width_str and crop_height_str):
                        current_app.logger.info(f"Crop params for {current_user.username}: X={crop_x_str}, Y={crop_y_str}, W={crop_width_str}, H={crop_height_str}")
                        try:
                            crop_x = int(float(crop_x_str))
                            crop_y = int(float(crop_y_str))
                            crop_width = int(float(crop_width_str))
                            crop_height = int(float(crop_height_str))
                            if crop_width > 0 and crop_height > 0:
                                img = img.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
                                current_app.logger.info(f"Image cropped for {current_user.username} to: {img.size}")
                            else:
                                current_app.logger.warning(f"Invalid crop dimensions (<=0) for {current_user.username}. Photo processed without cropping.")
                                flash("Invalid crop dimensions provided. Photo processed without cropping.", 'warning')
                        except ValueError as ve:
                            current_app.logger.warning(f"Invalid crop coordinates for {current_user.username}: {ve}. Photo processed without cropping.")
                            flash("Invalid crop coordinates provided. Photo processed without cropping.", 'warning')
                    else:
                        current_app.logger.info(f"No crop parameters for {current_user.username}. Processing without explicit crop.")

                    img.thumbnail((200, 200)) # Resize to thumbnail
                    current_app.logger.info(f"Image thumbnail generated for {current_user.username}. New size: {img.size}")
                    img.save(save_path)
                    current_app.logger.info(f"img.save() call completed for {current_user.username}.")

                    if os.path.exists(save_path):
                        current_app.logger.info(f"SUCCESS: Profile photo for {current_user.username} saved and found at {save_path}")
                        if current_user.profile_photo_url:
                            old_filename_rel = current_user.profile_photo_url # e.g. uploads/profile_pics/old.png
                            # Construct absolute path from UPLOAD_FOLDER and the basename
                            old_photo_abs_path = os.path.join(upload_folder_path, os.path.basename(old_filename_rel))

                            # Security check: ensure old path is within upload_folder_path
                            if os.path.commonpath([os.path.realpath(old_photo_abs_path), os.path.realpath(upload_folder_path)]) == os.path.realpath(upload_folder_path):
                                if os.path.exists(old_photo_abs_path):
                                    try:
                                        os.remove(old_photo_abs_path)
                                        current_app.logger.info(f"Old photo {old_photo_abs_path} deleted for {current_user.username}.")
                                    except OSError as oe:
                                        current_app.logger.error(f"Error deleting old photo {old_photo_abs_path}: {oe}", exc_info=True)
                                else:
                                     current_app.logger.warning(f"Old photo {old_photo_abs_path} not found for deletion for {current_user.username} (filename: {os.path.basename(old_filename_rel)}).")
                            else:
                                current_app.logger.error(f"Security: Attempt to delete outside upload folder: {old_photo_abs_path}")

                        # Path stored in DB should be relative to static folder.
                        # UPLOAD_FOLDER is '.../app-demo/static/uploads/profile_pics'
                        # current_app.static_folder is '.../app-demo/static'
                        # We need 'uploads/profile_pics/unique_filename.ext'
                        db_photo_path = os.path.relpath(save_path, current_app.static_folder).replace("\\", "/")
                        current_user.profile_photo_url = db_photo_path
                        photo_saved_successfully = True
                        current_app.logger.info(f"User {current_user.username} profile_photo_url updated to: {current_user.profile_photo_url}")
                    else:
                        current_app.logger.error(f"FAILURE: Profile photo for {current_user.username} NOT FOUND at {save_path} after img.save().")
                        flash('Error saving photo: File could not be written to disk.', 'danger')
                except Exception as e:
                    current_app.logger.error(f"Exception during photo processing for {current_user.username}: {e}", exc_info=True)
                    flash(f'Error processing profile photo: {str(e)}', 'danger')

        try:
            db.session.add(current_user) # Add to session before commit
            db.session.commit()
            current_app.logger.info(f"Profile changes for {current_user.username} committed to DB.")
            if photo_update_attempted:
                flash_msg = 'Profile and photo updated successfully!' if photo_saved_successfully else 'Profile information updated, but there was an issue with the photo upload.'
                flash_cat = 'success' if photo_saved_successfully else 'warning'
                flash(flash_msg, flash_cat)
            else:
                flash('Profile updated successfully!', 'success')
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving profile to DB for {current_user.username}: {e}", exc_info=True)
            flash(f'Error saving profile changes: {str(e)}', 'danger')
        return redirect(url_for('profile.view_profile', username=current_user.username))

    elif request.method == 'POST': # Catches validation failures on POST
        current_app.logger.warning(f"Edit profile form validation failed for {current_user.username}. Errors: {form.errors}")
        flash_form_errors_util(form)

    return render_template('edit_profile.html', form=form, user_profile=current_user)
