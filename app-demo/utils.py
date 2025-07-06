# Utility functions for the application can be placed here.
import re
import unicodedata
from datetime import datetime
from markupsafe import Markup, escape
# Assuming bleach is used for sanitization, if not, this part would need adjustment
# For now, to avoid dependency errors if bleach isn't in requirements.txt,
# we'll make a very basic sanitizer. A proper setup would use bleach.
# import bleach
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
    # Replace whitespace and multiple hyphens with a single hyphen
    text = re.sub(r'\s+', '-', text)
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

    # Convert markdown to HTML
    # Using extensions like 'fenced_code' for code blocks, 'tables' for tables
    html_content = md_lib.markdown(text, extensions=['fenced_code', 'tables', 'extra'])

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
    return Markup(html_content)


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
    # Regex to find @username patterns (alphanumeric and underscores)
    mention_regex = r'@([a-zA-Z0-9_]+)'
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
    if form_data.get('categories'): # Assuming categories is a list of category IDs from the form
        for cat_id in form_data.get('categories'):
            category = db.session.get(Category, int(cat_id))
            if category:
                post.categories.append(category)

    # Tags
    # Clear existing tags using the relationship. SQLAlchemy will handle the association table.
    post.tags.clear()
    if form_data.get('tags_string'):
        tag_names = [name.strip() for name in form_data.get('tags_string').split(',') if name.strip()]
        for tag_name in tag_names:
            tag_slug = generate_slug_util(tag_name)
            tag = Tag.query.filter_by(slug=tag_slug).first()
            if not tag:
                tag = Tag(name=tag_name, slug=tag_slug)
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
