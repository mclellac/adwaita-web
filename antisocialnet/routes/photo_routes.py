from flask import Blueprint, jsonify, request, abort, url_for, current_app, render_template # Added render_template
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

    comment_form = PhotoCommentForm() if current_user.is_authenticated else None
    # Likes and other details can be accessed directly from photo object in template
    return render_template('photo_detail.html', photo=photo, comment_form=comment_form)


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

    # Ensure request.json is not None before attempting to spread it
    json_data = request.json if request.is_json else {}
    form = PhotoCommentForm(formdata=None, **json_data)

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
        from sqlalchemy import func # For func.lower

        # Process mentions in the comment (using full_name)
        mentioned_full_names = extract_mentions(new_comment.text) # extract_mentions now gets full names
        new_mentions_created = False
        if mentioned_full_names:
            for name_str in mentioned_full_names:
                # Case-insensitive query for full_name. Only notify if unique user found.
                mentioned_users = User.query.filter(func.lower(User.full_name) == func.lower(name_str)).all()
                if len(mentioned_users) == 1:
                    mentioned_user_obj = mentioned_users[0]
                    if mentioned_user_obj.id != current_user.id: # Don't notify for self-mentions
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
            db.session.commit() # Commit any new mention notifications

        return jsonify({
            'id': new_comment.id,
            'text': new_comment.text,
            'created_at': new_comment.created_at.isoformat() + "Z",
            'author': {
                'id': current_user.id,
                # 'username' (email) removed
                'full_name': current_user.full_name or ('User ' + str(current_user.id)),
                'profile_photo_url': get_avatar_url(current_user),
                'profile_url': url_for('profile.view_profile', user_id=current_user.id, _external=False) # Use user_id
            }
        }), 201
    else:
        # Collect form errors
        errors = {field: error[0] for field, error in form.errors.items()}
        return jsonify({'errors': errors}), 400
