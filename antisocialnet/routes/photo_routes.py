from flask import Blueprint, jsonify, request, abort, url_for, current_app, render_template, flash, redirect # Added render_template
from flask_login import current_user, login_required
import bleach # Import bleach
from .. import db
from ..models import UserPhoto, PhotoComment, User, Notification # Added Notification
from ..forms import PhotoCommentForm, DeleteCommentForm
from ..utils import extract_mentions # Added extract_mentions

photo_bp = Blueprint('photo', __name__, url_prefix='/photo')

def get_avatar_url(user):
    if user.profile_photo_url:
        return url_for('static', filename=user.profile_photo_url, _external=False)
    return url_for('static', filename='img/default_avatar.png', _external=False)

@photo_bp.route('/api/photos/<int:photo_id>/comments', methods=['GET'])
def get_photo_comments(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)

    if not photo.author.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.user_id):
        abort(403)

    comments_data = []
    for comment in photo.comments.order_by(PhotoComment.created_at.asc()).all():
        comments_data.append({
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at.isoformat() + "Z",
            'author': {
                'id': comment.author.id,
                'full_name': comment.author.full_name or ('User ' + str(comment.author.id)),
                'profile_photo_url': get_avatar_url(comment.author),
                'profile_url': url_for('profile.view_profile', user_id=comment.author.id, _external=False)
            }
        })
    return jsonify(comments_data)

@photo_bp.route('/view/<int:photo_id>', methods=['GET'])
def view_photo_detail(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    if not photo.author.is_profile_public and (not current_user.is_authenticated or (current_user.id != photo.author.id and not current_user.is_admin)):
        current_app.logger.warning(f"User (ID: {current_user.id if current_user.is_authenticated else 'Anonymous'}) "
                                   f"attempted to view photo {photo_id} from private profile of user {photo.author.id}")
        abort(403)

    comment_form = PhotoCommentForm() if current_user.is_authenticated else None
    delete_comment_form = DeleteCommentForm() if current_user.is_authenticated else None
    return render_template('photo_detail.html', photo=photo, comment_form=comment_form, delete_comment_form=delete_comment_form)

@photo_bp.route('/api/photos/<int:photo_id>/details', methods=['GET'])
def get_photo_details_api(photo_id):
    photo = db.session.get(UserPhoto, photo_id)
    if not photo:
        return jsonify(status="error", message="Photo not found"), 404

    if not photo.author.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.author.id):
        return jsonify(status="error", message="Forbidden"), 403

    user_has_liked = False
    if current_user.is_authenticated:
        user_has_liked = current_user.has_liked_item('photo', photo.id)

    return jsonify(
        status="success",
        id=photo.id,
        like_count=photo.like_count,
        user_has_liked=user_has_liked
    )

@photo_bp.route('/api/photos/<int:photo_id>/comments', methods=['POST'])
@login_required
def post_photo_comment(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)

    if not photo.author.is_profile_public and (current_user.id != photo.author.id and not current_user.is_admin):
        abort(403)

    json_data = request.json if request.is_json else {}
    form = PhotoCommentForm(formdata=None, **json_data)

    if form.validate():
        sanitized_text = bleach.clean(form.text.data.strip(), tags=[], strip=True)
        new_comment = PhotoComment(
            text=sanitized_text,
            user_id=current_user.id,
            photo_id=photo.id
        )
        db.session.add(new_comment)
        db.session.commit()
        from sqlalchemy import func

        mentioned_full_names = extract_mentions(new_comment.text)
        new_mentions_created = False
        if mentioned_full_names:
            for name_str in mentioned_full_names:
                mentioned_users = User.query.filter(func.lower(User.full_name) == func.lower(name_str)).all()
                if len(mentioned_users) == 1:
                    mentioned_user_obj = mentioned_users[0]
                    if mentioned_user_obj.id != current_user.id:
                        existing_notif = Notification.query.filter_by(
                            user_id=mentioned_user_obj.id,
                            actor_id=current_user.id,
                            type='mention_in_photo_comment',
                            target_type='photo_comment',
                            target_id=new_comment.id
                        ).first()
                        if not existing_notif:
                            mention_notification = Notification(
                                user_id=mentioned_user_obj.id,
                                actor_id=current_user.id,
                                type='mention_in_photo_comment',
                                target_type='photo_comment',
                                target_id=new_comment.id
                            )
                            db.session.add(mention_notification)
                            new_mentions_created = True
                            current_app.logger.info(f"Mention notification created for user '{mentioned_user_obj.full_name}' (ID: {mentioned_user_obj.id}) in photo comment {new_comment.id}")
                elif len(mentioned_users) > 1:
                    current_app.logger.info(f"Ambiguous mention for '{name_str}' in photo comment {new_comment.id}: {len(mentioned_users)} users found. No notification sent.")
                else:
                    current_app.logger.info(f"Mentioned name '{name_str}' in photo comment {new_comment.id} does not correspond to any user. No notification sent.")


        if new_mentions_created:
            db.session.commit()

        return jsonify({
            'id': new_comment.id,
            'text': new_comment.text,
            'created_at': new_comment.created_at.isoformat() + "Z",
            'author': {
                'id': current_user.id,
                'full_name': current_user.full_name or ('User ' + str(current_user.id)),
                'profile_photo_url': get_avatar_url(current_user),
                'profile_url': url_for('profile.view_profile', user_id=current_user.id, _external=False)
            }
        }), 201
    else:
        errors = {field: error[0] for field, error in form.errors.items()}
        return jsonify({'errors': errors}), 400

@photo_bp.route('/comment/delete/<int:comment_id>', methods=['POST'])
@login_required
def delete_photo_comment(comment_id):
    comment = PhotoComment.query.get_or_404(comment_id)
    photo = comment.photo # Get the photo to redirect back to

    # Authorization: must be comment author, photo owner, or admin
    if not (current_user.id == comment.user_id or current_user.id == photo.user_id or current_user.is_admin):
        flash("You are not authorized to delete this comment.", "danger")
        abort(403)

    try:
        db.session.delete(comment)
        db.session.commit()
        flash("Comment deleted successfully.", "toast_success")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting photo comment ID {comment_id}: {e}", exc_info=True)
        flash(f"Error deleting comment: {str(e)}", "danger")

    return redirect(url_for('photo.view_photo_detail', photo_id=photo.id))
