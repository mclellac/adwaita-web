# Utility functions for the application can be placed here.
from datetime import datetime

def human_readable_date(dt, show_time=True):
    """
    Formats a datetime object into a human-readable string.
    Example: "Jan 5, 2023, 03:45 PM" or "Jan 5, 2023"
    """
    if not isinstance(dt, datetime):
        return dt # Return as is if not a datetime object

    # Ensure timezone-aware datetimes are converted to naive UTC if necessary,
    # or handle them according to app's timezone policy.
    # For now, assuming dt is naive or already in desired display timezone.

    if show_time:
        formatted_date = dt.strftime("%b %d, %Y, %I:%M %p")
        # Remove leading zero from hour if present (e.g., 03:45 PM -> 3:45 PM)
        if formatted_date[0] == '0':
            formatted_date = formatted_date[1:]
        return formatted_date
    else:
        return dt.strftime("%b %d, %Y")

def init_app(app):
    """Initialize utility functions and filters for the Flask app."""
    app.jinja_env.filters['human_readable_date'] = human_readable_date
