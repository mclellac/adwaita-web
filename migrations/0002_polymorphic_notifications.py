"""
Migration script to add polymorphic fields to the 'notification' table.

Revision ID: 0002
Revises: 0001
Create Date: datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

Steps:
1. Add `target_type` (VARCHAR) and `target_id` (INTEGER) columns to the `notification` table.
"""
from sqlalchemy import create_engine, text, inspect, MetaData, Table
from sqlalchemy.exc import SQLAlchemyError
import os
from datetime import datetime, timezone

# Database URI
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:////app/instance/antisocialnet.db')

def upgrade():
    """Applies the migration."""
    print(f"Applying migration 0002_polymorphic_notifications using DB: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            inspector = inspect(engine)
            metadata = MetaData()

            if not inspector.has_table("notification"):
                print("CRITICAL: Table 'notification' does not exist. Cannot proceed.")
                raise RuntimeError("Table 'notification' not found.")

            notification_table = Table('notification', metadata, autoload_with=engine)

            print("Step 1: Adding 'target_type' and 'target_id' columns to 'notification' table...")
            columns = [c['name'] for c in inspector.get_columns('notification')]
            if 'target_type' not in columns:
                connection.execute(text('ALTER TABLE "notification" ADD COLUMN target_type VARCHAR(50)'))
                print("Column 'target_type' added.")
            else:
                print("Column 'target_type' already exists.")

            if 'target_id' not in columns:
                connection.execute(text('ALTER TABLE "notification" ADD COLUMN target_id INTEGER'))
                print("Column 'target_id' added.")
            else:
                print("Column 'target_id' already exists.")

            transaction.commit()
            print("Migration 0002_polymorphic_notifications applied successfully.")

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
    print(f"Reverting migration 0002_polymorphic_notifications using DB: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            inspector = inspect(engine)

            print("Reverting: Dropping 'target_type' and 'target_id' columns from 'notification' table...")
            if 'target_type' in [c.name for c in inspector.get_columns('notification')]:
                connection.execute(text('ALTER TABLE "notification" DROP COLUMN target_type'))
                print("Column 'target_type' dropped.")
            else:
                print("Column 'target_type' not found.")

            if 'target_id' in [c.name for c in inspector.get_columns('notification')]:
                connection.execute(text('ALTER TABLE "notification" DROP COLUMN target_id'))
                print("Column 'target_id' dropped.")
            else:
                print("Column 'target_id' not found.")

            transaction.commit()
            print("Migration 0002_polymorphic_notifications reverted successfully.")

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
        print("Usage: python 0002_polymorphic_notifications.py <upgrade|downgrade>")
