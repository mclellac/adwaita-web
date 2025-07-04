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
    full_name = db.Column(db.String(120), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    website_url = db.Column(db.String(200), nullable=True)
    is_profile_public = db.Column(db.Boolean, default=True, nullable=False)
    theme = db.Column(db.String(80), nullable=True, default='system')
    accent_color = db.Column(db.String(80), nullable=True, default='default')
    is_admin = db.Column(db.Boolean, default=False, nullable=False) # Admin flag
    posts = db.relationship(
        'Post', backref='author', lazy=True, order_by=lambda: desc(Post.created_at) # Use lambda for Post ref
    )
    comments = db.relationship('Comment', backref='author', lazy='dynamic') # Added from app.py's Comment.author relationship

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self): # Already in UserMixin but can be explicit
        return str(self.id)

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
    title = db.Column(db.String(120), nullable=False)
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
    is_published = db.Column(db.Boolean, nullable=False, default=True)
    published_at = db.Column(db.DateTime, nullable=True)
    # Relationship for top-level comments moved to be defined here
    comments = db.relationship(
        'Comment',
        primaryjoin="and_(Post.id==Comment.post_id, Comment.parent_id==None)",
        backref='post',
        lazy='dynamic',
        order_by=lambda: desc(Comment.created_at) # Use lambda for Comment ref
    )


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
        order_by=created_at.asc()
    )
    # is_flagged_active property will be defined after CommentFlag model

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
