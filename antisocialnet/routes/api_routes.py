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
            post = db.session.get(Post, item.id)
            serialized_item = serialize_post_item(post)
            if current_user.is_authenticated:
                serialized_item["data"]["is_liked_by_current_user"] = current_user.has_liked_item('post', item.id)
            else:
                serialized_item["data"]["is_liked_by_current_user"] = False
            serialized_feed_items.append(serialized_item)
        elif item.type == "photo":
            photo = db.session.get(UserPhoto, item.id)
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
        item = db.session.get(Post, item_id)
    elif item_type == 'photo':
        item = db.session.get(UserPhoto, item_id)
    elif item_type == 'comment':
        item = db.session.get(Comment, item_id)
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

@api_bp.route('/item/<string:target_type>/<int:target_id>/like', methods=['POST'])
@login_required
def like_item(target_type, target_id):
    action = request.json.get('action', 'like') # 'like' or 'unlike'

    if target_type not in ['post', 'comment', 'photo']:
        return jsonify(status="error", message="Invalid item type."), 404

    target_model = None
    if target_type == 'post':
        target_model = Post
    elif target_type == 'comment':
        target_model = Comment
    elif target_type == 'photo':
        target_model = UserPhoto

    target_item = target_model.query.get_or_404(target_id)

    if action == 'like':
        if not current_user.has_liked_item(target_type, target_item.id):
            current_user.like_item(target_type, target_item.id)
            db.session.commit()
    elif action == 'unlike':
        if current_user.has_liked_item(target_type, target_item.id):
            current_user.unlike_item(target_type, target_item.id)
            db.session.commit()

    return jsonify({
        'status': 'success',
        'user_has_liked': current_user.has_liked_item(target_type, target_item.id),
        'new_like_count': target_item.likes.count()
    })

@api_bp.route('/item/<string:target_type>/<int:target_id>/like_details', methods=['GET'])
@login_required
def get_item_like_details(target_type, target_id):
    """
    API endpoint to retrieve like count and current user's like status for an item.
    Supported target_types: 'post', 'comment', 'userphoto'.
    """
    item = None
    if target_type == 'post':
        item = db.session.get(Post, target_id)
    elif target_type == 'comment':
        item = db.session.get(Comment, target_id)
    elif target_type == 'userphoto':
        item = db.session.get(UserPhoto, target_id)
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

@api_bp.route('/item/<string:target_type>/<int:target_id>/comments', methods=['POST'])
@login_required
def post_item_comment(target_type, target_id):
    if target_type not in ['post', 'userphoto']:
        return jsonify(status="error", message="Invalid target type specified."), 400

    target_model = None
    if target_type == 'post':
        target_model = Post
    elif target_type == 'userphoto':
        target_model = UserPhoto

    target_item = target_model.query.get_or_404(target_id)

    # Permission check: can the current user comment on this item?
    if hasattr(target_item, 'is_published') and not target_item.is_published and target_item.user_id != current_user.id and not current_user.is_admin:
        return jsonify(status="error", message="Forbidden to comment on this item."), 403
    if hasattr(target_item, 'user') and hasattr(target_item.user, 'is_profile_public') and not target_item.user.is_profile_public and target_item.user_id != current_user.id and not current_user.is_admin:
        return jsonify(status="error", message="Forbidden to comment on this item."), 403

    json_data = request.json if request.is_json else {}
    form = CommentForm(formdata=None, **json_data)

    if form.validate():
        sanitized_text = bleach.clean(form.text.data.strip(), tags=[], strip=True)
        new_comment = Comment(
            text=sanitized_text,
            user_id=current_user.id,
            target_type=target_type,
            target_id=target_item.id
        )
        db.session.add(new_comment)
        db.session.commit()
        from sqlalchemy import func

        mentioned_full_names = extract_mentions(new_comment.text)
        new_mentions_created = False
        if mentioned_full_names:
            for name_str in mentioned_full_names:
                mentioned_users = User.query.filter(func.lower(User.full_name) == func.lower(name_str)).all()
                if len(mentioned_users) == 1:
                    mentioned_user_obj = mentioned_users[0]
                    if mentioned_user_obj.id != current_user.id:
                        existing_notif = Notification.query.filter_by(
                            user_id=mentioned_user_obj.id,
                            actor_id=current_user.id,
                            type='mention_in_comment',
                            target_type='comment',
                            target_id=new_comment.id
                        ).first()
                        if not existing_notif:
                            mention_notification = Notification(
                                user_id=mentioned_user_obj.id,
                                actor_id=current_user.id,
                                type='mention_in_comment',
                                target_type='comment',
                                target_id=new_comment.id
                            )
                            db.session.add(mention_notification)
                            new_mentions_created = True
                            current_app.logger.info(f"Mention notification created for user '{mentioned_user_obj.full_name}' (ID: {mentioned_user_obj.id}) in comment {new_comment.id}")
                elif len(mentioned_users) > 1:
                    current_app.logger.info(f"Ambiguous mention for '{name_str}' in comment {new_comment.id}: {len(mentioned_users)} users found. No notification sent.")
                else:
                    current_app.logger.info(f"Mentioned name '{name_str}' in comment {new_comment.id} does not correspond to any user. No notification sent.")

        if new_mentions_created:
            db.session.commit()

        return jsonify(serialize_comment_item(new_comment)), 201
    else:
        errors = {field: error[0] for field, error in form.errors.items()}
        return jsonify({'errors': errors}), 400

@api_bp.route('/item/<string:target_type>/<int:target_id>/comments', methods=['GET'])
@login_required
def get_item_comments(target_type, target_id):
    """
    API endpoint to retrieve comments for an item.
    Supported target_types: 'post', 'userphoto'.
    """
    item = None
    if target_type == 'post':
        item = db.session.get(Post, target_id)
    elif target_type == 'userphoto':
        item = db.session.get(UserPhoto, target_id)
    else:
        return jsonify(status="error", message="Invalid target type specified."), 400

    # Permission check (simplified)
    if hasattr(item, 'is_published') and not item.is_published and item.user_id != current_user.id and not current_user.is_admin:
        return jsonify(status="error", message="Forbidden to view comments for this item."), 403
    if hasattr(item, 'user') and hasattr(item.user, 'is_profile_public') and not item.user.is_profile_public and item.user_id != current_user.id and not current_user.is_admin:
            return jsonify(status="error", message="Forbidden to view comments for this item."), 403

    comments = sorted(item.comments, key=lambda c: c.created_at, reverse=True)
    serialized_comments = [serialize_comment_item(comment) for comment in comments]

    return jsonify(comments=serialized_comments)


from ..api_utils import serialize_post_item, serialize_photo_item, serialize_comment_item, serialize_user_profile
from ..models import User

@api_bp.route('/user/<int:user_id>', methods=['GET'])
@login_required
def get_user_details(user_id):
    """
    API endpoint to retrieve user profile details.
    """
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(status="error", message="User not found."), 404

    # Privacy check
    if not user.is_profile_public and user.id != current_user.id:
        return jsonify(status="error", message="This profile is private."), 403

    with current_app.test_request_context():
        serialized_user = serialize_user_profile(user)

    return jsonify(serialized_user)

@api_bp.route('/user/<int:user_id>/posts', methods=['GET'])
@login_required
def get_user_posts(user_id):
    """
    API endpoint to retrieve a user's posts.
    """
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(status="error", message="User not found."), 404

    # Privacy check
    if not user.is_profile_public and user.id != current_user.id:
        return jsonify(status="error", message="This profile is private."), 403

    posts = Post.query.filter_by(user_id=user_id, is_published=True).order_by(Post.published_at.desc()).all()
    serialized_posts = [serialize_post_item(post) for post in posts]
    return jsonify(posts=serialized_posts)

@api_bp.route('/user/<int:user_id>/photos', methods=['GET'])
@login_required
def get_user_photos(user_id):
    """
    API endpoint to retrieve a user's photos.
    """
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(status="error", message="User not found."), 404

    # Privacy check
    if not user.is_profile_public and user.id != current_user.id:
        return jsonify(status="error", message="This profile is private."), 403

    photos = UserPhoto.query.filter_by(user_id=user_id).order_by(UserPhoto.uploaded_at.desc()).all()
    serialized_photos = [serialize_photo_item(photo) for photo in photos]
    return jsonify(photos=serialized_photos)

# Add other API routes here in the future
