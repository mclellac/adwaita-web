from datetime import datetime, timezone
from flask import Flask, render_template, url_for, abort, request, redirect, flash, jsonify, session
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
import re # For robust slugify

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

def generate_slug(text: str) -> str:
    """
    Generates a URL-friendly slug from a string.
    """
    if not text:
        return ""
    # Normalize (decompose) and encode to ASCII, ignoring errors (removes accents)
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text) # Remove non-word, non-space, non-hyphen characters
    text = re.sub(r'\s+', '-', text) # Replace spaces with hyphens
    text = re.sub(r'-+', '-', text) # Replace multiple hyphens with single hyphen
    text = text.strip('-') # Remove leading/trailing hyphens
    return text


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
        self.slug = generate_slug(name)

    def __repr__(self):
        return f'<Tag {self.name}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    def __init__(self, name):
        self.name = name
        self.slug = generate_slug(name)

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
    # It's useful to have access to the app logger here, but login_manager is defined globally.
    # We can get the current app's logger if this runs within an app context,
    # which it should when Flask-Login invokes it.
    logger = logging.getLogger(__name__) # Gets the 'app' logger if __name__ is 'app'
    if hasattr(Flask, 'current_app') and Flask.current_app:
        logger = Flask.current_app.logger

    logger.info(f"[LOAD_USER] Attempting to load user with ID: {user_id}")
    if user_id is None:
        logger.warning("[LOAD_USER] user_id is None. Cannot load user.")
        return None
    try:
        user = db.session.get(User, int(user_id))
        if user:
            logger.info(f"[LOAD_USER] User {user.username} (ID: {user.id}) loaded successfully from session.")
        else:
            logger.warning(f"[LOAD_USER] No user found for ID: {user_id}")
        return user
    except ValueError:
        logger.error(f"[LOAD_USER] Invalid user_id format: {user_id}. Cannot convert to int.")
        return None
    except Exception as e:
        logger.error(f"[LOAD_USER] Exception during user loading for ID {user_id}: {e}", exc_info=True)
        return None

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
        MAX_PROFILE_PHOTO_SIZE_BYTES = 2 * 1024 * 1024, # 2MB
        MAX_CONTENT_LENGTH = 5 * 1024 * 1024, # Max overall request size 5MB, includes photo + other form data
        POSTS_PER_PAGE = 5,
        ALLOWED_THEMES = {'light', 'dark', 'system'}, # Using a set for efficient lookup
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
        _app.logger.info(f"[ROUTE_ENTRY] / - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] / - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] / - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] / - current_user ID: {current_user.id}, Username: {current_user.username}")

        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        pagination = Post.query.order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('index.html', posts=posts, pagination=pagination)

    @_app.route('/posts/<int:post_id>', methods=['GET', 'POST'])
    def view_post(post_id):
        _app.logger.info(f"[ROUTE_ENTRY] /posts/{post_id} - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /posts/{post_id} - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /posts/{post_id} - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] /posts/{post_id} - current_user ID: {current_user.id}, Username: {current_user.username}")

        post = Post.query.get_or_404(post_id)
        form = CommentForm()
        delete_form = DeleteCommentForm()

        if request.method == 'POST':
            _app.logger.info(f"[FORM_DATA] /posts/{post_id} - Form data: {request.form}")
            if form.validate_on_submit() and current_user.is_authenticated:
                _app.logger.info(f"[ACTION] /posts/{post_id} - Posting comment by user {current_user.username}")
                comment = Comment(text=form.text.data, author=current_user, post_id=post_id)
                db.session.add(comment)
                db.session.commit()
                flash('Comment posted successfully!', 'success')
                return redirect(url_for('view_post', post_id=post_id))
            else:
                _app.logger.warning(f"[VALIDATION_ERROR] /posts/{post_id} - Comment form validation failed or user not authenticated. Errors: {form.errors}, Auth: {current_user.is_authenticated}")


        comments = post.comments.all()
        return render_template('post.html', post=post, form=form, comments=comments, delete_form=delete_form)

    @_app.route('/comment/<int:comment_id>/delete', methods=['POST'])
    @login_required
    def delete_comment(comment_id):
        _app.logger.info(f"[ROUTE_ENTRY] /comment/{comment_id}/delete - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /comment/{comment_id}/delete - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /comment/{comment_id}/delete - current_user ID: {current_user.id}, Username: {current_user.username}") # @login_required ensures this
        _app.logger.info(f"[FORM_DATA] /comment/{comment_id}/delete - Form data: {request.form}")

        delete_form = DeleteCommentForm() # This form is simple, might not need its own data logging unless issues arise
        if delete_form.validate_on_submit():
            comment = Comment.query.get_or_404(comment_id)
            if comment.author != current_user and comment.post.author != current_user:
                _app.logger.warning(f"[AUTH_FAIL] /comment/{comment_id}/delete - User {current_user.username} not authorized to delete comment.")
                abort(403)

            post_id = comment.post_id
            _app.logger.info(f"[ACTION] /comment/{comment_id}/delete - Deleting comment by user {current_user.username}")
            db.session.delete(comment)
            db.session.commit()
            flash('Comment deleted.', 'success')
            return redirect(url_for('view_post', post_id=post_id))
        else:
            _app.logger.warning(f"[VALIDATION_ERROR] /comment/{comment_id}/delete - Delete form validation failed. Errors: {delete_form.errors}")
            flash('Failed to delete comment. Invalid request.', 'danger')
            comment = Comment.query.get(comment_id) # Fetch again to redirect if possible
            if comment:
                return redirect(url_for('view_post', post_id=comment.post_id))
            return redirect(url_for('index'))

    @_app.route('/category/<string:category_slug>')
    def posts_by_category(category_slug):
        _app.logger.info(f"[ROUTE_ENTRY] /category/{category_slug} - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /category/{category_slug} - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /category/{category_slug} - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] /category/{category_slug} - current_user ID: {current_user.id}, Username: {current_user.username}")

        category = Category.query.filter_by(slug=category_slug).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        pagination = Post.query.with_parent(category).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('posts_by_category.html', category=category, posts=posts, pagination=pagination)

    @_app.route('/create', methods=['GET', 'POST'])
    @login_required
    def create_post():
        _app.logger.info(f"[ROUTE_ENTRY] /create - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /create - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /create - current_user ID: {current_user.id}, Username: {current_user.username}, Authenticated: {current_user.is_authenticated}") # DEBUG

        form = PostForm()
        if request.method == 'POST':
            _app.logger.info(f"[FORM_DATA] /create - Form data: {request.form}")

        if form.validate_on_submit():
            _app.logger.info(f"[ACTION] /create - Post form validated. Creating post by {current_user.username}")
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
                # Call helper for categories and tags
                _update_post_relations(new_post, form, db.session)
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

def _update_post_relations(post_instance, form, db_session):
    """Helper function to update categories and tags for a post."""
    # Categories
    post_instance.categories = [] # Clear existing categories first
    for category_obj in form.categories.data:
        post_instance.categories.append(category_obj)

    # Tags
    post_instance.tags = [] # Clear existing tags first
    tags_string = form.tags_string.data
    if tags_string:
        tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
        for tag_name in tag_names:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = Tag(name=tag_name) # Slug is generated in Tag's __init__
                db_session.add(tag)
            post_instance.tags.append(tag)
    # Note: db_session.commit() is not called here; it's handled by the calling route.


    @_app.route('/posts/<int:post_id>/delete', methods=['POST'])
    @login_required
    def delete_post(post_id):
        _app.logger.info(f"[ROUTE_ENTRY] /posts/{post_id}/delete - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /posts/{post_id}/delete - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /posts/{post_id}/delete - current_user ID: {current_user.id}, Username: {current_user.username}")
        _app.logger.info(f"[FORM_DATA] /posts/{post_id}/delete - Form data: {request.form}") # Though this form is button-only

        post = Post.query.get_or_404(post_id)
        if post.author != current_user:
            _app.logger.warning(f"[AUTH_FAIL] /posts/{post_id}/delete - User {current_user.username} not authorized to delete post.")
            abort(403)

        _app.logger.info(f"[ACTION] /posts/{post_id}/delete - Deleting post by user {current_user.username}")
        db.session.delete(post)
        db.session.commit()
        return redirect(url_for('index'))

    @_app.route('/posts/<int:post_id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_post(post_id):
        _app.logger.info(f"[ROUTE_ENTRY] /posts/{post_id}/edit - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /posts/{post_id}/edit - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /posts/{post_id}/edit - current_user ID: {current_user.id}, Username: {current_user.username}")

        post = Post.query.get_or_404(post_id)
        if post.author != current_user:
            _app.logger.warning(f"[AUTH_FAIL] /posts/{post_id}/edit - User {current_user.username} not authorized to edit post.")
            abort(403)

        form = PostForm(obj=post)
        if request.method == 'POST':
            _app.logger.info(f"[FORM_DATA] /posts/{post_id}/edit - Form data: {request.form}")

        if not form.tags_string.data and request.method == 'GET': # Populate tags on initial GET
            form.tags_string.data = ', '.join([tag.name for tag in post.tags])

        if form.validate_on_submit():
            _app.logger.info(f"[ACTION] /posts/{post_id}/edit - Post edit form validated. Updating post by {current_user.username}")
            post.title = form.title.data
            raw_content = form.content.data
            post.content = bleach.clean(
                raw_content,
                tags=ALLOWED_TAGS,
                attributes=ALLOWED_ATTRIBUTES,
                strip=True
            )
            # Call helper for categories and tags
            _update_post_relations(post, form, db.session)
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
        _app.logger.info(f"[ROUTE_ENTRY] /login - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /login (pre-login) - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /login (pre-login) - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated: # Should ideally not happen if redirection works, but good check
            _app.logger.info(f"[AUTH_STATE] /login (pre-login) - current_user ID: {current_user.id}, Username: {current_user.username}")
            return redirect(url_for('index'))

        form = LoginForm()
        if request.method == 'POST':
            _app.logger.info(f"[FORM_DATA] /login - Form data: {request.form}")

        if form.validate_on_submit():
            _app.logger.info(f"[ACTION] /login - Form validation successful. Username: '{form.username.data}'")
            user = User.query.filter_by(username=form.username.data).first()
            if user:
                _app.logger.info(f"[DB_QUERY] /login - User '{form.username.data}' found in database.")
                if user.check_password(form.password.data):
                    _app.logger.info(f"[AUTH_SUCCESS] /login - Password check successful for user '{form.username.data}'.")
                    login_user(user)
                    _app.logger.info(f"!!!! [DEBUG] Session after login_user: {dict(session)}") # DEBUG LINE
                    _app.logger.info(f"[SESSION_STATE] /login (post-login_user) - Session: {dict(session)}")
                    _app.logger.info(f"[AUTH_STATE] /login (post-login_user) - current_user authenticated: {current_user.is_authenticated}")
                    if current_user.is_authenticated:
                         _app.logger.info(f"[AUTH_STATE] /login (post-login_user) - current_user ID: {current_user.id}, Username: {current_user.username}")
                    else:
                        _app.logger.error(f"[AUTH_FAIL] /login (post-login_user) - login_user called but current_user is NOT authenticated!")

                    flash('Logged in successfully.', 'success')
                    next_page = request.args.get('next')
                    _app.logger.info(f"[REDIRECT] /login - Redirecting to '{next_page or url_for('index')}' after successful login.")
                    return redirect(next_page or url_for('index'))
                else:
                    _app.logger.warning(f"[AUTH_FAIL] /login - Password check failed for user '{form.username.data}'.")
                    flash('Invalid username or password.', 'danger')
            else:
                _app.logger.warning(f"[DB_QUERY] /login - User '{form.username.data}' not found in database.")
                flash('Invalid username or password.', 'danger')
        elif request.method == 'POST': # Only log validation errors if it was a POST and validate_on_submit failed
            _app.logger.warning(f"[VALIDATION_ERROR] /login - Form validation failed. Errors: {form.errors}")
            for field, errors in form.errors.items():
                flash(f"Validation error in {getattr(form, field).label.text}: {error}", 'warning')
            if not form.errors:
                flash('Login attempt failed. Please check your input.', 'danger')

        return render_template('login.html', form=form)

    @_app.route('/logout')
    @login_required
    def logout():
        _app.logger.info(f"[ROUTE_ENTRY] /logout - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /logout (pre-logout) - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /logout (pre-logout) - current_user ID: {current_user.id}, Username: {current_user.username}")

        user_id_before_logout = current_user.id
        logout_user()

        _app.logger.info(f"[ACTION] /logout - User {user_id_before_logout} logged out.")
        _app.logger.info(f"[SESSION_STATE] /logout (post-logout) - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /logout (post-logout) - current_user authenticated: {current_user.is_authenticated}")
        return redirect(url_for('index'))

    @_app.route('/profile/<username>')
    @login_required
    def profile(username):
        _app.logger.info(f"[ROUTE_ENTRY] /profile/{username} - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /profile/{username} - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /profile/{username} - current_user ID: {current_user.id}, Username: {current_user.username}")

        user_profile = User.query.filter_by(username=username).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        posts_pagination = Post.query.with_parent(user_profile).order_by(Post.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        default_avatar_url = url_for('static', filename='img/default_avatar.png')
        return render_template('profile.html', user_profile=user_profile, posts_pagination=posts_pagination, default_avatar_url=default_avatar_url)

    @_app.route('/profile/edit', methods=['GET', 'POST'])
    @login_required
    def edit_profile():
        _app.logger.info(f"[ROUTE_ENTRY] /profile/edit - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /profile/edit - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /profile/edit - current_user ID: {current_user.id}, Username: {current_user.username}")

        form = ProfileEditForm(obj=current_user) # obj=current_user for GET pre-population
        default_avatar_url = url_for('static', filename='img/default_avatar.png')

        if request.method == 'POST':
            _app.logger.info(f"[FORM_DATA] /profile/edit - Form data: {request.form}")
            _app.logger.info(f"[FILE_DATA] /profile/edit - Files: {request.files}")

        if form.validate_on_submit():
            _app.logger.info(f"[ACTION] /profile/edit - Profile edit form validated for user {current_user.username}")

            # Log data from form before assignment
            _app.logger.debug(f"[FORM_VALUES] /profile/edit - full_name='{form.full_name.data}', location='{form.location.data}', website_url='{form.website_url.data}', is_profile_public='{form.is_profile_public.data}'")
            _app.logger.debug(f"[FORM_VALUES] /profile/edit - profile_info snippet: {form.profile_info.data[:100] if form.profile_info.data else ''}...")

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
                _app.logger.info(f"Profile photo uploaded: {file.filename}, content_type: {file.content_type}, content_length: {file.content_length}")
                photo_update_attempted = True

                # Check file size against configured limit
                if file.content_length > _app.config['MAX_PROFILE_PHOTO_SIZE_BYTES']:
                    _app.logger.warning(f"Profile photo '{file.filename}' exceeds max size of {_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES']} bytes.")
                    flash(f"Profile photo is too large. Maximum size is {_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES'] // 1024 // 1024}MB.", 'danger')
                    # We will still try to commit other profile changes below, but photo_saved_successfully will remain false.
                elif not allowed_file(file.filename):
                    _app.logger.warning(f"Invalid file type for photo: {file.filename}")
                    flash('Invalid file type for photo. Allowed types are png, jpg, jpeg, gif.', 'warning')
                else:
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
                                        # Attempt to convert all first, to catch any single bad value
                                crop_x = int(float(crop_x_str))
                                crop_y = int(float(crop_y_str))
                                crop_width = int(float(crop_width_str))
                                crop_height = int(float(crop_height_str))

                                if crop_width > 0 and crop_height > 0:
                                    _app.logger.info(f"Applying crop: ({crop_x}, {crop_y}, {crop_x + crop_width}, {crop_y + crop_height})")
                                    img = img.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
                                    _app.logger.info(f"Image cropped. New size: {img.size}")
                                else:
                                    _app.logger.warning("Crop width or height is zero, negative, or invalid. Skipping crop.")
                                    flash("Invalid crop dimensions provided. Photo processed without cropping.", 'warning')
                            except ValueError:
                                _app.logger.warning(f"Could not parse one or more crop coordinates to numbers. Values: x='{crop_x_str}', y='{crop_y_str}', w='{crop_width_str}', h='{crop_height_str}'. Skipping crop.")
                                flash("Invalid crop coordinates provided. Photo processed without cropping.", 'warning')
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
            _app.logger.warning(f"[VALIDATION_ERROR] /profile/edit - Form validation failed. Errors: {form.errors}")
            for field_name, field_errors in form.errors.items():
                for error in field_errors: # Iterate through list of errors for a field
                    flash(f"Error in {getattr(form, field_name).label.text}: {error}", 'warning')
        # No specific 'else' for GET needed if only logging POST issues / form population is by obj=

        return render_template('edit_profile.html', form=form, user_profile=current_user, default_avatar_url=default_avatar_url)

    @_app.route('/settings')
    @login_required
    def settings_page():
        _app.logger.info(f"[ROUTE_ENTRY] /settings - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /settings - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /settings - current_user ID: {current_user.id}, Username: {current_user.username}")
        return render_template('settings.html')

    @_app.route('/settings/change-password', methods=['GET', 'POST'])
    @login_required
    def change_password_page():
        _app.logger.info(f"[ROUTE_ENTRY] /settings/change-password - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /settings/change-password - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /settings/change-password - current_user ID: {current_user.id}, Username: {current_user.username}")

        form = ChangePasswordForm()
        if request.method == 'POST':
            _app.logger.info(f"[FORM_DATA] /settings/change-password - Form data: {request.form}")

        if form.validate_on_submit():
            _app.logger.info(f"[ACTION] /settings/change-password - Change password form validated for user {current_user.username}.")
            if current_user.check_password(form.current_password.data):
                current_user.set_password(form.new_password.data)
                db.session.commit()
                _app.logger.info(f"[AUTH_SUCCESS] /settings/change-password - Password changed successfully for user {current_user.username}.")
                flash('Your password has been updated successfully!', 'success')
                return redirect(url_for('settings_page'))
            else:
                _app.logger.warning(f"[AUTH_FAIL] /settings/change-password - Invalid current password for user {current_user.username}.")
                flash('Invalid current password.', 'danger')
        elif request.method == 'POST': # Log validation errors if POST and validation failed
            _app.logger.warning(f"[VALIDATION_ERROR] /settings/change-password - Form validation failed. Errors: {form.errors}")
            for field, errors_list in form.errors.items(): # field_errors is a list
                 for error in errors_list:
                    flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')

        return render_template('change_password.html', form=form)

    @_app.route('/search')
    def search_results():
        _app.logger.info(f"[ROUTE_ENTRY] /search - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /search - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /search - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] /search - current_user ID: {current_user.id}, Username: {current_user.username}")

        query = request.args.get('q', '').strip()
        _app.logger.info(f"[QUERY_PARAM] /search - Search query: '{query}'")
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
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
        _app.logger.info(f"[ROUTE_ENTRY] /about - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /about - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /about - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] /about - current_user ID: {current_user.id}, Username: {current_user.username}")
        return render_template('about.html')

    @_app.route('/contact')
    def contact_page():
        _app.logger.info(f"[ROUTE_ENTRY] /contact - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /contact - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /contact - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] /contact - current_user ID: {current_user.id}, Username: {current_user.username}")
        return render_template('contact.html')

    @_app.route('/tag/<string:tag_slug>')
    def posts_by_tag(tag_slug):
        _app.logger.info(f"[ROUTE_ENTRY] /tag/{tag_slug} - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /tag/{tag_slug} - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /tag/{tag_slug} - current_user authenticated: {current_user.is_authenticated}")
        if current_user.is_authenticated:
            _app.logger.info(f"[AUTH_STATE] /tag/{tag_slug} - current_user ID: {current_user.id}, Username: {current_user.username}")

        tag = Tag.query.filter_by(slug=tag_slug).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        pagination = Post.query.filter(Post.tags.contains(tag)).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('posts_by_tag.html', tag=tag, posts=posts, pagination=pagination)

    @_app.route('/api/settings/theme', methods=['POST'])
    @login_required
    def save_theme_preference():
        _app.logger.info(f"[ROUTE_ENTRY] /api/settings/theme - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /api/settings/theme - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /api/settings/theme - current_user ID: {current_user.id}, Username: {current_user.username}")

        data = request.get_json()
        _app.logger.info(f"[JSON_DATA] /api/settings/theme - Received data: {data}")

        if not data or 'theme' not in data:
            _app.logger.warning(f"[VALIDATION_ERROR] /api/settings/theme - Missing theme data. Data: {data}")
            return jsonify({'status': 'error', 'message': 'Missing theme data'}), 400

        new_theme = data['theme']
        if new_theme not in _app.config['ALLOWED_THEMES']:
            _app.logger.warning(f"[VALIDATION_ERROR] /api/settings/theme - Invalid theme value: {new_theme}")
            return jsonify({'status': 'error', 'message': 'Invalid theme value'}), 400

        _app.logger.info(f"[ACTION] /api/settings/theme - User {current_user.username} updating theme to {new_theme}")
        current_user.theme = new_theme
        try:
            db.session.commit()
            _app.logger.info(f"[DB_SUCCESS] /api/settings/theme - Theme preference for {current_user.username} saved.")
            return jsonify({'status': 'success', 'message': 'Theme updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(f"[DB_ERROR] /api/settings/theme - Error saving theme for {current_user.username}: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': 'Failed to save theme preference'}), 500

    @_app.route('/api/settings/accent_color', methods=['POST'])
    @login_required
    def save_accent_color_preference():
        _app.logger.info(f"[ROUTE_ENTRY] /api/settings/accent_color - Method: {request.method}")
        _app.logger.info(f"[SESSION_STATE] /api/settings/accent_color - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] /api/settings/accent_color - current_user ID: {current_user.id}, Username: {current_user.username}")

        data = request.get_json()
        _app.logger.info(f"[JSON_DATA] /api/settings/accent_color - Received data: {data}")

        if not data or 'accent_color' not in data:
            _app.logger.warning(f"[VALIDATION_ERROR] /api/settings/accent_color - Missing accent_color data. Data: {data}")
            return jsonify({'status': 'error', 'message': 'Missing accent_color data'}), 400

        _app.logger.info(f"[ACTION] /api/settings/accent_color - User {current_user.username} updating accent_color to {data['accent_color']}")
        current_user.accent_color = data['accent_color']
        try:
            db.session.commit()
            _app.logger.info(f"[DB_SUCCESS] /api/settings/accent_color - Accent color preference for {current_user.username} saved.")
            return jsonify({'status': 'success', 'message': 'Accent color updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(f"[DB_ERROR] /api/settings/accent_color - Error saving accent_color for {current_user.username}: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': 'Failed to save accent color preference'}), 500

    @_app.errorhandler(403)
    def forbidden_page(error):
        _app.logger.warning(f"[ERROR_HANDLER] 403 Forbidden - Path: {request.path} - Error: {error}")
        _app.logger.info(f"[SESSION_STATE] 403 - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] 403 - current_user authenticated: {current_user.is_authenticated}")
        return render_template('403.html'), 403

    @_app.errorhandler(404)
    def page_not_found(error):
        _app.logger.warning(f"[ERROR_HANDLER] 404 Not Found - Path: {request.path} - Error: {error}")
        _app.logger.info(f"[SESSION_STATE] 404 - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] 404 - current_user authenticated: {current_user.is_authenticated}")
        return render_template('404.html'), 404

    @_app.errorhandler(500)
    def server_error_page(error):
        _app.logger.error(f"[ERROR_HANDLER] 500 Server Error - Path: {request.path} - Error: {error}", exc_info=True)
        _app.logger.info(f"[SESSION_STATE] 500 - Session: {dict(session)}")
        _app.logger.info(f"[AUTH_STATE] 500 - current_user authenticated: {current_user.is_authenticated}")
        return render_template('500.html'), 500

    with _app.app_context():
        _app.logger.info("Initializing database tables (db.create_all())...")
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
