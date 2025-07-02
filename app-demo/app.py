import logging
import os
import re  # For robust slugify
import urllib.parse
import uuid
from datetime import datetime, timezone

import bleach
from flask import (
    Flask,
    abort,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect, FlaskForm
from markupsafe import Markup  # For escaping JS
from PIL import Image
from sqlalchemy import desc, or_
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from wtforms import (
    BooleanField,
    FileField,
    PasswordField,
    StringField,
    SubmitField,
    TextAreaField,
)
from wtforms.validators import DataRequired, EqualTo, Length, Optional
from wtforms.widgets import CheckboxInput, ListWidget
from wtforms_sqlalchemy.fields import QuerySelectMultipleField

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
ALLOWED_STYLES = []

def generate_slug(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'-+', '-', text)
    text = text.strip('-')
    return text

# Forms
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
    tags_string = StringField(
        'Tags (comma-separated)',
        validators=[Optional(), Length(max=250)]
    )
    save_draft = SubmitField('Save Draft')
    publish = SubmitField('Publish')

class ProfileEditForm(FlaskForm):
    full_name = StringField('Display Name', validators=[Optional(), Length(max=120)])
    profile_info = TextAreaField(
        'Bio (supports some HTML)',
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

class DeleteCommentForm(FlaskForm):
    submit = SubmitField('Delete')

class DeletePostForm(FlaskForm):
    submit = SubmitField('Delete Post')

# Helper
def allowed_file(filename):
    from flask import current_app
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config[
               'ALLOWED_EXTENSIONS'
           ]

# Models
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
    posts = db.relationship(
        'Post', backref='author', lazy=True, order_by=desc("created_at")
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.id)

post_categories = db.Table(
    'post_categories',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

post_tags = db.Table(
    'post_tags',
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
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    categories = db.relationship(
        'Category',
        secondary=post_categories,
        lazy='subquery',
        backref=db.backref('posts', lazy=True)
    )
    tags = db.relationship(
        'Tag',
        secondary=post_tags,
        lazy='subquery',
        backref=db.backref('posts', lazy=True)
    )
    is_published = db.Column(db.Boolean, nullable=False, default=True)
    published_at = db.Column(db.DateTime, nullable=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('comments', lazy='dynamic'))

Post.comments = db.relationship(
    'Comment', backref='post', lazy='dynamic', order_by=desc(Comment.created_at)
)

@login_manager.user_loader
def load_user(user_id):
    logger = logging.getLogger(__name__)
    if hasattr(Flask, 'current_app') and Flask.current_app:
        logger = Flask.current_app.logger
    logger.info(f"[LOAD_USER] Attempting to load user with ID: {user_id}")
    if user_id is None:
        logger.warning("[LOAD_USER] user_id is None. Cannot load user.")
        return None
    try:
        user = db.session.get(User, int(user_id))
        if user:
            logger.info(
                f"[LOAD_USER] User {user.username} (ID: {user.id}) "
                f"loaded successfully from session."
            )
        else:
            logger.warning(f"[LOAD_USER] No user found for ID: {user_id}")
        return user
    except ValueError:
        logger.error(
            f"[LOAD_USER] Invalid user_id format: {user_id}. "
            f"Cannot convert to int."
        )
        return None
    except Exception as e:
        logger.error(
            f"[LOAD_USER] Exception during user loading for ID {user_id}: {e}",
            exc_info=True
        )
        return None

def flash_form_errors(form):
    """Flashes all errors from a WTForm instance."""
    for field, errors in form.errors.items():
        for error in errors:
            flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')

def create_app(config_overrides=None):
    _app = Flask(__name__)

    if not _app.debug:
        _app.logger.setLevel(logging.INFO)
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        _app.logger.addHandler(stream_handler)

    _app.config.from_mapping(
        SECRET_KEY=os.environ.get(
            'FLASK_SECRET_KEY',
            'a_default_very_secret_key_for_development_only'
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER='app-demo/static/uploads/profile_pics',
        ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg', 'gif'},
        MAX_PROFILE_PHOTO_SIZE_BYTES=2 * 1024 * 1024,  # 2MB
        MAX_CONTENT_LENGTH=5 * 1024 * 1024,  # Max overall request size 5MB
        POSTS_PER_PAGE=5,
        ALLOWED_THEMES={'light', 'dark', 'system'},
    )
    db_user = os.environ.get('POSTGRES_USER', 'postgres')
    db_pass = os.environ.get('POSTGRES_PASSWORD')
    db_host = os.environ.get('POSTGRES_HOST', 'localhost')
    db_name = os.environ.get('POSTGRES_DB', 'appdb')
    if db_pass:
        default_db_uri = f"postgresql://{db_user}:{db_pass}@{db_host}/{db_name}"
    else:
        default_db_uri = f"postgresql://{db_user}@{db_host}/{db_name}"
    database_url = os.environ.get('DATABASE_URL', default_db_uri)
    _app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    log_db_uri = database_url
    if db_pass:
        log_db_uri = f"postgresql://{db_user}:********@{db_host}/{db_name}"
    if os.environ.get('DATABASE_URL') and db_pass:
        try:
            parsed_url = urllib.parse.urlparse(os.environ.get('DATABASE_URL'))
            if parsed_url.password:
                log_db_uri = parsed_url._replace(password="********").geturl()
            else:
                log_db_uri = os.environ.get('DATABASE_URL')
        except Exception:
            log_db_uri = "DATABASE_URL (details hidden for security)"
    _app.logger.info(f"Database URI configured to: {log_db_uri}")
    _app.logger.info(f"Upload folder set to: {_app.config['UPLOAD_FOLDER']}")
    _app.logger.info(
        f"Allowed image extensions: {_app.config['ALLOWED_EXTENSIONS']}"
    )
    _app.logger.info(
        f"Max profile photo size: {_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES']} "
        f"bytes"
    )
    _app.logger.info(f"Posts per page: {_app.config['POSTS_PER_PAGE']}")
    _app.logger.info(f"Flask App Debug Mode: {_app.debug}")

    if config_overrides:
        _app.config.from_mapping(config_overrides)

    db.init_app(_app)
    login_manager.init_app(_app)
    login_manager.login_view = 'login'
    csrf.init_app(_app)

    @_app.template_filter('urlencode')
    def urlencode_filter(s):
        if hasattr(s, 'unescape'):
            s = s.unescape()
        s = str(s)
        return urllib.parse.quote_plus(s)

    @_app.template_filter('escapejs')
    def escapejs_filter(value):
        """Escape strings for use in JavaScript string literals."""
        if value is None:
            return ''
        if not isinstance(value, str):
            value = str(value)

        escaped = value.replace('\\', '\\\\')
        escaped = escaped.replace("'", "\\'")
        escaped = escaped.replace('"', '\\"')
        escaped = escaped.replace('\n', '\\n')
        escaped = escaped.replace('\r', '\\r')
        escaped = escaped.replace('/', '\\/')
        return Markup(escaped)

    @_app.context_processor
    def inject_global_template_variables():
        return {
            'current_user': current_user,
            'default_avatar_url': url_for(
                'static', filename='img/default_avatar.png'
            )
        }

    @_app.route('/')
    def index():
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: '/', Method: {request.method}, "
            f"IP: {request.remote_addr}"
        )
        _app.logger.debug(f"[SESSION_STATE] Session data: {dict(session)}")
        if current_user.is_authenticated:
            _app.logger.debug(
                f"[AUTH_STATE] User: {current_user.username} "
                f"(ID: {current_user.id}) is authenticated."
            )
            _app.logger.info(
                f"[THEME_CHECK] User {current_user.username}: "
                f"theme='{current_user.theme}', "
                f"accent_color='{current_user.accent_color}' "
                f"before rendering index."
            )
        else:
            _app.logger.debug("[AUTH_STATE] User is anonymous.")
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        _app.logger.debug(
            f"Fetching published posts for index page {page}, "
            f"{per_page} posts per page."
        )
        try:
            query = Post.query.filter_by(is_published=True).order_by(
                Post.published_at.desc(), Post.created_at.desc()
            )
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            posts = pagination.items
            _app.logger.debug(
                f"Found {len(posts)} published posts for page {page}. "
                f"Total published posts from pagination: {pagination.total}"
            )
        except Exception as e:
            _app.logger.error(
                f"Error fetching posts for index page: {e}", exc_info=True
            )
            flash("Error loading posts. Please try again later.", "danger")
            posts = []
            pagination = None
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'index.html', posts=posts, pagination=pagination
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/posts/<int:post_id>', methods=['GET', 'POST'])
    def view_post(post_id):
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /posts/{post_id}, Method: {request.method}, "
            f"IP: {request.remote_addr}"
        )
        post = Post.query.get_or_404(post_id)
        if not post.is_published:
            if not current_user.is_authenticated or current_user != post.author:
                user_desc = (
                    current_user.username if current_user.is_authenticated
                    else 'Anonymous'
                )
                _app.logger.warning(
                    f"User {user_desc} attempted to view unpublished "
                    f"post ID: {post_id}. Denying access with 404."
                )
                abort(404)
            _app.logger.debug(
                f"Author {current_user.username} is viewing their own unpublished post "
                f"'{post.title}' (ID: {post_id})."
            )
        else:
            _app.logger.debug(f"Viewing published post '{post.title}' (ID: {post_id}).")
        form = CommentForm()
        delete_form = DeleteCommentForm()
        if request.method == 'POST':
            _app.logger.debug(
                f"[FORM_SUBMISSION] Comment form submitted for post {post_id}. "
                f"Data: {request.form}"
            )
            if not current_user.is_authenticated:
                _app.logger.warning(
                    f"[AUTH_FAILURE] Anonymous user tried to comment on post {post_id}."
                )
                flash('You must be logged in to comment.', 'danger')
                return redirect(
                    url_for('login', next=url_for('view_post', post_id=post_id))
                )
            if form.validate_on_submit():
                _app.logger.info(
                    f"User {current_user.username} submitting comment on "
                    f"post {post_id}."
                )
                try:
                    comment = Comment(
                        text=form.text.data, author=current_user, post_id=post_id
                    )
                    db.session.add(comment)
                    db.session.commit()
                    _app.logger.info(
                        f"Comment (ID: {comment.id}) by {current_user.username} "
                        f"added to post {post_id}."
                    )
                    flash('Comment posted successfully!', 'success')
                    return redirect(url_for('view_post', post_id=post_id))
                except Exception as e:
                    db.session.rollback()
                    _app.logger.error(
                        f"Error saving comment for post {post_id} by user "
                        f"{current_user.username}: {e}", exc_info=True
                    )
                    flash('Error posting comment. Please try again.', 'danger')
            else:
                _app.logger.warning(
                    f"[VALIDATION_ERROR] Comment form validation failed for "
                    f"post {post_id} by user {current_user.username}. "
                    f"Errors: {form.errors}"
                )
                flash_form_errors(form)
        comments = post.comments.all()
        _app.logger.debug(f"Fetched {len(comments)} comments for post {post_id}.")

        related_posts = []
        if post.is_published and post.tags:
            try:
                tag_ids = [tag.id for tag in post.tags]
                _app.logger.debug(
                    f"Finding related posts for post {post_id} based on "
                    f"tag IDs: {tag_ids}"
                )

                candidate_posts = {}
                for tag_item in post.tags:
                    posts_with_tag = Post.query.join(Post.tags).filter(
                        Tag.id == tag_item.id,
                        Post.id != post.id,
                        Post.is_published
                    ).all()
                    for p in posts_with_tag:
                        candidate_posts[p.id] = p

                sorted_candidates = sorted(
                    list(candidate_posts.values()),
                    key=lambda p_item: p_item.published_at or p_item.created_at,
                    reverse=True
                )
                related_posts = sorted_candidates[:4]
                _app.logger.debug(
                    f"Found {len(related_posts)} related posts for post {post_id}."
                )

            except Exception as e:
                _app.logger.error(
                    f"Error finding related posts for post {post_id}: {e}",
                    exc_info=True
                )
                related_posts = []

        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'post.html', post=post, form=form, comments=comments,
            delete_form=delete_form, related_posts=related_posts
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/comment/<int:comment_id>/delete', methods=['POST'])
    @login_required
    def delete_comment(comment_id):
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /comment/{comment_id}/delete, "
            f"Method: {request.method}, User: {current_user.username}"
        )
        delete_form = DeleteCommentForm()
        if delete_form.validate_on_submit():
            comment = Comment.query.get_or_404(comment_id)
            post_id = comment.post_id
            _app.logger.info(
                f"User {current_user.username} attempting to delete "
                f"comment ID: {comment_id} from post ID: {post_id}."
            )
            can_delete = False
            if comment.author == current_user:
                _app.logger.debug(
                    f"User {current_user.username} is the author of comment {comment_id}. "
                    f"Allowing delete."
                )
                can_delete = True
            elif comment.post.author == current_user:
                _app.logger.debug(
                    f"User {current_user.username} is the author of post {post_id}. "
                    f"Allowing delete of comment {comment_id}."
                )
                can_delete = True
            if not can_delete:
                _app.logger.warning(
                    f"User {current_user.username} is not authorized to delete "
                    f"comment {comment_id}. Author: {comment.author.username}, "
                    f"Post Author: {comment.post.author.username}."
                )
                abort(403)
            try:
                db.session.delete(comment)
                db.session.commit()
                flash('Comment deleted.', 'success')
                _app.logger.info(
                    f"Comment ID: {comment_id} successfully deleted by "
                    f"{current_user.username}."
                )
                return redirect(url_for('view_post', post_id=post_id))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(
                    f"Error deleting comment ID: {comment_id} by user "
                    f"{current_user.username}: {e}",
                    exc_info=True
                )
                flash('Error deleting comment. Please try again.', 'danger')
                return redirect(url_for('view_post', post_id=post_id))
        else:
            _app.logger.warning(
                f"Delete comment form validation failed for comment ID: {comment_id}. "
                f"Errors: {delete_form.errors}"
            )
            flash(
                'Failed to delete comment. Invalid request or session expired.', 'danger'
            )
            comment_for_redirect = Comment.query.get(comment_id)
            if comment_for_redirect:
                return redirect(
                    url_for('view_post', post_id=comment_for_redirect.post_id)
                )
            return redirect(url_for('index'))

    @_app.route('/category/<string:category_slug>')
    def posts_by_category(category_slug):
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /category/{category_slug}, Method: {request.method}, "
            f"IP: {request.remote_addr}"
        )
        category = Category.query.filter_by(slug=category_slug).first_or_404()
        _app.logger.debug(
            f"Fetching posts for category '{category.name}' (Slug: {category_slug})."
        )
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        try:
            query = Post.query.with_parent(category).filter_by(
                is_published=True
            ).order_by(
                Post.published_at.desc(), Post.created_at.desc()
            )
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            posts = pagination.items
            _app.logger.debug(
                f"Found {len(posts)} published posts for category '{category.name}' "
                f"on page {page}. Total: {pagination.total}"
            )
        except Exception as e:
            _app.logger.error(
                f"Error fetching posts for category {category_slug}: {e}", exc_info=True
            )
            flash(f"Error loading posts for category {category.name}.", "danger")
            posts = []
            pagination = None
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'posts_by_category.html', category=category,
            posts=posts, pagination=pagination
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/create', methods=['GET', 'POST'])
    @login_required
    def create_post():
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /create, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        form = PostForm()
        if request.method == 'POST':
            log_form_data = {
                key: (value[:200] + '...' if isinstance(value, str)
                      and len(value) > 200 else value)
                for key, value in request.form.items()
            }
            _app.logger.debug(
                f"[FORM_SUBMISSION] Create post form submitted by {current_user.username}. "
                f"Data (truncated): {log_form_data}"
            )
        if form.validate_on_submit():
            title = form.title.data
            raw_content = form.content.data
            _app.logger.debug(
                f"Raw content length for new post by {current_user.username}: "
                f"{len(raw_content)}"
            )
            content = bleach.clean(
                raw_content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True
            )
            _app.logger.debug(f"Sanitized content length for new post: {len(content)}")
            is_published_intent = form.publish.data
            try:
                _app.logger.info(
                    f"User {current_user.username} creating post titled '{title}'. "
                    f"Intent: {'Publish' if is_published_intent else 'Save Draft'}."
                )
                new_post = Post(
                    title=title, content=content, author=current_user,
                    is_published=is_published_intent
                )
                if is_published_intent:
                    new_post.published_at = datetime.now(timezone.utc)
                    _app.logger.info(
                        f"Post '{title}' by {current_user.username} will be published at "
                        f"{new_post.published_at}."
                    )
                else:
                    new_post.published_at = None
                    _app.logger.info(
                        f"Post '{title}' by {current_user.username} will be saved as a draft."
                    )
                db.session.add(new_post)
                _update_post_relations(new_post, form, db.session)
                db.session.commit()
                _app.logger.info(
                    f"Post '{new_post.title}' (ID: {new_post.id}, "
                    f"Published: {new_post.is_published}) "
                    f"created successfully by user {current_user.username}."
                )
                if new_post.is_published:
                    flash('Post published successfully!', 'success')
                    return redirect(url_for('view_post', post_id=new_post.id))
                else:
                    flash('Post saved as draft successfully!', 'success')
                    return redirect(url_for('view_post', post_id=new_post.id))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(
                    f"Error creating post '{title}' by user {current_user.username} "
                    f"(publish intent: {is_published_intent}): {e}", exc_info=True
                )
                flash(
                    f'Error creating post: Could not save to database. Details: {str(e)}',
                    'danger'
                )
        elif request.method == 'POST':
            _app.logger.warning(
                f"Post creation form validation failed for user {current_user.username}. "
                f"Errors: {form.errors}"
            )
            flash(
                'Failed to create post. Please check the errors highlighted below.',
                'danger'
            )
            flash_form_errors(form)
        else:
            _app.logger.debug(
                f"Displaying create post form to user {current_user.username}."
            )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template('create_post.html', form=form)
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    def _update_post_relations(post_instance, form, db_session):
        _app.logger.debug(
            f"Updating relations for post ID: {post_instance.id if post_instance.id else 'NEW'}"
        )
        selected_categories = form.categories.data
        _app.logger.debug(
            f"Selected categories from form: {[c.name for c in selected_categories]}"
        )
        post_instance.categories = []
        for category_obj in selected_categories:
            post_instance.categories.append(category_obj)
            _app.logger.debug(f"Associated category '{category_obj.name}' with post.")
        if not selected_categories:
            _app.logger.debug("No categories selected for post.")
        post_instance.tags = []
        tags_string = form.tags_string.data
        _app.logger.debug(f"Tags string from form: '{tags_string}'")
        if tags_string:
            tag_names = [
                name.strip() for name in tags_string.split(',') if name.strip()
            ]
            _app.logger.debug(f"Processed tag names: {tag_names}")
            for tag_name in tag_names:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    _app.logger.info(f"Tag '{tag_name}' not found, creating new tag.")
                    tag = Tag(name=tag_name)
                    db_session.add(tag)
                else:
                    _app.logger.debug(f"Found existing tag '{tag.name}' (ID: {tag.id}).")
                post_instance.tags.append(tag)
                _app.logger.debug(f"Associated tag '{tag.name}' with post.")
        else:
            _app.logger.debug("No tags provided for post.")

    @_app.route('/posts/<int:post_id>/delete', methods=['POST'])
    @login_required
    def delete_post(post_id):
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /posts/{post_id}/delete, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        post = Post.query.get_or_404(post_id)
        _app.logger.info(
            f"User {current_user.username} attempting to delete post '{post.title}' "
            f"(ID: {post_id})."
        )
        if post.author != current_user:
            _app.logger.warning(
                f"User {current_user.username} is not authorized to delete post {post_id} "
                f"(Author: {post.author.username}). Aborting with 403."
            )
            abort(403)
        try:
            db.session.delete(post)
            db.session.commit()
            _app.logger.info(
                f"Post ID: {post_id} ('{post.title}') successfully deleted by "
                f"{current_user.username}."
            )
            flash('Post deleted successfully!', 'success')
        except Exception as e:
            db.session.rollback()
            _app.logger.error(
                f"Error deleting post ID: {post_id} by user {current_user.username}: {e}",
                exc_info=True
            )
            flash('Error deleting post. Please try again.', 'danger')
        return redirect(url_for('dashboard'))

    @_app.route('/posts/<int:post_id>/edit', methods=['GET', 'POST'])
    @login_required
    def edit_post(post_id):
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /posts/{post_id}/edit, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        post = Post.query.get_or_404(post_id)
        _app.logger.debug(
            f"User {current_user.username} editing post '{post.title}' (ID: {post_id})."
        )

        if post.author != current_user:
            _app.logger.warning(
                f"User {current_user.username} is not authorized to edit post {post_id} "
                f"(Author: {post.author.username}). Aborting with 403."
            )
            abort(403)

        form = PostForm(obj=post)
        delete_form = DeletePostForm(prefix=f"del-eff-post-{post.id}-")

        if form.validate_on_submit():
            _app.logger.info(
                f"User {current_user.username} updating post '{post.title}' (ID: {post_id})."
            )
            post.title = form.title.data
            raw_content = form.content.data
            _app.logger.debug(
                f"Raw content length for edited post {post_id}: {len(raw_content)}"
            )
            post.content = bleach.clean(
                raw_content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True
            )
            _app.logger.debug(
                f"Sanitized content length for edited post {post_id}: {len(post.content)}"
            )
            is_published_intent = form.publish.data
            _app.logger.info(
                f"Updating post {post_id}. Publish intent: {is_published_intent}. "
                f"Current published state: {post.is_published}"
            )
            post.is_published = is_published_intent
            if is_published_intent:
                if post.published_at is None:
                    post.published_at = datetime.now(timezone.utc)
                    _app.logger.info(
                        f"Post {post_id} is being published at {post.published_at}."
                    )
            else:
                post.published_at = None
                _app.logger.info(
                    f"Post {post_id} is being saved as a draft. Cleared/nulled published_at."
                )
            _update_post_relations(post, form, db.session)
            try:
                db.session.commit()
                _app.logger.info(
                    f"Post ID: {post.id} ('{post.title}', Published: {post.is_published}) "
                    f"updated successfully by {current_user.username}."
                )
                if post.is_published:
                    flash('Post updated and published successfully!', 'success')
                else:
                    flash('Post updated and saved as draft successfully!', 'success')
                return redirect(url_for('view_post', post_id=post.id))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(
                    f"Error updating post {post.id} ('{post.title}') by "
                    f"{current_user.username} (publish intent: {is_published_intent}): {e}",
                    exc_info=True
                )
                flash(f'Error updating post: {e}', 'danger')

        elif request.method == 'POST':
            _app.logger.warning(
                f"Edit post form validation failed for post {post_id} "
                f"by user {current_user.username}. Errors: {form.errors}"
            )
            flash_form_errors(form)

        if request.method == 'GET':
            if not form.tags_string.data and post.tags:
                form.tags_string.data = ', '.join([tag.name for tag in post.tags])
                _app.logger.debug(
                    f"Populated tags_string for GET: '{form.tags_string.data}'"
                )

        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'edit_post.html', form=form, post=post, delete_form=delete_form
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/login', methods=['GET', 'POST'])
    def login():
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /login, Method: {request.method}, IP: {request.remote_addr}"
        )
        if current_user.is_authenticated:
            _app.logger.debug(
                f"User {current_user.username} already authenticated, "
                f"redirecting to index."
            )
            return redirect(url_for('index'))
        form = LoginForm()
        if request.method == 'POST':
             _app.logger.debug(
                 f"[FORM_SUBMISSION] Login form submitted. "
                 f"Username: '{form.username.data}'"
             )
        if form.validate_on_submit():
            user = User.query.filter_by(username=form.username.data).first()
            if user and user.check_password(form.password.data):
                login_user(user)
                _app.logger.info(
                    f"User '{user.username}' (ID: {user.id}) logged in successfully."
                )
                _app.logger.debug(
                    f"Session after login for user '{user.username}': {dict(session)}"
                )
                flash('Logged in successfully.', 'success')
                next_page = request.args.get('next')
                _app.logger.debug(f"Login next page: '{next_page}', redirecting.")
                return redirect(next_page or url_for('index'))
            else:
                _app.logger.warning(
                    f"Invalid login attempt for username: '{form.username.data}'. "
                    f"User exists: {user is not None}."
                )
                flash('Invalid username or password.', 'danger')
        elif request.method == 'POST':
            _app.logger.warning(
                f"Login form validation failed for username: '{form.username.data}'. "
                f"Errors: {form.errors}"
            )
            flash_form_errors(form)
            if not form.errors:
                 flash('Login attempt failed. Please check your input.', 'danger')
        else:
            _app.logger.debug("Displaying login form.")
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template('login.html', form=form)
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/logout')
    @login_required
    def logout():
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /logout, Method: {request.method}, User: {current_user.username}"
        )
        user_id_before_logout = current_user.id
        username_before_logout = current_user.username
        logout_user()
        _app.logger.info(
            f"User '{username_before_logout}' (ID: {user_id_before_logout}) "
            f"logged out successfully."
        )
        _app.logger.debug(f"Session after logout: {dict(session)}")
        flash('Logged out successfully.', 'success')
        return redirect(url_for('index'))

    @_app.route('/profile/<username>')
    @login_required
    def profile(username):
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /profile/{username}, Method: {request.method}, "
            f"Requested by: {current_user.username}"
        )
        user_profile = User.query.filter_by(username=username).first_or_404()
        _app.logger.debug(
            f"Displaying profile for user '{user_profile.username}' (ID: {user_profile.id})."
        )
        if not user_profile.is_profile_public and user_profile != current_user:
            _app.logger.warning(
                f"User {current_user.username} attempted to view private profile of "
                f"{user_profile.username}. Denying access."
            )
            flash("This profile is private.", "warning")
            abort(403)
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        posts_query = Post.query.with_parent(user_profile)
        if current_user == user_profile:
            _app.logger.debug(
                f"Fetching all posts (published and drafts) for own profile "
                f"'{user_profile.username}', page {page}."
            )
            posts_query = posts_query.order_by(Post.updated_at.desc())
        else:
            _app.logger.debug(
                f"Fetching only published posts for profile "
                f"'{user_profile.username}', page {page}."
            )
            posts_query = posts_query.filter_by(is_published=True).order_by(
                Post.published_at.desc(), Post.created_at.desc()
            )
        try:
            posts_pagination = posts_query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            _app.logger.debug(
                f"Found {len(posts_pagination.items)} posts for profile '{user_profile.username}' "
                f"on page {page} (total matching criteria: {posts_pagination.total})."
            )
        except Exception as e:
            _app.logger.error(
                f"Error fetching posts for profile {user_profile.username}: {e}",
                exc_info=True
            )
            flash("Error loading posts for this profile.", "danger")
            posts_pagination = None
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'profile.html', user_profile=user_profile,
            posts_pagination=posts_pagination
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/profile/edit', methods=['GET', 'POST'])
    @login_required
    def edit_profile():
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /profile/edit, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        form = ProfileEditForm(obj=current_user)
        if request.method == 'POST':
            log_form_data = {
                key: (value[:200] + '...' if isinstance(value, str)
                      and len(value) > 200 else value)
                for key, value in request.form.items() if key != 'csrf_token'
            }
            log_form_data['profile_photo_filename'] = (
                form.profile_photo.data.filename if form.profile_photo.data else 'None'
            )
            _app.logger.debug(
                f"[FORM_SUBMISSION] Edit profile form submitted by {current_user.username}. "
                f"Data (text truncated, photo by filename): {log_form_data}"
            )
        if form.validate_on_submit():
            _app.logger.info(f"User {current_user.username} updating profile.")
            raw_profile_info = form.profile_info.data
            current_user.profile_info = bleach.clean(
                raw_profile_info, tags=ALLOWED_TAGS,
                attributes=ALLOWED_ATTRIBUTES, strip=True
            )
            current_user.full_name = form.full_name.data
            current_user.location = form.location.data
            current_user.website_url = form.website_url.data
            current_user.is_profile_public = form.is_profile_public.data
            _app.logger.debug(
                f"Profile text fields updated for {current_user.username}: "
                f"Name='{current_user.full_name}', "
                f"Location='{current_user.location}', "
                f"Website='{current_user.website_url}', "
                f"Public={current_user.is_profile_public}, "
                f"Bio length={len(current_user.profile_info or '')}"
            )
            file = form.profile_photo.data
            photo_update_attempted = False
            photo_saved_successfully = False
            if file and file.filename:
                photo_update_attempted = True
                _app.logger.debug(
                    f"Profile photo update attempt by {current_user.username}. "
                    f"Filename: {file.filename}, Content-Length: {file.content_length}"
                )
                if file.content_length > _app.config['MAX_PROFILE_PHOTO_SIZE_BYTES']:
                    _app.logger.warning(
                        f"Profile photo for {current_user.username} too large: "
                        f"{file.content_length} bytes."
                    )
                    flash(
                        f"Profile photo is too large. Maximum size is "
                        f"{_app.config['MAX_PROFILE_PHOTO_SIZE_BYTES'] // 1024 // 1024}MB.",
                        'danger'
                    )
                elif not allowed_file(file.filename):
                    _app.logger.warning(
                        f"Invalid file type for profile photo by {current_user.username}: "
                        f"{file.filename}"
                    )
                    flash(
                        'Invalid file type for photo. Allowed types are '
                        'png, jpg, jpeg, gif.',
                        'warning'
                    )
                else:
                    try:
                        original_filename = secure_filename(file.filename)
                        ext = original_filename.rsplit('.', 1)[-1].lower()
                        unique_filename = f"{uuid.uuid4()}.{ext}"
                        upload_folder_path = _app.config['UPLOAD_FOLDER']
                        save_path = os.path.join(upload_folder_path, unique_filename)
                        os.makedirs(upload_folder_path, exist_ok=True)
                        _app.logger.debug(
                            f"Attempting to save profile photo to: {save_path}"
                        )
                        img = Image.open(file.stream)
                        _app.logger.debug(
                            f"Profile photo opened with Pillow. Original size: {img.size}"
                        )
                        crop_x_str = request.form.get('crop_x')
                        crop_y_str = request.form.get('crop_y')
                        crop_width_str = request.form.get('crop_width')
                        crop_height_str = request.form.get('crop_height')
                        if crop_x_str and crop_y_str and crop_width_str and crop_height_str:
                            _app.logger.debug(
                                f"Crop parameters received: X={crop_x_str}, Y={crop_y_str}, "
                                f"W={crop_width_str}, H={crop_height_str}"
                            )
                            try:
                                crop_x = int(float(crop_x_str))
                                crop_y = int(float(crop_y_str))
                                crop_width = int(float(crop_width_str))
                                crop_height = int(float(crop_height_str))
                                if crop_width > 0 and crop_height > 0:
                                    img = img.crop(
                                        (crop_x, crop_y,
                                         crop_x + crop_width, crop_y + crop_height)
                                    )
                                    _app.logger.debug(f"Image cropped to: {img.size}")
                                else:
                                    _app.logger.warning(
                                        "Invalid crop dimensions (<=0). "
                                        "Photo processed without cropping."
                                    )
                                    flash(
                                        "Invalid crop dimensions provided. "
                                        "Photo processed without cropping.",
                                        'warning'
                                    )
                            except ValueError as ve:
                                _app.logger.warning(
                                    f"Invalid crop coordinates: {ve}. "
                                    f"Photo processed without cropping."
                                )
                                flash(
                                    "Invalid crop coordinates provided. "
                                    "Photo processed without cropping.",
                                    'warning'
                                )
                        else:
                            _app.logger.debug(
                                "No crop parameters provided or some are missing. "
                                "Processing photo without explicit cropping."
                            )
                        img.thumbnail((200, 200))
                        _app.logger.debug(
                            f"Image thumbnail generated. Size: {img.size}"
                        )
                        img.save(save_path)
                        _app.logger.info(
                            f"Profile photo for {current_user.username} saved to {save_path}"
                        )

                        if current_user.profile_photo_url:
                            old_filename = os.path.basename(
                                current_user.profile_photo_url
                            )
                            old_photo_abs_path = os.path.join(
                                _app.config['UPLOAD_FOLDER'], old_filename
                            )
                            real_upload_folder = os.path.realpath(
                                _app.config['UPLOAD_FOLDER']
                            )
                            if os.path.commonprefix(
                                (os.path.realpath(old_photo_abs_path),
                                 real_upload_folder)
                            ) == real_upload_folder:
                                if os.path.exists(old_photo_abs_path):
                                    try:
                                        os.remove(old_photo_abs_path)
                                        _app.logger.info(
                                            f"Old profile photo {old_photo_abs_path} "
                                            f"deleted for user {current_user.username}."
                                        )
                                    except OSError as oe:
                                        _app.logger.error(
                                            f"Error deleting old profile photo "
                                            f"{old_photo_abs_path}: {oe}",
                                            exc_info=True
                                        )
                                else:
                                    _app.logger.warning(
                                        f"Old profile photo {old_photo_abs_path} "
                                        f"not found for deletion."
                                    )
                            else:
                                _app.logger.error(
                                    f"Security: Attempt to delete file outside upload "
                                    f"folder blocked: {old_photo_abs_path}"
                                )

                        current_user.profile_photo_url = os.path.join(
                            'uploads/profile_pics', unique_filename
                        )
                        photo_saved_successfully = True
                    except Exception as e:
                        _app.logger.error(
                            f"Error processing profile photo for {current_user.username}: {e}",
                            exc_info=True
                        )
                        flash(f'Error processing profile photo: {e}', 'danger')
            try:
                db.session.commit()
                _app.logger.info(
                    f"Profile changes for {current_user.username} committed to DB."
                )
                if photo_update_attempted:
                    if photo_saved_successfully:
                        flash('Profile and photo updated successfully!', 'success')
                    else:
                        flash(
                            'Profile information updated, '
                            'but there was an issue with the photo upload.',
                            'warning'
                        )
                else:
                    flash('Profile updated successfully!', 'success')
            except Exception as e:
                db.session.rollback()
                _app.logger.error(
                    f"Error saving profile changes to DB for {current_user.username}: {e}",
                    exc_info=True
                )
                flash(f'Error saving profile changes: {e}', 'danger')
            return redirect(url_for('profile', username=current_user.username))
        elif request.method == 'POST':
            _app.logger.warning(
                f"Edit profile form validation failed for user {current_user.username}. "
                f"Errors: {form.errors}"
            )
            flash_form_errors(form)
        else: # GET request
            _app.logger.debug(
                f"Displaying edit profile form for user {current_user.username}."
            )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'edit_profile.html', form=form, user_profile=current_user
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/dashboard')
    @login_required
    def dashboard():
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /dashboard, Method: {request.method}, "
            f"User: {current_user.username}"
        )

        user_posts = Post.query.filter_by(user_id=current_user.id).order_by(
            Post.updated_at.desc()
        ).all()
        delete_forms = {
            post.id: DeletePostForm(prefix=f"del-post-{post.id}-")
            for post in user_posts
        }
        _app.logger.debug(
            f"Fetched {len(user_posts)} posts for user {current_user.username} "
            f"for dashboard."
        )

        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'dashboard.html', user_posts=user_posts, delete_forms=delete_forms
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/settings')
    @login_required
    def settings_page():
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /settings, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        _app.logger.debug(
            f"Displaying settings page for user {current_user.username}."
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template('settings.html')
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/settings/change-password', methods=['GET', 'POST'])
    @login_required
    def change_password_page():
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /settings/change-password, "
            f"Method: {request.method}, User: {current_user.username}"
        )
        form = ChangePasswordForm()
        if request.method == 'POST':
            _app.logger.debug(
                f"[FORM_SUBMISSION] Change password form submitted by "
                f"{current_user.username}."
            )
        if form.validate_on_submit():
            _app.logger.info(
                f"User {current_user.username} attempting to change password."
            )
            if current_user.check_password(form.current_password.data):
                try:
                    current_user.set_password(form.new_password.data)
                    db.session.commit()
                    _app.logger.info(
                        f"Password changed successfully for user {current_user.username}."
                    )
                    flash('Your password has been updated successfully!', 'success')
                    return redirect(url_for('settings_page'))
                except Exception as e:
                    db.session.rollback()
                    _app.logger.error(
                        f"Error saving new password for user {current_user.username}: {e}",
                        exc_info=True
                    )
                    flash('Error changing password. Please try again.', 'danger')
            else:
                _app.logger.warning(
                    f"Invalid current password provided by user {current_user.username} "
                    f"during password change attempt."
                )
                flash('Invalid current password.', 'danger')
        elif request.method == 'POST':
            _app.logger.warning(
                f"Change password form validation failed for user {current_user.username}. "
                f"Errors: {form.errors}"
            )
            flash_form_errors(form)
        else: # GET request
            _app.logger.debug(
                f"Displaying change password form for user {current_user.username}."
            )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template('change_password.html', form=form)
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/search')
    def search_results():
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /search, Method: {request.method}, "
            f"IP: {request.remote_addr}"
        )
        query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        _app.logger.info(f"Search performed with query: '{query}', page: {page}.")
        posts = []
        pagination = None
        if query:
            search_term = f"%{query}%"
            try:
                posts_query = Post.query.filter(
                    Post.is_published,
                    or_(Post.title.ilike(search_term), Post.content.ilike(search_term))
                ).order_by(Post.published_at.desc(), Post.created_at.desc())
                pagination = posts_query.paginate(
                    page=page, per_page=per_page, error_out=False
                )
                posts = pagination.items
                _app.logger.debug(
                    f"Search for '{query}' found {len(posts)} published posts on page {page}. "
                    f"Total results: {pagination.total}"
                )
            except Exception as e:
                _app.logger.error(
                    f"Error during search for query '{query}': {e}", exc_info=True
                )
                flash("Error performing search. Please try again.", "danger")
        else:
            _app.logger.debug("Search query was empty. Displaying no results.")
            flash("Please enter a search term.", "info")
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'search_results.html', query=query, posts=posts, pagination=pagination
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/about')
    def about_page():
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /about, Method: {request.method}, IP: {request.remote_addr}"
        )
        _app.logger.debug("Displaying About page.")
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template('about.html')
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/contact')
    def contact_page():
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /contact, Method: {request.method}, IP: {request.remote_addr}"
        )
        _app.logger.debug("Displaying Contact page.")
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template('contact.html')
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/tag/<string:tag_slug>')
    def posts_by_tag(tag_slug):
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_ENTRY_DEBUG] {request.path} - Start"
        )
        _app.logger.debug(
            f"[ROUTE_ENTRY] Path: /tag/{tag_slug}, Method: {request.method}, "
            f"IP: {request.remote_addr}"
        )
        tag = Tag.query.filter_by(slug=tag_slug).first_or_404()
        _app.logger.debug(f"Fetching posts for tag '{tag.name}' (Slug: {tag_slug}).")
        page = request.args.get('page', 1, type=int)
        per_page = _app.config['POSTS_PER_PAGE']
        try:
            query = Post.query.filter(Post.tags.contains(tag), Post.is_published).order_by(
                Post.published_at.desc(), Post.created_at.desc()
            )
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            posts = pagination.items
            _app.logger.debug(
                f"Found {len(posts)} published posts for tag '{tag.name}' "
                f"on page {page}. Total: {pagination.total}"
            )
        except Exception as e:
            _app.logger.error(
                f"Error fetching posts for tag {tag_slug}: {e}", exc_info=True
            )
            flash(f"Error loading posts for tag {tag.name}.", "danger")
            posts = []
            pagination = None
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - Before render_template"
        )
        rendered_template = render_template(
            'posts_by_tag.html', tag=tag, posts=posts, pagination=pagination
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_RENDER_DEBUG] {request.path} - After render_template"
        )
        _app.logger.info(
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[ROUTE_EXIT_DEBUG] {request.path} - End"
        )
        return rendered_template

    @_app.route('/api/settings/theme', methods=['POST'])
    @login_required
    def save_theme_preference():
        _app.logger.debug(
            f"[API_ROUTE_ENTRY] Path: /api/settings/theme, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        data = request.get_json()
        _app.logger.info(
            f"API /api/settings/theme: Received data: {data} for user {current_user.username}"
        )
        if not data or 'theme' not in data:
            _app.logger.warning(
                f"API /api/settings/theme: Missing theme data in request from "
                f"{current_user.username}. Data: {data}"
            )
            return jsonify({'status': 'error', 'message': 'Missing theme data'}), 400
        new_theme = data['theme']
        _app.logger.info(
            f"User {current_user.username} attempting to set theme to: '{new_theme}'."
        )
        if new_theme not in _app.config['ALLOWED_THEMES']:
            _app.logger.warning(
                f"API /api/settings/theme: Invalid theme value '{new_theme}' "
                f"from {current_user.username}."
            )
            return jsonify({'status': 'error', 'message': 'Invalid theme value'}), 400
        current_user.theme = new_theme
        try:
            db.session.commit()
            _app.logger.info(
                f"Theme preference '{new_theme}' saved for user {current_user.username}. "
                f"current_user.theme is now: {current_user.theme}"
            )
            return jsonify({'status': 'success', 'message': 'Theme updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(
                f"[DB_ERROR] /api/settings/theme - Error saving theme for "
                f"{current_user.username}: {e}", exc_info=True
            )
            return jsonify(
                {'status': 'error', 'message': 'Failed to save theme preference'}
            ), 500

    @_app.route('/api/settings/accent_color', methods=['POST'])
    @login_required
    def save_accent_color_preference():
        _app.logger.debug(
            f"[API_ROUTE_ENTRY] Path: /api/settings/accent_color, Method: {request.method}, "
            f"User: {current_user.username}"
        )
        data = request.get_json()
        _app.logger.info(
            f"API /api/settings/accent_color: Received data: {data} "
            f"for user {current_user.username}"
        )
        if not data or 'accent_color' not in data:
            _app.logger.warning(
                f"API /api/settings/accent_color: Missing accent_color data in request from "
                f"{current_user.username}. Data: {data}"
            )
            return jsonify({'status': 'error', 'message': 'Missing accent_color data'}), 400
        new_accent_color = data['accent_color']
        _app.logger.info(
            f"User {current_user.username} attempting to set accent_color to: '{new_accent_color}'."
        )
        current_user.accent_color = new_accent_color
        try:
            db.session.commit()
            _app.logger.info(
                f"Accent color preference '{new_accent_color}' saved for user {current_user.username}. "
                f"current_user.accent_color is now: {current_user.accent_color}"
            )
            return jsonify({'status': 'success', 'message': 'Accent color updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(
                f"[DB_ERROR] /api/settings/accent_color - Error saving accent_color for "
                f"{current_user.username}: {e}", exc_info=True
            )
            return jsonify(
                {'status': 'error', 'message': 'Failed to save accent color preference'}
            ), 500

    @_app.errorhandler(403)
    def forbidden_page(error):
        user_info = (
            f"User: {current_user.username}" if current_user.is_authenticated
            else "User: Anonymous"
        )
        _app.logger.warning(
            f"[ERROR_HANDLER] 403 Forbidden - Path: {request.path}, "
            f"IP: {request.remote_addr}, {user_info}, Error: {error}",
            exc_info=False
        )
        return render_template('403.html'), 403

    @_app.errorhandler(404)
    def page_not_found(error):
        user_info = (
            f"User: {current_user.username}" if current_user.is_authenticated
            else "User: Anonymous"
        )
        _app.logger.warning(
            f"[ERROR_HANDLER] 404 Not Found - Path: {request.path}, "
            f"IP: {request.remote_addr}, {user_info}, Error: {error}",
            exc_info=False
        )
        return render_template('404.html'), 404

    @_app.errorhandler(500)
    def server_error_page(error):
        user_info = (
            f"User: {current_user.username}" if current_user.is_authenticated
            else "User: Anonymous"
        )
        _app.logger.error(
            f"[ERROR_HANDLER] 500 Server Error - Path: {request.path}, "
            f"IP: {request.remote_addr}, {user_info}, Error: {error}",
            exc_info=True
        )
        return render_template('500.html'), 500

    with _app.app_context():
        _app.logger.info("Application context pushed for initial db.create_all().")
        try:
            _app.logger.info(
                "Attempting to ensure database tables are created (db.create_all())..."
            )
            db.create_all()
            _app.logger.info(
                "db.create_all() completed. Tables should exist if they didn't."
            )
        except Exception as e:
            _app.logger.error(
                f"Error during initial db.create_all(): {e}", exc_info=True
            )

    _app.logger.info("Flask application instance created and configured.")
    return _app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
