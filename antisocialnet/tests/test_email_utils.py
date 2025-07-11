import pytest
from unittest.mock import patch, MagicMock
from flask import url_for
from antisocialnet.email_utils import send_password_reset_email
from antisocialnet.models import User

# This fixture will use the main `app` fixture from conftest.py for app context
def test_send_password_reset_email_sends_correct_email(app, db, create_test_user):
    """Test that send_password_reset_email constructs and 'sends' the correct email."""
    user = create_test_user(email_address="emailtest@example.com", full_name="Email Test User")

    original_suppress_send = app.config.get('MAIL_SUPPRESS_SEND')
    app.config['MAIL_SUPPRESS_SEND'] = False # Ensure we attempt to send

    with app.app_context(): # For url_for and current_app.config
        # Mock Flask-Mail's mail.send() method
        with patch('antisocialnet.email_utils.mail.send') as mock_mail_send:
            send_password_reset_email(user)

            mock_mail_send.assert_called_once()
            args, kwargs = mock_mail_send.call_args
            sent_msg = args[0] # The Message object should be the first positional argument

            assert sent_msg.subject == "Password Reset Request for Your App"
            assert sent_msg.sender == app.config.get('MAIL_DEFAULT_SENDER', 'noreply@example.com')
            assert sent_msg.recipients == [user.username] # Changed to username

            # Check that the reset URL (and thus token) is in the body
            # We need to generate a token to compare, or check for parts of the URL
            # This part is a bit tricky as the token is generated inside send_password_reset_email
            # For a more robust check, we could mock user.get_reset_password_token

            # Let's check for key phrases and the presence of a URL
            assert "To reset your password, please visit the following link:" in sent_msg.body
            assert url_for('auth.reset_password_with_token', token="TEMP_TOKEN_FOR_TEST", _external=True).split("TEMP_TOKEN_FOR_TEST")[0] in sent_msg.body
            assert (user.full_name or user.username) in sent_msg.body # Match body's salutation

    app.config['MAIL_SUPPRESS_SEND'] = original_suppress_send # Restore original setting


def test_send_password_reset_email_suppressed_logging(app, db, create_test_user, caplog):
    """Test that email content is logged when MAIL_SUPPRESS_SEND is True."""
    user = create_test_user(email_address="logtest@example.com", full_name="Log Test User")

    original_suppress_send = app.config.get('MAIL_SUPPRESS_SEND')
    app.config['MAIL_SUPPRESS_SEND'] = True # Ensure it's true for this test

    with app.app_context():
        with patch('antisocialnet.email_utils.mail.send') as mock_mail_send: # Still mock to ensure it's NOT called
            send_password_reset_email(user)

            mock_mail_send.assert_not_called() # mail.send() should not be called

            assert f"Email sending suppressed. Would send to: {user.username}" in caplog.text # Changed to username
            assert "Password Reset Request for Your App" in caplog.text # Subject
            assert "To reset your password, please visit the following link:" in caplog.text
            # The user's username is part of the salutation "Dear {user.full_name or user.username or 'User'}"
            # and also might be asserted directly if the email body includes it elsewhere.
            # The email_utils.py now uses `user.full_name or user.username`.
            # If full_name is "Log Test User", that should be in the log.
            assert (user.full_name or user.username) in caplog.text

            # Check if the reset URL is logged
            # This requires capturing the generated token or the full URL.
            # The current logging in send_password_reset_email logs the reset_url.
            # We can check if a URL containing '/auth/reset_password/' is in the logs.
            assert "/auth/reset_password/" in caplog.text

    app.config['MAIL_SUPPRESS_SEND'] = original_suppress_send # Restore original setting


@patch('antisocialnet.email_utils.mail.send', side_effect=Exception("SMTP Error"))
def test_send_password_reset_email_handles_send_exception(mock_mail_send_exception, app, db, create_test_user, caplog):
    """Test that exceptions during mail.send() are caught and logged."""
    user = create_test_user(email_address="sendfail@example.com", full_name="Send Fail User")

    original_suppress_send = app.config.get('MAIL_SUPPRESS_SEND')
    app.config['MAIL_SUPPRESS_SEND'] = False # Ensure we attempt to send for this test

    with app.app_context():
        send_password_reset_email(user) # Should not raise an exception itself

        mock_mail_send_exception.assert_called_once()
        assert f"Failed to send password reset email to {user.username}: SMTP Error" in caplog.text # Changed to username

    app.config['MAIL_SUPPRESS_SEND'] = original_suppress_send # Restore
