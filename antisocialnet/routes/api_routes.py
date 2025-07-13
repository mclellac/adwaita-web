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

    Authentication: Required (session-based).

    Query Parameters:
      - page (int, optional, default=1): The page number for pagination.
      - per_page (int, optional, default=config's POSTS_PER_PAGE or 10):
        Number of items per page.

    Response JSON Structure:
      {
        "items": [
          {
            "id": "string (e.g., post_1, photo_2)",
            "type": "string ('post' or 'photo')",
            "timestamp": "ISO8601 datetime string (UTC)",
            "actor": { "id": int, "username": str, "full_name": str, "profile_photo_url": str },
            "data": { ... type-specific data ... }
            // For 'post': { post_id, title, content_html_preview, comment_count, like_count, url, categories, tags, is_liked_by_current_user }
            // For 'photo': { photo_id, uploader_id, caption_html, image_url_large, comment_count, gallery_url }
          }
        ],
        "pagination": {
          "page": int,
          "per_page": int,
          "total_items": int,
          "total_pages": int,
          "has_next": bool,
          "has_prev": bool,
          "next_page_url": "string_url_or_null",
          "prev_page_url": "string_url_or_null"
        }
      }
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('POSTS_PER_PAGE', 10), type=int)

    raw_feed_items = []

    posts_query = Post.query.filter(Post.is_published == True)
    for post in posts_query.all():
        raw_feed_items.append({
            "type": "post",
            "timestamp": post.published_at or post.created_at,
            "original_object": post
        })

    photos_query = UserPhoto.query
    for photo in photos_query.all():
        raw_feed_items.append({
            "type": "photo",
            "timestamp": photo.uploaded_at,
            "original_object": photo
        })

    raw_feed_items.sort(key=lambda x: x["timestamp"], reverse=True)

    total_items = len(raw_feed_items)
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    paginated_raw_items = raw_feed_items[start_index:end_index]

    serialized_feed_items = []
    for item in paginated_raw_items:
        if item["type"] == "post":
            serialized_item = serialize_post_item(item["original_object"])
            if current_user.is_authenticated:
                 serialized_item["data"]["is_liked_by_current_user"] = current_user.has_liked_item('post', item["original_object"].id)
            else:
                 serialized_item["data"]["is_liked_by_current_user"] = False
            serialized_feed_items.append(serialized_item)
        elif item["type"] == "photo":
            serialized_feed_items.append(serialize_photo_item(item["original_object"]))

    total_pages = (total_items + per_page - 1) // per_page if total_items > 0 else 0
    has_next = page < total_pages
    has_prev = page > 1

    base_url_params = {'per_page': per_page}

    next_page_url = url_for('api.get_feed', page=page + 1, **base_url_params, _external=True) if has_next else None
    prev_page_url = url_for('api.get_feed', page=page - 1, **base_url_params, _external=True) if has_prev else None


    current_app.logger.info(f"User {current_user.username} requested API feed: page={page}, per_page={per_page}. Returning {len(serialized_feed_items)} items.")

    return jsonify({
        "items": serialized_feed_items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
            "next_page_url": next_page_url,
            "prev_page_url": prev_page_url
        }
    })

@api_bp.route('/item/<string:target_type>/<int:target_id>/like_details', methods=['GET'])
@login_required
def get_item_like_details(target_type, target_id):
    """
    API endpoint to retrieve like count and current user's like status for an item.
    Supported target_types: 'post', 'comment', 'photo'.
    """
    from ..models import Post, Comment, UserPhoto # Local import for models

    item = None
    if target_type == 'post':
        item = db.session.get(Post, target_id)
    elif target_type == 'comment':
        item = db.session.get(Comment, target_id)
    elif target_type == 'photo':
        item = db.session.get(UserPhoto, target_id)
    else:
        return jsonify(status="error", message="Invalid target type specified."), 400

    if not item:
        return jsonify(status="error", message=f"{target_type.capitalize()} not found."), 404

    if target_type == 'post' and not item.is_published and item.user_id != current_user.id and not current_user.is_admin:
        return jsonify(status="error", message="Forbidden to view like details for this post."), 403
    if target_type == 'photo' and not item.user.is_profile_public and item.user_id != current_user.id and not current_user.is_admin:
         return jsonify(status="error", message="Forbidden to view like details for this photo."), 403

    like_count = item.like_count
    current_user_has_liked = current_user.has_liked_item(target_type, target_id)

    return jsonify(
        status="success",
        target_type=target_type,
        target_id=target_id,
        like_count=like_count,
        current_user_has_liked=current_user_has_liked
    )


from flask import url_for

def serialize_actor(user_model_instance):
    if not user_model_instance:
        return None

    profile_photo_url_val = None
    if user_model_instance.profile_photo_url:
        profile_photo_url_val = url_for('static', filename=user_model_instance.profile_photo_url, _external=True)
    else:
        profile_photo_url_val = url_for('static', filename=current_app.config.get('DEFAULT_AVATAR_PATH', 'img/default_avatar.png'), _external=True)

    return {
        "id": user_model_instance.id,
        "username": user_model_instance.username,
        "full_name": user_model_instance.full_name,
        "profile_photo_url": profile_photo_url_val
    }

def serialize_post_item(post):
    actor = serialize_actor(post.author)

    from ..utils import markdown_to_html_and_sanitize_util
    content_text_preview = ' '.join((post.content or "").split()[:30]) + ('...' if len((post.content or "").split()) > 30 else '')
    content_html_preview = markdown_to_html_and_sanitize_util(content_text_preview)


    return {
        "id": f"post_{post.id}",
        "type": "post",
        "timestamp": (post.published_at or post.created_at).isoformat(),
        "actor": actor,
        "data": {
            "post_id": post.id,
            "title": None,
            "content_html_preview": content_html_preview,
            "comment_count": post.comments.count(),
                "like_count": post.like_count,
            "url": url_for('post.view_post', post_id=post.id, _external=True),
            "categories": [{"slug": c.slug, "name": c.name} for c in post.categories],
            "tags": [{"slug": t.slug, "name": t.name} for t in post.tags],
        }
    }

def serialize_photo_item(photo):
    actor = serialize_actor(photo.author)

    from ..utils import markdown_to_html_and_sanitize_util
    caption_html = markdown_to_html_and_sanitize_util(photo.caption) if photo.caption else None

    return {
        "id": f"photo_{photo.id}",
        "type": "photo",
        "timestamp": photo.uploaded_at.isoformat(),
        "actor": actor,
        "data": {
            "photo_id": photo.id,
            "uploader_id": photo.user_id,
            "caption_html": caption_html,
            "image_url_large": url_for('static', filename=photo.image_filename, _external=True) if photo.image_filename else None,
            "comment_count": photo.comments.count(),
            "gallery_url": url_for('profile.view_gallery', user_id=photo.author.id, _anchor=f'photo-{photo.id}', _external=True)
        }
    }
