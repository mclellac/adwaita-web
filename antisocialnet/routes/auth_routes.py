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
        user_id_log = current_user.id if hasattr(current_user, 'id') else 'N/A'
        user_handle_log = current_user.handle if hasattr(current_user, 'handle') else 'N/A'
        current_app.logger.debug(f"User ID {user_id_log} (Handle: {user_handle_log}) already authenticated, redirecting to general.index.")
        return redirect(url_for('general.index'))

    if not SiteSetting.get('allow_registrations', False):
        current_app.logger.info("Registration attempt while registrations are disabled.")
        flash('User registration is currently disabled.', 'info')
        return redirect(url_for('auth.login'))

    form = RegistrationForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Registration form submitted. Email: '{form.email.data}'")

    if form.validate_on_submit():
        # Check 1: Email (which is User.username) uniqueness
        existing_user_by_email = User.query.filter_by(username=form.email.data).first()
        if existing_user_by_email:
            current_app.logger.warning(f"Registration attempt with existing email: '{form.email.data}'.")
            flash('An account with this email address already exists. Please log in or use a different email.', 'danger')
            return render_template('register.html', form=form)

        # Check 2: Handle uniqueness
        existing_user_by_handle = User.query.filter_by(handle=form.handle.data).first()
        if existing_user_by_handle:
            current_app.logger.warning(f"Registration attempt with existing handle: '{form.handle.data}'.")
            flash('This public handle is already taken. Please choose a different one.', 'danger')
            return render_template('register.html', form=form)

        try:
            new_user = User(
                username=form.email.data,  # Email for login
                handle=form.handle.data,    # Public handle
                full_name=form.full_name.data,
                is_approved=False,
                is_active=False,
                is_admin=False # Explicitly false for new registrations
            )
            new_user.set_password(form.password.data)
            db.session.add(new_user)
            db.session.commit()
            # Log email (new_user.username) here as it's relevant to account creation internal logs, but be mindful.
            # Handle is the primary public identifier.
            current_app.logger.info(f"New user registered - Email: '{new_user.username}', Handle: '{new_user.handle}', ID: {new_user.id}. Pending approval.")
            flash('Registration successful! Your account is pending admin approval.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during new user registration for email '{form.email.data}', handle '{form.handle.data}': {e}", exc_info=True)
            flash('An unexpected error occurred during registration. Please try again later.', 'danger')
            return render_template('register.html', form=form)

    elif request.method == 'POST': # Catches validation failures on POST
        # Log both email and handle for context on validation failure
        log_email = form.email.data if form.email else "N/A"
        log_handle = form.handle.data if form.handle else "N/A"
        current_app.logger.warning(f"Registration form validation failed for email: '{log_email}', handle: '{log_handle}'. Errors: {form.errors}")
        flash_form_errors_util(form)

    current_app.logger.debug(f"Rendering register template for {request.path}")
    return render_template('register.html', form=form)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    current_app.logger.debug(f"Accessing /auth/login, Method: {request.method}, IP: {request.remote_addr}")
    if current_user.is_authenticated:
        user_id_log = current_user.id if hasattr(current_user, 'id') else 'N/A'
        user_handle_log = current_user.handle if hasattr(current_user, 'handle') else 'N/A'
        current_app.logger.debug(f"User ID {user_id_log} (Handle: {user_handle_log}) already authenticated, redirecting to general.index.")
        return redirect(url_for('general.index'))

    form = LoginForm(request.form)
    if request.method == 'POST':
        # form.username.data is the email used for login
        current_app.logger.debug(f"Login form submitted. Email (for login): '{form.username.data}'")

    if form.validate_on_submit(): # validate_on_submit checks method and validates
        user = User.query.filter_by(username=form.username.data).first() # User.username is email
        if user and user.check_password(form.password.data):
            if not user.is_active:
                current_app.logger.warning(f"Login attempt by inactive user - Email: '{user.username}', Handle: '{user.handle}'.")
                flash('Your account is not active. Please contact an administrator.', 'danger')
            elif not user.is_approved:
                current_app.logger.warning(f"Login attempt by unapproved user - Email: '{user.username}', Handle: '{user.handle}'.")
                flash('Your account is pending admin approval.', 'danger')
            else:
                login_user(user)
                current_app.logger.info(f"User logged in - Email: '{user.username}', Handle: '{user.handle}', ID: {user.id}.")
                current_app.logger.debug(f"Session after login for user (Handle: '{user.handle}', ID: {user.id}): {dict(session)}")
            flash('Logged in successfully.', 'toast_success') # Changed to toast_success
            next_page = request.args.get('next')
            # More robust security check for next_page
            if next_page:
                from urllib.parse import urlsplit
                url_next = urlsplit(next_page)
                # Allow only relative paths or paths on the same host
                if url_next.netloc and url_next.netloc != request.host:
                    current_app.logger.warning(f"Invalid next URL (external redirect attempt): {next_page}")
                    next_page = None
                elif not url_next.path.startswith(request.script_root + '/'): # Check if path is within app
                    # This check might be too strict if script_root is involved in complex ways,
                    # but generally ensures it's an app path.
                    # A simpler check is if it starts with '/' (relative to host)
                    if not url_next.path.startswith('/'):
                         current_app.logger.warning(f"Potentially unsafe next URL path: {next_page}")
                         next_page = None # Or just ensure it's a path within the app

            current_app.logger.debug(f"Login next page for user (Handle: {user.handle}, ID: {user.id}): '{next_page}', redirecting.")
            return redirect(next_page or url_for('general.index'))
        else:
            # Log the email used for login attempt
            current_app.logger.warning(f"Invalid login attempt for email: '{form.username.data}'. User exists: {user is not None}.")
            flash('Invalid username or password.', 'danger')
    elif request.method == 'POST': # Catches validation failures on POST
        # Log the email used for login attempt
        current_app.logger.warning(f"Login form validation failed for email: '{form.username.data}'. Errors: {form.errors}")
        flash_form_errors_util(form)
        # The original code had an additional flash if form.errors was empty,
        # but validate_on_submit failing usually means form.errors is populated.
        # If it's truly empty and validation failed, WTForms might have an issue,
        # or it's a CSRF failure which flask-wtf handles by aborting (default) or custom error.
        # For now, relying on flash_form_errors_util.

    current_app.logger.debug(f"Rendering login template for {request.path}")
    return render_template('login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    user_id_log = current_user.id if hasattr(current_user, 'id') else 'N/A'
    user_handle_log = current_user.handle if hasattr(current_user, 'handle') else 'N/A'
    user_email_log = current_user.username # Storing email for internal log before logout
    current_app.logger.debug(f"Accessing /auth/logout, User ID: {user_id_log}, Handle: {user_handle_log}, Email: {user_email_log}")

    logout_user()

    current_app.logger.info(f"User logged out - Email: '{user_email_log}', Handle: '{user_handle_log}', ID: {user_id_log}.")
    current_app.logger.debug(f"Session after logout: {dict(session)}")
    flash('Logged out successfully.', 'toast_success') # Changed to toast_success
    return redirect(url_for('general.index'))


@auth_bp.route('/change-password', methods=['GET', 'POST']) # Removed /settings prefix, part of /auth now
@login_required
def change_password_page():
    user_id_log = current_user.id
    user_handle_log = current_user.handle
    user_email_log = current_user.username # For internal logging context
    current_app.logger.debug(f"Accessing /auth/change-password, Method: {request.method}, User ID: {user_id_log}, Handle: {user_handle_log}, Email: {user_email_log}")
    form = ChangePasswordForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Change password form submitted by User ID: {user_id_log}, Handle: {user_handle_log}, Email: {user_email_log}.")

    if form.validate_on_submit():
        current_app.logger.info(f"User ID: {user_id_log} (Handle: {user_handle_log}, Email: {user_email_log}) attempting to change password.")
        if current_user.check_password(form.current_password.data):
            try:
                current_user.set_password(form.new_password.data)
                db.session.add(current_user) # Add to session before commit if changed
                db.session.commit()
                current_app.logger.info(f"Password changed for User ID: {user_id_log} (Handle: {user_handle_log}, Email: {user_email_log}).")
                flash('Your password has been updated successfully!', 'toast_success')
                # Redirect to a general settings page or profile page
                return redirect(url_for('general.settings_page'))
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error saving new password for User ID: {user_id_log} (Handle: {user_handle_log}, Email: {user_email_log}): {e}", exc_info=True)
                flash('Error changing password. Please try again.', 'danger')
        else:
            current_app.logger.warning(f"Invalid current password by User ID: {user_id_log} (Handle: {user_handle_log}, Email: {user_email_log}) during password change.")
            flash('Invalid current password.', 'danger')
    elif request.method == 'POST': # Catches validation failures on POST
        current_app.logger.warning(f"Change password form validation failed for User ID: {user_id_log} (Handle: {user_handle_log}, Email: {user_email_log}). Errors: {form.errors}")
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
        # User.username stores the email address
        user = User.query.filter_by(username=form.email.data).first()
        if user:
            try:
                send_password_reset_email(user)
                current_app.logger.info(f"Password reset email initiated for User ID: {user.id} (Handle: {user.handle}, Email: {user.username}).")
                flash('An email has been sent with instructions to reset your password.', 'info')
            except Exception as e:
                current_app.logger.error(f"Failed to send password reset email for Email: {form.email.data}: {e}", exc_info=True)
                flash('Sorry, there was an error sending the password reset email. Please try again later.', 'danger')
        else:
            # Don't reveal if email exists or not for security, same message.
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
            current_app.logger.info(f"Password has been reset for User ID: {user.id} (Handle: {user.handle}, Email: {user.username}).")
            flash('Your password has been reset successfully! You can now log in.', 'success')
            # Optional: Log the user in automatically
            # login_user(user)
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving reset password for User ID: {user.id} (Handle: {user.handle}, Email: {user.username}): {e}", exc_info=True)
            flash('An error occurred while resetting your password. Please try again.', 'danger')
    elif request.method == 'POST':
        flash_form_errors_util(form)

    return render_template('reset_password_with_token.html', title='Reset Your Password', form=form, token=token)
