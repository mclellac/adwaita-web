from flask import url_for, current_app
from .models import Post, UserPhoto, Comment

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

    from .utils import markdown_to_html_and_sanitize_util # For preview
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
                "like_count": post.like_count, # Use the existing property
            "url": url_for('post.view_post', post_id=post.id, _external=True),
            "categories": [{"slug": c.slug, "name": c.name} for c in post.categories],
            "tags": [{"slug": t.slug, "name": t.name} for t in post.tags],
            # is_liked_by_current_user will be added in get_feed
        }
    }

def serialize_photo_item(photo):
    actor = serialize_actor(photo.user)

    from .utils import markdown_to_html_and_sanitize_util # For caption
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
            "gallery_url": url_for('profile.view_gallery', user_id=photo.user.id, _anchor=f'photo-{photo.id}', _external=True)
        }
    }

def serialize_comment_item(comment):
    from flask_login import current_user
    actor = serialize_actor(comment.author)

    from .utils import markdown_to_html_and_sanitize_util # For caption
    text_html = markdown_to_html_and_sanitize_util(comment.text) if comment.text else None

    is_liked_by_current_user = False
    if current_user.is_authenticated:
        is_liked_by_current_user = current_user.has_liked_item('comment', comment.id)

    return {
        "id": f"comment_{comment.id}",
        "type": "comment",
        "timestamp": comment.created_at.isoformat(), # Assuming aware UTC objects
        "actor": actor,
        "data": {
            "comment_id": comment.id,
            "text_html": text_html,
            "like_count": comment.like_count,
            "target_type": comment.target_type,
            "target_id": comment.target_id,
            "is_liked_by_current_user": is_liked_by_current_user
        }
    }

def serialize_user_profile(user):
    """
    Serializes a user's public profile information.
    """
    profile_photo_url = None
    if user.profile_photo_url:
        profile_photo_url = url_for('static', filename=user.profile_photo_url, _external=True)
    else:
        profile_photo_url = url_for('static', filename='img/default_avatar.png', _external=True)

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "profile_photo_url": profile_photo_url,
        "profile_info": user.profile_info,
        "website_url": user.website_url,
        "is_profile_public": user.is_profile_public,
        "follower_count": user.followers.count(),
        "following_count": user.followed.count(),
        "post_count": user.posts.filter_by(is_published=True).count(),
        "photo_count": user.gallery_photos.count()
    }

def serialize_comment_flag(flag):
    """
    Serializes a comment flag.
    """
    return {
        "id": flag.id,
        "comment_id": flag.comment_id,
        "flagger_id": flag.flagger_user_id,
        "comment": serialize_comment_item(flag.comment),
        "flagger": serialize_actor(flag.flagger),
        "created_at": flag.created_at.isoformat(),
        "is_resolved": flag.is_resolved
    }

def serialize_notification(notification):
    """
    Serializes a notification.
    """
    return {
        "id": notification.id,
        "actor": serialize_actor(notification.actor),
        "type": notification.type,
        "target_type": notification.target_type,
        "target_id": notification.target_id,
        "timestamp": notification.timestamp.isoformat(),
        "is_read": notification.is_read
    }
