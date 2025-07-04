from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import current_user, login_required
from datetime import datetime, timezone

from ..models import Post, Category, Tag, Comment, CommentFlag
from ..forms import PostForm, CommentForm, DeleteCommentForm, DeletePostForm, FlagCommentForm
from .. import db
from ..utils import flash_form_errors_util, update_post_relations_util

post_bp = Blueprint('post', __name__) # No url_prefix, template_folder defaults to app's

@post_bp.route('/posts/<int:post_id>', methods=['GET', 'POST'])
def view_post(post_id):
    current_app.logger.debug(f"Accessing /posts/{post_id}, Method: {request.method}")
    post = Post.query.get_or_404(post_id)

    if not post.is_published:
        if not current_user.is_authenticated or current_user.id != post.user_id:
            user_desc = current_user.username if current_user.is_authenticated else 'Anonymous'
            current_app.logger.warning(f"User {user_desc} attempted to view unpublished post ID: {post_id}. Denying access.")
            abort(404)
        current_app.logger.debug(f"Author {current_user.username} viewing their own unpublished post '{post.title}'.")
    else:
        current_app.logger.debug(f"Viewing published post '{post.title}' (ID: {post_id}).")

    form = CommentForm(request.form)
    delete_comment_form = DeleteCommentForm() # For each comment, if needed in template loop
    delete_post_form = DeletePostForm() # For the post itself

    if request.method == 'POST' and form.validate_on_submit(): # Check for comment submission
        current_app.logger.debug(f"Comment form submitted for post {post_id}. Data: {request.form}")
        if not current_user.is_authenticated:
            current_app.logger.warning(f"Anonymous user tried to comment on post {post_id}.")
            flash('You must be logged in to comment.', 'danger')
            return redirect(url_for('auth.login', next=url_for('post.view_post', post_id=post_id)))

        try:
            parent_id_val = form.parent_id.data
            parent_id_int = int(parent_id_val) if parent_id_val and parent_id_val.isdigit() else None
            current_app.logger.info(f"User {current_user.username} submitting comment on post {post_id}. Parent ID: {parent_id_int}.")

            comment = Comment(text=form.text.data, user_id=current_user.id, post_id=post_id, parent_id=parent_id_int)
            db.session.add(comment)
            db.session.commit()
            current_app.logger.info(f"Comment (ID: {comment.id}) by {current_user.username} added to post {post_id}.")
            flash('Comment posted successfully!', 'success')
            return redirect(url_for('post.view_post', post_id=post_id, _anchor=f"comment-{comment.id}"))
        except ValueError:
            current_app.logger.error(f"Invalid parent_id format '{form.parent_id.data}' for comment on post {post_id}.")
            flash('Error posting comment: Invalid parent comment ID.', 'danger')
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving comment for post {post_id}: {e}", exc_info=True)
            flash('Error posting comment. Please try again.', 'danger')
    elif request.method == 'POST': # Comment form validation failed
        current_app.logger.warning(f"Comment form validation failed for post {post_id}. Errors: {form.errors}")
        flash_form_errors_util(form)

    # Fetch comments (top-level only for the main list)
    comments = post.comments.all() # Uses the relationship defined on Post model
    current_app.logger.debug(f"Fetched {len(comments)} top-level comments for post {post_id}.")

    related_posts = []
    if post.is_published and post.tags:
        try:
            tag_ids = [tag.id for tag in post.tags]
            current_app.logger.debug(f"Finding related posts for post {post_id} based on tag IDs: {tag_ids}")
            # Simplified related posts logic for brevity, original was more complex
            candidate_posts = Post.query.join(Post.tags).filter(Tag.id.in_(tag_ids), Post.id != post.id, Post.is_published==True).distinct().limit(4).all()
            related_posts = candidate_posts # Further sorting could be added
            current_app.logger.debug(f"Found {len(related_posts)} related posts for post {post_id}.")
        except Exception as e:
            current_app.logger.error(f"Error finding related posts for post {post_id}: {e}", exc_info=True)

    return render_template('post.html', post=post, form=form, comments=comments,
                           delete_comment_form=delete_comment_form,
                           delete_post_form=delete_post_form,
                           related_posts=related_posts)

@post_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create_post():
    current_app.logger.debug(f"Accessing /create post, Method: {request.method}, User: {current_user.username}")
    form = PostForm(request.form)
    if form.validate_on_submit():
        title = form.title.data
        content = form.content.data # Raw Markdown
        is_published_intent = bool(request.form.get('publish')) # Check if 'publish' button was clicked

        current_app.logger.info(f"User {current_user.username} creating post titled '{title}'. Intent: {'Publish' if is_published_intent else 'Save Draft'}.")
        try:
            new_post = Post(title=title, content=content, user_id=current_user.id, is_published=is_published_intent)
            if is_published_intent:
                new_post.published_at = datetime.now(timezone.utc)

            db.session.add(new_post)
            # Update relations before commit, especially if new tags need to be created and flushed for ID
            update_post_relations_util(new_post, form, db.session)
            db.session.commit()
            current_app.logger.info(f"Post '{new_post.title}' (ID: {new_post.id}, Published: {new_post.is_published}) created by {current_user.username}.")
            flash_msg = 'Post published successfully!' if new_post.is_published else 'Post saved as draft successfully!'
            flash(flash_msg, 'success')
            return redirect(url_for('post.view_post', post_id=new_post.id))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating post '{title}' by {current_user.username}: {e}", exc_info=True)
            flash(f'Error creating post: {str(e)}', 'danger')
    elif request.method == 'POST':
        current_app.logger.warning(f"Create post form validation failed. Errors: {form.errors}")
        flash_form_errors_util(form)

    return render_template('create_post.html', form=form)

@post_bp.route('/posts/<int:post_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_post(post_id):
    current_app.logger.debug(f"Accessing /posts/{post_id}/edit, Method: {request.method}, User: {current_user.username}")
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id and not current_user.is_admin: # Allow admin to edit
        current_app.logger.warning(f"User {current_user.username} not authorized to edit post {post_id}.")
        abort(403)

    form = PostForm(request.form, obj=post)
    delete_form = DeletePostForm(prefix=f"del-eff-post-{post.id}-") # For delete button on edit page

    if form.validate_on_submit():
        current_app.logger.info(f"User {current_user.username} updating post '{post.title}' (ID: {post_id}).")
        post.title = form.title.data
        post.content = form.content.data # Raw Markdown
        is_published_intent = bool(request.form.get('publish'))

        post.is_published = is_published_intent
        if is_published_intent and not post.published_at: # If publishing now and wasn't before
            post.published_at = datetime.now(timezone.utc)
        elif not is_published_intent: # If saving as draft
            post.published_at = None

        update_post_relations_util(post, form, db.session)
        try:
            db.session.add(post) # Add to session before commit
            db.session.commit()
            current_app.logger.info(f"Post ID {post.id} ('{post.title}', Pub: {post.is_published}) updated by {current_user.username}.")
            flash_msg = 'Post updated and published successfully!' if post.is_published else 'Post updated and saved as draft!'
            flash(flash_msg, 'success')
            return redirect(url_for('post.view_post', post_id=post.id))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating post {post.id}: {e}", exc_info=True)
            flash(f'Error updating post: {str(e)}', 'danger')
    elif request.method == 'POST':
        current_app.logger.warning(f"Edit post form validation failed for post {post_id}. Errors: {form.errors}")
        flash_form_errors_util(form)

    if request.method == 'GET': # Populate tags string on GET
        if not form.tags_string.data and post.tags:
            form.tags_string.data = ', '.join([tag.name for tag in post.tags])
            current_app.logger.debug(f"Populated tags_string for GET: '{form.tags_string.data}'")

    return render_template('edit_post.html', form=form, post=post, delete_form=delete_form)

@post_bp.route('/posts/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id): # Renamed from delete_post_route
    current_app.logger.debug(f"Accessing /posts/{post_id}/delete, User: {current_user.username}")
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id and not current_user.is_admin:
        current_app.logger.warning(f"User {current_user.username} not authorized to delete post {post_id}.")
        abort(403)

    try:
        # Manually delete associated comment flags first
        flags_to_delete = CommentFlag.query.join(Comment).filter(Comment.post_id == post.id).all()
        for flag in flags_to_delete:
            db.session.delete(flag)
        current_app.logger.debug(f"Deleted {len(flags_to_delete)} flags for post {post_id}.")

        # Manually delete associated comments
        all_comments_on_post = Comment.query.filter_by(post_id=post.id).all()
        for comment in all_comments_on_post:
            db.session.delete(comment)
        current_app.logger.debug(f"Deleted {len(all_comments_on_post)} comments for post {post_id}.")

        db.session.delete(post)
        db.session.commit()
        current_app.logger.info(f"Post ID: {post_id} ('{post.title}') successfully deleted by {current_user.username}.")
        flash('Post deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting post ID {post_id}: {e}", exc_info=True)
        flash('Error deleting post. Please try again.', 'danger')
    return redirect(url_for('general.dashboard'))

@post_bp.route('/comment/<int:comment_id>/delete', methods=['POST'])
@login_required
def delete_comment(comment_id): # Renamed
    current_app.logger.debug(f"Accessing /comment/{comment_id}/delete, User: {current_user.username}")
    # Using a specific delete form for CSRF protection on this action
    delete_form = DeleteCommentForm(request.form)
    if delete_form.validate_on_submit(): # Check CSRF
        comment = Comment.query.get_or_404(comment_id)
        post_id = comment.post_id
        current_app.logger.info(f"User {current_user.username} attempting to delete comment ID: {comment_id} from post ID: {post_id}.")

        can_delete = False
        if comment.user_id == current_user.id: can_delete = True
        elif comment.post.user_id == current_user.id: can_delete = True # Post author
        elif current_user.is_admin: can_delete = True

        if not can_delete:
            current_app.logger.warning(f"User {current_user.username} not authorized to delete comment {comment_id}.")
            abort(403)
        try:
            # Manually delete flags associated with this comment first
            CommentFlag.query.filter_by(comment_id=comment.id).delete()
            db.session.delete(comment)
            db.session.commit()
            flash('Comment deleted.', 'success')
            current_app.logger.info(f"Comment ID: {comment_id} successfully deleted by {current_user.username}.")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error deleting comment ID: {comment_id}: {e}", exc_info=True)
            flash('Error deleting comment. Please try again.', 'danger')
        return redirect(url_for('post.view_post', post_id=post_id, _anchor=f"post-comments-area")) # Redirect to general comments area
    else: # CSRF validation failed or other form error (if any were added)
        current_app.logger.warning(f"Delete comment form validation failed for comment ID: {comment_id}. Errors: {delete_form.errors}")
        flash('Failed to delete comment. Invalid request or session expired.', 'danger')
        # Try to redirect back to the post page even if comment_id was bad for some reason
        # This part might need a comment_id that is still valid in the DB to get post_id
        comment_for_redirect = Comment.query.get(comment_id) # Re-fetch, might be None if already deleted by race
        if comment_for_redirect:
            return redirect(url_for('post.view_post', post_id=comment_for_redirect.post_id))
        return redirect(url_for('general.index')) # Fallback

@post_bp.route('/comment/<int:comment_id>/flag', methods=['POST'])
@login_required
def flag_comment(comment_id): # Renamed
    current_app.logger.debug(f"Accessing /comment/{comment_id}/flag, User: {current_user.username}")
    comment = Comment.query.get_or_404(comment_id)
    form = FlagCommentForm(request.form)

    if form.validate_on_submit(): # CSRF check
        existing_flag = CommentFlag.query.filter_by(comment_id=comment_id, flagger_user_id=current_user.id, is_resolved=False).first()
        if existing_flag:
            current_app.logger.info(f"User {current_user.username} already actively flagged comment {comment_id}.")
            flash('You have already flagged this comment.', 'info')
        elif comment.user_id == current_user.id:
            current_app.logger.info(f"User {current_user.username} attempted to flag their own comment {comment_id}.")
            flash("You cannot flag your own comment.", "warning")
        else:
            try:
                new_flag = CommentFlag(comment_id=comment.id, flagger_user_id=current_user.id)
                db.session.add(new_flag)
                db.session.commit()
                current_app.logger.info(f"Comment {comment_id} flagged by user {current_user.username}.")
                flash('Comment flagged for review.', 'success')
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error flagging comment {comment_id}: {e}", exc_info=True)
                flash('Error flagging comment. Please try again.', 'danger')
    else:
        current_app.logger.warning(f"Flag comment form validation failed for comment {comment_id}. Errors: {form.errors}")
        flash_form_errors_util(form) # Will show CSRF error if that was the cause

    return redirect(url_for('post.view_post', post_id=comment.post_id, _anchor=f"comment-{comment.id}"))

@post_bp.route('/category/<string:category_slug>')
def posts_by_category(category_slug): # Renamed
    current_app.logger.debug(f"Accessing /category/{category_slug}")
    category = Category.query.filter_by(slug=category_slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    try:
        # query = Post.query.with_parent(category) # This is for relationship loading, not filtering.
        # For filtering by many-to-many relationship:
        query = Post.query.filter(Post.categories.contains(category), Post.is_published==True)\
                          .order_by(Post.published_at.desc(), Post.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        current_app.logger.debug(f"Found {len(posts)} posts for category '{category.name}' page {page}.")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for category {category_slug}: {e}", exc_info=True)
        flash(f"Error loading posts for category {category.name}.", "danger")
        posts, pagination = [], None
    return render_template('posts_by_category.html', category=category, posts=posts, pagination=pagination)

@post_bp.route('/tag/<string:tag_slug>')
def posts_by_tag(tag_slug): # Renamed
    current_app.logger.debug(f"Accessing /tag/{tag_slug}")
    tag = Tag.query.filter_by(slug=tag_slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    try:
        query = Post.query.filter(Post.tags.contains(tag), Post.is_published==True)\
                          .order_by(Post.published_at.desc(), Post.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        posts = pagination.items
        current_app.logger.debug(f"Found {len(posts)} posts for tag '{tag.name}' page {page}.")
    except Exception as e:
        current_app.logger.error(f"Error fetching posts for tag {tag_slug}: {e}", exc_info=True)
        flash(f"Error loading posts for tag {tag.name}.", "danger")
        posts, pagination = [], None
    return render_template('posts_by_tag.html', tag=tag, posts=posts, pagination=pagination)
