from datetime import datetime, timezone
from flask import Flask, render_template, url_for, abort, request, redirect, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect, FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SubmitField, FileField
from wtforms.validators import DataRequired, Length, Optional, Email
from sqlalchemy import desc
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import logging
from PIL import Image
import uuid

app = Flask(__name__)
csrf = CSRFProtect(app)

# Basic logging configuration
if not app.debug:
    app.logger.setLevel(logging.INFO)
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    app.logger.addHandler(stream_handler)
# For debug mode, Flask's default logger should show up in the console.
# For production, a more robust logging setup would be needed.

# Configure secret key (important for session management)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_for_development_only') # In production, use a proper secret key

# Database Configuration
POSTGRES_USER = os.environ.get('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', 'postgres')
POSTGRES_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
POSTGRES_DB = os.environ.get('POSTGRES_DB', 'appdb')

# If password is empty, it might imply peer authentication or other auth methods
if POSTGRES_PASSWORD:
    SQLALCHEMY_DATABASE_URI = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
else:
    SQLALCHEMY_DATABASE_URI = f"postgresql://{POSTGRES_USER}@{POSTGRES_HOST}/{POSTGRES_DB}"

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', SQLALCHEMY_DATABASE_URI)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

UPLOAD_FOLDER = 'app-demo/static/uploads/profile_pics'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=1, max=120)])
    content = TextAreaField('Content', validators=[DataRequired()])
    submit = SubmitField('Submit Post')

class ProfileEditForm(FlaskForm):
    profile_info = TextAreaField('Profile Info', validators=[Optional(), Length(max=5000)])
    profile_photo = FileField('Profile Photo', validators=[Optional()])
    submit = SubmitField('Update Profile')

db = SQLAlchemy()

login_manager = LoginManager()
# login_manager.init_app(app) # Will be called after db.init_app or if app is fully initialized
login_manager.login_view = 'login'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    profile_info = db.Column(db.Text, nullable=True)
    profile_photo_url = db.Column(db.String(512), nullable=True)
    posts = db.relationship('Post', backref='author', lazy=True, order_by=desc("created_at"))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.id)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    # 'author' relationship is defined by backref in User.posts

@login_manager.user_loader
def load_user(user_id):
    # user_id is a string, convert to int for query
    return db.session.get(User, int(user_id))


@app.context_processor
def inject_user():
    return dict(current_user=current_user)

@app.route('/')
def index():
    page = request.args.get('page', 1, type=int)
    per_page = 5
    pagination = Post.query.order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    posts = pagination.items
    return render_template('index.html', posts=posts, pagination=pagination)

@app.route('/posts/<int:post_id>')
def view_post(post_id):
    post = Post.query.get_or_404(post_id)
    return render_template('post.html', post=post)

@app.route('/create', methods=['GET', 'POST'])
@login_required
def create_post():
    form = PostForm()
    if form.validate_on_submit():
        title = form.title.data
        content = form.content.data
        app.logger.info(f"Create post attempt by user '{current_user.username}' (ID: {current_user.id}). Title: '{title}', Content present: {bool(content)}")
        try:
            new_post = Post(title=title, content=content, author=current_user)
            db.session.add(new_post)
            db.session.commit()
            app.logger.info(f"Post committed to DB. ID: {new_post.id}, Title: '{new_post.title}' by user '{current_user.username}'.")
            flash('Post created successfully!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error creating post: {e}", exc_info=True)
            flash(f'Error creating post: {e}', 'danger')
    elif request.method == 'POST':
        app.logger.warning(f"Post creation by {current_user.username} failed validation. Errors: {form.errors}")
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')
    return render_template('create_post.html', form=form)

@app.route('/posts/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)

    db.session.delete(post)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/posts/<int:post_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)  # Forbidden

    form = PostForm(obj=post) # Populate form with existing post data on GET

    if form.validate_on_submit():
        post.title = form.title.data
        post.content = form.content.data
        # post.updated_at will be updated by onupdate
        try:
            db.session.commit()
            flash('Post updated successfully!', 'success')
            return redirect(url_for('view_post', post_id=post.id))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating post {post.id}: {e}", exc_info=True)
            flash(f'Error updating post: {e}', 'danger')
    elif request.method == 'POST':
        app.logger.warning(f"Post {post.id} update by {current_user.username} failed validation. Errors: {form.errors}")
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {getattr(form, field).label.text}: {error}", 'warning')

    return render_template('edit_post.html', form=form, post=post)

@app.route('/test-widget')
def test_widget_page():
    return render_template('test_widget.html')

@app.route('/login', methods=['GET', 'POST'])
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
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password.', 'danger')
    # For GET requests or if form validation fails, render the login page with the form
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/profile/<username>')
@login_required
def profile(username):
    user_profile = User.query.filter_by(username=username).first_or_404()
    return render_template('profile.html', user_profile=user_profile)

@app.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = ProfileEditForm(obj=current_user) # Populate with current_user data on GET

    if form.validate_on_submit():
        current_user.profile_info = form.profile_info.data
        app.logger.info(f"User {current_user.username} updating profile_info.")

        file = form.profile_photo.data # This is a FileStorage object
        if file and file.filename:
            if allowed_file(file.filename):
                try:
                    original_filename = secure_filename(file.filename)
                    ext = original_filename.rsplit('.', 1)[-1].lower()
                    unique_filename = f"{uuid.uuid4()}.{ext}"

                    upload_folder_path = app.config['UPLOAD_FOLDER']
                    save_path = os.path.join(upload_folder_path, unique_filename)

                    os.makedirs(upload_folder_path, exist_ok=True)

                    img = Image.open(file.stream) # Use file.stream for FileStorage
                    img.thumbnail((200, 200))
                    img.save(save_path)

                    relative_path = os.path.join('uploads/profile_pics', unique_filename)
                    current_user.profile_photo_url = relative_path
                    app.logger.info(f"Resized and saved image to '{save_path}' for user {current_user.username}. Relative path: {relative_path}")
                    flash('Profile photo updated successfully!', 'success')
                except Exception as e:
                    app.logger.error(f"Error uploading profile photo for user {current_user.username}: {e}", exc_info=True)
                    flash(f'Error uploading profile photo: {e}', 'danger')
            else:
                app.logger.warning(f"Profile photo upload failed for user {current_user.username}: File type not allowed. Filename: '{file.filename}'")
                flash('Invalid file type for photo. Allowed types are png, jpg, jpeg, gif.', 'warning')

        # db.session.add(current_user) # Not strictly necessary as current_user is already in session
        try:
            db.session.commit()
            app.logger.info(f"Profile changes for {current_user.username} committed to DB.")
            # Avoid double-flashing if photo status was already flashed
            if not (file and file.filename):
                 flash('Profile updated successfully!', 'success')
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error committing profile changes for user {current_user.username}: {e}", exc_info=True)
            flash(f'Error saving profile changes: {e}', 'danger')

        return redirect(url_for('profile', username=current_user.username))
    elif request.method == 'POST':
        app.logger.warning(f"Profile edit by {current_user.username} failed validation. Errors: {form.errors}")
        for field_name, field_errors in form.errors.items():
            for error in field_errors:
                # Get label text if available, otherwise use field name
                label = getattr(getattr(form, field_name), 'label', None)
                field_label_text = label.text if label else field_name.replace('_', ' ').title()
                flash(f"Error in {field_label_text}: {error}", 'warning')

    return render_template('edit_profile.html', form=form, user_profile=current_user)

@app.route('/settings')
@login_required
def settings_page():
    return render_template('settings.html')

@app.route('/test-new-widgets')
def test_new_widgets_page():
    return render_template('test_new_widgets.html')

@app.errorhandler(403)
def forbidden_page(error):
    return render_template('403.html'), 403

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error_page(error):
    app.logger.error(f"Server error: {error}", exc_info=True)
    return render_template('500.html'), 500

# Flask-Login and SQLAlchemy must be initialized with the app instance.
# This can be done here for non-test runs, or deferred for tests.
def init_extensions(flask_app):
    print("Attempting to initialize database with Flask app...")
    db.init_app(flask_app)
    print("Database initialized with Flask app.")
    login_manager.init_app(flask_app)
    print("Login manager initialized.")
    with flask_app.app_context():
        print("Entering application context for db.create_all().")
        try:
            db.create_all()
            print("db.create_all() executed successfully.")
        except Exception as e:
            print(f"Error during db.create_all(): {e}")
            raise
    print("Exited application context for db.create_all().")

if __name__ == '__main__':
    init_extensions(app)
    app.run(debug=True)
