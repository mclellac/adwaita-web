from flask import Blueprint, redirect, request, flash, current_app, abort, url_for, jsonify
from flask_login import current_user, login_required

from .. import db
from ..models import User, Post, Comment, UserPhoto, Notification, Activity, Like
from ..forms import LikeForm, UnlikeForm # Using existing forms for CSRF

like_bp = Blueprint('like', __name__, url_prefix='/like')

@like_bp.route('/<string:action>/<string:target_type>/<int:target_id>', methods=['POST'])
@login_required
def like_item_route(action, target_type, target_id):
    if action == 'like':
        form = LikeForm()
    elif action == 'unlike':
        form = UnlikeForm()
    else:
        return jsonify(status="error", message="Invalid action."), 400

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

    target_model = None
    if target_type == 'post':
        target_model = Post
    elif target_type == 'comment':
        target_model = Comment
    elif target_type == 'photo':
        target_model = UserPhoto

    target_item = target_model.query.get_or_404(target_id)

    if action == 'like':
        if not current_user.has_liked_item(target_type, target_item.id):
            current_user.like_item(target_type, target_item.id)
            db.session.commit()
    elif action == 'unlike':
        if current_user.has_liked_item(target_type, target_item.id):
            current_user.unlike_item(target_type, target_item.id)
            db.session.commit()

    return jsonify({
        'status': 'success',
        'user_has_liked': current_user.has_liked_item(target_type, target_item.id),
        'new_like_count': target_item.likes.count()
    })
