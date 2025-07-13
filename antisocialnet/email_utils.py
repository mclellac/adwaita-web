from flask import render_template, current_app, url_for
from flask_mail import Message
from . import mail # Assuming 'mail' will be the Flask-Mail instance from __init__.py

def send_password_reset_email(user):
    """
    Sends a password reset email to the user.
    """
    token = user.get_reset_password_token()
    reset_url = url_for('auth.reset_password_with_token', token=token, _external=True)

    subject = "Password Reset Request for Your App"
    sender = current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@example.com')
    recipients = [user.username]

    text_body = f"""Dear {user.full_name or user.username or 'User'},

To reset your password, please visit the following link:
{reset_url}

If you did not request a password reset, please ignore this email.
This link will expire in approximately 30 minutes.

Sincerely,
The Your App Team
"""
    msg = Message(subject=subject, sender=sender, recipients=recipients)
    msg.body = text_body

    try:
        if current_app.config.get('MAIL_SUPPRESS_SEND', False):
            current_app.logger.info(f"Email sending suppressed. Would send to: {user.username}")
            current_app.logger.info(f"Email subject: {subject}")
            current_app.logger.info(f"Email body:\n{text_body}")
            current_app.logger.info(f"Reset URL would be: {reset_url}")
        else:
            mail.send(msg)
            current_app.logger.info(f"Password reset email sent to {user.username}")
    except Exception as e:
        current_app.logger.error(f"Failed to send password reset email to {user.username}: {e}", exc_info=True)
        pass
