from flask import Blueprint, redirect, request, flash, current_app, abort, url_for, jsonify
from flask_login import current_user, login_required

from .. import db
from ..models import User, Post, Comment, UserPhoto, Notification, Activity, Like
from ..forms import LikeForm, UnlikeForm # Using existing forms for CSRF

like_bp = Blueprint('like', __name__, url_prefix='/like')

@like_bp.route('/<string:target_type>/<int:target_id>', methods=['POST'])
@login_required
def like_item_route(target_type, target_id):
    form = LikeForm() # For CSRF validation
    if not form.validate_on_submit():
        # For AJAX, returning JSON error is better than redirect
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
    item_author = None
    if target_type == 'post':
        target_item = db.session.get(Post, target_id)
        if target_item:
            if not target_item.is_published and target_item.user_id != current_user.id:
                current_app.logger.warning(f"User {current_user.id} attempt to like non-published post {target_id} they don't own.")
                if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
                    return jsonify(status="error", message="Cannot like this item."), 403
                abort(403)
            item_author = target_item.author
    elif target_type == 'comment':
        target_item = db.session.get(Comment, target_id)
        if target_item: item_author = target_item.author
    elif target_type == 'photo':
        target_item = db.session.get(UserPhoto, target_id)
        if target_item: item_author = target_item.user

    if not target_item:
        current_app.logger.warning(f"User {current_user.id} attempt to like non-existent {target_type} with id {target_id}")
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
            return jsonify(status="error", message=f"{target_type.capitalize()} not found."), 404
        abort(404)

    message = ""
    success = False
    if current_user.has_liked_item(target_type, target_id):
        message = 'You have already liked this item.'
        success = True # Or consider this a non-change, but still success for UI update
    else:
        try:
            if current_user.like_item(target_type, target_id):
                if item_author and item_author.id != current_user.id: # Check author ID
                    notification = Notification(user_id=item_author.id, actor_id=current_user.id, type='new_like', target_type=target_type, target_id=target_id)
                    db.session.add(notification)
                activity = Activity(user_id=current_user.id, type='liked_item', target_type=target_type, target_id=target_id)
                db.session.add(activity)
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

    # Refresh target_item for accurate like_count if it was changed
    db.session.refresh(target_item)

    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify(
            status="success" if success else "error",
            message=message,
            new_like_count=target_item.like_count if target_item else 0,
            user_has_liked=current_user.has_liked_item(target_type, target_id)
        ), 200 if success else 400 # Or 500 for server errors

    if success and message == f"{target_type.capitalize()} liked!":
         flash(message, 'toast_success')
    elif message:
         flash(message, 'info' if success else 'danger') # Use info for "already liked"
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

    # Fetch item primarily to get its current like_count if needed, and for consistency
    target_item = None
    if target_type == 'post': target_item = db.session.get(Post, target_id)
    elif target_type == 'comment': target_item = db.session.get(Comment, target_id)
    elif target_type == 'photo': target_item = db.session.get(UserPhoto, target_id)

    # It's okay if target_item is None here if it was deleted but Like record still exists
    # The unlike_item method handles non-existent Like records gracefully.

    message = ""
    success = False
    if not current_user.has_liked_item(target_type, target_id):
        message = 'You have not liked this item.'
        success = True # Or consider this a non-change
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

    # Refresh target_item for accurate like_count if it exists and was changed
    if target_item:
        db.session.refresh(target_item)

    final_like_count = target_item.like_count if target_item else 0
    # If item was deleted, we can't get its like count.
    # We might need to query Like table directly if this becomes an issue,
    # but for now, client-side might just show count based on its last known state.
    # However, UserPhoto, Post, Comment models have like_count attribute.

    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify(
            status="success" if success else "error",
            message=message,
            new_like_count=final_like_count,
            user_has_liked=current_user.has_liked_item(target_type, target_id) # Should be false after successful unlike
        ), 200 if success else 400

    if success and message == f"{target_type.capitalize()} unliked.":
        flash(message, 'toast_success')
    elif message:
        flash(message, 'info' if success else 'danger')
    return redirect(request.referrer or url_for('general.index'))
