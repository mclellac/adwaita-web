from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from ..models import Post, UserPhoto, Activity # Import necessary models
from .. import db # For potential direct DB operations if needed, though mostly model queries

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route('/feed', methods=['GET'])
@login_required
def get_feed():
    """
    API endpoint to retrieve a paginated feed of items (posts and photos).
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('POSTS_PER_PAGE', 10), type=int)

    # Union query for posts and photos
    posts_query = db.session.query(
        Post.id,
        Post.created_at.label('timestamp'),
        db.literal('post').label('type')
    ).filter(Post.is_published == True)

    photos_query = db.session.query(
        UserPhoto.id,
        UserPhoto.uploaded_at.label('timestamp'),
        db.literal('photo').label('type')
    )

    feed_query = posts_query.union_all(photos_query).order_by(db.desc('timestamp'))
    feed_pagination = feed_query.paginate(page=page, per_page=per_page, error_out=False)

    serialized_feed_items = []
    for item in feed_pagination.items:
        if item.type == "post":
            post = Post.query.get(item.id)
            serialized_item = serialize_post_item(post)
            if current_user.is_authenticated:
                serialized_item["data"]["is_liked_by_current_user"] = current_user.has_liked_item('post', item.id)
            else:
                serialized_item["data"]["is_liked_by_current_user"] = False
            serialized_feed_items.append(serialized_item)
        elif item.type == "photo":
            photo = UserPhoto.query.get(item.id)
            serialized_item = serialize_photo_item(photo)
            if current_user.is_authenticated:
                serialized_item["data"]["is_liked_by_current_user"] = current_user.has_liked_item('photo', item.id)
            else:
                serialized_item["data"]["is_liked_by_current_user"] = False
            serialized_feed_items.append(serialized_item)

    return jsonify({
        "items": serialized_feed_items,
        "pagination": {
            "page": feed_pagination.page,
            "per_page": feed_pagination.per_page,
            "total_items": feed_pagination.total,
            "total_pages": feed_pagination.pages,
            "has_next": feed_pagination.has_next,
            "has_prev": feed_pagination.has_prev,
            "next_page_url": url_for('api.get_feed', page=feed_pagination.next_num, per_page=per_page, _external=True) if feed_pagination.has_next else None,
            "prev_page_url": url_for('api.get_feed', page=feed_pagination.prev_num, per_page=per_page, _external=True) if feed_pagination.has_prev else None
        }
    })

@api_bp.route('/item/<string:item_type>/<int:item_id>', methods=['GET'])
@login_required
def get_item(item_type, item_id):
    """
    API endpoint to retrieve a single item.
    """
    item = None
    if item_type == 'post':
        item = Post.query.get(item_id)
    elif item_type == 'photo':
        item = UserPhoto.query.get(item_id)
    elif item_type == 'comment':
        item = Comment.query.get(item_id)
    else:
        return jsonify(status="error", message="Invalid item type specified."), 400

    if not item:
        return jsonify(status="error", message=f"{item_type.capitalize()} not found."), 404

    if item_type == 'post':
        serialized_item = serialize_post_item(item)
    elif item_type == 'photo':
        serialized_item = serialize_photo_item(item)
    elif item_type == 'comment':
        serialized_item = serialize_comment_item(item)

    return jsonify(serialized_item)

from ..models import Comment

@api_bp.route('/item/<string:target_type>/<int:target_id>/like_details', methods=['GET'])
@login_required
def get_item_like_details(target_type, target_id):
    """
    API endpoint to retrieve like count and current user's like status for an item.
    Supported target_types: 'post', 'comment', 'userphoto'.
    """
    item = None
    if target_type == 'post':
        item = Post.query.get_or_404(target_id)
    elif target_type == 'comment':
        item = Comment.query.get_or_404(target_id)
    elif target_type == 'userphoto':
        item = UserPhoto.query.get_or_404(target_id)
    else:
        return jsonify(status="error", message="Invalid target type specified."), 400

    # Permission check (simplified)
    if hasattr(item, 'is_published') and not item.is_published and item.user_id != current_user.id and not current_user.is_admin:
        return jsonify(status="error", message="Forbidden to view like details for this item."), 403
    if hasattr(item, 'user') and hasattr(item.user, 'is_profile_public') and not item.user.is_profile_public and item.user_id != current_user.id and not current_user.is_admin:
         return jsonify(status="error", message="Forbidden to view like details for this item."), 403

    like_count = item.likes.count()
    current_user_has_liked = current_user.has_liked_item(target_type, target_id)

    return jsonify(
        status="success",
        target_type=target_type,
        target_id=target_id,
        like_count=like_count,
        current_user_has_liked=current_user_has_liked
    )

@api_bp.route('/item/<string:target_type>/<int:target_id>/comments', methods=['GET'])
@login_required
def get_item_comments(target_type, target_id):
    """
    API endpoint to retrieve comments for an item.
    Supported target_types: 'post', 'userphoto'.
    """
    item = None
    if target_type == 'post':
        item = Post.query.get_or_404(target_id)
    elif target_type == 'userphoto':
        item = UserPhoto.query.get_or_404(target_id)
    else:
        return jsonify(status="error", message="Invalid target type specified."), 400

    # Permission check (simplified)
    if hasattr(item, 'is_published') and not item.is_published and item.user_id != current_user.id and not current_user.is_admin:
        return jsonify(status="error", message="Forbidden to view comments for this item."), 403
    if hasattr(item, 'user') and hasattr(item.user, 'is_profile_public') and not item.user.is_profile_public and item.user_id != current_user.id and not current_user.is_admin:
            return jsonify(status="error", message="Forbidden to view comments for this item."), 403

    comments = item.comments.order_by(Comment.created_at.desc()).all()
    serialized_comments = [serialize_comment_item(comment) for comment in comments]

    return jsonify(comments=serialized_comments)


from ..api_utils import serialize_post_item, serialize_photo_item, serialize_comment_item

# Add other API routes here in the future
