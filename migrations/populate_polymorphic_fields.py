import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Now we can import from app-demo
from app-demo.models import db, Notification, Activity, Post, Comment, UserPhoto, User  # noqa: E402
from app-demo import create_app  # noqa: E402

def run_migration(app):
    """
    Populates the new target_type and target_id fields in Notification and Activity models.
    """
    with app.app_context():
        Session = sessionmaker(bind=db.engine)
        session = Session()

        try:
            print("Starting migration for Notification table...")
            notifications_updated = 0
            notifications_skipped = 0
            # Process notifications in batches to avoid loading all into memory
            offset = 0
            batch_size = 100
            while True:
                notifications = session.query(Notification).offset(offset).limit(batch_size).all()
                if not notifications:
                    break

                for notification in notifications:
                    updated = False
                    if notification.related_post_id is not None:
                        # Check if this is a photo-related notification based on type
                        # Assuming 'like_photo' and 'comment_photo' are the types used for photo notifications
                        if notification.type in ['photo_like', 'photo_comment', 'new_photo_comment', 'liked_photo']:
                            # This was temporarily using related_post_id for photo_id
                            photo_exists = session.query(UserPhoto).filter_by(id=notification.related_post_id).first()
                            if photo_exists:
                                notification.target_type = 'photo'
                                notification.target_id = notification.related_post_id
                                updated = True
                            else:
                                print(f"  [Notification ID: {notification.id}] Warning: Photo with ID {notification.related_post_id} (from related_post_id) not found. Skipping.")
                        else: # It's a regular post notification
                            post_exists = session.query(Post).filter_by(id=notification.related_post_id).first()
                            if post_exists:
                                notification.target_type = 'post'
                                notification.target_id = notification.related_post_id
                                updated = True
                            else:
                                print(f"  [Notification ID: {notification.id}] Warning: Post with ID {notification.related_post_id} not found. Skipping.")

                    elif notification.related_comment_id is not None:
                        comment_exists = session.query(Comment).filter_by(id=notification.related_comment_id).first()
                        if comment_exists:
                            notification.target_type = 'comment'
                            notification.target_id = notification.related_comment_id
                            updated = True
                        else:
                            print(f"  [Notification ID: {notification.id}] Warning: Comment with ID {notification.related_comment_id} not found. Skipping.")

                    # Add other specific notification types if they relate to other models, e.g., 'new_follower'
                    elif notification.type == 'new_follower' and notification.actor_id is not None:
                        # In 'new_follower', the 'actor_id' is the one who followed.
                        # The notification is FOR the user_id who gained a follower.
                        # The target of this notification could be considered the actor (the new follower).
                        user_exists = session.query(User).filter_by(id=notification.actor_id).first()
                        if user_exists:
                            notification.target_type = 'user'
                            notification.target_id = notification.actor_id # The actor is the target of interest
                            updated = True
                        else:
                             print(f"  [Notification ID: {notification.id}] Warning: User (actor) with ID {notification.actor_id} for 'new_follower' type not found. Skipping.")


                    if updated:
                        notifications_updated += 1
                    else:
                        notifications_skipped +=1
                        # print(f"  [Notification ID: {notification.id}] No related ID found or type not handled, skipping population. Type: {notification.type}")


                offset += batch_size
                print(f"  Processed {offset} notifications so far...")

            print(f"Migration for Notification table complete. {notifications_updated} updated, {notifications_skipped} skipped/already set.")

            print("\nStarting migration for Activity table...")
            activities_updated = 0
            activities_skipped = 0
            offset = 0
            while True:
                activities = session.query(Activity).offset(offset).limit(batch_size).all()
                if not activities:
                    break

                for activity in activities:
                    updated = False
                    if activity.target_post_id is not None:
                        post_exists = session.query(Post).filter_by(id=activity.target_post_id).first()
                        if post_exists:
                            activity.target_type = 'post'
                            activity.target_id = activity.target_post_id
                            updated = True
                        else:
                            print(f"  [Activity ID: {activity.id}] Warning: Post with ID {activity.target_post_id} not found. Skipping.")

                    elif activity.target_comment_id is not None:
                        comment_exists = session.query(Comment).filter_by(id=activity.target_comment_id).first()
                        if comment_exists:
                            activity.target_type = 'comment'
                            activity.target_id = activity.target_comment_id
                            updated = True
                        else:
                            print(f"  [Activity ID: {activity.id}] Warning: Comment with ID {activity.target_comment_id} not found. Skipping.")

                    elif activity.target_user_id is not None:
                        # This could be for 'started_following' or other user-targeted activities
                        user_exists = session.query(User).filter_by(id=activity.target_user_id).first()
                        if user_exists:
                            activity.target_type = 'user'
                            activity.target_id = activity.target_user_id
                            updated = True
                        else:
                            print(f"  [Activity ID: {activity.id}] Warning: User with ID {activity.target_user_id} not found. Skipping.")

                    # Example: if activities for 'liked_photo' or 'commented_on_photo' exist
                    # and they use a specific field like `target_photo_id` (which they don't currently)
                    # This is where you'd handle them.
                    # For now, assuming photo-related activities would also populate target_post_id if it was misused for photos.
                    # The problem description states "Activity model has target_post_id, target_user_id, and target_comment_id",
                    # not explicitly mentioning misuse for photos in Activity, but good to be mindful.
                    # If 'liked_photo' activities set target_post_id to a photo_id, we need a type check.
                    if activity.type in ['liked_photo', 'commented_on_photo'] and activity.target_post_id is not None:
                        # This assumes if type is photo-related, target_post_id might be a photo_id
                        photo_exists = session.query(UserPhoto).filter_by(id=activity.target_post_id).first()
                        if photo_exists:
                            activity.target_type = 'photo' # Correcting if it was a photo
                            activity.target_id = activity.target_post_id
                            updated = True
                        # else: # If no photo found, it might have been a post correctly, handled above.
                            # print(f"  [Activity ID: {activity.id}] Warning: Photo with ID {activity.target_post_id} for '{activity.type}' not found. Skipping or handled as post.")


                    if updated:
                        activities_updated += 1
                    else:
                        activities_skipped +=1
                        # print(f"  [Activity ID: {activity.id}] No target ID found or type not handled, skipping population. Type: {activity.type}")

                offset += batch_size
                print(f"  Processed {offset} activities so far...")

            print(f"Migration for Activity table complete. {activities_updated} updated, {activities_skipped} skipped/already set.")

            session.commit()
            print("\nMigration committed successfully!")

        except SQLAlchemyError as e:
            session.rollback()
            print(f"Error during migration: {e}")
            sys.exit(1)
        finally:
            session.close()

if __name__ == '__main__':
    print("Initializing Flask app for migration script...")
    # Create a Flask app instance using the factory
    # Use a specific config for the script if necessary, e.g., from environment variables
    # For simplicity, using default config or assuming FLASK_CONFIG is set
    flask_app = create_app(os.getenv('FLASK_CONFIG') or 'default')

    # Check if the database URI is available
    if not flask_app.config.get('SQLALCHEMY_DATABASE_URI'):
        print("Error: SQLALCHEMY_DATABASE_URI is not set in the Flask app configuration.")
        sys.exit(1)

    print(f"Using database: {flask_app.config['SQLALCHEMY_DATABASE_URI']}")
    run_migration(flask_app)
    print("Migration script finished.")
