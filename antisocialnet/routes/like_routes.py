from flask import Blueprint, redirect, request, flash, current_app, abort, url_for
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
        flash('Invalid request or session expired. Could not like item.', 'danger')
        return redirect(request.referrer or url_for('general.index'))

    # Validate target_type
    if target_type not in ['post', 'comment', 'photo']:
        current_app.logger.warning(f"User {current_user.username} attempt to like invalid target_type: {target_type}")
        abort(404)

    # Fetch the target item
    target_item = None
    item_author = None

    if target_type == 'post':
        target_item = db.session.get(Post, target_id)
        if target_item:
            if not target_item.is_published and target_item.user_id != current_user.id:
                current_app.logger.warning(f"User {current_user.username} attempt to like non-published post {target_id} they don't own.")
                abort(404) # Or 403
            item_author = target_item.author
    elif target_type == 'comment':
        target_item = db.session.get(Comment, target_id)
        if target_item:
            # Potentially add checks here, e.g., if the comment's post is accessible
            item_author = target_item.author
    elif target_type == 'photo':
        target_item = db.session.get(UserPhoto, target_id)
        if target_item:
            # Potentially add checks here, e.g., if the photo's gallery/profile is public
            item_author = target_item.user # UserPhoto.user is the author

    if not target_item:
        current_app.logger.warning(f"User {current_user.username} attempt to like non-existent {target_type} with id {target_id}")
        abort(404)

    if current_user.has_liked_item(target_type, target_id):
        flash('You have already liked this item.', 'info')
    else:
        try:
            if current_user.like_item(target_type, target_id):
                # Create notification for the item's author, if not self-like and author exists
                if item_author and item_author != current_user:
                    notification = Notification(
                        user_id=item_author.id,
                        actor_id=current_user.id,
                        type='new_like', # Generic type, could be 'new_post_like', 'new_comment_like' if needed
                        target_type=target_type,
                        target_id=target_id
                    )
                    db.session.add(notification)
                    current_app.logger.info(f"Notification created for user {item_author.username} about new like on {target_type} {target_id} by {current_user.username}.")

                # Create Activity entry for new like
                activity = Activity(
                    user_id=current_user.id, # The user who liked the item
                    type='liked_item', # Generic type, could be 'liked_post_item', etc.
                    target_type=target_type,
                    target_id=target_id
                )
                db.session.add(activity)
                current_app.logger.info(f"Activity 'liked_item' logged for user {current_user.username} on {target_type} {target_id}.")

                db.session.commit()
                flash(f"{target_type.capitalize()} liked!", 'toast_success')
                current_app.logger.info(f"User {current_user.username} liked {target_type} {target_id}.")
            else:
                # This branch might be redundant if like_item always returns True or raises
                flash(f'Could not like {target_type}. An unexpected error occurred.', 'danger')
                db.session.rollback()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during like operation for {target_type} {target_id} by user {current_user.username}: {e}", exc_info=True)
            flash(f'An error occurred while trying to like the {target_type}. Please try again.', 'danger')

    return redirect(request.referrer or url_for('general.index'))

@like_bp.route('/unlike/<string:target_type>/<int:target_id>', methods=['POST'])
@login_required
def unlike_item_route(target_type, target_id):
    form = UnlikeForm() # For CSRF validation
    if not form.validate_on_submit():
        flash('Invalid request or session expired. Could not unlike item.', 'danger')
        return redirect(request.referrer or url_for('general.index'))

    # Validate target_type
    if target_type not in ['post', 'comment', 'photo']:
        current_app.logger.warning(f"User {current_user.username} attempt to unlike invalid target_type: {target_type}")
        abort(404)

    # Fetch the target item to ensure it exists, though not strictly needed for unlike by ID
    target_item = None
    if target_type == 'post':
        target_item = db.session.get(Post, target_id)
    elif target_type == 'comment':
        target_item = db.session.get(Comment, target_id)
    elif target_type == 'photo':
        target_item = db.session.get(UserPhoto, target_id)

    if not target_item: # Check if item existed, even if we only need type/id for the Like record
        current_app.logger.warning(f"User {current_user.username} attempt to unlike non-existent {target_type} with id {target_id} (or it was deleted).")
        # Depending on desired behavior, could proceed to try unliking anyway,
        # or abort(404) if item must exist to be unliked.
        # For robustness, let's allow unliking even if the item was deleted,
        # as the Like record might still exist.

    if not current_user.has_liked_item(target_type, target_id):
        flash('You have not liked this item yet.', 'info')
    else:
        try:
            if current_user.unlike_item(target_type, target_id):
                # Optionally: Delete associated 'liked_item' activity.
                # For now, we'll leave the original "liked_item" activity as a historical record.
                # If cleanup is desired:
                # Activity.query.filter_by(
                #     user_id=current_user.id,
                #     type='liked_item',
                #     target_type=target_type,
                #     target_id=target_id
                # ).delete()

                db.session.commit()
                flash(f'{target_type.capitalize()} unliked.', 'toast_success')
                current_app.logger.info(f"User {current_user.username} unliked {target_type} {target_id}.")
            else:
                flash(f'Could not unlike {target_type}. An unexpected error occurred.', 'danger')
                db.session.rollback()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during unlike operation for {target_type} {target_id} by user {current_user.username}: {e}", exc_info=True)
            flash(f'An error occurred while trying to unlike the {target_type}. Please try again.', 'danger')

    return redirect(request.referrer or url_for('general.index'))
