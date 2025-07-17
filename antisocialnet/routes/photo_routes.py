from flask import Blueprint, jsonify, request, abort, url_for, current_app
from flask_login import current_user, login_required
import bleach
from .. import db
from ..models import UserPhoto, Comment, User, Notification
from ..forms import CommentForm
from ..utils import extract_mentions
from ..api_utils import serialize_comment_item, serialize_photo_item

photo_bp = Blueprint('photo', __name__, url_prefix='/api/v1/photos')

@photo_bp.route('/<int:photo_id>', methods=['GET'])
def get_photo(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    if not photo.user.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.user_id):
        abort(403)
    return jsonify(serialize_photo_item(photo))

@photo_bp.route('/<int:photo_id>/comments', methods=['GET'])
def get_photo_comments(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    if not photo.user.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.user_id):
        abort(403)

    comments = photo.comments.order_by(Comment.created_at.asc()).all()
    return jsonify([serialize_comment_item(c) for c in comments])

@photo_bp.route('/<int:photo_id>/comments', methods=['POST'])
@login_required
def add_photo_comment(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    if not photo.user.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.user_id):
        abort(403)

    form = CommentForm(data=request.get_json())
    if form.validate():
        comment = Comment(text=form.text.data, user_id=current_user.id, target_type='userphoto', target_id=photo_id)
        db.session.add(comment)
        db.session.commit()
        # Handle notifications and activity
        # ...
        return jsonify(serialize_comment_item(comment)), 201
    return jsonify(errors=form.errors), 400
