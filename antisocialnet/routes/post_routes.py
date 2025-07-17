from flask import Blueprint, request, jsonify, current_app, abort
from flask_login import current_user, login_required
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload

from ..models import Post, Category, Tag, Comment, CommentFlag, Notification, Activity, User
from ..forms import PostForm, CommentForm, FlagCommentForm, EditCommentForm
from .. import db
from ..utils import update_post_relations_util, extract_mentions
from ..api_utils import serialize_post_item, serialize_comment_item

post_bp = Blueprint('post', __name__, url_prefix='/api/v1/posts')

@post_bp.route('/<int:post_id>', methods=['GET'])
def view_post(post_id):
    post = Post.query.options(
        selectinload(Post.author),
        selectinload(Post.categories),
        selectinload(Post.tags)
    ).get_or_404(post_id)

    if not post.is_published and (not current_user.is_authenticated or current_user.id != post.user_id):
        abort(404)

    return jsonify(serialize_post_item(post))

@post_bp.route('/', methods=['POST'])
@login_required
def create_post():
    form = PostForm(data=request.get_json())
    if form.validate():
        new_post = Post(title=form.title.data, content=form.content.data, user_id=current_user.id,
                        is_published=True, published_at=datetime.now(timezone.utc))
        db.session.add(new_post)
        update_post_relations_util(new_post, form, db.session)

        activity = Activity(user_id=current_user.id, type='created_post', target_type='post', target_id=new_post.id)
        db.session.add(activity)
        db.session.commit()

        # Handle mentions and notifications
        # ...

        return jsonify(serialize_post_item(new_post)), 201
    return jsonify(errors=form.errors), 400

@post_bp.route('/<int:post_id>', methods=['PUT'])
@login_required
def edit_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    form = PostForm(data=request.get_json(), obj=post)
    if form.validate():
        post.title = form.title.data
        post.content = form.content.data
        update_post_relations_util(post, form, db.session)
        db.session.commit()
        return jsonify(serialize_post_item(post))
    return jsonify(errors=form.errors), 400

@post_bp.route('/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    db.session.delete(post)
    db.session.commit()
    return jsonify(status='success', message='Post deleted successfully.')

@post_bp.route('/<int:post_id>/comments', methods=['POST'])
@login_required
def add_comment(post_id):
    post = Post.query.get_or_404(post_id)
    form = CommentForm(data=request.get_json())
    if form.validate():
        parent_id = form.parent_id.data
        comment = Comment(text=form.text.data, user_id=current_user.id, target_type='post',
                          target_id=post_id, parent_id=parent_id)
        db.session.add(comment)
        db.session.commit()
        # Handle notifications and activity
        # ...
        return jsonify(serialize_comment_item(comment)), 201
    return jsonify(errors=form.errors), 400

@post_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@login_required
def edit_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    form = EditCommentForm(data=request.get_json(), obj=comment)
    if form.validate():
        comment.text = form.text.data
        comment.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify(serialize_comment_item(comment))
    return jsonify(errors=form.errors), 400

@post_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    db.session.delete(comment)
    db.session.commit()
    return jsonify(status='success', message='Comment deleted successfully.')

@post_bp.route('/comments/<int:comment_id>/flag', methods=['POST'])
@login_required
def flag_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id == current_user.id:
        return jsonify(status='error', message="You cannot flag your own comment."), 400

    existing_flag = CommentFlag.query.filter_by(comment_id=comment_id, flagger_user_id=current_user.id, is_resolved=False).first()
    if existing_flag:
        return jsonify(status='error', message='You have already flagged this comment.'), 400

    new_flag = CommentFlag(comment_id=comment.id, flagger_user_id=current_user.id)
    db.session.add(new_flag)
    db.session.commit()
    return jsonify(status='success', message='Comment flagged for review.')

@post_bp.route('/category/<string:category_slug>', methods=['GET'])
def posts_by_category(category_slug):
    category = Category.query.filter_by(slug=category_slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    query = Post.query.filter(Post.categories.contains(category), Post.is_published==True)\
                      .order_by(Post.published_at.desc(), Post.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    posts = [serialize_post_item(post) for post in pagination.items]
    return jsonify(posts=posts, pagination={
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total_items': pagination.total,
        'total_pages': pagination.pages
    })

@post_bp.route('/tag/<string:tag_slug>', methods=['GET'])
def posts_by_tag(tag_slug):
    tag = Tag.query.filter_by(slug=tag_slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    query = Post.query.filter(Post.tags.contains(tag), Post.is_published==True)\
                      .order_by(Post.published_at.desc(), Post.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    posts = [serialize_post_item(post) for post in pagination.items]
    return jsonify(posts=posts, pagination={
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total_items': pagination.total,
        'total_pages': pagination.pages
    })
