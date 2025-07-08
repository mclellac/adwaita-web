from . import db  # Import db from __init__.py
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import desc, or_, select, func
from datetime import datetime, timezone
from .utils import generate_slug_util # Import the renamed utility

# Models (Copied from app.py, generate_slug replaced with generate_slug_util)
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
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
    comments = db.relationship('Comment', backref='author', lazy='dynamic') # Added from app.py's Comment.author relationship
    gallery_photos = db.relationship(
        'UserPhoto',
        backref='user', # Changed from 'author' to 'user' to match UserPhoto.user relationship
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by=lambda: desc(UserPhoto.uploaded_at) # Use lambda for UserPhoto ref
    )
    # Relationship for posts liked by this user
    liked_posts = db.relationship('PostLike', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification',
                                    foreign_keys='Notification.user_id',
                                    backref='user', lazy='dynamic',
                                    order_by=lambda: desc(Notification.timestamp), # noqa
                                    cascade='all, delete-orphan')


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

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

    def like_post(self, post):
        if not self.has_liked_post(post):
            like = PostLike(user_id=self.id, post_id=post.id)
            db.session.add(like)
            return True
        return False

    def unlike_post(self, post):
        like = PostLike.query.filter_by(user_id=self.id, post_id=post.id).first()
        if like:
            db.session.delete(like)
            return True
        return False

    def has_liked_post(self, post):
        return PostLike.query.filter_by(user_id=self.id, post_id=post.id).count() > 0

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

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
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
    # Relationship for top-level comments moved to be defined here
    comments = db.relationship(
        'Comment',
        primaryjoin="and_(Post.id==Comment.post_id, Comment.parent_id==None)",
        backref='post',
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at) # Use lambda for Comment ref
    )
    # Relationship for likes on this post
    likers = db.relationship('PostLike', backref='post', lazy='dynamic', cascade='all, delete-orphan')


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    # author relationship defined in User.comments
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at) # Sort replies newest first
    )
    # is_flagged_active property will be defined after CommentFlag model

class UserPhoto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # image_filename stores path relative to GALLERY_UPLOAD_FOLDER, e.g. "user_id/image.jpg"
    image_filename = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.Text, nullable=True)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<UserPhoto {self.image_filename} user_id={self.user_id}>'

    # Relationship for comments on this photo
    comments = db.relationship(
        'PhotoComment',
        backref='photo',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by=lambda: desc(PhotoComment.created_at) # Use lambda for PhotoComment ref
    )

class PhotoComment(db.Model):
    __tablename__ = 'photo_comment'
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    photo_id = db.Column(db.Integer, db.ForeignKey('user_photo.id'), nullable=False)

    # Relationships
    author = db.relationship('User', backref=db.backref('photo_comments', lazy='dynamic'))
    # 'photo' backref is defined in UserPhoto.comments

    # parent_id = db.Column(db.Integer, db.ForeignKey('photo_comment.id'), nullable=True)
    # replies = db.relationship(
    #     'PhotoComment',
    #     backref=db.backref('parent', remote_side=[id]),
    #     lazy='dynamic',
    #     order_by=lambda: desc(PhotoComment.created_at) # Sort replies newest first
    # )

    def __repr__(self):
        return f'<PhotoComment {self.id} user_id={self.user_id} photo_id={self.photo_id}>'

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

class PostLike(db.Model):
    __tablename__ = 'post_like'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Add a unique constraint for (user_id, post_id)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_uc'),)

    def __repr__(self):
        return f'<PostLike user_id={self.user_id} post_id={self.post_id}>'


class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Recipient
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # User who performed action
    type = db.Column(db.String(50), nullable=False)  # e.g., 'new_follower', 'new_like', 'new_comment'
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
        Returns the actual target object based on target_type and target_id.
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
        Returns the actual target object based on target_type and target_id.
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
        # db.session.commit() # Commit should be handled by the caller/route
                            # to allow for multiple settings in one transaction.
                            # However, original app.py committed here.
                            # For now, let's keep original app.py behavior.
        db.session.commit()
