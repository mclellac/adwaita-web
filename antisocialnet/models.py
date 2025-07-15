from . import db  # Import db from __init__.py
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import desc, or_, select, func
from sqlalchemy.orm import foreign # Added for polymorphic relationships
from datetime import datetime, timezone, timedelta # Added timedelta
from .utils import generate_slug_util # Import the renamed utility
import jwt # For token generation
from flask import current_app # For accessing app config (SECRET_KEY)


# Models (Copied from app.py, generate_slug replaced with generate_slug_util)
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False) # Stores email, used for login
    password_hash = db.Column(db.String(256), nullable=False)
    profile_info = db.Column(db.Text, nullable=True)
    profile_photo_url = db.Column(db.String(512), nullable=True)
    full_name = db.Column(db.String(120), nullable=False) # Changed to nullable=False
    website_url = db.Column(db.String(200), nullable=True)

    # New fields for enhanced profile
    # address = db.Column(db.String(255), nullable=True) # Removed
    # phone_number = db.Column(db.String(50), nullable=True) # Removed
    street_address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state_province = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    home_phone = db.Column(db.String(50), nullable=True)
    mobile_phone = db.Column(db.String(50), nullable=True)
    birthdate = db.Column(db.Date, nullable=True)  # Replaced age with birthdate
    # profile_info (Text type) is already suitable for an extensive bio

    is_profile_public = db.Column(db.Boolean, default=True, nullable=False)
    theme = db.Column(db.String(80), nullable=True, default='system')
    accent_color = db.Column(db.String(80), nullable=True, default='default')
    is_admin = db.Column(db.Boolean, default=False, nullable=False) # Admin flag
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    posts = db.relationship(
        'Post', backref='author', lazy=True, order_by=lambda: desc(Post.created_at) # Use lambda for Post ref
    )
    gallery_photos = db.relationship(
        'UserPhoto',
        backref='user', # Changed from 'author' to 'user' to match UserPhoto.user relationship
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by=lambda: desc(UserPhoto.uploaded_at) # Use lambda for UserPhoto ref
    )
    # Relationship for posts liked by this user
    # Renamed from liked_posts to post_likes for clarity with PostLike model name
    likes = db.relationship('Like', foreign_keys='Like.user_id',
                                 backref='user', lazy='dynamic',
                                 cascade='all, delete-orphan')
    notifications = db.relationship('Notification',
                                    foreign_keys='Notification.user_id',
                                    backref='user', lazy='dynamic',
                                    order_by=lambda: desc(Notification.timestamp), # noqa
                                    cascade='all, delete-orphan')


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        # Replaced print with logger.debug
        current_app.logger.debug(f"User {self.username}: set_password called.")

    def check_password(self, password):
        # Replaced print with logger.debug
        # Note: Logging the password itself, even at debug, can be risky if logs are not properly secured.
        # Consider logging only the fact of the check or the username.
        # For now, keeping it similar to original intent but with logger.
        current_app.logger.debug(f"User {self.username}: check_password called for password verification.")
        is_correct = check_password_hash(self.password_hash, password)
        current_app.logger.debug(f"User {self.username}: check_password result: {is_correct}")
        return is_correct

    def get_id(self): # Already in UserMixin but can be explicit
        return str(self.id)

    def follow(self, user):
        if not self.is_following(user):
            # Ensure user cannot follow themselves
            if self == user:
                return False # Or raise an error
            # Create a FollowerLink instance
            link = FollowerLink(follower_id=self.id, followed_id=user.id)
            db.session.add(link)
            return True
        return False # Already following or self-follow attempt

    def unfollow(self, user):
        link = FollowerLink.query.filter_by(
            follower_id=self.id,
            followed_id=user.id
        ).first()
        if link:
            db.session.delete(link)
            return True
        return False # Was not following

    def is_following(self, user):
        return FollowerLink.query.filter_by(
            follower_id=self.id,
            followed_id=user.id
        ).count() > 0

    def like_item(self, target_type: str, target_id: int):
        if not self.has_liked_item(target_type, target_id):
            # Ensure the Like model is correctly referenced here
            like = Like(user_id=self.id, target_type=target_type, target_id=target_id)
            db.session.add(like)
            return True
        return False

    def unlike_item(self, target_type: str, target_id: int):
        # Ensure the Like model is correctly referenced here
        like = Like.query.filter_by(user_id=self.id, target_type=target_type, target_id=target_id).first()
        if like:
            db.session.delete(like)
            return True
        return False

    def has_liked_item(self, target_type: str, target_id: int):
        # Ensure the Like model is correctly referenced here
        return Like.query.filter_by(user_id=self.id, target_type=target_type, target_id=target_id).count() > 0

    def get_reset_password_token(self, expires_in_seconds=1800): # Default 30 minutes
        """
        Generates a secure, timed token for password reset.

        The token contains the user's ID and an expiration timestamp.
        It is signed using the application's SECRET_KEY.

        Args:
            expires_in_seconds (int, optional): The duration (in seconds) for which the token
                                                will be valid. Defaults to 1800 (30 minutes).

        Returns:
            str: The generated JWT token for password reset.
        """
        token = jwt.encode(
            {
                'reset_password_user_id': self.id,
                'exp': datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
            },
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        return token

    @staticmethod
    def verify_reset_password_token(token):
        """
        Verifies a password reset token and returns the associated User object if valid.

        This static method decodes the provided token using the application's SECRET_KEY
        and checks for its expiration and correct payload.

        Args:
            token (str): The password reset token to verify.

        Returns:
            User | None: The User object if the token is valid and not expired,
                         None otherwise (e.g., if token is expired, invalid, or
                         doesn't contain the expected user ID).
        """
        try:
            decoded_token = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            user_id = decoded_token.get('reset_password_user_id')
            if user_id is None:
                return None # Token is invalid or doesn't have the expected payload
            return db.session.get(User, user_id)
        except jwt.ExpiredSignatureError:
            current_app.logger.warning("Password reset token expired.")
            return None # Token has expired
        except jwt.InvalidTokenError:
            current_app.logger.warning("Invalid password reset token.")
            return None # Token is invalid for other reasons

# Association table for the follow relationship
class FollowerLink(db.Model):
    __tablename__ = 'follower_link' # Explicit table name
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    followed_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships to access User objects from FollowerLink if needed, though typically accessed via User model
    # follower = db.relationship('User', foreign_keys=[follower_id], backref='following_links')
    # followed = db.relationship('User', foreign_keys=[followed_id], backref='follower_links')


# Add relationships to User model AFTER FollowerLink is defined
User.followed = db.relationship(
    'User', # Target class is User
    secondary='follower_link', # Name of the association table
    primaryjoin=(FollowerLink.follower_id == User.id), # Condition for User -> followed
    secondaryjoin=(FollowerLink.followed_id == User.id), # Condition for followed -> User
    backref=db.backref('followers', lazy='dynamic'), # How 'followers' access this User
    lazy='dynamic' # Use dynamic for query capabilities
)


post_categories = db.Table(
    'post_categories',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

post_tags = db.Table(
    'post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    def __init__(self, name):
        self.name = name
        self.slug = generate_slug_util(name) # Use renamed util
    def __repr__(self):
        return f'<Tag {self.name}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    def __init__(self, name):
        self.name = name
        self.slug = generate_slug_util(name) # Use renamed util
    def __repr__(self):
        return f'<Category {self.name}>'


class PolymorphicLikeMixin:
    """Mixin for models that can be liked."""
    @property
    def like_count(self):
        return self.likes.count()

class PolymorphicCommentMixin:
    """Mixin for models that can be commented on."""
    @property
    def comment_count(self):
        return self.comments.count()

class Post(db.Model, PolymorphicLikeMixin):
    __tablename__ = 'post'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), default='post')
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    categories = db.relationship(
        'Category',
        secondary=post_categories,
        lazy='subquery',
        backref=db.backref('posts', lazy=True)
    )
    tags = db.relationship(
        'Tag',
        secondary=post_tags,
        lazy='subquery',
        backref=db.backref('posts', lazy=True)
    )
    # is_published defaults to True, implying posts are published on creation.
    # The route logic will handle setting published_at.
    is_published = db.Column(db.Boolean, nullable=False, default=True, server_default=db.true())
    published_at = db.Column(db.DateTime, nullable=True) # Set at time of creation by route logic

    __mapper_args__ = {
        'polymorphic_identity': 'post',
    }

    comments = db.relationship(
        'Comment',
        primaryjoin="and_(Post.id==foreign(Comment.target_id), Comment.target_type=='post')",
        backref='post',
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at)
    )
    likes = db.relationship('Like',
                            primaryjoin="and_(Like.target_type=='post', foreign(Like.target_id)==Post.id)",
                            lazy='dynamic',
                            cascade='all, delete-orphan',
                            overlaps="likes,likes,likes")

class Comment(db.Model, PolymorphicLikeMixin):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), default='comment')
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)
    author = db.relationship('User', backref='comments')
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        order_by=lambda: desc(Comment.created_at) # Sort replies newest first
    )

    __mapper_args__ = {
        'polymorphic_identity': 'comment',
    }

    likes = db.relationship('Like',
                            primaryjoin="and_(Like.target_type=='comment', foreign(Like.target_id)==Comment.id)",
                            lazy='dynamic',
                            cascade='all, delete-orphan',
                            overlaps="likes,likes")

class Postable(db.Model):
    __tablename__ = 'postable'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity': 'postable',
        'polymorphic_on': type
    }

class UserPhoto(db.Model, PolymorphicLikeMixin):
    __tablename__ = 'user_photo'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), default='userphoto')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # image_filename stores path relative to GALLERY_UPLOAD_FOLDER, e.g. "user_id/image.jpg"
    image_filename = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.Text, nullable=True)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __mapper_args__ = {
        'polymorphic_identity': 'userphoto',
    }

    comments = db.relationship(
        'Comment',
        primaryjoin="and_(UserPhoto.id==foreign(Comment.target_id), Comment.target_type=='userphoto')",
        backref='user_photo',
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at),
        overlaps="comments,post"
    )
    likes = db.relationship('Like',
                            primaryjoin="and_(Like.target_type=='userphoto', foreign(Like.target_id)==UserPhoto.id)",
                            lazy='dynamic',
                            cascade='all, delete-orphan',
                            overlaps="likes,likes")

    def __repr__(self):
        return f'<UserPhoto {self.image_filename} user_id={self.user_id}>'

class CommentFlag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=False)
    flagger_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    is_resolved = db.Column(db.Boolean, default=False, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolver_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    comment = db.relationship('Comment', backref=db.backref('flags', lazy='dynamic'))
    flagger = db.relationship('User', foreign_keys=[flagger_user_id], backref='flagged_comments_by')
    resolver = db.relationship('User', foreign_keys=[resolver_user_id], backref='resolved_flags_by')

# Define is_flagged_active property on Comment model
Comment.is_flagged_active = db.column_property(
    select(func.count(CommentFlag.id) > 0).where(
        CommentFlag.comment_id == Comment.id,
        CommentFlag.is_resolved == False # noqa E712, assuming this is for linters, keep if needed
    ).correlate_except(CommentFlag).scalar_subquery()
)

class Like(db.Model):
    __tablename__ = 'like' # Renamed from post_like
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    # post_id = db.Column(db.Integer, db.ForeignKey('post.id', ondelete='CASCADE'), nullable=False) # Removed
    target_type = db.Column(db.String(50), nullable=False) # e.g., 'post', 'comment', 'photo'
    target_id = db.Column(db.Integer, nullable=False) # ID of the liked item
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Add a unique constraint for (user_id, target_type, target_id)
    # Also add an index for querying by target_type and target_id
    __table_args__ = (
        db.UniqueConstraint('user_id', 'target_type', 'target_id', name='_user_target_uc'),
        db.Index('ix_like_target', 'target_type', 'target_id'),
    )

    # user relationship will be defined by backref from User.likes
    # No direct backref needed for target_type/target_id as they are polymorphic

    def __repr__(self):
        return f'<Like user_id={self.user_id} target_type={self.target_type} target_id={self.target_id}>'


class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Recipient
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # User who performed action
    type = db.Column(db.String(50), nullable=False)  # e.g., 'new_follower', 'new_like', 'new_comment', 'new_post_by_followed_user', 'new_comment_by_followed_user', 'new_photo_by_followed_user', 'pending_user_approval', 'user_approved', 'site_setting_changed'
    # related_post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True) # REMOVED
    # related_comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True) # REMOVED
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships to easily get related objects from a notification
    # user is defined by backref from User.notifications
    actor = db.relationship('User', foreign_keys=[actor_id])
    # related_post = db.relationship('Post', foreign_keys=[related_post_id]) # REMOVED
    # related_comment = db.relationship('Comment', foreign_keys=[related_comment_id]) # REMOVED

    # New polymorphic target fields
    target_type = db.Column(db.String(50), nullable=True) # e.g., 'post', 'comment', 'user_photo', 'user'
    target_id = db.Column(db.Integer, nullable=True)

    # Remove ForeignKeyConstraints for old columns from __table_args__
    __table_args__ = (db.Index('ix_notification_target', 'target_type', 'target_id'),)


    def get_target_object(self):
        """
        Retrieves the actual target object (e.g., Post, Comment, UserPhoto, User)
        associated with this notification based on its `target_type` and `target_id`.

        This method dynamically imports model classes to avoid circular dependencies
        at the module level and uses `db.session.get()` for efficient lookup.

        Returns:
            db.Model | None: The SQLAlchemy model instance corresponding to the
                             notification's target, or None if the target_type is
                             unrecognized, or if target_type/target_id are not set.
        """
        if not self.target_type or self.target_id is None:
            return None

        # Import models locally to avoid circular imports at module level if Notification is imported by these models
        from .models import Post, Comment, UserPhoto, User

        if self.target_type == 'post':
            return db.session.get(Post, self.target_id)
        elif self.target_type == 'comment':
            return db.session.get(Comment, self.target_id)
        elif self.target_type == 'photo': # Assuming 'photo' is used for UserPhoto
            return db.session.get(UserPhoto, self.target_id)
        elif self.target_type == 'user':
            return db.session.get(User, self.target_id)
        # Add other types as needed
        return None

    def __repr__(self):
        return f'<Notification {self.id} type={self.type} user_id={self.user_id} is_read={self.is_read} target_type={self.target_type} target_id={self.target_id}>'


def create_notification(user_id, type, actor_id=None, target_type=None, target_id=None):
    """
    Creates and saves a new notification.
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        actor_id=actor_id,
        target_type=target_type,
        target_id=target_id
    )
    db.session.add(notification)
    db.session.commit()

class Activity(db.Model):
    __tablename__ = 'activity'
    id = db.Column(db.Integer, primary_key=True)
    # User who performed the activity (actor)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False) # 'created_post', 'started_following', 'liked_post', 'commented_on_post'
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Target fields - store IDs of related objects
    # target_post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True) # REMOVED
    # For 'started_following', this is the user being followed.
    # target_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # REMOVED
    # target_comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True) # REMOVED

    # Relationships to fetch related objects
    # The user who performed the activity (actor)
    actor = db.relationship('User', foreign_keys=[user_id], backref=db.backref('activities', lazy='dynamic', order_by=lambda: desc(Activity.timestamp)))

    # target_post = db.relationship('Post', foreign_keys=[target_post_id]) # This line caused NameError
    # User being targeted by the activity (e.g., user being followed)
    # Need a different backref name if User.activities is already taken by the actor's activities.
    # Or, access this target user differently if not frequently needed as a direct backref on User.
    # For now, let's assume we primarily query activities and then get target_user.
    # target_user = db.relationship('User', foreign_keys=[target_user_id]) # REMOVED
    # target_comment = db.relationship('Comment', foreign_keys=[target_comment_id]) # REMOVED
    # target_post = db.relationship('Post', foreign_keys=[target_post_id]) # REMOVED (was implicitly defined by FK)

    # New polymorphic target fields
    target_type = db.Column(db.String(50), nullable=True) # e.g., 'post', 'comment', 'user_photo', 'user'
    target_id = db.Column(db.Integer, nullable=True)

    # Add an index for common queries
    # Include user_id in the index as activities are often queried per user
    # Remove ForeignKeyConstraints for old columns from __table_args__
    __table_args__ = (
        db.Index('ix_activity_user_target', 'user_id', 'target_type', 'target_id'),
        db.Index('ix_activity_target', 'target_type', 'target_id')
    )

    def get_target_object(self):
        """
        Retrieves the actual target object (e.g., Post, Comment, UserPhoto, User)
        associated with this activity based on its `target_type` and `target_id`.

        This method dynamically imports model classes to avoid circular dependencies
        at the module level and uses `db.session.get()` for efficient lookup.

        Returns:
            db.Model | None: The SQLAlchemy model instance corresponding to the
                             activity's target, or None if the target_type is
                             unrecognized, or if target_type/target_id are not set.
        """
        if not self.target_type or self.target_id is None:
            return None

        # Import models locally
        from .models import Post, Comment, UserPhoto, User

        if self.target_type == 'post':
            return db.session.get(Post, self.target_id)
        elif self.target_type == 'comment':
            return db.session.get(Comment, self.target_id)
        elif self.target_type == 'photo': # Assuming 'photo' is used for UserPhoto
            return db.session.get(UserPhoto, self.target_id)
        elif self.target_type == 'user':
            return db.session.get(User, self.target_id)
        # Add other types as needed
        return None

    def __repr__(self):
        return f'<Activity {self.id} type={self.type} user_id={self.user_id} target_type={self.target_type} target_id={self.target_id}>'


class SiteSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    value_type = db.Column(db.String(50), nullable=False, default='string')

    def __repr__(self):
        return f'<SiteSetting {self.key}={self.value}>'

    @staticmethod
    def get(key, default=None):
        setting = SiteSetting.query.filter_by(key=key).first()
        if setting:
            if setting.value_type == 'int':
                try:
                    return int(setting.value)
                except (ValueError, TypeError):
                    return default
            elif setting.value_type == 'bool':
                return setting.value.lower() in ['true', '1', 'yes', 'on']
            return setting.value
        return default

    @staticmethod
    def set(key, value, value_type='string'):
        setting = SiteSetting.query.filter_by(key=key).first()
        if not setting:
            setting = SiteSetting(key=key)
            db.session.add(setting)

        if value_type == 'bool':
            setting.value = 'true' if value else 'false'
        elif value_type == 'int':
            try: # Ensure value can be int
                setting.value = str(int(value))
            except ValueError:
                 # Or handle error appropriately, e.g. log, raise, or use default
                setting.value = '0' if default is None else str(default)
        else:
            setting.value = str(value)
        setting.value_type = value_type

        db.session.commit()
