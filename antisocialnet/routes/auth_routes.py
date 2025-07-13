from flask import Blueprint, render_template, redirect, url_for, flash, request, session, current_app
from flask_login import login_user, logout_user, current_user, login_required
from datetime import datetime, timezone # For logging if restored

from ..models import User, SiteSetting
from ..forms import LoginForm, RegistrationForm, ChangePasswordForm, RequestPasswordResetForm, ResetPasswordForm
from .. import db # db instance from antisocialnet/__init__.py
from ..utils import flash_form_errors_util
from ..email_utils import send_password_reset_email # Import the email sending utility

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    current_app.logger.debug(f"Accessing /auth/register, Method: {request.method}, IP: {request.remote_addr}")
    if current_user.is_authenticated:
        current_app.logger.debug(f"User '{current_user.full_name}' (ID: {current_user.id}) already authenticated, redirecting to general.index.")
        return redirect(url_for('general.index'))

    if not SiteSetting.get('allow_registrations', False):
        current_app.logger.info("Registration attempt while registrations are disabled.")
        flash('User registration is currently disabled.', 'info')
        return redirect(url_for('auth.login'))

    form = RegistrationForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Registration form submitted. Email: '{form.email.data}' for Full Name: '{form.full_name.data}'")

    if form.validate_on_submit():
        existing_user = User.query.filter_by(username=form.email.data).first()
        if existing_user:
            current_app.logger.warning(f"Registration attempt with existing email: '{form.email.data}'.")
            flash('An account with this email address already exists. Please log in or use a different email.', 'danger')
            return render_template('register.html', form=form)

        try:
            new_user = User(
                username=form.email.data,
                full_name=form.full_name.data,
                is_approved=False,
                is_active=False,
                is_admin=False
            )
            new_user.set_password(form.password.data)
            db.session.add(new_user)
            db.session.commit()
            current_app.logger.info(f"New user '{new_user.full_name}' (ID: {new_user.id}, Username/Email: {new_user.username}) registered successfully. Pending approval.")
            flash('Registration successful! Your account is pending admin approval.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during new user registration for email '{form.email.data}': {e}", exc_info=True)
            flash('An unexpected error occurred during registration. Please try again later.', 'danger')
            return render_template('register.html', form=form)

    elif request.method == 'POST':
        current_app.logger.warning(f"Registration form validation failed for email: '{form.email.data}'. Errors: {form.errors}")
        flash_form_errors_util(form)

    current_app.logger.debug(f"Rendering register template for {request.path}")
    return render_template('register.html', form=form)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    current_app.logger.debug(f"Accessing /auth/login, Method: {request.method}, IP: {request.remote_addr}")
    if current_user.is_authenticated:
        current_app.logger.debug(f"User '{current_user.full_name}' (ID: {current_user.id}) already authenticated, redirecting to general.index.")
        return redirect(url_for('general.index'))

    form = LoginForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Login form submitted. Username/Email: '{form.username.data}'")

    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            if not user.is_active:
                current_app.logger.warning(f"Login attempt by inactive user: '{user.username}' (ID: {user.id}).")
                flash('Your account is not active. Please contact an administrator.', 'danger')
                return redirect(url_for('auth.login'))
            elif not user.is_approved:
                current_app.logger.warning(f"Login attempt by unapproved user: '{user.username}' (ID: {user.id}).")
                flash('Your account is pending admin approval.', 'danger')
                return redirect(url_for('auth.login'))
            else:
                login_user(user)
                current_app.logger.info(f"User '{user.full_name}' (ID: {user.id}, Username/Email: {user.username}) logged in successfully.")
                current_app.logger.debug(f"Session after login for user '{user.full_name}' (ID: {user.id}): {dict(session)}")
                flash('Logged in successfully.', 'toast_success')

            next_page = request.args.get('next')
            if next_page:
                from urllib.parse import urlsplit
                url_next = urlsplit(next_page)
                if url_next.netloc and url_next.netloc != request.host:
                    current_app.logger.warning(f"Invalid next URL (external redirect attempt): {next_page}")
                    next_page = None
                elif not url_next.path.startswith(request.script_root + '/'):
                    if not url_next.path.startswith('/'):
                         current_app.logger.warning(f"Potentially unsafe next URL path: {next_page}")
                         next_page = None

            current_app.logger.debug(f"Login next page: '{next_page}', redirecting for user '{user.full_name}' (ID: {user.id}).")
            return redirect(next_page or url_for('general.index'))
        else:
            current_app.logger.warning(f"Invalid login attempt for username/email: '{form.username.data}'. User exists: {user is not None}.")
            flash('Invalid username or password.', 'danger')
    elif request.method == 'POST':
        current_app.logger.warning(f"Login form validation failed for username/email: '{form.username.data}'. Errors: {form.errors}")
        flash_form_errors_util(form)

    current_app.logger.debug(f"Rendering login template for {request.path}")
    return render_template('login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    user_full_name_before_logout = current_user.full_name
    user_id_before_logout = current_user.id
    username_email_before_logout = current_user.username
    current_app.logger.debug(f"Accessing /auth/logout, User: '{user_full_name_before_logout}' (ID: {user_id_before_logout}, Username/Email: {username_email_before_logout})")

    logout_user()

    current_app.logger.info(f"User '{user_full_name_before_logout}' (ID: {user_id_before_logout}, Username/Email: {username_email_before_logout}) logged out successfully.")
    current_app.logger.debug(f"Session after logout: {dict(session)}")
    flash('Logged out successfully.', 'toast_success')
    return redirect(url_for('general.index'))


@auth_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password_page():
    current_app.logger.debug(f"Accessing /auth/change-password, Method: {request.method}, User: '{current_user.full_name}' (ID: {current_user.id})")
    form = ChangePasswordForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Change password form submitted by User '{current_user.full_name}' (ID: {current_user.id}).")

    if form.validate_on_submit():
        current_app.logger.info(f"User '{current_user.full_name}' (ID: {current_user.id}) attempting to change password.")
        if current_user.check_password(form.current_password.data):
            try:
                current_user.set_password(form.new_password.data)
                db.session.add(current_user)
                db.session.commit()
                current_app.logger.info(f"Password changed for user '{current_user.full_name}' (ID: {current_user.id}).")
                flash('Your password has been updated successfully!', 'toast_success')
                return redirect(url_for('general.settings_page'))
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error saving new password for user '{current_user.full_name}' (ID: {current_user.id}): {e}", exc_info=True)
                flash('Error changing password. Please try again.', 'danger')
        else:
            current_app.logger.warning(f"Invalid current password by user '{current_user.full_name}' (ID: {current_user.id}) during password change.")
            flash('Invalid current password.', 'danger')
    elif request.method == 'POST':
        current_app.logger.warning(f"Change password form validation failed for user '{current_user.full_name}' (ID: {current_user.id}). Errors: {form.errors}")
        flash_form_errors_util(form)

    current_app.logger.debug(f"Rendering change_password template for {request.path}")
    return render_template('change_password.html', form=form)

@auth_bp.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    current_app.logger.debug(f"Accessing /auth/reset_password_request, Method: {request.method}")
    if current_user.is_authenticated:
        return redirect(url_for('general.index'))
    form = RequestPasswordResetForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.email.data).first()
        if user:
            try:
                send_password_reset_email(user)
                current_app.logger.info(f"Password reset email initiated for user '{user.full_name}' (ID: {user.id}, Email: {user.username}).")
                flash('An email has been sent with instructions to reset your password.', 'info')
            except Exception as e:
                current_app.logger.error(f"Failed to send password reset email for {form.email.data} (User ID: {user.id if user else 'N/A'}): {e}", exc_info=True)
                flash('Sorry, there was an error sending the password reset email. Please try again later.', 'danger')
        else:
            current_app.logger.info(f"Password reset request for non-existent or unconfirmed email: {form.email.data}.")
            flash('An email has been sent with instructions to reset your password.', 'info')
        return redirect(url_for('auth.login'))
    elif request.method == 'POST':
        flash_form_errors_util(form)
    return render_template('request_reset_password.html', title='Request Password Reset', form=form)

@auth_bp.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password_with_token(token):
    current_app.logger.debug(f"Accessing /auth/reset_password/{token}, Method: {request.method}")
    if current_user.is_authenticated:
        return redirect(url_for('general.index'))

    user = User.verify_reset_password_token(token)
    if not user:
        current_app.logger.warning(f"Password reset token invalid or expired: {token}")
        flash('That is an invalid or expired token. Please request a new password reset.', 'warning')
        return redirect(url_for('auth.reset_password_request'))

    form = ResetPasswordForm()
    if form.validate_on_submit():
        try:
            user.set_password(form.password.data)
            db.session.add(user)
            db.session.commit()
            current_app.logger.info(f"Password has been reset for user '{user.full_name}' (ID: {user.id}, Email: {user.username}).")
            flash('Your password has been reset successfully! You can now log in.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving reset password for user '{user.full_name}' (ID: {user.id}, Email: {user.username}): {e}", exc_info=True)
            flash('An error occurred while resetting your password. Please try again.', 'danger')
    elif request.method == 'POST':
        flash_form_errors_util(form)

    return render_template('reset_password_with_token.html', title='Reset Your Password', form=form, token=token)
