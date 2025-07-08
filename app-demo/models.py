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
    # liked_posts = db.relationship('PostLike', backref='user', lazy='dynamic', cascade='all, delete-orphan') # Old relationship
    likes = db.relationship('Like', backref='user', lazy='dynamic', cascade='all, delete-orphan') # New generic like relationship

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

    def like_item(self, item): # Generic like method
        if not self.has_liked_item(item):
            target_type = None
            if isinstance(item, Post):
                target_type = 'post'
            elif isinstance(item, UserPhoto):
                target_type = 'photo'
            else:
                return False # Unsupported item type

            like = Like(user_id=self.id, target_type=target_type, target_id=item.id)
            db.session.add(like)
            return True
        return False

    def unlike_item(self, item): # Generic unlike method
        target_type = None
        if isinstance(item, Post):
            target_type = 'post'
        elif isinstance(item, UserPhoto):
            target_type = 'photo'
        else:
            return False # Unsupported item type

        like = Like.query.filter_by(user_id=self.id, target_type=target_type, target_id=item.id).first()
        if like:
            db.session.delete(like)
            return True
        return False

    def has_liked_item(self, item): # Generic has_liked method
        target_type = None
        if isinstance(item, Post):
            target_type = 'post'
        elif isinstance(item, UserPhoto):
            target_type = 'photo'
        else:
            return False # Unsupported item type

        return Like.query.filter_by(user_id=self.id, target_type=target_type, target_id=item.id).count() > 0

    # Convenience methods for specific types (optional, can use like_item directly)
    def like_post(self, post):
        return self.like_item(post)

    def unlike_post(self, post):
        return self.unlike_item(post)

    def has_liked_post(self, post):
        return self.has_liked_item(post)

    def like_photo(self, photo):
        return self.like_item(photo)

    def unlike_photo(self, photo):
        return self.unlike_item(photo)

    def has_liked_photo(self, photo):
        return self.has_liked_item(photo)


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
        primaryjoin="and_(Post.id==Comment.target_id, Comment.target_type=='post', Comment.parent_id==None)",
        foreign_keys="[Comment.target_id, Comment.target_type, Comment.parent_id]", # Explicitly mention involved "foreign" columns from Comment side
        backref='post',
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at)
    )
    # Relationship for likes on this post
    likers = db.relationship(
        'Like',
        primaryjoin="and_(Post.id==Like.target_id, Like.target_type=='post')",
        foreign_keys="[Like.target_id, Like.target_type]",
        lazy='dynamic',
        cascade='all, delete-orphan'
    )


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Polymorphic fields
    target_type = db.Column(db.String(50), nullable=False, index=True) # e.g., 'post', 'photo'
    target_id = db.Column(db.Integer, nullable=False, index=True)     # ID of the post or photo

    # Foreign key for post_id is removed, replaced by polymorphic target_id/target_type
    # post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    # author relationship defined in User.comments
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at) # Sort replies newest first
    )
    # is_flagged_active property will be defined after CommentFlag model

    __mapper_args__ = {
        'polymorphic_identity': 'comment',
        # 'polymorphic_on': target_type # Not needed if not using joined table inheritance for Comment subtypes
    }

    # Generic way to get the target object (Post or UserPhoto)
    # This is a Python property, not a SQLAlchemy relationship.
    # For querying, you'd filter on target_type and target_id.
    @property
    def target(self):
        if self.target_type == 'post':
            return Post.query.get(self.target_id)
        elif self.target_type == 'photo':
            return UserPhoto.query.get(self.target_id)
        return None

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
        'Comment',
        primaryjoin="and_(UserPhoto.id==Comment.target_id, Comment.target_type=='photo')",
        foreign_keys="[Comment.target_id, Comment.target_type]", # Explicitly mention involved "foreign" columns from Comment side
        # No backref to avoid conflict with Comment.post. Access photo via Comment.target if needed.
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by=lambda: desc(Comment.created_at)
    )

    # Relationship for likes on this photo
    likers = db.relationship(
        'Like',
        primaryjoin="and_(UserPhoto.id==Like.target_id, Like.target_type=='photo')",
        foreign_keys="[Like.target_id, Like.target_type]",
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

# PhotoComment class is now removed.

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

class Like(db.Model): # Renamed from PostLike
    __tablename__ = 'like' # New table name
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)

    # Polymorphic fields
    target_type = db.Column(db.String(50), nullable=False, index=True) # e.g., 'post', 'photo'
    target_id = db.Column(db.Integer, nullable=False, index=True)     # ID of the post or photo

    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Unique constraint for (user_id, target_type, target_id)
    __table_args__ = (db.UniqueConstraint('user_id', 'target_type', 'target_id', name='_user_target_uc'),)

    # No direct backref to Post or UserPhoto here to keep Like generic.
    # Relationships are defined on Post ('likers') and UserPhoto ('likers').
    # User.likes backref is already defined.

    def __repr__(self):
        return f'<Like user_id={self.user_id} target_type={self.target_type} target_id={self.target_id}>'


class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)  # Recipient
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True, index=True) # User who performed action
    type = db.Column(db.String(50), nullable=False, index=True)  # e.g., 'new_follower', 'new_like', 'new_comment'

    # Polymorphic target fields for the notification's subject
    # For 'new_follower', target is the user being followed (actor is the follower).
    # For 'new_like' on a post, target is the Post.
    # For 'new_comment' on a post, target is the Comment.
    # For 'mention_in_post', target is the Post.
    # For 'mention_in_comment', target is the Comment.
    # For 'new_photo_like', target is the UserPhoto.
    # For 'new_photo_comment', target is the Comment (on the photo).
    target_type = db.Column(db.String(50), nullable=True, index=True)
    target_id = db.Column(db.Integer, nullable=True, index=True)

    # Contextual information (optional, can be derived from target if it's a comment/like)
    # For a 'new_comment' notification where target is the Comment, context_post_id could be the post the comment is on.
    # For a 'new_like' notification where target is the Like, context_post_id could be the post the like is on.
    # This can simplify template logic by not always requiring loading comment.target.post.
    context_post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)
    context_photo_id = db.Column(db.Integer, db.ForeignKey('user_photo.id'), nullable=True)

    is_read = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    # user (recipient) is defined by backref from User.notifications
    actor = db.relationship('User', foreign_keys=[actor_id])

    # Context relationships (can be used if direct links are preferred in templates)
    context_post = db.relationship('Post', foreign_keys=[context_post_id])
    context_photo = db.relationship('UserPhoto', foreign_keys=[context_photo_id])

    # Removed direct related_post, related_comment. Use target property.

    @property
    def target(self):
        if not self.target_type or self.target_id is None:
            return None
        if self.target_type == 'post':
            return Post.query.get(self.target_id)
        elif self.target_type == 'comment':
            return Comment.query.get(self.target_id)
        elif self.target_type == 'user': # e.g., for 'new_follower' notification, target is the followed user (self.user_id)
                                         # but actor_id is the follower. If target is the user who performed action, use actor.
                                         # For 'new_follower', target should be the actor (the one who followed).
            return User.query.get(self.target_id)
        elif self.target_type == 'photo':
            return UserPhoto.query.get(self.target_id)
        # Add other types as needed
        return None

    def __repr__(self):
        return f'<Notification {self.id} type={self.type} user_id={self.user_id} is_read={self.is_read}>'

class Activity(db.Model):
    __tablename__ = 'activity'
    id = db.Column(db.Integer, primary_key=True)
    # User who performed the activity (actor)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, index=True) # 'created_post', 'started_following', 'liked_post', 'commented_on_post', etc.
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Polymorphic target fields for the activity's subject
    target_type = db.Column(db.String(50), nullable=True, index=True)
    target_id = db.Column(db.Integer, nullable=True, index=True)

    # Contextual information (optional, similar to Notification)
    # For 'commented_on_post' where target is Comment, context_post_id is the post.
    # For 'liked_comment' (if added later) where target is Comment, context_post_id is the post.
    context_post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)
    context_photo_id = db.Column(db.Integer, db.ForeignKey('user_photo.id'), nullable=True)
    # context_user_id could be for activities involving another user where that user isn't the primary target.
    # For 'started_following', target_type='user', target_id=followed_user_id. actor is the follower.

    # Relationships
    actor = db.relationship('User', foreign_keys=[user_id], backref=db.backref('activities', lazy='dynamic', order_by=lambda: desc(Activity.timestamp)))

    context_post = db.relationship('Post', foreign_keys=[context_post_id])
    context_photo = db.relationship('UserPhoto', foreign_keys=[context_photo_id])

    # Removed direct target_post, target_user, target_comment. Use target property.

    @property
    def target(self):
        if not self.target_type or self.target_id is None:
            return None
        if self.target_type == 'post':
            return Post.query.get(self.target_id)
        elif self.target_type == 'comment':
            return Comment.query.get(self.target_id)
        elif self.target_type == 'user':
            return User.query.get(self.target_id)
        elif self.target_type == 'photo':
            return UserPhoto.query.get(self.target_id)
        # Add other types as needed for future activity targets
        return None

    def __repr__(self):
        return f'<Activity {self.id} type={self.type} user_id={self.user_id}>'


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
