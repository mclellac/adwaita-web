from flask import Flask, render_template, url_for, abort, request, redirect # Added request, redirect
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os # For secret key

app = Flask(__name__)

# Configure secret key (important for session management)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_for_development_only') # In production, use a proper secret key

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login' # Name of the login route

# In-memory user store (replace with a database in a real application)
# For simplicity, storing plaintext passwords. HASH PASSWORDS IN PRODUCTION!
users = {
    "testuser": {"password": "password123", "profile_info": "Just a test user."},
    "admin": {"password": "adminpassword", "profile_info": "Administrator account."}
}

class User(UserMixin):
    def __init__(self, username):
        self.id = username # user_id is username in this case
        self.username = username
        # self.password_hash = users[username]['password'] # In a real app, you'd store/compare hashes

    @property
    def password(self):
        # This is a placeholder. Password checking should be done with hashes.
        # Returning the plaintext password here for direct comparison (NOT FOR PRODUCTION)
        return users[self.id]['password']

    def get_profile_info(self):
        return users[self.id].get('profile_info', 'No profile information available.')


@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        return User(user_id)
    return None

posts_data = [
    {
        'id': 1,
        'title': 'Welcome to the Blog!',
        'content': 'This is the very first post on this amazing new blog platform.'
    },
    {
        'id': 2,
        'title': 'Understanding Libadwaita-Web',
        'content': 'Libadwaita-web helps you build web interfaces that look and feel like native GTK4/Libadwaita apps.'
    }
]
next_post_id = 3 # Make sure this is correctly managed

@app.context_processor
def inject_user():
    return dict(current_user=current_user)

@app.route('/')
def index():
    return render_template('index.html', posts=posts_data)

@app.route('/posts/<int:post_id>')
def view_post(post_id):
    post = next((p for p in posts_data if p['id'] == post_id), None)
    if post:
        return render_template('post.html', post=post)
    abort(404)

@app.route('/create', methods=['GET', 'POST'])
@login_required # Add this line
def create_post():
    global next_post_id # Declare global to modify it
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        if title and content:
            new_post = {
                'id': next_post_id,
                'title': title,
                'content': content,
                'author': current_user.username # Optionally associate post with user
            }
            posts_data.append(new_post)
            next_post_id += 1
            return redirect(url_for('index'))
        # Else, if form data is missing, re-render form (or add error messages)
        # For simplicity, just re-rendering for now.
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
        user = load_user(username) # Get User object
        if user and user.password == password: # Direct comparison (NOT FOR PRODUCTION)
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
    # Ensure users can only view their own profile, or make it admin-only for other profiles
    # For now, let's allow viewing if the requested username exists.
    user_profile = load_user(username)
    if not user_profile:
        abort(404) # User not found

    # Simple authorization: only allow users to see their own profile or admins to see any
    # For now, keeping it simple: if you're logged in, you can see any existing profile.
    # if username != current_user.id and current_user.id != 'admin':
    #     abort(403) # Forbidden

    return render_template('profile.html', user_profile=user_profile)

if __name__ == '__main__':
    app.run(debug=True)
