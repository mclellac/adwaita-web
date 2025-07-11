from flask import Blueprint, render_template, current_app, flash, redirect, url_for, request
from flask_login import current_user, login_required
from ..models import Notification # Only Notification model is directly used here for queries/updates
from .. import db
from flask_wtf import FlaskForm # For CSRF protection on POST routes

notification_bp = Blueprint('notification', __name__, url_prefix='/notifications')

@notification_bp.route('/')
@login_required
def list_notifications():
    current_app.logger.info(f"User {current_user.username} accessing notifications page.")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 20)

    try:
        notifications_query = Notification.query.filter_by(user_id=current_user.id)\
                                            .order_by(Notification.timestamp.desc())
        pagination = notifications_query.paginate(page=page, per_page=per_page, error_out=False)
        notifications_list = pagination.items

        ids_to_mark_read = [n.id for n in notifications_list if not n.is_read]
        if ids_to_mark_read:
            Notification.query.filter(Notification.id.in_(ids_to_mark_read))\
                              .update({'is_read': True}, synchronize_session='fetch')
            db.session.commit()
            current_app.logger.info(f"Marked {len(ids_to_mark_read)} notifications as read for user {current_user.username}.")
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications for {current_user.username}: {e}", exc_info=True)
        flash("Error loading notifications.", "danger")
        notifications_list, pagination = [], None

    return render_template('notifications.html', notifications_list=notifications_list, pagination=pagination)

@notification_bp.route('/mark_read/<int:notification_id>', methods=['POST'])
@login_required
def mark_as_read(notification_id):
    form = FlaskForm()
    if form.validate_on_submit():
        notification = Notification.query.filter_by(id=notification_id, user_id=current_user.id).first_or_404()
        if not notification.is_read:
            notification.is_read = True
            db.session.commit()
            flash("Notification marked as read.", "toast_success")
        else:
            flash("Notification already marked as read.", "info")
    else:
        current_app.logger.warning(f"CSRF validation failed or other form error for mark_as_read by user {current_user.id}. Errors: {form.errors}")
        flash("Invalid request or session expired. Could not mark notification as read.", "danger")
    return redirect(request.referrer or url_for('notification.list_notifications'))

@notification_bp.route('/mark_all_read', methods=['POST'])
@login_required
def mark_all_as_read():
    form = FlaskForm()
    if form.validate_on_submit():
        updated_count = Notification.query.filter_by(user_id=current_user.id, is_read=False)\
                                      .update({'is_read': True}, synchronize_session='fetch')
        db.session.commit()
        if updated_count > 0:
            flash(f"{updated_count} notification(s) marked as read.", "toast_success")
        else:
            flash("No unread notifications to mark.", "info")
    else:
        current_app.logger.warning(f"CSRF validation failed or other form error for mark_all_as_read by user {current_user.id}. Errors: {form.errors}")
        flash("Invalid request or session expired. Could not mark all notifications as read.", "danger")
    return redirect(url_for('notification.list_notifications'))
