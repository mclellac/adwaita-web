from flask import Blueprint, jsonify, request, abort, url_for, current_app # Added current_app
from flask_login import current_user, login_required
import bleach # Import bleach
from .. import db
from ..models import UserPhoto, PhotoComment, User, Notification # Added Notification
from ..forms import PhotoCommentForm
from ..utils import extract_mentions # Added extract_mentions

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
                'handle': comment.author.handle, # Use handle
                'full_name': comment.author.full_name or ('@' + comment.author.handle if comment.author.handle else comment.author.username), # Display full_name or @handle
                'profile_photo_url': get_avatar_url(comment.author),
                'profile_url': url_for('profile.view_profile', handle=comment.author.handle, _external=False) if comment.author.handle else None # Link to profile via handle
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
        # Sanitize the comment text using bleach, stripping all HTML tags
        sanitized_text = bleach.clean(form.text.data.strip(), tags=[], strip=True)
        new_comment = PhotoComment(
            text=sanitized_text,
            user_id=current_user.id,
            photo_id=photo.id
        )
        db.session.add(new_comment)
        # Commit the comment first to get its ID for notifications
        db.session.commit()

        # Process mentions in the comment (now using handles)
        mentioned_handles = extract_mentions(new_comment.text) # extract_mentions now looks for handles
        new_mentions_created = False
        if mentioned_handles:
            for handle_str in mentioned_handles:
                mentioned_user_obj = User.query.filter_by(handle=handle_str).first() # Query by handle
                if mentioned_user_obj: # Check if user exists
                    if mentioned_user_obj.id != current_user.id: # Don't notify for self-mentions
                        # Avoid duplicate notifications for this specific comment
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
                            current_app.logger.info(f"Mention notification created for user (handle: {mentioned_user_obj.handle}) in photo comment {new_comment.id}")

        if new_mentions_created:
            db.session.commit() # Commit any new mention notifications

        return jsonify({
            'id': new_comment.id,
            'text': new_comment.text,
            'created_at': new_comment.created_at.isoformat() + "Z",
            'author': {
                'id': current_user.id,
                'handle': current_user.handle, # Return handle
                'full_name': current_user.full_name or ('@' + current_user.handle if current_user.handle else current_user.username), # Display full_name or @handle
                'profile_photo_url': get_avatar_url(current_user),
                'profile_url': url_for('profile.view_profile', handle=current_user.handle, _external=False) if current_user.handle else None # Link via handle
            }
        }), 201
    else:
        # Collect form errors
        errors = {field: error[0] for field, error in form.errors.items()}
        return jsonify({'errors': errors}), 400
