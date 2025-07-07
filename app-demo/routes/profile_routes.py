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
from ..utils import allowed_file_util, flash_form_errors_util, ALLOWED_TAGS_CONFIG, ALLOWED_ATTRIBUTES_CONFIG

profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('/<int:user_id>')
@login_required
def view_profile(user_id):
    # Ensure datetime is available; moved back to top-level import.
    current_app.logger.debug(f"Accessing profile for user_id {user_id}, requested by {current_user.username}")
    user_profile = User.query.filter_by(id=user_id).first_or_404()
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
        photo_update_attempted = False
        photo_saved_successfully = False

        if file and file.filename:
            photo_update_attempted = True
            current_app.logger.debug(f"Profile photo update attempt by {current_user.username}. Filename: {file.filename}, Content-Length: {getattr(file, 'content_length', 'N/A')}")
            file_size = file.content_length if hasattr(file, 'content_length') else request.content_length
            if file_size is None:
                 current_app.logger.warning(f"Could not determine file size for {current_user.username}.")
                 flash("Could not determine file size. Please try again.", "danger")
            elif file_size > current_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES']:
                current_app.logger.warning(f"Profile photo for {current_user.username} too large: {file_size} bytes.")
                max_size_mb = current_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES'] // 1024 // 1024
                flash(f"Profile photo too large. Max size: {max_size_mb}MB.", 'danger')
            elif not allowed_file_util(file.filename):
                current_app.logger.warning(f"Invalid file type for photo by {current_user.username}: {file.filename}")
                flash(f"Invalid file type for photo. Allowed types are {', '.join(current_app.config['ALLOWED_EXTENSIONS'])}.", 'danger')
            else:
                try:
                    original_filename = secure_filename(file.filename)
                    ext = original_filename.rsplit('.', 1)[-1].lower()
                    unique_filename = f"{uuid.uuid4()}.{ext}"
                    upload_folder_path = current_app.config['UPLOAD_FOLDER']
                    save_path = os.path.join(upload_folder_path, unique_filename)
                    os.makedirs(upload_folder_path, exist_ok=True)
                    file.stream.seek(0)
                    img = Image.open(file.stream)
                    crop_x_str = request.form.get('crop_x')
                    crop_y_str = request.form.get('crop_y')
                    crop_width_str = request.form.get('crop_width')
                    crop_height_str = request.form.get('crop_height')
                    if (crop_x_str and crop_y_str and crop_width_str and crop_height_str):
                        try:
                            crop_x = int(float(crop_x_str))
                            crop_y = int(float(crop_y_str))
                            crop_width = int(float(crop_width_str))
                            crop_height = int(float(crop_height_str))
                            if crop_width > 0 and crop_height > 0:
                                img = img.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
                            else:
                                flash("Invalid crop dimensions provided. Photo processed without cropping.", 'warning')
                        except ValueError as ve:
                            flash("Invalid crop coordinates provided. Photo processed without cropping.", 'warning')
                    img.thumbnail((200, 200))
                    img.save(save_path)
                    if os.path.exists(save_path):
                        if current_user.profile_photo_url:
                            old_filename_rel = current_user.profile_photo_url
                            old_photo_abs_path = os.path.join(upload_folder_path, os.path.basename(old_filename_rel))
                            if os.path.commonpath([os.path.realpath(old_photo_abs_path), os.path.realpath(upload_folder_path)]) == os.path.realpath(upload_folder_path):
                                if os.path.exists(old_photo_abs_path):
                                    try:
                                        os.remove(old_photo_abs_path)
                                    except OSError as oe:
                                        current_app.logger.error(f"Error deleting old photo {old_photo_abs_path}: {oe}", exc_info=True)
                        db_photo_path = os.path.relpath(save_path, current_app.static_folder).replace("\\", "/")
                        current_user.profile_photo_url = db_photo_path
                        photo_saved_successfully = True
                    else:
                        flash('Error saving photo: File could not be written to disk.', 'danger')
                except Exception as e:
                    current_app.logger.error(f"Exception during photo processing for {current_user.username}: {e}", exc_info=True)
                    flash(f'Error processing profile photo: {str(e)}', 'danger')
        try:
            db.session.add(current_user)
            db.session.commit()
            flash_msg = 'Profile and photo updated successfully!' if photo_update_attempted and photo_saved_successfully else \
                        ('Profile information updated, but there was an issue with the photo upload.' if photo_update_attempted else 'Profile updated successfully!')
            original_flash_cat = 'success' if not photo_update_attempted or photo_saved_successfully else 'warning'

            if original_flash_cat == 'success':
                flash(flash_msg, 'toast_success')
            else:
                flash(flash_msg, original_flash_cat) # This will be 'warning'
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving profile to DB for {current_user.username}: {e}", exc_info=True)
            flash(f'Error saving profile changes: {str(e)}', 'danger')
        return redirect(url_for('profile.view_profile', user_id=current_user.id))

    elif request.method == 'POST':
        current_app.logger.warning(f"Edit profile form validation failed for {current_user.username}. Errors: {form.errors}")
        flash_form_errors_util(form)

    return render_template('edit_profile.html', form=form, user_profile=current_user)


@profile_bp.route('/gallery/upload', methods=['POST'])
@login_required
def upload_gallery_photo():
    form = GalleryPhotoUploadForm()
    # For MultipleFileField, FileAllowed needs to be applied carefully,
    # often it's better to validate each file in the loop.
    # However, we can add it to the form field directly if wtforms handles it for each file.
    # Let's assume FileAllowed on MultipleFileField checks each file.
    # If not, the loop below will catch it.
    form.photos.validators.append(FileAllowed(current_app.config['ALLOWED_EXTENSIONS'], 'Images only!'))

    if form.validate_on_submit():
        uploaded_count = 0
        failed_count = 0
        caption = form.caption.data  # Common caption for the batch

        for file_storage in form.photos.data:
            if not file_storage or not file_storage.filename:
                failed_count += 1
                current_app.logger.warning(f"Empty file storage object encountered in batch upload for user {current_user.id}.")
                continue

            # Check file size (important to do this early)
            file_storage.stream.seek(0, os.SEEK_END)
            actual_file_size = file_storage.stream.tell()
            file_storage.stream.seek(0) # Reset stream position

            if actual_file_size == 0: # Skip empty files that might pass initial checks
                failed_count +=1
                current_app.logger.warning(f"Skipped empty file: {secure_filename(file_storage.filename)} for user {current_user.id}")
                continue


            if actual_file_size > current_app.config['MAX_GALLERY_PHOTO_SIZE_BYTES']:
                max_size_mb = current_app.config['MAX_GALLERY_PHOTO_SIZE_BYTES'] // 1024 // 1024
                flash(f"Photo '{secure_filename(file_storage.filename)}' is too large. Maximum size is {max_size_mb}MB.", "danger")
                failed_count += 1
                continue

            original_filename = secure_filename(file_storage.filename)
            ext = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else ''

            if not ext or ext not in current_app.config['ALLOWED_EXTENSIONS']:
                flash(f"Invalid file type for '{original_filename}'. Allowed types: {', '.join(current_app.config['ALLOWED_EXTENSIONS'])}.", 'warning')
                failed_count += 1
                continue

            try:
                unique_filename_stem = uuid.uuid4().hex
                unique_filename = f"{unique_filename_stem}.{ext}"
                user_gallery_folder_name = str(current_user.id)
                user_specific_folder_abs = os.path.join(current_app.config['GALLERY_UPLOAD_FOLDER'], user_gallery_folder_name)
                os.makedirs(user_specific_folder_abs, exist_ok=True)
                save_path = os.path.join(user_specific_folder_abs, unique_filename)

                file_storage.save(save_path) # Use FileStorage's save method

                if os.path.exists(save_path):
                    db_image_path = os.path.join(user_gallery_folder_name, unique_filename).replace("\\", "/")
                    new_photo = UserPhoto(user_id=current_user.id, image_filename=db_image_path, caption=caption)
                    db.session.add(new_photo)
                    uploaded_count += 1
                else:
                    flash(f"Error saving photo '{original_filename}': File could not be written to disk.", 'danger')
                    failed_count += 1
            except Exception as e:
                current_app.logger.error(f"Exception during gallery photo processing for {original_filename}: {e}", exc_info=True)
                flash(f"Error processing gallery photo '{original_filename}': {str(e)}", 'danger')
                failed_count += 1

        if uploaded_count > 0:
            try:
                db.session.commit()
                flash(f'{uploaded_count} photo(s) uploaded to gallery successfully!', 'toast_success')
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Database commit failed after uploading {uploaded_count} photos: {e}", exc_info=True)
                flash('Database error after uploading photos. Some uploads may not have been saved.', 'danger')
                # uploaded_count might not reflect actual DB saves here.

        if failed_count > 0:
            flash(f'{failed_count} photo(s) failed to upload.', 'warning')

        if uploaded_count == 0 and failed_count == 0 and form.photos.data:
             # This case might happen if all files were empty or some other edge case not caught above
            flash('No photos were uploaded. Please ensure files are selected and not empty.', 'info')


    else: # Form validation failed
        flash_form_errors_util(form) # This helper flashes 'danger' messages

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
    return redirect(url_for('profile.view_profile', user_id=photo.user.id if photo.user else current_user.id))


@profile_bp.route('/<int:user_id>/gallery')
@login_required
def view_gallery(user_id):
    user_profile = User.query.filter_by(id=user_id).first_or_404()
    if not user_profile.is_profile_public and user_profile != current_user:
        flash("This profile's gallery is private.", "danger")
        abort(403)

    page = request.args.get('page', 1, type=int)
    # Use a specific config for gallery items per page, or fallback to POSTS_PER_PAGE or a default
    per_page = current_app.config.get('GALLERY_PHOTOS_PER_PAGE', 12) # Example: 12 photos per page

    gallery_photos_query = user_profile.gallery_photos.order_by(UserPhoto.uploaded_at.desc())
    try:
        gallery_photos_page = gallery_photos_query.paginate(page=page, per_page=per_page, error_out=False)
    except Exception as e:
        current_app.logger.error(f"Error fetching gallery photos for profile {user_profile.username} (page {page}): {e}", exc_info=True)
        flash("Error loading gallery photos.", "danger")
        gallery_photos_page = None

    return render_template('gallery_full.html', user_profile=user_profile, gallery_photos_page=gallery_photos_page)


@profile_bp.route('/follow/<int:user_id>', methods=['POST'])
@login_required
def follow_user(user_id):
    user_to_follow = User.query.filter_by(id=user_id).first_or_404()
    if user_to_follow == current_user:
        flash("You cannot follow yourself.", "warning")
        return redirect(url_for('profile.view_profile', user_id=user_id))
    if current_user.is_following(user_to_follow):
        flash(f"You are already following {user_to_follow.username}.", "info")
    else:
        if current_user.follow(user_to_follow):
            from ..models import Notification # Local import
            notification = Notification(user_id=user_to_follow.id, actor_id=current_user.id, type='new_follower')
            db.session.add(notification)
            from ..models import Activity # Local import
            activity = Activity(user_id=current_user.id, type='started_following', target_user_id=user_to_follow.id)
            db.session.add(activity)
            db.session.commit()
            flash(f"You are now following {user_to_follow.username}.", "toast_success")
        else:
            flash(f"Could not follow {user_to_follow.username}. An unexpected error occurred or it was a self-follow.", "danger")
            db.session.rollback()
    return redirect(url_for('profile.view_profile', user_id=user_id))


@profile_bp.route('/unfollow/<int:user_id>', methods=['POST'])
@login_required
def unfollow_user(user_id):
    user_to_unfollow = User.query.filter_by(id=user_id).first_or_404()
    if user_to_unfollow == current_user:
        flash("You cannot unfollow yourself.", "warning")
        return redirect(url_for('profile.view_profile', user_id=user_id))
    if not current_user.is_following(user_to_unfollow):
        flash(f"You are not currently following {user_to_unfollow.username}.", "info")
    else:
        if current_user.unfollow(user_to_unfollow):
            db.session.commit()
            flash(f"You have unfollowed {user_to_unfollow.username}.", "toast_success")
        else:
            flash(f"Could not unfollow {user_to_unfollow.username}. An unexpected error occurred.", "danger")
            db.session.rollback()
    return redirect(url_for('profile.view_profile', user_id=user_id))


@profile_bp.route('/<int:user_id>/followers')
@login_required
def followers_list(user_id):
    user = User.query.filter_by(id=user_id).first_or_404()
    if not user.is_profile_public and user != current_user:
        flash("This user's connections are private.", "danger")
        return redirect(url_for('profile.view_profile', user_id=user_id))
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


@profile_bp.route('/<int:user_id>/following')
@login_required
def following_list(user_id):
    user = User.query.filter_by(id=user_id).first_or_404()
    if not user.is_profile_public and user != current_user:
        flash("This user's connections are private.", "danger")
        return redirect(url_for('profile.view_profile', user_id=user_id))
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
