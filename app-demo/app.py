from datetime import datetime, timezone
from flask import Flask, render_template, url_for, abort, request, redirect, flash # Added flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import desc # Added for ordering
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename # Added for file uploads
import os # For secret key
import logging # Added for logging
from PIL import Image # Added for image resizing

app = Flask(__name__)

# Basic logging configuration
if not app.debug: # Only configure basic logging if not in debug mode
    app.logger.setLevel(logging.INFO)
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    app.logger.addHandler(stream_handler)
# For debug mode, Flask's default logger should show up in the console.
# For production, a more robust logging setup would be needed.

# Configure secret key (important for session management)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_for_development_only') # In production, use a proper secret key

# Database Configuration
# Get PostgreSQL connection details from environment variables
POSTGRES_USER = os.environ.get('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', 'postgres') # Changed default password
POSTGRES_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
POSTGRES_DB = os.environ.get('POSTGRES_DB', 'appdb')

# Construct the database URI
# If password is empty, it might imply peer authentication or other auth methods
if POSTGRES_PASSWORD:
    SQLALCHEMY_DATABASE_URI = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
else:
    SQLALCHEMY_DATABASE_URI = f"postgresql://{POSTGRES_USER}@{POSTGRES_HOST}/{POSTGRES_DB}"

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', SQLALCHEMY_DATABASE_URI)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Explicitly set, though setdefault could also be used

# Define upload folder and allowed extensions for profile pictures
UPLOAD_FOLDER = 'app-demo/static/uploads/profile_pics'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy() # Initialize SQLAlchemy without app

login_manager = LoginManager()
# login_manager.init_app(app) # Will be called after db.init_app or if app is fully initialized
login_manager.login_view = 'login' # Name of voluntee login route

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Define SQLAlchemy Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False) # Increased length for hash
    profile_info = db.Column(db.Text, nullable=True)
    profile_photo_url = db.Column(db.String(512), nullable=True)
    posts = db.relationship('Post', backref='author', lazy=True, order_by=desc("created_at"))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # Flask-Login integration
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

# Removed in-memory posts_data and next_post_id

@app.context_processor
def inject_user():
    return dict(current_user=current_user)

@app.route('/')
def index():
    page = request.args.get('page', 1, type=int)
    per_page = 5  # Or any number of items per page you prefer
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
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        app.logger.info(f"Create post attempt by user '{current_user.username}' (ID: {current_user.id}). Title: '{title}', Content present: {bool(content)}")
        if title and content:
            try:
                # User details already logged above.
                new_post = Post(title=title, content=content, author=current_user)
                db.session.add(new_post)
                app.logger.info(f"Post object created and added to session for user '{current_user.username}'.") # Enhanced log
                db.session.commit()
                app.logger.info(f"Post committed to DB. ID: {new_post.id}, Title: '{new_post.title}' by user '{current_user.username}'.") # Enhanced log
                flash('Post created successfully!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Error creating post: {e}", exc_info=True)
                flash(f'Error creating post: {e}', 'danger')
        else:
            app.logger.warning("Post creation failed: Title or content missing.")
            flash('Title and content are required.', 'warning')
    return render_template('create_post.html')

@app.route('/posts/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        # Forbidden, or redirect with an error message
        abort(403) # Or flash a message and redirect

    db.session.delete(post)
    db.session.commit()
    # Flash a success message (optional)
    # flash('Post deleted successfully.', 'success')
    return redirect(url_for('index'))

@app.route('/posts/<int:post_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)  # Forbidden

    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')

        if title and content:
            post.title = title
            post.content = content
            # post.updated_at will be updated by onupdate
            db.session.commit()
            # flash('Post updated successfully!', 'success')
            return redirect(url_for('view_post', post_id=post.id))
        else:
            # flash('Title and content are required.', 'danger')
            # Re-render form with an error or rely on HTML5 validation
            pass # Fall through to render template

    return render_template('edit_post.html', post=post)

@app.route('/test-widget')
def test_widget_page():
    return render_template('test_widget.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            error = 'Invalid username or password.'
    return render_template('login.html', error=error)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/profile/<username>')
@login_required
def profile(username):
    user_profile = User.query.filter_by(username=username).first_or_404()
    # The old authorization comments are still relevant if further restrictions are needed.
    # For now, if the user exists, their profile page is shown.
    return render_template('profile.html', user_profile=user_profile)

@app.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    if request.method == 'POST':
        new_profile_info = request.form.get('profile_info')
        current_user.profile_info = new_profile_info
        app.logger.info(f"User {current_user.username} updated profile_info.")

        if 'profile_photo' in request.files:
            file = request.files['profile_photo']
            app.logger.info(f"Found 'profile_photo' in request.files. Filename: '{file.filename}' for user {current_user.username}")

            if file and file.filename != '': # Check if a file was selected and has a name
                if allowed_file(file.filename):
                    try:
                        original_filename = secure_filename(file.filename)
                        app.logger.info(f"Original secure filename: '{original_filename}' for user {current_user.username}")

                        unique_filename = f"{current_user.username}_{original_filename}"
                        app.logger.info(f"Generated unique_filename: '{unique_filename}' for user {current_user.username}")

                        upload_folder_path = app.config['UPLOAD_FOLDER']
                        save_path = os.path.join(upload_folder_path, unique_filename)
                        app.logger.info(f"Full save_path: '{save_path}' for user {current_user.username}")

                        os.makedirs(upload_folder_path, exist_ok=True)
                        app.logger.info(f"Ensured upload folder exists: '{upload_folder_path}' for user {current_user.username}")

                        # Resize image
                        img = Image.open(file)
                        img.thumbnail((200, 200))
                        img.save(save_path)
                        app.logger.info(f"Resized and saved image to '{save_path}' for user {current_user.username}")

                        relative_path = os.path.join('uploads/profile_pics', unique_filename)
                        current_user.profile_photo_url = relative_path
                        app.logger.info(f"Stored relative path in profile_photo_url: '{relative_path}' for user {current_user.username}")

                        flash('Profile photo updated successfully!', 'success')
                    except Exception as e:
                        app.logger.error(f"Error uploading profile photo for user {current_user.username}: {e}", exc_info=True)
                        flash(f'Error uploading profile photo: {e}', 'danger')
                else:
                    app.logger.warning(f"Profile photo upload failed for user {current_user.username}: File type not allowed. Filename: '{file.filename}'")
                    # flash('Invalid file type for photo. Allowed types are png, jpg, jpeg, gif.', 'warning') # Previous version had 'danger' here
                    # The instruction mentioned "The flash message for invalid file type was already present in one version of the code, ensure it's correctly placed."
                    # The previous version from read_files used 'danger', but 'warning' is more appropriate as per the new code block. Let's use 'warning'.
                    flash('Invalid file type for photo. Allowed types are png, jpg, jpeg, gif.', 'warning')


        db.session.add(current_user) # current_user is already in session and tracked by SQLAlchemy
        try:
            db.session.commit()
            app.logger.info(f"Profile changes for {current_user.username} committed to DB.")
            # Flash success for overall profile update if no specific photo error occurred, or if photo success was already flashed.
            # Avoid double-flashing success if photo was also successful.
            # If only profile_info was changed, this is the only success message.
            if not ('profile_photo' in request.files and request.files['profile_photo'].filename != ''): # only flash general success if no photo was attempted or photo was empty
                 flash('Profile updated successfully!', 'success') # General success if no photo was processed or if photo succeeded silently earlier
            elif 'profile_photo' in request.files and request.files['profile_photo'].filename != '' and current_user.profile_photo_url: # if photo was attempted and a url is set
                pass # Photo success already flashed.
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error committing profile changes for user {current_user.username}: {e}", exc_info=True)
            flash(f'Error saving profile changes: {e}', 'danger')

        return redirect(url_for('profile', username=current_user.username))

    # GET request: display the edit profile form with current data
    return render_template('edit_profile.html', user_profile=current_user)

@app.route('/settings')
@login_required
def settings_page():
    return render_template('settings.html')

@app.route('/test-new-widgets')
def test_new_widgets_page():
    return render_template('test_new_widgets.html')

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
            # Optionally, re-raise or handle more gracefully
            # For setup_db.py, printing might be enough, but for app runtime, this could be critical
            raise
    print("Exited application context for db.create_all().")

if __name__ == '__main__':
    init_extensions(app) # Initialize extensions for direct run
    # Create example users if needed (code for this is already commented out but can be used for testing)
    # with app.app_context():
    #     if not User.query.filter_by(username="testuser").first():
    #         user = User(username="testuser", profile_info="Just a test user.")
    #         user.set_password("password123")
    #         db.session.add(user)
    #         db.session.commit()
    #     if not User.query.filter_by(username="admin").first():
    #         admin = User(username="admin", profile_info="Administrator account.")
    #         admin.set_password("adminpassword")
    #         db.session.add(admin)
    #         db.session.commit()
    app.run(debug=True)
