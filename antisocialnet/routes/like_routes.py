from flask import Blueprint, redirect, request, flash, current_app, abort, url_for, jsonify
from flask_login import current_user, login_required

from .. import db
from ..models import User, Post, Comment, UserPhoto, Notification, Activity, Like
from ..forms import LikeForm, UnlikeForm

like_bp = Blueprint('like', __name__, url_prefix='/like')

@like_bp.route('/<string:target_type>/<int:target_id>', methods=['POST'])
@login_required
def like_item_route(target_type, target_id):
    form = LikeForm()
    if not form.validate_on_submit():
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
            return jsonify(status="error", message="Invalid request or session expired."), 400
        flash('Invalid request or session expired. Could not like item.', 'danger')
        return redirect(request.referrer or url_for('general.index'))

    if target_type not in ['post', 'comment', 'photo']:
        current_app.logger.warning(f"User {current_user.id} attempt to like invalid target_type: {target_type}")
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
            return jsonify(status="error", message="Invalid item type."), 404
        abort(404)

    target_item = None
    if target_type == 'post':
        target_item = db.session.get(Post, target_id)
        if target_item:
            if not target_item.is_published and target_item.user_id != current_user.id:
                current_app.logger.warning(f"User {current_user.id} attempt to like non-published post {target_id} they don't own.")
                if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
                    return jsonify(status="error", message="Cannot like this item."), 403
                abort(403)
    elif target_type == 'comment':
        target_item = db.session.get(Comment, target_id)
    elif target_type == 'photo':
        target_item = db.session.get(UserPhoto, target_id)

    if not target_item:
        current_app.logger.warning(f"User {current_user.id} attempt to like non-existent {target_type} with id {target_id}")
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
            return jsonify(status="error", message=f"{target_type.capitalize()} not found."), 404
        abort(404)

    message = ""
    success = False
    if current_user.has_liked_item(target_type, target_id):
        message = 'You have already liked this item.'
        success = True
    else:
        try:
            if current_user.like_item(target_type, target_id):
                db.session.commit()
                message = f"{target_type.capitalize()} liked!"
                success = True
                current_app.logger.info(f"User {current_user.id} liked {target_type} {target_id}.")
            else:
                message = f'Could not like {target_type}. An unexpected error occurred.'
                db.session.rollback()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during like op for {target_type} {target_id} by user {current_user.id}: {e}", exc_info=True)
            message = f'An error occurred while trying to like the {target_type}.'

    db.session.refresh(target_item)

    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify(
            status="success" if success else "error",
            message=message,
            new_like_count=target_item.like_count if target_item else 0,
            user_has_liked=current_user.has_liked_item(target_type, target_id)
        ), 200 if success else 400

    if success and message == f"{target_type.capitalize()} liked!":
         flash(message, 'toast_success')
    elif message:
         flash(message, 'info' if success else 'danger')
    return redirect(request.referrer or url_for('general.index'))

@like_bp.route('/unlike/<string:target_type>/<int:target_id>', methods=['POST'])
@login_required
def unlike_item_route(target_type, target_id):
    form = UnlikeForm()
    if not form.validate_on_submit():
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
            return jsonify(status="error", message="Invalid request or session expired."), 400
        flash('Invalid request or session expired. Could not unlike item.', 'danger')
        return redirect(request.referrer or url_for('general.index'))

    if target_type not in ['post', 'comment', 'photo']:
        current_app.logger.warning(f"User {current_user.id} attempt to unlike invalid target_type: {target_type}")
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
            return jsonify(status="error", message="Invalid item type."), 404
        abort(404)

    target_item = None
    if target_type == 'post': target_item = db.session.get(Post, target_id)
    elif target_type == 'comment': target_item = db.session.get(Comment, target_id)
    elif target_type == 'photo': target_item = db.session.get(UserPhoto, target_id)

    message = ""
    success = False
    if not current_user.has_liked_item(target_type, target_id):
        message = 'You have not liked this item.'
        success = True
    else:
        try:
            if current_user.unlike_item(target_type, target_id):
                db.session.commit()
                message = f'{target_type.capitalize()} unliked.'
                success = True
                current_app.logger.info(f"User {current_user.id} unliked {target_type} {target_id}.")
            else:
                message = f'Could not unlike {target_type}. An unexpected error occurred.'
                db.session.rollback()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during unlike op for {target_type} {target_id} by user {current_user.id}: {e}", exc_info=True)
            message = f'An error occurred while trying to unlike the {target_type}.'

    if target_item:
        db.session.refresh(target_item)

    final_like_count = target_item.like_count if target_item else 0

    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify(
            status="success" if success else "error",
            message=message,
            new_like_count=final_like_count,
            user_has_liked=current_user.has_liked_item(target_type, target_id)
        ), 200 if success else 400

    if success and message == f"{target_type.capitalize()} unliked.":
        flash(message, 'toast_success')
    elif message:
        flash(message, 'info' if success else 'danger')
    return redirect(request.referrer or url_for('general.index'))
