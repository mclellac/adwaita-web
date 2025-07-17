from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload
from ..models import Notification
from .. import db
from ..api_utils import serialize_notification

notification_bp = Blueprint('notification', __name__, url_prefix='/api/v1/notifications')

@notification_bp.route('/', methods=['GET'])
@login_required
def list_notifications():
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 20)
    notifications_query = Notification.query.filter_by(user_id=current_user.id)\
                                            .options(joinedload(Notification.actor))\
                                            .order_by(Notification.timestamp.desc())
    pagination = notifications_query.paginate(page=page, per_page=per_page, error_out=False)
    notifications_list = [serialize_notification(n) for n in pagination.items]

    ids_to_mark_read = [n['id'] for n in notifications_list if not n['is_read']]
    if ids_to_mark_read:
        Notification.query.filter(Notification.id.in_(ids_to_mark_read))\
                          .update({'is_read': True}, synchronize_session='fetch')
        db.session.commit()

    return jsonify(notifications=notifications_list, pagination={
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total_items': pagination.total,
        'total_pages': pagination.pages
    })

@notification_bp.route('/<int:notification_id>/mark-read', methods=['POST'])
@login_required
def mark_as_read(notification_id):
    notification = Notification.query.filter_by(id=notification_id, user_id=current_user.id).first_or_404()
    if not notification.is_read:
        notification.is_read = True
        db.session.commit()
    return jsonify(status='success', message='Notification marked as read.')

@notification_bp.route('/mark-all-read', methods=['POST'])
@login_required
def mark_all_as_read():
    updated_count = Notification.query.filter_by(user_id=current_user.id, is_read=False)\
                                      .update({'is_read': True}, synchronize_session='fetch')
    db.session.commit()
    return jsonify(status='success', message=f'{updated_count} notification(s) marked as read.')
