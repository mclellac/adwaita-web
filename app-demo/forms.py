from flask_wtf import FlaskForm
from wtforms import (
    BooleanField,
    FileField,
    PasswordField,
    StringField,
    SubmitField,
    TextAreaField,
    HiddenField # Added for CommentForm parent_id if needed, StringField is fine too
)
from wtforms.validators import DataRequired, EqualTo, Length, Optional
from wtforms.widgets import CheckboxInput, ListWidget # Ensure ListWidget is imported if used by QuerySelectMultipleField
from wtforms_sqlalchemy.fields import QuerySelectMultipleField
from .models import Category # Import Category from models.py

# Forms (Copied from app.py)

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

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
    title = StringField('Title', validators=[DataRequired(), Length(min=1, max=120)])
    content = TextAreaField('Content (Markdown)', validators=[DataRequired()]) # Updated label
    categories = QuerySelectMultipleField(
        'Categories',
        query_factory=category_query_factory,
        get_pk=get_category_pk,
        get_label='name',
        widget=ListWidget(prefix_label=False),
        option_widget=CheckboxInput(),
        allow_blank=True
    )
    tags_string = StringField(
        'Tags (comma-separated)',
        validators=[Optional(), Length(max=250)]
    )
    save_draft = SubmitField('Save Draft')
    publish = SubmitField('Publish')

class ProfileEditForm(FlaskForm):
    full_name = StringField('Display Name', validators=[Optional(), Length(max=120)])
    profile_info = TextAreaField(
        'Bio (supports some HTML)', # Label from app.py
        validators=[Optional(), Length(max=5000)]
    )
    profile_photo = FileField('Profile Photo (Max 2MB)', validators=[Optional()])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    website_url = StringField('Website URL', validators=[Optional(), Length(max=200)])
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
    photo = FileField(
        'Photo (Max 5MB)',
        validators=[
            DataRequired(message="Please select a photo to upload."),
            # FileAllowed will be added dynamically in the route using current_app.config
        ]
    )
    caption = TextAreaField(
        'Caption (Optional)',
        validators=[Optional(), Length(max=500)]
    )
    submit = SubmitField('Upload Photo')
