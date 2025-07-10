# Utility functions for the application can be placed here.
import re
import unicodedata
from datetime import datetime
from markupsafe import Markup, escape
# Assuming bleach is used for sanitization, if not, this part would need adjustment
# For now, to avoid dependency errors if bleach isn't in requirements.txt,
# we'll make a very basic sanitizer. A proper setup would use bleach.
import bleach # <-- Ensure bleach is imported
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
    # Regex to find @username patterns
    # Allows alphanumeric characters and underscores in usernames
    mention_regex = r'@([a-zA-Z0-9_]+)'

    def replace_mention(match):
        username = match.group(1)
        # In a real app, you'd use url_for here, but that's not available directly in utils
        # without app context. This filter is applied in app context, so this is conceptual.
        # For direct usage if needed outside app context, the URL structure would be hardcoded or passed.
        # Here, we just format it, assuming url_for will be used in the template filter call.
        # This utility function should just return the structure that the template filter can use.
        # For now, it prepares a string that can be made into a link.
        # The actual href creation is better handled in the template filter or by passing url_for.
        # However, the current app structure calls this from the markdown filter.

        # Simple version for now, actual URL generation might need app context or url_for
        # from flask import url_for # This would cause circular import if utils is imported by __init__ too early
        # For now, let's assume the markdown filter will handle the final URL construction if this
        # function is only returning the username. Or, we create a placeholder link.

        # Placeholder link structure, actual linking happens in template filter context
        # This function is more about identifying and formatting, less about final URL generation here.
        # The existing template filter for linkify_mentions in __init__ seems to expect this to return text.
        # Then markdown_to_html_and_sanitize_util probably makes it a link.
        # This function is more about identifying and formatting, less about final URL generation here.
        # The existing template filter for linkify_mentions in __init__ seems to expect this to return text.
        # Then markdown_to_html_and_sanitize_util probably makes it a link.
        # Let's assume this is used by a filter that will then use url_for.
        # A more direct approach would be for this to generate the <a> tag if it had url_for.
        # Based on its usage in `actual_markdown_filter` in `__init__.py`, it seems this function
        # should return text that `markdown_to_html_and_sanitize_util` then processes.
        # The `linkify_mentions_util` is called *before* markdown.

        # Let's make it generate a markdown link, which markdown_to_html_and_sanitize_util will process.
        # This is a common pattern.
        return f'[@{username}](/profile/{username})' # Generates a markdown link

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

    # Sanitize HTML (very basic, replace with Bleach in a real app)
    # This basic version just escapes unknown tags, not truly secure.
    # For now, to avoid adding a new dependency (bleach) if not present.
    # A production app MUST use a robust sanitizer like Bleach.
    # allowed_tags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'pre', 'code', 'blockquote', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td']
    # allowed_attrs = {'a': ['href', 'title'], 'img': ['src', 'alt', 'title']}
    # sanitized_html = bleach.clean(html_content, tags=allowed_tags, attributes=allowed_attrs, strip=True)
    # return Markup(sanitized_html)

    # Since bleach is not assumed, just return the markdown-generated HTML.
    # The responsibility of full sanitization would be higher up or assumed by content trust.
    # For this demo, this might be acceptable if content sources are somewhat trusted or if
    # the markdown library itself does some level of safe HTML generation.
    # ---- OLD CODE END ----

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
    '*': ['class', 'id', 'style'],  # Allow class, id, style on any allowed tag (style should be used with caution)
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
    Extracts @username mentions from text.
    Returns a list of unique usernames without the '@'.
    """
    if not text:
        return []
    # Regex to find @username patterns (alphanumeric, underscores, and hyphens)
    mention_regex = r'@([a-zA-Z0-9_-]+)'
    mentions = re.findall(mention_regex, text)
    return list(set(mentions)) # Return unique mentions

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

    mentioned_usernames = extract_mentions(post.content)
    if mentioned_usernames:
        for username in mentioned_usernames:
            mentioned_user = User.query.filter_by(username=username).first()
            if mentioned_user and mentioned_user.id != current_user_id:
                # Check if a notification already exists for this post and user to avoid duplicates
                existing_notification = Notification.query.filter_by(
                    user_id=mentioned_user.id,
                    related_post_id=post.id,
                    type='mention_in_post' # Or a more general mention type
                ).first()

                if not existing_notification:
                    notification = Notification(
                        user_id=mentioned_user.id,
                        actor_id=current_user_id,
                        type='mention_in_post', # Be specific if possible
                        related_post_id=post.id
                        # related_comment_id could be added if mentions in comments are handled here too
                    )
                    db.session.add(notification)

    # Note: db.session.commit() should be handled by the calling route function
    # after all updates are done. This utility should not commit itself.
    return post


# New file upload utility
import os
import uuid
from PIL import Image # Ensure Pillow is installed: pip install Pillow
from werkzeug.utils import secure_filename
from flask import current_app, flash

# Assuming allowed_file_util is already defined in this file or imported.
# If not, it should be:
# def allowed_file_util(filename):
#     """Checks if the filename has an allowed extension."""
#     return '.' in filename and \
#            filename.rsplit('.', 1)[1].lower() in current_app.config.get('ALLOWED_EXTENSIONS', [])


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
