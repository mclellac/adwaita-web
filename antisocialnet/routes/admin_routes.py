from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
from datetime import datetime, timezone
import functools # For wraps in admin_required decorator

from sqlalchemy.orm import joinedload # Added for eager loading
# Corrected imports:
from antisocialnet.models import User, CommentFlag, SiteSetting, Comment, create_notification
from antisocialnet.forms import SiteSettingsForm, DeleteCommentForm
from antisocialnet import db
from antisocialnet.utils import flash_form_errors_util

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    """Decorator to ensure user is an admin."""
    @functools.wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            current_app.logger.warning(f"Non-admin user {current_user.username} attempted to access admin route {request.path}.")
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/flags', methods=['GET'])
@admin_required
def view_flags():
    current_app.logger.debug(f"Admin {current_user.username} accessing /admin/flags")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ADMIN_FLAGS_PER_PAGE', 15)

    flags_query = CommentFlag.query.filter_by(is_resolved=False)\
                                   .options(
                                       joinedload(CommentFlag.comment).joinedload(Comment.author),
                                       joinedload(CommentFlag.flagger)
                                   )\
                                   .order_by(CommentFlag.created_at.desc())
    flag_pagination = flags_query.paginate(page=page, per_page=per_page, error_out=False)
    active_flags_raw = flag_pagination.items

    active_flags_with_forms = []
    for flag in active_flags_raw:
        delete_form = DeleteCommentForm(prefix=f"del-comm-flag-{flag.comment_id}-")
        flag.delete_comment_form = delete_form
        active_flags_with_forms.append(flag)

    current_app.logger.info(f"Admin {current_user.username} viewing flagged comments page {page}. Found {len(active_flags_with_forms)} active flags.")
    return render_template('admin_flags.html', active_flags=active_flags_with_forms, flag_pagination=flag_pagination)

@admin_bp.route('/flag/<int:flag_id>/resolve', methods=['POST'])
@admin_required
def resolve_flag(flag_id):
    current_app.logger.debug(f"Admin {current_user.username} attempting to resolve flag ID {flag_id}")
    flag = db.session.get(CommentFlag, flag_id)
    if flag is None:
        abort(404)
    if flag.is_resolved:
        flash('This flag has already been resolved.', 'info')
        return redirect(url_for('admin.view_flags'))

    try:
        flag.is_resolved = True
        flag.resolved_at = datetime.now(timezone.utc)
        flag.resolver_user_id = current_user.id
        db.session.add(flag)
        db.session.commit()
        current_app.logger.info(f"Admin {current_user.username} resolved flag ID {flag_id} for comment ID {flag.comment_id}.")
        flash('Flag marked as resolved.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resolving flag {flag_id} by admin {current_user.username}: {e}", exc_info=True)
        flash('Error resolving flag.', 'danger')
    return redirect(url_for('admin.view_flags'))

@admin_bp.route('/site-settings', methods=['GET', 'POST'])
@admin_required
def site_settings():
    current_app.logger.debug(f"Admin {current_user.username} accessing /admin/site-settings, Method: {request.method}")
    form = SiteSettingsForm(request.form)

    if form.validate_on_submit():
        current_app.logger.info(f"Admin {current_user.username} updating site settings.")
        try:
            SiteSetting.set('site_title', form.site_title.data, 'string')
            try:
                ppp_val = int(form.posts_per_page.data)
                if ppp_val <= 0:
                    flash("Posts Per Page must be a positive integer.", "danger")
                else:
                    SiteSetting.set('posts_per_page', ppp_val, 'int')
                    current_app.config['POSTS_PER_PAGE'] = ppp_val
                    current_app.logger.info(f"App config POSTS_PER_PAGE updated to: {ppp_val}")
            except ValueError:
                flash("Posts per page must be a number.", "danger")
            SiteSetting.set('allow_registrations', form.allow_registrations.data, 'bool')
            current_app.config.update(
                POSTS_PER_PAGE=SiteSetting.get('posts_per_page', 10),
                SITE_TITLE=SiteSetting.get('site_title', 'Adwaita Social Demo')
            )
            # Notify all users of the site settings change
            for user in User.query.all():
                create_notification(
                    user_id=user.id,
                    actor_id=current_user.id,
                    type='site_setting_changed'
                )
            flash('Site settings updated successfully.', 'toast_success')
            current_app.logger.info(f"Site settings updated by admin {current_user.username}.")
            return redirect(url_for('admin.site_settings'))
        except Exception as e:
            current_app.logger.error(f"Error updating site settings: {e}", exc_info=True)
            flash('An unexpected error occurred while saving settings.', 'danger')
    elif request.method == 'POST':
        flash_form_errors_util(form)

    if request.method == 'GET':
        form.site_title.data = SiteSetting.get('site_title', 'Adwaita Social Demo')
        form.posts_per_page.data = str(SiteSetting.get('posts_per_page', current_app.config.get('POSTS_PER_PAGE', 10)))
        form.allow_registrations.data = SiteSetting.get('allow_registrations', False)

    return render_template('admin_site_settings.html', form=form)

@admin_bp.route('/pending_users', methods=['GET'])
@admin_required
def pending_users():
    current_app.logger.debug(f"Admin {current_user.username} accessing /admin/pending_users")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ADMIN_USERS_PER_PAGE', 15)
    users_query = User.query.filter_by(is_approved=False, is_active=False)\
                            .order_by(User.id.asc())
    # Log the count *before* pagination
    current_app.logger.debug(f"Total pending users found by query: {users_query.count()}")
    user_pagination = users_query.paginate(page=page, per_page=per_page, error_out=False)
    pending_users_list = user_pagination.items
    # Notify admins of pending users
    for admin in User.query.filter_by(is_admin=True).all():
        for user in pending_users_list:
            create_notification(
                user_id=admin.id,
                type='pending_user_approval',
                target_type='user',
                target_id=user.id
            )
    current_app.logger.info(f"Admin {current_user.username} viewing pending users page {page}. Found {len(pending_users_list)} pending users on this page. Per_page setting: {per_page}. Total items by paginator: {user_pagination.total}")
    return render_template('admin_pending_users.html', pending_users=pending_users_list, user_pagination=user_pagination)

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@admin_required
def approve_user(user_id):
    current_app.logger.debug(f"Admin {current_user.username} attempting to approve user ID {user_id}")
    user_to_approve = db.session.get(User, user_id)
    if user_to_approve is None:
        abort(404)
    if user_to_approve.is_approved and user_to_approve.is_active:
        flash('User is already approved.', 'info')
        return redirect(url_for('admin.pending_users'))
    try:
        user_to_approve.is_approved = True
        user_to_approve.is_active = True
        db.session.add(user_to_approve)
        db.session.commit()
        # Notify all users of the new user
        for user in User.query.all():
            create_notification(
                user_id=user.id,
                actor_id=current_user.id,
                type='user_approved',
                target_type='user',
                target_id=user_to_approve.id
            )
        current_app.logger.info(f"Admin {current_user.username} approved user ID {user_id} ({user_to_approve.username}).")
        flash(f'User {user_to_approve.username} approved successfully.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving user {user_id} by admin {current_user.username}: {e}", exc_info=True)
        flash('Error approving user.', 'danger')
    return redirect(url_for('admin.pending_users'))

@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@admin_required
def reject_user(user_id):
    current_app.logger.debug(f"Admin {current_user.username} attempting to reject user ID {user_id}")
    user_to_reject = db.session.get(User, user_id)
    if user_to_reject is None:
        abort(404)
    if user_to_reject.is_approved or user_to_reject.is_active:
        flash(f'User {user_to_reject.username} is already active or approved and cannot be rejected from this interface.', 'warning')
        return redirect(url_for('admin.pending_users'))
    if user_to_reject.is_admin:
        flash('Cannot reject an administrator account through this interface.', 'danger')
        return redirect(url_for('admin.pending_users'))
    try:
        username_rejected = user_to_reject.username
        db.session.delete(user_to_reject)
        db.session.commit()
        current_app.logger.info(f"Admin {current_user.username} rejected and deleted user ID {user_id} (Username: {username_rejected}).")
        flash(f'User {username_rejected} rejected and deleted.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting user {user_id} by admin {current_user.username}: {e}", exc_info=True)
        flash('Error rejecting user.', 'danger')
    return redirect(url_for('admin.pending_users'))
