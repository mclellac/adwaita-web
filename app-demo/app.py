from flask import Flask, render_template, url_for, abort, request, redirect # Added request, redirect
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os # For secret key

app = Flask(__name__)

# Configure secret key (important for session management)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_for_development_only') # In production, use a proper secret key

# Database Configuration
# Set default URI, but allow override before db.init_app()
app.config.setdefault('SQLALCHEMY_DATABASE_URI', os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost/dbname'))
app.config.setdefault('SQLALCHEMY_TRACK_MODIFICATIONS', False)
db = SQLAlchemy() # Initialize SQLAlchemy without app

login_manager = LoginManager()
# login_manager.init_app(app) # Will be called after db.init_app or if app is fully initialized
login_manager.login_view = 'login' # Name of the login route

# Define SQLAlchemy Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False) # Increased length for hash
    profile_info = db.Column(db.Text, nullable=True)
    posts = db.relationship('Post', backref='author', lazy=True)

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
    posts = Post.query.all()
    return render_template('index.html', posts=posts)

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
        if title and content:
            new_post = Post(title=title, content=content, author=current_user)
            db.session.add(new_post)
            db.session.commit()
            return redirect(url_for('index'))
        # Else, if form data is missing, re-render form (or add error messages)
    return render_template('create_post.html')

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
        # Basic validation: check if new_profile_info is not None, or add more checks
        # For simplicity, directly updating. Consider adding validation/sanitization.
        current_user.profile_info = new_profile_info
        db.session.add(current_user) # Add current_user to session if it's not already persistent or modified
        db.session.commit()
        return redirect(url_for('profile', username=current_user.username))

    # GET request: display the edit profile form with current data
    return render_template('edit_profile.html', user_profile=current_user)

# Flask-Login and SQLAlchemy must be initialized with the app instance.
# This can be done here for non-test runs, or deferred for tests.
def init_extensions(flask_app):
    db.init_app(flask_app)
    login_manager.init_app(flask_app)

if __name__ == '__main__':
    init_extensions(app) # Initialize extensions for direct run
    # Create database tables if they don't exist - only when running app directly
    with app.app_context():
        db.create_all()

    # Example of how to create a user:
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
