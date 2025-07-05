import re
import bleach
from markupsafe import Markup
import markdown
from flask import flash, current_app, url_for # Added url_for
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

def extract_mentions(text_content):
    """
    Extracts user mentions (e.g., @FullName) from text content.
    Queries the database to find matching users by their full_name.
    Returns a list of User objects that were successfully matched.
    """
    from .models import User # Local import to avoid circular dependencies

    # Regex to find patterns like @John Doe or @SuperUser1
    # It looks for @ followed by a sequence of characters that can include letters, numbers, underscores, and spaces,
    # but it tries to match a name that doesn't start or end with a space internally.
    # This regex is a bit tricky due to spaces in names.
    # A simpler version could be `@([A-Za-z0-9_]+(?: [A-Za-z0-9_]+)*)`
    # which captures words separated by single spaces.
    mention_regex = r'@([A-Za-z0-9_][A-Za-z0-9_ \t]*[A-Za-z0-9_]|[A-Za-z0-9_]+)'

    potential_full_names = re.findall(mention_regex, text_content)

    mentioned_users = []
    if not potential_full_names:
        return mentioned_users

    current_app.logger.debug(f"Potential mention strings found: {potential_full_names}")

    # Using a set to avoid duplicate queries for the same name if mentioned multiple times
    unique_potential_names = set(name.strip() for name in potential_full_names)

    for name in unique_potential_names:
        if not name: # Skip empty names if regex somehow captures them
            continue
        # Query for user by full_name. This is case-sensitive by default in most DBs.
        # If case-insensitivity is desired, use func.lower or ilike.
        # For now, assuming case-sensitive match for simplicity, as full_name is user-defined.
        user = User.query.filter_by(full_name=name).first()
        if user:
            if user not in mentioned_users: # Ensure user object uniqueness in list
                 mentioned_users.append(user)
            current_app.logger.debug(f"Found user for mention '{name}': {user.username}")
        else:
            current_app.logger.debug(f"No user found for mention string (full_name): '{name}'")

    return mentioned_users

def linkify_mentions(text_content):
    """
    Finds @full_name mentions in text and replaces them with links to user profiles.
    This version operates on plain text and is intended to be used BEFORE markdown conversion.
    """
    from .models import User # Local import

    # Regex to find @FullName patterns. Same as in extract_mentions.
    mention_regex = r'@([A-Za-z0-9_][A-Za-z0-9_ \t]*[A-Za-z0-9_]|[A-Za-z0-9_]+)'

    # Use a function for re.sub to perform the replacement
    def replace_mention(match):
        full_name_match = match.group(1).strip() # Get the name part, e.g., "John Doe" from "@John Doe"

        # Query for user by full_name.
        user = User.query.filter_by(full_name=full_name_match).first()

        if user:
            # Build the link. Ensure username is URL-safe if it can contain special chars, though it's email here.
            # Using current_app requires an active app context if this util is called outside one.
            # For a template filter, app context is available.
            try:
                profile_url = url_for('profile.view_profile', username=user.username, _external=False)
                # Return the markdown link [text](url)
                return f'[@{user.full_name}]({profile_url})'
            except Exception as e:
                # Log error if url_for fails (e.g. outside app context, though unlikely for filter)
                current_app.logger.error(f"Error generating URL for mention {user.full_name}: {e}")
                return match.group(0) # Return original match if error
        else:
            # If user not found, return the original @mention text
            return match.group(0)

    # Perform the substitution
    # Ensure text_content is a string
    if not isinstance(text_content, str):
        text_content = str(text_content)

    linked_text = re.sub(mention_regex, replace_mention, text_content)
    return linked_text
