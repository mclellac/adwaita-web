from datetime import datetime, timezone
from flask import Flask, render_template, url_for, abort, request, redirect, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect, FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SubmitField, FileField, BooleanField
from wtforms.validators import DataRequired, Length, Optional, Email
from wtforms_sqlalchemy.fields import QuerySelectMultipleField
from wtforms.widgets import ListWidget, CheckboxInput
from sqlalchemy import desc
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import logging
from PIL import Image
import uuid

# Globally defined extensions, to be initialized with an app instance
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

# Forms remain globally defined as they don't store app-specific state directly
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

# Query factory for PostForm categories
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

class ProfileEditForm(FlaskForm):
    full_name = StringField('Display Name', validators=[Optional(), Length(max=120)])
    profile_info = TextAreaField('Bio (supports some HTML)', validators=[Optional(), Length(max=5000)])
    profile_photo = FileField('Profile Photo (Max 2MB)', validators=[Optional()])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    website_url = StringField('Website URL', validators=[Optional(), Length(max=200)]) # Basic validation for now
    is_profile_public = BooleanField('Make Profile Public')
    submit = SubmitField('Update Profile')

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

# Association table for Post and Category (many-to-many)
post_categories = db.Table('post_categories',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False) # For URL-friendly names

    def __init__(self, name):
        self.name = name
        self.slug = name.lower().replace(' ', '-').replace('.', '') # Simple slug generation

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
        SQLALCHEMY_DATABASE_URI = f"postgresql://{os.environ.get('POSTGRES_USER', 'postgres')}:{os.environ.get('POSTGRES_PASSWORD', 'postgres')}@{os.environ.get('POSTGRES_HOST', 'localhost')}/{os.environ.get('POSTGRES_DB', 'appdb')}"
    )
    pg_user = os.environ.get('POSTGRES_USER', 'postgres')
    pg_pass = os.environ.get('POSTGRES_PASSWORD', '')
    pg_host = os.environ.get('POSTGRES_HOST', 'localhost')
    pg_db = os.environ.get('POSTGRES_DB', 'appdb')
    if pg_pass:
        default_db_uri = f"postgresql://{pg_user}:{pg_pass}@{pg_host}/{pg_db}"
    else:
        default_db_uri = f"postgresql://{pg_user}@{pg_host}/{pg_db}"
    _app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', default_db_uri)

    if config_overrides:
        _app.config.from_mapping(config_overrides)

    db.init_app(_app)
    login_manager.init_app(_app)
    login_manager.login_view = 'login'
    csrf.init_app(_app)

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

    @_app.route('/posts/<int:post_id>')
    def view_post(post_id):
        post = Post.query.get_or_404(post_id)
        return render_template('post.html', post=post)

    @_app.route('/category/<string:category_slug>')
    def posts_by_category(category_slug):
        category = Category.query.filter_by(slug=category_slug).first_or_404()
        page = request.args.get('page', 1, type=int)
        per_page = 5 # Or from app config
        pagination = Post.query.with_parent(category).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        return render_template('posts_by_category.html', category=category, posts=posts, pagination=pagination)

    @_app.route('/create', methods=['GET', 'POST'])
    @login_required
    def create_post():
        form = PostForm()
        if form.validate_on_submit():
            title = form.title.data
            content = form.content.data
            _app.logger.info(f"Create post attempt by user '{current_user.username}' (ID: {current_user.id}). Title: '{title}', Content present: {bool(content)}")
            try:
                new_post = Post(title=title, content=content, author=current_user)
                # Assign categories
                for category in form.categories.data:
                    new_post.categories.append(category)
                db.session.add(new_post)
                db.session.commit()
                _app.logger.info(f"Post committed to DB. ID: {new_post.id}, Title: '{new_post.title}' by user '{current_user.username}'. Categories: {[c.name for c in new_post.categories]}")
                flash('Post created successfully!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(f"Error creating post: {e}", exc_info=True)
                flash(f'Error creating post: {e}', 'danger')
        elif request.method == 'POST':
            _app.logger.warning(f"Post creation by {current_user.username} failed validation. Errors: {form.errors}")
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
        if form.validate_on_submit():
            post.title = form.title.data
            post.content = form.content.data
            # Update categories
            post.categories = [] # Clear existing categories first
            for category in form.categories.data:
                post.categories.append(category)
            try:
                db.session.commit()
                _app.logger.info(f"Post {post.id} updated by user '{current_user.username}'. Categories: {[c.name for c in post.categories]}")
                flash('Post updated successfully!', 'success')
                return redirect(url_for('view_post', post_id=post.id))
            except Exception as e:
                db.session.rollback()
                _app.logger.error(f"Error updating post {post.id}: {e}", exc_info=True)
                flash(f'Error updating post: {e}', 'danger')
        elif request.method == 'POST':
            _app.logger.warning(f"Post {post.id} update by {current_user.username} failed validation. Errors: {form.errors}")
            for field, errors in form.errors.items():
                for error in errors:
                    flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')
        return render_template('edit_post.html', form=form, post=post)

    @_app.route('/test-widget')
    def test_widget_page():
        return render_template('test_widget.html')

    @_app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
        form = LoginForm()
        if form.validate_on_submit():
            username = form.username.data
            password = form.password.data
            user = User.query.filter_by(username=username).first()
            if user and user.check_password(password):
                login_user(user)
                flash('Logged in successfully.', 'success')
                next_page = request.args.get('next')
                return redirect(next_page or url_for('index'))
            else:
                flash('Invalid username or password.', 'danger')
        return render_template('login.html', form=form)

    @_app.route('/logout')
    @login_required
    def logout():
        logout_user()
        return redirect(url_for('index'))

    @_app.route('/profile/<username>')
    @login_required
    def profile(username):
        page = request.args.get('page', 1, type=int)
        per_page = 5
        user_profile = User.query.filter_by(username=username).first_or_404()
        posts_pagination = Post.query.with_parent(user_profile).order_by(Post.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return render_template('profile.html', user_profile=user_profile, posts_pagination=posts_pagination)

    @_app.route('/profile/edit', methods=['GET', 'POST'])
    @login_required
    def edit_profile():
        form = ProfileEditForm(obj=current_user)
        if form.validate_on_submit():
            current_user.profile_info = form.profile_info.data
            current_user.full_name = form.full_name.data
            current_user.location = form.location.data
            current_user.website_url = form.website_url.data
            _app.logger.info(f"User {current_user.username} updating profile_info, full_name, location, website_url.")

            file = form.profile_photo.data
            if file and file.filename:
                if allowed_file(file.filename):
                    try:
                        original_filename = secure_filename(file.filename)
                        ext = original_filename.rsplit('.', 1)[-1].lower()
                        unique_filename = f"{uuid.uuid4()}.{ext}"
                        upload_folder_path = _app.config['UPLOAD_FOLDER']
                        save_path = os.path.join(upload_folder_path, unique_filename)
                        os.makedirs(upload_folder_path, exist_ok=True)
                        img = Image.open(file.stream)
                        img.thumbnail((200, 200))
                        img.save(save_path)
                        relative_path = os.path.join('uploads/profile_pics', unique_filename)
                        current_user.profile_photo_url = relative_path
                        _app.logger.info(f"Resized and saved image to '{save_path}' for user {current_user.username}. Relative path: {relative_path}")
                        flash('Profile photo updated successfully!', 'success')
                    except Exception as e:
                        _app.logger.error(f"Error uploading profile photo for user {current_user.username}: {e}", exc_info=True)
                        flash(f'Error uploading profile photo: {e}', 'danger')
                else:
                    _app.logger.warning(f"Profile photo upload failed for user {current_user.username}: File type not allowed. Filename: '{file.filename}'")
                    flash('Invalid file type for photo. Allowed types are png, jpg, jpeg, gif.', 'warning')

            try:
                db.session.commit()
                _app.logger.info(f"Profile changes for {current_user.username} committed to DB.")
                if not (file and file.filename):
                     flash('Profile updated successfully!', 'success')
                elif file and file.filename and allowed_file(file.filename) and not current_user.profile_photo_url:
                    flash('Profile updated successfully! (Photo could not be saved).', 'warning')
            except Exception as e:
                db.session.rollback()
                _app.logger.error(f"Error committing profile changes for user {current_user.username}: {e}", exc_info=True)
                flash(f'Error saving profile changes: {e}', 'danger')
            return redirect(url_for('profile', username=current_user.username))

        elif request.method == 'POST':
            _app.logger.warning(f"Profile edit by {current_user.username} failed validation. Errors: {form.errors}")
            for field_name, field_errors in form.errors.items():
                for error in field_errors:
                    label = getattr(getattr(form, field_name), 'label', None)
                    field_label_text = label.text if label else field_name.replace('_', ' ').title()
                    flash(f"Error in {field_label_text}: {error}", 'warning')
            # return render_template for validation failure should be here, inside the elif
            return render_template('edit_profile.html', form=form, user_profile=current_user)

        # This is for GET request
        return render_template('edit_profile.html', form=form, user_profile=current_user)

    @_app.route('/settings')
    @login_required
    def settings_page():
        return render_template('settings.html')

    @_app.route('/test-new-widgets')
    def test_new_widgets_page():
        return render_template('test_new_widgets.html')

    @_app.route('/about')
    def about_page():
        return render_template('about.html')

    @_app.route('/contact')
    def contact_page():
        # For now, no form processing, just rendering the template.
        # A ContactForm could be added later if needed.
        return render_template('contact.html')

    @_app.route('/api/settings/theme', methods=['POST'])
    @login_required
    def save_theme_preference():
        data = request.get_json()
        if not data or 'theme' not in data:
            _app.logger.warning(f"Invalid theme save request by {current_user.username}: 'theme' missing in JSON data.")
            return jsonify({'status': 'error', 'message': 'Missing theme data'}), 400

        new_theme = data['theme']
        # Basic validation for theme value
        allowed_themes = ['light', 'dark', 'system']
        if new_theme not in allowed_themes:
            _app.logger.warning(f"Invalid theme value '{new_theme}' from {current_user.username}.")
            return jsonify({'status': 'error', 'message': 'Invalid theme value'}), 400

        current_user.theme = new_theme
        try:
            db.session.commit()
            _app.logger.info(f"Theme preference for {current_user.username} updated to '{new_theme}'.")
            return jsonify({'status': 'success', 'message': 'Theme updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(f"Error saving theme for user {current_user.username}: {e}", exc_info=True)
            return jsonify({'status': 'error', 'message': 'Failed to save theme preference'}), 500

    @_app.route('/api/settings/accent_color', methods=['POST'])
    @login_required
    def save_accent_color_preference():
        data = request.get_json()
        if not data or 'accent_color' not in data:
            _app.logger.warning(f"Invalid accent_color save request by {current_user.username}: 'accent_color' missing in JSON data.")
            return jsonify({'status': 'error', 'message': 'Missing accent_color data'}), 400

        new_accent_color = data['accent_color']
        # Basic validation for accent_color value (can be expanded)
        # For now, assumes any string is fine, but a list of allowed colors would be better.
        # Example: allowed_colors = ['default', 'blue', 'green', 'orange', 'red', 'purple']
        # if new_accent_color not in allowed_colors:
        #     return jsonify({'status': 'error', 'message': 'Invalid accent color'}), 400

        current_user.accent_color = new_accent_color
        try:
            db.session.commit()
            _app.logger.info(f"Accent color preference for {current_user.username} updated to '{new_accent_color}'.")
            return jsonify({'status': 'success', 'message': 'Accent color updated successfully'})
        except Exception as e:
            db.session.rollback()
            _app.logger.error(f"Error saving accent_color for user {current_user.username}: {e}", exc_info=True)
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
        # db.create_all() # Temporarily commented out to avoid DB connection issues for static asset testing

        # if not User.query.first():  # Check if any user exists
        #     _app.logger.info("No users found in the database. Creating default admin user.")
        #     default_username = "admin"
        #     default_password = "password"  # Hardcoding for demo purposes
        #     admin_user = User(username=default_username)
        #     admin_user.set_password(default_password)
        #     db.session.add(admin_user)
        #     try:
        #         db.session.commit()
        #         _app.logger.info(f"Default admin user '{default_username}' with password '{default_password}' created successfully.")
        #         print(f"INFO: Default admin user '{default_username}' (password: '{default_password}') created.") # Also print to console
        #     except Exception as e:
        #         db.session.rollback()
        #         _app.logger.error(f"Error creating default admin user: {e}", exc_info=True)
        pass # Ensure the with block is not empty

    return _app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
