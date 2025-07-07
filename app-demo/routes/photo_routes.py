from flask import Blueprint, jsonify, request, abort, url_for
from flask_login import current_user, login_required
from .. import db  # Corrected import
from ..models import UserPhoto, PhotoComment, User  # Corrected import
from ..forms import PhotoCommentForm  # Corrected import

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
    for comment in photo.comments.order_by(PhotoComment.created_at.asc()).all():
        comments_data.append({
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at.isoformat() + "Z", # Add Z for UTC indication
            'author': {
                'id': comment.author.id,
                'username': comment.author.username,
                'full_name': comment.author.full_name or comment.author.username,
                'profile_photo_url': get_avatar_url(comment.author),
                'profile_url': url_for('profile.view_profile', username=comment.author.username, _external=False)
            }
        })
    return jsonify(comments_data)

@photo_bp.route('/api/photos/<int:photo_id>/comments', methods=['POST'])
@login_required
def post_photo_comment(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)

    # Permission check: can the current user comment on this photo?
    # Example: if photo owner's profile is private, only owner or followed users? Or simply being logged in is enough for public profiles.
    if not photo.user.is_profile_public and (current_user.id != photo.user_id and not current_user.is_admin):
         # Simplified: if profile is private, only owner or admin can comment.
         # This could be expanded (e.g. followers can comment).
        abort(403) # Forbidden

    form = PhotoCommentForm(data=request.json) # Pass request.json to the form

    if form.validate(): # Use validate() for JSON data if meta is not configured for CSRF
        new_comment = PhotoComment(
            text=form.text.data.strip(),
            user_id=current_user.id,
            photo_id=photo.id
        )
        db.session.add(new_comment)
        db.session.commit()

        return jsonify({
            'id': new_comment.id,
            'text': new_comment.text,
            'created_at': new_comment.created_at.isoformat() + "Z", # Add Z for UTC indication
            'author': {
                'id': current_user.id,
                'username': current_user.username,
                'full_name': current_user.full_name or current_user.username,
                'profile_photo_url': get_avatar_url(current_user),
                'profile_url': url_for('profile.view_profile', username=current_user.username, _external=False)
            }
        }), 201
    else:
        # Collect form errors
        errors = {field: error[0] for field, error in form.errors.items()}
        return jsonify({'errors': errors}), 400

# Need to register this blueprint in app-demo/__init__.py's create_app()
# Example:
# from .routes.photo_routes import photo_bp
# app.register_blueprint(photo_bp)
