from flask import Flask, render_template, url_for, abort, request, redirect # Added request, redirect

app = Flask(__name__)

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
def create_post():
    global next_post_id # Declare global to modify it
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        if title and content:
            new_post = {
                'id': next_post_id,
                'title': title,
                'content': content
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

if __name__ == '__main__':
    app.run(debug=True)
