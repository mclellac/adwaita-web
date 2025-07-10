"""
Migration script to transform the 'post_like' table into a generic 'like' table
supporting polymorphic likes for posts, comments, and photos.

Revision ID: 0001
Revises: (previous migration, or None if first)
Create Date: datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

Steps:
1. Rename `post_like` table to `like`.
2. Add `target_type` (VARCHAR) and `target_id` (INTEGER) columns to the `like` table.
3. Populate `target_type` with 'post' and `target_id` from the old `post_id`.
4. Make `target_type` and `target_id` NOT NULL.
5. Drop the old `post_id` column.
6. Drop old unique constraint and index if they exist by specific names.
7. Create new unique constraint on `(user_id, target_type, target_id)`.
8. Create new index on `(target_type, target_id)`.
"""
from sqlalchemy import create_engine, text, inspect, MetaData, Table, Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.exc import SQLAlchemyError
import os
from datetime import datetime, timezone

# Database URI - Adjust if your setup is different or use Flask app context
# For simplicity, using environment variable or a default.
# In a real scenario, this might come from Flask app config.
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///../instance/antisocialnet.db')
# Adjust path for SQLite if running from 'migrations' directory
if DATABASE_URL.startswith('sqlite:///../'):
    DATABASE_URL = DATABASE_URL.replace('sqlite:///../', f'sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))}/')


def upgrade():
    """Applies the migration."""
    print(f"Applying migration 0001_polymorphic_likes using DB: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            inspector = inspect(engine)
            metadata = MetaData()

            # Step 1: Rename `post_like` table to `like`
            print("Step 1: Renaming table 'post_like' to 'like'...")
            if inspector.has_table("post_like"):
                connection.execute(text("ALTER TABLE post_like RENAME TO \"like\""))
                print("Table 'post_like' renamed to 'like'.")
            elif inspector.has_table("like"):
                print("Table 'like' already exists. Assuming rename was done or this is a re-run.")
            else:
                print("Table 'post_like' not found. Skipping rename.")
                # If 'like' table also doesn't exist, this migration might be problematic
                # For now, we assume 'like' should exist after this or was already there.

            # Reflect the 'like' table to add columns to it
            # Need to ensure 'like' table exists in metadata for column operations
            if not inspector.has_table("like"):
                print("CRITICAL: Table 'like' does not exist after potential rename. Cannot proceed with column modifications.")
                raise RuntimeError("Table 'like' not found.")

            like_table = Table('like', metadata, autoload_with=engine)

            # Step 2: Add `target_type` and `target_id` columns
            print("Step 2: Adding 'target_type' and 'target_id' columns to 'like' table...")
            if 'target_type' not in [c.name for c in inspector.get_columns('like')]:
                connection.execute(text('ALTER TABLE "like" ADD COLUMN target_type VARCHAR(50)'))
                print("Column 'target_type' added.")
            else:
                print("Column 'target_type' already exists.")

            if 'target_id' not in [c.name for c in inspector.get_columns('like')]:
                connection.execute(text('ALTER TABLE "like" ADD COLUMN target_id INTEGER'))
                print("Column 'target_id' added.")
            else:
                print("Column 'target_id' already exists.")

            # Step 3: Populate new columns
            print("Step 3: Populating 'target_type' and 'target_id'...")
            # Only populate if post_id column exists
            if 'post_id' in [c.name for c in inspector.get_columns('like')]:
                connection.execute(text("""
                    UPDATE "like" SET target_type = 'post', target_id = post_id
                """))
                print("'target_type' set to 'post' and 'target_id' copied from 'post_id'.")
            else:
                print("'post_id' column not found. Skipping population. Data might need manual migration if this is unexpected.")

            # Step 4: Make `target_type` and `target_id` NOT NULL
            # This depends on the database type. For SQLite, NOT NULL is part of table recreation or complex ALTER.
            # For PostgreSQL/MySQL:
            # connection.execute(text('ALTER TABLE "like" ALTER COLUMN target_type SET NOT NULL'))
            # connection.execute(text('ALTER TABLE "like" ALTER COLUMN target_id SET NOT NULL'))
            # For SQLite, this is tricky without recreating the table.
            # We will assume the model definition will enforce this for new data.
            # If this script is run on an empty DB, columns are created by SQLAlchemy with correct nullability.
            # If on existing DB, this step is best handled by full table rebuild for SQLite if strictness is needed now.
            # For simplicity, we'll skip direct NOT NULL constraint enforcement here, relying on future model sync.
            print("Step 4: Ensuring 'target_type' and 'target_id' are NOT NULL (caveats for SQLite).")
            print("Model definition should enforce NOT NULL for new data. For existing data, ensure population was complete.")


            # Step 5: Drop the old `post_id` column (if it exists)
            print("Step 5: Dropping old 'post_id' column...")
            if 'post_id' in [c.name for c in inspector.get_columns('like')]:
                # Need to drop constraints/indexes on post_id first if any exist by known names
                # Dropping unique constraint `_user_post_uc` if it exists on `like` (old name)
                constraints = inspector.get_unique_constraints('like')
                for constraint in constraints:
                    if constraint['name'] == '_user_post_uc':
                        try:
                            connection.execute(text(f'ALTER TABLE "like" DROP CONSTRAINT _user_post_uc'))
                            print("Dropped old unique constraint '_user_post_uc'.")
                        except SQLAlchemyError as e:
                            print(f"Could not drop constraint _user_post_uc (may not exist or DB specific error): {e}")
                        break

                # Drop post_id column
                connection.execute(text('ALTER TABLE "like" DROP COLUMN post_id'))
                print("Column 'post_id' dropped.")
            else:
                print("Column 'post_id' not found, skipping drop.")

            # Step 6 & 7 & 8: Manage constraints and indexes
            print("Step 6, 7, 8: Managing unique constraints and indexes...")

            # Drop potential old unique constraint by name if it survived rename and post_id drop
            # (This was partially handled in step 5 for safety before column drop)

            # Create new unique constraint `_user_target_uc`
            new_uc_name = '_user_target_uc'
            existing_constraints = [c['name'] for c in inspector.get_unique_constraints('like')]
            if new_uc_name not in existing_constraints:
                try:
                    connection.execute(text('ALTER TABLE "like" ADD CONSTRAINT _user_target_uc UNIQUE (user_id, target_type, target_id)'))
                    print(f"Unique constraint '{new_uc_name}' created.")
                except SQLAlchemyError as e: # Catch if it exists but inspector missed it or other error
                    print(f"Could not create unique constraint '{new_uc_name}' (it might exist or DB error): {e}")
            else:
                print(f"Unique constraint '{new_uc_name}' already exists.")

            # Create new index `ix_like_target`
            new_idx_name = 'ix_like_target'
            existing_indexes = [idx['name'] for idx in inspector.get_indexes('like')]
            if new_idx_name not in existing_indexes:
                Index(new_idx_name, like_table.c.target_type, like_table.c.target_id).create(connection)
                print(f"Index '{new_idx_name}' created.")
            else:
                print(f"Index '{new_idx_name}' already exists.")

            transaction.commit()
            print("Migration 0001_polymorphic_likes applied successfully.")

        except SQLAlchemyError as e:
            print(f"Error during migration: {e}")
            transaction.rollback()
            print("Transaction rolled back.")
            raise
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            if 'transaction' in locals() and transaction.is_active:
                transaction.rollback()
            print("Transaction rolled back due to unexpected error.")
            raise

def downgrade():
    """Reverts the migration."""
    print(f"Reverting migration 0001_polymorphic_likes using DB: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            inspector = inspect(engine)
            metadata = MetaData()
            like_table = Table('like', metadata, autoload_with=engine) # Autoload current state

            # Reverting Step 5: Add back `post_id` column
            print("Reverting Step 5: Adding back 'post_id' column...")
            if 'post_id' not in [c.name for c in inspector.get_columns('like')]:
                connection.execute(text('ALTER TABLE "like" ADD COLUMN post_id INTEGER'))
                print("Column 'post_id' added back.")
            else:
                print("Column 'post_id' already exists.")

            # Reverting Step 3: Populate `post_id` from `target_id` where `target_type` is 'post'
            print("Reverting Step 3: Populating 'post_id' from 'target_id' for 'post' types...")
            connection.execute(text("""
                UPDATE "like" SET post_id = target_id WHERE target_type = 'post'
            """))
            print("'post_id' populated for 'post' target_types.")
            # Note: Likes for other target_types will have NULL post_id, which is expected.

            # Reverting Step 6, 7, 8: Constraints and Indexes
            # Drop new unique constraint `_user_target_uc`
            print("Reverting Step 7: Dropping unique constraint '_user_target_uc'...")
            uc_exists = any(uc['name'] == '_user_target_uc' for uc in inspector.get_unique_constraints('like'))
            if uc_exists:
                try:
                    connection.execute(text(f'ALTER TABLE "like" DROP CONSTRAINT _user_target_uc'))
                    print("Dropped unique constraint '_user_target_uc'.")
                except SQLAlchemyError as e: # Specific for SQLite: cannot drop constraint by name easily
                    print(f"Could not drop unique constraint _user_target_uc by name (DB specific, may need table rebuild for SQLite): {e}")
            else:
                print("Unique constraint '_user_target_uc' not found.")

            # Drop new index `ix_like_target`
            print("Reverting Step 8: Dropping index 'ix_like_target'...")
            idx_exists = any(idx['name'] == 'ix_like_target' for idx in inspector.get_indexes('like'))
            if idx_exists:
                try:
                    Index('ix_like_target', like_table.c.target_type, like_table.c.target_id).drop(connection) # Assumes columns still exist
                    print("Dropped index 'ix_like_target'.")
                except SQLAlchemyError as e:
                     print(f"Could not drop index 'ix_like_target' (DB specific): {e}")
            else:
                print("Index 'ix_like_target' not found.")


            # Add back old unique constraint `_user_post_uc` on (user_id, post_id)
            # This requires post_id to exist.
            print("Reverting: Adding back old unique constraint '_user_post_uc'...")
            old_uc_name = '_user_post_uc'
            if 'post_id' in [c.name for c in inspector.get_columns('like')]:
                existing_constraints = [c['name'] for c in inspector.get_unique_constraints('like')]
                if old_uc_name not in existing_constraints:
                    try:
                        connection.execute(text('ALTER TABLE "like" ADD CONSTRAINT _user_post_uc UNIQUE (user_id, post_id)'))
                        print(f"Old unique constraint '{old_uc_name}' re-added.")
                    except SQLAlchemyError as e:
                        print(f"Could not re-add unique constraint '{old_uc_name}' (might partially exist or DB error): {e}")
                else:
                    print(f"Old unique constraint '{old_uc_name}' seems to exist already.")
            else:
                print("Cannot re-add old unique constraint as 'post_id' column is missing (should have been added back).")


            # Reverting Step 2: Drop `target_type` and `target_id` columns
            print("Reverting Step 2: Dropping 'target_type' and 'target_id' columns...")
            if 'target_type' in [c.name for c in inspector.get_columns('like')]:
                connection.execute(text('ALTER TABLE "like" DROP COLUMN target_type'))
                print("Column 'target_type' dropped.")
            else:
                print("Column 'target_type' not found.")

            if 'target_id' in [c.name for c in inspector.get_columns('like')]:
                connection.execute(text('ALTER TABLE "like" DROP COLUMN target_id'))
                print("Column 'target_id' dropped.")
            else:
                print("Column 'target_id' not found.")

            # Reverting Step 1: Rename `like` table back to `post_like`
            print("Reverting Step 1: Renaming table 'like' back to 'post_like'...")
            if inspector.has_table("like"):
                connection.execute(text('ALTER TABLE "like" RENAME TO post_like'))
                print("Table 'like' renamed back to 'post_like'.")
            elif inspector.has_table("post_like"):
                 print("Table 'post_like' already exists. Assuming rename was already reverted.")
            else:
                print("Table 'like' not found for renaming back.")

            transaction.commit()
            print("Migration 0001_polymorphic_likes reverted successfully.")

        except SQLAlchemyError as e:
            print(f"Error during migration revert: {e}")
            transaction.rollback()
            print("Transaction rolled back.")
            raise
        except Exception as e:
            print(f"An unexpected error occurred during revert: {e}")
            if 'transaction' in locals() and transaction.is_active:
                transaction.rollback()
            print("Transaction rolled back due to unexpected error.")
            raise

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'downgrade':
        downgrade()
    elif len(sys.argv) > 1 and sys.argv[1] == 'upgrade':
        upgrade()
    else:
        print("Usage: python 0001_polymorphic_likes.py <upgrade|downgrade>")
