from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
from datetime import datetime, timezone
import functools # For wraps in admin_required decorator

# Corrected imports:
from antisocialnet.models import User, CommentFlag, SiteSetting, Comment
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
            current_app.logger.warning(f"Non-admin User ID: {current_user.id} (Handle: {current_user.handle}) attempted to access admin route {request.path}.")
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/flags', methods=['GET'])
@admin_required
def view_flags():
    current_app.logger.debug(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) accessing /admin/flags")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ADMIN_FLAGS_PER_PAGE', 15)

    flags_query = CommentFlag.query.filter_by(is_resolved=False)\
                                   .order_by(CommentFlag.created_at.desc())
    flag_pagination = flags_query.paginate(page=page, per_page=per_page, error_out=False)
    active_flags_raw = flag_pagination.items

    active_flags_with_forms = []
    for flag in active_flags_raw:
        delete_form = DeleteCommentForm(prefix=f"del-comm-flag-{flag.comment_id}-")
        flag.delete_comment_form = delete_form
        active_flags_with_forms.append(flag)

    current_app.logger.info(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) viewing flagged comments page {page}. Found {len(active_flags_with_forms)} active flags.")
    return render_template('admin_flags.html', active_flags=active_flags_with_forms, flag_pagination=flag_pagination)

@admin_bp.route('/flag/<int:flag_id>/resolve', methods=['POST'])
@admin_required
def resolve_flag(flag_id):
    current_app.logger.debug(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) attempting to resolve flag ID {flag_id}")
    flag = CommentFlag.query.get_or_404(flag_id)
    if flag.is_resolved:
        flash('This flag has already been resolved.', 'info')
        return redirect(url_for('admin.view_flags'))

    try:
        flag.is_resolved = True
        flag.resolved_at = datetime.now(timezone.utc)
        flag.resolver_user_id = current_user.id
        db.session.add(flag)
        db.session.commit()
        current_app.logger.info(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) resolved flag ID {flag_id} for comment ID {flag.comment_id}.")
        flash(f'Flag for comment "{flag.comment.text[:30]}..." resolved.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resolving flag {flag_id} by Admin User ID: {current_user.id} (Handle: {current_user.handle}): {e}", exc_info=True)
        flash('Error resolving flag.', 'danger')
    return redirect(url_for('admin.view_flags'))

@admin_bp.route('/site-settings', methods=['GET', 'POST'])
@admin_required
def site_settings():
    current_app.logger.debug(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) accessing /admin/site-settings, Method: {request.method}")
    form = SiteSettingsForm(request.form)

    if form.validate_on_submit():
        current_app.logger.info(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) updating site settings.")
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
                flash("Invalid value for Posts Per Page. Must be an integer.", "danger")
            SiteSetting.set('allow_registrations', form.allow_registrations.data, 'bool')
            flash('Site settings updated successfully!', 'toast_success')
            current_app.logger.info(f"Site settings updated by Admin User ID: {current_user.id} (Handle: {current_user.handle}).")
            return redirect(url_for('admin.site_settings'))
        except Exception as e:
            current_app.logger.error(f"Error updating site settings by Admin User ID: {current_user.id} (Handle: {current_user.handle}): {e}", exc_info=True)
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
    current_app.logger.debug(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) accessing /admin/pending_users")
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('ADMIN_USERS_PER_PAGE', 15)
    users_query = User.query.filter_by(is_approved=False, is_active=False)\
                            .order_by(User.id.asc())
    user_pagination = users_query.paginate(page=page, per_page=per_page, error_out=False)
    pending_users_list = user_pagination.items
    current_app.logger.info(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) viewing pending users page {page}. Found {len(pending_users_list)} pending users.")
    return render_template('admin_pending_users.html', pending_users=pending_users_list, user_pagination=user_pagination)

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@admin_required
def approve_user(user_id):
    current_app.logger.debug(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) attempting to approve user ID {user_id}")
    user_to_approve = User.query.get_or_404(user_id)
    display_name_approve = user_to_approve.full_name or (('@' + user_to_approve.handle) if user_to_approve.handle else user_to_approve.username)
    if user_to_approve.is_approved and user_to_approve.is_active:
        flash(f'User {display_name_approve} is already approved and active.', 'info')
        return redirect(url_for('admin.pending_users'))
    try:
        user_to_approve.is_approved = True
        user_to_approve.is_active = True
        db.session.add(user_to_approve)
        db.session.commit()
        current_app.logger.info(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) approved User ID: {user_id} (Approved User Handle: {user_to_approve.handle}, Email: {user_to_approve.username}).")
        flash(f'User {display_name_approve} has been approved and activated.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving User ID: {user_id} by Admin User ID: {current_user.id} (Handle: {current_user.handle}): {e}", exc_info=True)
        flash('Error approving user.', 'danger')
    return redirect(url_for('admin.pending_users'))

@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@admin_required
def reject_user(user_id):
    current_app.logger.debug(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) attempting to reject user ID {user_id}")
    user_to_reject = User.query.get_or_404(user_id)
    display_name_reject = user_to_reject.full_name or (('@' + user_to_reject.handle) if user_to_reject.handle else user_to_reject.username)
    original_username_for_log = user_to_reject.username # Email, for logging before deletion
    original_handle_for_log = user_to_reject.handle # Handle, for logging

    if user_to_reject.is_approved or user_to_reject.is_active:
        flash(f'User {display_name_reject} is already active or approved and cannot be rejected from this interface.', 'warning')
        return redirect(url_for('admin.pending_users'))
    if user_to_reject.is_admin:
        flash('Cannot reject an administrator account through this interface.', 'danger')
        return redirect(url_for('admin.pending_users'))
    try:
        db.session.delete(user_to_reject)
        db.session.commit()
        current_app.logger.info(f"Admin User ID: {current_user.id} (Handle: {current_user.handle}) rejected and deleted User ID: {user_id} (Rejected User Handle: {original_handle_for_log}, Email: {original_username_for_log}).")
        flash(f'User {display_name_reject} has been rejected and deleted.', 'toast_success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting User ID: {user_id} by Admin User ID: {current_user.id} (Handle: {current_user.handle}): {e}", exc_info=True)
        flash('Error rejecting user.', 'danger')
    return redirect(url_for('admin.pending_users'))
