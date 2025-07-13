from flask import Blueprint, redirect, request, flash, current_app, abort, url_for
from flask_login import current_user, login_required

from .. import db
from ..models import Post, Repost
from ..forms import PostForm

repost_bp = Blueprint('repost', __name__, url_prefix='/repost')

@repost_bp.route('/<int:post_id>', methods=['POST'])
@login_required
def repost_post_route(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author == current_user:
        flash("You cannot repost your own post.", "warning")
        return redirect(request.referrer or url_for('general.index'))

    if current_user.repost_post(post):
        db.session.commit()
        flash("Post reposted successfully!", "toast_success")
    else:
        flash("You have already reposted this post.", "info")
        db.session.rollback()

    return redirect(request.referrer or url_for('general.index'))

@repost_bp.route('/unrepost/<int:post_id>', methods=['POST'])
@login_required
def unrepost_post_route(post_id):
    post = Post.query.get_or_404(post_id)
    if current_user.unrepost_post(post):
        db.session.commit()
        flash("Post unreposted successfully!", "toast_success")
    else:
        flash("You have not reposted this post.", "info")
        db.session.rollback()

    return redirect(request.referrer or url_for('general.index'))
