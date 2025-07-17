from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from ..models import User, SiteSetting
from ..forms import LoginForm, RegistrationForm, ChangePasswordForm, RequestPasswordResetForm, ResetPasswordForm
from .. import db
from ..email_utils import send_password_reset_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    if current_user.is_authenticated:
        return jsonify(status='error', message='Already logged in'), 400

    if not SiteSetting.get('allow_registrations', False):
        return jsonify(status='error', message='User registration is currently disabled.'), 403

    data = request.get_json()
    form = RegistrationForm(data=data)

    if form.validate():
        existing_user = User.query.filter_by(username=form.email.data).first()
        if existing_user:
            return jsonify(status='error', message='An account with this email address already exists.'), 409

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
            return jsonify(status='success', message='Registration successful! Your account is pending admin approval.'), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during new user registration: {e}", exc_info=True)
            return jsonify(status='error', message='An unexpected error occurred during registration.'), 500
    else:
        return jsonify(status='error', errors=form.errors), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        return jsonify(status='error', message='Already logged in'), 400

    data = request.get_json()
    form = LoginForm(data=data)

    if form.validate():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            if not user.is_active:
                return jsonify(status='error', message='Your account is not active.'), 403
            elif not user.is_approved:
                return jsonify(status='error', message='Your account is pending admin approval.'), 403
            else:
                login_user(user)
                return jsonify(status='success', message='Logged in successfully.')
        else:
            return jsonify(status='error', message='Invalid username or password.'), 401
    else:
        return jsonify(status='error', errors=form.errors), 400

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify(status='success', message='Logged out successfully.')

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    form = ChangePasswordForm(data=data)

    if form.validate():
        if current_user.check_password(form.current_password.data):
            try:
                current_user.set_password(form.new_password.data)
                db.session.commit()
                return jsonify(status='success', message='Your password has been updated successfully!')
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error saving new password for user {current_user.id}: {e}", exc_info=True)
                return jsonify(status='error', message='Error changing password.'), 500
        else:
            return jsonify(status='error', message='Invalid current password.'), 401
    else:
        return jsonify(status='error', errors=form.errors), 400

@auth_bp.route('/reset-password-request', methods=['POST'])
def reset_password_request():
    if current_user.is_authenticated:
        return jsonify(status='error', message='Already logged in'), 400

    data = request.get_json()
    form = RequestPasswordResetForm(data=data)

    if form.validate():
        user = User.query.filter_by(username=form.email.data).first()
        if user:
            try:
                send_password_reset_email(user)
            except Exception as e:
                current_app.logger.error(f"Failed to send password reset email for {form.email.data}: {e}", exc_info=True)
        # Always return success to avoid revealing if an email exists
        return jsonify(status='success', message='If an account with that email exists, an email has been sent with instructions to reset your password.')
    else:
        return jsonify(status='error', errors=form.errors), 400

@auth_bp.route('/reset-password-with-token', methods=['POST'])
def reset_password_with_token():
    if current_user.is_authenticated:
        return jsonify(status='error', message='Already logged in'), 400

    data = request.get_json()
    token = data.get('token')
    user = User.verify_reset_password_token(token)

    if not user:
        return jsonify(status='error', message='That is an invalid or expired token.'), 400

    form = ResetPasswordForm(data=data)
    if form.validate():
        try:
            user.set_password(form.password.data)
            db.session.commit()
            return jsonify(status='success', message='Your password has been reset successfully! You can now log in.')
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving reset password for user {user.id}: {e}", exc_info=True)
            return jsonify(status='error', message='An error occurred while resetting your password.'), 500
    else:
        return jsonify(status='error', errors=form.errors), 400
