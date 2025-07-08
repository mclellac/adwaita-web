from flask import Blueprint, jsonify, request, abort, url_for, current_app
from flask_login import current_user, login_required
from .. import db
from ..models import UserPhoto, Comment, User, Notification, Activity # Updated Comment, added Notification, Activity
from ..forms import CommentForm # Changed PhotoCommentForm to CommentForm
from ..utils import extract_mentions # For mention notifications

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
    # The relationship photo.comments on UserPhoto model now correctly points to Comment model
    # and filters by target_type='photo' and target_id=photo.id.
    # Order by Comment.created_at
    for comment in photo.comments.order_by(Comment.created_at.asc()).all():
        comments_data.append({
            'id': comment.id,
            'text': comment.text,
            'created_at': comment.created_at.isoformat() + "Z", # Add Z for UTC indication
            'author': {
                'id': comment.author.id,
                'username': comment.author.username,
                'full_name': comment.author.full_name or comment.author.username,
                'profile_photo_url': get_avatar_url(comment.author),
                'profile_url': url_for('profile.view_profile', user_id=comment.author.id, _external=False)
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

    form = CommentForm(data=request.json) # Use CommentForm

    if form.validate(): # Use validate() for JSON data if meta is not configured for CSRF
        new_comment = Comment(
            text=form.text.data.strip(),
            user_id=current_user.id,
            target_type='photo', # Set target_type
            target_id=photo.id   # Set target_id
            # parent_id can be added if photo comments support threading via API
        )
        db.session.add(new_comment)

        # Notification for new photo comment (similar to post comments)
        if photo.user != current_user: # Don't notify for self-comments
            notification = Notification(
                user_id=photo.user.id, # Notify the photo owner
                actor_id=current_user.id,
                type='new_photo_comment', # Distinct type
                related_post_id=photo.id, # Using related_post_id to store photo_id for now.
                                          # Consider adding related_photo_id to Notification model if this feels too hacky.
                                          # For now, we'll use related_post_id and understand its context via type.
                related_comment_id=new_comment.id # Will be populated after flush/commit
            )
            db.session.add(notification)
            current_app.logger.info(f"Notification created for user {photo.user.username} about new comment on photo {photo.id} by {current_user.username}.")

        # Create Activity entry for new photo comment
        activity = Activity(
            user_id=current_user.id,
            type='commented_on_photo', # Distinct type
            # target_post_id=photo.id, # Re-evaluate if target_post_id should store photo_id for activities
                                       # Or add target_photo_id to Activity model.
                                       # For now, let's assume we might add target_photo_id later or use a generic target_object_id.
                                       # To keep it simple for now, we won't set target_post_id for photo comment activities
                                       # unless we decide it's the placeholder for any "post-like" item.
                                       # Let's be explicit:
            # target_generic_id=photo.id, # (if we had a generic field)
            # target_generic_type='photo',
            # For now, let's link the comment directly
            target_comment_id=new_comment.id # Will be populated after flush/commit
        )
        db.session.add(activity)
        current_app.logger.info(f"Activity 'commented_on_photo' logged for user {current_user.username} on photo {photo.id}, comment ID pending.")

        db.session.commit()
        current_app.logger.info(f"Photo Comment (ID: {new_comment.id}) by {current_user.username} added to photo {photo.id}.")

        # Process mentions in the photo comment
        mentioned_users_in_comment = extract_mentions(new_comment.text)
        new_mentions_created = False
        for mentioned_user in mentioned_users_in_comment:
            if mentioned_user.id != current_user.id: # Don't notify for self-mentions
                existing_notif = Notification.query.filter_by(
                    user_id=mentioned_user.id,
                    actor_id=current_user.id,
                    type='mention_in_photo_comment', # New type
                    related_comment_id=new_comment.id
                ).first()
                if not existing_notif:
                    mention_notification = Notification(
                        user_id=mentioned_user.id,
                        actor_id=current_user.id,
                        type='mention_in_photo_comment',
                        # related_post_id=photo.id, # Context: photo ID
                        related_comment_id=new_comment.id
                    )
                    db.session.add(mention_notification)
                    new_mentions_created = True
                    current_app.logger.info(f"Mention notification created for user {mentioned_user.username} in photo comment {new_comment.id}")
        if new_mentions_created:
            db.session.commit()

        return jsonify({
            'id': new_comment.id,
            'text': new_comment.text,
            'created_at': new_comment.created_at.isoformat() + "Z",
            'author': {
                'id': current_user.id,
                'username': current_user.username,
                'full_name': current_user.full_name or current_user.username,
                'profile_photo_url': get_avatar_url(current_user),
                'profile_url': url_for('profile.view_profile', user_id=current_user.id, _external=False)
            }
            # Add parent_id to response if threading is supported for photo comments
            # 'parent_id': new_comment.parent_id
        }), 201
    else:
        # Collect form errors
        errors = {field: error[0] for field, error in form.errors.items()}
        return jsonify({'errors': errors}), 400

@photo_bp.route('/<int:photo_id>/like', methods=['POST'])
@login_required
def like_photo_route(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)
    # Add any specific permission checks for liking a photo if necessary
    # For example, if photos can be private. For now, assume if photo is viewable, it can be liked.

    if current_user.has_liked_photo(photo):
        # Return JSON for API consistency, or decide if this should be a redirect like post likes
        return jsonify({'status': 'info', 'message': 'You have already liked this photo.'}), 409 # Conflict

    if current_user.like_photo(photo):
        # Notification for the photo owner
        if photo.user != current_user:
            notification = Notification(
                user_id=photo.user.id,
                actor_id=current_user.id,
                type='new_photo_like', # Distinct type
                related_post_id=photo.id, # Using related_post_id to store photo_id for now
                                          # Consider related_photo_id on Notification model
                # related_comment_id=None
            )
            db.session.add(notification)
            current_app.logger.info(f"Notification created for user {photo.user.username} about new like on photo {photo.id} by {current_user.username}.")

        # Create Activity entry for new photo like
        activity = Activity(
            user_id=current_user.id,
            type='liked_photo', # Distinct type
            # target_post_id=photo.id, # Or use a generic target_object_id / target_photo_id
            # For now, we might need to decide how to store photo target in Activity.
            # Let's assume we'll add a target_photo_id to Activity or use a generic system later.
            # If using target_post_id as a generic field:
            target_post_id=photo.id, # This implies target_post_id is generic for "likeable item id"
            # Or, create a new target_photo_id field on Activity model.
            # For now, will use target_post_id to mean "target_item_id_for_like_or_comment_activity"
        )
        db.session.add(activity)
        current_app.logger.info(f"Activity 'liked_photo' logged for user {current_user.username} on photo {photo.id}.")

        db.session.commit()
        # Return JSON for API consistency
        return jsonify({'status': 'success', 'message': 'Photo liked!', 'likes_count': photo.likers.count()}), 200
    else:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': 'Could not like photo.'}), 500

@photo_bp.route('/<int:photo_id>/unlike', methods=['POST'])
@login_required
def unlike_photo_route(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)

    if not current_user.has_liked_photo(photo):
        return jsonify({'status': 'info', 'message': 'You have not liked this photo yet.'}), 409

    if current_user.unlike_photo(photo):
        # Potentially remove 'liked_photo' activity if strictness is required,
        # but typically un-actions don't remove the original action from feeds.
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Photo unliked.', 'likes_count': photo.likers.count()}), 200
    else:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': 'Could not unlike photo.'}), 500

# Need to register this blueprint in app-demo/__init__.py's create_app()
# Example:
# from .routes.photo_routes import photo_bp
# app.register_blueprint(photo_bp)

@photo_bp.route('/api/photo/<int:photo_id>/like_status', methods=['GET'])
def get_photo_like_status(photo_id):
    photo = UserPhoto.query.get_or_404(photo_id)

    # Basic permission check (similar to get_photo_comments)
    if not photo.user.is_profile_public and \
       (not current_user.is_authenticated or current_user.id != photo.user_id):
        # Could be refined based on gallery privacy rules
        abort(403)

    likes_count = photo.likers.count()
    has_liked = False
    if current_user.is_authenticated:
        has_liked = current_user.has_liked_photo(photo)

    return jsonify({
        'likes_count': likes_count,
        'has_liked': has_liked
    })
