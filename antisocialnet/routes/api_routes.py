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
    # Example: Use POSTS_PER_PAGE for now, can be a new config later e.g., ITEMS_PER_FEED_PAGE
    per_page = request.args.get('per_page', current_app.config.get('POSTS_PER_PAGE', 10), type=int)

    raw_feed_items = []

    # Fetch Posts
    # For now, all public posts. A real feed would be more personalized.
    # Ensure correct timezone handling if not already UTC in DB. Assume created_at/published_at are UTC.
    posts_query = Post.query.filter(Post.is_published == True)
    for post in posts_query.all(): # In a real app, don't use .all() before combining and sorting
        raw_feed_items.append({
            "type": "post",
            "timestamp": post.published_at or post.created_at, # Naive datetime assumed for now
            "original_object": post
        })

    # 2. Fetch UserPhotos
    # For now, all photos. A real feed would be more personalized.
    # Assume uploaded_at is naive datetime.
    photos_query = UserPhoto.query # Add filtering e.g. public profiles only, or followed users
    for photo in photos_query.all(): # In a real app, don't use .all() before combining
        raw_feed_items.append({
            "type": "photo",
            "timestamp": photo.uploaded_at, # Naive datetime
            "original_object": photo
        })

    # TODO: Fetch Activities if they are to be included directly

    # 3. Combine and sort them by timestamp (descending)
    # Ensure timestamps are comparable (aware vs naive, timezone). For simplicity, assuming naive UTC for now.
    # If they are already timezone-aware (e.g. stored as UTC in DB), direct comparison is fine.
    # If mixed, they need to be converted to a common timezone (UTC) before sorting.
    # For now, let's assume they are naive but represent UTC.

    # Python's list.sort or sorted() is stable.
    # For robust timestamp comparison, ensure all are timezone-aware UTC or consistently naive UTC.
    # Let's assume all DB timestamps are naive but represent UTC.
    raw_feed_items.sort(key=lambda x: x["timestamp"], reverse=True)

    # 4. Paginate the combined list manually
    total_items = len(raw_feed_items)
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    paginated_raw_items = raw_feed_items[start_index:end_index]

    # 5. Serialize items
    serialized_feed_items = []
    for item in paginated_raw_items:
        if item["type"] == "post":
            serialized_item = serialize_post_item(item["original_object"])
            # Add is_liked_by_current_user if Post model has this method or similar check
            if current_user.is_authenticated: # current_user is available due to @login_required
                 serialized_item["data"]["is_liked_by_current_user"] = current_user.has_liked_post(item["original_object"])
            else:
                 serialized_item["data"]["is_liked_by_current_user"] = False
            serialized_feed_items.append(serialized_item)
        elif item["type"] == "photo":
            serialized_feed_items.append(serialize_photo_item(item["original_object"]))
        # Add elif for "activity" if including activities

    # Pagination metadata
    total_pages = (total_items + per_page - 1) // per_page if total_items > 0 else 0
    has_next = page < total_pages
    has_prev = page > 1

    base_url_params = {'per_page': per_page} # Keep other existing params if any

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

# --- Serialization Helpers ---
# (These would ideally be above get_feed or in a separate utils_api.py)
from flask import url_for
# User model is already imported via current_user, but explicit import is good practice if used directly
# from ..models import User

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

    from ..utils import markdown_to_html_and_sanitize_util # For preview
    # Generate a text-only preview first, then a safe HTML preview
    # For simplicity, using a basic truncate here. A real app might strip HTML then truncate.
    content_text_preview = ' '.join((post.content or "").split()[:30]) + ('...' if len((post.content or "").split()) > 30 else '')
    # For HTML preview, it's safer to render markdown for a small portion or a summary field
    # This is a placeholder for a more robust HTML preview generation:
    content_html_preview = markdown_to_html_and_sanitize_util(content_text_preview)


    return {
        "id": f"post_{post.id}",
        "type": "post",
        "timestamp": (post.published_at or post.created_at).isoformat(), # Assuming aware UTC objects
        "actor": actor,
        "data": {
            "post_id": post.id,
            "title": None, # Assuming posts don't have titles, use content preview
            "content_html_preview": content_html_preview,
            "comment_count": post.comments.count(),
            "like_count": post.likers.count(),
            "url": url_for('post.view_post', post_id=post.id, _external=True),
            "categories": [{"slug": c.slug, "name": c.name} for c in post.categories],
            "tags": [{"slug": t.slug, "name": t.name} for t in post.tags],
            # is_liked_by_current_user will be added in get_feed
        }
    }

def serialize_photo_item(photo):
    actor = serialize_actor(photo.user)

    from ..utils import markdown_to_html_and_sanitize_util # For caption
    caption_html = markdown_to_html_and_sanitize_util(photo.caption) if photo.caption else None

    return {
        "id": f"photo_{photo.id}",
        "type": "photo",
        "timestamp": photo.uploaded_at.isoformat(), # Assuming aware UTC objects
        "actor": actor,
        "data": {
            "photo_id": photo.id,
            "uploader_id": photo.user_id,
            "caption_html": caption_html,
            "image_url_large": url_for('static', filename=photo.image_filename, _external=True) if photo.image_filename else None,
            # "image_url_thumbnail": ..., # Placeholder
            "comment_count": photo.comments.count(),
            "gallery_url": url_for('profile.view_gallery', username=photo.user.username, _anchor=f'photo-{photo.id}', _external=True)
        }
    }
# Add other API routes here in the future
