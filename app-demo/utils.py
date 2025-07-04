import re
import bleach
from markupsafe import Markup
import markdown
from flask import flash, current_app
# from .models import Tag # Import Tag for _update_post_relations_util
# Not importing db directly here, pass session if needed or call from a context where db is available

# Define allowed HTML tags and attributes for Bleach (copied from app.py)
ALLOWED_TAGS_CONFIG = [ # Renamed to avoid potential global scope issues if this file is imported widely
    'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del', 'ins',
    'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]
ALLOWED_ATTRIBUTES_CONFIG = {
    '*': ['class', 'style', 'id', 'title'],
    'a': ['href', 'target', 'rel'],
}

def generate_slug_util(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text) # Keep word chars, whitespace, hyphens
    text = re.sub(r'\s+', '-', text)    # Replace whitespace with single hyphen
    text = re.sub(r'-+', '-', text)     # Replace multiple hyphens with single
    text = text.strip('-')              # Remove leading/trailing hyphens
    return text

def allowed_file_util(filename): # current_app_config removed, will use current_app from Flask
    """Checks if a filename has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def flash_form_errors_util(form):
    """Flashes all errors from a WTForm instance."""
    for field, errors in form.errors.items():
        for error in errors:
            # Ensure field has a label and text attribute
            label_text = field
            if hasattr(form, field) and hasattr(getattr(form, field), 'label') and hasattr(getattr(form, field).label, 'text'):
                label_text = getattr(form, field).label.text
            flash(f"Error in {label_text}: {error}", 'warning')


def markdown_to_html_and_sanitize_util(text):
    if not text:
        return ""
    html_content = markdown.markdown(text, extensions=['fenced_code', 'tables', 'sane_lists', 'nl2br']) # Added nl2br
    sanitized_html = bleach.clean(
        html_content,
        tags=ALLOWED_TAGS_CONFIG,
        attributes=ALLOWED_ATTRIBUTES_CONFIG,
        strip=True
    )
    return Markup(sanitized_html)

def update_post_relations_util(post_instance, form, db_session):
    """
    Updates a post's category and tag relationships based on form data.
    Requires db_session to be passed for adding new tags.
    Imports Tag model locally to avoid circular dependency at module level if models.py imports utils.
    """
    from .models import Tag # Local import

    current_app.logger.debug(f"Updating relations for post ID: {post_instance.id or 'NEW'}")

    selected_categories = form.categories.data
    current_app.logger.debug(f"Selected categories from form: {[c.name for c in selected_categories]}")
    post_instance.categories = selected_categories # SQLAlchemy handles the list assignment
    if not selected_categories:
        current_app.logger.debug("No categories selected for post.")

    post_instance.tags = [] # Clear existing tags before adding new ones
    tags_string = form.tags_string.data
    current_app.logger.debug(f"Tags string from form: '{tags_string}'")
    if tags_string:
        tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
        current_app.logger.debug(f"Processed tag names: {tag_names}")
        for tag_name in tag_names:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                current_app.logger.info(f"Tag '{tag_name}' not found, creating new tag.")
                slug = generate_slug_util(tag_name) # Generate slug for new tag
                tag = Tag(name=tag_name) # Slug is generated in Tag's __init__
                db_session.add(tag)
                # We might need to flush here if we need the tag.id immediately,
                # but usually appending to relationship and committing later is fine.
            else:
                current_app.logger.debug(f"Found existing tag '{tag.name}' (ID: {tag.id}).")
            if tag not in post_instance.tags: # Avoid duplicates if somehow generated
                 post_instance.tags.append(tag)
            current_app.logger.debug(f"Associated tag '{tag.name}' with post.")
    else:
        current_app.logger.debug("No tags provided for post.")
    # The caller should handle db_session.commit()
