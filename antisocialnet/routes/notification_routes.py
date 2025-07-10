from flask import Blueprint, render_template, current_app, flash, redirect, url_for, request
from flask_login import current_user, login_required
from ..models import Notification, User, Post # Assuming models are in models.py
from .. import db # Assuming db is initialized in __init__.py

notification_bp = Blueprint('notification', __name__, url_prefix='/notifications')

@notification_bp.route('/')
@login_required
def list_notifications():
    current_app.logger.info(f"User {current_user.username} accessing notifications page.")
    page = request.args.get('page', 1, type=int)
    # Consider a specific config for NOTIFICATIONS_PER_PAGE or use an existing one
    per_page = current_app.config.get('POSTS_PER_PAGE', 20)

    try:
        # Fetch notifications for the current user, newest first
        notifications_query = Notification.query.filter_by(user_id=current_user.id)\
                                            .order_by(Notification.timestamp.desc())

        pagination = notifications_query.paginate(page=page, per_page=per_page, error_out=False)
        notifications_list = pagination.items

        # Mark displayed notifications as read (simple version)
        # For a more robust solution, consider only marking unread ones or using a separate "mark as read" route.
        # This approach marks all currently displayed notifications as read.
        ids_to_mark_read = [n.id for n in notifications_list if not n.is_read]
        if ids_to_mark_read:
            Notification.query.filter(Notification.id.in_(ids_to_mark_read))\
                              .update({'is_read': True}, synchronize_session=False)
            db.session.commit()
            current_app.logger.info(f"Marked {len(ids_to_mark_read)} notifications as read for user {current_user.username}.")
            # Note: The unread_notifications_count in base.html might not update on this same page load
            # without a redirect or AJAX, as it's calculated before this route logic runs fully for the render.
            # A redirect(url_for('notification.list_notifications', page=page)) could fix this, but might be too much.
            # For now, count will update on next page load/navigation.

        current_app.logger.debug(f"Found {len(notifications_list)} notifications for {current_user.username} on page {page}. Total: {pagination.total}")
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications for {current_user.username}: {e}", exc_info=True)
        flash("Error loading notifications.", "danger")
        notifications_list, pagination = [], None

    return render_template('notifications.html', notifications_list=notifications_list, pagination=pagination)

# Future: Route to mark a single notification as read or all as read
# @notification_bp.route('/mark_read/<int:notification_id>', methods=['POST'])
# @login_required
# def mark_as_read(notification_id):
#     pass

# @notification_bp.route('/mark_all_read', methods=['POST'])
# @login_required
# def mark_all_as_read():
#     pass
