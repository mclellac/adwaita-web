from flask import Blueprint, request, jsonify, current_app, abort
from flask_login import current_user, login_required
from datetime import datetime, timezone
import functools
from sqlalchemy.orm import joinedload

from antisocialnet.models import User, CommentFlag, SiteSetting, Comment, create_notification
from antisocialnet.forms import SiteSettingsForm
from antisocialnet import db
from antisocialnet.api_utils import serialize_comment_flag, serialize_user_profile

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')

def admin_required(f):
    @functools.wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/flags', methods=['GET'])
@admin_required
def view_flags():
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ADMIN_FLAGS_PER_PAGE', 15)
    flags_query = CommentFlag.query.filter_by(is_resolved=False)\
                                   .options(joinedload(CommentFlag.comment).joinedload(Comment.author),
                                            joinedload(CommentFlag.flagger))\
                                   .order_by(CommentFlag.created_at.desc())
    flag_pagination = flags_query.paginate(page=page, per_page=per_page, error_out=False)
    active_flags = [serialize_comment_flag(flag) for flag in flag_pagination.items]
    return jsonify(flags=active_flags, pagination={
        'page': flag_pagination.page,
        'per_page': flag_pagination.per_page,
        'total_items': flag_pagination.total,
        'total_pages': flag_pagination.pages
    })

@admin_bp.route('/flags/<int:flag_id>/resolve', methods=['POST'])
@admin_required
def resolve_flag(flag_id):
    flag = db.session.get(CommentFlag, flag_id)
    if flag is None:
        abort(404)
    if flag.is_resolved:
        return jsonify(status='error', message='This flag has already been resolved.'), 400

    flag.is_resolved = True
    flag.resolved_at = datetime.now(timezone.utc)
    flag.resolver_user_id = current_user.id
    db.session.commit()
    return jsonify(status='success', message='Flag marked as resolved.')

@admin_bp.route('/site-settings', methods=['GET', 'POST'])
@admin_required
def site_settings():
    if request.method == 'GET':
        settings = {
            'site_title': SiteSetting.get('site_title', 'Adwaita Social Demo'),
            'posts_per_page': SiteSetting.get('posts_per_page', current_app.config.get('POSTS_PER_PAGE', 10)),
            'allow_registrations': SiteSetting.get('allow_registrations', False)
        }
        return jsonify(settings)

    form = SiteSettingsForm(data=request.get_json())
    if form.validate():
        SiteSetting.set('site_title', form.site_title.data, 'string')
        SiteSetting.set('posts_per_page', form.posts_per_page.data, 'int')
        SiteSetting.set('allow_registrations', form.allow_registrations.data, 'bool')
        db.session.commit()
        # Notify users
        for user in User.query.all():
            create_notification(user_id=user.id, actor_id=current_user.id, type='site_setting_changed')
        return jsonify(status='success', message='Site settings updated successfully.')
    return jsonify(errors=form.errors), 400

@admin_bp.route('/pending-users', methods=['GET'])
@admin_required
def pending_users():
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ADMIN_USERS_PER_PAGE', 15)
    users_query = User.query.filter_by(is_approved=False, is_active=False).order_by(User.id.asc())
    user_pagination = users_query.paginate(page=page, per_page=per_page, error_out=False)
    pending_users = [serialize_user_profile(user) for user in user_pagination.items]
    return jsonify(users=pending_users, pagination={
        'page': user_pagination.page,
        'per_page': user_pagination.per_page,
        'total_items': user_pagination.total,
        'total_pages': user_pagination.pages
    })

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@admin_required
def approve_user(user_id):
    user_to_approve = db.session.get(User, user_id)
    if user_to_approve is None:
        abort(404)
    if user_to_approve.is_approved and user_to_approve.is_active:
        return jsonify(status='error', message='User is already approved.'), 400

    user_to_approve.is_approved = True
    user_to_approve.is_active = True
    db.session.commit()
    # Notify users
    for user in User.query.all():
        create_notification(user_id=user.id, actor_id=current_user.id, type='user_approved', target_type='user', target_id=user_to_approve.id)
    return jsonify(status='success', message=f'User {user_to_approve.username} approved successfully.')

@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@admin_required
def reject_user(user_id):
    user_to_reject = db.session.get(User, user_id)
    if user_to_reject is None:
        abort(404)
    if user_to_reject.is_approved or user_to_reject.is_active:
        return jsonify(status='error', message='User is already active or approved and cannot be rejected.'), 400
    if user_to_reject.is_admin:
        return jsonify(status='error', message='Cannot reject an administrator account.'), 400

    db.session.delete(user_to_reject)
    db.session.commit()
    return jsonify(status='success', message=f'User {user_to_reject.username} rejected and deleted.')
