from flask import Blueprint, jsonify, request, abort, url_for, current_app, render_template # Added render_template
from flask_login import current_user, login_required
import bleach # Import bleach
from .. import db
from ..models import UserPhoto, Comment, User, Notification
from ..forms import CommentForm, DeleteCommentForm
from ..utils import extract_mentions, get_avatar_url

photo_bp = Blueprint('photo', __name__, url_prefix='/photo')

def get_avatar_url(user):
    if user.profile_photo_url:
        return url_for('static', filename=user.profile_photo_url, _external=False)
    return url_for('static', filename='img/default_avatar.png', _external=False)

@photo_bp.route('/api/photos/<int:photo_id>/comments', methods=['GET'])
def get_photo_comments(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)

    # Basic permission check: If photo owner's profile is private, only owner can see comments via API?
    # Or, if the gallery page itself has its own privacy, that should be checked.
    # For now, assume if one can see the photo (e.g. on a public profile), they can see comments.
    # More granular checks can be added if UserPhoto gets its own privacy flag or inherits from profile.
    if not photo.user.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.user_id):
        # This is a basic check, might need refinement based on overall gallery privacy rules
        # Allowing admin to bypass could also be an option: and not current_user.is_admin
        abort(403) # Forbidden

    comments_data = []
    # Sort by oldest first for display order
    for comment in photo.comments.order_by(Comment.created_at.asc()).all():
        comments_data.append({
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at.isoformat() + "Z", # Add Z for UTC indication
            'author': {
                'id': comment.author.id,
                # 'username' (email) removed from public API response
                'full_name': comment.author.full_name or ('User ' + str(comment.author.id)),
                'profile_photo_url': get_avatar_url(comment.author),
                'profile_url': url_for('profile.view_profile', user_id=comment.author.id, _external=False) # Use user_id
            }
        })
    return jsonify(comments_data)

@photo_bp.route('/view/<int:photo_id>', methods=['GET'])
def view_photo_detail(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    # Permission check (basic: public profile or owner/admin for private)
    if not photo.user.is_profile_public and (not current_user.is_authenticated or (current_user.id != photo.user.id and not current_user.is_admin)):
        current_app.logger.warning(f"User (ID: {current_user.id if current_user.is_authenticated else 'Anonymous'}) "
                                   f"attempted to view photo {photo_id} from private profile of user {photo.user.id}")
        abort(403)

    comment_form = CommentForm() if current_user.is_authenticated else None
    # Likes and other details can be accessed directly from photo object in template
    return render_template('photo_detail.html', photo=photo, comment_form=comment_form)

@photo_bp.route('/api/photos/<int:photo_id>/details', methods=['GET'])
def get_photo_details_api(photo_id):
    photo = db.session.get(UserPhoto, photo_id)
    if not photo:
        return jsonify(status="error", message="Photo not found"), 404

    # Basic permission check (similar to get_photo_comments)
    # Adjust as per actual privacy model for photos/galleries
    if not photo.user.is_profile_public and (not current_user.is_authenticated or current_user.id != photo.user.id):
        # Could also add admin bypass here: and not current_user.is_admin
        return jsonify(status="error", message="Forbidden"), 403

    user_has_liked = False
    if current_user.is_authenticated:
        user_has_liked = current_user.has_liked_item('photo', photo.id)

    return jsonify(
        status="success",
        id=photo.id,
        # caption=photo.caption, # Client has this from data-caption
        # image_filename=photo.image_filename, # Client has this from data-fullsrc
        like_count=photo.like_count,
        user_has_liked=user_has_liked
    )

