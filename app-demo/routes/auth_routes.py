from flask import Blueprint, render_template, redirect, url_for, flash, request, session, current_app
from flask_login import login_user, logout_user, current_user, login_required
from datetime import datetime, timezone # For logging if restored

from ..models import User, SiteSetting
from ..forms import LoginForm, RegistrationForm, ChangePasswordForm
from .. import db # db instance from app-demo/__init__.py
from ..utils import flash_form_errors_util

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    current_app.logger.debug(f"Accessing /auth/register, Method: {request.method}, IP: {request.remote_addr}")
    if current_user.is_authenticated:
        current_app.logger.debug(f"User {current_user.username} already authenticated, redirecting to general.index.")
        return redirect(url_for('general.index'))

    if not SiteSetting.get('allow_registrations', False):
        current_app.logger.info("Registration attempt while registrations are disabled.")
        flash('User registration is currently disabled.', 'info')
        return redirect(url_for('auth.login'))

    form = RegistrationForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Registration form submitted. Email: '{form.email.data}'")

    if form.validate_on_submit():
        existing_user = User.query.filter_by(username=form.email.data).first()
        if existing_user:
            current_app.logger.warning(f"Registration attempt with existing email: '{form.email.data}'.")
            flash('An account with this email address already exists. Please log in or use a different email.', 'danger')
            return render_template('register.html', form=form) # Show form again with error

        try:
            new_user = User(
                username=form.email.data,
                full_name=form.full_name.data, # Added full_name
                is_approved=False,
                is_active=False,
                is_admin=False # Explicitly false for new registrations
            )
            new_user.set_password(form.password.data)
            db.session.add(new_user)
            db.session.commit()
            current_app.logger.info(f"New user '{new_user.username}' (ID: {new_user.id}) registered successfully. Pending approval.")
            flash('Registration successful! Your account is pending admin approval.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during new user registration for email '{form.email.data}': {e}", exc_info=True)
            flash('An unexpected error occurred during registration. Please try again later.', 'danger')
            # It's important to render the template again here, not redirect,
            # so the user doesn't lose their input if it was a transient error.
            return render_template('register.html', form=form)

    elif request.method == 'POST': # Catches validation failures on POST
        current_app.logger.warning(f"Registration form validation failed for email: '{form.email.data}'. Errors: {form.errors}")
        flash_form_errors_util(form)

    current_app.logger.debug(f"Rendering register template for {request.path}")
    return render_template('register.html', form=form)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    current_app.logger.debug(f"Accessing /auth/login, Method: {request.method}, IP: {request.remote_addr}")
    if current_user.is_authenticated:
        current_app.logger.debug(f"User {current_user.username} already authenticated, redirecting to general.index.")
        return redirect(url_for('general.index'))

    form = LoginForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Login form submitted. Username: '{form.username.data}'")

    if form.validate_on_submit(): # validate_on_submit checks method and validates
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            if not user.is_active:
                current_app.logger.warning(f"Login attempt by inactive user: '{user.username}'.")
                flash('Your account is not active. Please contact an administrator.', 'danger')
            elif not user.is_approved:
                current_app.logger.warning(f"Login attempt by unapproved user: '{user.username}'.")
                flash('Your account is pending admin approval.', 'danger')
            else:
                login_user(user)
                current_app.logger.info(f"User '{user.username}' (ID: {user.id}) logged in successfully.")
                current_app.logger.debug(f"Session after login for user '{user.username}': {dict(session)}")
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

            current_app.logger.debug(f"Login next page: '{next_page}', redirecting.")
            return redirect(next_page or url_for('general.index'))
        else:
            current_app.logger.warning(f"Invalid login attempt for username: '{form.username.data}'. User exists: {user is not None}.")
            flash('Invalid username or password.', 'danger')
    elif request.method == 'POST': # Catches validation failures on POST
        current_app.logger.warning(f"Login form validation failed for username: '{form.username.data}'. Errors: {form.errors}")
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
    current_app.logger.debug(f"Accessing /auth/logout, User: {current_user.username}")
    # Store username before logout for logging, if needed
    username_before_logout = current_user.username
    user_id_before_logout = current_user.id

    logout_user()

    current_app.logger.info(f"User '{username_before_logout}' (ID: {user_id_before_logout}) logged out successfully.")
    current_app.logger.debug(f"Session after logout: {dict(session)}")
    flash('Logged out successfully.', 'toast_success') # Changed to toast_success
    return redirect(url_for('general.index'))


@auth_bp.route('/change-password', methods=['GET', 'POST']) # Removed /settings prefix, part of /auth now
@login_required
def change_password_page():
    current_app.logger.debug(f"Accessing /auth/change-password, Method: {request.method}, User: {current_user.username}")
    form = ChangePasswordForm(request.form)
    if request.method == 'POST':
        current_app.logger.debug(f"Change password form submitted by {current_user.username}.")

    if form.validate_on_submit():
        current_app.logger.info(f"User {current_user.username} attempting to change password.")
        if current_user.check_password(form.current_password.data):
            try:
                current_user.set_password(form.new_password.data)
                db.session.add(current_user) # Add to session before commit if changed
                db.session.commit()
                current_app.logger.info(f"Password changed for user {current_user.username}.")
                flash('Your password has been updated successfully!', 'toast_success')
                # Redirect to a general settings page or profile page
                return redirect(url_for('general.settings_page'))
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error saving new password for {current_user.username}: {e}", exc_info=True)
                flash('Error changing password. Please try again.', 'danger')
        else:
            current_app.logger.warning(f"Invalid current password by user {current_user.username} during password change.")
            flash('Invalid current password.', 'danger')
    elif request.method == 'POST': # Catches validation failures on POST
        current_app.logger.warning(f"Change password form validation failed for {current_user.username}. Errors: {form.errors}")
        flash_form_errors_util(form)

    current_app.logger.debug(f"Rendering change_password template for {request.path}")
    return render_template('change_password.html', form=form)
