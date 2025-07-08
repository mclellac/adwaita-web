from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from ..models import User
from sqlalchemy import or_

user_bp = Blueprint('user', __name__, url_prefix='/user')

@user_bp.route('/mention_suggestions', methods=['GET'])
@login_required
def mention_suggestions():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    # Search in user's followed list (friends)
    # We are looking for users whose full_name starts with the query.
    # Using ilike for case-insensitive search.

    # current_user.followed is a list of User objects that the current_user is following.
    # We need to filter this list.
    # This is not efficient for large numbers of followed users.
    # A more optimized approach would be a direct DB query if possible,
    # but `current_user.followed` is already a list of User objects.

    suggestions = []
    if current_user.is_authenticated:
        # Iterate over users that the current user is following
        for user_obj in current_user.followed:
            if user_obj.full_name.lower().startswith(query.lower()):
                suggestions.append({
                    'id': user_obj.id,
                    'full_name': user_obj.full_name,
                    'username': user_obj.username, # May still be useful for other things
                    'profile_photo_url': user_obj.profile_photo_url
                })
            if len(suggestions) >= 10: # Limit suggestions
                break

    return jsonify(suggestions)
