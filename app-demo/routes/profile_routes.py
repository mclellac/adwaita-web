from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
from flask_wtf.file import FileAllowed
import bleach
from datetime import datetime

from ..models import User, Post, Comment, UserPhoto, SiteSetting # Added SiteSetting
from ..forms import ProfileEditForm, GalleryPhotoUploadForm, SiteSettingsForm # Added SiteSettingsForm
from .. import db
# Removed allowed_file_util as it's now encapsulated or used by save_uploaded_file
from ..utils import flash_form_errors_util, ALLOWED_TAGS_CONFIG, ALLOWED_ATTRIBUTES_CONFIG, save_uploaded_file

profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('/<username>')
@login_required
def view_profile(username):
    # Ensure datetime is available; moved back to top-level import.
    current_app.logger.debug(f"Accessing profile for {username}, requested by {current_user.username}")
    user_profile = User.query.filter_by(username=username).first_or_404()
    current_app.logger.debug(f"Displaying profile for '{user_profile.username}' (ID: {user_profile.id}).")

    calculated_age = None
    if user_profile.birthdate:
        today = datetime.today()
        calculated_age = today.year - user_profile.birthdate.year - \
               ((today.month, today.day) < (user_profile.birthdate.month, user_profile.birthdate.day))

    if not user_profile.is_profile_public and user_profile != current_user:
        current_app.logger.warning(f"User {current_user.username} attempted to view private profile of {user_profile.username}.")
        flash("This profile is private.", "danger")
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
    comments_per_page = 5
    comments_query = Comment.query.filter_by(user_id=user_profile.id).order_by(Comment.created_at.desc())
    try:
        comments_pagination = comments_query.paginate(page=comments_page, per_page=comments_per_page, error_out=False)
        current_app.logger.debug(f"Found {len(comments_pagination.items)} comments by '{user_profile.username}' for comments_page {comments_page} (total: {comments_pagination.total}).")
    except Exception as e:
        current_app.logger.error(f"Error fetching comments for profile {user_profile.username}: {e}", exc_info=True)
        flash("Error loading comments for this profile.", "danger")
        comments_pagination = None

    if user_profile.profile_photo_url:
        try:
            generated_photo_url = url_for('static', filename=user_profile.profile_photo_url, _external=False)
            current_app.logger.info(f"Profile page for {user_profile.username}: Stored profile_photo_url: '{user_profile.profile_photo_url}'")
            current_app.logger.info(f"Profile page for {user_profile.username}: Generated static URL for photo: '{generated_photo_url}'")
            expected_photo_path_abs = os.path.join(current_app.static_folder, user_profile.profile_photo_url)
            current_app.logger.info(f"Expected absolute photo path for check: {expected_photo_path_abs}")
            current_app.logger.info(f"Does expected photo path exist? {os.path.exists(expected_photo_path_abs)}")
        except Exception as e_url_for:
            current_app.logger.error(f"Error during photo URL or path logging for '{user_profile.profile_photo_url}': {e_url_for}", exc_info=True)
    else:
        current_app.logger.info(f"Profile page for {user_profile.username}: No profile_photo_url stored.")

    gallery_upload_form = None
    if current_user == user_profile:
        gallery_upload_form = GalleryPhotoUploadForm()

    return render_template('profile.html', user_profile=user_profile,
                           posts_pagination=posts_pagination,
                           comments_pagination=comments_pagination,
                           calculated_age=calculated_age,
                           gallery_upload_form=gallery_upload_form)


@profile_bp.route('/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    current_app.logger.debug(f"Accessing /profile/edit, Method: {request.method}, User: {current_user.username}")
    form = ProfileEditForm(obj=current_user)

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
            current_app.logger.debug(f"Profile photo update attempt by {current_user.username}. Filename: {photo_file.filename}")

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
                current_app.logger.debug(f"Profile photo update attempt by {current_user.username}. Filename: {photo_file.filename}")

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
            current_app.logger.error(f"Error saving profile to DB for {current_user.username}: {e}", exc_info=True)
            flash(f'Error saving profile changes: {str(e)}', 'danger')
        return redirect(url_for('profile.view_profile', username=current_user.username))

    elif request.method == 'POST':
        current_app.logger.warning(f"Edit profile form validation failed for {current_user.username}. Errors: {form.errors}")
        flash_form_errors_util(form)

    return render_template('edit_profile.html', form=form, user_profile=current_user)


@profile_bp.route('/gallery/upload', methods=['POST'])
@login_required
def upload_gallery_photo():
    form = GalleryPhotoUploadForm()
    # FileAllowed validator is good, but save_uploaded_file will also check extensions based on config.
    # form.photo.validators.append(FileAllowed(current_app.config['ALLOWED_EXTENSIONS'], 'Images only!')) # This can be kept or removed if redundant
    if form.validate_on_submit():
        photo_file = form.photo.data
        caption = form.caption.data

        if not photo_file or not photo_file.filename: # Should be caught by form's FileRequired if used.
            flash("No photo file selected for gallery upload.", "warning")
            return redirect(url_for('profile.view_profile', username=current_user.username))

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
                    caption=caption
                )
                db.session.add(new_photo)
                db.session.commit()
                flash('Photo uploaded to gallery successfully!', 'toast_success')
            except Exception as e_db:
                db.session.rollback()
                current_app.logger.error(f"Error saving gallery photo record to DB: {e_db}", exc_info=True)
                flash('Error saving photo details to database.', 'danger')
                # Potentially delete the orphaned file from disk if DB save fails
                # full_orphan_path = os.path.join(current_app.static_folder, saved_db_path)
                # if os.path.exists(full_orphan_path): os.remove(full_orphan_path)
        # else: Error flash handled by save_uploaded_file utility
    else:
        # flash_form_errors_util already uses 'danger'
        flash_form_errors_util(form)
    return redirect(url_for('profile.view_profile', username=current_user.username))


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
    return redirect(url_for('profile.view_profile', username=photo.user.username if photo.user else current_user.username))


@profile_bp.route('/<username>/gallery')
@login_required
def view_gallery(username):
    user_profile = User.query.filter_by(username=username).first_or_404()
    if not user_profile.is_profile_public and user_profile != current_user:
        flash("This profile's gallery is private.", "danger")
        abort(403)
    gallery_photos = user_profile.gallery_photos.order_by(UserPhoto.uploaded_at.desc()).all()
    return render_template('gallery_full.html', user_profile=user_profile, gallery_photos=gallery_photos)


@profile_bp.route('/follow/<username>', methods=['POST'])
@login_required
def follow_user(username):
    user_to_follow = User.query.filter_by(username=username).first_or_404()
    if user_to_follow == current_user:
        flash("You cannot follow yourself.", "warning")
        return redirect(url_for('profile.view_profile', username=username))
    if current_user.is_following(user_to_follow):
        flash(f"You are already following {username}.", "info")
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
            flash(f"You are now following {username}.", "toast_success")
        else:
            flash(f"Could not follow {username}. An unexpected error occurred or it was a self-follow.", "danger")
            db.session.rollback()
    return redirect(url_for('profile.view_profile', username=username))


@profile_bp.route('/unfollow/<username>', methods=['POST'])
@login_required
def unfollow_user(username):
    user_to_unfollow = User.query.filter_by(username=username).first_or_404()
    if user_to_unfollow == current_user:
        flash("You cannot unfollow yourself.", "warning")
        return redirect(url_for('profile.view_profile', username=username))
    if not current_user.is_following(user_to_unfollow):
        flash(f"You are not currently following {username}.", "info")
    else:
        if current_user.unfollow(user_to_unfollow):
            db.session.commit()
            flash(f"You have unfollowed {username}.", "toast_success")
        else:
            flash(f"Could not unfollow {username}. An unexpected error occurred.", "danger")
            db.session.rollback()
    return redirect(url_for('profile.view_profile', username=username))


@profile_bp.route('/<username>/followers')
@login_required
def followers_list(username):
    user = User.query.filter_by(username=username).first_or_404()
    if not user.is_profile_public and user != current_user:
        flash("This user's connections are private.", "danger")
        return redirect(url_for('profile.view_profile', username=username))
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 15)
    followers_query = user.followers.order_by(User.username.asc())
    try:
        pagination = followers_query.paginate(page=page, per_page=per_page, error_out=False)
        users_list = pagination.items
    except Exception as e:
        current_app.logger.error(f"Error fetching followers for {username}: {e}", exc_info=True)
        flash("Error loading followers list.", "danger")
        users_list, pagination = [], None
    return render_template('followers_list.html', user_profile=user, users_list=users_list, pagination=pagination, list_type="Followers")


@profile_bp.route('/<username>/following')
@login_required
def following_list(username):
    user = User.query.filter_by(username=username).first_or_404()
    if not user.is_profile_public and user != current_user:
        flash("This user's connections are private.", "danger")
        return redirect(url_for('profile.view_profile', username=username))
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 15)
    following_query = user.followed.order_by(User.username.asc())
    try:
        pagination = following_query.paginate(page=page, per_page=per_page, error_out=False)
        users_list = pagination.items
    except Exception as e:
        current_app.logger.error(f"Error fetching following list for {username}: {e}", exc_info=True)
        flash("Error loading following list.", "danger")
        users_list, pagination = [], None
    return render_template('following_list.html', user_profile=user, users_list=users_list, pagination=pagination, list_type="Following")
