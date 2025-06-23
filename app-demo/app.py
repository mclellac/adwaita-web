from datetime import datetime, timezone
from flask import Flask, render_template, url_for, abort, request, redirect, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect, FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SubmitField, FileField, BooleanField
from wtforms.validators import DataRequired, Length, Optional, Email, EqualTo
from wtforms_sqlalchemy.fields import QuerySelectMultipleField
from wtforms.widgets import ListWidget, CheckboxInput
from sqlalchemy import desc, or_
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import logging
from PIL import Image
import uuid
import bleach
import urllib.parse

# Globally defined extensions, to be initialized with an app instance
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

# Define allowed HTML tags and attributes for Bleach
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del', 'ins',
    'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]
ALLOWED_ATTRIBUTES = {
    '*': ['class', 'style', 'id', 'title'],
    'a': ['href', 'target', 'rel'],
}
# ALLOWED_STYLES is not used by bleach.clean if not passed, effectively stripping style contents.
# If specific styles were needed, attributes callable would be used.
ALLOWED_STYLES = [] # Kept for documentation, but not passed to bleach.clean


# Forms remain globally defined as they don't store app-specific state directly
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class ChangePasswordForm(FlaskForm):
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[DataRequired(), Length(min=8)])
    confirm_new_password = PasswordField('Confirm New Password', validators=[DataRequired(), EqualTo('new_password', message='New passwords must match.')])
    submit = SubmitField('Change Password')

def category_query_factory():
    return Category.query.all()

def get_category_pk(obj):
    return obj.id

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=1, max=120)])
    content = TextAreaField('Content', validators=[DataRequired()])
    categories = QuerySelectMultipleField(
        'Categories',
        query_factory=category_query_factory,
        get_pk=get_category_pk,
        get_label='name',
        widget=ListWidget(prefix_label=False),
        option_widget=CheckboxInput(),
        allow_blank=True
    )
    submit = SubmitField('Submit Post')
    tags_string = StringField('Tags (comma-separated)', validators=[Optional(), Length(max=250)])

class ProfileEditForm(FlaskForm):
    full_name = StringField('Display Name', validators=[Optional(), Length(max=120)])
    profile_info = TextAreaField('Bio (supports some HTML)', validators=[Optional(), Length(max=5000)])
    profile_photo = FileField('Profile Photo (Max 2MB)', validators=[Optional()])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    website_url = StringField('Website URL', validators=[Optional(), Length(max=200)])
    is_profile_public = BooleanField('Make Profile Public')
    submit = SubmitField('Update Profile')

class CommentForm(FlaskForm):
    text = TextAreaField('Comment', validators=[DataRequired(), Length(min=1, max=2000)])
    submit = SubmitField('Post Comment')

class DeleteCommentForm(FlaskForm):
    submit = SubmitField('Delete')

def allowed_file(filename):
    from flask import current_app
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    profile_info = db.Column(db.Text, nullable=True)
    profile_photo_url = db.Column(db.String(512), nullable=True)
    full_name = db.Column(db.String(120), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    website_url = db.Column(db.String(200), nullable=True)
    is_profile_public = db.Column(db.Boolean, default=True, nullable=False)
    theme = db.Column(db.String(80), nullable=True, default='system')
    accent_color = db.Column(db.String(80), nullable=True, default='default')
    posts = db.relationship('Post', backref='author', lazy=True, order_by=desc("created_at"))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.id)

post_categories = db.Table('post_categories',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

post_tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    def __init__(self, name):
        self.name = name
        self.slug = name.lower().replace(' ', '-').replace('.', '').replace('#', 'sharp').replace('+', 'plus')

    def __repr__(self):
        return f'<Tag {self.name}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    def __init__(self, name):
        self.name = name
        self.slug = name.lower().replace(' ', '-').replace('.', '')

    def __repr__(self):
        return f'<Category {self.name}>'

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    categories = db.relationship('Category', secondary=post_categories, lazy='subquery',
                                 backref=db.backref('posts', lazy=True))
    tags = db.relationship('Tag', secondary=post_tags, lazy='subquery',
                           backref=db.backref('posts', lazy=True))

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('comments', lazy='dynamic'))

Post.comments = db.relationship('Comment', backref='post', lazy='dynamic', order_by=desc(Comment.created_at))

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

def create_app(config_overrides=None):
    _app = Flask(__name__)

    if not _app.debug:
        _app.logger.setLevel(logging.INFO)
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        _app.logger.addHandler(stream_handler)

    _app.config.from_mapping(
        SECRET_KEY=os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_for_development_only'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER='app-demo/static/uploads/profile_pics',
        ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg', 'gif'},
    )
    pg_user = os.environ.get('POSTGRES_USER', 'postgres')
    pg_pass = os.environ.get('POSTGRES_PASSWORD', '')
    pg_host = os.environ.get('POSTGRES_HOST', 'localhost')
    pg_db = os.environ.get('POSTGRES_DB', 'appdb')
    if pg_pass:
        default_db_uri = f"postgresql://{pg_user}:{pg_pass}@{pg_host}/{pg_db}"
    else:
        default_db_uri = f"postgresql://{pg_user}@{pg_host}/{pg_db}"
    _app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', default_db_uri) # Restored PostgreSQL

    if config_overrides:
        _app.config.from_mapping(config_overrides)

    db.init_app(_app)
    login_manager.init_app(_app)
    login_manager.login_view = 'login'
    csrf.init_app(_app)

    @_app.template_filter('urlencode')
    def urlencode_filter(s):
        if hasattr(s, 'unescape'): # Check if it's a Markup object
            s = s.unescape()
        s = str(s) # Ensure it's a string
        return urllib.parse.quote_plus(s)

    @_app.context_processor
    def inject_user():
        return dict(current_user=current_user)

    @_app.route('/')
    def index():
        page = request.args.get('page', 1, type=int)
        per_page = 5
        pagination = Post.query.order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('index.html', posts=posts, pagination=pagination)

    @_app.route('/posts/<int:post_id>', methods=['GET', 'POST'])
    def view_post(post_id):
        post = Post.query.get_or_404(post_id)
        form = CommentForm()
        delete_form = DeleteCommentForm()
        if form.validate_on_submit() and current_user.is_authenticated:
            comment = Comment(text=form.text.data, author=current_user, post_id=post_id)
            db.session.add(comment)
            db.session.commit()
            flash('Comment posted successfully!', 'success')
            return redirect(url_for('view_post', post_id=post_id))
        comments = post.comments.all()
        return render_template('post.html', post=post, form=form, comments=comments, delete_form=delete_form)

    @_app.route('/comment/<int:comment_id>/delete', methods=['POST'])
    @login_required
    def delete_comment(comment_id):
        delete_form = DeleteCommentForm()
        if delete_form.validate_on_submit():
            comment = Comment.query.get_or_404(comment_id)
            if comment.author != current_user and comment.post.author != current_user:
                abort(403)
            post_id = comment.post_id
            db.session.delete(comment)
            db.session.commit()
            flash('Comment deleted.', 'success')
            return redirect(url_for('view_post', post_id=post_id))
        else:
            flash('Failed to delete comment. Invalid request.', 'danger')
            comment = Comment.query.get(comment_id)
            if comment:
                return redirect(url_for('view_post', post_id=comment.post_id))
            return redirect(url_for('index'))

    @_app.route('/category/<string:category_slug>')
    def posts_by_category(category_slug):
        category = Category.query.filter_by(slug=category_slug).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = 5
        pagination = Post.query.with_parent(category).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('posts_by_category.html', category=category, posts=posts, pagination=pagination)

    @_app.route('/create', methods=['GET', 'POST'])
    @login_required
    def create_post():
        form = PostForm()
        if form.validate_on_submit():
            title = form.title.data
            raw_content = form.content.data
            content = bleach.clean(
                raw_content,
                tags=ALLOWED_TAGS,
                attributes=ALLOWED_ATTRIBUTES,
                strip=True
            )
            try:
                new_post = Post(title=title, content=content, author=current_user)
                for category_obj in form.categories.data:
                    new_post.categories.append(category_obj)
                tags_string = form.tags_string.data
                if tags_string:
                    tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
                    for tag_name in tag_names:
                        tag = Tag.query.filter_by(name=tag_name).first()
                        if not tag:
                            tag = Tag(name=tag_name)
                            db.session.add(tag)
                        new_post.tags.append(tag)
                db.session.add(new_post)
                db.session.commit()
                flash('Post created successfully!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(f"Error creating post: {e}", exc_info=True)
                flash(f'Error creating post: {e}', 'danger')
        elif request.method == 'POST':
            for field, errors in form.errors.items():
                for error in errors:
                    flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')
        return render_template('create_post.html', form=form)

    @_app.route('/posts/<int:post_id>/delete', methods=['POST'])
    @login_required
    def delete_post(post_id):
        post = Post.query.get_or_404(post_id)
        if post.author != current_user:
            abort(403)
        db.session.delete(post)
        db.session.commit()
        return redirect(url_for('index'))

    @_app.route('/posts/<int:post_id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_post(post_id):
        post = Post.query.get_or_404(post_id)
        if post.author != current_user:
            abort(403)
        form = PostForm(obj=post)
        if not form.tags_string.data and request.method == 'GET':
            form.tags_string.data = ', '.join([tag.name for tag in post.tags])
        if form.validate_on_submit():
            post.title = form.title.data
            raw_content = form.content.data
            post.content = bleach.clean(
                raw_content,
                tags=ALLOWED_TAGS,
                attributes=ALLOWED_ATTRIBUTES,
                strip=True
            )
            post.categories = []
            for category_obj in form.categories.data:
                post.categories.append(category_obj)
            post.tags = []
            tags_string = form.tags_string.data
            if tags_string:
                tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
                for tag_name in tag_names:
                    tag = Tag.query.filter_by(name=tag_name).first()
                    if not tag:
                        tag = Tag(name=tag_name)
                        db.session.add(tag)
                    post.tags.append(tag)
            try:
                db.session.commit()
                flash('Post updated successfully!', 'success')
                return redirect(url_for('view_post', post_id=post.id))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(f"Error updating post {post.id}: {e}", exc_info=True)
                flash(f'Error updating post: {e}', 'danger')
        elif request.method == 'POST':
            for field, errors in form.errors.items():
                for error in errors:
                    flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')
        return render_template('edit_post.html', form=form, post=post)

    @_app.route('/login', methods=['GET', 'POST'])
    def login():
        _app.logger.info(f"Login route accessed. Method: {request.method}")
        if current_user.is_authenticated:
            _app.logger.info("User already authenticated. Redirecting to index.")
            return redirect(url_for('index'))

        form = LoginForm()
        _app.logger.info(f"Request form data on load: {request.form}") # Log form data regardless of method

        if form.validate_on_submit():
            _app.logger.info(f"Form validation successful. Username: '{form.username.data}'")
            user = User.query.filter_by(username=form.username.data).first()
            if user:
                _app.logger.info(f"User '{form.username.data}' found in database.")
                if user.check_password(form.password.data):
                    _app.logger.info(f"Password check successful for user '{form.username.data}'.")
                    login_user(user)
                    flash('Logged in successfully.', 'success')
                    next_page = request.args.get('next')
                    _app.logger.info(f"Redirecting to '{next_page or url_for('index')}' after successful login.")
                    return redirect(next_page or url_for('index'))
                else:
                    _app.logger.warning(f"Password check failed for user '{form.username.data}'.")
                    flash('Invalid username or password.', 'danger')
            else:
                _app.logger.warning(f"User '{form.username.data}' not found in database.")
                flash('Invalid username or password.', 'danger')
        elif request.method == 'POST':
            _app.logger.warning(f"Form validation failed. Errors: {form.errors}")
            for field, errors in form.errors.items():
                for error in errors:
                    flash(f"Validation error in {getattr(form, field).label.text}: {error}", 'warning')
            # It's important to flash a generic message if specific errors aren't caught or preferred
            if not form.errors: # If form.errors is empty but validation failed (e.g. CSRF)
                flash('Login attempt failed. Please check your input.', 'danger')


        return render_template('login.html', form=form)

    @_app.route('/logout')
    @login_required
    def logout():
        logout_user()
        return redirect(url_for('index'))

    @_app.route('/profile/<username>')
    @login_required
    def profile(username):
        user_profile = User.query.filter_by(username=username).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = 5
        posts_pagination = Post.query.with_parent(user_profile).order_by(Post.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        default_avatar_url = url_for('static', filename='img/default_avatar.png')
        return render_template('profile.html', user_profile=user_profile, posts_pagination=posts_pagination, default_avatar_url=default_avatar_url)

    @_app.route('/profile/edit', methods=['GET', 'POST'])
    @login_required
    def edit_profile():
        _app.logger.info(f"Edit profile route hit. Method: {request.method}")
        # When method is POST, WTForms populates from request.form.
        # obj=current_user is used for initial GET display and for providing defaults.
        form = ProfileEditForm(obj=current_user)
        default_avatar_url = url_for('static', filename='img/default_avatar.png')

        if request.method == 'POST':
            _app.logger.info(f"POST request. Request form data: {request.form}")
            _app.logger.info(f"POST request. Request files: {request.files}")
            _app.logger.info(f"Form is_submitted() check (implicitly part of validate_on_submit): {form.is_submitted()}")

        if form.validate_on_submit():
            _app.logger.info("Form validation successful.")

            # Log data before assignment to current_user
            _app.logger.info(f"Data from form: full_name='{form.full_name.data}', location='{form.location.data}', website_url='{form.website_url.data}', is_profile_public='{form.is_profile_public.data}'")
            _app.logger.info(f"Data from form (profile_info snippet): {form.profile_info.data[:100] if form.profile_info.data else ''}...")

            raw_profile_info = form.profile_info.data
            current_user.profile_info = bleach.clean(
                raw_profile_info,
                tags=ALLOWED_TAGS,
                attributes=ALLOWED_ATTRIBUTES,
                strip=True
            )
            current_user.full_name = form.full_name.data
            current_user.location = form.location.data
            current_user.website_url = form.website_url.data
            current_user.is_profile_public = form.is_profile_public.data # BooleanField handles conversion

            _app.logger.info(f"User {current_user.username} updating profile. After assignment to current_user (before photo):")
            _app.logger.info(f"  current_user.full_name: {current_user.full_name}")
            _app.logger.info(f"  current_user.location: {current_user.location}")
            _app.logger.info(f"  current_user.website_url: {current_user.website_url}")
            _app.logger.info(f"  current_user.is_profile_public: {current_user.is_profile_public}")
            _app.logger.info(f"  current_user.profile_info snippet: {current_user.profile_info[:100] if current_user.profile_info else ''}...")

            file = form.profile_photo.data # Correctly uses WTForms FileField data
            photo_update_attempted = False
            photo_saved_successfully = False

            if file and file.filename:
                _app.logger.info(f"Profile photo uploaded: {file.filename}, content_type: {file.content_type}")
                photo_update_attempted = True
                if allowed_file(file.filename):
                    try:
                        original_filename = secure_filename(file.filename)
                        ext = original_filename.rsplit('.', 1)[-1].lower()
                        unique_filename = f"{uuid.uuid4()}.{ext}"
                        upload_folder_path = _app.config['UPLOAD_FOLDER']
                        save_path = os.path.join(upload_folder_path, unique_filename)
                        os.makedirs(upload_folder_path, exist_ok=True)

                        _app.logger.info(f"Attempting to open image stream for {unique_filename}")
                        img = Image.open(file.stream)
                        _app.logger.info(f"Image opened successfully. Format: {img.format}, Size: {img.size}")

                        crop_x_str = request.form.get('crop_x')
                        crop_y_str = request.form.get('crop_y')
                        crop_width_str = request.form.get('crop_width')
                        crop_height_str = request.form.get('crop_height')
                        _app.logger.info(f"Crop data from form: x={crop_x_str}, y={crop_y_str}, w={crop_width_str}, h={crop_height_str}")

                        if crop_x_str and crop_y_str and crop_width_str and crop_height_str:
                            try:
                                crop_x = int(float(crop_x_str))
                                crop_y = int(float(crop_y_str))
                                crop_width = int(float(crop_width_str))
                                crop_height = int(float(crop_height_str))
                                if crop_width > 0 and crop_height > 0:
                                    _app.logger.info(f"Applying crop: ({crop_x}, {crop_y}, {crop_x + crop_width}, {crop_y + crop_height})")
                                    img = img.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
                                    _app.logger.info(f"Image cropped. New size: {img.size}")
                                else:
                                    _app.logger.warning("Crop width or height is zero or negative. Skipping crop.")
                            except ValueError as ve:
                                _app.logger.warning(f"Could not parse crop coordinates (ValueError: {ve}). Skipping crop.")
                        else:
                            _app.logger.info("Crop coordinates not provided or incomplete. Processing image without cropping.")

                        _app.logger.info(f"Resizing image (thumbnail 200x200). Current size: {img.size}")
                        img.thumbnail((200, 200))
                        _app.logger.info(f"Image resized. New size: {img.size}")

                        _app.logger.info(f"Saving image to: {save_path}")
                        img.save(save_path)
                        current_user.profile_photo_url = os.path.join('uploads/profile_pics', unique_filename)
                        photo_saved_successfully = True
                        _app.logger.info(f"Photo processed and saved. New URL: {current_user.profile_photo_url}")
                    except Exception as e:
                        _app.logger.error(f"Error processing profile photo: {e}", exc_info=True)
                        flash(f'Error processing profile photo: {e}', 'danger')
                else:
                    _app.logger.warning(f"Invalid file type for photo: {file.filename}")
                    flash('Invalid file type for photo.', 'warning')
            else:
                _app.logger.info("No profile photo uploaded or file has no filename.")

            try:
                _app.logger.info("Attempting to commit profile changes to database.")
                db.session.commit()
                _app.logger.info("Profile changes committed to database successfully.")
                if photo_update_attempted:
                    if photo_saved_successfully:
                        flash('Profile and photo updated successfully!', 'success')
                    else:
                        # This case means photo was attempted but failed; textual updates might still be committed.
                        flash('Profile information updated, but there was an issue with the photo upload.', 'warning')
                else:
                    flash('Profile updated successfully!', 'success') # No photo attempt, textual updates saved.
            except Exception as e: # Catching general Exception for now.
                db.session.rollback()
                _app.logger.error(f"Error saving profile changes to DB: {e}", exc_info=True)
                flash(f'Error saving profile changes: {e}', 'danger')
            return redirect(url_for('profile', username=current_user.username))
        elif request.method == 'POST':
            # This block executes if form.validate_on_submit() is False
            _app.logger.warning("Form validation failed on POST.")
            _app.logger.warning(f"Form errors: {form.errors}")
            for field_name, field_errors in form.errors.items():
                for error in field_errors:
                    flash(f"Error in {getattr(form, field_name).label.text}: {error}", 'warning')
        else: # GET request
            _app.logger.info("GET request: Displaying edit profile page.")

        return render_template('edit_profile.html', form=form, user_profile=current_user, default_avatar_url=default_avatar_url)

    @_app.route('/settings')
    @login_required
    def settings_page():
        return render_template('settings.html')

    @_app.route('/settings/change-password', methods=['GET', 'POST'])
    @login_required
    def change_password_page():
        form = ChangePasswordForm()
        if form.validate_on_submit():
            if current_user.check_password(form.current_password.data):
                current_user.set_password(form.new_password.data)
                db.session.commit()
                flash('Your password has been updated successfully!', 'success')
                return redirect(url_for('settings_page'))
            else:
                flash('Invalid current password.', 'danger')
        return render_template('change_password.html', form=form)

    @_app.route('/search')
    def search_results():
        query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = 5
        posts = []
        pagination = None
        if query:
            search_term = f"%{query}%"
            posts_query = Post.query.filter(
                or_(Post.title.ilike(search_term), Post.content.ilike(search_term))
            ).order_by(Post.created_at.desc())
            pagination = posts_query.paginate(page=page, per_page=per_page, error_out=False)
            posts = pagination.items
        return render_template('search_results.html', query=query, posts=posts, pagination=pagination)

    @_app.route('/about')
    def about_page():
        return render_template('about.html')

    @_app.route('/contact')
    def contact_page():
        return render_template('contact.html')

    @_app.route('/tag/<string:tag_slug>')
    def posts_by_tag(tag_slug):
        tag = Tag.query.filter_by(slug=tag_slug).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = 5
        pagination = Post.query.filter(Post.tags.contains(tag)).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('posts_by_tag.html', tag=tag, posts=posts, pagination=pagination)

    @_app.route('/api/settings/theme', methods=['POST'])
    @login_required
    def save_theme_preference():
        data = request.get_json()
        if not data or 'theme' not in data:
            return jsonify({'status': 'error', 'message': 'Missing theme data'}), 400
        new_theme = data['theme']
        if new_theme not in ['light', 'dark', 'system']:
            return jsonify({'status': 'error', 'message': 'Invalid theme value'}), 400
        current_user.theme = new_theme
        try:
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Theme updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(f"Error saving theme: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': 'Failed to save theme preference'}), 500

    @_app.route('/api/settings/accent_color', methods=['POST'])
    @login_required
    def save_accent_color_preference():
        data = request.get_json()
        if not data or 'accent_color' not in data:
            return jsonify({'status': 'error', 'message': 'Missing accent_color data'}), 400
        current_user.accent_color = data['accent_color']
        try:
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Accent color updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(f"Error saving accent_color: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': 'Failed to save accent color preference'}), 500

    @_app.errorhandler(403)
    def forbidden_page(error):
        return render_template('403.html'), 403

    @_app.errorhandler(404)
    def page_not_found(error):
        return render_template('404.html'), 404

    @_app.errorhandler(500)
    def server_error_page(error):
        _app.logger.error(f"Server error: {error}", exc_info=True)
        return render_template('500.html'), 500

    with _app.app_context():
        db.create_all() # This will create tables if they don't exist, based on the models.
                        # For PostgreSQL, this should typically be run once, or managed by migrations.
                        # Initial data seeding (like creating a default admin user) should be
                        # handled by a separate script (e.g., setup_db.py) or manually,
                        # especially for a persistent DB like PostgreSQL.
        _app.logger.info("Ensured database tables are created if they don't exist (db.create_all()).")
        # Default user creation logic removed to rely on PostgreSQL setup as per AGENTS.md

    return _app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
