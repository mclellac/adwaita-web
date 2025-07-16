from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
from flask_wtf.file import FileAllowed
import bleach
from datetime import datetime

from sqlalchemy.orm import selectinload # Added for eager loading
from ..models import User, Post, Comment, UserPhoto, SiteSetting # Added SiteSetting
from ..forms import ProfileEditForm, GalleryPhotoUploadForm, SiteSettingsForm, FollowForm, UnfollowForm
from .. import db
# Removed allowed_file_util as it's now encapsulated or used by save_uploaded_file
from ..utils import flash_form_errors_util, ALLOWED_TAGS_CONFIG, ALLOWED_ATTRIBUTES_CONFIG, save_uploaded_file

profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('/<int:user_id>') # Changed to use user_id
@login_required
def view_profile(user_id): # Changed to use user_id
    """
    Displays a user's profile page.

    Shows user information, their posts (paginated), and their comments (paginated).
    Access to private profiles is restricted to the owner.
    Eager loads related data for posts (categories, tags) and comments (post author)
    to optimize database queries.

    Args:
        user_id (int): The ID of the user whose profile is to be viewed.

    Returns:
        Rendered template 'profile.html' with user profile data, posts, and comments.
        Aborts with 404 if user not found, or 403 if profile is private and
        accessed by an unauthorized user.
    """
    # Ensure datetime is available; moved back to top-level import.
    current_app.logger.debug(f"Accessing profile for user_id {user_id}, requested by User ID: {current_user.id}")
    user_profile = User.query.get_or_404(user_id) # Use get_or_404 for ID lookup
    current_app.logger.debug(f"Displaying profile for User ID: {user_profile.id} (Username: {user_profile.username}).")

    calculated_age = None
    if user_profile.birthdate:
        today = datetime.today()
        calculated_age = today.year - user_profile.birthdate.year - \
               ((today.month, today.day) < (user_profile.birthdate.month, user_profile.birthdate.day))

    if not user_profile.is_profile_public and user_profile != current_user:
        current_app.logger.warning(f"User ID: {current_user.id} attempted to view private profile of User ID: {user_profile.id}.")
        flash("This profile is private.", "danger")
        abort(403)

    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)

    # Base query for posts by the user_profile
    posts_query_base = Post.query.filter_by(user_id=user_profile.id)\
                               .options(selectinload(Post.categories), selectinload(Post.tags))
                               # Author is user_profile, so no need to load Post.author explicitly here

    if current_user == user_profile:
        current_app.logger.debug(f"Fetching all posts for own profile User ID: {user_profile.id}, page {page}.")
        # For own profile, show all posts (published and drafts), ordered by most recently updated
        posts_query = posts_query_base.order_by(Post.updated_at.desc())
    else:
        current_app.logger.debug(f"Fetching published posts for profile User ID: {user_profile.id}, page {page}.")
        # For other profiles, only show published posts, ordered by published date
        posts_query = posts_query_base.filter_by(is_published=True)\
                                      .order_by(Post.published_at.desc(), Post.created_at.desc())

    try:
        posts_pagination = posts_query.paginate(page=page, per_page=per_page, error_out=False)
        # posts_pagination.items will have posts with categories and tags preloaded
        current_app.logger.debug(f"Found {len(posts_pagination.items)} posts for User ID: {user_profile.id}, page {page} (total: {posts_pagination.total}).")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for profile User ID: {user_profile.id}: {e}", exc_info=True)
        flash("Error loading posts for this profile.", "danger")
        posts_pagination = None

    comments_page = request.args.get('comments_page', 1, type=int)
    comments_per_page = 5 # Consider making this configurable
    comments_query = Comment.query.filter_by(user_id=user_profile.id)\
                                  .options(selectinload(Comment.post).selectinload(Post.author))\
                                  .order_by(Comment.created_at.desc())
    try:
        comments_pagination = comments_query.paginate(page=comments_page, per_page=comments_per_page, error_out=False)
        # comments_pagination.items will have comments with .post and .post.author preloaded
        current_app.logger.debug(f"Found {len(comments_pagination.items)} comments by User ID: {user_profile.id} for comments_page {comments_page} (total: {comments_pagination.total}).")
    except Exception as e:
        current_app.logger.error(f"Error fetching comments for profile User ID: {user_profile.id}: {e}", exc_info=True)
        flash("Error loading comments for this profile.", "danger")
        comments_pagination = None

    if user_profile.profile_photo_url:
        try:
            generated_photo_url = url_for('static', filename=user_profile.profile_photo_url, _external=False)
            current_app.logger.info(f"Profile page for User ID: {user_profile.id}: Stored profile_photo_url: '{user_profile.profile_photo_url}'")
            current_app.logger.info(f"Profile page for User ID: {user_profile.id}: Generated static URL for photo: '{generated_photo_url}'")
            expected_photo_path_abs = os.path.join(current_app.static_folder, user_profile.profile_photo_url)
            current_app.logger.info(f"Expected absolute photo path for check: {expected_photo_path_abs}")
            current_app.logger.info(f"Does expected photo path exist? {os.path.exists(expected_photo_path_abs)}")
        except Exception as e_url_for:
            current_app.logger.error(f"Error during photo URL or path logging for '{user_profile.profile_photo_url}': {e_url_for}", exc_info=True)
    else:
        current_app.logger.info(f"Profile page for User ID: {user_profile.id}: No profile_photo_url stored.")

    gallery_upload_form = None
    if current_user == user_profile:
        gallery_upload_form = GalleryPhotoUploadForm()

    follow_form = FollowForm()
    unfollow_form = UnfollowForm()

    return render_template('profile.html', user_profile=user_profile,
                           posts_pagination=posts_pagination,
                           comments_pagination=comments_pagination,
                           calculated_age=calculated_age,
                           gallery_upload_form=gallery_upload_form,
                           follow_form=follow_form,
                           unfollow_form=unfollow_form)


@profile_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    """
    Handles editing of the currently logged-in user's profile.

    On GET: Displays the profile edit form, pre-filled with the current user's data.
    On POST: Validates form data. If valid, updates the user's profile information,
             including text fields, privacy settings, and optionally a new profile photo.
             Handles profile photo upload, cropping (if specified), and thumbnailing.
             Redirects to the user's profile page on successful update.

    Requires:
        User to be logged in.
    """
    current_app.logger.debug(f"Accessing /profile/edit, Method: {request.method}, User ID: {current_user.id}")
    form = ProfileEditForm(obj=current_user)

    if form.validate_on_submit():
        current_app.logger.info(f"User ID: {current_user.id} updating profile.")
        raw_profile_info = form.profile_info.data
        current_user.profile_info = bleach.clean(
            raw_profile_info,
            tags=ALLOWED_TAGS_CONFIG,
            attributes=ALLOWED_ATTRIBUTES_CONFIG,
            strip=True
        )
        current_user.full_name = form.full_name.data
        current_user.website_url = form.website_url.data
        current_user.is_profile_public = form.is_profile_public.data
        current_user.street_address = form.street_address.data
        current_user.city = form.city.data
        current_user.state_province = form.state_province.data
        current_user.postal_code = form.postal_code.data
        current_user.country = form.country.data
        current_user.home_phone = form.home_phone.data
        current_user.mobile_phone = form.mobile_phone.data
        current_user.birthdate = form.birthdate.data

        file = form.profile_photo.data
        photo_file = form.profile_photo.data
        photo_updated_or_attempted = False # Flag to know if we should adjust flash message

        if photo_file and photo_file.filename:
            photo_updated_or_attempted = True
            current_app.logger.debug(f"Profile photo update attempt by User ID: {current_user.id}. Filename: {photo_file.filename}")

            crop_params = None
            crop_x_str = request.form.get('crop_x')
            crop_y_str = request.form.get('crop_y')
            crop_width_str = request.form.get('crop_width')
            crop_height_str = request.form.get('crop_height')

            if crop_x_str and crop_y_str and crop_width_str and crop_height_str:
                try:
                    crop_params = {
                        'x': int(float(crop_x_str)),
                        'y': int(float(crop_y_str)),
                        'width': int(float(crop_width_str)),
                        'height': int(float(crop_height_str))
                    }
                    if not (crop_params['width'] > 0 and crop_params['height'] > 0):
                        flash("Invalid crop dimensions. Photo processed without custom cropping.", 'warning')
                        crop_params = None # Reset if invalid
                except ValueError:
                    flash("Invalid crop coordinate values. Photo processed without custom cropping.", 'warning')
                    crop_params = None
            # photo_updated_or_attempted = bool(photo_file and photo_file.filename) # Moved definition earlier
            # new_photo_db_path = None # Initialize to None

            # Corrected structure:
            photo_upload_attempted = bool(photo_file and photo_file.filename)
            new_photo_db_path = None

            if photo_upload_attempted:
                current_app.logger.debug(f"Profile photo update attempt by User ID: {current_user.id}. Filename: {photo_file.filename}") # Repeated log

                crop_params = None
                crop_x_str = request.form.get('crop_x')
                crop_y_str = request.form.get('crop_y')
                crop_width_str = request.form.get('crop_width')
                crop_height_str = request.form.get('crop_height')

                if crop_x_str and crop_y_str and crop_width_str and crop_height_str:
                    try:
                        crop_params = {
                            'x': int(float(crop_x_str)),
                            'y': int(float(crop_y_str)),
                            'width': int(float(crop_width_str)),
                            'height': int(float(crop_height_str))
                        }
                        if not (crop_params['width'] > 0 and crop_params['height'] > 0):
                            flash("Invalid crop dimensions. Photo processed without custom cropping.", 'warning')
                            crop_params = None
                    except ValueError:
                        flash("Invalid crop coordinate values. Photo processed without custom cropping.", 'warning')
                        crop_params = None

                new_photo_db_path = save_uploaded_file( # Assign to new_photo_db_path
                    file_storage_object=photo_file,
                    upload_type="profile_photo",
                    base_upload_path_config_key="UPLOAD_FOLDER",
                    max_size_bytes_config_key="MAX_PROFILE_PHOTO_SIZE_BYTES",
                    crop_coords=crop_params,
                    thumbnail_size=(200, 200),
                    existing_db_path=current_user.profile_photo_url
                )

                if new_photo_db_path:
                    current_user.profile_photo_url = new_photo_db_path
                # else: Error flash handled by save_uploaded_file utility

        try:
            db.session.add(current_user)
            db.session.commit()

            if photo_updated_or_attempted:
                if new_photo_db_path:
                    flash('Profile and photo updated successfully!', 'toast_success')
                else:
                    flash('Profile information updated, but photo upload failed. Please see previous error message.', 'warning')
            else:
                flash('Profile updated successfully!', 'toast_success')
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving profile to DB for User ID: {current_user.id}: {e}", exc_info=True)
            flash(f'Error saving profile changes: {str(e)}', 'danger')
        return redirect(url_for('profile.view_profile', user_id=current_user.id)) # Use user_id

    elif request.method == 'POST':
        current_app.logger.warning(f"Edit profile form validation failed for User ID: {current_user.id}. Errors: {form.errors}")
        flash_form_errors_util(form)

    return render_template('edit_profile.html', form=form, user_profile=current_user)


@profile_bp.route('/gallery/upload', methods=['POST'])
@login_required
def upload_gallery_photo():
    form = GalleryPhotoUploadForm()
    # FileAllowed validator can be added to the form itself or checked here per file
    if form.validate_on_submit():
        photo_files = form.photos.data  # Access the list of files
        caption = form.caption.data
        uploaded_count = 0
        error_count = 0

        if not photo_files or all(not f.filename for f in photo_files):
            flash("No photo files selected for gallery upload.", "warning")
            return redirect(url_for('profile.view_profile', user_id=current_user.id))

        new_photos = []
        for photo_file in photo_files:
            if photo_file and photo_file.filename:
                # Optionally, add individual file validation here if not handled by form globally
                # e.g., using FileAllowed from flask_wtf.file
                # if not FileAllowed(current_app.config['ALLOWED_EXTENSIONS']).validate(photo_file):
                #     flash(f"File type not allowed for {secure_filename(photo_file.filename)}.", "danger")
                #     error_count += 1
                #     continue

                saved_db_path = save_uploaded_file(
                    file_storage_object=photo_file,
                    upload_type="gallery_photo",
                    base_upload_path_config_key="GALLERY_UPLOAD_FOLDER", # Relative to static
                    max_size_bytes_config_key="MAX_GALLERY_PHOTO_SIZE_BYTES",
                    current_user_id=current_user.id # For user-specific subfolder
                    # No crop_coords or thumbnail_size for gallery photos by default
                )

                if saved_db_path:
                    try:
                        new_photo = UserPhoto(
                            user_id=current_user.id,
                            image_filename=saved_db_path, # This path is relative to static folder
                            caption=caption # Same caption for all photos in this batch
                        )
                        db.session.add(new_photo)
                        new_photos.append(new_photo)
                        uploaded_count += 1
                    except Exception as e_db_loop:
                        # Log specific error for this file, but try to continue with others
                        current_app.logger.error(f"Error preparing photo record for {secure_filename(photo_file.filename)} to DB: {e_db_loop}", exc_info=True)
                        error_count += 1
                        # No rollback here yet, do it once after the loop if any errors occurred
                else:
                    # save_uploaded_file should flash its own error
                    error_count += 1
            elif photo_file and not photo_file.filename and len(photo_files) == 1:
                # This case handles if a single empty file field was submitted,
                # which might not be caught by DataRequired on MultipleFileField
                # if the field itself exists but is empty.
                flash("No photo file selected for gallery upload.", "warning")
                return redirect(url_for('profile.view_profile', user_id=current_user.id))


        if uploaded_count > 0 and error_count == 0:
            try:
                db.session.commit()
                # Notify followers of the new photo
                for follower in current_user.followers:
                    for photo in new_photos:
                        create_notification(
                            user_id=follower.id,
                            actor_id=current_user.id,
                            type='new_photo_by_followed_user',
                            target_type='userphoto',
                            target_id=photo.id
                        )
                flash(f'{uploaded_count} photo(s) uploaded to gallery successfully!', 'toast_success')
            except Exception as e_commit:
                db.session.rollback()
                current_app.logger.error(f"Error committing gallery photos to DB: {e_commit}", exc_info=True)
                flash('Error saving photo details to database after processing files.', 'danger')
                # Consider deleting successfully uploaded files if the final commit fails
        elif uploaded_count > 0 and error_count > 0:
            try:
                db.session.commit() # Commit successfully processed files
                flash(f'{uploaded_count} photo(s) uploaded. {error_count} photo(s) failed.', 'warning')
            except Exception as e_commit_partial:
                db.session.rollback()
                current_app.logger.error(f"Error committing partially successful gallery photos to DB: {e_commit_partial}", exc_info=True)
                flash('Error saving some photo details to database. Some uploads may not have been saved.', 'danger')
        elif error_count > 0 and uploaded_count == 0:
            # No need to commit if nothing was successfully processed for DB add
            # save_uploaded_file or other checks should have flashed individual errors
            flash('All photo uploads failed. Please check errors above.', 'danger')
        # If uploaded_count is 0 and error_count is 0, it means no files were actually processed,
        # which should have been caught by the initial "No photo files selected" check.

    else:
        flash_form_errors_util(form) # Handles form-level validation errors

    return redirect(url_for('profile.view_profile', user_id=current_user.id))


@profile_bp.route('/gallery/delete/<int:photo_id>', methods=['POST'])
@login_required
def delete_gallery_photo(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    if photo.user_id != current_user.id and not current_user.is_admin:
        flash("You are not authorized to delete this photo.", "danger")
        abort(403)
    try:
        image_full_path = os.path.join(current_app.config['GALLERY_UPLOAD_FOLDER'], photo.image_filename)
        if os.path.exists(image_full_path):
            os.remove(image_full_path)
        db.session.delete(photo)
        db.session.commit()
        flash('Photo deleted from gallery successfully.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting gallery photo ID {photo_id}: {e}", exc_info=True)
        flash(f'Error deleting photo: {str(e)}', 'danger')
    user_id_for_redirect = photo.user.id if photo.user else current_user.id
    return redirect(url_for('profile.view_profile', user_id=user_id_for_redirect)) # Use user_id


@profile_bp.route('/<int:user_id>/gallery') # Changed to user_id
@login_required
def view_gallery(user_id): # Changed to user_id
    user_profile = User.query.get_or_404(user_id) # Use get_or_404 for ID lookup
    if not user_profile.is_profile_public and user_profile != current_user:
        flash("This profile's gallery is private.", "danger")
        abort(403)
    gallery_photos = user_profile.gallery_photos.order_by(UserPhoto.uploaded_at.desc()).all()
    return render_template('gallery_full.html', user_profile=user_profile, gallery_photos=gallery_photos)


@profile_bp.route('/follow/<int:user_id>', methods=['POST']) # Changed to user_id
@login_required
def follow_user(user_id): # Changed to user_id
    form = FollowForm()
    if form.validate_on_submit():
        user_to_follow = User.query.get_or_404(user_id) # Use get_or_404 for ID lookup
        if user_to_follow == current_user:
            flash("You cannot follow yourself.", "warning")
            return redirect(url_for('profile.view_profile', user_id=user_id)) # Use user_id
        if current_user.is_following(user_to_follow):
            flash(f"You are already following {user_to_follow.full_name or ('@' + user_to_follow.username)}.", "info") # Display full_name or username (email)
        else:
            if current_user.follow(user_to_follow):
                from ..models import Notification # Local import
                notification = Notification(
                    user_id=user_to_follow.id,
                    actor_id=current_user.id,
                    type='new_follower',
                    target_type='user', # The target of the notification is the user who was followed (actor_id)
                    target_id=current_user.id # The actor is the target of this notification
                )
                db.session.add(notification)
                from ..models import Activity # Local import
                activity = Activity(
                    user_id=current_user.id, # User performing the action
                    type='started_following',
                    # target_user_id=user_to_follow.id # Old field
                    target_type='user',             # New field: the user being followed
                    target_id=user_to_follow.id     # New field
                )
                db.session.add(activity)
                db.session.commit()
                flash(f"You are now following {user_to_follow.full_name or ('@' + user_to_follow.username)}.", "toast_success") # Display full_name or username
            else:
                flash(f"Could not follow {user_to_follow.full_name or ('@' + user_to_follow.username)}. An unexpected error occurred or it was a self-follow.", "danger") # Display full_name or username
                db.session.rollback()
    else:
        flash("Invalid request.", "danger")
    return redirect(url_for('profile.view_profile', user_id=user_id)) # Use user_id


@profile_bp.route('/unfollow/<int:user_id>', methods=['POST']) # Changed to user_id
@login_required
def unfollow_user(user_id): # Changed to user_id
    form = UnfollowForm()
    if form.validate_on_submit():
        user_to_unfollow = User.query.get_or_404(user_id) # Use get_or_404 for ID lookup
        if user_to_unfollow == current_user:
            flash("You cannot unfollow yourself.", "warning")
            return redirect(url_for('profile.view_profile', user_id=user_id)) # Use user_id
        if not current_user.is_following(user_to_unfollow):
            flash(f"You are not currently following {user_to_unfollow.full_name or ('@' + user_to_unfollow.username)}.", "info") # Display full_name or username
        else:
            if current_user.unfollow(user_to_unfollow):
                db.session.commit()
                flash(f"You have unfollowed {user_to_unfollow.full_name or ('@' + user_to_unfollow.username)}.", "toast_success") # Display full_name or username
            else:
                flash(f"Could not unfollow {user_to_unfollow.full_name or ('@' + user_to_unfollow.username)}. An unexpected error occurred.", "danger") # Display full_name or username
                db.session.rollback()
    else:
        flash("Invalid request.", "danger")
    return redirect(url_for('profile.view_profile', user_id=user_id)) # Use user_id


@profile_bp.route('/<int:user_id>/followers') # Changed to user_id
@login_required
def followers_list(user_id): # Changed to user_id
    user = User.query.get_or_404(user_id) # Use get_or_404 for ID lookup
    if not user.is_profile_public and user != current_user:
        flash("This user's connections are private.", "danger")
        return redirect(url_for('profile.view_profile', user_id=user_id)) # Use user_id
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 15)
    followers_query = user.followers.order_by(User.full_name.asc()) # Order by full_name
    try:
        pagination = followers_query.paginate(page=page, per_page=per_page, error_out=False)
        users_list = pagination.items
    except Exception as e:
        current_app.logger.error(f"Error fetching followers for {username}: {e}", exc_info=True)
        flash("Error loading followers list.", "danger")
        users_list, pagination = [], None
    follow_form = FollowForm()
    unfollow_form = UnfollowForm()
    return render_template('followers_list.html', user_profile=user, users_list=users_list, pagination=pagination, list_type="Followers", follow_form=follow_form, unfollow_form=unfollow_form)


@profile_bp.route('/<int:user_id>/following') # Changed to user_id
@login_required
def following_list(user_id): # Changed to user_id
    user = User.query.get_or_404(user_id) # Use get_or_404 for ID lookup
    if not user.is_profile_public and user != current_user:
        flash("This user's connections are private.", "danger")
        return redirect(url_for('profile.view_profile', user_id=user_id)) # Use user_id
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 15)
    following_query = user.followed.order_by(User.full_name.asc()) # Order by full_name
    try:
        pagination = following_query.paginate(page=page, per_page=per_page, error_out=False)
        users_list = pagination.items
    except Exception as e:
        current_app.logger.error(f"Error fetching following list for User ID: {user_id}: {e}", exc_info=True)
        flash("Error loading following list.", "danger")
        users_list, pagination = [], None
    follow_form = FollowForm()
    unfollow_form = UnfollowForm()
    return render_template('following_list.html', user_profile=user, users_list=users_list, pagination=pagination, list_type="Following", follow_form=follow_form, unfollow_form=unfollow_form)
