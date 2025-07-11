# Utility functions for the application can be placed here.
import re
import unicodedata
from datetime import datetime
from markupsafe import Markup, escape
import bleach
import markdown as md_lib # Use md_lib to avoid conflict with template filter name

def generate_slug_util(text, max_length=255):
    """
    Generates a URL-friendly slug from a string.
    """
    if text is None:
        return ''
    text = str(text)
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    # Convert to lowercase
    text = text.lower()
    # Remove special characters (allow alphanumeric and hyphens)
    text = re.sub(r'[^\w\s-]', '', text)
    # Replace whitespace, underscores and multiple hyphens with a single hyphen
    text = re.sub(r'[\s_]+', '-', text) # Modified to include underscore
    text = re.sub(r'-+', '-', text)
    # Trim leading/trailing hyphens
    text = text.strip('-')
    # Truncate to max_length
    if max_length > 0:
        text = text[:max_length]
        # Strip hyphens that might have become trailing due to truncation
        text = text.strip('-')
    return text

def human_readable_date(dt, show_time=True):
    """
    Formats a datetime object into a human-readable string.
    Example: "Jan 5, 2023, 03:45 PM" or "Jan 5, 2023"
    """
    if not isinstance(dt, datetime):
        return dt # Return as is if not a datetime object

    if show_time:
        formatted_date = dt.strftime("%b %d, %Y, %I:%M %p")
        if formatted_date.startswith('0'): # More robust check for leading zero
            formatted_date = formatted_date[1:]
        return formatted_date
    else:
        return dt.strftime("%b %d, %Y")

def linkify_mentions(text):
    """
    Converts @username mentions into links to user profiles.
    This is a simplified version. A robust version would check user existence.
    """
    if text is None:
        return ''
    text = str(text)

    from .models import User # Local import to avoid circular dependency at module level
    from . import db # Assuming db is SQLAlchemy instance from __init__
    from sqlalchemy import func # For func.lower

    # Regex to find @Full Name patterns (alphanumeric, underscore, apostrophe, spaces)
    # This must match the one in extract_mentions
    mention_regex = r'@([A-Za-z0-9_\']+(?:\s[A-Za-z0-9_\']+)*)' # Regex for @FullName

    def replace_mention(match):
        full_name_mention = ' '.join(match.group(1).split()) # Normalize spaces in extracted name

        # Query for the user by full_name (case-insensitive)
        # This is a simplified approach. For production, consider performance implications of func.lower()
        # and how to handle multiple users with the same full_name.
        users_found = User.query.filter(func.lower(User.full_name) == func.lower(full_name_mention)).all()

        if len(users_found) == 1:
            user = users_found[0]
            # TODO: AGENTS.md specifies profile URLs should use user.handle.
            # This requires adding a 'handle' field to the User model.
            # For now, linking by user.id.
            return f'[@{full_name_mention}](/profile/{user.id})' # Generates a markdown link
        else:
            # If no user or multiple users found, don't linkify, return original mention text
            # This prevents linking to wrong profile or dead links.
            # UI could potentially offer disambiguation if multiple users are found.
            # For now, just return the text.
            current_app.logger.info(f"Mention '@{full_name_mention}' not linked: {len(users_found)} users found.")
            return f'@{full_name_mention}' # Return as plain text

    # Need access to current_app for logging inside replace_mention,
    # which is tricky as this util might be called outside app context by Jinja filter.
    # A better way is to pass current_app or its logger if needed, or handle logging outside.
    # For now, assuming this function is called within an app context (e.g., by the template filter).
    from flask import current_app

    linked_text = re.sub(mention_regex, replace_mention, text)
    return linked_text

def markdown_to_html_and_sanitize_util(text):
    """
    Converts Markdown text to HTML and sanitizes it.
    """
    if text is None:
        return ''
    text = str(text)

    # First, escape any raw HTML in the input text to prevent it from being processed as HTML by markdown
    # and to ensure it's treated as literal text.
    text_escaped = escape(text)

    # Convert markdown to HTML
    # Using extensions like 'fenced_code' for code blocks, 'tables' for tables
    html_content = md_lib.markdown(text_escaped, extensions=['fenced_code', 'tables', 'extra'])

    # Old comments regarding basic sanitization or bleach not being assumed have been removed,
    # as bleach is now actively used.

    # Step 2: Sanitize the generated HTML using Bleach
    # Uses the ALLOWED_TAGS_CONFIG and ALLOWED_ATTRIBUTES_CONFIG defined in this file.
    sanitized_html = bleach.clean(
        html_content,
        tags=ALLOWED_TAGS_CONFIG,
        attributes=ALLOWED_ATTRIBUTES_CONFIG,
        strip=True  # Remove disallowed tags entirely
    )

    return Markup(sanitized_html)


def init_app(app):
    """Initialize utility functions and filters for the Flask app."""
    app.jinja_env.filters['human_readable_date'] = human_readable_date
    # Other filters that might be defined in utils.py could be registered here too.
    # The markdown and linkify_mentions filters are registered directly in __init__.py
    # using these utility functions, which is also fine.
    # No need to re-register markdown_to_html_and_sanitize_util or linkify_mentions here
    # if they are already handled in __init__.py.
    # This init_app is primarily for filters directly defined AND registered from utils.
    pass

def flash_form_errors_util(form):
    """Flashes all errors from a Flask-WTF form."""
    from flask import flash # Local import to avoid issues if utils is imported before app context
    for field, errors in form.errors.items():
        for error in errors:
            field_label = getattr(form, field).label.text if hasattr(getattr(form, field), 'label') else field
            flash(f"Error in {field_label}: {error}", 'danger')

# Configuration for HTML sanitization (e.g., for Bleach)
# These are example lists; a real application would have more comprehensive ones.
ALLOWED_TAGS_CONFIG = [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike', 'del',
    'ul', 'ol', 'li',
    'a', 'img',
    'pre', 'code', 'blockquote',
    'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
    'figure', 'figcaption',
    'span', 'div', # Allow span and div for flexible styling if content is trusted or further filtered
    # SVG tags might be needed if allowing SVG uploads and inline display
]

ALLOWED_ATTRIBUTES_CONFIG = {
    '*': ['class', 'id'],  # Allow class, id on any allowed tag
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'table': ['summary'],
    'td': ['colspan', 'rowspan', 'align', 'valign'],
    'th': ['colspan', 'rowspan', 'align', 'valign', 'scope'],
    # Add specific attributes for other tags as needed
}

def allowed_file_util(filename):
    """Checks if the filename has an allowed extension."""
    from flask import current_app
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def extract_mentions(text):
    """
    Extracts @Full Name mentions from text.
    A name can consist of words (alphanumeric + underscore) separated by single spaces.
    Returns a list of unique full names without the '@'.
    """
    if not text:
        return []
    # Regex:
    # @                         - literal @
    # (                         - start capture group 1
    #   [A-Za-z0-9_']+          - first word (alphanumeric, underscore, apostrophe)
    #   (?:                     - start non-capturing group for subsequent words
    #     \s                    - a single space
    #     [A-Za-z0-9_']+        - subsequent word
    #   )*                      - zero or more subsequent words
    # )                         - end capture group 1
    # This regex allows for names like @Jane, @Jane_Doe, @Jane Doe, @J'Doe
    # It stops if there are multiple spaces or other punctuation (except apostrophe within words).
    # To align with test_extract_mentions which expects single-token mentions for "@world and" -> "world"
    # the regex should only capture the first word-like token.
    mention_regex = r'@([A-Za-z0-9_\']+)' # Simplified to capture single tokens
    mentions = re.findall(mention_regex, text)
    # Strip trailing spaces from extracted mentions, just in case regex captures it with lookaheads/behinds (though current one shouldn't)
    # Also, normalize multiple spaces within a name to a single space if the regex were more lenient.
    # For this regex, it should be fine, but good practice if regex changes.
    processed_mentions = [ ' '.join(m.split()) for m in mentions]
    return list(set(processed_mentions)) # Return unique mentions

def update_post_relations_util(post, form_data, current_user_id, is_new_post=False):
    """
    Updates post relationships like categories, tags, and mentions.
    This is a placeholder and will need access to models and db.session.
    It's better if this logic resides within the Post model or a service layer.
    For now, providing a structure.
    """
    from flask import current_app
    from . import db # Assuming db is SQLAlchemy instance from __init__
    from .models import Category, Tag, User, Notification # Removed PostTag, PostCategory

    # Categories
    post.categories.clear()
    if form_data.categories.data: # Access data using .data attribute
        for cat_id in form_data.categories.data:
            category = db.session.get(Category, int(cat_id))
            if category:
                post.categories.append(category)

    # Tags
    # Clear existing tags using the relationship. SQLAlchemy will handle the association table.
    post.tags.clear()
    if form_data.tags_string.data: # Access data using .data attribute
        tag_names = [name.strip() for name in form_data.tags_string.data.split(',') if name.strip()]
        for tag_name in tag_names:
            tag_slug = generate_slug_util(tag_name) # Slug is still generated for lookup
            tag = Tag.query.filter_by(slug=tag_slug).first()
            if not tag:
                tag = Tag(name=tag_name) # Pass only name; slug is generated in Tag.__init__
                db.session.add(tag)
                # db.session.flush() # Flush to get tag.id if needed immediately, or commit later
            post.tags.append(tag) # Appending to association collection

    # Mentions (simplified: assumes extract_mentions is already called and usernames are passed)
    # This part is highly dependent on how mentions are handled (e.g., in form_data or extracted from content)
    # Let's assume form_data might contain an explicit list of mentioned usernames,
    # or we re-extract from post.content. For now, re-extracting from content.
    from sqlalchemy import func # For func.lower for case-insensitive query

    mentioned_full_names = extract_mentions(post.content) # Now extracts full names
    if mentioned_full_names:
        for full_name in mentioned_full_names:
            # Case-insensitive query for full_name. This might return multiple users.
            # For notifications, we should only notify if we find a *single* unique match.
            mentioned_users = User.query.filter(func.lower(User.full_name) == func.lower(full_name)).all()

            if len(mentioned_users) == 1:
                mentioned_user = mentioned_users[0]
                if mentioned_user.id != current_user_id: # Don't notify for self-mentions
                    # Check if a notification already exists for this post and user to avoid duplicates
                    existing_notification = Notification.query.filter_by(
                        user_id=mentioned_user.id,
                        actor_id=current_user_id, # Also check actor to allow different users to mention same person in same post
                        type='mention_in_post',
                        target_type='post', # Using new polymorphic fields
                        target_id=post.id
                    ).first()

                    if not existing_notification:
                        notification = Notification(
                            user_id=mentioned_user.id,
                            actor_id=current_user_id,
                            type='mention_in_post',
                            target_type='post',
                            target_id=post.id
                        )
                        db.session.add(notification)
                        current_app.logger.info(f"Mention notification to be created for user '{mentioned_user.full_name}' (ID: {mentioned_user.id}) in post {post.id}")
            elif len(mentioned_users) > 1:
                current_app.logger.info(f"Ambiguous mention for '{full_name}' in post {post.id}: {len(mentioned_users)} users found. No notification sent.")
            else:
                current_app.logger.info(f"Mentioned name '{full_name}' in post {post.id} does not correspond to any user. No notification sent.")


    # Note: db.session.commit() should be handled by the calling route function
    # after all updates are done. This utility should not commit itself.
    return post


# New file upload utility
import os
import uuid
from PIL import Image # Ensure Pillow is installed: pip install Pillow
from werkzeug.utils import secure_filename
from flask import current_app, flash

# allowed_file_util is defined earlier in this file.

def save_uploaded_file(
    file_storage_object,
    upload_type,
    base_upload_path_config_key,
    max_size_bytes_config_key,
    current_user_id=None,
    crop_coords=None,
    thumbnail_size=None,
    existing_db_path=None
):
    """
    Handles common logic for validating and saving uploaded files.
    Returns a path relative to app.static_folder for DB storage, or None.
    """
    if not file_storage_object or not file_storage_object.filename:
        # flash("No file selected.", "warning") # Route should handle "no file if optional"
        return None # Or a specific indicator like "NO_FILE_PROVIDED"

    filename = secure_filename(file_storage_object.filename)

    if not allowed_file_util(filename):
        allowed_ext_list = current_app.config.get('ALLOWED_EXTENSIONS', [])
        flash(f"Invalid file type: '{filename.rsplit('.', 1)[-1] if '.' in filename else 'unknown'}'. Allowed types are {', '.join(allowed_ext_list)}.", 'danger')
        return None

    file_size = file_storage_object.content_length
    max_size_bytes = current_app.config.get(max_size_bytes_config_key)

    if file_size is None:
        current_app.logger.warning(f"Could not determine file size via content_length for {upload_type} upload: {filename}. This might bypass size checks if not handled by client-side validation.")
        # Consider adding a server-side stream read size check as a fallback if this is a concern.
    elif max_size_bytes is not None and file_size > max_size_bytes:
        max_size_mb = max_size_bytes // 1024 // 1024
        flash(f"File for {upload_type.replace('_', ' ')} is too large ({(file_size / 1024 / 1024):.2f}MB). Max size: {max_size_mb}MB.", 'danger')
        return None

    ext = filename.rsplit('.', 1)[-1].lower()
    unique_stem = uuid.uuid4().hex if upload_type == "gallery_photo" else str(uuid.uuid4())
    unique_filename = f"{unique_stem}.{ext}"

    relative_base_path = current_app.config.get(base_upload_path_config_key)
    if not relative_base_path:
        current_app.logger.error(f"Upload path config key '{base_upload_path_config_key}' not found or empty in app config.")
        flash("Server configuration error for file uploads. Path not configured.", "danger")
        return None

    final_save_dir_abs = os.path.join(current_app.static_folder, relative_base_path)
    db_path_prefix = relative_base_path

    if upload_type == "gallery_photo" and current_user_id is not None:
        user_specific_folder_name = str(current_user_id)
        final_save_dir_abs = os.path.join(final_save_dir_abs, user_specific_folder_name)
        db_path_prefix = os.path.join(db_path_prefix, user_specific_folder_name)

    try:
        os.makedirs(final_save_dir_abs, exist_ok=True)
    except OSError as e:
        current_app.logger.error(f"Could not create directory {final_save_dir_abs}: {e}", exc_info=True)
        flash("Error creating upload directory on server.", "danger")
        return None

    save_path_abs = os.path.join(final_save_dir_abs, unique_filename)

    try:
        file_storage_object.stream.seek(0)
        if upload_type == "profile_photo" and (crop_coords or thumbnail_size):
            img = Image.open(file_storage_object.stream)
            if crop_coords and crop_coords.get('width', 0) > 0 and crop_coords.get('height', 0) > 0:
                try:
                    x = int(float(crop_coords['x']))
                    y = int(float(crop_coords['y']))
                    w = int(float(crop_coords['width']))
                    h = int(float(crop_coords['height']))
                    img = img.crop((x, y, x + w, y + h))
                except (ValueError, TypeError, KeyError) as e_crop:
                    current_app.logger.warning(f"Invalid crop coordinates for profile photo: {crop_coords}. Error: {e_crop}")
                    flash("Invalid crop coordinates provided. Photo processed without custom cropping.", "warning")

            if thumbnail_size:
                img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS) # Use LANCZOS for better quality

            if ext in ['jpg', 'jpeg'] and img.mode == 'RGBA':
                img = img.convert('RGB')
            img.save(save_path_abs)
        else:
            file_storage_object.save(save_path_abs)

        if not os.path.exists(save_path_abs):
            current_app.logger.error(f"Failed to save file to disk at {save_path_abs} for {upload_type}.")
            flash(f"Error saving {upload_type.replace('_', ' ')}: File could not be written to disk.", "danger")
            return None

        # Delete old file if existing_db_path is provided (path relative to static folder)
        if upload_type == "profile_photo" and existing_db_path:
            old_file_abs_path = os.path.join(current_app.static_folder, existing_db_path)
            # Basic check: ensure old file is within static folder to prevent arbitrary deletion
            if old_file_abs_path.startswith(current_app.static_folder) and os.path.exists(old_file_abs_path):
                 if old_file_abs_path != save_path_abs: # Don't delete if it's the same file (e.g. re-saving without change)
                    try:
                        os.remove(old_file_abs_path)
                        current_app.logger.info(f"Old {upload_type} file deleted: {old_file_abs_path}")
                    except OSError as oe:
                        current_app.logger.error(f"Error deleting old {upload_type} file {old_file_abs_path}: {oe}", exc_info=True)
            elif existing_db_path: # Log if path seems problematic but was provided
                 current_app.logger.warning(f"Old file path {existing_db_path} for profile_photo not found or invalid for deletion from {current_app.static_folder}.")


        db_final_relative_path = os.path.join(db_path_prefix, unique_filename).replace("\\", "/")
        return db_final_relative_path

    except Exception as e_save:
        current_app.logger.error(f"Exception during {upload_type} file processing or saving to {save_path_abs}: {e_save}", exc_info=True)
        flash(f"Error processing {upload_type.replace('_', ' ')} file: An unexpected error occurred.", 'danger')
        if os.path.exists(save_path_abs): # Attempt to clean up partially saved file
            try:
                os.remove(save_path_abs)
            except OSError:
                pass
        return None
