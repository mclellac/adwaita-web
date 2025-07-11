from flask_wtf import FlaskForm
from wtforms import (
    BooleanField,
    FileField,  # Added FileField back
    MultipleFileField,
    PasswordField,
    StringField,
    SubmitField,
    TextAreaField,
    HiddenField, # Added for CommentForm parent_id if needed, StringField is fine too
    IntegerField
)
from wtforms.fields import DateField # Changed import for DateField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional, NumberRange, Regexp # Added Email and Regexp
from wtforms.widgets import CheckboxInput, ListWidget # Ensure ListWidget is imported if used by QuerySelectMultipleField
from wtforms_sqlalchemy.fields import QuerySelectMultipleField
from .models import Category # Import Category from models.py

# Forms (Copied from app.py)

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class RegistrationForm(FlaskForm):
    full_name = StringField('Display Name', validators=[DataRequired(), Length(min=1, max=120)])
    email = StringField('Email (Username)', validators=[DataRequired(), Length(min=6, max=120), Email(message="Please enter a valid email address.")])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8, message="Password must be at least 8 characters long.")])
    confirm_password = PasswordField(
        'Confirm Password',
        validators=[
            DataRequired(),
            EqualTo('password', message='Passwords must match.')
        ]
    )
    submit = SubmitField('Register')

class ChangePasswordForm(FlaskForm):
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField(
        'New Password', validators=[DataRequired(), Length(min=8)]
    )
    confirm_new_password = PasswordField(
        'Confirm New Password',
        validators=[
            DataRequired(),
            EqualTo('new_password', message='New passwords must match.')
        ]
    )
    submit = SubmitField('Change Password')

# Query factory for PostForm categories
def category_query_factory():
    return Category.query.order_by(Category.name).all()

def get_category_pk(obj):
    if obj:
        return obj.id
    return None

class PostForm(FlaskForm):
    content = TextAreaField('Content (Markdown)', validators=[DataRequired()]) # Updated label
    categories = QuerySelectMultipleField(
        'Categories',
        query_factory=category_query_factory,
        get_pk=get_category_pk,
        get_label='name',
        widget=ListWidget(prefix_label=False),
        option_widget=CheckboxInput()
    )
    tags_string = StringField(
        'Tags (comma-separated)',
        validators=[Optional(), Length(max=250)]
    )
    submit = SubmitField('Post') # Single submit button

class ProfileEditForm(FlaskForm):
    full_name = StringField('Display Name', validators=[DataRequired(), Length(min=1, max=120)]) # Changed to DataRequired
    profile_info = TextAreaField(
        'Bio (supports some HTML)', # Label from app.py
        validators=[Optional(), Length(max=5000)]
    )
    profile_photo = FileField('Profile Photo (Max 2MB)', validators=[Optional()])
    website_url = StringField('Website URL', validators=[Optional(), Length(max=200)])

    # New fields for enhanced profile
    # address = TextAreaField('Address', validators=[Optional(), Length(max=255)]) # Removed
    # phone_number = StringField('Phone Number', validators=[Optional(), Length(max=50)]) # Removed
    street_address = StringField('Street Address', validators=[Optional(), Length(max=255)])
    city = StringField('City', validators=[Optional(), Length(max=100)])
    state_province = StringField('State/Province/Region', validators=[Optional(), Length(max=100)])
    postal_code = StringField('Postal/Zip Code', validators=[Optional(), Length(max=20)])
    country = StringField('Country', validators=[Optional(), Length(max=100)])
    home_phone = StringField('Home Phone', validators=[Optional(), Length(max=50)])
    mobile_phone = StringField('Mobile Phone', validators=[Optional(), Length(max=50)])
    birthdate = DateField('Birthdate', validators=[Optional()])

    is_profile_public = BooleanField('Make Profile Public')
    submit = SubmitField('Update Profile')

class CommentForm(FlaskForm):
    text = TextAreaField(
        'Comment',
        validators=[DataRequired(), Length(min=1, max=2000)]
    )
    submit = SubmitField('Post Comment')
    parent_id = HiddenField(validators=[Optional()]) # Using HiddenField for parent_id

class DeleteCommentForm(FlaskForm):
    submit = SubmitField('Delete') # Label from app.py was 'Delete'

class DeletePostForm(FlaskForm):
    submit = SubmitField('Delete Post')

class FlagCommentForm(FlaskForm):
    submit = SubmitField('Flag Comment')

class SiteSettingsForm(FlaskForm):
    site_title = StringField('Site Title', validators=[DataRequired(), Length(min=1, max=120)])
    # Validated as int in route, StringField is fine here
    posts_per_page = StringField('Posts Per Page', validators=[DataRequired()])
    allow_registrations = BooleanField('Allow New User Registrations')
    submit = SubmitField('Save Settings')

class GalleryPhotoUploadForm(FlaskForm):
    photos = MultipleFileField(  # Changed from photo to photos and FileField to MultipleFileField
        'Photos (Max 5MB each)',  # Updated label
        validators=[
            DataRequired(message="Please select one or more photos to upload."),
            # FileAllowed will be added dynamically in the route for each file.
            # Consider adding a validator for the number of files if needed, e.g., Length(min=1, max=10)
        ]
    )
    caption = TextAreaField(  # Caption will apply to all photos in this batch, or adjust logic in route
        'Caption (Optional, applies to all uploaded photos)',
        validators=[Optional(), Length(max=500)]
    )
    submit = SubmitField('Upload Photos') # Updated label

class PhotoCommentForm(FlaskForm):
    text = TextAreaField(
        'Comment',
        validators=[DataRequired(), Length(min=1, max=2000)]
    )
    # photo_id and user_id will be handled by the route
    submit = SubmitField('Post Comment')

    class Meta:
        csrf = False # Disable CSRF for this API-specific form

# Empty forms for CSRF-protected actions like Like/Unlike
class LikeForm(FlaskForm):
    submit = SubmitField('Like') # Text can be changed in template if needed for context

class UnlikeForm(FlaskForm):
    submit = SubmitField('Unlike') # Text can be changed in template if needed for context

# Password Reset Request Form
class RequestPasswordResetForm(FlaskForm):
    email = StringField(
        'Your Email Address',
        validators=[
            DataRequired(message="Please enter your email address."),
            Email(message="Invalid email address.")
        ]
    )
    submit = SubmitField('Request Password Reset')

# Password Reset Form (with token)
class ResetPasswordForm(FlaskForm):
    password = PasswordField(
        'New Password',
        validators=[
            DataRequired(message="Please enter a new password."),
            Length(min=8, message="Password must be at least 8 characters long.")
        ]
    )
    confirm_password = PasswordField(
        'Confirm New Password',
        validators=[
            DataRequired(message="Please confirm your new password."),
            EqualTo('password', message='Passwords must match.')
        ]
    )
    submit = SubmitField('Reset Password')
