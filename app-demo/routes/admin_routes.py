from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
from datetime import datetime, timezone
import functools # For wraps in admin_required decorator

from ..models import User, CommentFlag, SiteSetting, Comment # Import Comment for flag context, User for moderation
from ..forms import SiteSettingsForm # Delete forms are simple, can be inline or reused from post_forms
from .. import db
from ..utils import flash_form_errors_util

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    """Decorator to ensure user is an admin."""
    @functools.wraps(f)
    @login_required # Depends on flask_login's login_required
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
                                   .order_by(CommentFlag.created_at.desc())
    flag_pagination = flags_query.paginate(page=page, per_page=per_page, error_out=False)
    active_flags = flag_pagination.items

    current_app.logger.info(f"Admin {current_user.username} viewing flagged comments page {page}. Found {len(active_flags)} active flags.")
    return render_template('admin_flags.html', active_flags=active_flags, flag_pagination=flag_pagination)

@admin_bp.route('/flag/<int:flag_id>/resolve', methods=['POST'])
@admin_required
def resolve_flag(flag_id):
    current_app.logger.debug(f"Admin {current_user.username} attempting to resolve flag ID {flag_id}")
    # Assuming a simple POST request is enough, no separate form needed for just resolving.
    # If a form was used (e.g. ResolveFlagForm().validate_on_submit()), it would handle CSRF.
    # For simple POST links, ensure CSRF protection is active globally or use a minimal form.
    # For now, relying on global CSRF if enabled, or this might be vulnerable if not.
    # A quick form can be added: `form = FlaskForm(); if form.validate_on_submit(): ...`
    # For user approval/rejection, we will use simple POST links with CSRF tokens via forms if necessary,
    # or ensure global CSRF protection is robust.

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
        current_app.logger.info(f"Admin {current_user.username} resolved flag ID {flag_id} for comment ID {flag.comment_id}.")
        flash(f'Flag for comment "{flag.comment.text[:30]}..." resolved.', 'success')
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
                    current_app.config['POSTS_PER_PAGE'] = ppp_val # Update live config
                    current_app.logger.info(f"App config POSTS_PER_PAGE updated to: {ppp_val}")
            except ValueError:
                flash("Invalid value for Posts Per Page. Must be an integer.", "danger")

            SiteSetting.set('allow_registrations', form.allow_registrations.data, 'bool')
            # No need to commit SiteSetting.set here if it commits itself.
            # db.session.commit() # If SiteSetting.set doesn't commit. Original did.

            flash('Site settings updated successfully!', 'success')
            current_app.logger.info(f"Site settings updated by admin {current_user.username}.")
            return redirect(url_for('admin.site_settings')) # Redirect to refresh page with new settings
        except Exception as e:
            # db.session.rollback() # Only if SiteSetting.set doesn't commit itself
            current_app.logger.error(f"Error updating site settings: {e}", exc_info=True)
            flash('An error occurred while saving settings.', 'danger')
    elif request.method == 'POST': # Catches validation failures
        flash_form_errors_util(form)

    # Populate form for GET request or if validation failed on POST
    if request.method == 'GET':
        form.site_title.data = SiteSetting.get('site_title', 'Adwaita Social Demo') # Updated default
        form.posts_per_page.data = str(SiteSetting.get('posts_per_page', current_app.config.get('POSTS_PER_PAGE', 10)))
        form.allow_registrations.data = SiteSetting.get('allow_registrations', False)

    return render_template('admin_site_settings.html', form=form)

# Note: Admin deletion of comments is handled via the main comment deletion route
# by checking `current_user.is_admin`. No separate route needed here unless
# different behavior/UI is desired for admin deletion.

@admin_bp.route('/pending_users', methods=['GET'])
@admin_required
def pending_users():
    current_app.logger.debug(f"Admin {current_user.username} accessing /admin/pending_users")
    page = request.args.get('page', 1, type=int)
    # Using a generic per_page, can be made configurable like ADMIN_FLAGS_PER_PAGE
    per_page = current_app.config.get('ADMIN_USERS_PER_PAGE', 15)

    # Fetch users that are not yet approved AND still marked as inactive.
    # This ensures we don't show users who might have been manually activated for some reason
    # but not formally "approved" through this workflow, or vice-versa.
    # The core idea is is_approved=False is the main gate.
    users_query = User.query.filter_by(is_approved=False, is_active=False)\
                            .order_by(User.id.asc()) # Or by registration date if available & desired

    user_pagination = users_query.paginate(page=page, per_page=per_page, error_out=False)
    pending_users_list = user_pagination.items

    current_app.logger.info(f"Admin {current_user.username} viewing pending users page {page}. Found {len(pending_users_list)} pending users.")
    return render_template('admin_pending_users.html', pending_users=pending_users_list, user_pagination=user_pagination)


@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@admin_required
def approve_user(user_id):
    current_app.logger.debug(f"Admin {current_user.username} attempting to approve user ID {user_id}")
    user_to_approve = User.query.get_or_404(user_id)

    if user_to_approve.is_approved and user_to_approve.is_active:
        flash(f'User {user_to_approve.username} is already approved and active.', 'info')
        return redirect(url_for('admin.pending_users'))

    try:
        user_to_approve.is_approved = True
        user_to_approve.is_active = True
        db.session.add(user_to_approve)
        db.session.commit()
        current_app.logger.info(f"Admin {current_user.username} approved user ID {user_id} ({user_to_approve.username}).")
        flash(f'User {user_to_approve.username} has been approved and activated.', 'success')
        # TODO: Consider sending a notification email to the user.
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving user {user_id} by admin {current_user.username}: {e}", exc_info=True)
        flash('Error approving user.', 'danger')
    return redirect(url_for('admin.pending_users'))


@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@admin_required
def reject_user(user_id):
    current_app.logger.debug(f"Admin {current_user.username} attempting to reject user ID {user_id}")
    user_to_reject = User.query.get_or_404(user_id)

    if user_to_reject.is_approved or user_to_reject.is_active: # Should not happen if they are in pending list
        flash(f'User {user_to_reject.username} is already active or approved and cannot be rejected from this interface.', 'warning')
        return redirect(url_for('admin.pending_users'))

    # It's safer to check if the user is an admin before deleting,
    # though admins shouldn't be in the pending list.
    if user_to_reject.is_admin:
        flash('Cannot reject an administrator account through this interface.', 'danger')
        return redirect(url_for('admin.pending_users'))

    try:
        username_rejected = user_to_reject.username # Capture username for logging before deletion
        # Instead of deleting, one might also choose to mark them as 'rejected'
        # with a specific flag, in case records need to be kept.
        # For this implementation, we delete as per plan.
        db.session.delete(user_to_reject)
        db.session.commit()
        current_app.logger.info(f"Admin {current_user.username} rejected and deleted user ID {user_id} (Username: {username_rejected}).")
        flash(f'User {username_rejected} has been rejected and deleted.', 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting user {user_id} by admin {current_user.username}: {e}", exc_info=True)
        flash('Error rejecting user.', 'danger')
    return redirect(url_for('admin.pending_users'))
