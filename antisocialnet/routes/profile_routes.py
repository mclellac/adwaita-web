from flask import Blueprint, request, jsonify, current_app, abort
from flask_login import current_user, login_required
import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
from flask_wtf.file import FileAllowed
import bleach
from datetime import datetime

from sqlalchemy.orm import selectinload
from ..models import User, Post, Comment, UserPhoto, SiteSetting, Notification, Activity
from ..forms import ProfileEditForm, GalleryPhotoUploadForm
from .. import db
from ..utils import ALLOWED_TAGS_CONFIG, ALLOWED_ATTRIBUTES_CONFIG, save_uploaded_file
from ..api_utils import serialize_user_profile, serialize_post_item, serialize_photo_item

profile_bp = Blueprint('profile', __name__, url_prefix='/api/v1/profile')

@profile_bp.route('/edit', methods=['POST'])
@login_required
def edit_profile():
    data = request.form.to_dict()
    form = ProfileEditForm(data=data, obj=current_user)

    if form.validate():
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

        photo_file = request.files.get('profile_photo')
        if photo_file:
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
                except (ValueError, TypeError):
                    crop_params = None

            new_photo_db_path = save_uploaded_file(
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

        try:
            db.session.commit()
            return jsonify(status='success', message='Profile updated successfully!', user=serialize_user_profile(current_user))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving profile to DB for User ID: {current_user.id}: {e}", exc_info=True)
            return jsonify(status='error', message=f'Error saving profile changes: {str(e)}'), 500
    else:
        return jsonify(status='error', errors=form.errors), 400

@profile_bp.route('/gallery/upload', methods=['POST'])
@login_required
def upload_gallery_photo():
    form = GalleryPhotoUploadForm()
    if form.validate_on_submit():
        photo_files = form.photos.data
        caption = form.caption.data

        if not photo_files or all(not f.filename for f in photo_files):
            return jsonify(status='error', message='No photo files selected for gallery upload.'), 400

        new_photos = []
        for photo_file in photo_files:
            if photo_file and photo_file.filename:
                saved_db_path = save_uploaded_file(
                    file_storage_object=photo_file,
                    upload_type="gallery_photo",
                    base_upload_path_config_key="GALLERY_UPLOAD_FOLDER",
                    max_size_bytes_config_key="MAX_GALLERY_PHOTO_SIZE_BYTES",
                    current_user_id=current_user.id
                )
                if saved_db_path:
                    new_photo = UserPhoto(
                        user_id=current_user.id,
                        image_filename=saved_db_path,
                        caption=caption
                    )
                    db.session.add(new_photo)
                    new_photos.append(new_photo)

        if new_photos:
            try:
                db.session.commit()
                # Create notifications for followers
                for follower in current_user.followers:
                    for photo in new_photos:
                        notification = Notification(
                            user_id=follower.id,
                            actor_id=current_user.id,
                            type='new_photo_by_followed_user',
                            target_type='userphoto',
                            target_id=photo.id
                        )
                        db.session.add(notification)
                db.session.commit()
                return jsonify(status='success', message=f'{len(new_photos)} photo(s) uploaded to gallery successfully!')
            except Exception as e:
                db.session.rollback()
                return jsonify(status='error', message='Error saving photo details to database.'), 500
        else:
            return jsonify(status='error', message='All photo uploads failed.'), 400
    else:
        return jsonify(status='error', errors=form.errors), 400

@profile_bp.route('/gallery/delete/<int:photo_id>', methods=['POST'])
@login_required
def delete_gallery_photo(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    if photo.user_id != current_user.id and not current_user.is_admin:
        abort(403)
    try:
        image_full_path = os.path.join(current_app.config['GALLERY_UPLOAD_FOLDER'], photo.image_filename)
        if os.path.exists(image_full_path):
            os.remove(image_full_path)
        db.session.delete(photo)
        db.session.commit()
        return jsonify(status='success', message='Photo deleted from gallery successfully.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting gallery photo ID {photo_id}: {e}", exc_info=True)
        return jsonify(status='error', message=f'Error deleting photo: {str(e)}'), 500

@profile_bp.route('/<int:user_id>/follow', methods=['POST'])
@login_required
def follow_user(user_id):
    user = User.query.get_or_404(user_id)
    if user == current_user:
        return jsonify(status='error', message='You cannot perform this action on yourself.'), 400
    if current_user.is_following(user):
        return jsonify(status='error', message=f"You are already following {user.full_name or ('@' + user.username)}."), 400

    if current_user.follow(user):
        notification = Notification(
            user_id=user.id,
            actor_id=current_user.id,
            type='new_follower',
            target_type='user',
            target_id=current_user.id
        )
        db.session.add(notification)
        activity = Activity(
            user_id=current_user.id,
            type='started_following',
            target_type='user',
            target_id=user.id
        )
        db.session.add(activity)
        db.session.commit()
        return jsonify(status='success', message=f"You are now following {user.full_name or ('@' + user.username)}.")
    else:
        db.session.rollback()
        return jsonify(status='error', message=f"Could not follow {user.full_name or ('@' + user.username)}. An unexpected error occurred."), 500

@profile_bp.route('/<int:user_id>/unfollow', methods=['POST'])
@login_required
def unfollow_user(user_id):
    user = User.query.get_or_404(user_id)
    if user == current_user:
        return jsonify(status='error', message='You cannot perform this action on yourself.'), 400
    if not current_user.is_following(user):
        return jsonify(status='error', message=f"You are not currently following {user.full_name or ('@' + user.username)}."), 400

    if current_user.unfollow(user):
        db.session.commit()
        return jsonify(status='success', message=f"You have unfollowed {user.full_name or ('@' + user.username)}.")
    else:
        db.session.rollback()
        return jsonify(status='error', message=f"Could not unfollow {user.full_name or ('@' + user.username)}. An unexpected error occurred."), 500

@profile_bp.route('/<int:user_id>/followers', methods=['GET'])
@login_required
def followers_list(user_id):
    user = User.query.get_or_404(user_id)
    if not user.is_profile_public and user != current_user:
        abort(403)
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('USERS_PER_PAGE', 15)
    followers_query = user.followers.order_by(User.full_name.asc())
    pagination = followers_query.paginate(page=page, per_page=per_page, error_out=False)
    users_list = [serialize_user_profile(u) for u in pagination.items]
    return jsonify(users=users_list, pagination={
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total_items': pagination.total,
        'total_pages': pagination.pages
    })

@profile_bp.route('/<int:user_id>/following', methods=['GET'])
@login_required
def following_list(user_id):
    user = User.query.get_or_404(user_id)
    if not user.is_profile_public and user != current_user:
        abort(403)
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('USERS_PER_PAGE', 15)
    following_query = user.followed.order_by(User.full_name.asc())
    pagination = following_query.paginate(page=page, per_page=per_page, error_out=False)
    users_list = [serialize_user_profile(u) for u in pagination.items]
    return jsonify(users=users_list, pagination={
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total_items': pagination.total,
        'total_pages': pagination.pages
    })
